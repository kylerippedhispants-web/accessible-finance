/** Stable string identifiers. UUIDs are recommended at persistence boundaries. */
export type EntityId = string;

/**
 * Frequencies supported by the MVP database contract.
 * `one_time` is a scheduled amount in one calendar year and is never annualized.
 */
export const FREQUENCIES = ["monthly", "biweekly", "annual", "one_time"] as const;
export type Frequency = (typeof FREQUENCIES)[number];
export type RecurringFrequency = Exclude<Frequency, "one_time">;

export type CurrencyCode = "CAD";

export interface PlanEntity {
  id: EntityId;
  planId?: EntityId;
  position?: number;
}
export interface NamedPlanEntity extends PlanEntity {
  name: string;
  enabled?: boolean;
}
