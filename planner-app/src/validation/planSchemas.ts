import { z } from 'zod';
import {
  ASSET_TYPES,
  CANADIAN_PROVINCES_AND_TERRITORIES,
  DEBT_TYPES,
  EXPENSE_CATEGORIES,
  FREQUENCIES,
  INCOME_TYPES,
  type FinancialPlan,
  type PlanScenario,
} from '../domain';
import type { PlannerSnapshot } from '../data/demoPlan';
import { applyScenarioOverrides } from '../finance-engine/scenarios';

const idSchema = z.string().trim().min(1).max(120);
const nameSchema = z.string().trim().min(1, 'Enter a name.').max(120);
const planNameSchema = z.string().trim().min(1, 'Enter a name.').max(100);
const moneySchema = z.number().finite().min(0).max(1_000_000_000_000);
const percentageSchema = z.number().finite().min(-100).max(100);
const generalInflationSchema = z.number().finite().gt(-100, 'General inflation must be greater than -100%.').max(100);
const yearSchema = z.number().int().min(1900).max(2200);
const optionalYearSchema = yearSchema.optional();
const ageSchema = z.number().int().min(18).max(120);
const retirementAgeSchema = z.number().int().min(18).max(100);

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date.').refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(value);
}, 'Use a valid date.')
  .refine((value) => value >= '1900-01-01', 'Date of birth cannot be earlier than 1900-01-01.')
  .refine(
    (value) => value <= new Date().toISOString().slice(0, 10),
    'Date of birth cannot be in the future.',
  );

const profileSchema = z.object({
  id: idSchema,
  firstName: z.string().trim().min(1).max(80),
  provinceOrTerritory: z.enum(CANADIAN_PROVINCES_AND_TERRITORIES),
  dateOfBirth: dateSchema,
  currency: z.literal('CAD'),
});

const baseEntitySchema = {
  id: idSchema,
  planId: idSchema.optional(),
  position: z.number().int().min(0).max(10_000).optional(),
  name: nameSchema,
  enabled: z.boolean().optional(),
};

const editableBaseEntitySchema = {
  position: z.number().int().min(0).max(10_000).optional(),
  name: nameSchema.optional(),
  enabled: z.boolean().optional(),
};

const incomeSchema = z.object({
  ...baseEntitySchema,
  type: z.enum(INCOME_TYPES),
  amount: moneySchema,
  frequency: z.enum(FREQUENCIES),
  startYear: yearSchema,
  endYear: optionalYearSchema,
  annualGrowthPercent: percentageSchema,
  taxable: z.boolean(),
  endsAtRetirement: z.boolean().optional(),
}).refine((value) => value.endYear === undefined || value.endYear >= value.startYear, {
  message: 'End year must be after the start year.',
  path: ['endYear'],
});

const expenseSchema = z.object({
  ...baseEntitySchema,
  category: z.enum(EXPENSE_CATEGORIES),
  amount: moneySchema,
  frequency: z.enum(FREQUENCIES),
  startYear: yearSchema,
  endYear: optionalYearSchema,
  inflationPercent: percentageSchema,
}).refine((value) => value.endYear === undefined || value.endYear >= value.startYear, {
  message: 'End year must be after the start year.',
  path: ['endYear'],
});

const assetSchema = z.object({
  ...baseEntitySchema,
  type: z.enum(ASSET_TYPES),
  category: z.enum(['cash', 'investment', 'property', 'pension', 'other']).optional(),
  currentValue: moneySchema,
  expectedReturnPercent: percentageSchema.optional(),
  postRetirementReturnPercent: percentageSchema.optional(),
  annualAppreciationPercent: percentageSchema.optional(),
  annualContribution: moneySchema.optional(),
  contributionFrequency: z.enum(['monthly', 'biweekly', 'annual']).optional(),
  contributionStartYear: optionalYearSchema,
  contributionEndYear: optionalYearSchema,
  startYear: optionalYearSchema,
}).refine(
  (value) => value.contributionEndYear === undefined || value.contributionStartYear !== undefined,
  { message: 'Enter a contribution start year when an end year is set.', path: ['contributionStartYear'] },
).refine(
  (value) => value.contributionEndYear === undefined
    || value.contributionStartYear === undefined
    || value.contributionEndYear >= value.contributionStartYear,
  { message: 'Contribution end year must be after the start year.', path: ['contributionEndYear'] },
);

const debtSchema = z.object({
  ...baseEntitySchema,
  type: z.enum(DEBT_TYPES),
  balance: moneySchema,
  annualInterestPercent: z.number().finite().min(0).max(100),
  paymentAmount: moneySchema,
  paymentFrequency: z.enum(['monthly', 'biweekly', 'annual']),
  remainingAmortizationMonths: z.number().int().min(0).max(1_200),
  extraPaymentAmount: moneySchema.optional(),
  compoundingPeriodsPerYear: z.number().int().min(1).max(365).optional(),
  startYear: optionalYearSchema,
});

const manualBenefitSchema = z.object({
  enabled: z.boolean(),
  annualAmount: moneySchema,
  startAge: ageSchema,
  taxable: z.boolean(),
  annualGrowthPercent: percentageSchema,
});

const retirementSchema = z.object({
  targetRetirementAge: retirementAgeSchema,
  planningEndAge: ageSchema,
  estimatedAnnualSpending: moneySchema,
  spendingInflationPercent: percentageSchema,
  investmentReturnBeforeRetirementPercent: percentageSchema,
  investmentReturnAfterRetirementPercent: percentageSchema,
  expenseMode: z.enum(['replace_recurring', 'add_to_recurring']),
  cpp: manualBenefitSchema,
  oas: manualBenefitSchema,
}).refine((value) => value.planningEndAge > value.targetRetirementAge, {
  message: 'Planning end age must be after retirement age.',
  path: ['planningEndAge'],
});

export const financialPlanSchema: z.ZodType<FinancialPlan> = z.object({
  schemaVersion: z.literal(1),
  id: idSchema,
  name: planNameSchema,
  baseYear: yearSchema,
  profile: profileSchema,
  assumptions: z.object({
    effectiveTaxPercent: z.number().finite().min(0).max(100),
    generalInflationPercent: generalInflationSchema,
  }),
  incomeSources: z.array(incomeSchema).max(250),
  expenses: z.array(expenseSchema).max(250),
  assets: z.array(assetSchema).max(250),
  debts: z.array(debtSchema).max(250),
  retirement: retirementSchema,
}).superRefine((plan, context) => {
  const birthYear = Number(plan.profile.dateOfBirth.slice(0, 4));
  const baseAge = plan.baseYear - birthYear;
  if (baseAge < 18 || baseAge > 120) {
    context.addIssue({
      code: 'custom',
      message: 'Date of birth must produce an age from 18 to 120 in the projection base year.',
      path: ['profile', 'dateOfBirth'],
    });
  }
  if (plan.retirement.planningEndAge < baseAge) {
    context.addIssue({
      code: 'custom',
      message: 'Planning end age must not be earlier than the age in the projection base year.',
      path: ['retirement', 'planningEndAge'],
    });
  }

  const collections = [plan.incomeSources, plan.expenses, plan.assets, plan.debts];
  collections.forEach((collection, collectionIndex) => {
    const seenIds = new Set<string>();
    collection.forEach((item, itemIndex) => {
      if (seenIds.has(item.id)) {
        context.addIssue({
          code: 'custom',
          message: 'Record IDs must be unique within a collection.',
          path: [['incomeSources', 'expenses', 'assets', 'debts'][collectionIndex], itemIndex, 'id'],
        });
      }
      seenIds.add(item.id);
      if (item.planId !== undefined && item.planId !== plan.id) {
        context.addIssue({
          code: 'custom',
          message: 'Record does not belong to this plan.',
          path: [['incomeSources', 'expenses', 'assets', 'debts'][collectionIndex], itemIndex, 'planId'],
        });
      }
    });
  });

  plan.assets.forEach((asset, index) => {
    const contributionStart = asset.contributionStartYear ?? asset.startYear ?? plan.baseYear;
    if (asset.contributionEndYear !== undefined && asset.contributionEndYear < contributionStart) {
      context.addIssue({
        code: 'custom',
        message: 'Contribution end year must be after the effective contribution start year.',
        path: ['assets', index, 'contributionEndYear'],
      });
    }
  });
});

const incomeChangesSchema = z.object({
  ...editableBaseEntitySchema,
  type: z.enum(INCOME_TYPES).optional(),
  amount: moneySchema.optional(),
  frequency: z.enum(FREQUENCIES).optional(),
  startYear: yearSchema.optional(),
  endYear: optionalYearSchema,
  annualGrowthPercent: percentageSchema.optional(),
  taxable: z.boolean().optional(),
  endsAtRetirement: z.boolean().optional(),
}).strict();

const expenseChangesSchema = z.object({
  ...editableBaseEntitySchema,
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  amount: moneySchema.optional(),
  frequency: z.enum(FREQUENCIES).optional(),
  startYear: yearSchema.optional(),
  endYear: optionalYearSchema,
  inflationPercent: percentageSchema.optional(),
}).strict();

const assetChangesSchema = z.object({
  ...editableBaseEntitySchema,
  type: z.enum(ASSET_TYPES).optional(),
  category: z.enum(['cash', 'investment', 'property', 'pension', 'other']).optional(),
  currentValue: moneySchema.optional(),
  expectedReturnPercent: percentageSchema.optional(),
  postRetirementReturnPercent: percentageSchema.optional(),
  annualAppreciationPercent: percentageSchema.optional(),
  annualContribution: moneySchema.optional(),
  contributionFrequency: z.enum(['monthly', 'biweekly', 'annual']).optional(),
  contributionStartYear: optionalYearSchema,
  contributionEndYear: optionalYearSchema,
  startYear: optionalYearSchema,
}).strict();

const debtChangesSchema = z.object({
  ...editableBaseEntitySchema,
  type: z.enum(DEBT_TYPES).optional(),
  balance: moneySchema.optional(),
  annualInterestPercent: z.number().finite().min(0).max(100).optional(),
  paymentAmount: moneySchema.optional(),
  paymentFrequency: z.enum(['monthly', 'biweekly', 'annual']).optional(),
  remainingAmortizationMonths: z.number().int().min(0).max(1_200).optional(),
  extraPaymentAmount: moneySchema.optional(),
  compoundingPeriodsPerYear: z.number().int().min(1).max(365).optional(),
  startYear: optionalYearSchema,
}).strict();

function collectionOverridesSchema<
  TEntity extends z.ZodType,
  TChanges extends z.ZodType,
>(entitySchema: TEntity, changesSchema: TChanges) {
  return z.object({
    add: z.array(entitySchema).max(250).optional(),
    update: z.array(z.object({
      entityId: idSchema,
      changes: changesSchema,
    }).strict().refine(
      (value) => Object.keys((value as { changes: object }).changes).length > 0,
      { message: 'Scenario update must change at least one field.', path: ['changes'] },
    )).max(250).optional(),
    removeIds: z.array(idSchema).max(250).optional(),
  }).strict();
}

const manualBenefitChangesSchema = z.object({
  enabled: z.boolean().optional(),
  annualAmount: moneySchema.optional(),
  startAge: ageSchema.optional(),
  taxable: z.boolean().optional(),
  annualGrowthPercent: percentageSchema.optional(),
}).strict();

const scenarioOverridesSchema = z.object({
  assumptions: z.object({
    effectiveTaxPercent: z.number().finite().min(0).max(100).optional(),
    generalInflationPercent: generalInflationSchema.optional(),
  }).strict().optional(),
  retirement: z.object({
    targetRetirementAge: retirementAgeSchema.optional(),
    planningEndAge: ageSchema.optional(),
    estimatedAnnualSpending: moneySchema.optional(),
    spendingInflationPercent: percentageSchema.optional(),
    investmentReturnBeforeRetirementPercent: percentageSchema.optional(),
    investmentReturnAfterRetirementPercent: percentageSchema.optional(),
    expenseMode: z.enum(['replace_recurring', 'add_to_recurring']).optional(),
    cpp: manualBenefitChangesSchema.optional(),
    oas: manualBenefitChangesSchema.optional(),
  }).strict().optional(),
  incomeSources: collectionOverridesSchema(incomeSchema, incomeChangesSchema).optional(),
  expenses: collectionOverridesSchema(expenseSchema, expenseChangesSchema).optional(),
  assets: collectionOverridesSchema(assetSchema, assetChangesSchema).optional(),
  debts: collectionOverridesSchema(debtSchema, debtChangesSchema).optional(),
}).strict();

export const planScenarioSchema: z.ZodType<PlanScenario> = z.object({
  id: idSchema,
  planId: idSchema,
  name: planNameSchema,
  description: z.string().max(500).optional(),
  isBaseline: z.boolean().optional(),
  overrides: scenarioOverridesSchema,
}).superRefine((scenario, context) => {
  type OverrideCollection = {
    add?: { id: string }[];
    update?: { entityId: string }[];
    removeIds?: string[];
  };
  const inspect = (key: string, label: string, collection: OverrideCollection | undefined) => {
    if (!collection) return;
    const seenTargets = new Set<string>();
    const targets = [
      ...(collection.add ?? []).map((item, index) => ({ id: item.id, path: ['add', index, 'id'] })),
      ...(collection.update ?? []).map((item, index) => ({ id: item.entityId, path: ['update', index, 'entityId'] })),
      ...(collection.removeIds ?? []).map((id, index) => ({ id, path: ['removeIds', index] })),
    ];
    targets.forEach((target) => {
      if (seenTargets.has(target.id)) {
        context.addIssue({
          code: 'custom',
          message: `A scenario can contain only one operation for each ${label} record.`,
          path: ['overrides', key, ...target.path],
        });
      }
      seenTargets.add(target.id);
    });
  };

  inspect('incomeSources', 'income', scenario.overrides.incomeSources);
  inspect('expenses', 'expense', scenario.overrides.expenses);
  inspect('assets', 'asset', scenario.overrides.assets);
  inspect('debts', 'debt', scenario.overrides.debts);
}) as z.ZodType<PlanScenario>;

export const plannerSnapshotSchema: z.ZodType<PlannerSnapshot> = z.object({
  plan: financialPlanSchema,
  scenarios: z.array(planScenarioSchema).max(50),
}).superRefine((snapshot, context) => {
  const scenarioIds = new Set<string>();
  const scenarioNames = new Set<string>();
  let baselineCount = 0;

  snapshot.scenarios.forEach((scenario, index) => {
    if (scenarioIds.has(scenario.id)) {
      context.addIssue({
        code: 'custom',
        message: 'Scenario IDs must be unique.',
        path: ['scenarios', index, 'id'],
      });
    }
    scenarioIds.add(scenario.id);

    if (scenarioNames.has(scenario.name)) {
      context.addIssue({
        code: 'custom',
        message: 'Scenario names must be unique within a plan.',
        path: ['scenarios', index, 'name'],
      });
    }
    scenarioNames.add(scenario.name);
    if (scenario.isBaseline) baselineCount += 1;

    if (scenario.planId !== snapshot.plan.id) {
      context.addIssue({
        code: 'custom',
        message: 'Scenario does not belong to the imported plan.',
        path: ['scenarios', index, 'planId'],
      });
      return;
    }

    const removalReferences = [
      ['incomeSources', snapshot.plan.incomeSources, scenario.overrides.incomeSources?.removeIds],
      ['expenses', snapshot.plan.expenses, scenario.overrides.expenses?.removeIds],
      ['assets', snapshot.plan.assets, scenario.overrides.assets?.removeIds],
      ['debts', snapshot.plan.debts, scenario.overrides.debts?.removeIds],
    ] as const;
    removalReferences.forEach(([key, baseline, removeIds]) => {
      const baselineIds = new Set(baseline.map((item) => item.id));
      (removeIds ?? []).forEach((id, removeIndex) => {
        if (!baselineIds.has(id)) {
          context.addIssue({
            code: 'custom',
            message: `Scenario removal refers to an unknown ${key} record.`,
            path: ['scenarios', index, 'overrides', key, 'removeIds', removeIndex],
          });
        }
      });
    });

    try {
      const appliedPlan = applyScenarioOverrides(snapshot.plan, scenario);
      const appliedResult = financialPlanSchema.safeParse(appliedPlan);
      if (!appliedResult.success) {
        const issue = appliedResult.error.issues[0];
        context.addIssue({
          code: 'custom',
          message: `Scenario produces an invalid plan: ${issue?.message ?? 'invalid values'}`,
          path: ['scenarios', index, 'overrides', ...(issue?.path ?? [])],
        });
      }
    } catch (error) {
      context.addIssue({
        code: 'custom',
        message: error instanceof Error ? error.message : 'Scenario references invalid plan data.',
        path: ['scenarios', index, 'overrides'],
      });
    }
  });

  if (baselineCount > 1) {
    context.addIssue({
      code: 'custom',
      message: 'Only one scenario can be marked as the baseline.',
      path: ['scenarios'],
    });
  }
});

export const exportedPlanSchema = z.object({
  format: z.literal('accessible-finance-planner'),
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  data: plannerSnapshotSchema,
});

export type ExportedPlan = z.infer<typeof exportedPlanSchema>;

export function formatValidationError(error: z.ZodError): string {
  const first = error.issues[0];
  if (!first) return 'The plan is not valid.';
  const location = first.path.length ? `${first.path.join('.')}: ` : '';
  return `${location}${first.message}`;
}
