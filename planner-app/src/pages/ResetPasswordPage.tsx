import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Brand } from '../components/Brand';

export function ResetPasswordPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);

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
    setBusy(true);
    const result = await auth.updatePassword(password);
    setBusy(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  return (
    <main className="centered-page">
      <Brand />
      <section className="standalone-card" aria-labelledby="reset-title">
        <span className="eyebrow">Account security</span>
        <h1 id="reset-title">Choose a new password.</h1>
        <p>The reset link must be opened in this browser before the password can be changed.</p>
        <form onSubmit={submit}>
          <label><span>New password</span><input type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <label><span>Confirm new password</span><input type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
          {message && <p className="form-status error" role="alert">{message}</p>}
          <button className="button button-primary button-wide" type="submit" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
        </form>
        <Link className="text-button" to="/">Back to planner sign in</Link>
      </section>
    </main>
  );
}
