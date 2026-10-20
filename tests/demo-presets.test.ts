import { describe, expect, it } from 'vitest';
import { createBlankPlan, createDemoSnapshot, DEMO_PRESETS } from '../planner-app/src/data/demoPlan';
import { applyScenarioOverrides, estimateFireTarget, projectFinances } from '../planner-app/src/finance-engine';
import { plannerSnapshotSchema } from '../planner-app/src/validation/planSchemas';

describe('fictional demo examples', () => {
  it.each(DEMO_PRESETS)('$name is valid, owned by its plan, and produces finite projections', ({ id }) => {
    const snapshot = createDemoSnapshot(id);
    expect(plannerSnapshotSchema.safeParse(snapshot).success).toBe(true);
    expect(createDemoSnapshot(id)).toEqual(snapshot);
    for (const collection of [snapshot.plan.incomeSources, snapshot.plan.expenses, snapshot.plan.assets, snapshot.plan.debts, snapshot.scenarios]) {
      expect(collection.every((item) => item.planId === snapshot.plan.id)).toBe(true);
    }
    const projection = projectFinances(snapshot.plan);
    expect(projection.length).toBeGreaterThan(1);
    for (const year of projection) {
      for (const value of Object.values(year)) {
        if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
      }
    }
    expect(['estimated', 'not_reached', 'needs_inputs']).toContain(estimateFireTarget(snapshot.plan).status);
    const lower = applyScenarioOverrides(snapshot.plan, snapshot.scenarios[0]);
    expect(lower.assets.find((asset) => asset.type === 'tfsa')?.expectedReturnPercent).toBe(3.5);
  });

  it('uses separate project-income periods without counting both in the same year', () => {
    const { plan } = createDemoSnapshot('variable-income');
    const rows = projectFinances(plan);
    expect(rows[0].grossIncome).toBe(48_000);
    expect(rows[2].grossIncome).toBeCloseTo(36_000 * 1.02 ** 2 + 6_000);
  });

  it('starts a future benefit at the entered nominal amount and indexes only after that year', () => {
    const plan = createBlankPlan({ dateOfBirth: '1981-01-01', firstName: 'Fictional example' });
    plan.baseYear = 2026;
    plan.retirement.planningEndAge = 66;
    plan.retirement.cpp = { enabled: true, annualAmount: 10_000, startAge: 65, taxable: true, annualGrowthPercent: 2 };
    const rows = projectFinances(plan);
    expect(rows.find((row) => row.year === 2045)?.grossIncome).toBe(0);
    expect(rows.find((row) => row.year === 2046)?.grossIncome).toBe(10_000);
    expect(rows.find((row) => row.year === 2046)?.realGrossIncome).toBeCloseTo(6_729.71, 2);
    expect(rows.find((row) => row.year === 2047)?.grossIncome).toBe(10_200);
  });
});
