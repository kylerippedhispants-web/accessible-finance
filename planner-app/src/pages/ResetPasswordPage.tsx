import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Brand } from '../components/Brand';

export function ResetPasswordPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (completed) {
    return (
      <main className="centered-page">
        <Brand />
        <section className="standalone-card" aria-labelledby="reset-complete-title">
          <span className="eyebrow">Password updated</span>
          <h1 id="reset-complete-title">Your new password is ready.</h1>
          <p>The recovery link has been used and cannot change your password again.</p>
          <button className="button button-primary button-wide" type="button" onClick={() => navigate('/dashboard', { replace: true })}>
            Return to dashboard
          </button>
        </section>
      </main>
    );
  }

  if (!auth.recoveryMode || !auth.session) {
    return (
      <main className="centered-page">
        <Brand />
        <section className="standalone-card" aria-labelledby="reset-title">
          <span className="eyebrow">Account security</span>
          <h1 id="reset-title">Open your reset link first.</h1>
          <p>This form becomes available only after Supabase verifies a current password-recovery link in this browser.</p>
          <Link className="text-button" to="/">Request a new reset email</Link>
        </section>
      </main>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      setMessage('Use a password with at least 8 characters.');
      return;
    }
    if (password !== confirmation) {
      setMessage('The passwords do not match.');
      return;
    }
    setMessage(undefined);
    setBusy(true);
    try {
      const result = await auth.updatePassword(password);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setCompleted(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="centered-page">
      <Brand />
      <section className="standalone-card" aria-labelledby="reset-title">
        <span className="eyebrow">Account security</span>
        <h1 id="reset-title">Choose a new password.</h1>
        <p>The reset link must be opened in this browser before the password can be changed.</p>
        <form onSubmit={submit} aria-busy={busy} noValidate>
          <label>
            <span>New password</span>
            <span className="password-input">
              <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} aria-describedby={message ? 'reset-form-message' : undefined} />
              <button className="password-toggle" type="button" aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} disabled={busy}>{showPassword ? 'Hide' : 'Show'}</button>
            </span>
          </label>
          <label><span>Confirm new password</span><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={busy} aria-describedby={message ? 'reset-form-message' : undefined} /></label>
          {message && <p id="reset-form-message" className="form-status error" role="alert">{message}</p>}
          <button className="button button-primary button-wide" type="submit" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
        </form>
        <Link className="text-button" to="/">Back to planner sign in</Link>
      </section>
    </main>
  );
}
