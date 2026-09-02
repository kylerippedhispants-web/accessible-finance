import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FireOverview } from '../components/FireOverview';
import { ProjectionChart, type DollarView } from '../components/ProjectionChart';
import { buildFireOverviewModel } from '../dashboard/fireMetrics';
import {
  assetCategory,
  estimateFireTarget,
  hasModeledRetirementOutflow,
  projectFinances,
  projectionPassesFireScreen,
} from '../finance-engine';
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

export interface DashboardNextStep {
  id: string;
  title: string;
  description: string;
  route: string;
  action: string;
}

export function buildDashboardNextSteps(
  plan: FinancialPlan,
  scenarioCount: number,
): DashboardNextStep[] {
  const steps: DashboardNextStep[] = [];
  const collections = [
    {
      id: 'income',
      singular: 'income entry',
      plural: 'income entries',
      route: '/income',
      action: 'Review income',
      items: plan.incomeSources,
      emptyTitle: 'Add income details',
      emptyDescription: 'No income sources are included in the current projection. Add the entries you want the model to use.',
    },
    {
      id: 'expenses',
      singular: 'expense entry',
      plural: 'expense entries',
      route: '/expenses',
      action: 'Review expenses',
      items: plan.expenses,
      emptyTitle: 'Add spending details',
      emptyDescription: 'No baseline expense entries are included. Add the recurring or one-time costs you want modeled.',
    },
    {
      id: 'assets',
      singular: 'asset',
      plural: 'assets',
      route: '/assets',
      action: 'Review assets',
      items: plan.assets,
      emptyTitle: 'Add asset details',
      emptyDescription: 'No asset balances are included. Add the accounts or property you want reflected in this plan.',
    },
    {
      id: 'debts',
      singular: 'debt entry',
      plural: 'debt entries',
      route: '/debts',
      action: 'Review debts',
      items: plan.debts,
      emptyTitle: 'Confirm debt details',
      emptyDescription: 'No debt entries are included. Confirm that matches this plan, or add the balances and payment terms you want modeled.',
    },
  ] as const;

  collections.forEach((collection) => {
    if (!collection.items.length) {
      steps.push({
        id: collection.id,
        title: collection.emptyTitle,
        description: collection.emptyDescription,
        route: collection.route,
        action: collection.action,
      });
      return;
    }

    const disabledCount = collection.items.filter((item) => item.enabled === false).length;
    if (disabledCount > 0) {
      const records = disabledCount === 1 ? collection.singular : collection.plural;
      steps.push({
        id: `disabled-${collection.id}`,
        title: `Review disabled ${collection.id}`,
        description: `${disabledCount} ${records} ${disabledCount === 1 ? 'is' : 'are'} disabled and excluded from projections. Review ${disabledCount === 1 ? 'it' : 'them'} if you want to include ${disabledCount === 1 ? 'it' : 'them'}.`,
        route: collection.route,
        action: collection.action,
      });
    }
  });

  const enabledAssets = plan.assets.filter((asset) => asset.enabled !== false);
  if (enabledAssets.length > 0 && !enabledAssets.some((asset) => assetCategory(asset) === 'cash')) {
    steps.push({
      id: 'cash',
      title: 'Review cash representation',
      description: 'Enabled assets are present, but none use the cash category. Add or recategorize an asset only if you want cash shown separately in the model.',
      route: '/assets',
      action: 'Review assets',
    });
  }

  if (plan.retirement.estimatedAnnualSpending === 0) {
    steps.push({
      id: 'retirement-spending',
      title: 'Review retirement spending',
      description: 'The annual retirement-spending input is currently zero. Update it if that is not the value you want the retirement years to use.',
      route: '/retirement',
      action: 'Review retirement settings',
    });
  }

  steps.push({
    id: 'retirement-age',
    title: 'Confirm retirement timing',
    description: `Retirement assumptions start at age ${plan.retirement.targetRetirementAge}. Confirm that this is the age you want the model to use.`,
    route: '/retirement',
    action: 'Review retirement settings',
  });

  if (scenarioCount === 0) {
    steps.push({
      id: 'scenarios',
      title: 'Keep an alternative',
      description: 'No saved scenarios are attached to this plan. Use Scenarios if you want to preserve a set of differences from the baseline.',
      route: '/scenarios',
      action: 'Open scenarios',
    });
  }

  return steps;
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

function differencePhrase(value: number): string {
  if (Math.abs(value) < 0.005) return 'matches the baseline';
  return `${formatCad(Math.abs(value))} ${value > 0 ? 'above' : 'below'} the baseline`;
}

export function DashboardPage() {
  const planner = usePlanner();
  const plan = planner.snapshot!.plan;
  const nextSteps = useMemo(
    () => buildDashboardNextSteps(plan, planner.snapshot?.scenarios.length ?? 0),
    [plan, planner.snapshot?.scenarios.length],
  );
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

  const fireEstimate = useMemo(() => estimateFireTarget(plan), [plan]);
  const fireModel = useMemo(
    () => buildFireOverviewModel(plan, fireEstimate, baseline),
    [baseline, fireEstimate, plan],
  );
  const chartMilestones = useMemo(() => [
    ...(fireEstimate.status === 'estimated'
      ? [{ year: fireEstimate.year, label: 'FIRE timing', kind: 'fire' as const }]
      : []),
    { year: fireModel.plannedRetirementYear, label: 'Planned retirement', kind: 'planned' as const },
  ], [fireEstimate, fireModel.plannedRetirementYear]);
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
  const finalBaseline = baseline.at(-1)!;
  const finalComparison = comparison.at(-1)!;
  const finalBaselineValue = dollarView === 'real' ? finalBaseline.realNetWorth : finalBaseline.netWorth;
  const finalComparisonValue = dollarView === 'real' ? finalComparison.realNetWorth : finalComparison.netWorth;
  const finalWhatIfDifference = finalComparisonValue - finalBaselineValue;
  const whatIfTransition = comparison.find((row) => row.retired);
  const firstWhatIfShortfall = comparison.find((row) => row.unfundedCashFlow > 0.01);
  const whatIfHasRetirementOutflow = hasModeledRetirementOutflow(comparison);
  const whatIfPlanFunded = projectionPassesFireScreen(comparison);

  const cashFlowInsight = firstProjection.unfundedCashFlow > 0.01
    ? `The model records ${formatCad(firstProjection.unfundedCashFlow)} of unfunded cash flow in ${firstProjection.year} after available non-property assets are used.`
    : firstProjection.availableSavings < 0
      ? `Required outflows exceed projected net income by ${formatCad(Math.abs(firstProjection.availableSavings))} in ${firstProjection.year}; available assets cover the gap before a shortfall is recorded.`
      : `${formatCad(firstProjection.availableSavings)} remains in ${firstProjection.year} after taxes, spending, and debt payments, before scheduled contributions.`;
  const liabilityInsight = fireModel.debtFreeYear
    ? `Modeled liabilities remain at zero from ${fireModel.debtFreeYear} onward.`
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
          <p>See the modeled amount and year on your path to financial independence, then inspect every assumption behind it.</p>
        </div>
        <div className="as-of-card"><span>Projection starts</span><strong>{plan.baseYear}</strong><small>End-of-year values · CAD</small></div>
      </header>

      {plan.assumptions.effectiveTaxPercent === 0 && (
        <aside className="notice notice-caution tax-warning" aria-label="Tax assumption warning">
          <div><strong>Taxes are currently excluded.</strong><span>Add a user-supplied effective-tax assumption so after-tax cash flow is not overstated.</span></div>
          <Link to="/retirement">Add tax assumption</Link>
        </aside>
      )}

      <FireOverview plan={plan} model={fireModel} />

      <section className="dashboard-insights planner-input-guide" aria-labelledby="planner-input-guide-title">
        <div className="insights-heading">
          <span className="eyebrow">Add your details</span>
          <h2 id="planner-input-guide-title">How to add and save your inputs</h2>
          <Link className="text-button" to="/guide">See the full walkthrough</Link>
        </div>
        <ul>
          <li>
            <span aria-hidden="true">01</span>
            <div>
              <strong>Open the planner sections</strong>
              <p>On a phone or narrow screen, select the three-line <strong>Menu</strong> button in the top-right. On a larger screen, use the navigation on the left.</p>
            </div>
          </li>
          <li>
            <span aria-hidden="true">02</span>
            <div>
              <strong>Add each input</strong>
              <p>Choose Income, Expenses, Assets, or Debts, select its Add button, and submit the form. This updates the plan currently open on your screen.</p>
            </div>
          </li>
          <li>
            <span aria-hidden="true">03</span>
            <div>
              <strong>{planner.mode === 'demo' ? 'Save this demo session' : 'Sync the cloud plan'}</strong>
              <p>{planner.mode === 'demo'
                ? 'Choose Save changes in the header to keep the fictional demo in this browser session. Demo data is never uploaded or synced.'
                : 'Choose Save changes in the header to send the validated draft to Supabase. Saved confirms it is available after you sign in to the same account on another browser or device.'}</p>
            </div>
          </li>
        </ul>
      </section>

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
            <div><dt>Estimated FIRE year</dt><dd>{fireEstimate.status === 'estimated' ? `${fireEstimate.year} · age ${formatInteger(fireEstimate.age)}` : 'Not reached'}</dd></div>
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

      <section className="dashboard-insights dashboard-next-steps" aria-labelledby="next-steps-title">
        <div className="insights-heading">
          <span className="eyebrow">Next steps</span>
          <h2 id="next-steps-title">Build a stronger plan</h2>
        </div>
        <ul>
          {nextSteps.map((step, index) => (
            <li key={step.id}>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
                <Link className="text-button" to={step.route}>{step.action}</Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="fire-path-chart" className="panel projection-panel" aria-labelledby="projection-title">
        <div className="panel-heading projection-heading">
          <div>
            <span className="eyebrow">Your path over time</span>
            <h2 id="projection-title">Path to modeled financial independence</h2>
            <p>Inspect any year with a mouse, touch, arrow keys, or the range control. The FIRE marker shows timing only; the lines remain your planned-retirement baseline and live preview.</p>
          </div>
          <div className="segmented-control" role="group" aria-label="Dollar display">
            <button type="button" aria-pressed={dollarView === 'nominal'} onClick={() => setDollarView('nominal')}>Nominal dollars</button>
            <button type="button" aria-pressed={dollarView === 'real'} onClick={() => setDollarView('real')}>Today’s dollars</button>
          </div>
        </div>
        <ProjectionChart baseline={baseline} comparison={comparison} comparisonLabel="Live what-if" dollarView={dollarView} milestones={chartMilestones} />
      </section>

      <section id="fire-what-if" className="what-if-layout" aria-labelledby="what-if-title">
        <div className="panel what-if-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">Interactive model</span><h2 id="what-if-title">What if you changed the plan?</h2></div>
            <button className="text-button" type="button" onClick={resetWhatIf}>Reset controls</button>
          </div>
          <div className={`what-if-fire-result${whatIfPlanFunded ? ' funded' : ' not-funded'}`}>
            <div>
              <span>Live planned-retirement test · not saved</span>
              <strong>Age {whatIf.retirementAge}: {!whatIfHasRetirementOutflow ? 'needs spending inputs' : whatIfPlanFunded ? 'modeled as funded' : 'modeled shortfall'}</strong>
            </div>
            <p>{!whatIfHasRetirementOutflow
              ? 'Add retirement spending, keep recurring expenses active after retirement, or include a debt payment to run a meaningful funding test.'
              : whatIfTransition
                ? `${formatCad(dollarView === 'real' ? whatIfTransition.realOpeningModeledWithdrawableAssets : whatIfTransition.openingModeledWithdrawableAssets)} of opening modeled-withdrawable assets in ${dollarView === 'real' ? 'today’s' : 'nominal'} dollars. ${firstWhatIfShortfall ? `The first unfunded year is ${firstWhatIfShortfall.year}.` : `The screen runs through age ${finalComparison.age}.`}`
                : 'Choose a retirement age inside the projection horizon.'}</p>
          </div>
          <div className="slider-grid">
            <label>
              <span><strong>Retirement age</strong><output>{whatIf.retirementAge}</output></span>
              <input type="range" min={minimumWhatIfAge} max={maximumWhatIfAge} value={whatIf.retirementAge} aria-valuetext={`Age ${whatIf.retirementAge}`} onChange={(event) => updateWhatIf('retirementAge', Number(event.target.value))} />
            </label>
            <label>
              <span><strong>Investment return</strong><output>{whatIf.investmentReturn.toFixed(1)}%</output></span>
              <input type="range" min={-5} max={12} step={0.25} value={whatIf.investmentReturn} aria-valuetext={`${whatIf.investmentReturn.toFixed(2)} percent`} onChange={(event) => updateWhatIf('investmentReturn', Number(event.target.value))} />
            </label>
            <label>
              <span><strong>Inflation</strong><output>{whatIf.inflation.toFixed(1)}%</output></span>
              <input type="range" min={0} max={8} step={0.25} value={whatIf.inflation} aria-valuetext={`${whatIf.inflation.toFixed(2)} percent`} onChange={(event) => updateWhatIf('inflation', Number(event.target.value))} />
            </label>
            <label>
              <span><strong>Annual retirement spending</strong><output>{formatCad(whatIf.retirementSpending)}</output></span>
              <input type="range" min={0} max={Math.max(150_000, whatIf.retirementSpending)} step={1_000} value={whatIf.retirementSpending} aria-valuetext={formatCad(whatIf.retirementSpending)} onChange={(event) => updateWhatIf('retirementSpending', Number(event.target.value))} />
            </label>
            <label>
              <span><strong>Monthly investment contribution</strong><output>{formatCad(whatIf.monthlyContribution)}</output></span>
              <input type="range" min={0} max={10_000} step={100} value={whatIf.monthlyContribution} aria-valuetext={`${formatCad(whatIf.monthlyContribution)} per month`} onChange={(event) => updateWhatIf('monthlyContribution', Number(event.target.value))} />
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
