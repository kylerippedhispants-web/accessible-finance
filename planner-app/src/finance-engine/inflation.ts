import { assertFiniteNumber, assertPercentage, percentToDecimal } from "./math";

export function inflationIndex(inflationPercent: number, years: number): number {
  assertPercentage(inflationPercent, "Inflation rate");
  assertFiniteNumber(years, "Years");
  if (years < 0) {
    throw new RangeError("Years must be greater than or equal to 0.");
  }

  return (1 + percentToDecimal(inflationPercent)) ** years;
}
export function inflateAmount(amount: number, inflationPercent: number, years: number): number {
  assertFiniteNumber(amount, "Amount");
  return amount * inflationIndex(inflationPercent, years);
}

/** Converts a nominal future amount to base-year purchasing power. */
export function toRealDollars(
  nominalAmount: number,
  inflationPercent: number,
  yearsFromBase: number,
): number {
  assertFiniteNumber(nominalAmount, "Nominal amount");
  const index = inflationIndex(inflationPercent, yearsFromBase);
  if (index === 0) {
    throw new RangeError("The inflation index cannot be zero.");
  }
  return nominalAmount / index;
}
