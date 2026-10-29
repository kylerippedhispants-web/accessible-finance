import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

type AuthView = 'sign-in' | 'sign-up' | 'forgot';

interface AuthPanelProps {
  hasSuspendedCloudDraft?: boolean;
  onExportSuspendedCloudDraft?: () => boolean;
}

export function AuthPanel({ hasSuspendedCloudDraft = false, onExportSuspendedCloudDraft }: AuthPanelProps) {
  const auth = useAuth();
  const [view, setView] = useState<AuthView>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleDraftPrompt, setGoogleDraftPrompt] = useState(false);
  const [googleBackupReady, setGoogleBackupReady] = useState(false);
  const [googleBackupError, setGoogleBackupError] = useState(false);
  const [message, setMessage] = useState<string>();
  const [isError, setIsError] = useState(false);
  const [invalidField, setInvalidField] = useState<'email' | 'firstName' | 'password' | 'confirmation'>();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const googleDraftTitleRef = useRef<HTMLHeadingElement>(null);
  const accountMessage = message || auth.authError;
  const accountError = message ? isError : Boolean(auth.authError);

  useEffect(() => {
    // OAuth returns to the landing page when sign-in is cancelled or fails.
    // Bring the account panel into view and announce its heading to keyboard users.
    if (auth.authError) titleRef.current?.focus();
  }, [auth.authError]);

  useEffect(() => {
    if (googleDraftPrompt) googleDraftTitleRef.current?.focus();
  }, [googleDraftPrompt]);

  const chooseView = (nextView: AuthView) => {
    if (busy) return;
    auth.clearAuthError();
    setView(nextView);
    setMessage(undefined);
    setIsError(false);
    setInvalidField(undefined);
    setPassword('');
    setConfirmation('');
    setShowPassword(false);
    setGoogleDraftPrompt(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || !auth.configured) return;
    setBusy(true);
    auth.clearAuthError();
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

  const signInWithGoogle = async () => {
    if (busy || !auth.configured) return;
    if (hasSuspendedCloudDraft && !googleBackupReady) {
      setGoogleDraftPrompt(true);
      return;
    }
    setBusy(true);
    setGoogleBusy(true);
    setMessage(undefined);
    setIsError(false);
    setInvalidField(undefined);
    auth.clearAuthError();
    try {
      const result = await auth.signInWithGoogle();
      if (result.error) {
        setMessage(result.error);
        setIsError(true);
      }
    } catch {
      setMessage('We could not open Google sign-in. Check your connection and try again.');
      setIsError(true);
    } finally {
      // The SDK starts navigation before resolving. Clear the busy state so
      // returning with the browser Back button leaves the form usable.
      setBusy(false);
      setGoogleBusy(false);
    }
  };

  const requestGoogleSignIn = () => {
    if (hasSuspendedCloudDraft) setGoogleDraftPrompt(true);
    else void signInWithGoogle();
  };

  const downloadUnsavedChanges = () => {
    try {
      const downloaded = onExportSuspendedCloudDraft?.() ?? false;
      setGoogleBackupReady(downloaded);
      setGoogleBackupError(!downloaded);
    } catch {
      setGoogleBackupReady(false);
      setGoogleBackupError(true);
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
        <h2 id="auth-title" ref={titleRef} tabIndex={-1}>
          {view === 'sign-in' && 'Welcome back.'}
          {view === 'sign-up' && 'Start a private plan.'}
          {view === 'forgot' && 'Reset your password.'}
        </h2>
        <p>
          {view === 'forgot'
            ? 'Enter the email attached to your account and we will send a secure reset link.'
            : 'Your inputs sync through your own account. Projections still run locally in this browser.'}
        </p>

        {view !== 'forgot' && (
          <div className="auth-google-option">
            <button className="auth-google" type="button" onClick={requestGoogleSignIn} disabled={busy} aria-busy={googleBusy}>
              <img src="/assets/auth/google-signin-light.svg" alt="" width="180" height="40" aria-hidden="true" />
              <span className="sr-only">Sign in with Google</span>
            </button>
            {googleBusy && <p className="auth-google-status" role="status">Opening Google…</p>}
            {googleDraftPrompt && hasSuspendedCloudDraft && (
              <section className="auth-draft-warning" aria-labelledby="auth-google-draft-title">
                <h3 id="auth-google-draft-title" ref={googleDraftTitleRef} tabIndex={-1}>Keep a copy of your unsaved changes</h3>
                <p>Your session ended with unsaved edits. Google sign-in leaves this page, so download a backup first. After signing in, import it from Settings to restore those edits.</p>
                <p>Signing back into the same account with email and password keeps these edits open here.</p>
                <button className="button button-secondary button-wide" type="button" onClick={downloadUnsavedChanges} disabled={busy}>Download unsaved changes</button>
                {googleBackupError && <p className="form-status error" role="alert">The backup could not be downloaded. Try again or sign in with email and password.</p>}
                {googleBackupReady && <p className="form-status" role="status">Backup download started. Keep that file private and confirm it has saved before continuing.</p>}
                <button className="button button-primary button-wide" type="button" onClick={() => void signInWithGoogle()} disabled={busy || !googleBackupReady}>Continue to Google</button>
              </section>
            )}
            <p className="auth-divider">or continue with email</p>
          </div>
        )}

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
                aria-describedby={accountMessage ? 'auth-form-message' : undefined}
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
              aria-describedby={accountMessage ? 'auth-form-message' : undefined}
              aria-invalid={invalidField === 'email' ? true : undefined}
              required
            />
          </label>
          {view !== 'forgot' && (
            <label>
              <span id="auth-password-label">Password</span>
              <span className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  aria-labelledby="auth-password-label"
                  autoComplete={view === 'sign-up' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (invalidField === 'password') setInvalidField(undefined);
                  }}
                  disabled={!auth.configured || busy}
                  minLength={8}
                  aria-describedby={accountMessage ? 'auth-form-message' : undefined}
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
                aria-describedby={accountMessage ? 'auth-form-message' : undefined}
                aria-invalid={invalidField === 'confirmation' ? true : undefined}
                required
              />
            </label>
          )}

          {accountMessage && (
            <p className={`form-status${accountError ? ' error' : ''}`} role={accountError ? 'alert' : 'status'}>
              <span id="auth-form-message">{accountMessage}</span>
            </p>
          )}

          <button className="button button-primary button-wide" type="submit" disabled={!auth.configured || busy}>
            {busy ? 'Please wait…' : view === 'sign-in' ? 'Sign in' : view === 'sign-up' ? 'Create account' : 'Send reset link'}
          </button>
        </form>

        {view === 'sign-in' && (
          <button className="text-button" type="button" onClick={() => chooseView('forgot')} disabled={busy}>
            Forgot your password?
          </button>
        )}
        {view === 'forgot' && (
          <button className="text-button" type="button" onClick={() => chooseView('sign-in')} disabled={busy}>
            Back to sign in
          </button>
        )}
      </div>
    </section>
  );
}
