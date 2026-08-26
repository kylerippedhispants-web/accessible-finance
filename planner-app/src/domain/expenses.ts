import type { Frequency, NamedPlanEntity } from "./common";

export const EXPENSE_CATEGORIES = [
  "housing",
  "food",
  "transportation",
  "utilities",
  "insurance",
  "travel",
  "entertainment",
  "healthcare",
  "childcare",
  "education",
  "subscriptions",
  "other",
  "one_time",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense extends NamedPlanEntity {
  category: ExpenseCategory;
  amount: number;
  frequency: Frequency;
  startYear: number;
  /** Inclusive. Omit for an open-ended expense. */
  endYear?: number;
  /** Percentage points: `2.5` means 2.5% per year. */
  inflationPercent: number;
}
