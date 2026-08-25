import {
  memo,
  type KeyboardEvent,
  type PointerEvent,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import type { ProjectionYear } from '../finance-engine';
import { formatCad, formatCadCompact, formatCadDelta } from '../lib/formatters';

export type DollarView = 'nominal' | 'real';

interface ProjectionChartProps {
  baseline: ProjectionYear[];
  comparison?: ProjectionYear[];
  comparisonLabel?: string;
  dollarView: DollarView;
}

const DESKTOP_CHART = {
  width: 920,
  height: 390,
  margin: { top: 28, right: 24, bottom: 58, left: 78 },
} as const;
const COMPACT_CHART = {
  width: 440,
  height: 350,
  margin: { top: 22, right: 12, bottom: 54, left: 68 },
} as const;
const COMPACT_QUERY = '(max-width: 600px)';

function compactChartSnapshot(): boolean {
  return window.matchMedia(COMPACT_QUERY).matches;
}

function subscribeToCompactChart(listener: () => void): () => void {
  const query = window.matchMedia(COMPACT_QUERY);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

function netWorth(point: ProjectionYear, view: DollarView): number {
  return view === 'real' ? point.realNetWorth : point.netWorth;
}

function field(point: ProjectionYear, view: DollarView, nominal: keyof ProjectionYear, real: keyof ProjectionYear): number {
  return Number(point[view === 'real' ? real : nominal]);
}

function niceStep(value: number): number {
  const safeValue = Math.max(Number.EPSILON, value);
  const exponent = Math.floor(Math.log10(safeValue));
  const magnitude = 10 ** exponent;
  const fraction = safeValue / magnitude;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * magnitude;
}

function chartDomain(values: number[]): { min: number; max: number; ticks: number[] } {
  const finiteValues = values.filter(Number.isFinite);
  let rawMin = Math.min(0, ...finiteValues);
  let rawMax = Math.max(0, ...finiteValues);

  if (rawMin === rawMax) {
    const padding = Math.max(1_000, Math.abs(rawMax) * 0.1);
    rawMin -= padding;
    rawMax += padding;
  } else {
    const padding = (rawMax - rawMin) * 0.05;
    if (rawMin < 0) rawMin -= padding;
    if (rawMax > 0) rawMax += padding;
  }

  const step = niceStep((rawMax - rawMin) / 4);
  let min = Math.floor(rawMin / step) * step;
  let max = Math.ceil(rawMax / step) * step;
  if (min === max) {
    min -= step;
    max += step;
  }

  const ticks: number[] = [];
  for (let value = min, count = 0; value <= max + step * 0.001 && count < 10; value += step, count += 1) {
    ticks.push(Math.abs(value) < step * 0.001 ? 0 : value);
  }
  return { min, max, ticks };
}

function deltaDescription(value: number): string {
  if (Math.abs(value) < 0.005) return 'the same as baseline';
  return `${formatCad(Math.abs(value))} ${value > 0 ? 'above' : 'below'} baseline`;
}

export const ProjectionChart = memo(function ProjectionChart({
  baseline,
  comparison,
  comparisonLabel = 'What-if',
  dollarView,
}: ProjectionChartProps) {
  const titleId = useId();
  const descriptionId = useId();
  const instructionId = useId();
  const inspectorTitleId = useId();
  const compact = useSyncExternalStore(subscribeToCompactChart, compactChartSnapshot, () => false);
  const dimensions = compact ? COMPACT_CHART : DESKTOP_CHART;
  const plotWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
  const plotHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [keyboardAnnouncement, setKeyboardAnnouncement] = useState('');
  const safeIndex = Math.min(selectedIndex, Math.max(0, baseline.length - 1));
  const viewLabel = dollarView === 'real' ? 'Today’s dollars' : 'Nominal dollars';

  const comparisonByYear = useMemo(
    () => new Map((comparison ?? []).map((point) => [point.year, point])),
    [comparison],
  );

  const geometry = useMemo(() => {
    const domain = chartDomain([
      ...baseline.map((point) => netWorth(point, dollarView)),
      ...(comparison ?? []).map((point) => netWorth(point, dollarView)),
    ]);
    const firstYear = baseline[0]?.year ?? 0;
    const lastYear = baseline.at(-1)?.year ?? firstYear;
    const yearSpan = lastYear - firstYear;
    const x = (point: ProjectionYear) => yearSpan === 0
      ? dimensions.margin.left + plotWidth / 2
      : dimensions.margin.left + Math.max(0, Math.min(1, (point.year - firstYear) / yearSpan)) * plotWidth;
    const y = (value: number) => dimensions.margin.top + ((domain.max - value) / (domain.max - domain.min)) * plotHeight;
    const path = (series: ProjectionYear[]) => series.map((point, index) => (
      `${index === 0 ? 'M' : 'L'}${x(point).toFixed(2)},${y(netWorth(point, dollarView)).toFixed(2)}`
    )).join(' ');
    return {
      ...domain,
      x,
      y,
      baselinePath: path(baseline),
      comparisonPath: comparison?.length ? path(comparison) : undefined,
    };
  }, [baseline, comparison, dimensions, dollarView, plotHeight, plotWidth]);

  if (!baseline.length) {
    return <div className="empty-state chart-empty"><strong>No projection yet.</strong><p>Add plan inputs to create a projection.</p></div>;
  }

  const point = baseline[safeIndex];
  const comparisonPoint = comparisonByYear.get(point.year);
  const inspectedX = geometry.x(point);
  const inspectedBaseline = netWorth(point, dollarView);
  const inspectedComparison = comparisonPoint ? netWorth(comparisonPoint, dollarView) : undefined;
  const inspectedDelta = inspectedComparison === undefined ? undefined : inspectedComparison - inspectedBaseline;
  const finalPoint = baseline.at(-1)!;
  const finalComparisonPoint = comparisonByYear.get(finalPoint.year) ?? comparison?.at(-1);
  const finalDelta = finalComparisonPoint
    ? netWorth(finalComparisonPoint, dollarView) - netWorth(finalPoint, dollarView)
    : undefined;
  const xIndexes = [...new Set(compact
    ? [0, Math.round((baseline.length - 1) * 0.5), baseline.length - 1]
    : [
        0,
        Math.round((baseline.length - 1) * 0.25),
        Math.round((baseline.length - 1) * 0.5),
        Math.round((baseline.length - 1) * 0.75),
        baseline.length - 1,
      ])];

  const selectIndex = (index: number, announce = false) => {
    const nextIndex = Math.max(0, Math.min(baseline.length - 1, index));
    setSelectedIndex(nextIndex);
    if (!announce) return;
    const nextPoint = baseline[nextIndex];
    const nextComparison = comparisonByYear.get(nextPoint.year);
    const nextComparisonText = nextComparison
      ? ` ${comparisonLabel} is ${deltaDescription(netWorth(nextComparison, dollarView) - netWorth(nextPoint, dollarView))}.`
      : '';
    setKeyboardAnnouncement(
      `${nextPoint.year}, age ${nextPoint.age}. Baseline net worth ${formatCad(netWorth(nextPoint, dollarView))}.${nextComparisonText}`,
    );
  };

  const inspectPointer = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width) return;
    const scaledX = ((event.clientX - bounds.left) / bounds.width) * dimensions.width;
    const ratio = Math.max(0, Math.min(1, (scaledX - dimensions.margin.left) / plotWidth));
    selectIndex(Math.round(ratio * (baseline.length - 1)));
  };

  const handleChartKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let nextIndex = safeIndex;
    if (event.key === 'ArrowLeft') nextIndex -= 1;
    else if (event.key === 'ArrowRight') nextIndex += 1;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = baseline.length - 1;
    else return;
    event.preventDefault();
    selectIndex(nextIndex, true);
  };

  const description = [
    `${viewLabel}. Baseline net worth changes from ${formatCad(netWorth(baseline[0], dollarView))} at age ${baseline[0].age} to ${formatCad(netWorth(finalPoint, dollarView))} at age ${finalPoint.age}.`,
    finalComparisonPoint && finalDelta !== undefined
      ? `${comparisonLabel} ends ${deltaDescription(finalDelta)}.`
      : undefined,
  ].filter(Boolean).join(' ');

  return (
    <div className="projection-chart">
      <div className="chart-toolbar">
        <ul className="chart-legend" aria-label="Projection series">
          <li><span className="chart-key baseline" aria-hidden="true" />Baseline</li>
          {comparison && <li><span className="chart-key comparison" aria-hidden="true" />{comparisonLabel}</li>}
        </ul>
        <p id={instructionId} className="chart-instructions">Click or touch the chart, or focus it and use Left, Right, Home, and End.</p>
      </div>

      <div className="chart-stage">
        <div
          className="chart-canvas"
          role="region"
          tabIndex={0}
          aria-label="Interactive net worth projection chart"
          aria-describedby={instructionId}
          onKeyDown={handleChartKeyDown}
        >
          <svg
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            role="img"
            aria-labelledby={`${titleId} ${descriptionId}`}
            onPointerDown={(event) => {
              event.currentTarget.parentElement?.focus();
              inspectPointer(event);
            }}
            onPointerMove={(event) => {
              if (event.pointerType === 'mouse') inspectPointer(event);
            }}
          >
            <title id={titleId}>Net worth projection</title>
            <desc id={descriptionId}>{description}</desc>
            <rect className="chart-plot-background" x={dimensions.margin.left} y={dimensions.margin.top} width={plotWidth} height={plotHeight} rx="4" aria-hidden="true" />
            <g className="chart-grid" aria-hidden="true">
              {geometry.ticks.map((value) => (
                <g key={value}>
                  <line x1={dimensions.margin.left} x2={dimensions.width - dimensions.margin.right} y1={geometry.y(value)} y2={geometry.y(value)} />
                  <text x={dimensions.margin.left - 12} y={geometry.y(value) + 4} textAnchor="end">{formatCadCompact(value)}</text>
                </g>
              ))}
              {xIndexes.map((index) => (
                <g key={index}>
                  <line x1={geometry.x(baseline[index])} x2={geometry.x(baseline[index])} y1={dimensions.margin.top} y2={dimensions.height - dimensions.margin.bottom} />
                  <text x={geometry.x(baseline[index])} y={dimensions.height - 27} textAnchor={compact && index === baseline.length - 1 ? 'end' : 'middle'}>{baseline[index].year}</text>
                  <text x={geometry.x(baseline[index])} y={dimensions.height - 10} textAnchor={compact && index === baseline.length - 1 ? 'end' : 'middle'}>Age {baseline[index].age}</text>
                </g>
              ))}
              {geometry.min < 0 && geometry.max > 0 && (
                <line className="zero-line" x1={dimensions.margin.left} x2={dimensions.width - dimensions.margin.right} y1={geometry.y(0)} y2={geometry.y(0)} />
              )}
            </g>
            {geometry.comparisonPath && <path className="chart-path comparison" d={geometry.comparisonPath} aria-hidden="true" />}
            <path className="chart-path baseline" d={geometry.baselinePath} aria-hidden="true" />
            <g className="chart-inspector" aria-hidden="true">
              <line x1={inspectedX} x2={inspectedX} y1={dimensions.margin.top} y2={dimensions.height - dimensions.margin.bottom} />
              <circle cx={inspectedX} cy={geometry.y(inspectedBaseline)} r="6" />
              {comparisonPoint && <circle className="comparison" cx={inspectedX} cy={geometry.y(netWorth(comparisonPoint, dollarView))} r="5" />}
            </g>
          </svg>
        </div>

        <aside className="chart-inspector-card" aria-labelledby={inspectorTitleId}>
          <header>
            <div><span>Selected year</span><h3 id={inspectorTitleId}>{point.year} <small>Age {point.age}</small></h3></div>
            <span className="chart-view-badge">{viewLabel}</span>
          </header>
          <dl>
            <div><dt>Gross income</dt><dd>{formatCad(field(point, dollarView, 'grossIncome', 'realGrossIncome'))}</dd></div>
            <div><dt>Taxes</dt><dd>{formatCad(field(point, dollarView, 'taxes', 'realTaxes'))}</dd></div>
            <div><dt>Spending</dt><dd>{formatCad(field(point, dollarView, 'expenses', 'realExpenses'))}</dd></div>
            <div><dt>Total assets</dt><dd>{formatCad(field(point, dollarView, 'totalAssets', 'realTotalAssets'))}</dd></div>
            <div><dt>Total liabilities</dt><dd>{formatCad(field(point, dollarView, 'totalLiabilities', 'realTotalLiabilities'))}</dd></div>
            <div className="inspector-total"><dt>Baseline net worth</dt><dd>{formatCad(inspectedBaseline)}</dd></div>
            {comparisonPoint && inspectedComparison !== undefined && (
              <>
                <div><dt>{comparisonLabel}</dt><dd>{formatCad(inspectedComparison)}</dd></div>
                <div className={`inspector-delta${(inspectedDelta ?? 0) > 0 ? ' positive' : (inspectedDelta ?? 0) < 0 ? ' negative' : ''}`}>
                  <dt>Difference</dt><dd>{formatCadDelta(inspectedDelta ?? 0)}</dd>
                </div>
              </>
            )}
          </dl>
        </aside>
      </div>

      <label className="year-inspector">
        <span>Inspect projection year: <strong>{point.year}, age {point.age}</strong></span>
        <input
          type="range"
          min={0}
          max={baseline.length - 1}
          step={1}
          value={safeIndex}
          onChange={(event) => selectIndex(Number(event.target.value))}
        />
      </label>
      <p className="sr-only" aria-live="polite" aria-atomic="true">{keyboardAnnouncement}</p>

      <p className="chart-summary">
        In {viewLabel.toLocaleLowerCase('en-CA')}, baseline net worth reaches <strong>{formatCad(netWorth(finalPoint, dollarView))}</strong> by age {finalPoint.age}.
        {finalComparisonPoint && finalDelta !== undefined && <> {comparisonLabel} ends <strong>{deltaDescription(finalDelta)}</strong>.</>}
      </p>

      <details className="chart-data-table">
        <summary>View projection as a data table</summary>
        <div className="table-scroll" tabIndex={0} aria-label="Scrollable projection table">
          <table>
            <caption className="sr-only">Projection in {viewLabel.toLocaleLowerCase('en-CA')}. Dollar amounts are Canadian dollars.</caption>
            <thead>
              <tr>
                <th scope="col">Year</th><th scope="col">Age</th><th scope="col">Income</th><th scope="col">Taxes</th><th scope="col">Spending</th><th scope="col">Assets</th><th scope="col">Liabilities</th><th scope="col">Baseline net worth</th>
                {comparison && <><th scope="col">{comparisonLabel} net worth</th><th scope="col">Difference</th></>}
              </tr>
            </thead>
            <tbody>
              {baseline.map((row) => {
                const comparedRow = comparisonByYear.get(row.year);
                const baselineValue = netWorth(row, dollarView);
                const comparedValue = comparedRow ? netWorth(comparedRow, dollarView) : undefined;
                return (
                  <tr key={row.year}>
                    <th scope="row">{row.year}</th>
                    <td>{row.age}</td>
                    <td>{formatCad(field(row, dollarView, 'grossIncome', 'realGrossIncome'))}</td>
                    <td>{formatCad(field(row, dollarView, 'taxes', 'realTaxes'))}</td>
                    <td>{formatCad(field(row, dollarView, 'expenses', 'realExpenses'))}</td>
                    <td>{formatCad(field(row, dollarView, 'totalAssets', 'realTotalAssets'))}</td>
                    <td>{formatCad(field(row, dollarView, 'totalLiabilities', 'realTotalLiabilities'))}</td>
                    <td>{formatCad(baselineValue)}</td>
                    {comparison && <><td>{comparedValue === undefined ? '—' : formatCad(comparedValue)}</td><td>{comparedValue === undefined ? '—' : formatCadDelta(comparedValue - baselineValue)}</td></>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
});
