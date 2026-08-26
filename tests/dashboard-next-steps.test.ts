import { describe, expect, it } from 'vitest';
import { createBlankPlan } from '../planner-app/src/data/demoPlan';
import { buildDashboardNextSteps } from '../planner-app/src/pages/DashboardPage';

describe('dashboard next steps', () => {
  it('identifies only missing inputs from a blank plan', () => {
    const plan = createBlankPlan({ firstName: 'Test' });

    expect(buildDashboardNextSteps(plan, 0).map((step) => step.id)).toEqual([
      'income',
      'expenses',
      'assets',
      'debts',
      'retirement-spending',
      'retirement-age',
      'scenarios',
    ]);
  });

  it('recognizes represented categories without inventing benchmark targets', () => {
    const plan = createBlankPlan({ firstName: 'Test' });
    plan.incomeSources = [{
      id: 'income',
      planId: plan.id,
      name: 'Income',
      type: 'employment',
      amount: 1,
      frequency: 'annual',
      startYear: plan.baseYear,
      annualGrowthPercent: 0,
      taxable: true,
    }];
    plan.expenses = [{
      id: 'expense',
      planId: plan.id,
      name: 'Expense',
      category: 'other',
      amount: 1,
      frequency: 'annual',
      startYear: plan.baseYear,
      inflationPercent: 0,
    }];
    plan.assets = [{
      id: 'cash',
      planId: plan.id,
      name: 'Cash',
      type: 'cash',
      currentValue: 1,
    }];
    plan.debts = [{
      id: 'debt',
      planId: plan.id,
      name: 'Debt',
      type: 'other',
      balance: 1,
      annualInterestPercent: 0,
      paymentAmount: 1,
      paymentFrequency: 'annual',
      remainingAmortizationMonths: 12,
    }];
    plan.retirement.estimatedAnnualSpending = 1;

    const steps = buildDashboardNextSteps(plan, 1);
    expect(steps.map((step) => step.id)).toEqual(['retirement-age']);
    expect(steps[0].description).toContain(`age ${plan.retirement.targetRetirementAge}`);
    expect(steps[0].description).not.toMatch(/%|\$|recommended|should/i);
  });

  it('surfaces disabled entries and missing cash representation from the plan itself', () => {
    const plan = createBlankPlan({ firstName: 'Test' });
    plan.incomeSources = [{
      id: 'disabled-income',
      planId: plan.id,
      name: 'Paused income',
      type: 'other',
      amount: 1,
      frequency: 'annual',
      startYear: plan.baseYear,
      annualGrowthPercent: 0,
      taxable: false,
      enabled: false,
    }];
    plan.assets = [{
      id: 'investment',
      planId: plan.id,
      name: 'Investment',
      type: 'tfsa',
      currentValue: 1,
    }];

    const steps = buildDashboardNextSteps(plan, 1);
    expect(steps.find((step) => step.id === 'disabled-income')).toMatchObject({
      route: '/income',
      action: 'Review income',
    });
    expect(steps.find((step) => step.id === 'cash')).toMatchObject({ route: '/assets' });
  });
});
