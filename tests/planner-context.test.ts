// @vitest-environment jsdom

import {
  act,
  createElement,
  createRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDemoSnapshot, type PlannerSnapshot } from '../planner-app/src/data/demoPlan';

const mocks = vi.hoisted(() => ({
  auth: {
    configured: true,
    ready: true,
    session: null,
    user: {
      id: 'user-a',
      user_metadata: { first_name: 'Alex' },
    } as { id: string; user_metadata: { first_name: string } } | null,
  },
  load: vi.fn<() => Promise<unknown>>(),
  save: vi.fn<(snapshot: unknown, revision: number | null) => Promise<{ revision: number }>>(),
  download: vi.fn<(snapshot: PlannerSnapshot, filename?: string) => void>(),
}));

vi.mock('../planner-app/src/auth/AuthContext', () => ({
  useAuth: () => mocks.auth,
}));

vi.mock('../planner-app/src/data/planTransfer', () => ({
  downloadPlanExport: mocks.download,
}));

vi.mock('../planner-app/src/data/supabaseRepository', () => ({
  CloudRepositoryError: class CloudRepositoryError extends Error {
    readonly code: string;
    readonly retryable: boolean;

    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.retryable = code === 'offline' || code === 'unavailable';
    }
  },
  loadPlannerSnapshot: mocks.load,
  savePlannerSnapshot: mocks.save,
}));

import { PlannerProvider, usePlanner } from '../planner-app/src/state/PlannerContext';
import { CloudRepositoryError } from '../planner-app/src/data/supabaseRepository';

type PlannerValue = ReturnType<typeof usePlanner>;
const reactTestGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean };

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let controls: Pick<Deferred<T>, 'resolve' | 'reject'> | undefined;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    controls = { resolve: resolvePromise, reject: rejectPromise };
  });
  if (!controls) throw new Error('Deferred controls were not initialized.');
  return { promise, ...controls };
}

function namedSnapshot(name: string): PlannerSnapshot {
  const snapshot = createDemoSnapshot();
  return { ...snapshot, plan: { ...snapshot.plan, name } };
}

interface ProbeHandle {
  value: PlannerValue;
}

const Probe = forwardRef<ProbeHandle, { version: number }>(function Probe({ version }, ref) {
  void version;
  const value = usePlanner();
  useImperativeHandle(ref, () => ({ value }), [value]);
  return null;
});

describe('PlannerProvider cloud coordination', () => {
  let root: Root;
  let plannerRef: ReturnType<typeof createRef<ProbeHandle>>;
  let renderVersion: number;

  function currentPlanner(): PlannerValue {
    if (!plannerRef.current) throw new Error('Planner probe is not ready.');
    return plannerRef.current.value;
  }

  async function renderProvider() {
    renderVersion += 1;
    await act(async () => {
      root.render(createElement(
        PlannerProvider,
        null,
        createElement(Probe, { ref: plannerRef, version: renderVersion }),
      ));
      await Promise.resolve();
    });
  }

  beforeEach(() => {
    reactTestGlobal.IS_REACT_ACT_ENVIRONMENT = true;
    document.body.innerHTML = '<div id="root"></div>';
    const container = document.querySelector('#root');
    if (!(container instanceof HTMLElement)) throw new Error('Test root is missing.');
    root = createRoot(container);
    plannerRef = createRef<ProbeHandle>();
    renderVersion = 0;
    sessionStorage.clear();
    mocks.load.mockReset();
    mocks.save.mockReset();
    mocks.download.mockReset();
    mocks.auth.ready = true;
    mocks.auth.user = {
      id: 'user-a',
      user_metadata: { first_name: 'Alex' },
    };
  });

  afterEach(() => {
    act(() => root.unmount());
    reactTestGlobal.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it('does not let a completed save overwrite edits made while the request was in flight', async () => {
    mocks.load.mockResolvedValue({ snapshot: namedSnapshot('Loaded plan'), revision: 4 });
    const pendingSave = deferred<{ revision: number }>();
    mocks.save.mockReturnValue(pendingSave.promise);
    await renderProvider();

    act(() => currentPlanner().updatePlan((plan) => ({ ...plan, name: 'First edit' })));
    const firstSave = currentPlanner().save();
    const duplicateSave = currentPlanner().save();
    expect(duplicateSave).toBe(firstSave);
    expect(mocks.save).toHaveBeenCalledTimes(1);

    act(() => currentPlanner().updatePlan((plan) => ({ ...plan, name: 'Newer edit' })));
    await act(async () => {
      pendingSave.resolve({ revision: 5 });
      await firstSave;
    });

    expect(currentPlanner().snapshot?.plan.name).toBe('Newer edit');
    expect(currentPlanner().dirty).toBe(true);
    expect(currentPlanner().saveState).toBe('idle');
    expect(currentPlanner().saveMessage).toContain('Newer edits');
  });

  it('ignores a stale load when the authenticated account changes', async () => {
    const userALoad = deferred<{ snapshot: PlannerSnapshot; revision: number } | null>();
    mocks.load
      .mockReturnValueOnce(userALoad.promise)
      .mockResolvedValueOnce({ snapshot: namedSnapshot('User B plan'), revision: 9 });
    await renderProvider();

    mocks.auth.user = {
      id: 'user-b',
      user_metadata: { first_name: 'Blair' },
    };
    await renderProvider();
    expect(currentPlanner().snapshot?.plan.name).toBe('User B plan');

    await act(async () => {
      userALoad.resolve({ snapshot: namedSnapshot('User A plan'), revision: 3 });
      await userALoad.promise;
    });
    expect(currentPlanner().snapshot?.plan.name).toBe('User B plan');
  });

  it('preserves the local draft and blocks further saves after a revision conflict', async () => {
    mocks.load.mockResolvedValue({ snapshot: namedSnapshot('Cloud plan'), revision: 7 });
    mocks.save.mockRejectedValue(new CloudRepositoryError('conflict', 'planner_revision_conflict'));
    await renderProvider();

    act(() => currentPlanner().updatePlan((plan) => ({ ...plan, name: 'Local draft' })));
    await act(async () => {
      await currentPlanner().save();
    });

    expect(currentPlanner().snapshot?.plan.name).toBe('Local draft');
    expect(currentPlanner().dirty).toBe(true);
    expect(currentPlanner().saveState).toBe('conflict');
    await act(async () => {
      expect(await currentPlanner().save()).toBe(false);
    });
    expect(mocks.save).toHaveBeenCalledTimes(1);
  });

  it('backs up a just-suspended draft without discarding it or persisting it in browser storage', async () => {
    const userA = mocks.auth.user;
    mocks.load.mockResolvedValue({ snapshot: namedSnapshot('Saved A plan'), revision: 7 });
    await renderProvider();
    act(() => currentPlanner().updatePlan((plan) => ({ ...plan, name: 'Unsaved A changes' })));
    mocks.auth.user = null;
    await renderProvider();

    expect(currentPlanner().mode).toBeNull();
    expect(currentPlanner().snapshot).toBeNull();
    expect(currentPlanner().dirty).toBe(false);
    expect(currentPlanner().hasSuspendedCloudDraft).toBe(true);
    const beforeBackup = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(beforeBackup);
    expect(beforeBackup.defaultPrevented).toBe(true);

    mocks.download.mockImplementationOnce(() => { throw new Error('Download unavailable'); });
    expect(currentPlanner().exportSuspendedCloudDraft()).toBe(false);
    const afterFailure = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(afterFailure);
    expect(afterFailure.defaultPrevented).toBe(true);

    expect(currentPlanner().exportSuspendedCloudDraft()).toBe(true);
    expect(mocks.download).toHaveBeenLastCalledWith(
      expect.objectContaining({ plan: expect.objectContaining({ name: 'Unsaved A changes' }) }),
      'accessible-finance-unsaved-plan.json',
    );
    expect(currentPlanner().hasSuspendedCloudDraft).toBe(true);
    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(0);
    expect(mocks.save).not.toHaveBeenCalled();
    const afterBackup = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(afterBackup);
    expect(afterBackup.defaultPrevented).toBe(false);

    mocks.auth.user = userA;
    await renderProvider();
    expect(currentPlanner().snapshot?.plan.name).toBe('Unsaved A changes');
    expect(currentPlanner().dirty).toBe(true);
    expect(currentPlanner().hasSuspendedCloudDraft).toBe(false);
    expect(currentPlanner().exportSuspendedCloudDraft()).toBe(false);

    // A later expiry protects the newly suspended draft even if an earlier
    // version was downloaded before the account was restored.
    mocks.auth.user = null;
    await renderProvider();
    const newSuspension = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(newSuspension);
    expect(newSuspension.defaultPrevented).toBe(true);
  });

  it('does not expose a retained account A draft after account B signs in and out', async () => {
    const userA = mocks.auth.user;
    mocks.load.mockResolvedValue({ snapshot: namedSnapshot('Saved A plan'), revision: 7 });
    await renderProvider();
    act(() => currentPlanner().updatePlan((plan) => ({ ...plan, name: 'Private A draft' })));
    mocks.auth.user = null;
    await renderProvider();
    expect(currentPlanner().hasSuspendedCloudDraft).toBe(true);

    mocks.auth.user = { id: 'user-b', user_metadata: { first_name: 'Blair' } };
    mocks.load.mockResolvedValue({ snapshot: namedSnapshot('Saved B plan'), revision: 9 });
    await renderProvider();
    expect(currentPlanner().snapshot?.plan.name).toBe('Saved B plan');
    expect(currentPlanner().hasSuspendedCloudDraft).toBe(false);
    expect(currentPlanner().exportSuspendedCloudDraft()).toBe(false);

    mocks.auth.user = null;
    await renderProvider();
    expect(currentPlanner().hasSuspendedCloudDraft).toBe(false);
    expect(currentPlanner().exportSuspendedCloudDraft()).toBe(false);
    expect(mocks.download).not.toHaveBeenCalled();

    mocks.auth.user = userA;
    mocks.load.mockResolvedValue({ snapshot: namedSnapshot('Saved A plan'), revision: 7 });
    await renderProvider();
    expect(currentPlanner().snapshot?.plan.name).toBe('Private A draft');
    expect(currentPlanner().dirty).toBe(true);
  });

  it('does not require a backup when the signed-out account had no unsaved changes', async () => {
    mocks.load.mockResolvedValue({ snapshot: namedSnapshot('Saved plan'), revision: 7 });
    await renderProvider();
    mocks.auth.user = null;
    await renderProvider();
    expect(currentPlanner().hasSuspendedCloudDraft).toBe(false);
    expect(currentPlanner().exportSuspendedCloudDraft()).toBe(false);
    const leave = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(leave);
    expect(leave.defaultPrevented).toBe(false);
  });

  it('blocks a cloud write while a visible numeric draft is invalid', async () => {
    mocks.load.mockResolvedValue({ snapshot: namedSnapshot('Cloud plan'), revision: 7 });
    mocks.save.mockResolvedValue({ revision: 8 });
    await renderProvider();
    act(() => currentPlanner().updatePlan((plan) => ({ ...plan, name: 'Unsaved edit' })));
    const field = document.createElement('input');
    field.dataset.numberField = '';
    field.value = 'bad';
    field.setCustomValidity('Enter a valid number.');
    document.body.append(field);
    await act(async () => {
      expect(await currentPlanner().save()).toBe(false);
    });
    expect(mocks.save).not.toHaveBeenCalled();
    expect(currentPlanner().dirty).toBe(true);
    expect(currentPlanner().saveMessage).toContain('Correct the highlighted number');
    expect(document.activeElement).toBe(field);
    field.setCustomValidity('');
    await act(async () => {
      expect(await currentPlanner().save()).toBe(true);
    });
    expect(mocks.save).toHaveBeenCalledTimes(1);
  });
});
