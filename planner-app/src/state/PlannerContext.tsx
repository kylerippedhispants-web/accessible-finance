import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '../auth/AuthContext';
import type { FinancialPlan, PlanScenario } from '../domain';
import {
  createBlankPlan,
  createDemoSnapshot,
  type PlannerSnapshot,
} from '../data/demoPlan';
import {
  CloudRepositoryError,
  loadPlannerSnapshot,
  savePlannerSnapshot,
} from '../data/supabaseRepository';
import { formatValidationError, plannerSnapshotSchema } from '../validation/planSchemas';

export type PlannerMode = 'demo' | 'cloud';
export type SaveState = 'idle' | 'saving' | 'saved' | 'offline' | 'conflict' | 'error';

interface PlannerContextValue {
  mode: PlannerMode | null;
  snapshot: PlannerSnapshot | null;
  loading: boolean;
  loadError?: string;
  onboardingRequired: boolean;
  dirty: boolean;
  offline: boolean;
  saveState: SaveState;
  saveMessage?: string;
  startDemo: () => void;
  exitDemo: () => void;
  updatePlan: (updater: (plan: FinancialPlan) => FinancialPlan) => void;
  replaceSnapshot: (snapshot: PlannerSnapshot) => void;
  setScenarios: (scenarios: PlanScenario[]) => void;
  save: (snapshot?: PlannerSnapshot) => Promise<boolean>;
  completeOnboarding: (plan: FinancialPlan) => Promise<boolean>;
  retryCloudLoad: () => void;
  discardAndReloadCloud: () => void;
}

interface SuspendedCloudDraft {
  userId: string;
  snapshot: PlannerSnapshot;
  lastSaved: PlannerSnapshot | null;
  revision: number | null;
  onboardingRequired: boolean;
}

const PlannerContext = createContext<PlannerContextValue | null>(null);
const DEMO_STORAGE_KEY = 'accessibleFinancePlannerDemoV1';

function readDemoSnapshot(): PlannerSnapshot | null {
  try {
    const raw = sessionStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = plannerSnapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function writeDemoSnapshot(snapshot: PlannerSnapshot): boolean {
  try {
    sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

function removeDemoSnapshot(): void {
  try {
    sessionStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    // Demo mode still works in memory when browser storage is unavailable.
  }
}

function userFirstName(metadata: unknown): string {
  if (!metadata || typeof metadata !== 'object') return '';
  const value = (metadata as Record<string, unknown>).first_name;
  return typeof value === 'string' ? value.slice(0, 80) : '';
}

function cloudLoadMessage(error: unknown): string {
  if (!(error instanceof CloudRepositoryError)) {
    return 'Your cloud plan could not be safely loaded. No data was changed. Try again or sign out.';
  }
  switch (error.code) {
    case 'offline':
      return 'You appear to be offline. Reconnect, then try loading your cloud plan again.';
    case 'session_expired':
      return 'Your secure session expired. Sign in again to load your cloud plan.';
    case 'invalid_data':
      return 'Your cloud plan contains data this version cannot safely open. No data was changed.';
    case 'not_configured':
      return 'Cloud saving is not configured for this deployment. You can still use Demo Mode.';
    default:
      return 'Your cloud plan could not be safely loaded. No data was changed. Try again or sign out.';
  }
}

function cloudSaveMessage(error: unknown): { state: SaveState; message: string } {
  if (!(error instanceof CloudRepositoryError)) {
    return {
      state: 'error',
      message: 'We could not save your latest changes. They are still open on this page.',
    };
  }
  switch (error.code) {
    case 'offline':
      return {
        state: 'offline',
        message: 'You are offline. Your changes remain open; reconnect and choose Save changes.',
      };
    case 'conflict':
      return {
        state: 'conflict',
        message: 'This plan changed in another session. Export this draft if needed, then reload the cloud copy.',
      };
    case 'session_expired':
      return {
        state: 'error',
        message: 'Your secure session expired. Your changes remain open; sign in again before saving.',
      };
    case 'capacity':
      return {
        state: 'error',
        message: 'This plan is too large to save safely. Remove some entries or scenarios, then try again.',
      };
    case 'invalid_data':
      return {
        state: 'error',
        message: 'The plan contains a value that cloud storage cannot safely accept. Review the highlighted fields.',
      };
    case 'not_configured':
      return {
        state: 'error',
        message: 'Cloud saving is not configured for this deployment. Your changes remain open.',
      };
    default:
      return {
        state: 'error',
        message: 'We could not save your latest changes. They are still open on this page. Try again shortly.',
      };
  }
}

export function PlannerProvider({ children }: PropsWithChildren) {
  const auth = useAuth();
  const initialDemo = useMemo(() => readDemoSnapshot(), []);
  const [manualMode, setManualMode] = useState<PlannerMode | null>(initialDemo ? 'demo' : null);
  const [snapshot, setSnapshot] = useState<PlannerSnapshot | null>(initialDemo);
  const [loading, setLoading] = useState(false);
  const [activeCloudUserId, setActiveCloudUserId] = useState<string>();
  const [loadError, setLoadError] = useState<string>();
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [onboardingRequired, setOnboardingRequired] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveMessage, setSaveMessage] = useState<string>();
  const manualModeRef = useRef<PlannerMode | null>(initialDemo ? 'demo' : null);
  const onboardingRequiredRef = useRef(false);
  const snapshotRef = useRef<PlannerSnapshot | null>(initialDemo);
  const lastSavedRef = useRef<PlannerSnapshot | null>(initialDemo);
  const dirtyRef = useRef(false);
  const revisionRef = useRef<number | null>(null);
  const editSequenceRef = useRef(0);
  const loadGenerationRef = useRef(0);
  const activeCloudUserRef = useRef<string | undefined>(undefined);
  const inFlightSaveRef = useRef<Promise<boolean> | null>(null);
  const conflictBlockedRef = useRef(false);
  const suspendedDraftRef = useRef<SuspendedCloudDraft | undefined>(undefined);

  const userId = auth.user?.id;
  const firstName = userFirstName(auth.user?.user_metadata);
  const mode: PlannerMode | null = userId ? 'cloud' : manualMode;
  const effectiveLoading = loading || Boolean(userId && activeCloudUserId !== userId);

  const installSnapshot = useCallback((next: PlannerSnapshot | null) => {
    snapshotRef.current = next;
    setSnapshot(next);
  }, []);

  const installDirty = useCallback((next: boolean) => {
    dirtyRef.current = next;
    setDirty(next);
  }, []);

  const installOnboardingRequired = useCallback((next: boolean) => {
    onboardingRequiredRef.current = next;
    setOnboardingRequired(next);
  }, []);

  useEffect(() => {
    const handleOffline = () => {
      setOffline(true);
      if (activeCloudUserRef.current && dirtyRef.current) {
        setSaveState('offline');
        setSaveMessage('You are offline. Your changes remain open; reconnect and choose Save changes.');
      }
    };
    const handleOnline = () => {
      setOffline(false);
      setSaveState((current) => current === 'offline' ? 'idle' : current);
      setSaveMessage((current) => current?.startsWith('You are offline.')
        ? 'Back online. Choose Save changes when you are ready.'
        : current);
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    if (!auth.ready) return undefined;

    const generation = loadGenerationRef.current + loadAttempt + 1;
    loadGenerationRef.current = generation;
    let cancelled = false;
    const nextUserId = userId;

    if (!nextUserId) {
      const previousUserId = activeCloudUserRef.current;
      if (previousUserId && snapshotRef.current && dirtyRef.current) {
        suspendedDraftRef.current = {
          userId: previousUserId,
          snapshot: snapshotRef.current,
          lastSaved: lastSavedRef.current,
          revision: revisionRef.current,
          onboardingRequired: onboardingRequiredRef.current,
        };
      }
      activeCloudUserRef.current = undefined;
      setActiveCloudUserId(undefined);
      revisionRef.current = null;
      conflictBlockedRef.current = false;
      setLoading(false);
      setLoadError(undefined);
      if (manualModeRef.current !== 'demo') {
        installSnapshot(null);
        lastSavedRef.current = null;
        installDirty(false);
        installOnboardingRequired(false);
        setSaveState('idle');
        setSaveMessage(undefined);
      }
      return undefined;
    }

    const previousUserId = activeCloudUserRef.current;
    if (previousUserId && previousUserId !== nextUserId && snapshotRef.current && dirtyRef.current) {
      suspendedDraftRef.current = {
        userId: previousUserId,
        snapshot: snapshotRef.current,
        lastSaved: lastSavedRef.current,
        revision: revisionRef.current,
        onboardingRequired: onboardingRequiredRef.current,
      };
    }

    activeCloudUserRef.current = nextUserId;
    setActiveCloudUserId(nextUserId);
    removeDemoSnapshot();
    manualModeRef.current = null;
    setManualMode(null);
    installSnapshot(null);
    lastSavedRef.current = null;
    revisionRef.current = null;
    conflictBlockedRef.current = false;
    installDirty(false);
    setLoading(true);
    setLoadError(undefined);
    setSaveState('idle');
    setSaveMessage(undefined);

    void (async () => {
      try {
        const loaded = await loadPlannerSnapshot();
        if (cancelled || loadGenerationRef.current !== generation || activeCloudUserRef.current !== nextUserId) return;

        const validated = loaded
          ? plannerSnapshotSchema.safeParse(loaded.snapshot)
          : undefined;
        if (validated && !validated.success) {
          throw new Error('Cloud plan failed client validation.');
        }

        const suspended = suspendedDraftRef.current?.userId === nextUserId
          ? suspendedDraftRef.current
          : undefined;
        const loadedRevision = loaded?.revision ?? null;

        if (suspended) {
          suspendedDraftRef.current = undefined;
          installSnapshot(suspended.snapshot);
          lastSavedRef.current = validated?.success ? validated.data : suspended.lastSaved;
          revisionRef.current = loadedRevision;
          installOnboardingRequired(suspended.onboardingRequired);
          installDirty(true);
          if (suspended.revision === loadedRevision) {
            setSaveState('idle');
            setSaveMessage('Your unsaved draft was restored. Choose Save changes when you are ready.');
          } else {
            conflictBlockedRef.current = true;
            setSaveState('conflict');
            setSaveMessage('The cloud plan changed while this draft was open. Export the draft if needed, then reload the cloud copy.');
          }
          return;
        }

        if (validated?.success && loaded) {
          installSnapshot(validated.data);
          lastSavedRef.current = validated.data;
          revisionRef.current = loaded.revision;
          installOnboardingRequired(false);
        } else {
          const next: PlannerSnapshot = {
            plan: createBlankPlan({ firstName }),
            scenarios: [],
          };
          installSnapshot(next);
          lastSavedRef.current = null;
          revisionRef.current = null;
          installOnboardingRequired(true);
        }
        editSequenceRef.current = 0;
        installDirty(false);
        setSaveState('idle');
      } catch (error) {
        if (cancelled || loadGenerationRef.current !== generation || activeCloudUserRef.current !== nextUserId) return;
        installSnapshot(null);
        lastSavedRef.current = null;
        revisionRef.current = null;
        installDirty(false);
        setLoadError(cloudLoadMessage(error));
        setSaveState(error instanceof CloudRepositoryError && error.code === 'offline' ? 'offline' : 'error');
        setSaveMessage(cloudLoadMessage(error));
      } finally {
        if (!cancelled && loadGenerationRef.current === generation && activeCloudUserRef.current === nextUserId) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    auth.ready,
    firstName,
    installDirty,
    installOnboardingRequired,
    installSnapshot,
    loadAttempt,
    userId,
  ]);

  useEffect(() => {
    const warnIfDirty = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warnIfDirty);
    return () => window.removeEventListener('beforeunload', warnIfDirty);
  }, []);

  const startDemo = useCallback(() => {
    const next = readDemoSnapshot() ?? createDemoSnapshot();
    const stored = writeDemoSnapshot(next);
    lastSavedRef.current = stored ? next : null;
    revisionRef.current = null;
    editSequenceRef.current = 0;
    conflictBlockedRef.current = false;
    installSnapshot(next);
    manualModeRef.current = 'demo';
    setManualMode('demo');
    installOnboardingRequired(false);
    installDirty(false);
    setSaveState(stored ? 'saved' : 'error');
    setSaveMessage(stored
      ? 'Fictional demo data is saved for this browser session only.'
      : 'Browser storage is unavailable. Demo changes will remain in memory only until you close this page.');
  }, [installDirty, installOnboardingRequired, installSnapshot]);

  const exitDemo = useCallback(() => {
    removeDemoSnapshot();
    lastSavedRef.current = null;
    revisionRef.current = null;
    editSequenceRef.current = 0;
    conflictBlockedRef.current = false;
    installSnapshot(null);
    manualModeRef.current = null;
    setManualMode(null);
    installDirty(false);
    setSaveState('idle');
    setSaveMessage(undefined);
  }, [installDirty, installSnapshot]);

  const markEdited = useCallback(() => {
    editSequenceRef.current += 1;
    installDirty(true);
    if (!conflictBlockedRef.current) {
      setSaveState('idle');
      setSaveMessage(undefined);
    }
  }, [installDirty]);

  const replaceSnapshot = useCallback((next: PlannerSnapshot) => {
    installSnapshot(next);
    markEdited();
  }, [installSnapshot, markEdited]);

  const updatePlan = useCallback((updater: (plan: FinancialPlan) => FinancialPlan) => {
    const current = snapshotRef.current;
    if (!current) return;
    installSnapshot({ ...current, plan: updater(current.plan) });
    markEdited();
  }, [installSnapshot, markEdited]);

  const setScenarios = useCallback((scenarios: PlanScenario[]) => {
    const current = snapshotRef.current;
    if (!current) return;
    installSnapshot({ ...current, scenarios });
    markEdited();
  }, [installSnapshot, markEdited]);

  const save = useCallback((provided?: PlannerSnapshot): Promise<boolean> => {
    if (inFlightSaveRef.current) return inFlightSaveRef.current;

    const next = provided ?? snapshotRef.current;
    const currentMode = userId ? 'cloud' : manualMode;
    const currentUserId = userId;
    if (!next || !currentMode) return Promise.resolve(false);

    if (currentMode === 'cloud' && conflictBlockedRef.current) {
      setSaveState('conflict');
      setSaveMessage('Export this draft if needed, then reload the cloud copy before making another save.');
      return Promise.resolve(false);
    }

    const validated = plannerSnapshotSchema.safeParse(next);
    if (!validated.success) {
      setSaveState('error');
      setSaveMessage(formatValidationError(validated.error));
      return Promise.resolve(false);
    }

    if (currentMode === 'cloud' && (offline || (typeof navigator !== 'undefined' && !navigator.onLine))) {
      setSaveState('offline');
      setSaveMessage('You are offline. Your changes remain open; reconnect and choose Save changes.');
      return Promise.resolve(false);
    }

    const generation = loadGenerationRef.current;
    const editSequence = editSequenceRef.current;
    const expectedRevision = revisionRef.current;
    setSaveState('saving');
    setSaveMessage(currentMode === 'demo'
      ? 'Saving in this browser session…'
      : 'Saving securely to your cloud plan…');

    const operation = (async (): Promise<boolean> => {
      try {
        let savedRevision = expectedRevision;
        if (currentMode === 'demo') {
          if (!writeDemoSnapshot(validated.data)) {
            setSaveState('error');
            setSaveMessage('Browser storage is unavailable. Your demo changes remain in memory on this page only.');
            return false;
          }
        } else {
          const saved = await savePlannerSnapshot(validated.data, expectedRevision);
          savedRevision = saved.revision;
        }

        const stillCurrent = loadGenerationRef.current === generation
          && activeCloudUserRef.current === currentUserId
          && (currentMode === 'cloud' ? Boolean(currentUserId) : !activeCloudUserRef.current);
        if (!stillCurrent) return false;

        revisionRef.current = savedRevision;
        lastSavedRef.current = validated.data;
        if (editSequenceRef.current === editSequence) {
          installDirty(false);
          setSaveState('saved');
          setSaveMessage(currentMode === 'demo'
            ? 'Saved for this browser session. Nothing was uploaded.'
            : 'Cloud plan saved.');
        } else {
          installDirty(true);
          setSaveState('idle');
          setSaveMessage('Earlier changes were saved. Newer edits are still waiting to be saved.');
        }
        return true;
      } catch (error) {
        const stillCurrent = loadGenerationRef.current === generation
          && activeCloudUserRef.current === currentUserId;
        if (!stillCurrent) return false;
        const failure = cloudSaveMessage(error);
        if (failure.state === 'conflict') conflictBlockedRef.current = true;
        if (failure.state === 'offline') setOffline(true);
        installDirty(true);
        setSaveState(failure.state);
        setSaveMessage(failure.message);
        return false;
      }
    })();

    inFlightSaveRef.current = operation;
    void operation.finally(() => {
      if (inFlightSaveRef.current === operation) inFlightSaveRef.current = null;
    });
    return operation;
  }, [installDirty, manualMode, offline, userId]);

  const completeOnboarding = useCallback(async (plan: FinancialPlan): Promise<boolean> => {
    const next = { plan, scenarios: [] };
    installSnapshot(next);
    markEdited();
    const saved = await save(next);
    if (saved && !dirtyRef.current) installOnboardingRequired(false);
    return saved;
  }, [installOnboardingRequired, installSnapshot, markEdited, save]);

  const retryCloudLoad = useCallback(() => {
    setLoadError(undefined);
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  const discardAndReloadCloud = useCallback(() => {
    if (!userId) return;
    suspendedDraftRef.current = undefined;
    conflictBlockedRef.current = false;
    revisionRef.current = null;
    lastSavedRef.current = null;
    editSequenceRef.current = 0;
    installSnapshot(null);
    installDirty(false);
    setLoadError(undefined);
    setSaveState('idle');
    setSaveMessage(undefined);
    setLoadAttempt((attempt) => attempt + 1);
  }, [installDirty, installSnapshot, userId]);

  const value = useMemo<PlannerContextValue>(() => ({
    mode,
    snapshot,
    loading: effectiveLoading,
    loadError,
    onboardingRequired,
    dirty,
    offline,
    saveState,
    saveMessage,
    startDemo,
    exitDemo,
    updatePlan,
    replaceSnapshot,
    setScenarios,
    save,
    completeOnboarding,
    retryCloudLoad,
    discardAndReloadCloud,
  }), [
    completeOnboarding,
    dirty,
    discardAndReloadCloud,
    exitDemo,
    effectiveLoading,
    loadError,
    mode,
    offline,
    onboardingRequired,
    replaceSnapshot,
    retryCloudLoad,
    save,
    saveMessage,
    saveState,
    setScenarios,
    snapshot,
    startDemo,
    updatePlan,
  ]);

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner(): PlannerContextValue {
  const value = useContext(PlannerContext);
  if (!value) throw new Error('usePlanner must be used inside PlannerProvider.');
  return value;
}
