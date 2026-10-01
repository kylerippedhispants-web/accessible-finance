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
import type { PlannerSnapshot } from './demoPlan';
import { getSupabaseClient } from '../lib/supabase';
import {
  MAX_PLAN_COLLECTION_ITEMS,
  MAX_PLAN_SCENARIOS,
  MAX_SCENARIO_OVERRIDE_OPERATIONS,
  plannerSnapshotSchema,
} from '../validation/planSchemas';

type Row = Record<string, unknown>;

export type CloudRepositoryErrorCode =
  | 'not_configured'
  | 'offline'
  | 'session_expired'
  | 'conflict'
  | 'invalid_data'
  | 'capacity'
  | 'unavailable';

const RETRYABLE_ERROR_CODES = new Set<CloudRepositoryErrorCode>(['offline', 'unavailable']);

export class CloudRepositoryError extends Error {
  readonly code: CloudRepositoryErrorCode;
  readonly retryable: boolean;

  constructor(
    code: CloudRepositoryErrorCode,
    message: string,
    options?: { cause?: unknown; retryable?: boolean },
  ) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'CloudRepositoryError';
    this.code = code;
    this.retryable = options?.retryable ?? RETRYABLE_ERROR_CODES.has(code);
  }
}

export interface LoadedPlannerSnapshot {
  snapshot: PlannerSnapshot;
  revision: number;
}

export interface SavedPlannerSnapshot {
  revision: number;
}

function clientOrThrow(): SupabaseClient {
  const client = getSupabaseClient();
  if (!client) {
    throw new CloudRepositoryError(
      'not_configured',
      'Cloud sync has not been configured for this deployment.',
    );
  }
  return client;
}

function asRepositoryError(
  error: unknown,
  operation: string,
  status?: number,
): CloudRepositoryError {
  if (error instanceof CloudRepositoryError) return error;

  const postgrest = error && typeof error === 'object'
    ? error as Partial<PostgrestError>
    : undefined;
  const code = typeof postgrest?.code === 'string' ? postgrest.code : '';
  const rawMessage = typeof postgrest?.message === 'string'
    ? postgrest.message
    : error instanceof Error ? error.message : '';

  if (code === 'P0001' && rawMessage.includes('planner_revision_conflict')) {
    return new CloudRepositoryError(
      'conflict',
      'This plan changed in another session. Reload the cloud copy before saving again.',
      { cause: error },
    );
  }
  if (status === 401 || code === '28000' || code === 'PGRST301' || code === 'PGRST302') {
    return new CloudRepositoryError(
      'session_expired',
      'Your cloud session expired. Sign in again before retrying.',
      { cause: error },
    );
  }
  if (code === '54000') {
    return new CloudRepositoryError(
      'capacity',
      'This plan is too large to load or save safely.',
      { cause: error },
    );
  }
  if (/^(?:22|23)/.test(code)) {
    return new CloudRepositoryError(
      'invalid_data',
      `Cloud ${operation} was rejected because the plan data is invalid.`,
      { cause: error },
    );
  }
  if (
    error instanceof TypeError
    || status === 0
    || /failed to fetch|networkerror|network request failed|offline/i.test(rawMessage)
  ) {
    return new CloudRepositoryError(
      'offline',
      `Cloud ${operation} could not reach Supabase. Check the connection and try again.`,
      { cause: error },
    );
  }
  return new CloudRepositoryError(
    'unavailable',
    `Cloud ${operation} is temporarily unavailable. Try again.`,
    { cause: error },
  );
}

function failIf(
  error: PostgrestError | null,
  operation: string,
  status?: number,
): void {
  if (error) throw asRepositoryError(error, operation, status);
}

function invalidCloudValue(field: string): never {
  throw new CloudRepositoryError(
    'invalid_data',
    `Cloud plan data contains an invalid ${field}. No data was changed.`,
  );
}

function numberValue(value: unknown, field = 'number'): number {
  const parsed = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim() !== ''
      ? Number(value)
      : Number.NaN;
  return Number.isFinite(parsed) ? parsed : invalidCloudValue(field);
}

function integerValue(value: unknown, field = 'integer'): number {
  const parsed = numberValue(value, field);
  return Number.isSafeInteger(parsed) ? parsed : invalidCloudValue(field);
}

function stringValue(value: unknown, field = 'text'): string {
  return typeof value === 'string' ? value : invalidCloudValue(field);
}

function nullableNumber(value: unknown, field = 'number'): number | undefined {
  if (value === null || value === undefined) return undefined;
  return numberValue(value, field);
}

function booleanValue(value: unknown, field = 'boolean'): boolean {
  return typeof value === 'boolean' ? value : invalidCloudValue(field);
}

function nullableBoolean(value: unknown, field = 'boolean'): boolean | undefined {
  if (value === null || value === undefined) return undefined;
  return booleanValue(value, field);
}

function objectValue(value: unknown, field = 'object'): Row {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalidCloudValue(field);
  return value as Row;
}

function profileFromRow(row: Row | null): PlannerProfile {
  if (!row) invalidCloudValue('profile');
  return {
    id: stringValue(row.id, 'profile ID'),
    firstName: stringValue(row.first_name, 'profile first name'),
    provinceOrTerritory: stringValue(row.province_code, 'province or territory') as PlannerProfile['provinceOrTerritory'],
    dateOfBirth: stringValue(row.date_of_birth, 'date of birth'),
    currency: stringValue(row.currency_code, 'profile currency') as PlannerProfile['currency'],
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
    taxable: booleanValue(row.taxable, 'income taxability'),
    endsAtRetirement: nullableBoolean(row.ends_at_retirement, 'income retirement behavior'),
    enabled: booleanValue(row.enabled, 'income enabled state'),
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
    enabled: booleanValue(row.enabled, 'expense enabled state'),
    position: numberValue(row.position),
  };
}

export function assetFromRow(row: Row): Asset {
  return {
    id: stringValue(row.id),
    planId: stringValue(row.plan_id),
    name: stringValue(row.name),
    type: stringValue(row.asset_type) as Asset['type'],
    category: row.category === null || row.category === undefined
      ? undefined
      : stringValue(row.category, 'asset category') as Asset['category'],
    currentValue: numberValue(row.current_value),
    expectedReturnPercent: nullableNumber(row.expected_return_percent),
    postRetirementReturnPercent: nullableNumber(row.post_retirement_return_percent),
    annualAppreciationPercent: nullableNumber(row.annual_appreciation_percent),
    annualContribution: nullableNumber(row.annual_contribution),
    contributionFrequency: row.contribution_frequency === null
      || row.contribution_frequency === undefined
      ? undefined
      : stringValue(row.contribution_frequency, 'asset contribution frequency') as Asset['contributionFrequency'],
    contributionStartYear: nullableNumber(row.contribution_start_year),
    contributionEndYear: nullableNumber(row.contribution_end_year),
    startYear: nullableNumber(row.start_year),
    enabled: booleanValue(row.enabled, 'asset enabled state'),
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
    enabled: booleanValue(row.enabled, 'debt enabled state'),
    position: numberValue(row.position),
  };
}

function retirementFromRow(row: Row | null): RetirementSettings {
  if (!row) invalidCloudValue('retirement settings');
  return {
    targetRetirementAge: numberValue(row.retirement_age, 'retirement age'),
    planningEndAge: numberValue(row.planning_end_age, 'planning end age'),
    estimatedAnnualSpending: numberValue(row.estimated_annual_spending),
    spendingInflationPercent: numberValue(row.inflation_percent),
    investmentReturnBeforeRetirementPercent: numberValue(row.investment_return_before_percent),
    investmentReturnAfterRetirementPercent: numberValue(row.investment_return_after_percent),
    expenseMode: stringValue(row.expense_mode, 'retirement expense mode') as RetirementSettings['expenseMode'],
    cpp: {
      enabled: booleanValue(row.cpp_enabled, 'CPP enabled state'),
      annualAmount: numberValue(row.cpp_annual_estimate),
      startAge: numberValue(row.cpp_start_age, 'CPP start age'),
      taxable: booleanValue(row.cpp_taxable, 'CPP taxability'),
      annualGrowthPercent: numberValue(row.cpp_annual_growth_percent),
    },
    oas: {
      enabled: booleanValue(row.oas_enabled, 'OAS enabled state'),
      annualAmount: numberValue(row.oas_annual_estimate),
      startAge: numberValue(row.oas_start_age, 'OAS start age'),
      taxable: booleanValue(row.oas_taxable, 'OAS taxability'),
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
  const changes = objectValue(row.changes, 'scenario changes');

  if (operation === 'add') {
    const added = { id: targetId, planId: stringValue(row.plan_id), ...changes };
    collection.add = [...(collection.add ?? []), added];
  } else if (operation === 'delete') {
    collection.removeIds = [...(collection.removeIds ?? []), targetId];
  } else if (operation === 'update') {
    collection.update = [...(collection.update ?? []), { entityId: targetId, changes }];
  } else {
    invalidCloudValue('scenario operation');
  }
  (overrides as unknown as Record<string, LooseCollection>)[key] = collection;
}

export function scenariosFromRows(scenarioRows: Row[], overrideRows: Row[]): PlanScenario[] {
  return scenarioRows.filter((row) => !booleanValue(row.is_archived, 'scenario archived state')).map((row) => {
    const overrides: ScenarioOverrides = {};
    overrideRows.filter((candidate) => candidate.scenario_id === row.id).forEach((override) => {
      const changes = objectValue(override.changes, 'scenario changes');
      const operation = stringValue(override.operation, 'scenario operation');
      switch (override.entity_type) {
        case 'financial_plan':
          if (operation !== 'update') invalidCloudValue('financial plan scenario operation');
          overrides.assumptions = objectValue(
            changes.assumptions ?? changes,
            'scenario assumptions',
          ) as ScenarioOverrides['assumptions'];
          break;
        case 'retirement_settings':
          if (operation !== 'update') invalidCloudValue('retirement scenario operation');
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
        default:
          invalidCloudValue('scenario entity type');
      }
    });
    return {
      id: stringValue(row.id),
      planId: stringValue(row.plan_id),
      name: stringValue(row.name),
      description: row.description === null || row.description === undefined
        ? undefined
        : stringValue(row.description, 'scenario description'),
      isBaseline: booleanValue(row.is_baseline, 'scenario baseline state'),
      overrides,
    };
  });
}

const PROFILE_COLUMNS = 'id,first_name,province_code,date_of_birth,currency_code';
const PLAN_COLUMNS = 'id,schema_version,name,base_year,currency_code,effective_tax_percent,general_inflation_percent,is_default,revision,updated_at';
const INCOME_COLUMNS = 'id,plan_id,name,income_type,amount,frequency,start_year,end_year,annual_growth_percent,taxable,ends_at_retirement,enabled,position';
const EXPENSE_COLUMNS = 'id,plan_id,name,category,amount,frequency,start_year,end_year,inflation_percent,enabled,position';
const ASSET_COLUMNS = 'id,plan_id,name,asset_type,category,current_value,expected_return_percent,post_retirement_return_percent,annual_appreciation_percent,annual_contribution,contribution_frequency,contribution_start_year,contribution_end_year,start_year,enabled,position';
const DEBT_COLUMNS = 'id,plan_id,name,debt_type,balance,annual_interest_percent,payment_amount,payment_frequency,remaining_amortization_months,extra_payment_amount,compounding_periods_per_year,start_year,enabled,position';
const RETIREMENT_COLUMNS = 'plan_id,retirement_age,planning_end_age,estimated_annual_spending,inflation_percent,investment_return_before_percent,investment_return_after_percent,expense_mode,cpp_enabled,cpp_annual_estimate,cpp_start_age,cpp_taxable,cpp_annual_growth_percent,oas_enabled,oas_annual_estimate,oas_start_age,oas_taxable,oas_annual_growth_percent';
const SCENARIO_COLUMNS = 'id,plan_id,name,description,is_baseline,is_archived';
const OVERRIDE_COLUMNS = 'plan_id,scenario_id,entity_type,target_id,operation,changes';

const CLOUD_PAGE_SIZE = 1_000;

interface CollectionPage {
  data: unknown;
  count: number | null;
  error: PostgrestError | null;
  status: number;
}

async function loadCollectionRows(
  fetchPage: (from: number, to: number) => PromiseLike<CollectionPage>,
  maximum: number,
  label: string,
): Promise<Row[]> {
  const rows: Row[] = [];
  let expectedCount: number | undefined;

  while (expectedCount === undefined || rows.length < expectedCount) {
    const from = rows.length;
    const to = Math.min(from + CLOUD_PAGE_SIZE - 1, expectedCount === undefined ? maximum : expectedCount - 1);
    const page = await fetchPage(from, to);
    failIf(page.error, `${label} load`, page.status);
    if (page.count === null || !Number.isSafeInteger(page.count) || page.count < 0) {
      invalidCloudValue(`${label} record count`);
    }
    if (page.count > maximum) {
      throw new CloudRepositoryError(
        'capacity',
        `This plan contains too many ${label} records to load safely.`,
      );
    }
    if (expectedCount !== undefined && page.count !== expectedCount) {
      throw new CloudRepositoryError(
        'conflict',
        'The cloud plan changed while it was loading. Try loading it again.',
        { retryable: true },
      );
    }
    expectedCount = page.count;
    if (!Array.isArray(page.data) || page.data.length > to - from + 1 || from + page.data.length > expectedCount) {
      invalidCloudValue(`${label} collection`);
    }
    if (page.data.length === 0 && from < expectedCount) {
      throw new CloudRepositoryError(
        'unavailable',
        'The complete cloud plan could not be loaded. Try loading it again.',
      );
    }
    rows.push(...page.data as Row[]);
    // Exact counts prevent a server row cap from masquerading as the end of a
    // collection. Advance by received rows, even if the cap is below our page
    // size. Every non-final page must make progress within the domain limit.
  }
  return rows;
}

export async function loadPlannerSnapshot(): Promise<LoadedPlannerSnapshot | null> {
  try {
    const supabase = clientOrThrow();
    // Read the plan revision first and again after all related queries. Atomic
    // RPC saves change the revision in the same transaction as every child row,
    // so equal revisions prove this multi-request read did not straddle a save.
    const planResult = await supabase
      .from('financial_plans')
      .select(PLAN_COLUMNS)
      .order('is_default', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    failIf(planResult.error, 'plan load', planResult.status);
    if (!planResult.data) return null;

    const selectedPlanRow = planResult.data as Row;
    const planId = stringValue(selectedPlanRow.id, 'plan ID');
    const revision = integerValue(selectedPlanRow.revision, 'plan revision');
    const [profileResult, incomeRows, expenseRows, assetRows, debtRows, retirementResult, scenarioRows, overrideRows] = await Promise.all([
      supabase.from('profiles').select(PROFILE_COLUMNS).limit(1).maybeSingle(),
      loadCollectionRows((from, to) => supabase.from('income_sources').select(INCOME_COLUMNS, { count: 'exact' }).eq('plan_id', planId).order('position').order('id').range(from, to), MAX_PLAN_COLLECTION_ITEMS, 'income'),
      loadCollectionRows((from, to) => supabase.from('expenses').select(EXPENSE_COLUMNS, { count: 'exact' }).eq('plan_id', planId).order('position').order('id').range(from, to), MAX_PLAN_COLLECTION_ITEMS, 'expense'),
      loadCollectionRows((from, to) => supabase.from('assets').select(ASSET_COLUMNS, { count: 'exact' }).eq('plan_id', planId).order('position').order('id').range(from, to), MAX_PLAN_COLLECTION_ITEMS, 'asset'),
      loadCollectionRows((from, to) => supabase.from('debts').select(DEBT_COLUMNS, { count: 'exact' }).eq('plan_id', planId).order('position').order('id').range(from, to), MAX_PLAN_COLLECTION_ITEMS, 'debt'),
      supabase.from('retirement_settings').select(RETIREMENT_COLUMNS).eq('plan_id', planId).maybeSingle(),
      loadCollectionRows((from, to) => supabase.from('scenarios').select(SCENARIO_COLUMNS, { count: 'exact' }).eq('plan_id', planId).eq('is_archived', false).order('updated_at', { ascending: false }).order('id').range(from, to), MAX_PLAN_SCENARIOS, 'scenario'),
      loadCollectionRows((from, to) => supabase.from('scenario_overrides').select(OVERRIDE_COLUMNS, { count: 'exact' }).eq('plan_id', planId).order('scenario_id').order('entity_type').order('target_id').order('id').range(from, to), MAX_SCENARIO_OVERRIDE_OPERATIONS, 'scenario difference'),
    ]);
    [profileResult, retirementResult]
      .forEach((result) => failIf(result.error, 'plan data load', result.status));

    const profile = profileFromRow(profileResult.data as Row | null);
    if (integerValue(selectedPlanRow.schema_version, 'plan schema version') !== 1) {
      invalidCloudValue('plan schema version');
    }
    if (stringValue(selectedPlanRow.currency_code, 'plan currency') !== 'CAD') {
      invalidCloudValue('plan currency');
    }
    if (!booleanValue(selectedPlanRow.is_default, 'default plan state')) {
      invalidCloudValue('default plan state');
    }
    const plan: FinancialPlan = {
      schemaVersion: 1,
      id: planId,
      name: stringValue(selectedPlanRow.name, 'plan name'),
      baseYear: integerValue(selectedPlanRow.base_year, 'plan base year'),
      profile,
      assumptions: {
        effectiveTaxPercent: numberValue(selectedPlanRow.effective_tax_percent, 'effective tax percentage'),
        generalInflationPercent: numberValue(selectedPlanRow.general_inflation_percent, 'general inflation percentage'),
      },
      incomeSources: incomeRows.map(incomeFromRow),
      expenses: expenseRows.map(expenseFromRow),
      assets: assetRows.map(assetFromRow),
      debts: debtRows.map(debtFromRow),
      retirement: retirementFromRow(retirementResult.data as Row | null),
    };
    const snapshotResult = plannerSnapshotSchema.safeParse({
      plan,
      scenarios: scenariosFromRows(scenarioRows, overrideRows),
    });
    if (!snapshotResult.success) invalidCloudValue('planner snapshot');

    const revisionResult = await supabase
      .from('financial_plans')
      .select('revision')
      .eq('id', planId)
      .maybeSingle();
    failIf(revisionResult.error, 'revision check', revisionResult.status);
    const endingRevision = revisionResult.data
      ? integerValue((revisionResult.data as Row).revision, 'plan revision')
      : undefined;
    if (endingRevision !== revision) {
      throw new CloudRepositoryError(
        'conflict',
        'The cloud plan changed while it was loading. Try loading it again.',
        { retryable: true },
      );
    }

    return { snapshot: snapshotResult.data, revision };
  } catch (error) {
    throw asRepositoryError(error, 'plan load');
  }
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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireUuid(value: string, field: string): void {
  if (!UUID_PATTERN.test(value)) invalidCloudValue(field);
}

function assertCloudIdentities(snapshot: PlannerSnapshot): void {
  requireUuid(snapshot.plan.id, 'plan ID');
  requireUuid(snapshot.plan.profile.id, 'profile ID');
  for (const [label, collection] of [
    ['income', snapshot.plan.incomeSources],
    ['expense', snapshot.plan.expenses],
    ['asset', snapshot.plan.assets],
    ['debt', snapshot.plan.debts],
  ] as const) {
    collection.forEach((item) => requireUuid(item.id, `${label} ID`));
  }
  snapshot.scenarios.forEach((scenario) => {
    requireUuid(scenario.id, 'scenario ID');
    for (const [label, collection] of [
      ['income', scenario.overrides.incomeSources],
      ['expense', scenario.overrides.expenses],
      ['asset', scenario.overrides.assets],
      ['debt', scenario.overrides.debts],
    ] as const) {
      collection?.add?.forEach((item) => requireUuid(item.id, `scenario ${label} addition ID`));
      collection?.update?.forEach((item) => requireUuid(item.entityId, `scenario ${label} update ID`));
      collection?.removeIds?.forEach((id) => requireUuid(id, `scenario ${label} removal ID`));
    }
  });
}

function savePayload(snapshot: PlannerSnapshot): Row {
  const overrides = snapshot.scenarios.flatMap(overridesToRows);
  if (overrides.length > MAX_SCENARIO_OVERRIDE_OPERATIONS) {
    throw new CloudRepositoryError(
      'capacity',
      'This plan contains too many scenario differences to save safely.',
    );
  }
  return {
    profile: profileRow(snapshot.plan),
    plan: planRow(snapshot.plan),
    retirement: retirementRow(snapshot.plan),
    income_sources: snapshot.plan.incomeSources.map((item, position) => incomeToRow(item, snapshot.plan.id, position)),
    expenses: snapshot.plan.expenses.map((item, position) => expenseToRow(item, snapshot.plan.id, position)),
    assets: snapshot.plan.assets.map((item, position) => assetToRow(item, snapshot.plan.id, position)),
    debts: snapshot.plan.debts.map((item, position) => debtToRow(item, snapshot.plan.id, position)),
    scenarios: snapshot.scenarios.map(scenarioRow),
    scenario_overrides: overrides,
  };
}

export async function savePlannerSnapshot(
  next: PlannerSnapshot,
  expectedRevision: number | null,
): Promise<SavedPlannerSnapshot> {
  try {
    if (
      expectedRevision !== null
      && (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
    ) {
      invalidCloudValue('expected plan revision');
    }
    const validated = plannerSnapshotSchema.safeParse(next);
    if (!validated.success) invalidCloudValue('planner snapshot');
    assertCloudIdentities(validated.data);

    const supabase = clientOrThrow();
    const result = await supabase.rpc('save_planner_snapshot', {
      p_payload: savePayload(validated.data),
      p_expected_revision: expectedRevision,
    });
    failIf(result.error, 'plan save', result.status);
    return { revision: integerValue(result.data, 'saved plan revision') };
  } catch (error) {
    throw asRepositoryError(error, 'plan save');
  }
}
