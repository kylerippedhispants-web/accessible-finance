import type { NamedPlanEntity, RecurringFrequency } from "./common";

export const DEBT_TYPES = [
  "mortgage",
  "heloc",
  "line_of_credit",
  "credit_card",
  "car_loan",
  "student_loan",
  "personal_loan",
  "other",
] as const;

export type DebtType = (typeof DEBT_TYPES)[number];

export interface Debt extends NamedPlanEntity {
  type: DebtType;
  balance: number;
  /** Percentage points: `5` means 5% per year. */
  annualInterestPercent: number;
  /** Contractual amount per payment period. */
  paymentAmount: number;
  paymentFrequency: RecurringFrequency;
  /** Remaining amortization at the plan base year. */
  remainingAmortizationMonths: number;
  /** Additional principal paid with every regular payment. */
  extraPaymentAmount?: number;
  /**
   * Interest compounding periods per year. Mortgages default to 2 and other
   * debts default to the payment frequency when omitted.
   */
  compoundingPeriodsPerYear?: number;
  /** First year the debt exists. Defaults to the plan base year. */
  startYear?: number;
}
