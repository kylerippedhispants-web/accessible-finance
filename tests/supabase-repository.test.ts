import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBlankPlan, createDemoSnapshot, type PlannerSnapshot } from '../planner-app/src/data/demoPlan';
import {
  assetToRow,
  debtToRow,
  expenseToRow,
  incomeToRow,
  loadPlannerSnapshot,
  overridesToRows,
} from '../planner-app/src/data/supabaseRepository';

const { getClient } = vi.hoisted(() => ({ getClient: vi.fn<() => SupabaseClient | null>() }));
vi.mock('../planner-app/src/lib/supabase', () => ({ getSupabaseClient: getClient }));

type Row = Record<string, unknown>;
type Tables = Record<string, Row[]>;
interface ReadRequest {
  table: string;
  columns: string;
  offset: number;
  limit: number;
}

function largeSnapshot(scenarioCount = 20): PlannerSnapshot {
  const snapshot = createDemoSnapshot();
  snapshot.plan.expenses = Array.from({ length: 250 }, (_, index) => ({
    ...snapshot.plan.expenses[0],
    id: `expense-${String(index).padStart(3, '0')}`,
    name: `Fictional expense ${index}`,
    amount: index + 1,
    position: index,
  }));
  snapshot.scenarios = Array.from({ length: scenarioCount }, (_, index) => ({
    id: `scenario-${String(index).padStart(2, '0')}`,
    planId: snapshot.plan.id,
    name: `Fictional scenario ${index}`,
    overrides: {
      expenses: {
        update: snapshot.plan.expenses.map((expense, expenseIndex) => ({
          entityId: expense.id,
          changes: { amount: index * 250 + expenseIndex + 1 },
        })),
      },
    },
  }));
  return snapshot;
}

function tableRows({ plan, scenarios }: PlannerSnapshot): Tables {
  const retirement = plan.retirement;
  return {
    financial_plans: [{
      id: plan.id, schema_version: 1, name: plan.name, base_year: plan.baseYear,
      currency_code: 'CAD', effective_tax_percent: plan.assumptions.effectiveTaxPercent,
      general_inflation_percent: plan.assumptions.generalInflationPercent,
      is_default: true, revision: 7, updated_at: '2026-09-30T00:00:00Z',
    }],
    profiles: [{
      id: plan.profile.id, first_name: plan.profile.firstName,
      province_code: plan.profile.provinceOrTerritory, date_of_birth: plan.profile.dateOfBirth,
      currency_code: plan.profile.currency,
    }],
    income_sources: plan.incomeSources.map((item, index) => incomeToRow(item, plan.id, index)),
    expenses: plan.expenses.map((item, index) => expenseToRow(item, plan.id, index)),
    assets: plan.assets.map((item, index) => assetToRow(item, plan.id, index)),
    debts: plan.debts.map((item, index) => debtToRow(item, plan.id, index)),
    retirement_settings: [{
      plan_id: plan.id, retirement_age: retirement.targetRetirementAge,
      planning_end_age: retirement.planningEndAge, estimated_annual_spending: retirement.estimatedAnnualSpending,
      inflation_percent: retirement.spendingInflationPercent,
      investment_return_before_percent: retirement.investmentReturnBeforeRetirementPercent,
      investment_return_after_percent: retirement.investmentReturnAfterRetirementPercent,
      expense_mode: retirement.expenseMode,
      cpp_enabled: retirement.cpp.enabled, cpp_annual_estimate: retirement.cpp.annualAmount,
      cpp_start_age: retirement.cpp.startAge, cpp_taxable: retirement.cpp.taxable,
      cpp_annual_growth_percent: retirement.cpp.annualGrowthPercent,
      oas_enabled: retirement.oas.enabled, oas_annual_estimate: retirement.oas.annualAmount,
      oas_start_age: retirement.oas.startAge, oas_taxable: retirement.oas.taxable,
      oas_annual_growth_percent: retirement.oas.annualGrowthPercent,
    }],
    scenarios: scenarios.map((scenario) => ({
      id: scenario.id, plan_id: scenario.planId, name: scenario.name,
      description: scenario.description ?? null, is_baseline: scenario.isBaseline ?? false,
      is_archived: false, updated_at: '2026-09-30T00:00:00Z',
    })),
    scenario_overrides: scenarios.flatMap(overridesToRows),
  };
}

function mockDatabase(snapshot: PlannerSnapshot, options: {
  rowCap?: number;
  omitOverrideCount?: boolean;
  emptyOverridePageAt?: number;
  beforeRead?: (request: ReadRequest, tables: Tables) => void;
} = {}) {
  const tables = tableRows(snapshot);
  const requests: ReadRequest[] = [];
  // Exercise the real PostgREST query builder against an in-memory HTTP surface.
  // No request can reach an account or external network.
  const fakeFetch: typeof fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    if (url.origin !== 'https://repository-test.supabase.co' || !url.pathname.startsWith('/rest/v1/')) {
      throw new Error('Unexpected test request');
    }
    const request: ReadRequest = {
      table: url.pathname.split('/').at(-1)!,
      columns: url.searchParams.get('select') ?? '*',
      offset: Number(url.searchParams.get('offset') ?? 0),
      limit: Number(url.searchParams.get('limit') ?? Number.MAX_SAFE_INTEGER),
    };
    requests.push(request);
    options.beforeRead?.(request, tables);
    let rows = [...tables[request.table]];
    for (const [column, filter] of url.searchParams) {
      if (filter.startsWith('eq.')) rows = rows.filter((row) => String(row[column]) === filter.slice(3));
    }
    const ordering = (url.searchParams.get('order') ?? '').split(',').filter(Boolean);
    rows.sort((left, right) => {
      for (const order of ordering) {
        const [column, direction] = order.split('.');
        const a = left[column];
        const b = right[column];
        const comparison = typeof a === 'number' && typeof b === 'number'
          ? a - b : String(a).localeCompare(String(b));
        if (comparison) return direction === 'desc' ? -comparison : comparison;
      }
      return 0;
    });
    const total = rows.length;
    const pageLength = Math.min(request.limit, options.rowCap ?? 1_000);
    let page = rows.slice(request.offset, request.offset + pageLength);
    if (request.table === 'scenario_overrides' && options.emptyOverridePageAt !== undefined
      && request.offset >= options.emptyOverridePageAt) page = [];
    if (request.columns !== '*') {
      page = page.map((row) => Object.fromEntries(request.columns.split(',').map((column) => [column, row[column]])));
    }
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const requestHeaders = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    if (requestHeaders.get('Prefer')?.includes('count=exact')
      && !(options.omitOverrideCount && request.table === 'scenario_overrides')) {
      headers.set('Content-Range', page.length ? `${request.offset}-${request.offset + page.length - 1}/${total}` : `*/${total}`);
    }
    return new Response(JSON.stringify(page), { status: 200, headers });
  };
  getClient.mockReturnValue(createClient('https://repository-test.supabase.co', 'test-public-placeholder', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: fakeFetch },
  }));
  return { tables, requests };
}

beforeEach(() => getClient.mockReset());

describe('complete and bounded cloud snapshot loading', () => {
  it('loads a saved plan whose child collections are empty', async () => {
    const snapshot = { plan: createBlankPlan({ firstName: 'Taylor' }), scenarios: [] };
    mockDatabase(snapshot);
    await expect(loadPlannerSnapshot()).resolves.toMatchObject({ snapshot, revision: 7 });
  });

  it.each([1_000, 73])('restores all 5,000 differences when the API caps responses at %i rows', async (rowCap) => {
    const expected = largeSnapshot();
    const database = mockDatabase(expected, { rowCap });
    const loaded = await loadPlannerSnapshot();

    expect(loaded?.revision).toBe(7);
    expect(loaded?.snapshot.plan).toMatchObject(expected.plan);
    expect(new Map(loaded?.snapshot.scenarios.map((scenario) => [scenario.id, scenario.overrides])))
      .toEqual(new Map(expected.scenarios.map((scenario) => [scenario.id, scenario.overrides])));
    expect(database.requests.filter((request) => request.table === 'scenario_overrides').length).toBeGreaterThan(1);
  });

  it.each([251, 1_001])('rejects %i child records rather than accepting an API-truncated subset', async (count) => {
    const snapshot = createDemoSnapshot();
    snapshot.scenarios = [];
    snapshot.plan.expenses = Array.from({ length: count }, (_, index) => ({
      ...snapshot.plan.expenses[0], id: `expense-${index}`,
    }));
    mockDatabase(snapshot);
    await expect(loadPlannerSnapshot()).rejects.toMatchObject({ code: 'capacity' });
  });

  it('rejects 5,001 scenario differences even when the server returns only the first 1,000', async () => {
    const snapshot = largeSnapshot();
    snapshot.scenarios[0].overrides.retirement = { targetRetirementAge: 59 };
    mockDatabase(snapshot);
    await expect(loadPlannerSnapshot()).rejects.toMatchObject({ code: 'capacity' });
  });

  it('rejects a revision change that races the paginated read', async () => {
    mockDatabase(largeSnapshot(), {
      beforeRead: (request, tables) => {
        if (request.table === 'scenario_overrides' && request.offset > 0) tables.financial_plans[0].revision = 8;
      },
    });
    await expect(loadPlannerSnapshot()).rejects.toMatchObject({ code: 'conflict', retryable: true });
  });

  it('rejects a collection count that changes between pages', async () => {
    mockDatabase(largeSnapshot(), {
      beforeRead: (request, tables) => {
        if (request.table === 'scenario_overrides' && request.offset === 1_000) tables.scenario_overrides.pop();
      },
    });
    await expect(loadPlannerSnapshot()).rejects.toMatchObject({ code: 'conflict', retryable: true });
  });

  it('fails closed when the API omits the count needed to prove completeness', async () => {
    mockDatabase(largeSnapshot(), { omitOverrideCount: true });
    await expect(loadPlannerSnapshot()).rejects.toMatchObject({ code: 'invalid_data' });
  });

  it('fails closed when a page is empty before the reported collection is complete', async () => {
    mockDatabase(largeSnapshot(5), { emptyOverridePageAt: 1_000 });
    await expect(loadPlannerSnapshot()).rejects.toMatchObject({ code: 'unavailable', retryable: true });
  });
});
