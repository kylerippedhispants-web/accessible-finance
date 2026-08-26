import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getSupabaseClient, isCloudConfigured } from '../lib/supabase';

interface AuthResult {
  error?: string;
  needsEmailConfirmation?: boolean;
}

interface AuthContextValue {
  configured: boolean;
  ready: boolean;
  session: Session | null;
  user: User | null;
  recoveryMode: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, firstName: string) => Promise<AuthResult>;
  sendPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  clearRecoveryMode: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function unavailable(): AuthResult {
  return { error: 'Cloud sync has not been configured for this deployment.' };
}

function authErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

function friendlyAuthError(error: unknown): string {
  switch (authErrorCode(error)) {
    case 'invalid_credentials':
      return 'The email address or password is incorrect.';
    case 'email_not_confirmed':
      return 'Confirm your email address before signing in.';
    case 'user_already_exists':
    case 'email_exists':
      return 'An account already exists for that email address. Try signing in instead.';
    case 'weak_password':
      return 'Choose a stronger password with at least 8 characters.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
    case 'too_many_requests':
      return 'Too many attempts were made. Wait a few minutes, then try again.';
    case 'same_password':
      return 'Choose a password that is different from your current password.';
    case 'session_not_found':
    case 'refresh_token_not_found':
      return 'Your secure session has ended. Sign in again to continue.';
    default:
      return 'We could not complete that account request. Check your connection and try again.';
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!isCloudConfigured);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let active = true;
    void supabase.auth.getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setReady(true);
      });

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') setRecoveryMode(false);
      setReady(true);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const supabase = getSupabaseClient();
    if (!supabase) return unavailable();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: friendlyAuthError(error) };
      setRecoveryMode(false);
      return {};
    } catch (error) {
      return { error: friendlyAuthError(error) };
    }
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    firstName: string,
  ): Promise<AuthResult> => {
    const supabase = getSupabaseClient();
    if (!supabase) return unavailable();
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName.trim() },
          emailRedirectTo: `${window.location.origin}/planner/dashboard`,
        },
      });
      if (error) return { error: friendlyAuthError(error) };
      setRecoveryMode(false);
      return { needsEmailConfirmation: !data.session };
    } catch (error) {
      return { error: friendlyAuthError(error) };
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    const supabase = getSupabaseClient();
    if (!supabase) return unavailable();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/planner/reset-password`,
      });
      return error ? { error: friendlyAuthError(error) } : {};
    } catch (error) {
      return { error: friendlyAuthError(error) };
    }
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    if (!recoveryMode) {
      return { error: 'Open a current password reset link before choosing a new password.' };
    }
    const supabase = getSupabaseClient();
    if (!supabase) return unavailable();
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { error: friendlyAuthError(error) };
      setRecoveryMode(false);
      return {};
    } catch (error) {
      return { error: friendlyAuthError(error) };
    }
  }, [recoveryMode]);

  const signOut = useCallback(async (): Promise<AuthResult> => {
    const supabase = getSupabaseClient();
    if (!supabase) return unavailable();
    try {
      const { error } = await supabase.auth.signOut();
      setRecoveryMode(false);
      return error ? { error: friendlyAuthError(error) } : {};
    } catch (error) {
      setRecoveryMode(false);
      return { error: friendlyAuthError(error) };
    }
  }, []);

  const clearRecoveryMode = useCallback(() => setRecoveryMode(false), []);

  const value = useMemo<AuthContextValue>(() => ({
    configured: isCloudConfigured,
    ready,
    session,
    user: session?.user ?? null,
    recoveryMode,
    signIn,
    signUp,
    sendPasswordReset,
    updatePassword,
    signOut,
    clearRecoveryMode,
  }), [clearRecoveryMode, ready, recoveryMode, sendPasswordReset, session, signIn, signOut, signUp, updatePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
