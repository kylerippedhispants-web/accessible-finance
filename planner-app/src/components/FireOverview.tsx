import { Link } from 'react-router-dom';
import type { FinancialPlan } from '../domain';
import type { FireOverviewModel } from '../dashboard/fireMetrics';
import { formatCad, formatCadMetric, formatPercent } from '../lib/formatters';

function HeadlineMoney({ value }: { value: number }) {
  const formatted = formatCadMetric(value);
  return (
    <span className="fire-money">
      <strong><span aria-hidden="true">{formatted.display}</span><span className="sr-only">{formatted.precise}</span></strong>
      {formatted.isCompact && <small aria-hidden="true">Exact: {formatted.precise}</small>}
    </span>
  );
}

function progressText(model: FireOverviewModel): string {
  if (model.progressPercent === null || model.estimate.status !== 'estimated') return '';
  if (model.estimate.realOpeningModeledWithdrawableAssets <= 0) {
    return 'The projected opening FIRE amount is zero, so a percentage share is not meaningful.';
  }
  return `Current modeled-withdrawable assets equal ${Math.round(model.progressPercent)}% of the projected opening FIRE amount.`;
}

export function FireOverview({
  plan,
  model,
}: {
  plan: FinancialPlan;
  model: FireOverviewModel;
}) {
  const { estimate } = model;
  const isEstimated = estimate.status === 'estimated';
  const progressDescription = progressText(model);
  const debtMilestone = model.hasModeledDebt
    ? model.debtFreeYear
      ? { year: String(model.debtFreeYear), label: 'Modeled debt-free' }
      : { year: 'Beyond plan', label: 'Debt remains' }
    : { year: 'None', label: 'No modeled debt' };

  return (
    <section className={`fire-overview fire-status-${estimate.status}`} aria-labelledby="fire-overview-title">
      <div className="fire-glow" aria-hidden="true" />
      <header className="fire-overview-header">
        <div>
          <span className="eyebrow">Your financial independence path</span>
          <h2 id="fire-overview-title">Your FIRE outlook</h2>
          <p><strong>FIRE</strong> means financial independence, retire early. This annual estimate is built from the cash flow, assets, debts, and assumptions in your plan.</p>
        </div>
        <span className={`fire-confidence${model.estimateNeedsReview ? ' needs-review' : ''}`}>
          {model.estimateNeedsReview ? 'Estimate needs review' : 'Inputs modeled'}
        </span>
      </header>

      <div className="fire-answer-grid">
        <div className="fire-date-answer">
          <span className="fire-answer-label">Estimated FIRE year</span>
          {isEstimated ? (
            <>
              <strong className="fire-year">{estimate.year}</strong>
              <p>Age {estimate.age} · {estimate.yearsFromBase === 0 ? 'modeled now' : `${estimate.yearsFromBase} years from ${plan.baseYear}`}</p>
            </>
          ) : (
            <>
              <strong className="fire-unavailable">{estimate.status === 'needs_inputs' ? 'Add spending' : 'Not reached'}</strong>
              <p>{estimate.status === 'needs_inputs'
                ? 'Enter annual spending after work income stops to create a meaningful estimate.'
                : `No tested retirement year funds every modeled cash flow through age ${estimate.horizonAge}.`}</p>
            </>
          )}
        </div>

        <div className="fire-amount-answer">
          <span className="fire-answer-label">Modeled FIRE amount · today’s dollars</span>
          {isEstimated ? (
            <>
              <HeadlineMoney value={estimate.realOpeningModeledWithdrawableAssets} />
              <p>{formatCad(estimate.openingModeledWithdrawableAssets)} in nominal dollars at the opening of {estimate.year}.</p>
            </>
          ) : (
            <>
              <span className="fire-money"><strong>Not available</strong></span>
              <p>The planner does not invent a dollar target when the annual screen has not found a FIRE year.</p>
            </>
          )}
        </div>
      </div>

      {isEstimated && model.progressValue !== null && (
        <div className="fire-progress-block">
          <div className="fire-progress-copy">
            <span>Current modeled-withdrawable assets</span>
            <strong>{formatCad(model.currentModeledWithdrawableAssets)} of {formatCad(estimate.realOpeningModeledWithdrawableAssets)} projected at FIRE</strong>
          </div>
          <progress
            max={100}
            value={model.progressValue}
            aria-label="Current assets as a share of projected opening FIRE amount"
            aria-valuetext={progressDescription}
          />
          <p>{progressDescription} Both amounts use base-year dollars and exclude property; this is not progress toward a fixed target.</p>
        </div>
      )}

      <dl className="fire-driver-grid">
        <div><dt>Current FIRE capital</dt><dd>{formatCad(model.currentModeledWithdrawableAssets)}<small>Enabled non-property assets</small></dd></div>
        <div><dt>First-year available savings</dt><dd>{formatCad(model.firstYearAvailableSavings)}<small>Before optional contributions</small></dd></div>
        <div><dt>Annual spending after work</dt><dd>{formatCad(plan.retirement.estimatedAnnualSpending)}<small>Base-year amount</small></dd></div>
        <div><dt>Planned retirement</dt><dd>Age {plan.retirement.targetRetirementAge}<small>{model.plannedRetirementYear}</small></dd></div>
      </dl>

      <div className="fire-timeline" aria-label="Modeled plan milestones">
        <ol>
          <li><span>{plan.baseYear}</span><strong>Plan begins</strong></li>
          <li><span>{debtMilestone.year}</span><strong>{debtMilestone.label}</strong></li>
          <li className="fire-timeline-target"><span>{isEstimated ? estimate.year : '—'}</span><strong>{isEstimated ? 'Estimated FIRE' : 'FIRE not found'}</strong></li>
          <li><span>{estimate.horizonYear}</span><strong>Plan through age {estimate.horizonAge}</strong></li>
        </ol>
      </div>

      <div className="fire-assumption-strip" aria-label="FIRE estimate assumptions">
        <span>Today’s dollars</span>
        <span>{formatPercent(plan.assumptions.generalInflationPercent)} inflation</span>
        <span>{formatPercent(plan.retirement.investmentReturnBeforeRetirementPercent)} return before retirement</span>
        <span>{formatPercent(plan.retirement.investmentReturnAfterRetirementPercent)} after</span>
      </div>

      <div className="fire-actions">
        <Link className="button button-primary" to="/retirement">Review goal &amp; assumptions</Link>
        <a className="button button-secondary" href="#fire-what-if">Compare another path</a>
        <Link className="text-button" to="/guide#fire-guide">How this estimate works</Link>
      </div>

      <p className="fire-definition">
        The amount is cash, investments, pensions, and other non-property assets the engine models as available at the opening of the estimated year. Debt is not subtracted a second time because scheduled payments already reduce modeled cash flow. This is not a 4% rule target, success probability, guarantee, or recommendation. Account access rules and withdrawal tax are not modeled.
      </p>
    </section>
  );
}
