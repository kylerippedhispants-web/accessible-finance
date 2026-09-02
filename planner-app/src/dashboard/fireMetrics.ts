import type { FinancialPlan } from '../domain';
import { assetCategory, type FireEstimate, type ProjectionYear } from '../finance-engine';

export interface FireOverviewModel {
  estimate: FireEstimate;
  currentModeledWithdrawableAssets: number;
  progressPercent: number | null;
  progressValue: number | null;
  firstYearAvailableSavings: number;
  debtFreeYear: number | null;
  hasModeledDebt: boolean;
  plannedRetirementYear: number;
  estimateNeedsReview: boolean;
}

function sustainedLiabilityFreeYear(projection: ProjectionYear[]): number | null {
  let earliest: ProjectionYear | undefined;
  for (let index = projection.length - 1; index >= 0; index -= 1) {
    if (projection[index].totalLiabilities > 0.01) break;
    earliest = projection[index];
  }
  return earliest?.year ?? null;
}

/** Derives dashboard-only FIRE presentation values without rerunning projection math. */
export function buildFireOverviewModel(
  plan: FinancialPlan,
  estimate: FireEstimate,
  projection: ProjectionYear[],
): FireOverviewModel {
  const currentModeledWithdrawableAssets = plan.assets
    .filter((asset) => (
      asset.enabled !== false
      && (asset.startYear ?? plan.baseYear) <= plan.baseYear
      && assetCategory(asset) !== 'property'
    ))
    .reduce((sum, asset) => sum + asset.currentValue, 0);
  const target = estimate.status === 'estimated'
    ? estimate.realOpeningModeledWithdrawableAssets
    : null;
  const progressPercent = target === null
    ? null
    : target <= 0
      ? 100
      : (currentModeledWithdrawableAssets / target) * 100;
  const birthYear = Number(plan.profile.dateOfBirth.slice(0, 4));
  const enabledDebts = plan.debts.filter((debt) => debt.enabled !== false && debt.balance > 0);

  return {
    estimate,
    currentModeledWithdrawableAssets,
    progressPercent,
    progressValue: progressPercent === null ? null : Math.max(0, Math.min(100, progressPercent)),
    firstYearAvailableSavings: projection[0]?.availableSavings ?? 0,
    debtFreeYear: enabledDebts.length ? sustainedLiabilityFreeYear(projection) : null,
    hasModeledDebt: enabledDebts.length > 0,
    plannedRetirementYear: birthYear + plan.retirement.targetRetirementAge,
    estimateNeedsReview: plan.assumptions.effectiveTaxPercent === 0
      || plan.retirement.estimatedAnnualSpending <= 0,
  };
}
