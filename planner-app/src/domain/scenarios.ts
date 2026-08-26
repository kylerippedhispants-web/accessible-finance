import type { Asset } from "./assets";
import type { Debt } from "./debts";
import type { Expense } from "./expenses";
import type { ProjectionAssumptions } from "./financial-plan";
import type { IncomeSource } from "./income";
import type { EntityId, PlanEntity } from "./common";
import type { ManualRetirementBenefit, RetirementSettings } from "./retirement";

export interface EntityUpdate<T extends PlanEntity> {
  entityId: EntityId;
  changes: Partial<Omit<T, "id" | "planId">>;
}

export interface CollectionOverrides<T extends PlanEntity> {
  add?: T[];
  update?: EntityUpdate<T>[];
  removeIds?: EntityId[];
}

export type RetirementOverrides = Partial<Omit<RetirementSettings, "cpp" | "oas">> & {
  cpp?: Partial<ManualRetirementBenefit>;
  oas?: Partial<ManualRetirementBenefit>;
};

export interface ScenarioOverrides {
  assumptions?: Partial<ProjectionAssumptions>;
  retirement?: RetirementOverrides;
  incomeSources?: CollectionOverrides<IncomeSource>;
  expenses?: CollectionOverrides<Expense>;
  assets?: CollectionOverrides<Asset>;
  debts?: CollectionOverrides<Debt>;
}

export interface PlanScenario {
  id: EntityId;
  planId: EntityId;
  name: string;
  description?: string;
  isBaseline?: boolean;
  overrides: ScenarioOverrides;
}
