// @vitest-environment jsdom
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { act, createElement, createRef, forwardRef, useImperativeHandle } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDemoSnapshot } from '../planner-app/src/data/demoPlan';

type OAuthResponse = { data: { provider?: string; url: string | null }; error: unknown };

const mocks = vi.hoisted(() => ({
  configured: true,
  getSession: vi.fn<() => Promise<{ data: { session: Session | null }; error: unknown }>>(),
  oauth: vi.fn<(options: { provider: string; options: { redirectTo: string } }) => Promise<OAuthResponse>>(),
  signIn: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  signUp: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  reset: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  update: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  signOut: vi.fn<() => Promise<unknown>>(),
  unsubscribe: vi.fn<() => void>(),
  listener: undefined as ((event: AuthChangeEvent, session: Session | null) => void) | undefined,
  load: vi.fn<() => Promise<unknown>>(),
  save: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}));

vi.mock('../planner-app/src/lib/supabase', () => ({
  get isCloudConfigured() { return mocks.configured; },
  getSupabaseClient: () => mocks.configured ? {
    auth: {
      getSession: mocks.getSession,
      signInWithOAuth: mocks.oauth,
      signInWithPassword: mocks.signIn,
      signUp: mocks.signUp,
      resetPasswordForEmail: mocks.reset,
      updateUser: mocks.update,
      signOut: mocks.signOut,
      onAuthStateChange: (listener: typeof mocks.listener) => {
        mocks.listener = listener;
        return { data: { subscription: { unsubscribe: mocks.unsubscribe } } };
      },
    },
  } : null,
}));

vi.mock('../planner-app/src/data/supabaseRepository', () => ({
  CloudRepositoryError: class CloudRepositoryError extends Error { code = 'unavailable'; },
  loadPlannerSnapshot: mocks.load,
  savePlannerSnapshot: mocks.save,
}));

import { AuthProvider, useAuth } from '../planner-app/src/auth/AuthContext';
import { AuthPanel } from '../planner-app/src/auth/AuthPanel';
import { parseOAuthCallbackError } from '../planner-app/src/auth/oauth';
import { PlannerProvider, usePlanner } from '../planner-app/src/state/PlannerContext';

type AuthValue = ReturnType<typeof useAuth>;
interface ProbeValue { auth: AuthValue; planner: ReturnType<typeof usePlanner> }
const Probe = forwardRef<ProbeValue>(function Probe(_props, ref) {
  const auth = useAuth();
  const planner = usePlanner();
  useImperativeHandle(ref, () => ({ auth, planner }), [auth, planner]);
  return null;
});
const reactTestGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean };

function button(label: string): HTMLButtonElement {
  const found = Array.from(document.querySelectorAll('button')).find((item) => (item.getAttribute('aria-label') || item.textContent?.trim()) === label);
  if (!found) throw new Error(`Button not found: ${label}`);
  return found;
}

function hasButton(label: string): boolean {
  return Array.from(document.querySelectorAll('button')).some((item) => (item.getAttribute('aria-label') || item.textContent?.trim()) === label);
}

describe('Google sign-in through the existing Supabase account', () => {
  let root: Root;
  let probe: ReturnType<typeof createRef<ProbeValue>>;

  async function render(authPanelProps: { hasSuspendedCloudDraft?: boolean; onExportSuspendedCloudDraft?: () => boolean } = {}) {
    await act(async () => {
      root.render(createElement(AuthProvider, null,
        createElement(PlannerProvider, null,
          createElement(AuthPanel, authPanelProps), createElement(Probe, { ref: probe }))));
    });
  }

  beforeEach(() => {
    reactTestGlobal.IS_REACT_ACT_ENVIRONMENT = true;
    document.body.innerHTML = '<div id="root"></div>';
    history.replaceState(null, '', '/planner/');
    sessionStorage.clear();
    localStorage.clear();
    root = createRoot(document.getElementById('root')!);
    probe = createRef<ProbeValue>();
    vi.clearAllMocks();
    mocks.configured = true;
    mocks.listener = undefined;
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mocks.oauth.mockResolvedValue({ data: { provider: 'google', url: 'https://example.invalid/oauth' }, error: null });
    mocks.load.mockResolvedValue(null);
  });

  afterEach(() => {
    act(() => root.unmount());
    reactTestGlobal.IS_REACT_ACT_ENVIRONMENT = false;
    history.replaceState(null, '', '/');
  });

  it('offers Google on configured sign-in and signup screens, but not password recovery', async () => {
    await render();
    expect(button('Sign in with Google')).toBeDefined();
    await act(async () => button('Create account').click());
    expect(button('Sign in with Google')).toBeDefined();
    await act(async () => button('Sign in').click());
    await act(async () => button('Forgot your password?').click());
    expect(hasButton('Sign in with Google')).toBe(false);
    expect(document.body.textContent).toContain('Reset your password.');
  });

  it('keeps Google unavailable in a Demo-only deployment', async () => {
    mocks.configured = false;
    await render();
    expect(document.body.textContent).toContain('Cloud saving is unavailable here.');
    expect(hasButton('Sign in with Google')).toBe(false);
    expect(mocks.oauth).not.toHaveBeenCalled();
    expect(await probe.current!.auth.signInWithGoogle()).toHaveProperty('error');
    expect(mocks.oauth).not.toHaveBeenCalled();
  });

  it('starts Google without validating password fields and locks duplicate clicks while pending', async () => {
    let resolveOAuth: ((value: OAuthResponse) => void) | undefined;
    mocks.oauth.mockReturnValue(new Promise<OAuthResponse>((resolve) => { resolveOAuth = resolve; }));
    await render();
    const googleButton = button('Sign in with Google');
    await act(async () => googleButton.click());
    expect(mocks.oauth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: `${location.origin}/planner/dashboard` },
    });
    expect(document.querySelector('[role="alert"]')).toBeNull();
    expect(googleButton.disabled).toBe(true);
    expect(document.querySelector<HTMLInputElement>('input[type="email"]')?.disabled).toBe(true);
    await act(async () => googleButton.click());
    expect(mocks.oauth).toHaveBeenCalledTimes(1);
    expect(mocks.signIn).not.toHaveBeenCalled();
    await act(async () => resolveOAuth!({ data: { provider: 'google', url: 'https://example.invalid/oauth' }, error: null }));
  });

  it('shows a safe provider failure and allows a retry', async () => {
    mocks.oauth.mockResolvedValueOnce({ data: { url: null }, error: { message: 'private diagnostic token=secret', code: 'provider_disabled' } });
    await render();
    await act(async () => button('Sign in with Google').click());
    expect(document.querySelector('[role="alert"]')?.textContent).toBeTruthy();
    expect(document.body.textContent).not.toContain('private diagnostic');
    expect(document.body.textContent).not.toContain('token=secret');
    expect(button('Sign in with Google').disabled).toBe(false);
    await act(async () => button('Sign in with Google').click());
    expect(mocks.oauth).toHaveBeenCalledTimes(2);
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });

  it.each(['returns false', 'throws'])('blocks Google navigation when draft export %s while leaving email sign-in available', async (failure) => {
    const download = vi.fn<() => boolean>().mockImplementation(() => {
      if (failure === 'throws') throw new Error('Download blocked');
      return false;
    });
    await render({ hasSuspendedCloudDraft: true, onExportSuspendedCloudDraft: download });
    await act(async () => button('Sign in with Google').click());
    expect(document.body.textContent).toContain('Keep a copy of your unsaved changes');
    expect(document.activeElement?.textContent).toContain('Keep a copy of your unsaved changes');
    expect(mocks.oauth).not.toHaveBeenCalled();
    expect(download).not.toHaveBeenCalled();
    expect(button('Continue to Google').disabled).toBe(true);
    expect(document.querySelector<HTMLInputElement>('input[type="email"]')?.disabled).toBe(false);
    expect(document.querySelector<HTMLInputElement>('input[type="password"]')?.disabled).toBe(false);
    expect(document.querySelector<HTMLButtonElement>('form button[type="submit"]')?.disabled).toBe(false);

    await act(async () => button('Download unsaved changes').click());
    expect(download).toHaveBeenCalledTimes(1);
    expect(button('Continue to Google').disabled).toBe(true);
    await act(async () => button('Continue to Google').click());
    await act(async () => button('Sign in with Google').click());
    expect(mocks.oauth).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('requires an explicit Continue after a successful draft backup before opening Google', async () => {
    const download = vi.fn<() => boolean>().mockReturnValue(true);
    await render({ hasSuspendedCloudDraft: true, onExportSuspendedCloudDraft: download });
    await act(async () => button('Sign in with Google').click());
    expect(button('Continue to Google').disabled).toBe(true);
    await act(async () => button('Download unsaved changes').click());
    expect(download).toHaveBeenCalledTimes(1);
    expect(button('Continue to Google').disabled).toBe(false);
    expect(mocks.oauth).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();

    await act(async () => button('Continue to Google').click());
    expect(mocks.oauth).toHaveBeenCalledTimes(1);
    expect(mocks.oauth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: `${location.origin}/planner/dashboard` },
    });
    expect(download).toHaveBeenCalledTimes(1);
  });

  it('surfaces cancelled callbacks and removes provider error details from the address', async () => {
    history.replaceState(null, '', '/planner/dashboard?keep=yes&error=access_denied&error_description=private-provider-detail#overview');
    await render();
    expect(probe.current!.auth.authError).toMatch(/cancel/i);
    expect(document.querySelector('[role="alert"]')?.textContent).toMatch(/cancel/i);
    expect(document.activeElement?.id).toBe('auth-title');
    expect(location.search).toBe('?keep=yes');
    expect(location.hash).toBe('#overview');
    expect(document.body.textContent).not.toContain('private-provider-detail');
    await act(async () => probe.current!.auth.clearAuthError());
    expect(probe.current!.auth.authError).toBeUndefined();
  });

  it.each(['returned', 'rejected'])('surfaces a %s startup session error without its raw diagnostics', async (mode) => {
    const error = new Error('private initial-session diagnostic');
    if (mode === 'returned') mocks.getSession.mockResolvedValue({ data: { session: null }, error });
    else mocks.getSession.mockRejectedValue(error);
    await render();
    expect(probe.current!.auth.ready).toBe(true);
    expect(probe.current!.auth.authError).toBeTruthy();
    expect(document.querySelector('[role="alert"]')?.textContent).toBeTruthy();
    expect(document.body.textContent).not.toContain(error.message);
  });

  it('loads an existing account plan after the SDK returns its Google-linked user, without saving', async () => {
    const snapshot = createDemoSnapshot();
    snapshot.plan.name = 'Existing cloud plan';
    mocks.load.mockResolvedValue({ snapshot, revision: 12 });
    await render();
    const session = {
      access_token: 'fake-test-access-token', refresh_token: 'fake-test-refresh-token', expires_in: 3600,
      token_type: 'bearer', user: { id: '11111111-1111-4111-8111-111111111111', app_metadata: { provider: 'google' }, user_metadata: { first_name: 'Alex' }, aud: 'authenticated', created_at: '2026-01-01T00:00:00Z' },
    } satisfies Session;
    await act(async () => mocks.listener?.('SIGNED_IN', session));
    expect(probe.current!.auth.user?.id).toBe(session.user.id);
    expect(probe.current!.planner.mode).toBe('cloud');
    expect(probe.current!.planner.snapshot?.plan.id).toBe(snapshot.plan.id);
    expect(probe.current!.planner.snapshot?.plan.name).toBe('Existing cloud plan');
    expect(probe.current!.planner.onboardingRequired).toBe(false);
    expect(mocks.save).not.toHaveBeenCalled();
  });
});

describe('OAuth callback parsing', () => {
  it('leaves successful callback tokens for the Supabase SDK to consume', () => {
    expect(parseOAuthCallbackError('https://example.test/planner/dashboard#access_token=fake&refresh_token=fake-refresh&token_type=bearer')).toBeUndefined();
  });

  it('cleans only error fields in a parameter-style hash and preserves unrelated navigation state', () => {
    const result = parseOAuthCallbackError('https://example.test/planner/dashboard?keep=yes#error=access_denied&error_code=access_denied&error_description=private&next=dashboard');
    expect(result?.message).toMatch(/cancel/i);
    expect(result?.cleanedUrl).toBe('https://example.test/planner/dashboard?keep=yes#next=dashboard');
  });

  it('removes rejected callback credentials from query and hash as well as provider diagnostics', () => {
    const result = parseOAuthCallbackError('https://example.test/planner/dashboard?keep=yes&access_token=fake-access&code=fake-code&error_uri=https%3A%2F%2Fexample.invalid%2Ferror#error=access_denied&error_description=private&refresh_token=fake-refresh&provider_token=fake-provider&provider_refresh_token=fake-provider-refresh&expires_in=3600&expires_at=123456&token_type=bearer&next=dashboard');
    expect(result?.message).toMatch(/cancel/i);
    expect(result?.cleanedUrl).toBe('https://example.test/planner/dashboard?keep=yes#next=dashboard');
  });
});

