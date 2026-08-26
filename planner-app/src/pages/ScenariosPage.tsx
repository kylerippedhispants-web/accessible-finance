import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { MoneyField, NumberField, PercentField, TextField } from '../components/FormFields';
import { ProjectionChart, type DollarView } from '../components/ProjectionChart';
import { applyScenarioOverrides, assetCategory, projectFinances } from '../finance-engine';
import type { FinancialPlan, PlanScenario, ScenarioOverrides } from '../domain';
import { formatCad, formatCadDelta, formatPercent } from '../lib/formatters';
import { usePlanner } from '../state/PlannerContext';
import { formatValidationError, plannerSnapshotSchema } from '../validation/planSchemas';

export interface ScenarioDraft {
  id: string;
  mode: 'create' | 'edit';
  name: string;
  description: string;
  retirementAge: number | undefined;
  returnRate: number | undefined;
  inflation: number | undefined;
  spending: number | undefined;
  baseOverrides: ScenarioOverrides;
  touched: Record<'retirementAge' | 'returnRate' | 'inflation' | 'spending', boolean>;
}

interface Notice {
  message: string;
  error?: boolean;
}

function createScenario(
  plan: FinancialPlan,
  name: string,
  overrides: ScenarioOverrides,
  description: string,
  id: string = crypto.randomUUID(),
): PlanScenario {
  return { id, planId: plan.id, name, description, overrides };
}

export function makeDraft(plan: FinancialPlan, scenario?: PlanScenario): ScenarioDraft {
  const effective = scenario ? applyScenarioOverrides(plan, scenario) : plan;
  return {
    id: scenario?.id ?? crypto.randomUUID(),
    mode: scenario && scenario.id ? 'edit' : 'create',
    name: scenario?.name ?? '',
    description: scenario?.description ?? '',
    retirementAge: effective.retirement.targetRetirementAge,
    returnRate: effective.retirement.investmentReturnBeforeRetirementPercent,
    inflation: effective.assumptions.generalInflationPercent,
    spending: effective.retirement.estimatedAnnualSpending,
    baseOverrides: structuredClone(scenario?.overrides ?? {}),
    touched: { retirementAge: false, returnRate: false, inflation: false, spending: false },
  };
}

export function controlledOverrides(plan: FinancialPlan, draft: ScenarioDraft): ScenarioOverrides {
  const overrides = structuredClone(draft.baseOverrides);
  const assumptions = { ...(overrides.assumptions ?? {}) };
  if (draft.inflation !== plan.assumptions.generalInflationPercent) {
    assumptions.generalInflationPercent = draft.inflation;
  } else {
    delete assumptions.generalInflationPercent;
  }
  overrides.assumptions = Object.keys(assumptions).length ? assumptions : undefined;

  const retirement = { ...(overrides.retirement ?? {}) };
  const setRetirementDifference = <K extends 'targetRetirementAge' | 'investmentReturnBeforeRetirementPercent' | 'estimatedAnnualSpending'>(
    key: K,
    value: FinancialPlan['retirement'][K] | undefined,
  ) => {
    if (value !== plan.retirement[key]) retirement[key] = value as never;
    else delete retirement[key];
  };
  setRetirementDifference('targetRetirementAge', draft.retirementAge);
  setRetirementDifference('investmentReturnBeforeRetirementPercent', draft.returnRate);
  setRetirementDifference('estimatedAnnualSpending', draft.spending);
  overrides.retirement = Object.keys(retirement).length ? retirement : undefined;

  if (draft.touched.returnRate) {
    const existingAssetUpdates = overrides.assets?.update?.map((update) => ({
      ...update,
      changes: { ...update.changes },
    })) ?? [];
    const investments = plan.assets.filter((asset) => asset.enabled !== false && assetCategory(asset) === 'investment');
    for (const asset of investments) {
      const existing = existingAssetUpdates.find((update) => update.entityId === asset.id);
      const baselineRate = asset.expectedReturnPercent ?? plan.retirement.investmentReturnBeforeRetirementPercent;
      if (existing) {
        if (draft.returnRate === baselineRate) delete existing.changes.expectedReturnPercent;
        else existing.changes.expectedReturnPercent = draft.returnRate;
      } else if (draft.returnRate !== baselineRate) {
        existingAssetUpdates.push({ entityId: asset.id, changes: { expectedReturnPercent: draft.returnRate } });
      }
    }
    const meaningfulUpdates = existingAssetUpdates.filter((update) => Object.keys(update.changes).length);
    if (overrides.assets || meaningfulUpdates.length) {
      const assets = { ...(overrides.assets ?? {}), update: meaningfulUpdates.length ? meaningfulUpdates : undefined };
      overrides.assets = assets.add?.length || assets.removeIds?.length || assets.update?.length ? assets : undefined;
    }
  }

  return overrides;
}

function scenarioDifferences(plan: FinancialPlan, scenario: PlanScenario): string[] {
  const effective = applyScenarioOverrides(plan, scenario);
  const differences: string[] = [];
  if (effective.retirement.targetRetirementAge !== plan.retirement.targetRetirementAge) {
    differences.push(`Retirement age: ${plan.retirement.targetRetirementAge} → ${effective.retirement.targetRetirementAge}`);
  }
  if (effective.retirement.investmentReturnBeforeRetirementPercent !== plan.retirement.investmentReturnBeforeRetirementPercent) {
    differences.push(`Pre-retirement return: ${formatPercent(plan.retirement.investmentReturnBeforeRetirementPercent, 2)} → ${formatPercent(effective.retirement.investmentReturnBeforeRetirementPercent, 2)}`);
  }
  if (effective.retirement.investmentReturnAfterRetirementPercent !== plan.retirement.investmentReturnAfterRetirementPercent) {
    differences.push(`Post-retirement return: ${formatPercent(plan.retirement.investmentReturnAfterRetirementPercent, 2)} → ${formatPercent(effective.retirement.investmentReturnAfterRetirementPercent, 2)}`);
  }
  if (effective.assumptions.generalInflationPercent !== plan.assumptions.generalInflationPercent) {
    differences.push(`General inflation: ${formatPercent(plan.assumptions.generalInflationPercent, 2)} → ${formatPercent(effective.assumptions.generalInflationPercent, 2)}`);
  }
  if (effective.retirement.estimatedAnnualSpending !== plan.retirement.estimatedAnnualSpending) {
    differences.push(`Annual retirement spending: ${formatCad(plan.retirement.estimatedAnnualSpending)} → ${formatCad(effective.retirement.estimatedAnnualSpending)}`);
  }

  const collectionLabels = [
    ['income source', scenario.overrides.incomeSources],
    ['expense', scenario.overrides.expenses],
    ['asset', scenario.overrides.assets],
    ['debt', scenario.overrides.debts],
  ] as const;
  for (const [label, collection] of collectionLabels) {
    const count = (collection?.add?.length ?? 0) + (collection?.update?.length ?? 0) + (collection?.removeIds?.length ?? 0);
    if (count) differences.push(`${count} ${label}${count === 1 ? '' : 's'} changed`);
  }
  return differences;
}

function uniqueCopyName(name: string, scenarios: readonly PlanScenario[]): string {
  const existing = new Set(scenarios.map((scenario) => scenario.name.toLocaleLowerCase('en-CA')));
  const base = `Copy of ${name}`.slice(0, 100);
  if (!existing.has(base.toLocaleLowerCase('en-CA'))) return base;
  let counter = 2;
  while (counter < 1000) {
    const suffix = ` (${counter})`;
    const candidate = `${base.slice(0, 100 - suffix.length)}${suffix}`;
    if (!existing.has(candidate.toLocaleLowerCase('en-CA'))) return candidate;
    counter += 1;
  }
  return `Scenario ${crypto.randomUUID().slice(0, 8)}`;
}

export function ScenariosPage() {
  const planner = usePlanner();
  const snapshot = planner.snapshot!;
  const plan = snapshot.plan;
  const baseAge = plan.baseYear - Number(plan.profile.dateOfBirth.slice(0, 4));
  const minimumRetirementAge = Math.max(18, baseAge);
  const maximumRetirementAge = Math.min(100, plan.retirement.planningEndAge - 1);
  const [selectedId, setSelectedId] = useState('');
  const [preview, setPreview] = useState<PlanScenario>();
  const [draft, setDraft] = useState<ScenarioDraft>();
  const [dollarView, setDollarView] = useState<DollarView>('real');
  const [notice, setNotice] = useState<Notice>();
  const [renamingId, setRenamingId] = useState<string>();
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    if (selectedId && !snapshot.scenarios.some((scenario) => scenario.id === selectedId)) {
      setSelectedId('');
      setPreview(undefined);
      setDraft(undefined);
    }
  }, [selectedId, snapshot.scenarios]);

  useEffect(() => {
    if (renamingId) document.getElementById('scenario-rename-input')?.focus();
  }, [renamingId]);

  const selected = snapshot.scenarios.find((scenario) => scenario.id === selectedId);
  const comparedScenario = preview ?? selected;
  const baseline = useMemo(() => projectFinances(plan), [plan]);
  const comparison = useMemo(
    () => comparedScenario ? projectFinances(plan, comparedScenario) : undefined,
    [comparedScenario, plan],
  );
  const differences = useMemo(
    () => comparedScenario ? scenarioDifferences(plan, comparedScenario) : [],
    [comparedScenario, plan],
  );
  const finalBaseline = baseline.at(-1)!;
  const finalComparison = comparison?.at(-1);
  const baselineFinalValue = dollarView === 'real' ? finalBaseline.realNetWorth : finalBaseline.netWorth;
  const comparisonFinalValue = finalComparison
    ? (dollarView === 'real' ? finalComparison.realNetWorth : finalComparison.netWorth)
    : undefined;
  const investmentsWithSavings = plan.assets.filter(
    (asset) => asset.enabled !== false && assetCategory(asset) === 'investment' && (asset.annualContribution ?? 0) > 0,
  );
  const enabledDebts = plan.debts.filter((debt) => debt.enabled !== false);
  const canPreviewEarlierRetirement = minimumRetirementAge <= maximumRetirementAge;

  const validateCandidate = (candidate: PlanScenario) => {
    const scenarios = snapshot.scenarios.some((scenario) => scenario.id === candidate.id)
      ? snapshot.scenarios.map((scenario) => scenario.id === candidate.id ? candidate : scenario)
      : [...snapshot.scenarios, candidate];
    return plannerSnapshotSchema.safeParse({ ...snapshot, scenarios });
  };

  const showPreview = (scenario: PlanScenario, nextDraft: ScenarioDraft) => {
    const validated = validateCandidate(scenario);
    if (!validated.success) {
      setNotice({ message: `Preview unavailable: ${formatValidationError(validated.error)}`, error: true });
      return;
    }
    if (!scenarioDifferences(plan, scenario).length) {
      setNotice({ message: 'Change at least one baseline value before previewing this scenario.', error: true });
      return;
    }
    setSelectedId(nextDraft.mode === 'edit' ? scenario.id : '');
    setDraft(nextDraft);
    setPreview(scenario);
    setNotice({ message: `Previewing “${scenario.name}”. It has not been added or updated yet.` });
  };

  const beginPreset = (preset: 'early' | 'savings' | 'returns' | 'debt') => {
    let scenario: PlanScenario;
    if (preset === 'early') {
      const age = Math.min(maximumRetirementAge, Math.max(minimumRetirementAge, 55));
      scenario = createScenario(plan, `Retire at ${age}`, { retirement: { targetRetirementAge: age } }, `Moves the retirement transition to age ${age}.`);
    } else if (preset === 'savings') {
      scenario = createScenario(plan, 'Higher savings', {
        assets: {
          update: investmentsWithSavings.map((asset) => ({
            entityId: asset.id,
            changes: { annualContribution: (asset.annualContribution ?? 0) * 1.25 },
          })),
        },
      }, 'Increases existing investment contributions by 25%.');
    } else if (preset === 'returns') {
      const lower = Math.max(-100, plan.retirement.investmentReturnBeforeRetirementPercent - 2);
      scenario = createScenario(plan, 'Lower returns', {
        retirement: {
          investmentReturnBeforeRetirementPercent: lower,
          investmentReturnAfterRetirementPercent: Math.max(-100, plan.retirement.investmentReturnAfterRetirementPercent - 2),
        },
        assets: {
          update: plan.assets.filter((asset) => asset.enabled !== false && assetCategory(asset) === 'investment').map((asset) => ({
            entityId: asset.id,
            changes: { expectedReturnPercent: Math.max(-100, (asset.expectedReturnPercent ?? lower + 2) - 2) },
          })),
        },
      }, 'Reduces modeled investment returns by two percentage points.');
    } else {
      scenario = createScenario(plan, 'Pay debt faster', {
        debts: {
          update: enabledDebts.map((debt) => ({
            entityId: debt.id,
            changes: { extraPaymentAmount: Math.max(50, (debt.extraPaymentAmount ?? 0) + debt.paymentAmount * 0.25) },
          })),
        },
      }, 'Adds an extra payment equal to 25% of each regular payment.');
    }
    const nextDraft = { ...makeDraft(plan, scenario), mode: 'create' as const };
    showPreview(scenario, nextDraft);
  };

  const beginCreate = () => {
    setSelectedId('');
    setPreview(undefined);
    setDraft(makeDraft(plan));
    setNotice({ message: 'Enter differences, then choose Preview changes. Nothing is saved yet.' });
  };

  const beginEdit = (scenario: PlanScenario) => {
    setSelectedId(scenario.id);
    setPreview(undefined);
    setDraft(makeDraft(plan, scenario));
    setNotice({ message: `Editing “${scenario.name}”. Preview before updating it.` });
  };

  const updateDraft = (changes: Partial<ScenarioDraft>) => {
    setDraft((current) => current ? { ...current, ...changes } : current);
    setPreview(undefined);
    setNotice(undefined);
  };

  const updateControlled = <K extends keyof ScenarioDraft['touched']>(key: K, value: ScenarioDraft[K]) => {
    setDraft((current) => current ? {
      ...current,
      [key]: value,
      touched: { ...current.touched, [key]: true },
    } : current);
    setPreview(undefined);
    setNotice(undefined);
  };

  const previewDraft = () => {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) {
      setNotice({ message: 'Enter a scenario name before previewing.', error: true });
      return;
    }
    if (draft.retirementAge === undefined || !Number.isInteger(draft.retirementAge)
      || draft.retirementAge < minimumRetirementAge || draft.retirementAge > maximumRetirementAge) {
      setNotice({ message: `Retirement age must be from ${minimumRetirementAge} through ${maximumRetirementAge}.`, error: true });
      return;
    }
    if (draft.returnRate === undefined || draft.returnRate < -100 || draft.returnRate > 100) {
      setNotice({ message: 'Investment return must be from -100% through 100%.', error: true });
      return;
    }
    if (draft.inflation === undefined || draft.inflation <= -100 || draft.inflation > 100) {
      setNotice({ message: 'Inflation must be greater than -100% and no higher than 100%.', error: true });
      return;
    }
    if (draft.spending === undefined || draft.spending < 0 || draft.spending > 1_000_000_000_000) {
      setNotice({ message: 'Retirement spending must be zero or more.', error: true });
      return;
    }
    const scenario = createScenario(
      plan,
      name,
      controlledOverrides(plan, draft),
      draft.description.trim() || 'Custom retirement, return, inflation, and spending assumptions.',
      draft.id,
    );
    showPreview(scenario, { ...draft, name, description: scenario.description ?? '' });
  };

  const savePreview = () => {
    if (!preview || !draft || preview.id !== draft.id) {
      setNotice({ message: 'Preview the latest changes before saving this scenario.', error: true });
      return;
    }
    const validated = validateCandidate(preview);
    if (!validated.success) {
      setNotice({ message: `Scenario not saved: ${formatValidationError(validated.error)}`, error: true });
      return;
    }
    planner.setScenarios(validated.data.scenarios);
    setSelectedId(preview.id);
    setDraft(undefined);
    setPreview(undefined);
    setNotice({ message: `“${preview.name}” is in the plan. Use Save changes in the header to sync it.` });
  };

  const returnToBaseline = () => {
    setSelectedId('');
    setPreview(undefined);
    setDraft(undefined);
    setNotice({ message: 'Showing the baseline plan. No scenario differences are applied.' });
  };

  const duplicateScenario = (scenario: PlanScenario) => {
    if (snapshot.scenarios.length >= 50) {
      setNotice({ message: 'This plan already has the maximum of 50 scenarios.', error: true });
      return;
    }
    const duplicate = { ...structuredClone(scenario), id: crypto.randomUUID(), name: uniqueCopyName(scenario.name, snapshot.scenarios) };
    const validated = validateCandidate(duplicate);
    if (!validated.success) {
      setNotice({ message: `Scenario not duplicated: ${formatValidationError(validated.error)}`, error: true });
      return;
    }
    planner.setScenarios(validated.data.scenarios);
    setSelectedId(duplicate.id);
    setPreview(undefined);
    setDraft(undefined);
    setNotice({ message: `“${duplicate.name}” was duplicated. Use Save changes to sync it.` });
  };

  const deleteScenario = (scenario: PlanScenario) => {
    if (!window.confirm(`Delete the “${scenario.name}” scenario? The baseline plan will not change.`)) return;
    planner.setScenarios(snapshot.scenarios.filter((item) => item.id !== scenario.id));
    if (selectedId === scenario.id) returnToBaseline();
    setNotice({ message: `“${scenario.name}” was removed. Use Save changes to sync the deletion.` });
  };

  const renameScenario = (event: FormEvent, scenario: PlanScenario) => {
    event.preventDefault();
    const name = renameValue.trim();
    if (!name) {
      setNotice({ message: 'Enter a scenario name.', error: true });
      return;
    }
    const renamed = { ...scenario, name };
    const validated = validateCandidate(renamed);
    if (!validated.success) {
      setNotice({ message: `Scenario not renamed: ${formatValidationError(validated.error)}`, error: true });
      return;
    }
    planner.setScenarios(validated.data.scenarios);
    setRenamingId(undefined);
    setRenameValue('');
    setNotice({ message: `Scenario renamed to “${name}”. Use Save changes to sync it.` });
  };

  return (
    <div className="page scenarios-page">
      <header className="page-header">
        <div><span className="eyebrow">Explore uncertainty</span><h1>Scenarios</h1><p>Preview sparse differences against one baseline. A preview never rewrites your core plan or saves itself.</p></div>
        <button className="button button-secondary" type="button" onClick={returnToBaseline}>Return to baseline</button>
      </header>

      <section className="scenario-preset-grid" aria-labelledby="presets-title">
        <div className="section-intro"><span className="eyebrow">Quick previews</span><h2 id="presets-title">Stress-test a familiar idea.</h2><p>Choosing a quick preview does not add a scenario. Review it first, then save it deliberately.</p></div>
        <button type="button" onClick={() => beginPreset('early')} disabled={!canPreviewEarlierRetirement}><span>Earlier retirement</span><strong>Retire at {Math.min(maximumRetirementAge, Math.max(minimumRetirementAge, 55))}</strong><small>Previews a valid retirement transition.</small></button>
        <button type="button" onClick={() => beginPreset('savings')} disabled={!investmentsWithSavings.length}><span>Higher savings</span><strong>Contribute 25% more</strong><small>{investmentsWithSavings.length ? 'Adjusts existing investment contributions.' : 'Add an investment contribution first.'}</small></button>
        <button type="button" onClick={() => beginPreset('returns')}><span>Lower returns</span><strong>Reduce returns by 2%</strong><small>Uses percentage points, not a forecast.</small></button>
        <button type="button" onClick={() => beginPreset('debt')} disabled={!enabledDebts.length}><span>Debt payoff</span><strong>Pay debt faster</strong><small>{enabledDebts.length ? 'Adds 25% to included regular payments.' : 'Add or include a debt first.'}</small></button>
      </section>

      {notice && <p className={`form-status scenario-notice${notice.error ? ' error' : ''}`} role={notice.error ? 'alert' : 'status'}>{notice.message}</p>}
      {preview && <aside className="notice scenario-preview-banner" role="status"><strong>Unsaved preview</strong><span>“{preview.name}” is visible in the comparison but is not yet in your saved scenario list.</span></aside>}

      <div className="scenario-workspace">
        <aside className="panel scenario-list" aria-labelledby="saved-scenarios-title">
          <div className="panel-heading"><div><span className="eyebrow">Baseline and saved differences</span><h2 id="saved-scenarios-title">Your scenarios</h2></div><span className="count-badge">{snapshot.scenarios.length}</span></div>
          <div className="scenario-items">
            <article className={!selectedId && !preview ? 'selected scenario-baseline-item' : 'scenario-baseline-item'}>
              <button type="button" className="scenario-select" onClick={returnToBaseline} aria-pressed={!selectedId && !preview}>
                <strong>Baseline plan</strong><span>Your core plan with no scenario differences.</span>
              </button>
            </article>
            {snapshot.scenarios.map((scenario) => (
              <article key={scenario.id} className={scenario.id === selectedId && !preview ? 'selected' : undefined}>
                {renamingId === scenario.id ? (
                  <form className="scenario-inline-rename" onSubmit={(event) => renameScenario(event, scenario)}>
                    <TextField id="scenario-rename-input" label={`Rename ${scenario.name}`} value={renameValue} maxLength={100} required onChange={setRenameValue} />
                    <div className="item-actions">
                      <button type="submit">Save name</button>
                      <button type="button" onClick={() => setRenamingId(undefined)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <button type="button" className="scenario-select" onClick={() => { setSelectedId(scenario.id); setPreview(undefined); setDraft(undefined); setNotice(undefined); }} aria-pressed={scenario.id === selectedId && !preview}>
                      <strong>{scenario.name}</strong><span>{scenario.description || 'Custom scenario'}</span>
                    </button>
                    <div className="item-actions">
                      <button type="button" onClick={() => beginEdit(scenario)}>Edit</button>
                      <button type="button" onClick={() => { setRenamingId(scenario.id); setRenameValue(scenario.name); }}>Rename</button>
                      <button type="button" onClick={() => duplicateScenario(scenario)}>Duplicate</button>
                      <button type="button" className="danger" onClick={() => deleteScenario(scenario)}>Delete</button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
          {!snapshot.scenarios.length && (
            <div className="empty-state"><strong>No saved scenarios yet.</strong><p>Preview a quick start or create your own; nothing is added until you choose Save scenario.</p></div>
          )}
          <button className="button button-secondary button-wide" type="button" onClick={beginCreate} disabled={snapshot.scenarios.length >= 50}>Create custom scenario</button>
        </aside>

        <section className="panel scenario-comparison" aria-labelledby="comparison-title">
          <div className="panel-heading">
            <div><span className="eyebrow">Baseline comparison</span><h2 id="comparison-title">{comparedScenario ? `Baseline vs ${comparedScenario.name}` : 'Baseline plan'}</h2></div>
            <div className="segmented-control" aria-label="Dollar display">
              <button type="button" aria-pressed={dollarView === 'nominal'} onClick={() => setDollarView('nominal')}>Nominal</button>
              <button type="button" aria-pressed={dollarView === 'real'} onClick={() => setDollarView('real')}>Today’s dollars</button>
            </div>
          </div>
          {comparedScenario && comparisonFinalValue !== undefined ? (
            <>
              <div className="comparison-stats">
                <div><span>Baseline at age {finalBaseline.age}</span><strong>{formatCad(baselineFinalValue)}</strong></div>
                <div><span>{comparedScenario.name}</span><strong>{formatCad(comparisonFinalValue)}</strong></div>
                <div><span>Difference</span><strong>{formatCadDelta(comparisonFinalValue - baselineFinalValue)}</strong></div>
              </div>
              <div className="scenario-difference-summary" aria-labelledby="differences-title">
                <h3 id="differences-title">Differences from baseline</h3>
                <ul className="scenario-difference-list">
                  {differences.map((difference) => <li key={difference}>{difference}</li>)}
                </ul>
              </div>
              <ProjectionChart baseline={baseline} comparison={comparison} comparisonLabel={comparedScenario.name} dollarView={dollarView} />
            </>
          ) : (
            <>
              <div className="empty-state chart-empty"><strong>Baseline selected.</strong><p>Choose a saved scenario or preview a new one to compare both projection lines.</p></div>
              <ProjectionChart baseline={baseline} dollarView={dollarView} />
            </>
          )}
        </section>
      </div>

      {draft && (
        <section className="panel custom-scenario scenario-editor" aria-labelledby="custom-title">
          <div className="panel-heading"><div><span className="eyebrow">{draft.mode === 'edit' ? 'Edit saved differences' : 'Build your own'}</span><h2 id="custom-title">{draft.mode === 'edit' ? `Edit ${draft.name}` : 'Custom scenario'}</h2><p>Change supported assumptions, preview the result, then explicitly save or update the scenario.</p></div></div>
          <div className="form-grid two">
            <TextField label="Scenario name" value={draft.name} maxLength={100} placeholder="e.g. Take a sabbatical" required onChange={(name) => updateDraft({ name })} />
            <TextField label="Description (optional)" value={draft.description} maxLength={500} placeholder="What decision does this test?" onChange={(description) => updateDraft({ description })} />
            <NumberField label="Retirement age" required min={minimumRetirementAge} max={maximumRetirementAge} step={1} value={draft.retirementAge} onChange={(retirementAge) => updateControlled('retirementAge', retirementAge)} hint={`Current projection age is ${baseAge}.`} />
            <PercentField label="Investment return" required min={-100} max={100} step={0.1} value={draft.returnRate} onChange={(returnRate) => updateControlled('returnRate', returnRate)} hint="Percentage points; enter 5 for 5%." />
            <PercentField label="General inflation" required min={-99.9} max={100} step={0.1} value={draft.inflation} onChange={(inflation) => updateControlled('inflation', inflation)} hint="Must be greater than -100%." />
            <MoneyField label="Annual retirement spending" required min={0} max={1_000_000_000_000} step={1000} value={draft.spending} onChange={(spending) => updateControlled('spending', spending)} hint="Base-year dollars; exclude payments modeled under Debts." />
          </div>
          <div className="form-actions scenario-editor-actions">
            <button className="button button-secondary" type="button" onClick={previewDraft}>Preview changes</button>
            <button className="button button-primary" type="button" onClick={savePreview} disabled={!preview || preview.id !== draft.id}>{draft.mode === 'edit' ? 'Update scenario' : 'Save scenario'}</button>
            <button className="button button-quiet" type="button" onClick={() => { setDraft(undefined); setPreview(undefined); setNotice(undefined); }}>Cancel</button>
          </div>
          <p className="form-footnote">Preview is temporary. Save scenario adds it to this plan; Save changes in the header then syncs the plan.</p>
        </section>
      )}

      <div className="method-note"><strong>Scenarios are comparisons, not forecasts.</strong><p>Try ranges instead of searching for one “correct” return or inflation number. Scenario edits preserve collection differences that this supported assumption editor does not expose.</p></div>
    </div>
  );
}
