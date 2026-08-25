import { type FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CANADIAN_PROVINCES_AND_TERRITORIES, type ProvinceOrTerritory } from '../domain';
import { createStarterPlan } from '../data/demoPlan';
import { NumberField, SelectField, TextField } from '../components/FormFields';
import { usePlanner } from '../state/PlannerContext';
import { financialPlanSchema, formatValidationError } from '../validation/planSchemas';

const provinceNames: Record<ProvinceOrTerritory, string> = {
  AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', NT: 'Northwest Territories',
  NU: 'Nunavut', ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec',
  SK: 'Saskatchewan', YT: 'Yukon',
};

export function OnboardingPage() {
  const planner = usePlanner();
  const navigate = useNavigate();
  const initial = planner.snapshot?.plan;
  const [firstName, setFirstName] = useState(initial?.profile.firstName ?? '');
  const [province, setProvince] = useState<ProvinceOrTerritory>(initial?.profile.provinceOrTerritory ?? 'ON');
  const [dateOfBirth, setDateOfBirth] = useState(initial?.profile.dateOfBirth ?? '1990-01-01');
  const [retirementAge, setRetirementAge] = useState<number | undefined>(initial?.retirement.targetRetirementAge ?? 65);
  const [endAge, setEndAge] = useState<number | undefined>(initial?.retirement.planningEndAge ?? 95);
  const [income, setIncome] = useState<number | undefined>(0);
  const [expenses, setExpenses] = useState<number | undefined>(0);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const todayIsoDate = new Date().toISOString().slice(0, 10);

  const provinceOptions = useMemo(() => CANADIAN_PROVINCES_AND_TERRITORIES.map((code) => ({
    value: code,
    label: `${provinceNames[code]} (${code})`,
  })), []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(undefined);
    if (!firstName.trim()) {
      setError('Enter your first name.');
      return;
    }
    const parsedBirthDate = new Date(`${dateOfBirth}T00:00:00`);
    if (!dateOfBirth || !Number.isFinite(parsedBirthDate.getTime()) || parsedBirthDate >= new Date()) {
      setError('Enter a valid date of birth.');
      return;
    }
    if (!retirementAge || !endAge || retirementAge < 18 || retirementAge > 100 || endAge <= retirementAge || endAge > 120) {
      setError('Choose a retirement age from 18 to 100 and a later planning end age no higher than 120.');
      return;
    }
    setBusy(true);
    const plan = createStarterPlan({
      firstName: firstName.trim(),
      provinceOrTerritory: province,
      dateOfBirth,
      targetRetirementAge: retirementAge,
      planningEndAge: endAge,
      annualEmploymentIncome: income ?? 0,
      annualExpenses: expenses ?? 0,
    });
    if (initial) {
      plan.id = initial.id;
      plan.profile.id = initial.profile.id;
    }
    const validated = financialPlanSchema.safeParse(plan);
    if (!validated.success) {
      setBusy(false);
      setError(formatValidationError(validated.error));
      return;
    }
    const saved = await planner.completeOnboarding(validated.data);
    setBusy(false);
    if (saved) navigate('/dashboard', { replace: true });
  };

  return (
    <main className="onboarding-page" id="main-content">
      <a className="onboarding-brand" href="/">
        <img src="/Logo-256.png" alt="" width="40" height="40" />
        <span>Accessible Finance <small>Planner</small></span>
      </a>
      <div className="onboarding-grid">
        <header>
          <span className="eyebrow">A five-minute foundation</span>
          <h1>Start with the shape of your plan.</h1>
          <p>
            Use broad annual estimates for now. Every item and assumption can be refined later from the planner.
          </p>
          <ol className="onboarding-steps" aria-label="Onboarding progress">
            <li className="active"><span>1</span><strong>About you</strong></li>
            <li className="active"><span>2</span><strong>Timeline</strong></li>
            <li className="active"><span>3</span><strong>Cash flow</strong></li>
            <li><span>4</span><strong>Add details later</strong></li>
          </ol>
        </header>

        <form className="onboarding-form" onSubmit={submit} noValidate>
          <fieldset>
            <legend><span>01</span> About you</legend>
            <div className="form-grid two">
              <TextField label="First name" autoComplete="given-name" value={firstName} onChange={setFirstName} />
              <SelectField label="Province or territory" value={province} options={provinceOptions} onChange={(value) => setProvince(value as ProvinceOrTerritory)} />
              <TextField label="Date of birth" type="date" min="1900-01-01" max={todayIsoDate} value={dateOfBirth} onChange={setDateOfBirth} />
            </div>
          </fieldset>

          <fieldset>
            <legend><span>02</span> Planning timeline</legend>
            <div className="form-grid two">
              <NumberField label="Target retirement age" min={18} max={100} step={1} value={retirementAge} onChange={setRetirementAge} />
              <NumberField label="Planning end age" min={19} max={120} step={1} value={endAge} onChange={setEndAge} hint="Ages beyond this point are not projected." />
            </div>
          </fieldset>

          <fieldset>
            <legend><span>03</span> Broad annual amounts</legend>
            <div className="form-grid two">
              <NumberField label="Employment income" prefix="$" min={0} step={1000} value={income} onChange={setIncome} hint="Before tax, per year." />
              <NumberField label="Approximate expenses" prefix="$" min={0} step={1000} value={expenses} onChange={setExpenses} hint="Living costs per year. Exclude payments you will model under Debts." />
            </div>
          </fieldset>

          <aside className="notice notice-caution">
            <strong>Taxes start as unsupported.</strong>
            <span>We will not guess a Canadian tax rate. Add your own effective-tax assumption under Retirement & assumptions.</span>
          </aside>
          {error && <p className="form-status error" role="alert">{error}</p>}
          <button className="button button-primary button-wide" type="submit" disabled={busy}>
            {busy ? 'Creating your plan…' : 'Create my plan'}
          </button>
          <p className="form-footnote">Next, add accounts, property, debts, and detailed spending from the planner navigation.</p>
        </form>
      </div>
    </main>
  );
}
