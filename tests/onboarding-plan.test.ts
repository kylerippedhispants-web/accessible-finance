// @vitest-environment jsdom

import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBlankPlan, createStarterPlan, type PlannerSnapshot } from '../planner-app/src/data/demoPlan';
import type { FinancialPlan } from '../planner-app/src/domain';
import { financialPlanSchema } from '../planner-app/src/validation/planSchemas';

const mocks = vi.hoisted(() => ({
  planner: {
    snapshot: null as PlannerSnapshot | null,
    completeOnboarding: vi.fn<(plan: FinancialPlan) => Promise<boolean>>(),
  },
  navigate: vi.fn<(path: string, options?: { replace?: boolean }) => void>(),
}));

vi.mock('../planner-app/src/state/PlannerContext', () => ({
  usePlanner: () => mocks.planner,
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));

import { OnboardingPage } from '../planner-app/src/pages/OnboardingPage';

const inputs = {
  firstName: 'Fictional Taylor',
  provinceOrTerritory: 'ON' as const,
  dateOfBirth: '1990-01-01',
  targetRetirementAge: 65,
  planningEndAge: 95,
  annualEmploymentIncome: 60_000,
  annualExpenses: 30_000,
};

async function fillAmount(id: string, value: string) {
  const field = document.getElementById(id);
  if (!(field instanceof HTMLInputElement)) throw new Error('Onboarding amount field is missing.');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  if (!setter) throw new Error('Input value setter is missing.');
  await act(async () => {
    setter.call(field, value);
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function submitForm() {
  const form = document.querySelector('form');
  if (!form) throw new Error('Onboarding form is missing.');
  await act(async () => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
}

describe('starter plan ownership', () => {
  it.each([
    [60_000, 30_000],
    [60_000, 0],
    [0, 30_000],
    [0, 0],
  ])('keeps the existing cloud identity with income %s and expenses %s', (income, expenses) => {
    const initial = createBlankPlan({ firstName: 'Original name' });
    initial.baseYear = 2025;
    const before = structuredClone(initial);
    const plan = createStarterPlan({ ...inputs, annualEmploymentIncome: income, annualExpenses: expenses }, initial);

    expect(plan.id).toBe(initial.id);
    expect(plan.profile.id).toBe(initial.profile.id);
    expect(plan.profile.firstName).toBe(inputs.firstName);
    expect(plan.baseYear).toBe(initial.baseYear);
    expect(plan.incomeSources).toHaveLength(income > 0 ? 1 : 0);
    expect(plan.expenses).toHaveLength(expenses > 0 ? 1 : 0);
    expect([...plan.incomeSources, ...plan.expenses].every(item => item.planId === initial.id && item.startYear === initial.baseYear)).toBe(true);
    expect(financialPlanSchema.safeParse(plan).success).toBe(true);
    expect(initial).toEqual(before);
  });

  it('generates independent consistent identities without an existing plan', () => {
    const first = createStarterPlan(inputs);
    const second = createStarterPlan(inputs);
    expect(first.id).not.toBe(second.id);
    expect(first.profile.id).not.toBe(second.profile.id);
    for (const plan of [first, second]) {
      expect([...plan.incomeSources, ...plan.expenses].every(item => item.planId === plan.id)).toBe(true);
      expect(financialPlanSchema.safeParse(plan).success).toBe(true);
    }
  });

  it('still rejects a child that belongs to a different plan', () => {
    const plan = createStarterPlan(inputs, createBlankPlan());
    plan.incomeSources[0].planId = crypto.randomUUID();
    const result = financialPlanSchema.safeParse(plan);
    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(expect.objectContaining({
      path: ['incomeSources', 0, 'planId'],
      message: 'Record does not belong to this plan.',
    }));
  });
});

describe('onboarding form submission', () => {
  const reactTestGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean };
  let root: Root;

  beforeEach(() => {
    reactTestGlobal.IS_REACT_ACT_ENVIRONMENT = true;
    document.body.innerHTML = '<div id="root"></div>';
    root = createRoot(document.getElementById('root')!);
    mocks.planner.snapshot = { plan: createBlankPlan({ firstName: inputs.firstName }), scenarios: [] };
    mocks.planner.completeOnboarding.mockReset();
    mocks.navigate.mockReset();
  });

  afterEach(() => {
    act(() => root.unmount());
    reactTestGlobal.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it('submits positive amounts and retries with the same parent identity after a failed save', async () => {
    const initial = mocks.planner.snapshot!.plan;
    mocks.planner.completeOnboarding.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    await act(async () => root.render(createElement(OnboardingPage)));
    await fillAmount('onboarding-income', '60000');
    await fillAmount('onboarding-expenses', '30000');
    await submitForm();

    expect(mocks.planner.completeOnboarding).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(document.querySelector('[role="alert"]')).toBeNull();

    await submitForm();
    expect(mocks.planner.completeOnboarding).toHaveBeenCalledTimes(2);
    for (const [plan] of mocks.planner.completeOnboarding.mock.calls) {
      expect(plan.id).toBe(initial.id);
      expect(plan.profile.id).toBe(initial.profile.id);
      expect(plan.incomeSources[0]).toMatchObject({ planId: initial.id, amount: 60_000 });
      expect(plan.expenses[0]).toMatchObject({ planId: initial.id, amount: 30_000 });
      expect(financialPlanSchema.safeParse(plan).success).toBe(true);
    }
    expect(mocks.navigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('submits zero income and expenses without adding placeholder records', async () => {
    mocks.planner.completeOnboarding.mockResolvedValue(true);
    await act(async () => root.render(createElement(OnboardingPage)));
    await submitForm();

    expect(mocks.planner.completeOnboarding).toHaveBeenCalledTimes(1);
    const [plan] = mocks.planner.completeOnboarding.mock.calls[0];
    expect(plan.incomeSources).toEqual([]);
    expect(plan.expenses).toEqual([]);
    expect(financialPlanSchema.safeParse(plan).success).toBe(true);
    expect(mocks.navigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });
});
