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

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!isCloudConfigured);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      if (event === 'SIGNED_OUT') setRecoveryMode(false);
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) setRecoveryMode(false);
    return error ? { error: error.message } : {};
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    firstName: string,
  ): Promise<AuthResult> => {
    const supabase = getSupabaseClient();
    if (!supabase) return unavailable();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName.trim() },
        emailRedirectTo: `${window.location.origin}/planner/dashboard`,
      },
    });
    if (error) return { error: error.message };
    setRecoveryMode(false);
    return { needsEmailConfirmation: !data.session };
  }, []);

  const sendPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    const supabase = getSupabaseClient();
    if (!supabase) return unavailable();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/planner/reset-password`,
    });
    return error ? { error: error.message } : {};
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    if (!recoveryMode) {
      return { error: 'Open a current password reset link before choosing a new password.' };
    }
    const supabase = getSupabaseClient();
    if (!supabase) return unavailable();
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) setRecoveryMode(false);
    return error ? { error: error.message } : {};
  }, [recoveryMode]);

  const signOut = useCallback(async (): Promise<AuthResult> => {
    const supabase = getSupabaseClient();
    if (!supabase) return unavailable();
    const { error } = await supabase.auth.signOut();
    setRecoveryMode(false);
    return error ? { error: error.message } : {};
  }, []);

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
    clearRecoveryMode: () => setRecoveryMode(false),
  }), [ready, recoveryMode, sendPasswordReset, session, signIn, signOut, signUp, updatePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
