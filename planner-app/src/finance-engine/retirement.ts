import type { FinancialPlan, PlanScenario, ScenarioOverrides } from "../domain";
import { projectFinances } from "./projection";
import { applyScenarioOverrides } from "./scenarios";

/**
 * Returns the earliest modeled retirement age that reaches the plan horizon
 * without unfunded cash flow and finishes with non-negative net worth.
 *
 * This is a deterministic screening metric, not an actuarial success rate. It
 * inherits every assumption and limitation of `projectFinances`.
 */
export function estimateRetirementAge(
  plan: FinancialPlan,
  scenarioOrOverrides?: PlanScenario | ScenarioOverrides,
): number | null {
  const effectivePlan = applyScenarioOverrides(plan, scenarioOrOverrides);
  const birthYear = Number(effectivePlan.profile.dateOfBirth.slice(0, 4));
  const baseAge = effectivePlan.baseYear - birthYear;
  const firstCandidate = Math.max(18, baseAge);
  const lastCandidate = Math.min(100, effectivePlan.retirement.planningEndAge - 1);

  for (let candidate = firstCandidate; candidate <= lastCandidate; candidate += 1) {
    const candidatePlan: FinancialPlan = {
      ...effectivePlan,
      retirement: {
        ...effectivePlan.retirement,
        targetRetirementAge: candidate,
      },
    };
    const retirementYears = projectFinances(candidatePlan).filter((row) => row.age >= candidate);
    const finalYear = retirementYears.at(-1);
    if (
      finalYear
      && retirementYears.every((row) => row.unfundedCashFlow <= 0.01)
      && finalYear.netWorth >= 0
    ) {
      return candidate;
    }
  }

  return null;
}
