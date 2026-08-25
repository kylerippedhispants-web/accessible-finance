import type { Frequency, RecurringFrequency } from "../domain";
import { assertFiniteNumber } from "./math";

const PERIODS_PER_YEAR: Record<RecurringFrequency, number> = {
  monthly: 12,
  biweekly: 26,
  annual: 1,
};

export function periodsPerYear(frequency: RecurringFrequency): number {
  const periods = PERIODS_PER_YEAR[frequency];
  if (periods === undefined) {
    throw new RangeError(`Unsupported recurring frequency: ${String(frequency)}`);
  }
  return periods;
}

/** Converts a recurring amount to an annual total. One-time amounts are unchanged. */
export function annualizeAmount(amount: number, frequency: Frequency): number {
  assertFiniteNumber(amount, "Amount");
  return frequency === "one_time" ? amount : amount * periodsPerYear(frequency);
}

/** Splits an annual total evenly across the selected recurring frequency. */
export function amountPerPeriod(annualAmount: number, frequency: RecurringFrequency): number {
  assertFiniteNumber(annualAmount, "Annual amount");
  return annualAmount / periodsPerYear(frequency);
}
