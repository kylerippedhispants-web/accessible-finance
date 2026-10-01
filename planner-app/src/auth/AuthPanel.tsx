import { type FormEvent, useState } from 'react';
import { useAuth } from './AuthContext';

type AuthView = 'sign-in' | 'sign-up' | 'forgot';

export function AuthPanel() {
  const auth = useAuth();
  const [view, setView] = useState<AuthView>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [isError, setIsError] = useState(false);
  const [invalidField, setInvalidField] = useState<'email' | 'firstName' | 'password' | 'confirmation'>();

  const chooseView = (nextView: AuthView) => {
    if (busy) return;
    setView(nextView);
    setMessage(undefined);
    setIsError(false);
    setInvalidField(undefined);
    setPassword('');
    setConfirmation('');
    setShowPassword(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || !auth.configured) return;
    setBusy(true);
    setMessage(undefined);
    setIsError(false);
    setInvalidField(undefined);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setMessage('Enter a valid email address.');
      setIsError(true);
      setInvalidField('email');
      setBusy(false);
      return;
    }

    if (view !== 'forgot' && password.length < 8) {
      setMessage('Use a password with at least 8 characters.');
      setIsError(true);
      setInvalidField('password');
      setBusy(false);
      return;
    }

    if (view === 'sign-up' && !firstName.trim()) {
      setMessage('Enter your first name.');
      setIsError(true);
      setInvalidField('firstName');
      setBusy(false);
      return;
    }

    if (view === 'sign-up' && password !== confirmation) {
      setMessage('The passwords do not match.');
      setIsError(true);
      setInvalidField('confirmation');
      setBusy(false);
      return;
    }

    try {
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
    } finally {
      setBusy(false);
    }
  };

  if (!auth.configured) {
    return (
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-panel-body">
          <span className="eyebrow">Demo preview</span>
          <h2 id="auth-title">Cloud saving is unavailable here.</h2>
          <p>Explore the planner with fictional values in Demo Mode. Choose Save changes to keep your edits for this browser session only.</p>
          <p>Accounts, sign-in, and password recovery are not enabled in this preview.</p>
          <a className="text-button" href="/articles.html">Browse the educational guides</a>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-panel" aria-labelledby="auth-title">
      <div className="auth-tabs" role="group" aria-label="Account access">
        <button
          type="button"
          aria-pressed={view !== 'sign-up'}
          onClick={() => chooseView('sign-in')}
          disabled={busy}
        >
          Sign in
        </button>
        <button
          type="button"
          aria-pressed={view === 'sign-up'}
          onClick={() => chooseView('sign-up')}
          disabled={busy}
        >
          Create account
        </button>
      </div>

      <div className="auth-panel-body" id="account-access-panel">
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

        <form onSubmit={submit} noValidate aria-busy={busy}>
          {view === 'sign-up' && (
            <label>
              <span>First name</span>
              <input
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => {
                  setFirstName(event.target.value);
                  if (invalidField === 'firstName') setInvalidField(undefined);
                }}
                disabled={!auth.configured || busy}
                aria-describedby={message ? 'auth-form-message' : undefined}
                aria-invalid={invalidField === 'firstName' ? true : undefined}
                required
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
              onChange={(event) => {
                setEmail(event.target.value);
                if (invalidField === 'email') setInvalidField(undefined);
              }}
              disabled={!auth.configured || busy}
              aria-describedby={message ? 'auth-form-message' : undefined}
              aria-invalid={invalidField === 'email' ? true : undefined}
              required
            />
          </label>
          {view !== 'forgot' && (
            <label>
              <span>Password</span>
              <span className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={view === 'sign-up' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (invalidField === 'password') setInvalidField(undefined);
                  }}
                  disabled={!auth.configured || busy}
                  minLength={8}
                  aria-describedby={message ? 'auth-form-message' : undefined}
                  aria-invalid={invalidField === 'password' ? true : undefined}
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={busy}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </span>
              {view === 'sign-up' && <small>At least 8 characters.</small>}
            </label>
          )}
          {view === 'sign-up' && (
            <label>
              <span>Confirm password</span>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => {
                  setConfirmation(event.target.value);
                  if (invalidField === 'confirmation') setInvalidField(undefined);
                }}
                disabled={!auth.configured || busy}
                minLength={8}
                aria-describedby={message ? 'auth-form-message' : undefined}
                aria-invalid={invalidField === 'confirmation' ? true : undefined}
                required
              />
            </label>
          )}

          {message && (
            <p className={`form-status${isError ? ' error' : ''}`} role={isError ? 'alert' : 'status'}>
              <span id="auth-form-message">{message}</span>
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
