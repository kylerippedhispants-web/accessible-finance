import type {
  CollectionOverrides,
  FinancialPlan,
  PlanEntity,
  PlanScenario,
  ScenarioOverrides,
} from "../domain";

function applyCollectionOverrides<T extends PlanEntity>(
  original: readonly T[],
  overrides: CollectionOverrides<T> | undefined,
  label: string,
): T[] {
  const result = original.map((item) => ({ ...item }));
  if (!overrides) {
    return result;
  }

  const removeIds = new Set(overrides.removeIds ?? []);
  const retained = result.filter((item) => !removeIds.has(item.id));
  const byId = new Map(retained.map((item) => [item.id, item]));

  for (const update of overrides.update ?? []) {
    const existing = byId.get(update.entityId);
    if (!existing) {
      throw new Error(`Scenario update refers to unknown ${label} id: ${update.entityId}`);
    }
    const replacement = { ...existing, ...update.changes, id: existing.id } as T;
    const index = retained.findIndex((item) => item.id === existing.id);
    retained[index] = replacement;
    byId.set(existing.id, replacement);
  }

  for (const addition of overrides.add ?? []) {
    if (byId.has(addition.id)) {
      throw new Error(`Scenario adds duplicate ${label} id: ${addition.id}`);
    }
    const clone = { ...addition };
    retained.push(clone);
    byId.set(clone.id, clone);
  }

  return retained;
}
/** Applies sparse scenario differences without mutating the baseline plan. */
export function applyScenarioOverrides(
  baseline: FinancialPlan,
  scenarioOrOverrides?: PlanScenario | ScenarioOverrides,
): FinancialPlan {
  const overrides = scenarioOrOverrides && "overrides" in scenarioOrOverrides
    ? scenarioOrOverrides.overrides
    : scenarioOrOverrides;

  if (!overrides) {
    return {
      ...baseline,
      profile: { ...baseline.profile },
      assumptions: { ...baseline.assumptions },
      retirement: {
        ...baseline.retirement,
        cpp: { ...baseline.retirement.cpp },
        oas: { ...baseline.retirement.oas },
      },
      incomeSources: baseline.incomeSources.map((item) => ({ ...item })),
      expenses: baseline.expenses.map((item) => ({ ...item })),
      assets: baseline.assets.map((item) => ({ ...item })),
      debts: baseline.debts.map((item) => ({ ...item })),
    };
  }

  const retirementOverride = overrides.retirement;
  return {
    ...baseline,
    profile: { ...baseline.profile },
    assumptions: { ...baseline.assumptions, ...overrides.assumptions },
    retirement: {
      ...baseline.retirement,
      ...retirementOverride,
      cpp: {
        ...baseline.retirement.cpp,
        ...(retirementOverride?.cpp ?? {}),
      },
      oas: {
        ...baseline.retirement.oas,
        ...(retirementOverride?.oas ?? {}),
      },
    },
    incomeSources: applyCollectionOverrides(
      baseline.incomeSources,
      overrides.incomeSources,
      "income source",
    ),
    expenses: applyCollectionOverrides(baseline.expenses, overrides.expenses, "expense"),
    assets: applyCollectionOverrides(baseline.assets, overrides.assets, "asset"),
    debts: applyCollectionOverrides(baseline.debts, overrides.debts, "debt"),
  };
}
