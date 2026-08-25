import type { NamedPlanEntity, RecurringFrequency } from "./common";

export const ASSET_TYPES = [
  "chequing",
  "savings",
  "cash",
  "tfsa",
  "rrsp",
  "fhsa",
  "resp",
  "rrif",
  "non_registered_investment",
  "primary_residence",
  "rental_property",
  "pension",
  "other",
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];
export type AssetCategory = "cash" | "investment" | "property" | "pension" | "other";

export interface Asset extends NamedPlanEntity {
  type: AssetType;
  /** Optional explicit classification; otherwise it is derived from `type`. */
  category?: AssetCategory;
  currentValue: number;
  /**
   * Percentage points. Used for non-property assets before retirement. If
   * omitted, the retirement settings' default pre-retirement return is used
   * for investment assets and 0% is used for other assets.
   */
  expectedReturnPercent?: number;
  /** Optional asset-specific return after retirement, in percentage points. */
  postRetirementReturnPercent?: number;
  /** Property appreciation in percentage points. */
  annualAppreciationPercent?: number;
  /** Total amount contributed during a full year (not amount per payment). */
  annualContribution?: number;
  /** How the annual total is spread through the year; monthly by default. */
  contributionFrequency?: RecurringFrequency;
  contributionStartYear?: number;
  /** Inclusive. */
  contributionEndYear?: number;
  /** First year the asset exists. Defaults to the plan base year. */
  startYear?: number;
}
