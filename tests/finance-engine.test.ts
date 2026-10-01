import { describe, expect, it } from "vitest";
import type { FinancialPlan, PlanScenario } from "../planner-app/src/domain";
import {
  amortizeDebt,
  amortizeMortgage,
  annualizeAmount,
  applyScenarioOverrides,
  calculateMortgagePayment,
  compoundGrowth,
  estimateFireTarget,
  estimateRetirementAge,
  futureValue,
  futureValueWithRecurringContributions,
  inflateAmount,
  projectExpense,
  projectFinances,
  projectIncomeSource,
  toRealDollars,
} from "../planner-app/src/finance-engine";

function createPlan(): FinancialPlan {
  return {
    schemaVersion: 1,
    id: "plan-1",
    name: "Test plan",
    baseYear: 2026,
    profile: {
      id: "profile-1",
      firstName: "Test",
      provinceOrTerritory: "ON",
      dateOfBirth: "1990-06-15",
      currency: "CAD",
    },
    assumptions: {
      effectiveTaxPercent: 0,
      generalInflationPercent: 2,
    },
    incomeSources: [],
    expenses: [],
    assets: [],
    debts: [],
    retirement: {
      targetRetirementAge: 65,
      planningEndAge: 67,
      estimatedAnnualSpending: 0,
      spendingInflationPercent: 2,
      investmentReturnBeforeRetirementPercent: 5,
      investmentReturnAfterRetirementPercent: 3,
      expenseMode: "replace_recurring",
      cpp: {
        enabled: false,
        annualAmount: 0,
        startAge: 65,
        taxable: true,
        annualGrowthPercent: 0,
      },
      oas: {
        enabled: false,
        annualAmount: 0,
        startAge: 65,
        taxable: true,
        annualGrowthPercent: 0,
      },
    },
  };
}

describe("frequency and growth helpers", () => {
  it("annualizes supported frequencies and leaves one-time amounts unchanged", () => {
    expect(annualizeAmount(100, "monthly")).toBe(1_200);
    expect(annualizeAmount(100, "biweekly")).toBe(2_600);
    expect(annualizeAmount(100, "annual")).toBe(100);
    expect(annualizeAmount(100, "one_time")).toBe(100);
  });

  it("calculates compound returns", () => {
    expect(futureValue(10_000, 5, 10)).toBeCloseTo(16_288.9463, 4);
    expect(compoundGrowth(10_000, 5, 10)).toBeCloseTo(6_288.9463, 4);
  });

  it("supports recurring contributions and their timing", () => {
    const ordinary = futureValueWithRecurringContributions({
      initialBalance: 0,
      annualRatePercent: 6,
      annualContribution: 1_200,
      contributionFrequency: "monthly",
      years: 1,
    });
    const due = futureValueWithRecurringContributions({
      initialBalance: 0,
      annualRatePercent: 6,
      annualContribution: 1_200,
      contributionFrequency: "monthly",
      years: 1,
      contributionTiming: "start",
    });

    expect(ordinary).toBeGreaterThan(1_200);
    expect(due).toBeGreaterThan(ordinary);
    expect(futureValueWithRecurringContributions({
      initialBalance: 500,
      annualRatePercent: 0,
      annualContribution: 1_200,
      contributionFrequency: "monthly",
      years: 1,
    })).toBeCloseTo(1_700, 8);
  });

  it("inflates expenses and reverses nominal values into base-year dollars", () => {
    expect(inflateAmount(10_000, 2, 5)).toBeCloseTo(11_040.80803, 5);
    expect(toRealDollars(11_040.80803, 2, 5)).toBeCloseTo(10_000, 4);
  });
});

describe("income and expense schedules", () => {
  it("applies annual income growth from the source start year", () => {
    const source = {
      id: "income-1",
      name: "Employment",
      type: "employment" as const,
      amount: 100_000,
      frequency: "annual" as const,
      startYear: 2026,
      annualGrowthPercent: 3,
      taxable: true,
      endsAtRetirement: false,
    };

    expect(projectIncomeSource(source, 2026, false).gross).toBe(100_000);
    expect(projectIncomeSource(source, 2028, false).gross).toBeCloseTo(106_090, 5);
  });

  it("applies each expense's own inflation assumption", () => {
    const expense = {
      id: "expense-1",
      name: "Food",
      category: "food" as const,
      amount: 1_000,
      frequency: "monthly" as const,
      startYear: 2026,
      inflationPercent: 2.5,
    };

    expect(projectExpense(expense, 2026)).toBe(12_000);
    expect(projectExpense(expense, 2028)).toBeCloseTo(12_607.5, 5);
  });

  it("includes one-time income and expenses only in their scheduled year", () => {
    const plan = createPlan();
    plan.incomeSources.push({
      id: "bonus",
      name: "Sale proceeds",
      type: "one_time",
      amount: 25_000,
      frequency: "one_time",
      startYear: 2028,
      annualGrowthPercent: 99,
      taxable: false,
    });
    plan.expenses.push({
      id: "renovation",
      name: "Renovation",
      category: "one_time",
      amount: 10_000,
      frequency: "one_time",
      startYear: 2028,
      inflationPercent: 99,
    });

    const projection = projectFinances(plan);
    expect(projection.find(({ year }) => year === 2027)?.grossIncome).toBe(0);
    expect(projection.find(({ year }) => year === 2028)?.grossIncome).toBe(25_000);
    expect(projection.find(({ year }) => year === 2028)?.expenses).toBe(10_000);
    expect(projection.find(({ year }) => year === 2029)?.expenses).toBe(0);
  });
});

describe("debt and mortgage amortization", () => {
  it("repays a zero-interest debt exactly", () => {
    const result = amortizeDebt({
      principal: 1_200,
      annualInterestPercent: 0,
      paymentAmount: 100,
      paymentFrequency: "monthly",
      maxPeriods: 12,
    });

    expect(result.paidOff).toBe(true);
    expect(result.schedule).toHaveLength(12);
    expect(result.totalInterest).toBe(0);
    expect(result.totalPrincipal).toBe(1_200);
    expect(result.remainingBalance).toBe(0);
  });

  it("uses semi-annual compounding and fully amortizes a mortgage", () => {
    const payment = calculateMortgagePayment({
      principal: 300_000,
      annualInterestPercent: 5,
      amortizationYears: 25,
      paymentFrequency: "monthly",
    });
    const result = amortizeMortgage({
      principal: 300_000,
      annualInterestPercent: 5,
      amortizationYears: 25,
      paymentFrequency: "monthly",
      paymentAmount: payment,
    });

    expect(payment).toBeCloseTo(1_744.81, 2);
    expect(result.paidOff).toBe(true);
    expect(result.schedule).toHaveLength(300);
    expect(result.totalPrincipal).toBeCloseTo(300_000, 2);
    expect(result.totalInterest).toBeGreaterThan(200_000);
  });

  it("extra payments shorten payoff and reduce interest", () => {
    const baseline = amortizeDebt({
      principal: 20_000,
      annualInterestPercent: 8,
      paymentAmount: 500,
      paymentFrequency: "monthly",
      maxPeriods: 120,
    });
    const accelerated = amortizeDebt({
      principal: 20_000,
      annualInterestPercent: 8,
      paymentAmount: 500,
      extraPaymentAmount: 100,
      paymentFrequency: "monthly",
      maxPeriods: 120,
    });

    expect(accelerated.schedule.length).toBeLessThan(baseline.schedule.length);
    expect(accelerated.totalInterest).toBeLessThan(baseline.totalInterest);
  });
});

describe("year-by-year projection", () => {
  it("calculates net worth from all assets and liabilities", () => {
    const plan = createPlan();
    plan.assets = [
      {
        id: "cash",
        name: "Cash",
        type: "cash",
        currentValue: 20_000,
        expectedReturnPercent: 0,
      },
      {
        id: "home",
        name: "Home",
        type: "primary_residence",
        currentValue: 400_000,
        annualAppreciationPercent: 0,
      },
    ];
    plan.debts = [{
      id: "mortgage",
      name: "Mortgage",
      type: "mortgage",
      balance: 300_000,
      annualInterestPercent: 0,
      paymentAmount: 1,
      paymentFrequency: "annual",
      remainingAmortizationMonths: 1_200,
    }];

    const firstYear = projectFinances(plan)[0];
    expect(firstYear.totalAssets).toBe(419_999);
    expect(firstYear.totalLiabilities).toBe(299_999);
    expect(firstYear.netWorth).toBe(120_000);
  });

  it("excludes disabled assets and debts from balances and cash flow", () => {
    const plan = createPlan();
    plan.assets = [{
      id: "disabled-asset",
      name: "Disabled asset",
      type: "tfsa",
      currentValue: 10_000,
      expectedReturnPercent: 5,
      annualContribution: 1_200,
      enabled: false,
    }];
    plan.debts = [{
      id: "disabled-debt",
      name: "Disabled debt",
      type: "personal_loan",
      balance: 5_000,
      annualInterestPercent: 10,
      paymentAmount: 500,
      paymentFrequency: "monthly",
      remainingAmortizationMonths: 12,
      enabled: false,
    }];

    const firstYear = projectFinances(plan)[0];
    expect(firstYear.contributions).toBe(0);
    expect(firstYear.debtPayments).toBe(0);
    expect(firstYear.totalAssets).toBe(0);
    expect(firstYear.totalLiabilities).toBe(0);
    expect(firstYear.netWorth).toBe(0);
  });

  it("uses a final balloon payment instead of freezing an underfunded debt", () => {
    const plan = createPlan();
    plan.incomeSources = [{
      id: "income",
      name: "Income",
      type: "other",
      amount: 2_000,
      frequency: "annual",
      startYear: plan.baseYear,
      endYear: plan.baseYear,
      annualGrowthPercent: 0,
      taxable: false,
    }];
    plan.debts = [{
      id: "underfunded",
      name: "Underfunded loan",
      type: "personal_loan",
      balance: 1_000,
      annualInterestPercent: 0,
      paymentAmount: 1,
      paymentFrequency: "monthly",
      remainingAmortizationMonths: 12,
    }];

    const projection = projectFinances(plan);
    expect(projection[0]).toMatchObject({
      debtPayments: 1_000,
      debtPrincipal: 1_000,
      totalLiabilities: 0,
    });
    expect(projection[1].debtPayments).toBe(0);
  });

  it("treats a positive debt with zero months remaining as immediately due", () => {
    const plan = createPlan();
    plan.incomeSources = [{
      id: "income",
      name: "Income",
      type: "other",
      amount: 2_000,
      frequency: "annual",
      startYear: plan.baseYear,
      endYear: plan.baseYear,
      annualGrowthPercent: 0,
      taxable: false,
    }];
    plan.debts = [{
      id: "due-now",
      name: "Due now",
      type: "other",
      balance: 1_000,
      annualInterestPercent: 0,
      paymentAmount: 0,
      paymentFrequency: "annual",
      remainingAmortizationMonths: 0,
    }];

    const firstYear = projectFinances(plan)[0];
    expect(firstYear.debtPayments).toBe(1_000);
    expect(firstYear.debtPrincipal).toBe(1_000);
    expect(firstYear.totalLiabilities).toBe(0);
  });

  it("uses only the user-supplied effective rate on explicitly taxable income", () => {
    const plan = createPlan();
    plan.assumptions.effectiveTaxPercent = 25;
    plan.incomeSources = [
      {
        id: "taxable",
        name: "Taxable income",
        type: "other",
        amount: 100_000,
        frequency: "annual",
        startYear: 2026,
        endYear: 2026,
        annualGrowthPercent: 0,
        taxable: true,
      },
      {
        id: "not-taxable",
        name: "Non-taxable input",
        type: "other",
        amount: 50_000,
        frequency: "annual",
        startYear: 2026,
        endYear: 2026,
        annualGrowthPercent: 0,
        taxable: false,
      },
    ];

    const firstYear = projectFinances(plan)[0];
    expect(firstYear.grossIncome).toBe(150_000);
    expect(firstYear.taxableIncome).toBe(100_000);
    expect(firstYear.taxes).toBe(25_000);
  });

  it("keeps nominal and real values separate", () => {
    const plan = createPlan();
    plan.assets = [{
      id: "savings",
      name: "Savings",
      type: "savings",
      currentValue: 10_000,
      expectedReturnPercent: 2,
    }];

    const secondYear = projectFinances(plan)[1];
    expect(secondYear.cashAssets).toBeCloseTo(10_404, 2);
    expect(secondYear.realCashAssets).toBeCloseTo(10_200, 2);
    expect(secondYear.realNetWorth).toBeCloseTo(10_200, 2);
    expect(secondYear.inflationIndex).toBeCloseTo(1.02, 8);
  });

  it("transitions to retirement spending and manual CPP/OAS inputs", () => {
    const plan = createPlan();
    plan.profile.dateOfBirth = "1962-06-15";
    plan.retirement.targetRetirementAge = 65;
    plan.retirement.planningEndAge = 66;
    plan.retirement.estimatedAnnualSpending = 30_000;
    plan.retirement.spendingInflationPercent = 0;
    plan.retirement.cpp = {
      enabled: true,
      annualAmount: 12_000,
      startAge: 65,
      taxable: true,
      annualGrowthPercent: 0,
    };
    plan.incomeSources = [{
      id: "employment",
      name: "Employment",
      type: "employment",
      amount: 100_000,
      frequency: "annual",
      startYear: 2026,
      annualGrowthPercent: 0,
      taxable: true,
      endsAtRetirement: true,
    }];
    plan.expenses = [{
      id: "living",
      name: "Living expenses",
      category: "other",
      amount: 10_000,
      frequency: "annual",
      startYear: 2026,
      inflationPercent: 0,
    }];

    const projection = projectFinances(plan);
    const working = projection.find(({ age }) => age === 64);
    const retired = projection.find(({ age }) => age === 65);
    expect(working).toMatchObject({ retired: false, grossIncome: 100_000, expenses: 10_000 });
    expect(retired).toMatchObject({ retired: true, grossIncome: 12_000, expenses: 30_000 });
  });

  it("estimates the earliest retirement age that avoids modeled shortfalls", () => {
    const plan = createPlan();
    plan.assumptions.generalInflationPercent = 0;
    plan.retirement.targetRetirementAge = 39;
    plan.retirement.planningEndAge = 40;
    plan.retirement.estimatedAnnualSpending = 100;
    plan.retirement.spendingInflationPercent = 0;
    plan.incomeSources = [{
      id: "employment",
      name: "Employment",
      type: "employment",
      amount: 100,
      frequency: "annual",
      startYear: plan.baseYear,
      annualGrowthPercent: 0,
      taxable: false,
      endsAtRetirement: true,
    }];

    expect(estimateRetirementAge(plan)).toBe(39);

    plan.incomeSources = [];
    expect(estimateRetirementAge(plan)).toBeNull();
  });

  it("returns an opening FIRE amount that matches modeled-withdrawable assets", () => {
    const plan = createPlan();
    plan.retirement.planningEndAge = 40;
    plan.retirement.estimatedAnnualSpending = 100;
    plan.retirement.spendingInflationPercent = 0;
    plan.retirement.investmentReturnBeforeRetirementPercent = 0;
    plan.retirement.investmentReturnAfterRetirementPercent = 0;
    plan.assets = [
      {
        id: "future-investment",
        name: "Future investment",
        type: "tfsa",
        currentValue: 1_000,
        startYear: 2028,
        expectedReturnPercent: 0,
      },
      {
        id: "home",
        name: "Home",
        type: "primary_residence",
        currentValue: 1_000_000,
        annualAppreciationPercent: 0,
      },
    ];

    const estimate = estimateFireTarget(plan);

    expect(estimate).toMatchObject({
      status: "estimated",
      age: 38,
      year: 2028,
      openingModeledWithdrawableAssets: 1_000,
      horizonAge: 40,
      horizonYear: 2030,
    });
    expect(estimate.realOpeningModeledWithdrawableAssets).toBeCloseTo(961.17, 2);
  });

  it("does not hide a pre-retirement funding failure behind property equity", () => {
    const plan = createPlan();
    plan.retirement.planningEndAge = 40;
    plan.retirement.estimatedAnnualSpending = 100;
    plan.retirement.spendingInflationPercent = 0;
    plan.assets = [{
      id: "home",
      name: "Home",
      type: "primary_residence",
      currentValue: 1_000_000,
      annualAppreciationPercent: 0,
    }];
    plan.expenses = [{
      id: "unfunded-expense",
      name: "Immediate expense",
      category: "one_time",
      amount: 1_000,
      frequency: "one_time",
      startYear: plan.baseYear,
      endYear: plan.baseYear,
      inflationPercent: 0,
    }];

    expect(estimateFireTarget(plan)).toMatchObject({ status: "not_reached" });
    expect(estimateRetirementAge(plan)).toBeNull();
  });

  it("asks for retirement spending before presenting a FIRE target", () => {
    const plan = createPlan();

    expect(estimateFireTarget(plan)).toMatchObject({
      status: "needs_inputs",
      age: null,
      openingModeledWithdrawableAssets: null,
    });
  });

  it("does not fabricate a zero-dollar FIRE target for an empty add-to-recurring plan", () => {
    const plan = createPlan();
    plan.retirement.expenseMode = "add_to_recurring";

    expect(estimateFireTarget(plan)).toMatchObject({
      status: "needs_inputs",
      age: null,
      openingModeledWithdrawableAssets: null,
    });
  });

  it("uses recurring retirement expenses when added retirement spending is zero", () => {
    const plan = createPlan();
    plan.retirement.expenseMode = "add_to_recurring";
    plan.retirement.planningEndAge = 40;
    plan.assets = [{ id: "cash", name: "Cash", type: "cash", currentValue: 10_000 }];
    plan.expenses = [{
      id: "living-costs",
      name: "Living costs",
      category: "housing",
      amount: 100,
      frequency: "annual",
      startYear: plan.baseYear,
      inflationPercent: 0,
    }];

    expect(estimateFireTarget(plan)).toMatchObject({
      status: "estimated",
      age: 36,
      year: 2026,
    });
  });

  it("applies investment and property growth plus recurring contributions", () => {
    const plan = createPlan();
    plan.assets = [
      {
        id: "tfsa",
        name: "TFSA",
        type: "tfsa",
        currentValue: 10_000,
        expectedReturnPercent: 5,
        annualContribution: 1_200,
        contributionFrequency: "monthly",
      },
      {
        id: "home",
        name: "Home",
        type: "primary_residence",
        currentValue: 500_000,
        annualAppreciationPercent: 2,
      },
    ];
    plan.incomeSources = [{
      id: "income",
      name: "Income",
      type: "other",
      amount: 1_200,
      frequency: "annual",
      startYear: 2026,
      endYear: 2026,
      annualGrowthPercent: 0,
      taxable: false,
    }];

    const year = projectFinances(plan)[0];
    expect(year.contributions).toBe(1_200);
    expect(year.investmentAssets).toBeGreaterThan(11_700);
    expect(year.propertyAssets).toBe(510_000);
    expect(year.investmentGrowth).toBeGreaterThan(500);
    expect(year.propertyGrowth).toBe(10_000);
  });

  it("does not create investment gains from an unfunded contribution", () => {
    const plan = createPlan();
    plan.assumptions.generalInflationPercent = 0;
    plan.assets = [{
      id: "unfunded-tfsa",
      name: "Unfunded TFSA",
      type: "tfsa",
      currentValue: 0,
      expectedReturnPercent: 5,
      annualContribution: 1_200,
      contributionFrequency: "monthly",
    }];

    const firstYear = projectFinances(plan)[0];
    expect(firstYear.availableSavings).toBe(0);
    expect(firstYear.contributions).toBe(0);
    expect(firstYear.investmentGrowth).toBe(0);
    expect(firstYear.investmentAssets).toBe(0);
    expect(firstYear.netWorth).toBe(0);
  });

  it("caps scheduled contributions at cash that remains after required spending", () => {
    const plan = createPlan();
    plan.assumptions.generalInflationPercent = 0;
    plan.incomeSources = [{
      id: "partial-funding",
      name: "Partial contribution funding",
      type: "other",
      amount: 600,
      frequency: "annual",
      startYear: plan.baseYear,
      endYear: plan.baseYear,
      annualGrowthPercent: 0,
      taxable: false,
    }];
    plan.assets = [{
      id: "partially-funded-tfsa",
      name: "Partially funded TFSA",
      type: "tfsa",
      currentValue: 0,
      expectedReturnPercent: 0,
      annualContribution: 1_200,
      contributionFrequency: "monthly",
    }];

    const firstYear = projectFinances(plan)[0];
    expect(firstYear.availableSavings).toBe(600);
    expect(firstYear.contributions).toBe(600);
    expect(firstYear.investmentAssets).toBe(600);
    expect(firstYear.unfundedCashFlow).toBe(0);
    expect(firstYear.netWorth).toBe(600);
  });

  it("reports prior unallocated cash used to cover a later deficit as a withdrawal", () => {
    const plan = createPlan();
    plan.assumptions.generalInflationPercent = 0;
    plan.incomeSources = [{
      id: "cash-reserve-income",
      name: "Cash reserve funding",
      type: "other",
      amount: 1_000,
      frequency: "annual",
      startYear: plan.baseYear,
      endYear: plan.baseYear,
      annualGrowthPercent: 0,
      taxable: false,
    }];
    plan.expenses = [{
      id: "later-cost",
      name: "Later required cost",
      category: "other",
      amount: 600,
      frequency: "annual",
      startYear: plan.baseYear + 1,
      endYear: plan.baseYear + 1,
      inflationPercent: 0,
    }];

    const [fundingYear, spendingYear] = projectFinances(plan);
    expect(fundingYear.cashAssets).toBe(1_000);
    expect(spendingYear.availableSavings).toBe(-600);
    expect(spendingYear.withdrawals).toBe(600);
    expect(spendingYear.cashAssets).toBe(400);
    expect(spendingYear.unfundedCashFlow).toBe(0);
  });

  it("prioritizes an existing required-spending shortfall over new contributions", () => {
    const plan = createPlan();
    plan.assumptions.generalInflationPercent = 0;
    plan.retirement.planningEndAge = 38;
    plan.expenses = [{
      id: "shortfall",
      name: "Required cost",
      category: "other",
      amount: 500,
      frequency: "annual",
      startYear: plan.baseYear,
      endYear: plan.baseYear,
      inflationPercent: 0,
    }];
    plan.incomeSources = [{
      id: "later-income",
      name: "Later income",
      type: "other",
      amount: 500,
      frequency: "annual",
      startYear: plan.baseYear + 1,
      endYear: plan.baseYear + 1,
      annualGrowthPercent: 0,
      taxable: false,
    }];
    plan.assets = [{
      id: "scheduled-savings",
      name: "Scheduled savings",
      type: "tfsa",
      currentValue: 0,
      expectedReturnPercent: 0,
      annualContribution: 500,
      contributionFrequency: "annual",
    }];

    const [deficitYear, recoveryYear] = projectFinances(plan);
    expect(deficitYear.unfundedCashFlow).toBe(500);
    expect(deficitYear.contributions).toBe(0);
    expect(recoveryYear.contributions).toBe(0);
    expect(recoveryYear.totalLiabilities).toBe(0);
  });

  it("applies sparse scenario overrides without mutating the baseline", () => {
    const plan = createPlan();
    plan.assets = [{
      id: "tfsa",
      name: "TFSA",
      type: "tfsa",
      currentValue: 10_000,
      expectedReturnPercent: 10,
    }];
    const scenario: PlanScenario = {
      id: "lower-return",
      planId: plan.id,
      name: "Lower return",
      overrides: {
        assets: {
          update: [{ entityId: "tfsa", changes: { expectedReturnPercent: 0 } }],
        },
        retirement: {
          targetRetirementAge: 60,
          cpp: { annualAmount: 9_000 },
        },
      },
    };

    const changed = applyScenarioOverrides(plan, scenario);
    expect(changed.assets[0].expectedReturnPercent).toBe(0);
    expect(changed.retirement.targetRetirementAge).toBe(60);
    expect(changed.retirement.cpp.annualAmount).toBe(9_000);
    expect(changed.retirement.cpp.enabled).toBe(false);
    expect(plan.assets[0].expectedReturnPercent).toBe(10);
    expect(projectFinances(plan)[0].investmentAssets).toBe(11_000);
    expect(projectFinances(plan, scenario)[0].investmentAssets).toBe(10_000);
  });

  it("returns byte-for-byte deterministic projection data", () => {
    const plan = createPlan();
    plan.incomeSources = [{
      id: "income",
      name: "Income",
      type: "employment",
      amount: 80_000,
      frequency: "annual",
      startYear: 2026,
      annualGrowthPercent: 2,
      taxable: true,
    }];
    plan.assets = [{
      id: "rrsp",
      name: "RRSP",
      type: "rrsp",
      currentValue: 40_000,
      expectedReturnPercent: 5,
      annualContribution: 6_000,
    }];

    const first = projectFinances(plan);
    const second = projectFinances(JSON.parse(JSON.stringify(plan)) as FinancialPlan);
    expect(second).toEqual(first);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });
});
