import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProjectionChart, type DollarView } from '../components/ProjectionChart';
import { assetCategory, estimateRetirementAge, projectFinances, type ProjectionYear } from '../finance-engine';
import type { FinancialPlan, PlanScenario, ScenarioOverrides } from '../domain';
import {
  formatCad,
  formatCadMetric,
  formatInteger,
  formatPercent,
} from '../lib/formatters';
import { usePlanner } from '../state/PlannerContext';
import { formatValidationError, plannerSnapshotSchema } from '../validation/planSchemas';

interface WhatIfValues {
  retirementAge: number;
  investmentReturn: number;
  inflation: number;
  retirementSpending: number;
  monthlyContribution: number;
}

function valuesDiffer(next: number, initial: number): boolean {
  return Math.abs(next - initial) > 0.000_001;
}

function initialWhatIf(plan: FinancialPlan, minimumRetirementAge = 18, maximumRetirementAge = 100): WhatIfValues {
  return {
    retirementAge: Math.max(minimumRetirementAge, Math.min(maximumRetirementAge, plan.retirement.targetRetirementAge)),
    investmentReturn: plan.retirement.investmentReturnBeforeRetirementPercent,
    inflation: plan.assumptions.generalInflationPercent,
    retirementSpending: plan.retirement.estimatedAnnualSpending,
    monthlyContribution: plan.assets
      .filter((asset) => asset.enabled !== false && assetCategory(asset) === 'investment')
      .reduce((sum, asset) => sum + (asset.annualContribution ?? 0), 0) / 12,
  };
}

function whatIfOverrides(plan: FinancialPlan, values: WhatIfValues, syntheticAssetId: string): ScenarioOverrides {
  const investments = plan.assets.filter((asset) => asset.enabled !== false && assetCategory(asset) === 'investment');
  const currentContribution = investments.reduce((sum, asset) => sum + (asset.annualContribution ?? 0), 0);
  const annualTarget = values.monthlyContribution * 12;
  const retirementAgeChanged = valuesDiffer(values.retirementAge, plan.retirement.targetRetirementAge);
  const investmentReturnChanged = valuesDiffer(
    values.investmentReturn,
    plan.retirement.investmentReturnBeforeRetirementPercent,
  );
  const inflationChanged = valuesDiffer(values.inflation, plan.assumptions.generalInflationPercent);
  const retirementSpendingChanged = valuesDiffer(values.retirementSpending, plan.retirement.estimatedAnnualSpending);
  const contributionChanged = valuesDiffer(annualTarget, currentContribution);
  const expenseUpdates = inflationChanged
    ? plan.expenses
      .filter((expense) => expense.frequency !== 'one_time' && expense.category !== 'one_time')
      .map((expense) => ({ entityId: expense.id, changes: { inflationPercent: values.inflation } }))
    : [];
  const retirement = {
    ...(retirementAgeChanged ? { targetRetirementAge: values.retirementAge } : {}),
    ...(retirementSpendingChanged ? { estimatedAnnualSpending: values.retirementSpending } : {}),
    ...(inflationChanged ? { spendingInflationPercent: values.inflation } : {}),
    ...(investmentReturnChanged ? { investmentReturnBeforeRetirementPercent: values.investmentReturn } : {}),
  };

  const overrides: ScenarioOverrides = {
    assumptions: inflationChanged ? { generalInflationPercent: values.inflation } : undefined,
    retirement: Object.keys(retirement).length ? retirement : undefined,
    expenses: expenseUpdates.length ? { update: expenseUpdates } : undefined,
  };

  if (investments.length && (investmentReturnChanged || contributionChanged)) {
    overrides.assets = {
      update: investments.map((asset) => ({
        entityId: asset.id,
        changes: {
          ...(investmentReturnChanged ? { expectedReturnPercent: values.investmentReturn } : {}),
          ...(contributionChanged ? {
            annualContribution: annualTarget * (
              currentContribution > 0
                ? (asset.annualContribution ?? 0) / currentContribution
                : 1 / investments.length
            ),
          } : {}),
        },
      })),
    };
  } else if (!investments.length && contributionChanged && annualTarget > 0) {
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

function MoneyMetric({ value, tone }: { value: number; tone?: 'positive' | 'negative' }) {
  const formatted = formatCadMetric(value);
  return (
    <div className={`money-metric${tone ? ` ${tone}` : ''}`}>
      <strong><span aria-hidden="true">{formatted.display}</span><span className="sr-only">{formatted.precise}</span></strong>
      {formatted.isCompact && <small aria-hidden="true">Exact: {formatted.precise}</small>}
    </div>
  );
}

function sustainedLiabilityFreeYear(projection: ProjectionYear[]): ProjectionYear | undefined {
  let earliest: ProjectionYear | undefined;
  for (let index = projection.length - 1; index >= 0; index -= 1) {
    if (projection[index].totalLiabilities > 0.01) break;
    earliest = projection[index];
  }
  return earliest;
}

function differencePhrase(value: number): string {
  if (Math.abs(value) < 0.005) return 'matches the baseline';
  return `${formatCad(Math.abs(value))} ${value > 0 ? 'above' : 'below'} the baseline`;
}

export function DashboardPage() {
  const planner = usePlanner();
  const plan = planner.snapshot!.plan;
  const baseline = useMemo(() => projectFinances(plan), [plan]);
  const firstProjection = baseline[0];
  const minimumWhatIfAge = Math.min(100, Math.max(18, firstProjection.age));
  const maximumWhatIfAge = Math.max(
    minimumWhatIfAge,
    Math.min(100, plan.retirement.planningEndAge - 1),
  );
  const [dollarView, setDollarView] = useState<DollarView>('real');
  const [syntheticAssetId] = useState(() => crypto.randomUUID());
  const [whatIf, setWhatIf] = useState<WhatIfValues>(() => initialWhatIf(plan, minimumWhatIfAge, maximumWhatIfAge));
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioNotice, setScenarioNotice] = useState<string>();

  useEffect(() => {
    setWhatIf(initialWhatIf(plan, minimumWhatIfAge, maximumWhatIfAge));
  }, [maximumWhatIfAge, minimumWhatIfAge, plan]);

  const estimatedRetirementAge = useMemo(() => estimateRetirementAge(plan), [plan]);
  const overrides = useMemo(() => whatIfOverrides(plan, whatIf, syntheticAssetId), [plan, syntheticAssetId, whatIf]);
  const comparison = useMemo(() => projectFinances(plan, overrides), [overrides, plan]);
  const retirementPoint = baseline.find((row) => row.age >= plan.retirement.targetRetirementAge) ?? baseline.at(-1)!;

  const startingAssets = plan.assets
    .filter((asset) => asset.enabled !== false && (asset.startYear ?? plan.baseYear) <= plan.baseYear)
    .reduce((sum, asset) => sum + asset.currentValue, 0);
  const startingDebts = plan.debts
    .filter((debt) => debt.enabled !== false && (debt.startYear ?? plan.baseYear) <= plan.baseYear)
    .reduce((sum, debt) => sum + debt.balance, 0);
  const startingNetWorth = startingAssets - startingDebts;
  const sustainedDebtFree = sustainedLiabilityFreeYear(baseline);
  const finalBaseline = baseline.at(-1)!;
  const finalComparison = comparison.at(-1)!;
  const finalBaselineValue = dollarView === 'real' ? finalBaseline.realNetWorth : finalBaseline.netWorth;
  const finalComparisonValue = dollarView === 'real' ? finalComparison.realNetWorth : finalComparison.netWorth;
  const finalWhatIfDifference = finalComparisonValue - finalBaselineValue;

  const cashFlowInsight = firstProjection.unfundedCashFlow > 0.01
    ? `The model records ${formatCad(firstProjection.unfundedCashFlow)} of unfunded cash flow in ${firstProjection.year} after available non-property assets are used.`
    : firstProjection.availableSavings < 0
      ? `Required outflows exceed projected net income by ${formatCad(Math.abs(firstProjection.availableSavings))} in ${firstProjection.year}; available assets cover the gap before a shortfall is recorded.`
      : `${formatCad(firstProjection.availableSavings)} remains in ${firstProjection.year} after taxes, spending, and debt payments, before scheduled contributions.`;
  const liabilityInsight = sustainedDebtFree
    ? `Modeled liabilities remain at zero from ${sustainedDebtFree.year} onward.`
    : `${formatCad(retirementPoint.totalLiabilities)} of modeled liabilities remain at the target retirement age.`;

  const updateWhatIf = (key: keyof WhatIfValues, value: number) => {
    setWhatIf((currentValues) => ({ ...currentValues, [key]: Number.isFinite(value) ? value : 0 }));
    setScenarioNotice(undefined);
  };

  const resetWhatIf = () => {
    setWhatIf(initialWhatIf(plan, minimumWhatIfAge, maximumWhatIfAge));
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
          <p>Starting balances and projected end-of-year results are separated below, so each number has a clear point in time.</p>
        </div>
        <div className="as-of-card"><span>Projection starts</span><strong>{plan.baseYear}</strong><small>End-of-year values · CAD</small></div>
      </header>

      {plan.assumptions.effectiveTaxPercent === 0 && (
        <aside className="notice notice-caution tax-warning" aria-label="Tax assumption warning">
          <div><strong>Taxes are currently excluded.</strong><span>Add a user-supplied effective-tax assumption so after-tax cash flow is not overstated.</span></div>
          <Link to="/retirement">Add tax assumption</Link>
        </aside>
      )}

      <section className="dashboard-story" aria-labelledby="plan-story-title">
        <h2 id="plan-story-title" className="sr-only">Plan snapshot</h2>

        <article className="summary-card starting-summary">
          <header><span className="summary-step">Starting position</span><h2>Balances as entered</h2><p>Enabled balances at the start of {plan.baseYear}, before projection activity.</p></header>
          <div className="summary-primary">
            <span>Starting net worth</span>
            <MoneyMetric value={startingNetWorth} tone={startingNetWorth < 0 ? 'negative' : 'positive'} />
          </div>
          <dl className="summary-details">
            <div><dt>Assets</dt><dd>{formatCad(startingAssets)}</dd></div>
            <div><dt>Debts</dt><dd>{formatCad(startingDebts)}</dd></div>
          </dl>
        </article>

        <article className="summary-card cashflow-summary">
          <header><span className="summary-step">Projected cash flow · {firstProjection.year}</span><h2>First modeled year</h2><p>End-of-year results after tax, spending, and required debt payments.</p></header>
          <div className="summary-primary">
            <span>Available for saving</span>
            <MoneyMetric value={firstProjection.availableSavings} tone={firstProjection.availableSavings < 0 ? 'negative' : 'positive'} />
          </div>
          <dl className="summary-details summary-details-wide">
            <div><dt>Gross income</dt><dd>{formatCad(firstProjection.grossIncome)}</dd></div>
            <div><dt>Taxes</dt><dd>{formatCad(firstProjection.taxes)}</dd></div>
            <div><dt>Spending</dt><dd>{formatCad(firstProjection.expenses)}</dd></div>
            <div><dt>Debt payments</dt><dd>{formatCad(firstProjection.debtPayments)}</dd></div>
            <div><dt>Savings rate</dt><dd>{formatPercent(firstProjection.savingsRatePercent)}</dd></div>
          </dl>
        </article>

        <article className="summary-card retirement-summary">
          <header><span className="summary-step">Retirement outlook</span><h2>At target age {plan.retirement.targetRetirementAge}</h2><p>Baseline estimate for {retirementPoint.year}; today’s dollars remove modeled inflation.</p></header>
          <div className="summary-primary">
            <span>Net worth in today’s dollars</span>
            <MoneyMetric value={retirementPoint.realNetWorth} tone={retirementPoint.realNetWorth < 0 ? 'negative' : 'positive'} />
          </div>
          <dl className="summary-details">
            <div><dt>Nominal estimate</dt><dd>{formatCad(retirementPoint.netWorth)}</dd></div>
            <div><dt>Modeled cash-flow test</dt><dd>{estimatedRetirementAge === null ? 'Not reached' : `Age ${formatInteger(estimatedRetirementAge)}`}</dd></div>
          </dl>
          <p className="summary-footnote">The cash-flow test finds the earliest tested age with no modeled unfunded cash flow through age {plan.retirement.planningEndAge}; it is not a guarantee.</p>
        </article>
      </section>

      <section className="dashboard-insights" aria-labelledby="insights-title">
        <div className="insights-heading"><span className="eyebrow">Model signals</span><h2 id="insights-title">What stands out</h2></div>
        <ul>
          <li><span aria-hidden="true">01</span><div><strong>Base-year cash flow</strong><p>{cashFlowInsight}</p></div></li>
          <li><span aria-hidden="true">02</span><div><strong>Liability runway</strong><p>{liabilityInsight}</p></div></li>
          <li><span aria-hidden="true">03</span><div><strong>Plan-level what-if</strong><p>By age {finalBaseline.age}, the current what-if {differencePhrase(finalWhatIfDifference)} in {dollarView === 'real' ? 'today’s' : 'nominal'} dollars.</p></div></li>
        </ul>
      </section>

      <section className="panel projection-panel" aria-labelledby="projection-title">
        <div className="panel-heading projection-heading">
          <div>
            <span className="eyebrow">Main projection</span>
            <h2 id="projection-title">Net worth projection</h2>
            <p>Inspect any year with a mouse, touch, arrow keys, or the range control.</p>
          </div>
          <div className="segmented-control" role="group" aria-label="Dollar display">
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
            <button className="text-button" type="button" onClick={resetWhatIf}>Reset controls</button>
          </div>
          <div className="slider-grid">
            <label>
              <span><strong>Retirement age</strong><output>{whatIf.retirementAge}</output></span>
              <input type="range" min={minimumWhatIfAge} max={maximumWhatIfAge} value={whatIf.retirementAge} onChange={(event) => updateWhatIf('retirementAge', Number(event.target.value))} />
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
              <span><strong>Annual retirement spending</strong><output>{formatCad(whatIf.retirementSpending)}</output></span>
              <input type="range" min={0} max={Math.max(150_000, whatIf.retirementSpending)} step={1_000} value={whatIf.retirementSpending} onChange={(event) => updateWhatIf('retirementSpending', Number(event.target.value))} />
            </label>
            <label>
              <span><strong>Monthly investment contribution</strong><output>{formatCad(whatIf.monthlyContribution)}</output></span>
              <input type="range" min={0} max={10_000} step={100} value={whatIf.monthlyContribution} onChange={(event) => updateWhatIf('monthlyContribution', Number(event.target.value))} />
            </label>
          </div>
          <p className="model-note">The return and inflation controls are assumptions, not forecasts. They apply plan-level values to eligible records and may differ from item-specific baseline assumptions. Retirement spending excludes payments modeled under Debts.</p>
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
