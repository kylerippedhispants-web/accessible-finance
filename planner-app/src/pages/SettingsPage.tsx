import { type ChangeEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ZodError } from 'zod';
import { useAuth } from '../auth/AuthContext';
import { NumberField, SelectField, TextField } from '../components/FormFields';
import { CANADIAN_PROVINCES_AND_TERRITORIES, type ProvinceOrTerritory } from '../domain';
import { downloadPlanExport, MAX_PLAN_TRANSFER_BYTES, parsePlanImport, PLAN_TRANSFER_SIZE_MESSAGE } from '../data/planTransfer';
import { cloudConfigurationMessage } from '../lib/supabase';
import { usePlanner } from '../state/PlannerContext';
import { formatValidationError } from '../validation/planSchemas';

const provinceNames: Record<ProvinceOrTerritory, string> = {
  AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', NT: 'Northwest Territories',
  NU: 'Nunavut', ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec',
  SK: 'Saskatchewan', YT: 'Yukon',
};

export function exportFilename(planName: string): string {
  const slug = planName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en-CA')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'plan';
  return `accessible-finance-${slug}-${new Date().toISOString().slice(0, 10)}.json`;
}

export function SettingsPage() {
  const planner = usePlanner();
  const auth = useAuth();
  const snapshot = planner.snapshot!;
  const plan = snapshot.plan;
  const [transferMessage, setTransferMessage] = useState<string>();
  const [transferError, setTransferError] = useState(false);
  const [transferBusy, setTransferBusy] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string>();
  const [accountError, setAccountError] = useState(false);
  const [accountBusy, setAccountBusy] = useState(false);
  const [profileError, setProfileError] = useState<string>();
  const [profileErrorField, setProfileErrorField] = useState<'birthDate' | 'baseYear'>();
  const [firstNameError, setFirstNameError] = useState<string>();
  const [planNameError, setPlanNameError] = useState<string>();
  const provinceOptions = useMemo(() => CANADIAN_PROVINCES_AND_TERRITORIES.map((code) => ({ value: code, label: `${provinceNames[code]} (${code})` })), []);
  const birthYear = Number(plan.profile.dateOfBirth.slice(0, 4));
  const minimumBaseYear = Math.max(1900, birthYear + 18);
  const maximumBaseYear = Math.min(2200, birthYear + plan.retirement.targetRetirementAge);
  const todayIsoDate = new Date().toISOString().slice(0, 10);
  const earliestBirthDate = `${Math.max(1900, plan.baseYear - plan.retirement.targetRetirementAge)}-01-01`;
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
      || age > plan.retirement.targetRetirementAge
    ) {
      setProfileError(`Date of birth must produce an age from 18 through the retirement target of ${plan.retirement.targetRetirementAge} in the base year.`);
      setProfileErrorField('birthDate');
      return;
    }
    setProfileError(undefined);
    setProfileErrorField(undefined);
    updateProfile({ dateOfBirth });
  };

  const updateBaseYear = (value: number | undefined) => {
    if (value === undefined || !Number.isFinite(value)) return;
    const baseYear = Math.round(value);
    if (baseYear < minimumBaseYear || baseYear > maximumBaseYear) {
      setProfileError(`Projection base year must be from ${minimumBaseYear} through ${maximumBaseYear} for this profile.`);
      setProfileErrorField('baseYear');
      return;
    }
    setProfileError(undefined);
    setProfileErrorField(undefined);
    planner.updatePlan((current) => ({ ...current, baseYear }));
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setTransferMessage(undefined);
    setTransferError(false);
    if (!file.name.toLocaleLowerCase('en-CA').endsWith('.json')) {
      setTransferMessage(`“${file.name}” is not a JSON file. Choose an Accessible Finance Planner .json export.`);
      setTransferError(true);
      return;
    }
    if (file.size > MAX_PLAN_TRANSFER_BYTES) {
      setTransferMessage(`“${file.name}” is too large. ${PLAN_TRANSFER_SIZE_MESSAGE}`);
      setTransferError(true);
      return;
    }
    setTransferBusy(true);
    try {
      const imported = parsePlanImport(await file.text(), { planId: plan.id, profileId: plan.profile.id });
      if (!window.confirm(`Import “${imported.plan.name}” from ${file.name} and replace the plan currently open? It will not be uploaded until you choose Save changes.`)) {
        setTransferMessage(`Import cancelled. “${file.name}” did not change the open plan.`);
        return;
      }
      planner.replaceSnapshot(imported);
      setTransferMessage(`Imported “${imported.plan.name}” from ${file.name}. Review it, then choose Save changes.`);
    } catch (error) {
      if (error instanceof SyntaxError) {
        setTransferMessage(`“${file.name}” does not contain valid JSON.`);
      } else if (error instanceof ZodError) {
        setTransferMessage(`“${file.name}” is not a valid planner export: ${formatValidationError(error)}`);
      } else if (error instanceof RangeError) {
        setTransferMessage(error.message);
      } else {
        setTransferMessage(`“${file.name}” could not be read as an Accessible Finance Planner export.`);
      }
      setTransferError(true);
    } finally {
      setTransferBusy(false);
    }
  };

  const exportPlan = () => {
    const filename = exportFilename(plan.name);
    setTransferMessage(undefined);
    setTransferError(false);
    try {
      downloadPlanExport(snapshot, filename);
      setTransferMessage(`Downloaded ${filename}. Treat this file as sensitive personal data.`);
    } catch (error) {
      setTransferError(true);
      setTransferMessage(error instanceof ZodError
        ? `The plan cannot be exported until this is fixed: ${formatValidationError(error)}`
        : error instanceof RangeError ? error.message
        : 'The browser could not create the JSON backup. No file was downloaded.');
    }
  };

  const sendReset = async () => {
    if (!auth.user?.email) return;
    setAccountBusy(true);
    setAccountError(false);
    const result = await auth.sendPasswordReset(auth.user.email);
    setAccountBusy(false);
    setAccountError(Boolean(result.error));
    setAccountMessage(result.error ?? 'Password reset email requested. Check your inbox.');
  };

  const exitDemoForAccount = () => {
    if (!auth.configured) return;
    const detail = planner.dirty ? ' Unsaved demo edits will also be removed.' : '';
    if (!window.confirm(`Exit Demo Mode and remove its fictional session data?${detail}`)) return;
    planner.exitDemo();
  };

  return (
    <div className="page settings-page">
      <header className="page-header"><div><span className="eyebrow">Profile & control</span><h1>Settings</h1><p>Manage identity details, plan metadata, portable backups, and privacy boundaries.</p></div></header>

      <section className="panel form-panel" aria-labelledby="profile-title">
        <div className="panel-heading"><div><span className="step-number">01</span><h2 id="profile-title">Profile and plan</h2><p>These details shape age-based projections and identify your plan.</p></div></div>
        <div className="form-grid two">
          <TextField label="First name" value={plan.profile.firstName} maxLength={80} required error={firstNameError} onChange={(firstName) => { updateProfile({ firstName }); setFirstNameError(undefined); }} onBlur={() => setFirstNameError(plan.profile.firstName.trim() ? undefined : 'Enter your first name.')} />
          <SelectField label="Province or territory" required value={plan.profile.provinceOrTerritory} options={provinceOptions} onChange={(value) => updateProfile({ provinceOrTerritory: value as ProvinceOrTerritory })} />
          <TextField label="Date of birth" required type="date" min={earliestBirthDate} max={latestBirthDate} value={plan.profile.dateOfBirth} error={profileErrorField === 'birthDate' ? profileError : undefined} onChange={updateBirthDate} />
          <TextField label="Plan name" value={plan.name} maxLength={100} required error={planNameError} onChange={(name) => { planner.updatePlan((current) => ({ ...current, name })); setPlanNameError(undefined); }} onBlur={() => setPlanNameError(plan.name.trim() ? undefined : 'Enter a plan name.')} />
          <NumberField label="Projection base year" required min={minimumBaseYear} max={maximumBaseYear} step={1} value={plan.baseYear} error={profileErrorField === 'baseYear' ? profileError : undefined} onChange={updateBaseYear} hint="Changing this shifts scheduled start and end years." />
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
              <p className="transfer-file-name"><strong>Filename:</strong> {exportFilename(plan.name)}</p>
               <button className="button button-secondary" type="button" onClick={exportPlan} disabled={transferBusy}>Download JSON backup</button>
            </article>
            <article className="panel transfer-card" aria-labelledby="import-title">
              <span className="eyebrow">Validated restore</span><h2 id="import-title">Import plan JSON</h2>
              <p>Imported entities receive new IDs. Nothing is uploaded automatically; review it before choosing Save changes.</p>
               <label className="button button-secondary file-button">{transferBusy ? 'Checking JSON file…' : 'Choose JSON file'}<input type="file" accept="application/json,.json" disabled={transferBusy} onChange={(event) => void importFile(event)} /></label>
            </article>
          </section>
          {transferMessage && <p className={`form-status transfer-status${transferError ? ' error' : ''}`} role={transferError ? 'alert' : 'status'}>{transferMessage}</p>}
        </>
      ) : (
         <section className="panel transfer-card" aria-labelledby="cloud-transfer-title">
           <span className="eyebrow">{auth.configured ? 'Cloud account feature' : 'Demo preview'}</span>
           <h2 id="cloud-transfer-title">{auth.configured ? 'Import and export after sign-in' : 'Keep exploring the fictional demo.'}</h2>
           {auth.configured ? (
             <>
               <p>Demo Mode is for fictional values only. To use personal information, exit the demo and create or sign in to a cloud account. Demo values are never copied automatically.</p>
               <button className="button button-secondary" type="button" onClick={exitDemoForAccount}>Exit demo to sign in</button>
             </>
           ) : (
             <>
               <p>Accounts, cloud saving, and file transfers are unavailable in this preview. Keep adjusting the sample plan, and choose Save changes to keep fictional edits for this browser session.</p>
               <Link className="button button-secondary" to="/dashboard">Continue demo</Link>
             </>
           )}
        </section>
      )}

      <section className="panel privacy-panel" aria-labelledby="privacy-title">
        <div className="panel-heading"><div><span className="step-number">02</span><h2 id="privacy-title">Storage and privacy</h2><p>Exactly where this planner keeps information.</p></div></div>
        <div className="privacy-grid">
          <article><span aria-hidden="true">⌁</span><div><h3>{planner.mode === 'demo' ? 'Demo Mode storage' : 'Cloud plan storage'}</h3><p>{planner.mode === 'demo' ? 'The default fictional plan and edits you explicitly save are stored in origin-wide sessionStorage until you exit Demo Mode or end the browser session. Unsaved edits remain on this page only. Use fictional values only; nothing is sent to Supabase.' : 'Financial plan inputs are stored in Supabase and protected by row-level security. The app does not cache cloud financial records in localStorage.'}</p></div></article>
          <article><span aria-hidden="true">◇</span><div><h3>Authentication session</h3><p>For signed-in users, the official Supabase client holds the session in the active planner page only. It is not persisted in origin-wide web storage, so a refresh requires signing in again. The planner never logs or exports tokens.</p></div></article>
          <article><span aria-hidden="true">◎</span><div><h3>Local calculations</h3><p>Projection outputs remain in memory and are recalculated in this browser. They are not written to the database, analytics, or logs.</p></div></article>
          <article><span aria-hidden="true">×</span><div><h3>No financial tracking scripts</h3><p>The planner shell does not load AdSense, analytics, the newsletter embed, or Google Translate.</p></div></article>
        </div>
      </section>

      <section className="panel account-card" aria-labelledby="account-title">
        <div><span className="eyebrow">Account</span><h2 id="account-title">{planner.mode === 'cloud' ? auth.user?.email : 'Demo Mode'}</h2><p>{planner.mode === 'cloud' ? cloudConfigurationMessage() : 'No cloud account is connected to this fictional session.'}</p></div>
         {planner.mode === 'cloud' && <button className="button button-secondary" type="button" disabled={accountBusy} onClick={() => void sendReset()}>{accountBusy ? 'Requesting reset…' : 'Email password reset link'}</button>}
         {accountMessage && <p className={`form-status${accountError ? ' error' : ''}`} role={accountError ? 'alert' : 'status'}>{accountMessage}</p>}
      </section>

      <div className="method-note"><strong>Before sharing an export.</strong><p>The file deliberately omits account and authentication data, but it still contains the financial information you entered. Store and share it as sensitive personal data.</p></div>
    </div>
  );
}
