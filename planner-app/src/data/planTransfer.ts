import type {
  Asset,
  CollectionOverrides,
  Debt,
  Expense,
  IncomeSource,
  PlanEntity,
  PlanScenario,
  ScenarioOverrides,
} from '../domain';
import type { PlannerSnapshot } from './demoPlan';
import { exportedPlanSchema, type ExportedPlan } from '../validation/planSchemas';

export function createPlanExport(snapshot: PlannerSnapshot): ExportedPlan {
  return {
    format: 'accessible-finance-planner',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: structuredClone(snapshot),
  };
}

export function downloadPlanExport(snapshot: PlannerSnapshot): void {
  const payload = JSON.stringify(createPlanExport(snapshot), null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `accessible-finance-plan-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function rekeyCollection<T extends PlanEntity>(
  collection: T[],
  planId: string,
  idMap: Map<string, string>,
): T[] {
  return collection.map((item) => {
    const nextId = crypto.randomUUID();
    idMap.set(item.id, nextId);
    return { ...item, id: nextId, planId };
  });
}

function rekeyOverrides<T extends PlanEntity>(
  collection: CollectionOverrides<T> | undefined,
  planId: string,
  idMap: Map<string, string>,
): CollectionOverrides<T> | undefined {
  if (!collection) return undefined;
  const added = collection.add ? rekeyCollection(collection.add, planId, idMap) : undefined;
  return {
    add: added,
    update: collection.update?.map((update) => ({
      ...update,
      entityId: idMap.get(update.entityId) ?? update.entityId,
    })),
    removeIds: collection.removeIds?.map((id) => idMap.get(id) ?? id),
  };
}

function rekeyScenario(
  scenario: PlanScenario,
  planId: string,
  idMap: Map<string, string>,
): PlanScenario {
  const overrides: ScenarioOverrides = {
    assumptions: scenario.overrides.assumptions,
    retirement: scenario.overrides.retirement,
    incomeSources: rekeyOverrides<IncomeSource>(scenario.overrides.incomeSources, planId, idMap),
    expenses: rekeyOverrides<Expense>(scenario.overrides.expenses, planId, idMap),
    assets: rekeyOverrides<Asset>(scenario.overrides.assets, planId, idMap),
    debts: rekeyOverrides<Debt>(scenario.overrides.debts, planId, idMap),
  };
  return { ...scenario, id: crypto.randomUUID(), planId, overrides };
}

export function parsePlanImport(
  json: string,
  target?: { planId?: string; profileId?: string },
): PlannerSnapshot {
  const validated = exportedPlanSchema.parse(JSON.parse(json));
  const source = validated.data;
  const planId = target?.planId ?? crypto.randomUUID();
  const idMap = new Map<string, string>();
  idMap.set(source.plan.id, planId);

  const incomeSources = rekeyCollection(source.plan.incomeSources, planId, idMap);
  const expenses = rekeyCollection(source.plan.expenses, planId, idMap);
  const assets = rekeyCollection(source.plan.assets, planId, idMap);
  const debts = rekeyCollection(source.plan.debts, planId, idMap);
  const scenarios = source.scenarios.map((scenario) => rekeyScenario(scenario, planId, idMap));

  return {
    plan: {
      ...source.plan,
      id: planId,
      profile: {
        ...source.plan.profile,
        id: target?.profileId ?? crypto.randomUUID(),
      },
      incomeSources,
      expenses,
      assets,
      debts,
    },
    scenarios,
  };
}
