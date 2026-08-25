import { type FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CANADIAN_PROVINCES_AND_TERRITORIES, type ProvinceOrTerritory } from '../domain';
import { createStarterPlan } from '../data/demoPlan';
import { MoneyField, NumberField, SelectField, TextField } from '../components/FormFields';
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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<
    'firstName' | 'dateOfBirth' | 'retirementAge' | 'endAge' | 'income' | 'expenses',
    string
  >>>({});
  const [busy, setBusy] = useState(false);
  const today = new Date();
  const todayIsoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const projectionBaseYear = initial?.baseYear ?? today.getFullYear();
  const parsedBirthDate = new Date(`${dateOfBirth}T00:00:00Z`);
  const birthDateIsValid = /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)
    && Number.isFinite(parsedBirthDate.getTime())
    && parsedBirthDate.toISOString().startsWith(dateOfBirth)
    && dateOfBirth >= '1900-01-01'
    && dateOfBirth <= todayIsoDate;
  const currentAge = birthDateIsValid ? projectionBaseYear - Number(dateOfBirth.slice(0, 4)) : undefined;

  const provinceOptions = useMemo(() => CANADIAN_PROVINCES_AND_TERRITORIES.map((code) => ({
    value: code,
    label: `${provinceNames[code]} (${code})`,
  })), []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(undefined);
    const nextErrors: typeof fieldErrors = {};
    if (!firstName.trim()) {
      nextErrors.firstName = 'Enter your first name.';
    }
    if (!birthDateIsValid || currentAge === undefined || currentAge < 18 || currentAge > 120) {
      nextErrors.dateOfBirth = 'Enter a valid date of birth that makes you age 18 to 120 in the projection base year.';
    }
    const minimumRetirementAge = Math.max(18, currentAge ?? 18);
    if (retirementAge === undefined || !Number.isInteger(retirementAge) || retirementAge < minimumRetirementAge || retirementAge > 100) {
      nextErrors.retirementAge = `Enter a whole-number age from ${minimumRetirementAge} through 100. Use your current age if you are already retired.`;
    }
    const minimumEndAge = Math.max(19, currentAge ?? 18, (retirementAge ?? 18) + 1);
    if (endAge === undefined || !Number.isInteger(endAge) || endAge < minimumEndAge || endAge > 120) {
      nextErrors.endAge = `Enter a whole-number age from ${minimumEndAge} through 120.`;
    }
    if (income === undefined || !Number.isFinite(income) || income < 0 || income > 1_000_000_000_000) {
      nextErrors.income = 'Enter annual employment income of zero or more.';
    }
    if (expenses === undefined || !Number.isFinite(expenses) || expenses < 0 || expenses > 1_000_000_000_000) {
      nextErrors.expenses = 'Enter annual expenses of zero or more.';
    }
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      setError('Check the highlighted fields, then try again.');
      const firstKey = Object.keys(nextErrors)[0];
      requestAnimationFrame(() => document.getElementById(`onboarding-${firstKey}`)?.focus());
      return;
    }
    setFieldErrors({});
    setBusy(true);
    const plan = createStarterPlan({
      firstName: firstName.trim(),
      provinceOrTerritory: province,
      dateOfBirth,
       targetRetirementAge: retirementAge!,
       planningEndAge: endAge!,
       annualEmploymentIncome: income!,
       annualExpenses: expenses!,
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
              <TextField id="onboarding-firstName" label="First name" autoComplete="given-name" value={firstName} required error={fieldErrors.firstName} onChange={(value) => { setFirstName(value); setFieldErrors((current) => ({ ...current, firstName: undefined })); }} />
              <SelectField label="Province or territory" autoComplete="address-level1" value={province} options={provinceOptions} required onChange={(value) => setProvince(value as ProvinceOrTerritory)} />
              <TextField id="onboarding-dateOfBirth" label="Date of birth" type="date" autoComplete="bday" min="1900-01-01" max={todayIsoDate} value={dateOfBirth} required error={fieldErrors.dateOfBirth} onChange={(value) => { setDateOfBirth(value); setFieldErrors((current) => ({ ...current, dateOfBirth: undefined })); }} />
            </div>
          </fieldset>

          <fieldset>
            <legend><span>02</span> Planning timeline</legend>
            <div className="form-grid two">
              <NumberField id="onboarding-retirementAge" label="Target retirement age" min={Math.max(18, currentAge ?? 18)} max={100} step={1} value={retirementAge} required error={fieldErrors.retirementAge} onChange={(value) => { setRetirementAge(value); setFieldErrors((current) => ({ ...current, retirementAge: undefined })); }} hint={currentAge === undefined ? 'Enter your date of birth to confirm the minimum.' : `You are age ${currentAge} in the ${projectionBaseYear} projection year. Use ${currentAge} if already retired.`} />
              <NumberField id="onboarding-endAge" label="Planning end age" min={Math.max(19, currentAge ?? 18, (retirementAge ?? 18) + 1)} max={120} step={1} value={endAge} required error={fieldErrors.endAge} onChange={(value) => { setEndAge(value); setFieldErrors((current) => ({ ...current, endAge: undefined })); }} hint="Ages beyond this point are not projected." />
            </div>
          </fieldset>

          <fieldset>
            <legend><span>03</span> Broad annual amounts</legend>
            <div className="form-grid two">
              <MoneyField id="onboarding-income" label="Employment income" min={0} max={1_000_000_000_000} step={1000} value={income} required error={fieldErrors.income} onChange={(value) => { setIncome(value); setFieldErrors((current) => ({ ...current, income: undefined })); }} hint="Before tax, per year. Enter $0 if none." />
              <MoneyField id="onboarding-expenses" label="Approximate expenses" min={0} max={1_000_000_000_000} step={1000} value={expenses} required error={fieldErrors.expenses} onChange={(value) => { setExpenses(value); setFieldErrors((current) => ({ ...current, expenses: undefined })); }} hint="Living costs per year. Exclude payments you will model under Debts; enter $0 if none." />
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
