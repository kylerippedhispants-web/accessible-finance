import type {
  Asset,
  Debt,
  Expense,
  FinancialPlan,
  IncomeSource,
  PlanScenario,
  PlannerProfile,
} from '../domain';

function id(_prefix: string): string {
  // Database-backed entities use UUID primary keys. The unused prefix keeps
  // call sites readable without leaking storage concerns into domain types.
  return crypto.randomUUID();
}

export interface PlannerSnapshot {
  plan: FinancialPlan;
  scenarios: PlanScenario[];
}

export function createBlankPlan(profile?: Partial<PlannerProfile>): FinancialPlan {
  const planId = id('plan');
  const baseYear = new Date().getFullYear();

  return {
    schemaVersion: 1,
    id: planId,
    name: 'My financial plan',
    baseYear,
    profile: {
      id: id('profile'),
      firstName: '',
      provinceOrTerritory: 'ON',
      dateOfBirth: '1990-01-01',
      currency: 'CAD',
      ...profile,
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
      planningEndAge: 95,
      estimatedAnnualSpending: 0,
      spendingInflationPercent: 2,
      investmentReturnBeforeRetirementPercent: 5,
      investmentReturnAfterRetirementPercent: 3.5,
      expenseMode: 'replace_recurring',
      cpp: {
        enabled: false,
        annualAmount: 0,
        startAge: 65,
        taxable: true,
        annualGrowthPercent: 2,
      },
      oas: {
        enabled: false,
        annualAmount: 0,
        startAge: 65,
        taxable: true,
        annualGrowthPercent: 2,
      },
    },
  };
}

export function createDemoSnapshot(): PlannerSnapshot {
  const plan = createBlankPlan({
    firstName: 'Alex',
    provinceOrTerritory: 'ON',
    dateOfBirth: '1994-06-15',
  });
  plan.id = 'demo-plan';
  plan.profile.id = 'demo-profile';
  plan.baseYear = 2026;
  plan.name = 'Alex’s sample plan';
  plan.assumptions = {
    effectiveTaxPercent: 22,
    generalInflationPercent: 2,
  };
  plan.retirement = {
    ...plan.retirement,
    targetRetirementAge: 60,
    planningEndAge: 95,
    estimatedAnnualSpending: 48_000,
    investmentReturnBeforeRetirementPercent: 5,
    investmentReturnAfterRetirementPercent: 3.5,
    cpp: {
      enabled: true,
      annualAmount: 15_000,
      startAge: 65,
      taxable: true,
      annualGrowthPercent: 2,
    },
    oas: {
      enabled: true,
      annualAmount: 8_000,
      startAge: 65,
      taxable: true,
      annualGrowthPercent: 2,
    },
  };

  plan.incomeSources = [
    {
      id: 'demo-income-employment',
      planId: plan.id,
      name: 'Employment income',
      type: 'employment',
      amount: 125_000,
      frequency: 'annual',
      startYear: plan.baseYear,
      annualGrowthPercent: 2,
      taxable: true,
      endsAtRetirement: true,
    } satisfies IncomeSource,
  ];

  const annualExpenses: Array<[string, Expense['category'], number]> = [
    ['Housing and property costs (mortgage excluded)', 'housing', 12_000],
    ['Food', 'food', 7_200],
    ['Transportation', 'transportation', 5_400],
    ['Utilities and insurance', 'utilities', 4_800],
    ['Travel and entertainment', 'entertainment', 3_600],
    ['Healthcare and other', 'healthcare', 3_000],
  ];
  plan.expenses = annualExpenses.map(([name, category, amount], position) => ({
    id: `demo-expense-${position + 1}`,
    planId: plan.id,
    position,
    name,
    category,
    amount,
    frequency: 'annual',
    startYear: plan.baseYear,
    inflationPercent: 2,
  } satisfies Expense));

  const assets: Array<[string, Asset['type'], number, Partial<Asset>]> = [
    ['Cash reserve', 'cash', 20_000, { expectedReturnPercent: 0 }],
    ['TFSA', 'tfsa', 80_000, { expectedReturnPercent: 5, annualContribution: 8_400 }],
    ['RRSP', 'rrsp', 90_000, { expectedReturnPercent: 5, annualContribution: 7_200 }],
    ['FHSA', 'fhsa', 10_000, { expectedReturnPercent: 5, annualContribution: 2_400 }],
    ['Primary residence', 'primary_residence', 600_000, { annualAppreciationPercent: 2 }],
  ];
  plan.assets = assets.map(([name, type, currentValue, extra], position) => ({
    id: `demo-asset-${position + 1}`,
    planId: plan.id,
    position,
    name,
    type,
    currentValue,
    contributionFrequency: 'monthly',
    contributionStartYear: plan.baseYear,
    ...extra,
  } satisfies Asset));

  plan.debts = [
    {
      id: 'demo-debt-mortgage',
      planId: plan.id,
      name: 'Home mortgage',
      type: 'mortgage',
      balance: 450_000,
      annualInterestPercent: 4.6,
      paymentAmount: 2_800,
      paymentFrequency: 'monthly',
      remainingAmortizationMonths: 300,
      compoundingPeriodsPerYear: 2,
    } satisfies Debt,
  ];

  return {
    plan,
    scenarios: [
      {
        id: 'demo-scenario-lower-returns',
        planId: plan.id,
        name: 'Lower returns',
        description: 'Tests a more cautious investment-return assumption.',
        overrides: {
          retirement: {
            investmentReturnBeforeRetirementPercent: 3.5,
            investmentReturnAfterRetirementPercent: 2.5,
          },
        },
      },
    ],
  };
}

export function createStarterPlan(input: {
  firstName: string;
  provinceOrTerritory: PlannerProfile['provinceOrTerritory'];
  dateOfBirth: string;
  targetRetirementAge: number;
  planningEndAge: number;
  annualEmploymentIncome: number;
  annualExpenses: number;
}, initial?: Pick<FinancialPlan, 'id' | 'profile' | 'baseYear'>): FinancialPlan {
  const plan = createBlankPlan({
    firstName: input.firstName,
    provinceOrTerritory: input.provinceOrTerritory,
    dateOfBirth: input.dateOfBirth,
  });
  // Choose the draft's identity before creating records that belong to it.
  if (initial) {
    plan.id = initial.id;
    plan.profile.id = initial.profile.id;
    plan.baseYear = initial.baseYear;
  }
  plan.retirement.targetRetirementAge = input.targetRetirementAge;
  plan.retirement.planningEndAge = input.planningEndAge;
  plan.retirement.estimatedAnnualSpending = input.annualExpenses;

  if (input.annualEmploymentIncome > 0) {
    plan.incomeSources.push({
      id: id('income'),
      planId: plan.id,
      name: 'Employment income',
      type: 'employment',
      amount: input.annualEmploymentIncome,
      frequency: 'annual',
      startYear: plan.baseYear,
      annualGrowthPercent: 0,
      taxable: true,
      endsAtRetirement: true,
    });
  }

  if (input.annualExpenses > 0) {
    plan.expenses.push({
      id: id('expense'),
      planId: plan.id,
      name: 'Annual living expenses',
      category: 'other',
      amount: input.annualExpenses,
      frequency: 'annual',
      startYear: plan.baseYear,
      inflationPercent: plan.assumptions.generalInflationPercent,
    });
  }

  return plan;
}

export function createEntityId(prefix: string): string {
  return id(prefix);
}
