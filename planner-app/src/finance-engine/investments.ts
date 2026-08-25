import type { RecurringFrequency } from "../domain";
import { amountPerPeriod, periodsPerYear } from "./frequency";
import { assertNonNegative, assertPercentage, percentToDecimal } from "./math";

export type ContributionTiming = "start" | "end";

export interface RecurringContributionInput {
  initialBalance: number;
  annualRatePercent: number;
  /** Total contribution during a full year. */
  annualContribution: number;
  contributionFrequency: RecurringFrequency;
  years: number;
  contributionTiming?: ContributionTiming;
}

export function futureValue(
  initialBalance: number,
  annualRatePercent: number,
  years: number,
): number {
  assertNonNegative(initialBalance, "Initial balance");
  assertPercentage(annualRatePercent, "Annual return");
  assertNonNegative(years, "Years");
  return initialBalance * (1 + percentToDecimal(annualRatePercent)) ** years;
}

/** Returns only the gain, excluding the original principal. */
export function compoundGrowth(
  initialBalance: number,
  annualRatePercent: number,
  years: number,
): number {
  return futureValue(initialBalance, annualRatePercent, years) - initialBalance;
}

/**
 * Future value using an effective annual return and evenly distributed deposits.
 * Contributions default to the end of each period (ordinary annuity).
 */
export function futureValueWithRecurringContributions(input: RecurringContributionInput): number {
  const {
    initialBalance,
    annualRatePercent,
    annualContribution,
    contributionFrequency,
    years,
    contributionTiming = "end",
  } = input;

  assertNonNegative(initialBalance, "Initial balance");
  assertPercentage(annualRatePercent, "Annual return");
  assertNonNegative(annualContribution, "Annual contribution");
  assertNonNegative(years, "Years");

  const paymentsPerYear = periodsPerYear(contributionFrequency);
  const exactPeriods = years * paymentsPerYear;
  if (!Number.isInteger(exactPeriods)) {
    throw new RangeError("Years must resolve to a whole number of contribution periods.");
  }

  const annualRate = percentToDecimal(annualRatePercent);
  const periodicRate = (1 + annualRate) ** (1 / paymentsPerYear) - 1;
  const contribution = amountPerPeriod(annualContribution, contributionFrequency);
  let balance = initialBalance;

  for (let period = 0; period < exactPeriods; period += 1) {
    if (contributionTiming === "start") {
      balance += contribution;
    }
    balance *= 1 + periodicRate;
    if (contributionTiming === "end") {
      balance += contribution;
    }
  }

  return balance;
}
