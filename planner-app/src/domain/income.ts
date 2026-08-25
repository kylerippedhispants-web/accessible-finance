import type { Frequency, NamedPlanEntity } from "./common";

export const INCOME_TYPES = [
  "employment",
  "self_employment",
  "rental_income",
  "pension",
  "government_benefit",
  "investment_income",
  "other",
  "one_time",
] as const;

export type IncomeType = (typeof INCOME_TYPES)[number];

export interface IncomeSource extends NamedPlanEntity {
  type: IncomeType;
  amount: number;
  frequency: Frequency;
  startYear: number;
  /** Inclusive. Omit for an open-ended source. */
  endYear?: number;
  /** Percentage points: `3` means 3% per year. */
  annualGrowthPercent: number;
  taxable: boolean;
  /**
   * When true, this source is excluded beginning in the year the target
   * retirement age is reached. When omitted, earned income defaults to true.
   */
  endsAtRetirement?: boolean;
}
