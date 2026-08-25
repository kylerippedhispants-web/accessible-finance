import { type ChangeEvent, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { NumberField, SelectField, TextField } from '../components/FormFields';
import { CANADIAN_PROVINCES_AND_TERRITORIES, type ProvinceOrTerritory } from '../domain';
import { downloadPlanExport, parsePlanImport } from '../data/planTransfer';
import { cloudConfigurationMessage } from '../lib/supabase';
import { usePlanner } from '../state/PlannerContext';

const provinceNames: Record<ProvinceOrTerritory, string> = {
  AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', NT: 'Northwest Territories',
  NU: 'Nunavut', ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec',
  SK: 'Saskatchewan', YT: 'Yukon',
};

export function SettingsPage() {
  const planner = usePlanner();
  const auth = useAuth();
  const snapshot = planner.snapshot!;
  const plan = snapshot.plan;
  const [transferMessage, setTransferMessage] = useState<string>();
  const [transferError, setTransferError] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string>();
  const [profileError, setProfileError] = useState<string>();
  const provinceOptions = useMemo(() => CANADIAN_PROVINCES_AND_TERRITORIES.map((code) => ({ value: code, label: `${provinceNames[code]} (${code})` })), []);
  const birthYear = Number(plan.profile.dateOfBirth.slice(0, 4));
  const minimumBaseYear = Math.max(1900, birthYear + 18);
  const maximumBaseYear = Math.min(2200, birthYear + Math.min(120, plan.retirement.planningEndAge));
  const todayIsoDate = new Date().toISOString().slice(0, 10);
  const earliestBirthDate = `${Math.max(1900, plan.baseYear - Math.min(120, plan.retirement.planningEndAge))}-01-01`;
  const latestBirthDate = [`${plan.baseYear - 18}-12-31`, todayIsoDate].sort()[0];

  const updateProfile = (changes: Partial<typeof plan.profile>) => {
    planner.updatePlan((current) => ({ ...current, profile: { ...current.profile, ...changes } }));
  };

  const updateBirthDate = (dateOfBirth: string) => {
    const parsed = new Date(`${dateOfBirth}T00:00:00Z`);
    const year = Number(dateOfBirth.slice(0, 4));
    const age = plan.baseYear - year;
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)
      || !Number.isFinite(parsed.getTime())
      || !parsed.toISOString().startsWith(dateOfBirth)
      || dateOfBirth < '1900-01-01'
      || dateOfBirth > todayIsoDate
      || age < 18
      || age > Math.min(120, plan.retirement.planningEndAge)
    ) {
      setProfileError('Date of birth must produce an age from 18 through the planning end age in the base year.');
      return;
    }
    setProfileError(undefined);
    updateProfile({ dateOfBirth });
  };

  const updateBaseYear = (value: number | undefined) => {
    if (value === undefined || !Number.isFinite(value)) return;
    const baseYear = Math.round(value);
    if (baseYear < minimumBaseYear || baseYear > maximumBaseYear) {
      setProfileError(`Projection base year must be from ${minimumBaseYear} through ${maximumBaseYear} for this profile.`);
      return;
    }
    setProfileError(undefined);
    planner.updatePlan((current) => ({ ...current, baseYear }));
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setTransferMessage(undefined);
    setTransferError(false);
    if (file.size > 2_000_000) {
      setTransferMessage('That file is too large. Planner exports must be under 2 MB.');
      setTransferError(true);
      return;
    }
    if (!window.confirm('Replace the plan currently open with this imported plan? It will not be uploaded until you choose Save changes.')) return;
    try {
      const imported = parsePlanImport(await file.text(), { planId: plan.id, profileId: plan.profile.id });
      planner.replaceSnapshot(imported);
      setTransferMessage(`Imported “${imported.plan.name}”. Review it, then choose Save changes.`);
    } catch {
      setTransferMessage('This is not a valid Accessible Finance Planner export, or it contains invalid values.');
      setTransferError(true);
    }
  };

  const sendReset = async () => {
    if (!auth.user?.email) return;
    const result = await auth.sendPasswordReset(auth.user.email);
    setAccountMessage(result.error ?? 'Password reset email requested. Check your inbox.');
  };

  return (
    <div className="page settings-page">
      <header className="page-header"><div><span className="eyebrow">Profile & control</span><h1>Settings</h1><p>Manage identity details, plan metadata, portable backups, and privacy boundaries.</p></div></header>

      <section className="panel form-panel" aria-labelledby="profile-title">
        <div className="panel-heading"><div><span className="step-number">01</span><h2 id="profile-title">Profile and plan</h2><p>These details shape age-based projections and identify your plan.</p></div></div>
        <div className="form-grid two">
          <TextField label="First name" value={plan.profile.firstName} maxLength={80} onChange={(firstName) => updateProfile({ firstName })} />
          <SelectField label="Province or territory" value={plan.profile.provinceOrTerritory} options={provinceOptions} onChange={(value) => updateProfile({ provinceOrTerritory: value as ProvinceOrTerritory })} />
          <TextField label="Date of birth" type="date" min={earliestBirthDate} max={latestBirthDate} value={plan.profile.dateOfBirth} onChange={updateBirthDate} />
          <TextField label="Plan name" value={plan.name} maxLength={100} onChange={(name) => planner.updatePlan((current) => ({ ...current, name }))} />
          <NumberField label="Projection base year" min={minimumBaseYear} max={maximumBaseYear} step={1} value={plan.baseYear} onChange={updateBaseYear} hint="Changing this shifts scheduled start and end years." />
          <label className="field"><span className="field-label">Currency</span><input value="Canadian dollar (CAD)" readOnly aria-readonly="true" /></label>
        </div>
        {profileError && <p className="form-status error" role="alert">{profileError}</p>}
      </section>

      {planner.mode === 'cloud' ? (
        <>
          <section className="settings-grid">
            <article className="panel transfer-card" aria-labelledby="export-title">
              <span className="eyebrow">Portable backup</span><h2 id="export-title">Export plan JSON</h2>
              <p>Downloads validated plan inputs and scenario differences. It excludes user IDs, auth tokens, credentials, and database timestamps.</p>
              <button className="button button-secondary" type="button" onClick={() => downloadPlanExport(snapshot)}>Download JSON backup</button>
            </article>
            <article className="panel transfer-card" aria-labelledby="import-title">
              <span className="eyebrow">Validated restore</span><h2 id="import-title">Import plan JSON</h2>
              <p>Imported entities receive new IDs. Nothing is uploaded automatically; review it before choosing Save changes.</p>
              <label className="button button-secondary file-button">Choose JSON file<input type="file" accept="application/json,.json" onChange={(event) => void importFile(event)} /></label>
            </article>
          </section>
          {transferMessage && <p className={`form-status transfer-status${transferError ? ' error' : ''}`} role={transferError ? 'alert' : 'status'}>{transferMessage}</p>}
        </>
      ) : (
        <section className="panel transfer-card" aria-labelledby="cloud-transfer-title">
          <span className="eyebrow">Cloud account feature</span><h2 id="cloud-transfer-title">Import and export after sign-in</h2>
          <p>Demo Mode is for fictional values only. Exit Demo Mode and sign in before importing or exporting a personal plan.</p>
        </section>
      )}

      <section className="panel privacy-panel" aria-labelledby="privacy-title">
        <div className="panel-heading"><div><span className="step-number">02</span><h2 id="privacy-title">Storage and privacy</h2><p>Exactly where this planner keeps information.</p></div></div>
        <div className="privacy-grid">
          <article><span aria-hidden="true">⌁</span><div><h3>{planner.mode === 'demo' ? 'Demo Mode storage' : 'Cloud plan storage'}</h3><p>{planner.mode === 'demo' ? 'The default fictional plan and any edits are stored in origin-wide sessionStorage until you exit Demo Mode or end the browser session. Use fictional values only; nothing is sent to Supabase.' : 'Financial plan inputs are stored in Supabase and protected by row-level security. The app does not cache cloud financial records in localStorage.'}</p></div></article>
          <article><span aria-hidden="true">◇</span><div><h3>Authentication session</h3><p>For signed-in users, the official Supabase client holds the session in the active planner page only. It is not persisted in origin-wide web storage, so a refresh requires signing in again. The planner never logs or exports tokens.</p></div></article>
          <article><span aria-hidden="true">◎</span><div><h3>Local calculations</h3><p>Projection outputs remain in memory and are recalculated in this browser. They are not written to the database, analytics, or logs.</p></div></article>
          <article><span aria-hidden="true">×</span><div><h3>No financial tracking scripts</h3><p>The planner shell does not load AdSense, analytics, the newsletter embed, or Google Translate.</p></div></article>
        </div>
      </section>

      <section className="panel account-card" aria-labelledby="account-title">
        <div><span className="eyebrow">Account</span><h2 id="account-title">{planner.mode === 'cloud' ? auth.user?.email : 'Demo Mode'}</h2><p>{planner.mode === 'cloud' ? cloudConfigurationMessage() : 'No cloud account is connected to this fictional session.'}</p></div>
        {planner.mode === 'cloud' && <button className="button button-secondary" type="button" onClick={() => void sendReset()}>Email password reset link</button>}
        {accountMessage && <p className="form-status" role="status">{accountMessage}</p>}
      </section>

      <div className="method-note"><strong>Before sharing an export.</strong><p>The file deliberately omits account and authentication data, but it still contains the financial information you entered. Store and share it as sensitive personal data.</p></div>
    </div>
  );
}
