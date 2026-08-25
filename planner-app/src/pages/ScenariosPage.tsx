import { useEffect, useMemo, useState } from 'react';
import { ProjectionChart, type DollarView } from '../components/ProjectionChart';
import { assetCategory, projectFinances } from '../finance-engine';
import type { FinancialPlan, PlanScenario, ScenarioOverrides } from '../domain';
import { usePlanner } from '../state/PlannerContext';
import { formatValidationError, plannerSnapshotSchema } from '../validation/planSchemas';

const currency = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });

function createScenario(plan: FinancialPlan, name: string, overrides: ScenarioOverrides, description: string): PlanScenario {
  return { id: crypto.randomUUID(), planId: plan.id, name, description, overrides };
}

export function ScenariosPage() {
  const planner = usePlanner();
  const snapshot = planner.snapshot!;
  const plan = snapshot.plan;
  const [selectedId, setSelectedId] = useState(snapshot.scenarios[0]?.id ?? '');
  const [dollarView, setDollarView] = useState<DollarView>('real');
  const [name, setName] = useState('');
  const [retirementAge, setRetirementAge] = useState(plan.retirement.targetRetirementAge);
  const [returnRate, setReturnRate] = useState(plan.retirement.investmentReturnBeforeRetirementPercent);
  const [inflation, setInflation] = useState(plan.assumptions.generalInflationPercent);
  const [spending, setSpending] = useState(plan.retirement.estimatedAnnualSpending);
  const [notice, setNotice] = useState<string>();

  useEffect(() => {
    if (selectedId && !snapshot.scenarios.some((scenario) => scenario.id === selectedId)) {
      setSelectedId(snapshot.scenarios[0]?.id ?? '');
    }
  }, [selectedId, snapshot.scenarios]);

  const selected = snapshot.scenarios.find((scenario) => scenario.id === selectedId);
  const baseline = useMemo(() => projectFinances(plan), [plan]);
  const comparison = useMemo(() => selected ? projectFinances(plan, selected) : undefined, [plan, selected]);
  const finalBaseline = baseline.at(-1)!;
  const finalComparison = comparison?.at(-1);

  const addScenario = (scenario: PlanScenario) => {
    const validated = plannerSnapshotSchema.safeParse({
      ...snapshot,
      scenarios: [...snapshot.scenarios, scenario],
    });
    if (!validated.success) {
      setNotice(`Scenario not added: ${formatValidationError(validated.error)}`);
      return;
    }
    planner.setScenarios(validated.data.scenarios);
    setSelectedId(scenario.id);
    setNotice(`“${scenario.name}” was added. Save changes to sync it.`);
  };

  const addCustom = () => {
    const scenarioName = name.trim() || 'Custom scenario';
    addScenario(createScenario(plan, scenarioName, {
      assumptions: { generalInflationPercent: inflation },
      retirement: {
        targetRetirementAge: retirementAge,
        investmentReturnBeforeRetirementPercent: returnRate,
        estimatedAnnualSpending: spending,
      },
      assets: {
        update: plan.assets
          .filter((asset) => assetCategory(asset) === 'investment')
          .map((asset) => ({ entityId: asset.id, changes: { expectedReturnPercent: returnRate } })),
      },
    }, 'Custom retirement, return, inflation, and spending assumptions.'));
    setName('');
  };

  const addPreset = (preset: 'early' | 'savings' | 'returns' | 'mortgage') => {
    if (preset === 'early') {
      const age = Math.max(baseline[0].age + 1, Math.min(55, plan.retirement.planningEndAge - 1));
      addScenario(createScenario(plan, 'Retire at 55', { retirement: { targetRetirementAge: age } }, `Moves the retirement transition to age ${age}.`));
      return;
    }
    if (preset === 'savings') {
      const investments = plan.assets.filter((asset) => assetCategory(asset) === 'investment');
      addScenario(createScenario(plan, 'Higher savings', {
        assets: investments.length ? {
          update: investments.map((asset) => ({ entityId: asset.id, changes: { annualContribution: (asset.annualContribution ?? 0) * 1.25 } })),
        } : undefined,
      }, 'Increases current investment contributions by 25%.'));
      return;
    }
    if (preset === 'returns') {
      const lower = Math.max(-100, plan.retirement.investmentReturnBeforeRetirementPercent - 2);
      addScenario(createScenario(plan, 'Lower returns', {
        retirement: {
          investmentReturnBeforeRetirementPercent: lower,
          investmentReturnAfterRetirementPercent: Math.max(-100, plan.retirement.investmentReturnAfterRetirementPercent - 2),
        },
        assets: {
          update: plan.assets.filter((asset) => assetCategory(asset) === 'investment')
            .map((asset) => ({ entityId: asset.id, changes: { expectedReturnPercent: Math.max(-100, (asset.expectedReturnPercent ?? lower + 2) - 2) } })),
        },
      }, 'Reduces modeled investment returns by two percentage points.'));
      return;
    }
    addScenario(createScenario(plan, 'Pay debt faster', {
      debts: {
        update: plan.debts.map((debt) => ({ entityId: debt.id, changes: { extraPaymentAmount: Math.max(50, (debt.extraPaymentAmount ?? 0) + debt.paymentAmount * 0.25) } })),
      },
    }, 'Adds an extra payment equal to 25% of each regular payment.'));
  };

  const deleteScenario = (scenario: PlanScenario) => {
    if (!window.confirm(`Delete the “${scenario.name}” scenario? The baseline plan will not change.`)) return;
    planner.setScenarios(snapshot.scenarios.filter((item) => item.id !== scenario.id));
    setNotice(`“${scenario.name}” was removed. Save changes to sync the deletion.`);
  };

  const renameScenario = (scenario: PlanScenario, nextName: string) => {
    const trimmed = nextName.trim();
    if (!trimmed || trimmed === scenario.name) return;
    const scenarios = snapshot.scenarios.map((item) => item.id === scenario.id ? { ...item, name: trimmed } : item);
    const validated = plannerSnapshotSchema.safeParse({ ...snapshot, scenarios });
    if (!validated.success) {
      setNotice(`Scenario not renamed: ${formatValidationError(validated.error)}`);
      return;
    }
    planner.setScenarios(validated.data.scenarios);
  };

  return (
    <div className="page scenarios-page">
      <header className="page-header">
        <div><span className="eyebrow">Explore uncertainty</span><h1>Scenarios</h1><p>Compare sparse differences against one baseline. Scenario changes never rewrite your core plan.</p></div>
      </header>

      <section className="scenario-preset-grid" aria-labelledby="presets-title">
        <div className="section-intro"><span className="eyebrow">Quick starts</span><h2 id="presets-title">Stress-test a familiar idea.</h2></div>
        <button type="button" onClick={() => addPreset('early')}><span>Earlier retirement</span><strong>Retire at 55</strong><small>Changes the retirement transition.</small></button>
        <button type="button" onClick={() => addPreset('savings')}><span>Higher savings</span><strong>Contribute 25% more</strong><small>Adjusts existing investment contributions.</small></button>
        <button type="button" onClick={() => addPreset('returns')}><span>Lower returns</span><strong>Reduce returns by 2%</strong><small>Uses percentage points, not a forecast.</small></button>
        <button type="button" onClick={() => addPreset('mortgage')} disabled={!plan.debts.length}><span>Debt payoff</span><strong>Pay debt faster</strong><small>Adds 25% to regular payments.</small></button>
      </section>

      {notice && <p className="form-status scenario-notice" role="status">{notice}</p>}

      <div className="scenario-workspace">
        <aside className="panel scenario-list" aria-labelledby="saved-scenarios-title">
          <div className="panel-heading"><div><span className="eyebrow">Saved differences</span><h2 id="saved-scenarios-title">Your scenarios</h2></div><span className="count-badge">{snapshot.scenarios.length}</span></div>
          {!snapshot.scenarios.length ? (
            <div className="empty-state"><strong>No saved scenarios yet.</strong><p>Choose a quick start or build a custom comparison.</p></div>
          ) : (
            <div className="scenario-items">
              {snapshot.scenarios.map((scenario) => (
                <article key={scenario.id} className={scenario.id === selectedId ? 'selected' : undefined}>
                  <button type="button" className="scenario-select" onClick={() => setSelectedId(scenario.id)} aria-pressed={scenario.id === selectedId}>
                    <strong>{scenario.name}</strong><span>{scenario.description || 'Custom scenario'}</span>
                  </button>
                  <div className="item-actions">
                    <button type="button" onClick={() => {
                      const nextName = window.prompt('Rename scenario', scenario.name);
                      if (nextName !== null) renameScenario(scenario, nextName);
                    }}>Rename</button>
                    <button type="button" className="danger" onClick={() => deleteScenario(scenario)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </aside>

        <section className="panel scenario-comparison" aria-labelledby="comparison-title">
          <div className="panel-heading">
            <div><span className="eyebrow">Baseline comparison</span><h2 id="comparison-title">{selected ? `Baseline vs ${selected.name}` : 'Choose a scenario'}</h2></div>
            <div className="segmented-control" aria-label="Dollar display">
              <button type="button" aria-pressed={dollarView === 'nominal'} onClick={() => setDollarView('nominal')}>Nominal</button>
              <button type="button" aria-pressed={dollarView === 'real'} onClick={() => setDollarView('real')}>Today’s dollars</button>
            </div>
          </div>
          {selected && comparison ? (
            <>
              <div className="comparison-stats">
                <div><span>Baseline at age {finalBaseline.age}</span><strong>{currency.format(dollarView === 'real' ? finalBaseline.realNetWorth : finalBaseline.netWorth)}</strong></div>
                <div><span>{selected.name}</span><strong>{currency.format(dollarView === 'real' ? finalComparison!.realNetWorth : finalComparison!.netWorth)}</strong></div>
                <div><span>Difference</span><strong>{currency.format((dollarView === 'real' ? finalComparison!.realNetWorth - finalBaseline.realNetWorth : finalComparison!.netWorth - finalBaseline.netWorth))}</strong></div>
              </div>
              <ProjectionChart baseline={baseline} comparison={comparison} comparisonLabel={selected.name} dollarView={dollarView} />
            </>
          ) : <div className="empty-state chart-empty"><p>Create or choose a scenario to compare both projection lines.</p></div>}
        </section>
      </div>

      <section className="panel custom-scenario" aria-labelledby="custom-title">
        <div className="panel-heading"><div><span className="eyebrow">Build your own</span><h2 id="custom-title">Custom scenario</h2><p>These values become sparse overrides; they do not duplicate the baseline.</p></div></div>
        <div className="form-grid five">
          <label className="field"><span className="field-label">Scenario name</span><input type="text" maxLength={100} value={name} placeholder="e.g. Take a sabbatical" onChange={(event) => setName(event.target.value)} /></label>
          <label className="field"><span className="field-label">Retirement age</span><input type="number" min={18} max={100} value={retirementAge} onChange={(event) => setRetirementAge(Number(event.target.value))} /></label>
          <label className="field"><span className="field-label">Investment return (%)</span><input type="number" min={-100} max={100} step={0.1} value={returnRate} onChange={(event) => setReturnRate(Number(event.target.value))} /></label>
          <label className="field"><span className="field-label">Inflation (%)</span><input type="number" min={-100} max={100} step={0.1} value={inflation} onChange={(event) => setInflation(Number(event.target.value))} /></label>
          <label className="field"><span className="field-label">Retirement spending</span><input type="number" min={0} step={1000} value={spending} onChange={(event) => setSpending(Number(event.target.value))} /></label>
        </div>
        <button className="button button-primary" type="button" onClick={addCustom}>Add custom scenario</button>
      </section>

      <div className="method-note"><strong>Scenarios are comparisons, not forecasts.</strong><p>Try ranges instead of searching for one “correct” return or inflation number. Save only the comparisons that help you make a decision.</p></div>
    </div>
  );
}
