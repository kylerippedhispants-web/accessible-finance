import type { FinancialPlan, PlanScenario, ScenarioOverrides } from "../domain";
import { projectFinances, type ProjectionYear } from "./projection";
import { applyScenarioOverrides } from "./scenarios";

export type FireEstimate = FireEstimateAvailable | FireEstimateUnavailable;

export interface FireEstimateAvailable {
  status: "estimated";
  /** Earliest modeled age whose retirement-year projection passes the screen. */
  age: number;
  /** Calendar year in which the modeled retirement period begins. */
  year: number;
  yearsFromBase: number;
  /**
   * Cash, investments, pensions, and other non-property assets at the opening
   * of the estimated FIRE year. The engine models this set as withdrawable.
   */
  openingModeledWithdrawableAssets: number;
  realOpeningModeledWithdrawableAssets: number;
  horizonAge: number;
  horizonYear: number;
  terminalNetWorth: number;
  realTerminalNetWorth: number;
}

export interface FireEstimateUnavailable {
  status: "not_reached" | "needs_inputs";
  age: null;
  year: null;
  yearsFromBase: null;
  openingModeledWithdrawableAssets: null;
  realOpeningModeledWithdrawableAssets: null;
  horizonAge: number;
  horizonYear: number;
  terminalNetWorth: null;
  realTerminalNetWorth: null;
}

const FIRE_TOLERANCE = 0.01;

/** True when retirement includes at least one expense or scheduled debt payment. */
export function hasModeledRetirementOutflow(projection: ProjectionYear[]): boolean {
  return projection.some((row) => (
    row.retired
    && (row.expenses > FIRE_TOLERANCE || row.debtPayments > FIRE_TOLERANCE)
  ));
}

/** Applies the same deterministic funding screen used by the FIRE estimator. */
export function projectionPassesFireScreen(projection: ProjectionYear[]): boolean {
  const finalYear = projection.at(-1);
  return Boolean(
    finalYear
    && hasModeledRetirementOutflow(projection)
    && projection.every((row) => row.unfundedCashFlow <= FIRE_TOLERANCE)
    && finalYear.shortfallLiability <= FIRE_TOLERANCE
    && finalYear.netWorth >= -FIRE_TOLERANCE,
  );
}

function unavailableEstimate(
  status: FireEstimateUnavailable["status"],
  birthYear: number,
  horizonAge: number,
): FireEstimateUnavailable {
  return {
    status,
    age: null,
    year: null,
    yearsFromBase: null,
    openingModeledWithdrawableAssets: null,
    realOpeningModeledWithdrawableAssets: null,
    horizonAge,
    horizonYear: birthYear + horizonAge,
    terminalNetWorth: null,
    realTerminalNetWorth: null,
  };
}

/**
 * Finds the first annual retirement boundary that the deterministic model can
 * fund through the selected horizon.
 *
 * The result is not a safe-withdrawal target, probability, guarantee, or
 * recommendation. Its FIRE amount is the opening balance of the exact
 * non-property asset set this engine may draw from; withdrawal tax, access
 * rules, market volatility, and a property sale are not inferred.
 */
export function estimateFireTarget(
  plan: FinancialPlan,
  scenarioOrOverrides?: PlanScenario | ScenarioOverrides,
): FireEstimate {
  const effectivePlan = applyScenarioOverrides(plan, scenarioOrOverrides);
  const birthYear = Number(effectivePlan.profile.dateOfBirth.slice(0, 4));
  const horizonAge = effectivePlan.retirement.planningEndAge;

  const baseAge = effectivePlan.baseYear - birthYear;
  const firstCandidate = Math.max(18, baseAge);
  const lastCandidate = Math.min(100, horizonAge - 1);
  let foundModeledRetirementOutflow = false;

  for (let candidate = firstCandidate; candidate <= lastCandidate; candidate += 1) {
    const candidatePlan: FinancialPlan = {
      ...effectivePlan,
      retirement: {
        ...effectivePlan.retirement,
        targetRetirementAge: candidate,
      },
    };
    const projection = projectFinances(candidatePlan);
    const firstRetirementYear = projection.find((row) => row.age >= candidate);
    const finalYear = projection.at(-1);
    foundModeledRetirementOutflow ||= hasModeledRetirementOutflow(projection);
    if (
      firstRetirementYear
      && finalYear
      && projectionPassesFireScreen(projection)
    ) {
      return {
        status: "estimated",
        age: candidate,
        year: firstRetirementYear.year,
        yearsFromBase: firstRetirementYear.year - effectivePlan.baseYear,
        openingModeledWithdrawableAssets: firstRetirementYear.openingModeledWithdrawableAssets,
        realOpeningModeledWithdrawableAssets: firstRetirementYear.realOpeningModeledWithdrawableAssets,
        horizonAge,
        horizonYear: finalYear.year,
        terminalNetWorth: finalYear.netWorth,
        realTerminalNetWorth: finalYear.realNetWorth,
      };
    }
  }

  return unavailableEstimate(foundModeledRetirementOutflow ? "not_reached" : "needs_inputs", birthYear, horizonAge);
}

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
  const estimate = estimateFireTarget(plan, scenarioOrOverrides);
  return estimate.status === "estimated" ? estimate.age : null;
}
