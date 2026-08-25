import { describe, expect, it } from 'vitest';
import {
  assetFromRow,
  assetToRow,
  debtFromRow,
  debtToRow,
  expenseFromRow,
  expenseToRow,
  incomeFromRow,
  incomeToRow,
  overridesToRows,
  scenariosFromRows,
} from '../planner-app/src/data/supabaseRepository';
import { createDemoSnapshot } from '../planner-app/src/data/demoPlan';
import { createPlanExport, parsePlanImport } from '../planner-app/src/data/planTransfer';
import { exportedPlanSchema, plannerSnapshotSchema } from '../planner-app/src/validation/planSchemas';

describe('Supabase data mapping', () => {
  const snapshot = createDemoSnapshot();

  it('round-trips an income source without ownership metadata', () => {
    const source = snapshot.plan.incomeSources[0];
    const row = incomeToRow(source, snapshot.plan.id, 0);
    expect(row).not.toHaveProperty('user_id');
    expect(incomeFromRow(row)).toMatchObject(source);
  });

  it('round-trips an expense without ownership metadata', () => {
    const expense = snapshot.plan.expenses[0];
    const row = expenseToRow(expense, snapshot.plan.id, 0);
    expect(row).not.toHaveProperty('user_id');
    expect(expenseFromRow(row)).toMatchObject(expense);
  });

  it('round-trips asset-specific return and contribution inputs', () => {
    const asset = snapshot.plan.assets.find((candidate) => candidate.type === 'tfsa')!;
    const row = assetToRow({ ...asset, postRetirementReturnPercent: 3.25 }, snapshot.plan.id, 1);
    expect(row).not.toHaveProperty('user_id');
    expect(assetFromRow(row)).toMatchObject({ ...asset, postRetirementReturnPercent: 3.25 });
  });

  it('round-trips mortgage amortization inputs', () => {
    const debt = snapshot.plan.debts[0];
    const row = debtToRow(debt, snapshot.plan.id, 0);
    expect(row).not.toHaveProperty('user_id');
    expect(debtFromRow(row)).toMatchObject(debt);
  });

  it('converts scenario differences to sparse rows and back', () => {
    const scenario = snapshot.scenarios[0];
    const rows = overridesToRows(scenario);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => !('user_id' in row))).toBe(true);
    const reconstructed = scenariosFromRows([{
      id: scenario.id,
      plan_id: scenario.planId,
      name: scenario.name,
      description: scenario.description,
      is_baseline: false,
      is_archived: false,
    }], rows)[0];
    expect(reconstructed.overrides).toEqual(scenario.overrides);
  });
});

describe('portable plan transfer', () => {
  it('creates a validated versioned export with no user or auth metadata', () => {
    const exported = createPlanExport(createDemoSnapshot());
    expect(exportedPlanSchema.safeParse(exported).success).toBe(true);
    const serialized = JSON.stringify(exported).toLowerCase();
    expect(serialized).not.toContain('user_id');
    expect(serialized).not.toContain('access_token');
    expect(serialized).not.toContain('refresh_token');
    expect(serialized).not.toContain('supabase_anon');
  });

  it('validates imported values before accepting them', () => {
    const exported = createPlanExport(createDemoSnapshot());
    exported.data.plan.retirement.targetRetirementAge = -1;
    expect(() => parsePlanImport(JSON.stringify(exported))).toThrow();
  });

  it('rejects malformed scenario differences instead of accepting arbitrary JSON', () => {
    const exported = createPlanExport(createDemoSnapshot());
    exported.data.scenarios[0].overrides = {
      assumptions: { effectiveTaxPercent: 'free money' },
    } as never;
    expect(() => parsePlanImport(JSON.stringify(exported))).toThrow();
  });

  it('rejects scenario updates that reference another plan record', () => {
    const exported = createPlanExport(createDemoSnapshot());
    exported.data.scenarios[0].overrides.incomeSources = {
      update: [{ entityId: crypto.randomUUID(), changes: { amount: 1 } }],
    };
    expect(() => parsePlanImport(JSON.stringify(exported))).toThrow(/unknown income source/i);
  });

  it('rejects duplicate scenario operations that the relational schema cannot store', () => {
    const exported = createPlanExport(createDemoSnapshot());
    const incomeId = exported.data.plan.incomeSources[0].id;
    exported.data.scenarios[0].overrides.incomeSources = {
      update: [{ entityId: incomeId, changes: { amount: 1 } }],
      removeIds: [incomeId],
    };
    expect(() => parsePlanImport(JSON.stringify(exported))).toThrow(/only one operation/i);
  });

  it('rejects empty scenario updates that the relational schema cannot store', () => {
    const exported = createPlanExport(createDemoSnapshot());
    const incomeId = exported.data.plan.incomeSources[0].id;
    exported.data.scenarios[0].overrides.incomeSources = {
      update: [{ entityId: incomeId, changes: {} }],
    };
    expect(() => parsePlanImport(JSON.stringify(exported))).toThrow(/at least one field/i);
  });

  it('rejects scenario removals that do not reference a baseline record', () => {
    const exported = createPlanExport(createDemoSnapshot());
    exported.data.scenarios[0].overrides.assets = {
      removeIds: ['not-a-baseline-asset'],
    };
    expect(() => parsePlanImport(JSON.stringify(exported))).toThrow(/unknown assets record/i);
  });

  it('rejects scenario differences that make the applied plan invalid', () => {
    const exported = createPlanExport(createDemoSnapshot());
    exported.data.scenarios[0].overrides.retirement = {
      targetRetirementAge: 90,
      planningEndAge: 80,
    };
    expect(() => parsePlanImport(JSON.stringify(exported))).toThrow(/invalid plan/i);
  });

  it('rejects general inflation that would make real-dollar math divide by zero', () => {
    const exported = createPlanExport(createDemoSnapshot());
    exported.data.plan.assumptions.generalInflationPercent = -100;
    expect(() => parsePlanImport(JSON.stringify(exported))).toThrow(/greater than -100/i);
  });

  it('rejects a birth date that is incompatible with the projection base year', () => {
    const exported = createPlanExport(createDemoSnapshot());
    exported.data.plan.profile.dateOfBirth = '2090-01-01';
    expect(() => parsePlanImport(JSON.stringify(exported))).toThrow(/date of birth/i);
  });

  it('aligns imported birth dates and retirement ages with database bounds', () => {
    const futureBirth = createPlanExport(createDemoSnapshot());
    futureBirth.data.plan.profile.dateOfBirth = '2090-01-01';
    futureBirth.data.plan.baseYear = 2110;
    expect(() => parsePlanImport(JSON.stringify(futureBirth))).toThrow(/future/i);

    const earlyBirth = createPlanExport(createDemoSnapshot());
    earlyBirth.data.plan.profile.dateOfBirth = '1899-12-31';
    earlyBirth.data.plan.baseYear = 2000;
    expect(() => parsePlanImport(JSON.stringify(earlyBirth))).toThrow(/1900/i);

    const lateRetirement = createPlanExport(createDemoSnapshot());
    lateRetirement.data.plan.retirement.targetRetirementAge = 101;
    lateRetirement.data.plan.retirement.planningEndAge = 120;
    expect(() => parsePlanImport(JSON.stringify(lateRetirement))).toThrow(/100/);
  });

  it('rejects an asset contribution end before its effective start', () => {
    const exported = createPlanExport(createDemoSnapshot());
    const asset = exported.data.plan.assets[0];
    asset.startYear = 2030;
    asset.contributionStartYear = undefined;
    asset.contributionEndYear = 2029;
    expect(() => parsePlanImport(JSON.stringify(exported))).toThrow(/contribution end year/i);
  });

  it('rekeys all baseline records for safe import into another account', () => {
    const source = createDemoSnapshot();
    const imported = parsePlanImport(JSON.stringify(createPlanExport(source)));
    expect(imported.plan.id).not.toBe(source.plan.id);
    expect(imported.plan.profile.id).not.toBe(source.plan.profile.id);
    expect(imported.plan.incomeSources[0].id).not.toBe(source.plan.incomeSources[0].id);
    expect(imported.plan.incomeSources.every((item) => item.planId === imported.plan.id)).toBe(true);
    expect(plannerSnapshotSchema.safeParse(imported).success).toBe(true);
  });

  it('can preserve the current plan identity while replacing its inputs', () => {
    const targetPlanId = crypto.randomUUID();
    const targetProfileId = crypto.randomUUID();
    const imported = parsePlanImport(JSON.stringify(createPlanExport(createDemoSnapshot())), {
      planId: targetPlanId,
      profileId: targetProfileId,
    });
    expect(imported.plan.id).toBe(targetPlanId);
    expect(imported.plan.profile.id).toBe(targetProfileId);
    expect(imported.scenarios.every((scenario) => scenario.planId === targetPlanId)).toBe(true);
  });
});
