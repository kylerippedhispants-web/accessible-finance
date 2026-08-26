import { useState } from 'react';
import { MoneyField, NumberField, PercentField, SelectField, ToggleField } from '../components/FormFields';
import type { FinancialPlan, ManualRetirementBenefit, RetirementSettings } from '../domain';
import { usePlanner } from '../state/PlannerContext';

function bounded(value: number | undefined, fallback: number, minimum: number, maximum: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return value < minimum || value > maximum ? fallback : value;
}

export function RetirementPage() {
  const planner = usePlanner();
  const plan = planner.snapshot!.plan;
  const baseAge = plan.baseYear - Number(plan.profile.dateOfBirth.slice(0, 4));
  const minimumRetirementAge = Math.max(18, baseAge);
  const maximumRetirementAge = Math.min(100, plan.retirement.planningEndAge - 1);
  const [timelineError, setTimelineError] = useState<string>();

  const patchPlan = (changes: Partial<FinancialPlan>) => {
    planner.updatePlan((current) => ({ ...current, ...changes }));
  };
  const patchRetirement = (changes: Partial<RetirementSettings>) => {
    planner.updatePlan((current) => ({
      ...current,
      retirement: { ...current.retirement, ...changes },
    }));
  };
  const patchBenefit = (key: 'cpp' | 'oas', changes: Partial<ManualRetirementBenefit>) => {
    planner.updatePlan((current) => ({
      ...current,
      retirement: {
        ...current.retirement,
        [key]: { ...current.retirement[key], ...changes },
      },
    }));
  };

  const updateRetirementAge = (value: number | undefined) => {
    if (value === undefined) return;
    const next = Math.round(value);
    if (next < minimumRetirementAge || next > maximumRetirementAge) {
      setTimelineError(`Retirement age must be from ${minimumRetirementAge} through ${maximumRetirementAge}. Use ${minimumRetirementAge} if already retired.`);
      return;
    }
    setTimelineError(undefined);
    patchRetirement({ targetRetirementAge: next });
  };

  const updatePlanningEndAge = (value: number | undefined) => {
    if (value === undefined) return;
    const minimum = Math.max(19, baseAge, plan.retirement.targetRetirementAge + 1);
    const next = Math.round(value);
    if (next < minimum || next > 120) {
      setTimelineError(`Planning end age must be from ${minimum} through 120.`);
      return;
    }
    setTimelineError(undefined);
    patchRetirement({ planningEndAge: next });
  };

  return (
    <div className="page retirement-page">
      <header className="page-header">
        <div><span className="eyebrow">Timeline & assumptions</span><h1>Retirement</h1><p>Set the model’s transition point and your own transparent assumptions. Nothing here is a promise or an entitlement calculation.</p></div>
      </header>

      <section className="panel form-panel" aria-labelledby="timeline-title">
        <div className="panel-heading"><div><span className="step-number">01</span><h2 id="timeline-title">Timeline and spending</h2><p>Retirement starts in the calendar year when you reach the target age.</p></div></div>
        <div className="form-grid three">
          <NumberField label="Target retirement age" required min={minimumRetirementAge} max={maximumRetirementAge} step={1} value={plan.retirement.targetRetirementAge} onChange={updateRetirementAge} error={timelineError?.startsWith('Retirement') ? timelineError : undefined} hint={`You are age ${baseAge} in the ${plan.baseYear} projection year. Use ${minimumRetirementAge} if already retired.`} />
          <NumberField label="Planning end age" required min={Math.max(19, baseAge, plan.retirement.targetRetirementAge + 1)} max={120} step={1} value={plan.retirement.planningEndAge} onChange={updatePlanningEndAge} error={timelineError?.startsWith('Planning') ? timelineError : undefined} />
          <MoneyField label="Annual retirement spending" required min={0} max={1_000_000_000_000} step={1000} value={plan.retirement.estimatedAnnualSpending} onChange={(value) => patchRetirement({ estimatedAnnualSpending: bounded(value, plan.retirement.estimatedAnnualSpending, 0, 1_000_000_000_000) })} hint="Base-year dollars. Exclude payments modeled under Debts." />
          <PercentField label="Retirement spending inflation" required min={-10} max={20} step={0.1} value={plan.retirement.spendingInflationPercent} onChange={(value) => patchRetirement({ spendingInflationPercent: bounded(value, plan.retirement.spendingInflationPercent, -10, 20) })} />
          <SelectField
            label="Retirement expense treatment"
            value={plan.retirement.expenseMode}
            options={[
              { value: 'replace_recurring', label: 'Replace recurring expenses' },
              { value: 'add_to_recurring', label: 'Add to recurring expenses' },
            ]}
            onChange={(value) => patchRetirement({ expenseMode: value as RetirementSettings['expenseMode'] })}
            hint="One-time expenses remain in either mode."
          />
        </div>
      </section>

      <section className="panel form-panel" aria-labelledby="assumptions-title">
        <div className="panel-heading"><div><span className="step-number">02</span><h2 id="assumptions-title">Projection assumptions</h2><p>Rates are percentage points: enter 5 for 5%.</p></div></div>
        <div className="form-grid two">
          <PercentField label="Effective tax assumption" required min={0} max={100} step={0.1} value={plan.assumptions.effectiveTaxPercent} onChange={(value) => patchPlan({ assumptions: { ...plan.assumptions, effectiveTaxPercent: bounded(value, plan.assumptions.effectiveTaxPercent, 0, 100) } })} hint="Your flat estimate on taxable income. This is not a tax calculation." />
          <PercentField label="General inflation" required min={-10} max={20} step={0.1} value={plan.assumptions.generalInflationPercent} onChange={(value) => patchPlan({ assumptions: { ...plan.assumptions, generalInflationPercent: bounded(value, plan.assumptions.generalInflationPercent, -10, 20) } })} hint="Used to show values in today’s dollars." />
          <PercentField label="Investment return before retirement" required min={-100} max={100} step={0.1} value={plan.retirement.investmentReturnBeforeRetirementPercent} onChange={(value) => patchRetirement({ investmentReturnBeforeRetirementPercent: bounded(value, plan.retirement.investmentReturnBeforeRetirementPercent, -100, 100) })} />
          <PercentField label="Investment return after retirement" required min={-100} max={100} step={0.1} value={plan.retirement.investmentReturnAfterRetirementPercent} onChange={(value) => patchRetirement({ investmentReturnAfterRetirementPercent: bounded(value, plan.retirement.investmentReturnAfterRetirementPercent, -100, 100) })} />
        </div>
        <aside className="notice notice-caution" aria-label="Tax calculation limitation">
          <strong>No Canadian tax tables are applied.</strong>
          <span>The engine uses only the effective-tax percentage you enter. Registered-account tax treatment and withdrawal taxation are not yet modeled.</span>
        </aside>
      </section>

      <section className="panel form-panel" aria-labelledby="benefits-title">
        <div className="panel-heading"><div><span className="step-number">03</span><h2 id="benefits-title">Manual CPP and OAS estimates</h2><p>Use estimates from your own official records. The planner does not calculate eligibility or entitlement.</p></div></div>
        <div className="benefit-grid">
          <BenefitEditor label="CPP" benefit={plan.retirement.cpp} onChange={(changes) => patchBenefit('cpp', changes)} />
          <BenefitEditor label="OAS" benefit={plan.retirement.oas} onChange={(changes) => patchBenefit('oas', changes)} />
        </div>
      </section>

      <div className="method-note">
        <strong>Important modeling boundary.</strong>
        <p>The planner does not currently model provincial/federal tax brackets, CPP contribution history, OAS recovery tax, pension splitting, RRIF minimums, TFSA/RRSP/FHSA limits, or GIS. Unsupported rules are intentionally left out rather than guessed.</p>
      </div>
    </div>
  );
}

function BenefitEditor({
  label,
  benefit,
  onChange,
}: {
  label: string;
  benefit: ManualRetirementBenefit;
  onChange: (changes: Partial<ManualRetirementBenefit>) => void;
}) {
  return (
    <fieldset className="benefit-card">
      <legend>{label}</legend>
      <ToggleField label={`Include manual ${label} estimate`} checked={benefit.enabled} onChange={(enabled) => onChange({ enabled })} />
      <div className="form-grid two" aria-disabled={!benefit.enabled}>
        <MoneyField label="Annual amount" required={benefit.enabled} min={0} max={1_000_000_000_000} step={100} value={benefit.annualAmount} onChange={(value) => onChange({ annualAmount: bounded(value, benefit.annualAmount, 0, 1_000_000_000_000) })} disabled={!benefit.enabled} />
        <NumberField label="Start age" required={benefit.enabled} min={18} max={120} step={1} value={benefit.startAge} onChange={(value) => onChange({ startAge: Math.round(bounded(value, 65, 18, 120)) })} disabled={!benefit.enabled} />
        <PercentField label="Annual indexation" required={benefit.enabled} min={-100} max={100} step={0.1} value={benefit.annualGrowthPercent} onChange={(value) => onChange({ annualGrowthPercent: bounded(value, benefit.annualGrowthPercent, -100, 100) })} disabled={!benefit.enabled} />
        <ToggleField label="Treat as taxable" checked={benefit.taxable} disabled={!benefit.enabled} onChange={(taxable) => onChange({ taxable })} hint="Uses the plan’s flat effective-tax assumption." />
      </div>
    </fieldset>
  );
}
