export const MONEY_PRECISION = 2;

export function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} must be a finite number.`);
  }
}

export function assertNonNegative(value: number, label: string): void {
  assertFiniteNumber(value, label);
  if (value < 0) {
    throw new RangeError(`${label} must be greater than or equal to 0.`);
  }
}

export function assertPercentage(value: number, label: string): void {
  assertFiniteNumber(value, label);
  if (value < -100) {
    throw new RangeError(`${label} cannot be less than -100%.`);
  }
}

export function percentToDecimal(percent: number): number {
  assertPercentage(percent, "Percent");
  return percent / 100;
}

export function roundMoney(value: number): number {
  assertFiniteNumber(value, "Money value");
  const factor = 10 ** MONEY_PRECISION;
  const roundedMagnitude = Math.round((Math.abs(value) + Number.EPSILON) * factor) / factor;
  return Math.sign(value) * roundedMagnitude;
}

export function roundForOutput(value: number, places = 8): number {
  assertFiniteNumber(value, "Output value");
  const factor = 10 ** places;
  const roundedMagnitude = Math.round((Math.abs(value) + Number.EPSILON) * factor) / factor;
  return Math.sign(value) * roundedMagnitude;
}
