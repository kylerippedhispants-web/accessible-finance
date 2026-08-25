import type { CurrencyCode, EntityId } from "./common";

export const CANADIAN_PROVINCES_AND_TERRITORIES = [
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NS",
  "NT",
  "NU",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT",
] as const;

export type ProvinceOrTerritory = (typeof CANADIAN_PROVINCES_AND_TERRITORIES)[number];

export interface PlannerProfile {
  id: EntityId;
  firstName: string;
  provinceOrTerritory: ProvinceOrTerritory;
  /** ISO 8601 calendar date (`YYYY-MM-DD`). */
  dateOfBirth: string;
  currency: CurrencyCode;
}
