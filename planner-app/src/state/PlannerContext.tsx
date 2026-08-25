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
import { loadPlannerSnapshot, savePlannerSnapshot } from '../data/supabaseRepository';
import { formatValidationError, plannerSnapshotSchema } from '../validation/planSchemas';

export type PlannerMode = 'demo' | 'cloud';
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface PlannerContextValue {
  mode: PlannerMode | null;
  snapshot: PlannerSnapshot | null;
  loading: boolean;
  loadError?: string;
  onboardingRequired: boolean;
  dirty: boolean;
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

function userFirstName(metadata: unknown): string {
  if (!metadata || typeof metadata !== 'object') return '';
  const value = (metadata as Record<string, unknown>).first_name;
  return typeof value === 'string' ? value.slice(0, 80) : '';
}

export function PlannerProvider({ children }: PropsWithChildren) {
  const auth = useAuth();
  const [manualMode, setManualMode] = useState<PlannerMode | null>(() => readDemoSnapshot() ? 'demo' : null);
  const [snapshot, setSnapshot] = useState<PlannerSnapshot | null>(() => readDemoSnapshot());
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [onboardingRequired, setOnboardingRequired] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveMessage, setSaveMessage] = useState<string>();
  const lastSaved = useRef<PlannerSnapshot | null>(snapshot);
  const activeCloudUser = useRef<string | undefined>(undefined);

  const mode: PlannerMode | null = auth.user ? 'cloud' : manualMode;
  const effectiveLoading = loading || Boolean(
    auth.user && activeCloudUser.current !== auth.user.id,
  );

  useEffect(() => {
    const user = auth.user;
    if (!auth.ready || !user) {
      activeCloudUser.current = undefined;
      return;
    }
    if (activeCloudUser.current === user.id) return;
    activeCloudUser.current = user.id;
    sessionStorage.removeItem(DEMO_STORAGE_KEY);
    setManualMode(null);
    setSnapshot(null);
    lastSaved.current = null;
    setLoading(true);
    setLoadError(undefined);
    setSaveMessage(undefined);

    void loadPlannerSnapshot().then((loaded) => {
      if (activeCloudUser.current !== user.id) return;
      if (loaded) {
        const validated = plannerSnapshotSchema.safeParse(loaded);
        if (!validated.success) {
          throw new Error('Cloud plan failed client validation.');
        }
        setSnapshot(validated.data);
        lastSaved.current = validated.data;
        setOnboardingRequired(false);
      } else {
        const next: PlannerSnapshot = {
          plan: createBlankPlan({ firstName: userFirstName(user.user_metadata) }),
          scenarios: [],
        };
        setSnapshot(next);
        lastSaved.current = null;
        setOnboardingRequired(true);
      }
      setDirty(false);
      setSaveState('idle');
    }).catch(() => {
      if (activeCloudUser.current !== user.id) return;
      setSnapshot(null);
      setLoadError('Your cloud plan could not be safely loaded. No data was changed. Try again or sign out.');
      setSaveState('error');
      setSaveMessage('Your cloud plan could not be loaded. Check the connection and try again.');
    }).finally(() => {
      if (activeCloudUser.current === user.id) setLoading(false);
    });
  }, [auth.ready, auth.user, loadAttempt]);

  useEffect(() => {
    if (auth.user || manualMode === 'demo') return;
    setSnapshot(null);
    lastSaved.current = null;
    setDirty(false);
    setOnboardingRequired(false);
  }, [auth.user, manualMode]);

  useEffect(() => {
    const warnIfDirty = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warnIfDirty);
    return () => window.removeEventListener('beforeunload', warnIfDirty);
  }, [dirty]);

  const startDemo = useCallback(() => {
    const next = readDemoSnapshot() ?? createDemoSnapshot();
    sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
    lastSaved.current = next;
    setSnapshot(next);
    setManualMode('demo');
    setOnboardingRequired(false);
    setDirty(false);
    setSaveState('saved');
    setSaveMessage('Fictional demo data is saved for this browser session only.');
  }, []);

  const exitDemo = useCallback(() => {
    sessionStorage.removeItem(DEMO_STORAGE_KEY);
    lastSaved.current = null;
    setSnapshot(null);
    setManualMode(null);
    setDirty(false);
    setSaveState('idle');
    setSaveMessage(undefined);
  }, []);

  const replaceSnapshot = useCallback((next: PlannerSnapshot) => {
    setSnapshot(next);
    setDirty(true);
    setSaveState('idle');
    setSaveMessage(undefined);
  }, []);

  const updatePlan = useCallback((updater: (plan: FinancialPlan) => FinancialPlan) => {
    setSnapshot((current) => current ? { ...current, plan: updater(current.plan) } : current);
    setDirty(true);
    setSaveState('idle');
    setSaveMessage(undefined);
  }, []);

  const setScenarios = useCallback((scenarios: PlanScenario[]) => {
    setSnapshot((current) => current ? { ...current, scenarios } : current);
    setDirty(true);
    setSaveState('idle');
    setSaveMessage(undefined);
  }, []);

  const save = useCallback(async (provided?: PlannerSnapshot): Promise<boolean> => {
    const next = provided ?? snapshot;
    if (!next || !mode) return false;
    const validated = plannerSnapshotSchema.safeParse(next);
    if (!validated.success) {
      setSaveState('error');
      setSaveMessage(formatValidationError(validated.error));
      return false;
    }

    setSaveState('saving');
    setSaveMessage(mode === 'demo' ? 'Saving in this session…' : 'Saving encrypted in transit to Supabase…');
    try {
      if (mode === 'demo') {
        sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(validated.data));
      } else {
        await savePlannerSnapshot(validated.data, lastSaved.current);
      }
      lastSaved.current = validated.data;
      setSnapshot(validated.data);
      setDirty(false);
      setSaveState('saved');
      setSaveMessage(mode === 'demo'
        ? 'Saved for this browser session. Nothing was uploaded.'
        : 'Cloud plan saved.');
      return true;
    } catch {
      setSaveState('error');
      setSaveMessage('The plan could not be saved. Your unsaved changes are still on this page.');
      return false;
    }
  }, [mode, snapshot]);

  const completeOnboarding = useCallback(async (plan: FinancialPlan): Promise<boolean> => {
    const next = { plan, scenarios: [] };
    setSnapshot(next);
    const saved = await save(next);
    if (saved) setOnboardingRequired(false);
    return saved;
  }, [save]);

  const retryCloudLoad = useCallback(() => {
    activeCloudUser.current = undefined;
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  const value = useMemo<PlannerContextValue>(() => ({
    mode,
    snapshot,
    loading: effectiveLoading,
    loadError,
    onboardingRequired,
    dirty,
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
  }), [
    completeOnboarding,
    dirty,
    exitDemo,
    effectiveLoading,
    loadError,
    mode,
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
