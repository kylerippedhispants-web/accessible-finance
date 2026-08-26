import type { RecurringFrequency } from "../domain";
import { periodsPerYear } from "./frequency";
import {
  assertFiniteNumber,
  assertNonNegative,
  assertPercentage,
  percentToDecimal,
  roundMoney,
} from "./math";

export interface AmortizationInput {
  principal: number;
  annualInterestPercent: number;
  paymentAmount: number;
  paymentFrequency: RecurringFrequency;
  maxPeriods: number;
  extraPaymentAmount?: number;
  /** Defaults to the number of payments per year. */
  compoundingPeriodsPerYear?: number;
  /** Adjust the last scheduled payment to clear any rounding residue. */
  payOffAtFinalPeriod?: boolean;
}

export interface AmortizationPeriod {
  period: number;
  openingBalance: number;
  payment: number;
  regularPayment: number;
  extraPayment: number;
  interest: number;
  principal: number;
  closingBalance: number;
}

export interface AmortizationResult {
  schedule: AmortizationPeriod[];
  totalPayments: number;
  totalInterest: number;
  totalPrincipal: number;
  remainingBalance: number;
  paidOff: boolean;
}

export interface LoanPaymentInput {
  principal: number;
  annualInterestPercent: number;
  numberOfPayments: number;
  paymentFrequency: RecurringFrequency;
  compoundingPeriodsPerYear?: number;
}

export function periodicInterestRate(
  annualInterestPercent: number,
  paymentFrequency: RecurringFrequency,
  compoundingPeriodsPerYear = periodsPerYear(paymentFrequency),
): number {
  assertPercentage(annualInterestPercent, "Annual interest rate");
  assertFiniteNumber(compoundingPeriodsPerYear, "Compounding periods per year");
  if (compoundingPeriodsPerYear <= 0) {
    throw new RangeError("Compounding periods per year must be greater than 0.");
  }

  const paymentsPerYear = periodsPerYear(paymentFrequency);
  const nominalRatePerCompoundPeriod =
    percentToDecimal(annualInterestPercent) / compoundingPeriodsPerYear;
  return (1 + nominalRatePerCompoundPeriod) **
    (compoundingPeriodsPerYear / paymentsPerYear) - 1;
}

export function calculateLoanPayment(input: LoanPaymentInput): number {
  const {
    principal,
    annualInterestPercent,
    numberOfPayments,
    paymentFrequency,
    compoundingPeriodsPerYear,
  } = input;
  assertNonNegative(principal, "Principal");
  assertFiniteNumber(numberOfPayments, "Number of payments");
  if (!Number.isInteger(numberOfPayments) || numberOfPayments <= 0) {
    throw new RangeError("Number of payments must be a positive integer.");
  }

  if (principal === 0) {
    return 0;
  }

  const rate = periodicInterestRate(
    annualInterestPercent,
    paymentFrequency,
    compoundingPeriodsPerYear,
  );
  if (rate === 0) {
    return roundMoney(principal / numberOfPayments);
  }
  return roundMoney((principal * rate) / (1 - (1 + rate) ** -numberOfPayments));
}

/**
 * Produces a cent-rounded amortization schedule. If a payment is below accrued
 * interest, the negative principal amount transparently shows amortization in
 * the wrong direction rather than silently forcing a payoff.
 */
export function amortizeDebt(input: AmortizationInput): AmortizationResult {
  const {
    principal,
    annualInterestPercent,
    paymentAmount,
    paymentFrequency,
    maxPeriods,
    extraPaymentAmount = 0,
    compoundingPeriodsPerYear,
    payOffAtFinalPeriod = false,
  } = input;
  assertNonNegative(principal, "Principal");
  assertNonNegative(paymentAmount, "Payment amount");
  assertNonNegative(extraPaymentAmount, "Extra payment amount");
  assertFiniteNumber(maxPeriods, "Maximum periods");
  if (!Number.isInteger(maxPeriods) || maxPeriods < 0) {
    throw new RangeError("Maximum periods must be a non-negative integer.");
  }

  const rate = periodicInterestRate(
    annualInterestPercent,
    paymentFrequency,
    compoundingPeriodsPerYear,
  );
  const schedule: AmortizationPeriod[] = [];
  let balance = roundMoney(principal);

  for (let period = 1; period <= maxPeriods && balance > 0; period += 1) {
    const openingBalance = balance;
    const interest = roundMoney(openingBalance * rate);
    const amountDue = roundMoney(openingBalance + interest);
    const regularPayment = payOffAtFinalPeriod && period === maxPeriods
      ? amountDue
      : Math.min(roundMoney(paymentAmount), amountDue);
    const remainingAfterRegular = roundMoney(amountDue - regularPayment);
    const extraPayment = Math.min(roundMoney(extraPaymentAmount), remainingAfterRegular);
    const payment = roundMoney(regularPayment + extraPayment);
    const principalPaid = roundMoney(payment - interest);
    balance = roundMoney(Math.max(0, openingBalance - principalPaid));

    schedule.push({
      period,
      openingBalance,
      payment,
      regularPayment,
      extraPayment,
      interest,
      principal: principalPaid,
      closingBalance: balance,
    });
  }

  const totalPayments = roundMoney(schedule.reduce((sum, row) => sum + row.payment, 0));
  const totalInterest = roundMoney(schedule.reduce((sum, row) => sum + row.interest, 0));
  const totalPrincipal = roundMoney(schedule.reduce((sum, row) => sum + row.principal, 0));

  return {
    schedule,
    totalPayments,
    totalInterest,
    totalPrincipal,
    remainingBalance: balance,
    paidOff: balance === 0,
  };
}
