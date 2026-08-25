import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import type {
  Asset,
  Debt,
  Expense,
  FinancialPlan,
  IncomeSource,
  PlanScenario,
  PlannerProfile,
  RetirementSettings,
  ScenarioOverrides,
} from '../domain';
import { createBlankPlan, type PlannerSnapshot } from './demoPlan';
import { getSupabaseClient } from '../lib/supabase';

type Row = Record<string, unknown>;

function clientOrThrow(): SupabaseClient {
  const client = getSupabaseClient();
  if (!client) throw new Error('Cloud sync is unavailable.');
  return client;
}

function failIf(error: PostgrestError | null, operation: string): void {
  if (error) throw new Error(`Cloud ${operation} failed.`);
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function nullableNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function nullableBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function profileFromRow(row: Row | null): PlannerProfile {
  return {
    id: stringValue(row?.id, crypto.randomUUID()),
    firstName: stringValue(row?.first_name),
    provinceOrTerritory: (stringValue(row?.province_code, 'ON') || 'ON') as PlannerProfile['provinceOrTerritory'],
    dateOfBirth: stringValue(row?.date_of_birth, '1990-01-01'),
    currency: 'CAD',
  };
}

export function incomeFromRow(row: Row): IncomeSource {
  return {
    id: stringValue(row.id),
    planId: stringValue(row.plan_id),
    name: stringValue(row.name),
    type: stringValue(row.income_type) as IncomeSource['type'],
    amount: numberValue(row.amount),
    frequency: stringValue(row.frequency) as IncomeSource['frequency'],
    startYear: numberValue(row.start_year),
    endYear: nullableNumber(row.end_year),
    annualGrowthPercent: numberValue(row.annual_growth_percent),
    taxable: Boolean(row.taxable),
    endsAtRetirement: nullableBoolean(row.ends_at_retirement),
    enabled: row.enabled !== false,
    position: numberValue(row.position),
  };
}

export function expenseFromRow(row: Row): Expense {
  return {
    id: stringValue(row.id),
    planId: stringValue(row.plan_id),
    name: stringValue(row.name),
    category: stringValue(row.category) as Expense['category'],
    amount: numberValue(row.amount),
    frequency: stringValue(row.frequency) as Expense['frequency'],
    startYear: numberValue(row.start_year),
    endYear: nullableNumber(row.end_year),
    inflationPercent: numberValue(row.inflation_percent),
    enabled: row.enabled !== false,
    position: numberValue(row.position),
  };
}

export function assetFromRow(row: Row): Asset {
  return {
    id: stringValue(row.id),
    planId: stringValue(row.plan_id),
    name: stringValue(row.name),
    type: stringValue(row.asset_type) as Asset['type'],
    category: row.category ? stringValue(row.category) as Asset['category'] : undefined,
    currentValue: numberValue(row.current_value),
    expectedReturnPercent: nullableNumber(row.expected_return_percent),
    postRetirementReturnPercent: nullableNumber(row.post_retirement_return_percent),
    annualAppreciationPercent: nullableNumber(row.annual_appreciation_percent),
    annualContribution: nullableNumber(row.annual_contribution),
    contributionFrequency: row.contribution_frequency
      ? stringValue(row.contribution_frequency) as Asset['contributionFrequency']
      : undefined,
    contributionStartYear: nullableNumber(row.contribution_start_year),
    contributionEndYear: nullableNumber(row.contribution_end_year),
    startYear: nullableNumber(row.start_year),
    enabled: row.enabled !== false,
    position: numberValue(row.position),
  };
}

export function debtFromRow(row: Row): Debt {
  return {
    id: stringValue(row.id),
    planId: stringValue(row.plan_id),
    name: stringValue(row.name),
    type: stringValue(row.debt_type) as Debt['type'],
    balance: numberValue(row.balance),
    annualInterestPercent: numberValue(row.annual_interest_percent),
    paymentAmount: numberValue(row.payment_amount),
    paymentFrequency: stringValue(row.payment_frequency) as Debt['paymentFrequency'],
    remainingAmortizationMonths: numberValue(row.remaining_amortization_months),
    extraPaymentAmount: nullableNumber(row.extra_payment_amount),
    compoundingPeriodsPerYear: nullableNumber(row.compounding_periods_per_year),
    startYear: nullableNumber(row.start_year),
    enabled: row.enabled !== false,
    position: numberValue(row.position),
  };
}

function retirementFromRow(row: Row | null, fallback: RetirementSettings): RetirementSettings {
  if (!row) return fallback;
  return {
    targetRetirementAge: numberValue(row.retirement_age, fallback.targetRetirementAge),
    planningEndAge: numberValue(row.planning_end_age, fallback.planningEndAge),
    estimatedAnnualSpending: numberValue(row.estimated_annual_spending),
    spendingInflationPercent: numberValue(row.inflation_percent),
    investmentReturnBeforeRetirementPercent: numberValue(row.investment_return_before_percent),
    investmentReturnAfterRetirementPercent: numberValue(row.investment_return_after_percent),
    expenseMode: stringValue(row.expense_mode, 'replace_recurring') as RetirementSettings['expenseMode'],
    cpp: {
      enabled: Boolean(row.cpp_enabled),
      annualAmount: numberValue(row.cpp_annual_estimate),
      startAge: numberValue(row.cpp_start_age, 65),
      taxable: Boolean(row.cpp_taxable),
      annualGrowthPercent: numberValue(row.cpp_annual_growth_percent),
    },
    oas: {
      enabled: Boolean(row.oas_enabled),
      annualAmount: numberValue(row.oas_annual_estimate),
      startAge: numberValue(row.oas_start_age, 65),
      taxable: Boolean(row.oas_taxable),
      annualGrowthPercent: numberValue(row.oas_annual_growth_percent),
    },
  };
}

function addCollectionOverride(
  overrides: ScenarioOverrides,
  key: 'incomeSources' | 'expenses' | 'assets' | 'debts',
  row: Row,
): void {
  type LooseCollection = {
    add?: unknown[];
    update?: unknown[];
    removeIds?: string[];
  };
  const collection = (overrides[key] ?? {}) as LooseCollection;
  const operation = stringValue(row.operation);
  const targetId = stringValue(row.target_id);
  const changes = (row.changes && typeof row.changes === 'object' ? row.changes : {}) as Row;

  if (operation === 'add') {
    const added = { id: targetId, planId: stringValue(row.plan_id), ...changes };
    collection.add = [...(collection.add ?? []), added];
  } else if (operation === 'delete') {
    collection.removeIds = [...(collection.removeIds ?? []), targetId];
  } else {
    collection.update = [...(collection.update ?? []), { entityId: targetId, changes }];
  }
  (overrides as unknown as Record<string, LooseCollection>)[key] = collection;
}

export function scenariosFromRows(scenarioRows: Row[], overrideRows: Row[]): PlanScenario[] {
  return scenarioRows.filter((row) => row.is_archived !== true).map((row) => {
    const overrides: ScenarioOverrides = {};
    overrideRows.filter((candidate) => candidate.scenario_id === row.id).forEach((override) => {
      const changes = (override.changes && typeof override.changes === 'object' ? override.changes : {}) as Row;
      switch (override.entity_type) {
        case 'financial_plan':
          overrides.assumptions = (changes.assumptions ?? changes) as ScenarioOverrides['assumptions'];
          break;
        case 'retirement_settings':
          overrides.retirement = changes as ScenarioOverrides['retirement'];
          break;
        case 'income_source':
          addCollectionOverride(overrides, 'incomeSources', override);
          break;
        case 'expense':
          addCollectionOverride(overrides, 'expenses', override);
          break;
        case 'asset':
          addCollectionOverride(overrides, 'assets', override);
          break;
        case 'debt':
          addCollectionOverride(overrides, 'debts', override);
          break;
      }
    });
    return {
      id: stringValue(row.id),
      planId: stringValue(row.plan_id),
      name: stringValue(row.name),
      description: row.description ? stringValue(row.description) : undefined,
      isBaseline: Boolean(row.is_baseline),
      overrides,
    };
  });
}

export async function loadPlannerSnapshot(): Promise<PlannerSnapshot | null> {
  const supabase = clientOrThrow();
  const [profileResult, planResult] = await Promise.all([
    supabase.from('profiles').select('*').limit(1).maybeSingle(),
    supabase.from('financial_plans').select('*').order('is_default', { ascending: false }).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  failIf(profileResult.error, 'profile load');
  failIf(planResult.error, 'plan load');
  if (!planResult.data) return null;

  const planRow = planResult.data as Row;
  const planId = stringValue(planRow.id);
  const [incomeResult, expenseResult, assetResult, debtResult, retirementResult, scenarioResult, overrideResult] = await Promise.all([
    supabase.from('income_sources').select('*').eq('plan_id', planId).order('position'),
    supabase.from('expenses').select('*').eq('plan_id', planId).order('position'),
    supabase.from('assets').select('*').eq('plan_id', planId).order('position'),
    supabase.from('debts').select('*').eq('plan_id', planId).order('position'),
    supabase.from('retirement_settings').select('*').eq('plan_id', planId).maybeSingle(),
    supabase.from('scenarios').select('*').eq('plan_id', planId).order('updated_at', { ascending: false }),
    supabase.from('scenario_overrides').select('*').eq('plan_id', planId),
  ]);
  [incomeResult, expenseResult, assetResult, debtResult, retirementResult, scenarioResult, overrideResult]
    .forEach((result) => failIf(result.error, 'plan data load'));

  const profile = profileFromRow(profileResult.data as Row | null);
  const fallback = createBlankPlan(profile);
  const plan: FinancialPlan = {
    schemaVersion: 1,
    id: planId,
    name: stringValue(planRow.name, 'My financial plan'),
    baseYear: numberValue(planRow.base_year, new Date().getFullYear()),
    profile,
    assumptions: {
      effectiveTaxPercent: numberValue(planRow.effective_tax_percent),
      generalInflationPercent: numberValue(planRow.general_inflation_percent, 2),
    },
    incomeSources: ((incomeResult.data ?? []) as Row[]).map(incomeFromRow),
    expenses: ((expenseResult.data ?? []) as Row[]).map(expenseFromRow),
    assets: ((assetResult.data ?? []) as Row[]).map(assetFromRow),
    debts: ((debtResult.data ?? []) as Row[]).map(debtFromRow),
    retirement: retirementFromRow(retirementResult.data as Row | null, fallback.retirement),
  };

  return {
    plan,
    scenarios: scenariosFromRows(
      (scenarioResult.data ?? []) as Row[],
      (overrideResult.data ?? []) as Row[],
    ),
  };
}

function profileRow(plan: FinancialPlan): Row {
  return {
    first_name: plan.profile.firstName,
    province_code: plan.profile.provinceOrTerritory,
    date_of_birth: plan.profile.dateOfBirth,
    currency_code: 'CAD',
  };
}

function planRow(plan: FinancialPlan): Row {
  return {
    id: plan.id,
    schema_version: 1,
    name: plan.name,
    base_year: plan.baseYear,
    currency_code: 'CAD',
    effective_tax_percent: plan.assumptions.effectiveTaxPercent,
    general_inflation_percent: plan.assumptions.generalInflationPercent,
    is_default: true,
  };
}

export function incomeToRow(item: IncomeSource, planId: string, position: number): Row {
  return {
    id: item.id,
    plan_id: planId,
    name: item.name,
    income_type: item.type,
    amount: item.amount,
    frequency: item.frequency,
    start_year: item.startYear,
    end_year: item.endYear ?? null,
    annual_growth_percent: item.annualGrowthPercent,
    taxable: item.taxable,
    ends_at_retirement: item.endsAtRetirement ?? null,
    enabled: item.enabled !== false,
    position,
  };
}

export function expenseToRow(item: Expense, planId: string, position: number): Row {
  return {
    id: item.id,
    plan_id: planId,
    name: item.name,
    category: item.category,
    amount: item.amount,
    frequency: item.frequency,
    start_year: item.startYear,
    end_year: item.endYear ?? null,
    inflation_percent: item.inflationPercent,
    enabled: item.enabled !== false,
    position,
  };
}

export function assetToRow(item: Asset, planId: string, position: number): Row {
  return {
    id: item.id,
    plan_id: planId,
    name: item.name,
    asset_type: item.type,
    category: item.category ?? null,
    current_value: item.currentValue,
    expected_return_percent: item.expectedReturnPercent ?? null,
    post_retirement_return_percent: item.postRetirementReturnPercent ?? null,
    annual_appreciation_percent: item.annualAppreciationPercent ?? null,
    annual_contribution: item.annualContribution ?? null,
    contribution_frequency: item.contributionFrequency ?? null,
    contribution_start_year: item.contributionStartYear ?? null,
    contribution_end_year: item.contributionEndYear ?? null,
    start_year: item.startYear ?? null,
    enabled: item.enabled !== false,
    position,
  };
}

export function debtToRow(item: Debt, planId: string, position: number): Row {
  return {
    id: item.id,
    plan_id: planId,
    name: item.name,
    debt_type: item.type,
    balance: item.balance,
    annual_interest_percent: item.annualInterestPercent,
    payment_amount: item.paymentAmount,
    payment_frequency: item.paymentFrequency,
    remaining_amortization_months: item.remainingAmortizationMonths,
    extra_payment_amount: item.extraPaymentAmount ?? 0,
    compounding_periods_per_year: item.compoundingPeriodsPerYear ?? null,
    start_year: item.startYear ?? null,
    enabled: item.enabled !== false,
    position,
  };
}

function retirementRow(plan: FinancialPlan): Row {
  const settings = plan.retirement;
  return {
    plan_id: plan.id,
    retirement_age: settings.targetRetirementAge,
    planning_end_age: settings.planningEndAge,
    estimated_annual_spending: settings.estimatedAnnualSpending,
    inflation_percent: settings.spendingInflationPercent,
    investment_return_before_percent: settings.investmentReturnBeforeRetirementPercent,
    investment_return_after_percent: settings.investmentReturnAfterRetirementPercent,
    expense_mode: settings.expenseMode,
    cpp_enabled: settings.cpp.enabled,
    cpp_annual_estimate: settings.cpp.annualAmount,
    cpp_start_age: settings.cpp.startAge,
    cpp_taxable: settings.cpp.taxable,
    cpp_annual_growth_percent: settings.cpp.annualGrowthPercent,
    oas_enabled: settings.oas.enabled,
    oas_annual_estimate: settings.oas.annualAmount,
    oas_start_age: settings.oas.startAge,
    oas_taxable: settings.oas.taxable,
    oas_annual_growth_percent: settings.oas.annualGrowthPercent,
  };
}

function scenarioRow(scenario: PlanScenario): Row {
  return {
    id: scenario.id,
    plan_id: scenario.planId,
    name: scenario.name,
    description: scenario.description ?? null,
    is_baseline: scenario.isBaseline ?? false,
    is_archived: false,
  };
}

function stripEntityIdentity(entity: Row): Row {
  const { id: _id, planId: _planId, ...changes } = entity;
  return changes;
}

export function overridesToRows(scenario: PlanScenario): Row[] {
  const rows: Row[] = [];
  const addRow = (entityType: string, targetId: string, operation: string, changes: Row) => {
    rows.push({
      id: crypto.randomUUID(),
      plan_id: scenario.planId,
      scenario_id: scenario.id,
      entity_type: entityType,
      target_id: targetId,
      operation,
      changes,
    });
  };

  if (scenario.overrides.assumptions && Object.keys(scenario.overrides.assumptions).length) {
    addRow('financial_plan', scenario.planId, 'update', { assumptions: scenario.overrides.assumptions });
  }
  if (scenario.overrides.retirement && Object.keys(scenario.overrides.retirement).length) {
    addRow('retirement_settings', scenario.planId, 'update', scenario.overrides.retirement as Row);
  }

  const collections = [
    ['income_source', scenario.overrides.incomeSources],
    ['expense', scenario.overrides.expenses],
    ['asset', scenario.overrides.assets],
    ['debt', scenario.overrides.debts],
  ] as const;
  collections.forEach(([entityType, collection]) => {
    collection?.add?.forEach((entity) => addRow(entityType, entity.id, 'add', stripEntityIdentity(entity as unknown as Row)));
    collection?.update?.forEach((update) => addRow(entityType, update.entityId, 'update', update.changes as Row));
    collection?.removeIds?.forEach((id) => addRow(entityType, id, 'delete', {}));
  });
  return rows;
}

async function syncCollection(
  supabase: SupabaseClient,
  table: string,
  rows: Row[],
  currentIds: string[],
  previousIds: string[],
): Promise<void> {
  if (rows.length) {
    const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
    failIf(error, `${table} save`);
  }
  const removed = previousIds.filter((id) => !currentIds.includes(id));
  if (removed.length) {
    const { error } = await supabase.from(table).delete().in('id', removed);
    failIf(error, `${table} delete`);
  }
}

export async function savePlannerSnapshot(next: PlannerSnapshot, previous: PlannerSnapshot | null): Promise<void> {
  const supabase = clientOrThrow();

  const profileResult = await supabase.from('profiles').upsert(profileRow(next.plan), { onConflict: 'user_id' });
  failIf(profileResult.error, 'profile save');
  const planResult = await supabase.from('financial_plans').upsert(planRow(next.plan), { onConflict: 'id' });
  failIf(planResult.error, 'plan save');

  const retirementResult = await supabase
    .from('retirement_settings')
    .upsert(retirementRow(next.plan), { onConflict: 'plan_id,user_id' });
  failIf(retirementResult.error, 'retirement settings save');

  await Promise.all([
    syncCollection(
      supabase,
      'income_sources',
      next.plan.incomeSources.map((item, position) => incomeToRow(item, next.plan.id, position)),
      next.plan.incomeSources.map((item) => item.id),
      previous?.plan.incomeSources.map((item) => item.id) ?? [],
    ),
    syncCollection(
      supabase,
      'expenses',
      next.plan.expenses.map((item, position) => expenseToRow(item, next.plan.id, position)),
      next.plan.expenses.map((item) => item.id),
      previous?.plan.expenses.map((item) => item.id) ?? [],
    ),
    syncCollection(
      supabase,
      'assets',
      next.plan.assets.map((item, position) => assetToRow(item, next.plan.id, position)),
      next.plan.assets.map((item) => item.id),
      previous?.plan.assets.map((item) => item.id) ?? [],
    ),
    syncCollection(
      supabase,
      'debts',
      next.plan.debts.map((item, position) => debtToRow(item, next.plan.id, position)),
      next.plan.debts.map((item) => item.id),
      previous?.plan.debts.map((item) => item.id) ?? [],
    ),
    syncCollection(
      supabase,
      'scenarios',
      next.scenarios.map(scenarioRow),
      next.scenarios.map((item) => item.id),
      previous?.scenarios.map((item) => item.id) ?? [],
    ),
  ]);

  const deleteOverrides = await supabase.from('scenario_overrides').delete().eq('plan_id', next.plan.id);
  failIf(deleteOverrides.error, 'scenario override refresh');
  const overrideRows = next.scenarios.flatMap(overridesToRows);
  if (overrideRows.length) {
    const insertOverrides = await supabase.from('scenario_overrides').insert(overrideRows);
    failIf(insertOverrides.error, 'scenario override save');
  }
}
