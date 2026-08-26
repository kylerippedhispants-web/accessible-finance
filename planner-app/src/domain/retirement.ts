export interface ManualRetirementBenefit {
  enabled: boolean;
  /** User-entered annual amount. The engine does not estimate this benefit. */
  annualAmount: number;
  startAge: number;
  taxable: boolean;
  /** User-entered annual indexation in percentage points. */
  annualGrowthPercent: number;
}
export type RetirementExpenseMode = "replace_recurring" | "add_to_recurring";

export interface RetirementSettings {
  targetRetirementAge: number;
  planningEndAge: number;
  /** Annual amount expressed in base-year dollars. */
  estimatedAnnualSpending: number;
  /** Percentage points. */
  spendingInflationPercent: number;
  /** Default percentage return for investments without an asset-specific rate. */
  investmentReturnBeforeRetirementPercent: number;
  /** Default percentage return after retirement. */
  investmentReturnAfterRetirementPercent: number;
  expenseMode: RetirementExpenseMode;
  /** CPP and OAS are manual inputs only; no entitlement calculation is made. */
  cpp: ManualRetirementBenefit;
  oas: ManualRetirementBenefit;
}
