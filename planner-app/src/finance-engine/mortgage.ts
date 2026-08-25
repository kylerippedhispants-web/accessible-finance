import type { RecurringFrequency } from "../domain";
import {
  amortizeDebt,
  calculateLoanPayment,
  type AmortizationResult,
} from "./debt";
import { periodsPerYear } from "./frequency";

export interface MortgagePaymentInput {
  principal: number;
  annualInterestPercent: number;
  amortizationYears: number;
  paymentFrequency: RecurringFrequency;
  /** Defaults to semi-annual compounding. */
  compoundingPeriodsPerYear?: number;
}

export interface MortgageAmortizationInput extends MortgagePaymentInput {
  paymentAmount?: number;
  extraPaymentAmount?: number;
}

export function calculateMortgagePayment(input: MortgagePaymentInput): number {
  const paymentCount = Math.round(input.amortizationYears * periodsPerYear(input.paymentFrequency));
  return calculateLoanPayment({
    principal: input.principal,
    annualInterestPercent: input.annualInterestPercent,
    numberOfPayments: paymentCount,
    paymentFrequency: input.paymentFrequency,
    compoundingPeriodsPerYear: input.compoundingPeriodsPerYear ?? 2,
  });
}

export function amortizeMortgage(input: MortgageAmortizationInput): AmortizationResult {
  const maxPeriods = Math.round(input.amortizationYears * periodsPerYear(input.paymentFrequency));
  const paymentAmount = input.paymentAmount ?? calculateMortgagePayment(input);
  return amortizeDebt({
    principal: input.principal,
    annualInterestPercent: input.annualInterestPercent,
    paymentAmount,
    paymentFrequency: input.paymentFrequency,
    maxPeriods,
    extraPaymentAmount: input.extraPaymentAmount,
    compoundingPeriodsPerYear: input.compoundingPeriodsPerYear ?? 2,
    payOffAtFinalPeriod: true,
  });
}
