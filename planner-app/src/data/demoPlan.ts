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

export const DEMO_PRESETS = [
  { id: 'alex', name: 'Alex’s original example', description: 'A homeowner comparing retirement plans, with a mortgage and several investment accounts.' },
  { id: 'starting-out', name: 'Starting out', description: 'Jordan, 28: a $45,000 salary, a small cash buffer, and student debt.' },
  { id: 'variable-income', name: 'Variable income', description: 'Sam, 35: a steady income base with project work that changes after two years.' },
  { id: 'approaching-retirement', name: 'Approaching retirement', description: 'Morgan, 58: comparing savings, retirement spending, and fictional future benefits.' },
] as const;
export type DemoPresetId = typeof DEMO_PRESETS[number]['id'];

export function createDemoSnapshot(preset: DemoPresetId = 'alex'): PlannerSnapshot {
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

  if (preset !== 'alex') {
    const examples = {
      'starting-out': { firstName: 'Jordan', born: '1998-04-12', income: 45_000, spending: 32_000, retirementAge: 65, cash: 2_000, tfsa: 1_500, contribution: 1_800, rrsp: 0, tax: 18 },
      'variable-income': { firstName: 'Sam', born: '1991-09-03', income: 36_000, spending: 33_600, retirementAge: 65, cash: 5_000, tfsa: 8_000, contribution: 3_000, rrsp: 0, tax: 20 },
      'approaching-retirement': { firstName: 'Morgan', born: '1968-02-20', income: 75_000, spending: 40_000, retirementAge: 63, cash: 30_000, tfsa: 90_000, contribution: 6_000, rrsp: 240_000, tax: 22 },
    }[preset];
    plan.id = `demo-plan-${preset}`;
    plan.profile.id = `demo-profile-${preset}`;
    plan.profile.firstName = examples.firstName;
    plan.profile.dateOfBirth = examples.born;
    plan.name = `${examples.firstName}’s fictional ${DEMO_PRESETS.find((item) => item.id === preset)!.name.toLowerCase()} plan`;
    plan.assumptions.effectiveTaxPercent = examples.tax;
    plan.retirement.targetRetirementAge = examples.retirementAge;
    plan.retirement.estimatedAnnualSpending = examples.spending;
    plan.retirement.cpp = { ...plan.retirement.cpp, enabled: preset === 'approaching-retirement', annualAmount: preset === 'approaching-retirement' ? 10_500 : 0 };
    plan.retirement.oas = { ...plan.retirement.oas, enabled: preset === 'approaching-retirement', annualAmount: preset === 'approaching-retirement' ? 8_000 : 0 };
    plan.incomeSources = [{ ...plan.incomeSources[0], amount: examples.income, name: preset === 'variable-income' ? 'Regular contract income' : 'Employment income' }];
    if (preset === 'variable-income') {
      plan.incomeSources.push(
        { ...plan.incomeSources[0], id: 'demo-income-projects-now', name: 'Project work: first two years', type: 'self_employment', amount: 12_000, annualGrowthPercent: 0, endYear: 2027 },
        { ...plan.incomeSources[0], id: 'demo-income-projects-later', name: 'Project work: lower future assumption', type: 'self_employment', amount: 6_000, annualGrowthPercent: 0, startYear: 2028 },
      );
    }
    plan.expenses = [{
      ...plan.expenses[0],
      name: 'Living costs including rent (debt payments excluded)',
      category: 'other',
      amount: examples.spending,
    }];
    plan.assets = [
      { ...plan.assets[0], currentValue: examples.cash },
      { ...plan.assets[1], currentValue: examples.tfsa, annualContribution: examples.contribution },
      ...(examples.rrsp ? [{ ...plan.assets[2], currentValue: examples.rrsp, annualContribution: 3_600 }] : []),
    ];
    plan.debts = preset === 'starting-out' ? [{
      ...plan.debts[0], id: 'demo-debt-student', name: 'Fictional student loan', type: 'student_loan',
      balance: 8_000, annualInterestPercent: 5, paymentAmount: 120, remainingAmortizationMonths: 84, compoundingPeriodsPerYear: 12,
    }] : preset === 'variable-income' ? [{
      ...plan.debts[0], id: 'demo-debt-card', name: 'Credit card balance', type: 'credit_card',
      balance: 3_000, annualInterestPercent: 19, paymentAmount: 150, remainingAmortizationMonths: 36, compoundingPeriodsPerYear: 12,
    }] : [];
    for (const collection of [plan.incomeSources, plan.expenses, plan.assets, plan.debts]) {
      collection.forEach((item, position) => { item.planId = plan.id; item.position = position; });
    }
  }

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
          assets: {
            update: plan.assets.filter((asset) => asset.type === 'tfsa' || asset.type === 'rrsp' || asset.type === 'fhsa')
              .map((asset) => ({ entityId: asset.id, changes: { expectedReturnPercent: 3.5 } })),
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
