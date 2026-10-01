import type {
  Asset,
  CollectionOverrides,
  Debt,
  Expense,
  IncomeSource,
  PlanEntity,
  ScenarioOverrides,
} from '../domain';
import type { PlannerSnapshot } from './demoPlan';
import {
  exportedPlanSchema,
  plannerSnapshotSchema,
  type ExportedPlan,
} from '../validation/planSchemas';

export const MAX_PLAN_TRANSFER_BYTES = 16_000_000;
export const PLAN_TRANSFER_SIZE_MESSAGE = 'Planner backups must be 16 MB or smaller.';

function checkTransferSize(json: string): void {
  if (new TextEncoder().encode(json).byteLength > MAX_PLAN_TRANSFER_BYTES) {
    throw new RangeError(PLAN_TRANSFER_SIZE_MESSAGE);
  }
}

export function createPlanExport(snapshot: PlannerSnapshot): ExportedPlan {
  const data = plannerSnapshotSchema.parse(structuredClone(snapshot));
  return exportedPlanSchema.parse({
    format: 'accessible-finance-planner',
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  });
}

export function serializePlanExport(snapshot: PlannerSnapshot): string {
  const payload = JSON.stringify(createPlanExport(snapshot), null, 2);
  checkTransferSize(payload);
  return payload;
}

function safeExportFilename(filename: string | undefined): string {
  const fallback = `accessible-finance-plan-${new Date().toISOString().slice(0, 10)}.json`;
  if (!filename?.trim()) return fallback;
  const safeBase = filename
    .trim()
    .replace(/\.json$/i, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
  return safeBase ? `${safeBase}.json` : fallback;
}

export function downloadPlanExport(snapshot: PlannerSnapshot, filename?: string): void {
  const payload = serializePlanExport(snapshot);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeExportFilename(filename);
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
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
  const added = collection.add?.map((item) => ({
    ...item,
    id: crypto.randomUUID(),
    planId,
  }));
  const baselineId = (sourceId: string): string => {
    const mapped = idMap.get(sourceId);
    if (!mapped) {
      throw new Error(`Scenario refers to an unknown baseline record: ${sourceId}`);
    }
    return mapped;
  };
  return {
    add: added,
    update: collection.update?.map((update) => ({
      ...update,
      entityId: baselineId(update.entityId),
    })),
    removeIds: collection.removeIds?.map(baselineId),
  };
}

export function parsePlanImport(
  json: string,
  target?: { planId?: string; profileId?: string },
): PlannerSnapshot {
  checkTransferSize(json);
  const validated = exportedPlanSchema.parse(JSON.parse(json));
  const source = validated.data;
  const planId = target?.planId ?? crypto.randomUUID();
  const incomeIds = new Map<string, string>();
  const expenseIds = new Map<string, string>();
  const assetIds = new Map<string, string>();
  const debtIds = new Map<string, string>();

  const incomeSources = rekeyCollection(source.plan.incomeSources, planId, incomeIds);
  const expenses = rekeyCollection(source.plan.expenses, planId, expenseIds);
  const assets = rekeyCollection(source.plan.assets, planId, assetIds);
  const debts = rekeyCollection(source.plan.debts, planId, debtIds);
  const scenarios = source.scenarios.map((scenario) => {
    const overrides: ScenarioOverrides = {
      assumptions: scenario.overrides.assumptions,
      retirement: scenario.overrides.retirement,
      incomeSources: rekeyOverrides<IncomeSource>(scenario.overrides.incomeSources, planId, incomeIds),
      expenses: rekeyOverrides<Expense>(scenario.overrides.expenses, planId, expenseIds),
      assets: rekeyOverrides<Asset>(scenario.overrides.assets, planId, assetIds),
      debts: rekeyOverrides<Debt>(scenario.overrides.debts, planId, debtIds),
    };
    return { ...scenario, id: crypto.randomUUID(), planId, overrides };
  });

  return plannerSnapshotSchema.parse({
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
  });
}
