import type {
  Asset,
  AssetCategory,
  Debt,
  Expense,
  FinancialPlan,
  IncomeSource,
  ManualRetirementBenefit,
  PlanScenario,
  ScenarioOverrides,
} from "../domain";
import { amortizeDebt, calculateLoanPayment } from "./debt";
import { annualizeAmount, periodsPerYear } from "./frequency";
import { inflateAmount, inflationIndex, toRealDollars } from "./inflation";
import { futureValueWithRecurringContributions } from "./investments";
import {
  assertFiniteNumber,
  assertNonNegative,
  assertPercentage,
  roundForOutput,
  roundMoney,
} from "./math";
import { applyScenarioOverrides } from "./scenarios";

export interface ProjectionYear {
  year: number;
  /** Age reached by the end of the calendar year. */
  age: number;
  retired: boolean;

  grossIncome: number;
  taxableIncome: number;
  taxes: number;
  netIncome: number;
  expenses: number;
  debtPayments: number;
  debtInterest: number;
  debtPrincipal: number;
  availableSavings: number;
  savingsRatePercent: number;

  contributions: number;
  withdrawals: number;
  investmentGrowth: number;
  propertyGrowth: number;
  otherAssetGrowth: number;
  unfundedCashFlow: number;

  cashAssets: number;
  investmentAssets: number;
  propertyAssets: number;
  otherAssets: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;

  inflationIndex: number;
  realGrossIncome: number;
  realTaxes: number;
  realNetIncome: number;
  realExpenses: number;
  realDebtPayments: number;
  realContributions: number;
  realCashAssets: number;
  realInvestmentAssets: number;
  realPropertyAssets: number;
  realOtherAssets: number;
  realTotalAssets: number;
  realTotalLiabilities: number;
  realNetWorth: number;
}

interface AssetState {
  asset: Asset;
  balance: number;
  active: boolean;
}

interface DebtState {
  debt: Debt;
  balance: number;
  periodsRemaining: number;
  active: boolean;
}

interface IncomeProjection {
  gross: number;
  taxable: number;
}

const EARNED_INCOME_TYPES = new Set<IncomeSource["type"]>([
  "employment",
  "self_employment",
]);

const CASH_ASSET_TYPES = new Set<Asset["type"]>(["chequing", "savings", "cash"]);
const INVESTMENT_ASSET_TYPES = new Set<Asset["type"]>([
  "tfsa",
  "rrsp",
  "fhsa",
  "resp",
  "rrif",
  "non_registered_investment",
]);
const PROPERTY_ASSET_TYPES = new Set<Asset["type"]>([
  "primary_residence",
  "rental_property",
]);

export function assetCategory(asset: Asset): AssetCategory {
  if (asset.category) {
    return asset.category;
  }
  if (CASH_ASSET_TYPES.has(asset.type)) {
    return "cash";
  }
  if (INVESTMENT_ASSET_TYPES.has(asset.type)) {
    return "investment";
  }
  if (PROPERTY_ASSET_TYPES.has(asset.type)) {
    return "property";
  }
  if (asset.type === "pension") {
    return "pension";
  }
  return "other";
}

function assertInteger(value: number, label: string): void {
  assertFiniteNumber(value, label);
  if (!Number.isInteger(value)) {
    throw new RangeError(`${label} must be an integer.`);
  }
}

function parseBirthYear(dateOfBirth: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth);
  if (!match) {
    throw new RangeError("Date of birth must use YYYY-MM-DD format.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const daysInMonth = [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) {
    throw new RangeError("Date of birth must be a valid calendar date.");
  }
  return year;
}

function isEnabled(item: { enabled?: boolean }): boolean {
  return item.enabled !== false;
}

function isActiveYear(startYear: number, endYear: number | undefined, year: number): boolean {
  return year >= startYear && (endYear === undefined || year <= endYear);
}

export function projectIncomeSource(
  source: IncomeSource,
  year: number,
  retired: boolean,
): IncomeProjection {
  if (!isEnabled(source)) {
    return { gross: 0, taxable: 0 };
  }

  const isOneTime = source.frequency === "one_time" || source.type === "one_time";
  const active = isOneTime
    ? year === source.startYear
    : isActiveYear(source.startYear, source.endYear, year);
  const endsAtRetirement = source.endsAtRetirement ?? EARNED_INCOME_TYPES.has(source.type);
  if (!active || (retired && endsAtRetirement)) {
    return { gross: 0, taxable: 0 };
  }

  const baseAnnualAmount = annualizeAmount(source.amount, source.frequency);
  const gross = isOneTime
    ? baseAnnualAmount
    : inflateAmount(baseAnnualAmount, source.annualGrowthPercent, year - source.startYear);
  return { gross, taxable: source.taxable ? gross : 0 };
}

export function projectExpense(expense: Expense, year: number): number {
  if (!isEnabled(expense)) {
    return 0;
  }
  const isOneTime = expense.frequency === "one_time" || expense.category === "one_time";
  const active = isOneTime
    ? year === expense.startYear
    : isActiveYear(expense.startYear, expense.endYear, year);
  if (!active) {
    return 0;
  }

  const annualAmount = annualizeAmount(expense.amount, expense.frequency);
  return isOneTime
    ? annualAmount
    : inflateAmount(annualAmount, expense.inflationPercent, year - expense.startYear);
}

function projectBenefit(benefit: ManualRetirementBenefit, age: number): IncomeProjection {
  if (!benefit.enabled || age < benefit.startAge) {
    return { gross: 0, taxable: 0 };
  }
  const gross = inflateAmount(
    benefit.annualAmount,
    benefit.annualGrowthPercent,
    age - benefit.startAge,
  );
  return { gross, taxable: benefit.taxable ? gross : 0 };
}

function validatePlan(plan: FinancialPlan): number {
  assertInteger(plan.baseYear, "Base year");
  const birthYear = parseBirthYear(plan.profile.dateOfBirth);
  const baseAge = plan.baseYear - birthYear;
  if (baseAge < 0) {
    throw new RangeError("Base year cannot be before the profile's birth year.");
  }

  const { assumptions, retirement } = plan;
  assertFiniteNumber(assumptions.effectiveTaxPercent, "Effective tax rate");
  if (assumptions.effectiveTaxPercent < 0 || assumptions.effectiveTaxPercent > 100) {
    throw new RangeError("Effective tax rate must be between 0% and 100%.");
  }
  assertPercentage(assumptions.generalInflationPercent, "General inflation rate");
  if (assumptions.generalInflationPercent <= -100) {
    throw new RangeError("General inflation rate must be greater than -100%.");
  }
  assertInteger(retirement.targetRetirementAge, "Target retirement age");
  assertInteger(retirement.planningEndAge, "Planning end age");
  if (retirement.targetRetirementAge < 0 || retirement.planningEndAge < baseAge) {
    throw new RangeError("Retirement and planning ages must cover the projection period.");
  }
  assertNonNegative(retirement.estimatedAnnualSpending, "Retirement spending");
  assertPercentage(retirement.spendingInflationPercent, "Retirement spending inflation");
  assertPercentage(
    retirement.investmentReturnBeforeRetirementPercent,
    "Pre-retirement return",
  );
  assertPercentage(
    retirement.investmentReturnAfterRetirementPercent,
    "Post-retirement return",
  );

  for (const benefit of [retirement.cpp, retirement.oas]) {
    assertNonNegative(benefit.annualAmount, "Retirement benefit amount");
    assertInteger(benefit.startAge, "Retirement benefit start age");
    if (benefit.startAge < 0) {
      throw new RangeError("Retirement benefit start age cannot be negative.");
    }
    assertPercentage(benefit.annualGrowthPercent, "Retirement benefit growth");
  }

  for (const source of plan.incomeSources) {
    assertNonNegative(source.amount, `${source.name} amount`);
    assertInteger(source.startYear, `${source.name} start year`);
    if (source.endYear !== undefined) {
      assertInteger(source.endYear, `${source.name} end year`);
      if (source.endYear < source.startYear) {
        throw new RangeError(`${source.name} end year cannot precede its start year.`);
      }
    }
    assertPercentage(source.annualGrowthPercent, `${source.name} growth`);
  }

  for (const expense of plan.expenses) {
    assertNonNegative(expense.amount, `${expense.name} amount`);
    assertInteger(expense.startYear, `${expense.name} start year`);
    if (expense.endYear !== undefined) {
      assertInteger(expense.endYear, `${expense.name} end year`);
      if (expense.endYear < expense.startYear) {
        throw new RangeError(`${expense.name} end year cannot precede its start year.`);
      }
    }
    assertPercentage(expense.inflationPercent, `${expense.name} inflation`);
  }

  for (const asset of plan.assets) {
    assertNonNegative(asset.currentValue, `${asset.name} value`);
    assertNonNegative(asset.annualContribution ?? 0, `${asset.name} contribution`);
    if (asset.expectedReturnPercent !== undefined) {
      assertPercentage(asset.expectedReturnPercent, `${asset.name} expected return`);
    }
    if (asset.postRetirementReturnPercent !== undefined) {
      assertPercentage(asset.postRetirementReturnPercent, `${asset.name} post-retirement return`);
    }
    if (asset.annualAppreciationPercent !== undefined) {
      assertPercentage(asset.annualAppreciationPercent, `${asset.name} appreciation`);
    }
    if (asset.startYear !== undefined) {
      assertInteger(asset.startYear, `${asset.name} start year`);
    }
    if (asset.contributionStartYear !== undefined) {
      assertInteger(asset.contributionStartYear, `${asset.name} contribution start year`);
    }
    if (asset.contributionEndYear !== undefined) {
      assertInteger(asset.contributionEndYear, `${asset.name} contribution end year`);
      const contributionStart = asset.contributionStartYear ?? asset.startYear ?? plan.baseYear;
      if (asset.contributionEndYear < contributionStart) {
        throw new RangeError(`${asset.name} contribution end year cannot precede its start year.`);
      }
    }
  }

  for (const debt of plan.debts) {
    assertNonNegative(debt.balance, `${debt.name} balance`);
    assertNonNegative(debt.annualInterestPercent, `${debt.name} interest rate`);
    assertNonNegative(debt.paymentAmount, `${debt.name} payment`);
    assertNonNegative(debt.extraPaymentAmount ?? 0, `${debt.name} extra payment`);
    assertNonNegative(debt.remainingAmortizationMonths, `${debt.name} amortization`);
    assertInteger(debt.remainingAmortizationMonths, `${debt.name} amortization`);
    if (debt.startYear !== undefined) {
      assertInteger(debt.startYear, `${debt.name} start year`);
    }
    if (debt.compoundingPeriodsPerYear !== undefined) {
      assertInteger(debt.compoundingPeriodsPerYear, `${debt.name} compounding periods`);
      if (debt.compoundingPeriodsPerYear <= 0) {
        throw new RangeError(`${debt.name} compounding periods must be greater than 0.`);
      }
    }
  }

  return birthYear;
}

function assetReturnPercent(
  asset: Asset,
  category: AssetCategory,
  retired: boolean,
  plan: FinancialPlan,
): number {
  if (category === "property") {
    return asset.annualAppreciationPercent ?? asset.expectedReturnPercent ?? 0;
  }
  if (category === "investment") {
    if (retired) {
      return asset.postRetirementReturnPercent
        ?? plan.retirement.investmentReturnAfterRetirementPercent;
    }
    return asset.expectedReturnPercent
      ?? plan.retirement.investmentReturnBeforeRetirementPercent;
  }
  return asset.expectedReturnPercent ?? 0;
}

function contributionForYear(asset: Asset, year: number, baseYear: number): number {
  const contribution = asset.annualContribution ?? 0;
  const startYear = asset.contributionStartYear ?? asset.startYear ?? baseYear;
  if (
    contribution <= 0
    || year < startYear
    || (asset.contributionEndYear !== undefined && year > asset.contributionEndYear)
  ) {
    return 0;
  }
  return contribution;
}

function activateAssets(states: AssetState[], year: number, baseYear: number): void {
  for (const state of states) {
    if (!state.active && year >= (state.asset.startYear ?? baseYear)) {
      state.active = true;
      state.balance = state.asset.currentValue;
    }
  }
}

function activateDebts(states: DebtState[], year: number, baseYear: number): void {
  for (const state of states) {
    if (!state.active && year >= (state.debt.startYear ?? baseYear)) {
      state.active = true;
      state.balance = state.debt.balance;
    }
  }
}

function withdrawFromAssets(states: AssetState[], requested: number): number {
  let remaining = requested;
  let withdrawn = 0;
  const categoryPriority: Record<AssetCategory, number> = {
    cash: 0,
    investment: 1,
    pension: 2,
    other: 3,
    property: 4,
  };
  const candidates = states
    .map((state, index) => ({ state, index, category: assetCategory(state.asset) }))
    .filter(({ state, category }) => state.active && category !== "property" && state.balance > 0);
  // `candidates` is a fresh local array, so sorting it cannot mutate caller state.
  // oxlint-disable-next-line unicorn/no-array-sort
  candidates.sort((a, b) => categoryPriority[a.category] - categoryPriority[b.category] || a.index - b.index);

  for (const { state } of candidates) {
    if (remaining <= 0) {
      break;
    }
    const amount = Math.min(state.balance, remaining);
    state.balance -= amount;
    remaining -= amount;
    withdrawn += amount;
  }
  return withdrawn;
}

function sumAssetCategory(states: AssetState[], category: AssetCategory): number {
  return states.reduce(
    (sum, state) => sum + (state.active && assetCategory(state.asset) === category ? state.balance : 0),
    0,
  );
}

function real(amount: number, generalInflationPercent: number, yearsFromBase: number): number {
  return roundMoney(toRealDollars(amount, generalInflationPercent, yearsFromBase));
}

/**
 * Runs a deterministic end-of-calendar-year projection. All tax calculations
 * use only the supplied flat effective rate; no Canadian tax or benefit rules
 * are inferred. CPP and OAS enter the projection solely from manual inputs.
 */
export function projectFinances(
  baseline: FinancialPlan,
  scenarioOrOverrides?: PlanScenario | ScenarioOverrides,
): ProjectionYear[] {
  const plan = applyScenarioOverrides(baseline, scenarioOrOverrides);
  const birthYear = validatePlan(plan);
  const finalYear = birthYear + plan.retirement.planningEndAge;
  const assetStates: AssetState[] = plan.assets.filter(isEnabled).map((asset) => {
    const active = (asset.startYear ?? plan.baseYear) <= plan.baseYear;
    return { asset, active, balance: active ? asset.currentValue : 0 };
  });
  const debtStates: DebtState[] = plan.debts.filter(isEnabled).map((debt) => {
    const active = (debt.startYear ?? plan.baseYear) <= plan.baseYear;
    const scheduledPaymentCount = Math.max(
      0,
      Math.ceil((debt.remainingAmortizationMonths / 12) * periodsPerYear(debt.paymentFrequency)),
    );
    // A positive balance with no time remaining is due now, rather than a
    // liability that silently freezes for the rest of the projection.
    const paymentCount = debt.balance > 0 ? Math.max(1, scheduledPaymentCount) : 0;
    return {
      debt,
      active,
      balance: active ? debt.balance : 0,
      periodsRemaining: paymentCount,
    };
  });

  let unallocatedCash = 0;
  let shortfallLiability = 0;
  const projection: ProjectionYear[] = [];

  for (let year = plan.baseYear; year <= finalYear; year += 1) {
    const yearsFromBase = year - plan.baseYear;
    const age = year - birthYear;
    const retired = age >= plan.retirement.targetRetirementAge;
    activateAssets(assetStates, year, plan.baseYear);
    activateDebts(debtStates, year, plan.baseYear);

    let grossIncome = 0;
    let taxableIncome = 0;
    for (const source of plan.incomeSources) {
      const income = projectIncomeSource(source, year, retired);
      grossIncome += income.gross;
      taxableIncome += income.taxable;
    }
    for (const benefit of [plan.retirement.cpp, plan.retirement.oas]) {
      const income = projectBenefit(benefit, age);
      grossIncome += income.gross;
      taxableIncome += income.taxable;
    }

    const taxes = taxableIncome * (plan.assumptions.effectiveTaxPercent / 100);
    const netIncome = grossIncome - taxes;

    let recurringExpenses = 0;
    let oneTimeExpenses = 0;
    for (const expense of plan.expenses) {
      const amount = projectExpense(expense, year);
      if (expense.frequency === "one_time" || expense.category === "one_time") {
        oneTimeExpenses += amount;
      } else {
        recurringExpenses += amount;
      }
    }
    if (retired) {
      const retirementSpending = inflateAmount(
        plan.retirement.estimatedAnnualSpending,
        plan.retirement.spendingInflationPercent,
        yearsFromBase,
      );
      recurringExpenses = plan.retirement.expenseMode === "replace_recurring"
        ? retirementSpending
        : recurringExpenses + retirementSpending;
    }
    const expenses = recurringExpenses + oneTimeExpenses;

    let debtPayments = 0;
    let debtInterest = 0;
    let debtPrincipal = 0;
    for (const state of debtStates) {
      if (!state.active || state.balance <= 0 || state.periodsRemaining <= 0) {
        continue;
      }
      const debt = state.debt;
      const paymentPeriods = periodsPerYear(debt.paymentFrequency);
      const periodsThisYear = Math.min(paymentPeriods, state.periodsRemaining);
      const compoundingPeriods = debt.compoundingPeriodsPerYear
        ?? (debt.type === "mortgage" ? 2 : paymentPeriods);
      const paymentAmount = debt.paymentAmount > 0
        ? debt.paymentAmount
        : calculateLoanPayment({
          principal: state.balance,
          annualInterestPercent: debt.annualInterestPercent,
          numberOfPayments: state.periodsRemaining,
          paymentFrequency: debt.paymentFrequency,
          compoundingPeriodsPerYear: compoundingPeriods,
        });
      const result = amortizeDebt({
        principal: state.balance,
        annualInterestPercent: debt.annualInterestPercent,
        paymentAmount,
        paymentFrequency: debt.paymentFrequency,
        maxPeriods: periodsThisYear,
        extraPaymentAmount: debt.extraPaymentAmount,
        compoundingPeriodsPerYear: compoundingPeriods,
        // Honour the user-supplied amortization horizon. If regular payments
        // are too small, the final scheduled period becomes a balloon payoff.
        payOffAtFinalPeriod: periodsThisYear === state.periodsRemaining,
      });
      state.balance = result.remainingBalance;
      state.periodsRemaining -= result.schedule.length;
      debtPayments += result.totalPayments;
      debtInterest += result.totalInterest;
      debtPrincipal += result.totalPrincipal;
    }

    const availableSavings = netIncome - expenses - debtPayments;
    const plannedContributions = assetStates.reduce(
      (sum, state) => sum + (state.active
        ? contributionForYear(state.asset, year, plan.baseYear)
        : 0),
      0,
    );
    let contributionFunding = 0;
    let withdrawals = 0;
    let unfundedCashFlow = 0;
    const liquidCashAfterRequiredSpending = unallocatedCash + availableSavings;
    const cashUsedForRequiredSpending = Math.min(
      unallocatedCash,
      Math.max(0, -availableSavings),
    );
    withdrawals += cashUsedForRequiredSpending;

    if (liquidCashAfterRequiredSpending >= 0) {
      const shortfallRepayment = Math.min(shortfallLiability, liquidCashAfterRequiredSpending);
      shortfallLiability -= shortfallRepayment;
      const cashAfterShortfallRepayment = liquidCashAfterRequiredSpending - shortfallRepayment;
      contributionFunding = Math.min(plannedContributions, cashAfterShortfallRepayment);
      unallocatedCash = cashAfterShortfallRepayment - contributionFunding;
    } else {
      // Existing cash can fund required spending, but scheduled contributions
      // are optional savings and must never fund themselves through a same-year
      // withdrawal from the asset that just received them.
      unallocatedCash = 0;
    }

    const contributionFundingRatio = plannedContributions > 0
      ? contributionFunding / plannedContributions
      : 0;
    let contributions = 0;
    let investmentGrowth = 0;
    let propertyGrowth = 0;
    let otherAssetGrowth = 0;
    for (const state of assetStates) {
      if (!state.active) {
        continue;
      }
      const category = assetCategory(state.asset);
      const annualContribution = contributionForYear(state.asset, year, plan.baseYear)
        * contributionFundingRatio;
      const openingBalance = state.balance;
      const endingBalance = futureValueWithRecurringContributions({
        initialBalance: openingBalance,
        annualRatePercent: assetReturnPercent(state.asset, category, retired, plan),
        annualContribution,
        contributionFrequency: state.asset.contributionFrequency ?? "monthly",
        years: 1,
      });
      const growth = endingBalance - openingBalance - annualContribution;
      state.balance = endingBalance;
      contributions += annualContribution;
      if (category === "investment") {
        investmentGrowth += growth;
      } else if (category === "property") {
        propertyGrowth += growth;
      } else {
        otherAssetGrowth += growth;
      }
    }

    if (liquidCashAfterRequiredSpending < 0) {
      let fundingNeeded = -liquidCashAfterRequiredSpending;
      const assetWithdrawal = withdrawFromAssets(assetStates, fundingNeeded);
      withdrawals += assetWithdrawal;
      fundingNeeded -= assetWithdrawal;
      if (fundingNeeded > 0) {
        shortfallLiability += fundingNeeded;
        unfundedCashFlow = fundingNeeded;
      }
    }

    const cashAssets = sumAssetCategory(assetStates, "cash") + unallocatedCash;
    const investmentAssets = sumAssetCategory(assetStates, "investment");
    const propertyAssets = sumAssetCategory(assetStates, "property");
    const otherAssets = sumAssetCategory(assetStates, "pension")
      + sumAssetCategory(assetStates, "other");
    const totalAssets = cashAssets + investmentAssets + propertyAssets + otherAssets;
    const debtLiabilities = debtStates.reduce(
      (sum, state) => sum + (state.active ? state.balance : 0),
      0,
    );
    const totalLiabilities = debtLiabilities + shortfallLiability;
    const netWorth = totalAssets - totalLiabilities;
    const savingsRatePercent = grossIncome === 0 ? 0 : (availableSavings / grossIncome) * 100;
    const index = inflationIndex(plan.assumptions.generalInflationPercent, yearsFromBase);

    projection.push({
      year,
      age,
      retired,
      grossIncome: roundMoney(grossIncome),
      taxableIncome: roundMoney(taxableIncome),
      taxes: roundMoney(taxes),
      netIncome: roundMoney(netIncome),
      expenses: roundMoney(expenses),
      debtPayments: roundMoney(debtPayments),
      debtInterest: roundMoney(debtInterest),
      debtPrincipal: roundMoney(debtPrincipal),
      availableSavings: roundMoney(availableSavings),
      savingsRatePercent: roundForOutput(savingsRatePercent, 4),
      contributions: roundMoney(contributions),
      withdrawals: roundMoney(withdrawals),
      investmentGrowth: roundMoney(investmentGrowth),
      propertyGrowth: roundMoney(propertyGrowth),
      otherAssetGrowth: roundMoney(otherAssetGrowth),
      unfundedCashFlow: roundMoney(unfundedCashFlow),
      cashAssets: roundMoney(cashAssets),
      investmentAssets: roundMoney(investmentAssets),
      propertyAssets: roundMoney(propertyAssets),
      otherAssets: roundMoney(otherAssets),
      totalAssets: roundMoney(totalAssets),
      totalLiabilities: roundMoney(totalLiabilities),
      netWorth: roundMoney(netWorth),
      inflationIndex: roundForOutput(index),
      realGrossIncome: real(grossIncome, plan.assumptions.generalInflationPercent, yearsFromBase),
      realTaxes: real(taxes, plan.assumptions.generalInflationPercent, yearsFromBase),
      realNetIncome: real(netIncome, plan.assumptions.generalInflationPercent, yearsFromBase),
      realExpenses: real(expenses, plan.assumptions.generalInflationPercent, yearsFromBase),
      realDebtPayments: real(debtPayments, plan.assumptions.generalInflationPercent, yearsFromBase),
      realContributions: real(contributions, plan.assumptions.generalInflationPercent, yearsFromBase),
      realCashAssets: real(cashAssets, plan.assumptions.generalInflationPercent, yearsFromBase),
      realInvestmentAssets: real(
        investmentAssets,
        plan.assumptions.generalInflationPercent,
        yearsFromBase,
      ),
      realPropertyAssets: real(
        propertyAssets,
        plan.assumptions.generalInflationPercent,
        yearsFromBase,
      ),
      realOtherAssets: real(otherAssets, plan.assumptions.generalInflationPercent, yearsFromBase),
      realTotalAssets: real(totalAssets, plan.assumptions.generalInflationPercent, yearsFromBase),
      realTotalLiabilities: real(
        totalLiabilities,
        plan.assumptions.generalInflationPercent,
        yearsFromBase,
      ),
      realNetWorth: real(netWorth, plan.assumptions.generalInflationPercent, yearsFromBase),
    });
  }

  return projection;
}
