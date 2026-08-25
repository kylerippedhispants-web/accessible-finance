import { type FormEvent, useState } from 'react';
import { cloudConfigurationMessage } from '../lib/supabase';
import { useAuth } from './AuthContext';

type AuthView = 'sign-in' | 'sign-up' | 'forgot';

export function AuthPanel() {
  const auth = useAuth();
  const [view, setView] = useState<AuthView>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [isError, setIsError] = useState(false);

  const chooseView = (nextView: AuthView) => {
    setView(nextView);
    setMessage(undefined);
    setIsError(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || !auth.configured) return;
    setBusy(true);
    setMessage(undefined);
    setIsError(false);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setMessage('Enter your email address.');
      setIsError(true);
      setBusy(false);
      return;
    }

    if (view !== 'forgot' && password.length < 8) {
      setMessage('Use a password with at least 8 characters.');
      setIsError(true);
      setBusy(false);
      return;
    }

    if (view === 'sign-up' && !firstName.trim()) {
      setMessage('Enter your first name.');
      setIsError(true);
      setBusy(false);
      return;
    }

    const result = view === 'sign-in'
      ? await auth.signIn(normalizedEmail, password)
      : view === 'sign-up'
        ? await auth.signUp(normalizedEmail, password, firstName)
        : await auth.sendPasswordReset(normalizedEmail);

    if (result.error) {
      setMessage(result.error);
      setIsError(true);
    } else if (view === 'forgot') {
      setMessage('If that address has an account, a reset link is on its way.');
    } else if (result.needsEmailConfirmation) {
      setMessage('Check your inbox to confirm your email, then return here to sign in.');
    }
    setBusy(false);
  };

  return (
    <section className="auth-panel" aria-labelledby="auth-title">
      <div className="auth-tabs" role="tablist" aria-label="Account access">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'sign-in'}
          onClick={() => chooseView('sign-in')}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'sign-up'}
          onClick={() => chooseView('sign-up')}
        >
          Create account
        </button>
      </div>

      <div className="auth-panel-body">
        <span className="eyebrow">Cloud saved plan</span>
        <h2 id="auth-title">
          {view === 'sign-in' && 'Welcome back.'}
          {view === 'sign-up' && 'Start a private plan.'}
          {view === 'forgot' && 'Reset your password.'}
        </h2>
        <p>
          {view === 'forgot'
            ? 'Enter the email attached to your account and we will send a secure reset link.'
            : 'Your inputs sync through your own account. Projections still run locally in this browser.'}
        </p>

        <form onSubmit={submit} noValidate>
          {view === 'sign-up' && (
            <label>
              <span>First name</span>
              <input
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                disabled={!auth.configured || busy}
              />
            </label>
          )}
          <label>
            <span>Email</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={!auth.configured || busy}
              required
            />
          </label>
          {view !== 'forgot' && (
            <label>
              <span>Password</span>
              <input
                type="password"
                autoComplete={view === 'sign-up' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={!auth.configured || busy}
                minLength={8}
                required
              />
              {view === 'sign-up' && <small>At least 8 characters.</small>}
            </label>
          )}

          {!auth.configured && <p className="notice notice-caution">{cloudConfigurationMessage()}</p>}
          {message && (
            <p className={`form-status${isError ? ' error' : ''}`} role={isError ? 'alert' : 'status'}>
              {message}
            </p>
          )}

          <button className="button button-primary button-wide" type="submit" disabled={!auth.configured || busy}>
            {busy ? 'Please wait…' : view === 'sign-in' ? 'Sign in' : view === 'sign-up' ? 'Create account' : 'Send reset link'}
          </button>
        </form>

        {view === 'sign-in' && (
          <button className="text-button" type="button" onClick={() => chooseView('forgot')}>
            Forgot your password?
          </button>
        )}
        {view === 'forgot' && (
          <button className="text-button" type="button" onClick={() => chooseView('sign-in')}>
            Back to sign in
          </button>
        )}
      </div>
    </section>
  );
}
