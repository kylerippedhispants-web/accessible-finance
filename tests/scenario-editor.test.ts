import { describe, expect, it } from 'vitest';
import type { PlanScenario } from '../planner-app/src/domain';
import { createDemoSnapshot } from '../planner-app/src/data/demoPlan';
import { controlledOverrides, makeDraft } from '../planner-app/src/pages/ScenariosPage';

describe('scenario assumption editor', () => {
  it('preserves collection override branches outside its supported controls', () => {
    const { plan } = createDemoSnapshot();
    const investment = plan.assets.find((asset) => asset.type === 'tfsa')!;
    const debt = plan.debts[0];
    const scenario: PlanScenario = {
      id: 'preserve-branches',
      planId: plan.id,
      name: 'Mixed changes',
      overrides: {
        assets: {
          update: [{ entityId: investment.id, changes: { annualContribution: 9_000 } }],
        },
        debts: {
          update: [{ entityId: debt.id, changes: { extraPaymentAmount: 250 } }],
        },
      },
    };

    const draft = makeDraft(plan, scenario);
    expect(controlledOverrides(plan, draft).assets).toEqual(scenario.overrides.assets);
    draft.retirementAge = plan.retirement.targetRetirementAge + 1;
    draft.returnRate = plan.retirement.investmentReturnBeforeRetirementPercent - 1;
    draft.touched.returnRate = true;
    const overrides = controlledOverrides(plan, draft);

    expect(overrides.debts).toEqual(scenario.overrides.debts);
    expect(overrides.assets?.update?.find((update) => update.entityId === investment.id)?.changes)
      .toMatchObject({ annualContribution: 9_000, expectedReturnPercent: draft.returnRate });
    expect(scenario.overrides.assets?.update?.[0].changes).toEqual({ annualContribution: 9_000 });
  });
});
