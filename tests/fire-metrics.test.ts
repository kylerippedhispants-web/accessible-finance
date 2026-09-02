import { describe, expect, it } from 'vitest';
import { buildFireOverviewModel } from '../planner-app/src/dashboard/fireMetrics';
import { createBlankPlan, createDemoSnapshot } from '../planner-app/src/data/demoPlan';
import { estimateFireTarget, projectFinances } from '../planner-app/src/finance-engine';

describe('FIRE overview metrics', () => {
  it('builds a finite deterministic target from the demo plan', () => {
    const { plan } = createDemoSnapshot();
    const projection = projectFinances(plan);
    const estimate = estimateFireTarget(plan);
    const first = buildFireOverviewModel(plan, estimate, projection);
    const second = buildFireOverviewModel(plan, estimateFireTarget(plan), projectFinances(plan));

    expect(first).toEqual(second);
    expect(first.estimate.status).toBe('estimated');
    expect(Number.isFinite(first.currentModeledWithdrawableAssets)).toBe(true);
    expect(Number.isFinite(first.progressPercent)).toBe(true);
    expect(first.progressValue).toBeGreaterThanOrEqual(0);
    expect(first.progressValue).toBeLessThanOrEqual(100);
  });

  it('excludes property and disabled assets from current FIRE capital', () => {
    const plan = createBlankPlan();
    plan.retirement.estimatedAnnualSpending = 1;
    plan.assets = [
      { id: 'cash', name: 'Cash', type: 'cash', currentValue: 1_000 },
      { id: 'home', name: 'Home', type: 'primary_residence', currentValue: 900_000 },
      { id: 'disabled', name: 'Disabled TFSA', type: 'tfsa', currentValue: 50_000, enabled: false },
    ];
    const projection = projectFinances(plan);
    const model = buildFireOverviewModel(plan, estimateFireTarget(plan), projection);

    expect(model.currentModeledWithdrawableAssets).toBe(1_000);
  });

  it('uses an explicit needs-input state instead of fabricating a blank-plan target', () => {
    const plan = createBlankPlan();
    const projection = projectFinances(plan);
    const model = buildFireOverviewModel(plan, estimateFireTarget(plan), projection);

    expect(model).toMatchObject({
      progressPercent: null,
      progressValue: null,
      estimate: { status: 'needs_inputs', age: null, year: null },
    });
  });

  it('caps the visual progress value while preserving the explanatory percentage', () => {
    const plan = createBlankPlan();
    plan.retirement.estimatedAnnualSpending = 1;
    plan.assets = [{ id: 'cash', name: 'Cash', type: 'cash', currentValue: 100 }];
    const projection = projectFinances(plan);
    const estimate = {
      status: 'estimated' as const,
      age: 36,
      year: plan.baseYear,
      yearsFromBase: 0,
      openingModeledWithdrawableAssets: 50,
      realOpeningModeledWithdrawableAssets: 50,
      horizonAge: plan.retirement.planningEndAge,
      horizonYear: plan.baseYear + 60,
      terminalNetWorth: 0,
      realTerminalNetWorth: 0,
    };
    const model = buildFireOverviewModel(plan, estimate, projection);

    expect(model.progressPercent).toBe(200);
    expect(model.progressValue).toBe(100);
  });
});
