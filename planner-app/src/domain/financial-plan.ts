import type { EntityId } from "./common";
import type { Asset } from "./assets";
import type { Debt } from "./debts";
import type { Expense } from "./expenses";
import type { IncomeSource } from "./income";
import type { PlannerProfile } from "./profile";
import type { RetirementSettings } from "./retirement";

export interface ProjectionAssumptions {
  /** User-supplied flat effective rate in percentage points. No tax tables are applied. */
  effectiveTaxPercent: number;
  /** Used to convert nominal projection values into base-year dollars. */
  generalInflationPercent: number;
}
/** Persistence-neutral, JSON-serializable input consumed by the finance engine. */
export interface FinancialPlan {
  schemaVersion: 1;
  id: EntityId;
  name: string;
  /** Explicit base year keeps projections deterministic and independent of the clock. */
  baseYear: number;
  profile: PlannerProfile;
  assumptions: ProjectionAssumptions;
  incomeSources: IncomeSource[];
  expenses: Expense[];
  assets: Asset[];
  debts: Debt[];
  retirement: RetirementSettings;
}
