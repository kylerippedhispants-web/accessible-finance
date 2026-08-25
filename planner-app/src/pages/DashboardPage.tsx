import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProjectionChart, type DollarView } from '../components/ProjectionChart';
import { assetCategory, estimateRetirementAge, projectFinances, type ProjectionYear } from '../finance-engine';
import type { FinancialPlan, PlanScenario, ScenarioOverrides } from '../domain';
import { usePlanner } from '../state/PlannerContext';
import { formatValidationError, plannerSnapshotSchema } from '../validation/planSchemas';

const currency = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
});
const percent = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 1 });

interface WhatIfValues {
  retirementAge: number;
  investmentReturn: number;
  inflation: number;
  retirementSpending: number;
  monthlyContribution: number;
}

function initialWhatIf(plan: FinancialPlan): WhatIfValues {
  return {
    retirementAge: plan.retirement.targetRetirementAge,
    investmentReturn: plan.retirement.investmentReturnBeforeRetirementPercent,
    inflation: plan.assumptions.generalInflationPercent,
    retirementSpending: plan.retirement.estimatedAnnualSpending,
    monthlyContribution: plan.assets.reduce((sum, asset) => sum + (asset.annualContribution ?? 0), 0) / 12,
  };
}

function whatIfOverrides(plan: FinancialPlan, values: WhatIfValues, syntheticAssetId: string): ScenarioOverrides {
  const investments = plan.assets.filter((asset) => assetCategory(asset) === 'investment');
  const currentContribution = investments.reduce((sum, asset) => sum + (asset.annualContribution ?? 0), 0);
  const annualTarget = values.monthlyContribution * 12;
  const expenseUpdates = plan.expenses
    .filter((expense) => expense.frequency !== 'one_time' && expense.category !== 'one_time')
    .map((expense) => ({ entityId: expense.id, changes: { inflationPercent: values.inflation } }));

  const overrides: ScenarioOverrides = {
    assumptions: { generalInflationPercent: values.inflation },
    retirement: {
      targetRetirementAge: values.retirementAge,
      estimatedAnnualSpending: values.retirementSpending,
      spendingInflationPercent: values.inflation,
      investmentReturnBeforeRetirementPercent: values.investmentReturn,
    },
    expenses: expenseUpdates.length ? { update: expenseUpdates } : undefined,
  };

  if (investments.length) {
    overrides.assets = {
      update: investments.map((asset) => ({
        entityId: asset.id,
        changes: {
          expectedReturnPercent: values.investmentReturn,
          annualContribution: annualTarget * (
            currentContribution > 0
              ? (asset.annualContribution ?? 0) / currentContribution
              : 1 / investments.length
          ),
        },
      })),
    };
  } else if (annualTarget > 0) {
    overrides.assets = {
      add: [{
        id: syntheticAssetId,
        planId: plan.id,
        name: 'What-if investment account',
        type: 'non_registered_investment',
        currentValue: 0,
        expectedReturnPercent: values.investmentReturn,
        annualContribution: annualTarget,
        contributionFrequency: 'monthly',
        contributionStartYear: plan.baseYear,
      }],
    };
  }
  return overrides;
}

function MetricCard({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: 'positive' | 'negative' }) {
  return (
    <article className={`metric-card${tone ? ` ${tone}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}

export function DashboardPage() {
  const planner = usePlanner();
  const plan = planner.snapshot!.plan;
  const [dollarView, setDollarView] = useState<DollarView>('real');
  const [syntheticAssetId] = useState(() => crypto.randomUUID());
  const [whatIf, setWhatIf] = useState<WhatIfValues>(() => initialWhatIf(plan));
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioNotice, setScenarioNotice] = useState<string>();

  useEffect(() => {
    setWhatIf(initialWhatIf(plan));
  }, [plan.id]);

  const baseline = useMemo(() => projectFinances(plan), [plan]);
  const estimatedRetirementAge = useMemo(() => estimateRetirementAge(plan), [plan]);
  const overrides = useMemo(() => whatIfOverrides(plan, whatIf, syntheticAssetId), [plan, syntheticAssetId, whatIf]);
  const comparison = useMemo(() => projectFinances(plan, overrides), [overrides, plan]);
  const current = baseline[0];
  const retirementPoint = baseline.find((row) => row.age >= plan.retirement.targetRetirementAge) ?? baseline.at(-1)!;
  const annualIncome = plan.incomeSources.reduce((sum, source) => {
    if (source.startYear > plan.baseYear || (source.endYear && source.endYear < plan.baseYear)) return sum;
    const multiplier = source.frequency === 'monthly' ? 12 : source.frequency === 'biweekly' ? 26 : 1;
    return sum + source.amount * multiplier;
  }, 0);
  const annualExpenses = current?.expenses ?? 0;
  const currentSavings = current?.availableSavings ?? annualIncome - annualExpenses;

  const updateWhatIf = (key: keyof WhatIfValues, value: number) => {
    setWhatIf((currentValues) => ({ ...currentValues, [key]: Number.isFinite(value) ? value : 0 }));
    setScenarioNotice(undefined);
  };

  const saveScenario = () => {
    const name = scenarioName.trim() || 'New what-if scenario';
    const scenario: PlanScenario = {
      id: crypto.randomUUID(),
      planId: plan.id,
      name,
      description: 'Created from the dashboard what-if controls.',
      overrides,
    };
    const nextSnapshot = {
      ...planner.snapshot!,
      scenarios: [...(planner.snapshot?.scenarios ?? []), scenario],
    };
    const validated = plannerSnapshotSchema.safeParse(nextSnapshot);
    if (!validated.success) {
      setScenarioNotice(`Scenario not added: ${formatValidationError(validated.error)}`);
      return;
    }
    planner.setScenarios(validated.data.scenarios);
    setScenarioName('');
    setScenarioNotice(`“${name}” is ready. Save changes to sync it.`);
  };

  return (
    <div className="page dashboard-page">
      <header className="page-header dashboard-header">
        <div>
          <span className="eyebrow">Financial overview</span>
          <h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {plan.profile.firstName || 'there'}.</h1>
          <p>Your baseline uses inputs saved in the plan. The what-if comparison remains temporary until you save it as a scenario.</p>
        </div>
        <div className="as-of-card"><span>Projection starts</span><strong>{plan.baseYear}</strong><small>End-of-year values · CAD</small></div>
      </header>

      {plan.assumptions.effectiveTaxPercent === 0 && (
        <aside className="notice notice-caution tax-warning" aria-label="Tax assumption warning">
          <div><strong>Taxes are currently excluded.</strong><span>Add a user-supplied effective-tax assumption so after-tax cash flow is not overstated.</span></div>
          <Link to="/retirement">Add tax assumption</Link>
        </aside>
      )}

      <section className="metrics-grid" aria-label="Plan summary">
        <MetricCard label="Current net worth" value={currency.format(current?.netWorth ?? 0)} tone={(current?.netWorth ?? 0) < 0 ? 'negative' : 'positive'} />
        <MetricCard label="Total assets" value={currency.format(current?.totalAssets ?? 0)} />
        <MetricCard label="Total debt" value={currency.format(current?.totalLiabilities ?? 0)} />
        <MetricCard label="Annual gross income" value={currency.format(annualIncome)} />
        <MetricCard label="Annual expenses" value={currency.format(annualExpenses)} note="Projected in the base year" />
        <MetricCard label="Annual savings" value={currency.format(currentSavings)} tone={currentSavings < 0 ? 'negative' : 'positive'} />
        <MetricCard label="Savings rate" value={`${percent.format(current?.savingsRatePercent ?? 0)}%`} note="After tax, expenses, and debt payments" />
        <MetricCard
          label="Estimated retirement age"
          value={estimatedRetirementAge === null ? 'Not reached' : estimatedRetirementAge.toString()}
          note={estimatedRetirementAge === null
            ? `No tested age through ${Math.min(100, plan.retirement.planningEndAge - 1)} met the modeled cash-flow test`
            : `Earliest age with no modeled unfunded cash flow through age ${plan.retirement.planningEndAge}; not a guarantee`}
        />
        <MetricCard label="Net worth at retirement" value={currency.format(retirementPoint.netWorth)} note="Nominal baseline estimate" />
      </section>

      <section className="panel projection-panel" aria-labelledby="projection-title">
        <div className="panel-heading projection-heading">
          <div>
            <span className="eyebrow">Main projection</span>
            <h2 id="projection-title">Net Worth Projection</h2>
            <p>Hover, touch, or use the keyboard year inspector for detailed values.</p>
          </div>
          <div className="segmented-control" aria-label="Dollar display">
            <button type="button" aria-pressed={dollarView === 'nominal'} onClick={() => setDollarView('nominal')}>Nominal dollars</button>
            <button type="button" aria-pressed={dollarView === 'real'} onClick={() => setDollarView('real')}>Today’s dollars</button>
          </div>
        </div>
        <ProjectionChart baseline={baseline} comparison={comparison} comparisonLabel="Live what-if" dollarView={dollarView} />
      </section>

      <section className="what-if-layout" aria-labelledby="what-if-title">
        <div className="panel what-if-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">Interactive model</span><h2 id="what-if-title">What if you changed the plan?</h2></div>
            <button className="text-button" type="button" onClick={() => setWhatIf(initialWhatIf(plan))}>Reset controls</button>
          </div>
          <div className="slider-grid">
            <label>
              <span><strong>Retirement age</strong><output>{whatIf.retirementAge}</output></span>
              <input type="range" min={Math.max(40, baseline[0].age + 1)} max={Math.min(80, plan.retirement.planningEndAge - 1)} value={whatIf.retirementAge} onChange={(event) => updateWhatIf('retirementAge', Number(event.target.value))} />
            </label>
            <label>
              <span><strong>Investment return</strong><output>{whatIf.investmentReturn.toFixed(1)}%</output></span>
              <input type="range" min={-5} max={12} step={0.25} value={whatIf.investmentReturn} onChange={(event) => updateWhatIf('investmentReturn', Number(event.target.value))} />
            </label>
            <label>
              <span><strong>Inflation</strong><output>{whatIf.inflation.toFixed(1)}%</output></span>
              <input type="range" min={0} max={8} step={0.25} value={whatIf.inflation} onChange={(event) => updateWhatIf('inflation', Number(event.target.value))} />
            </label>
            <label>
              <span><strong>Annual retirement spending</strong><output>{currency.format(whatIf.retirementSpending)}</output></span>
              <input type="range" min={0} max={Math.max(150_000, whatIf.retirementSpending)} step={1_000} value={whatIf.retirementSpending} onChange={(event) => updateWhatIf('retirementSpending', Number(event.target.value))} />
            </label>
            <label>
              <span><strong>Monthly investment contribution</strong><output>{currency.format(whatIf.monthlyContribution)}</output></span>
              <input type="range" min={0} max={10_000} step={100} value={whatIf.monthlyContribution} onChange={(event) => updateWhatIf('monthlyContribution', Number(event.target.value))} />
            </label>
          </div>
          <p className="model-note">The return and inflation controls are assumptions, not forecasts. They temporarily override applicable plan inputs. Retirement spending excludes payments modeled under Debts.</p>
        </div>

        <aside className="panel scenario-save-card" aria-labelledby="save-scenario-title">
          <span className="eyebrow">Keep this version</span>
          <h2 id="save-scenario-title">Save the what-if as a scenario.</h2>
          <p>Only differences from the baseline are stored. Your core plan remains unchanged.</p>
          <label><span>Scenario name</span><input type="text" maxLength={100} placeholder="e.g. Retire at 58" value={scenarioName} onChange={(event) => setScenarioName(event.target.value)} /></label>
          <button className="button button-primary button-wide" type="button" onClick={saveScenario}>Add scenario</button>
          {scenarioNotice && <p className="form-status" role="status">{scenarioNotice}</p>}
        </aside>
      </section>

      <div className="method-note">
        <strong>How to read this.</strong>
        <p>Projection results are deterministic estimates from your inputs. They do not model investment volatility, account contribution limits, tax brackets, fees, or automatic CPP/OAS entitlement. Negative cash flow draws non-property assets before creating a shortfall liability.</p>
      </div>
    </div>
  );
}
