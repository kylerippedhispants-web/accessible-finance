import { type PointerEvent, useId, useMemo, useState } from 'react';
import type { ProjectionYear } from '../finance-engine';

export type DollarView = 'nominal' | 'real';

interface ProjectionChartProps {
  baseline: ProjectionYear[];
  comparison?: ProjectionYear[];
  comparisonLabel?: string;
  dollarView: DollarView;
}

const money = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
});

function compactMoney(value: number): string {
  const absolute = Math.abs(value);
  const prefix = value < 0 ? '−' : '';
  if (absolute >= 1_000_000_000) return `${prefix}$${(absolute / 1_000_000_000).toFixed(1)}B`;
  if (absolute >= 1_000_000) return `${prefix}$${(absolute / 1_000_000).toFixed(1)}M`;
  if (absolute >= 1_000) return `${prefix}$${Math.round(absolute / 1_000)}K`;
  return `${prefix}$${Math.round(absolute)}`;
}

function netWorth(point: ProjectionYear, view: DollarView): number {
  return view === 'real' ? point.realNetWorth : point.netWorth;
}

function field(point: ProjectionYear, view: DollarView, nominal: keyof ProjectionYear, real: keyof ProjectionYear): number {
  return Number(point[view === 'real' ? real : nominal]);
}

export function ProjectionChart({ baseline, comparison, comparisonLabel = 'What-if', dollarView }: ProjectionChartProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const width = 920;
  const height = 390;
  const margin = { top: 30, right: 28, bottom: 56, left: 76 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const safeIndex = Math.min(selectedIndex, Math.max(0, baseline.length - 1));

  const geometry = useMemo(() => {
    const values = [
      ...baseline.map((point) => netWorth(point, dollarView)),
      ...(comparison ?? []).map((point) => netWorth(point, dollarView)),
      0,
    ];
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const range = Math.max(1, rawMax - rawMin);
    const min = rawMin - range * 0.08;
    const max = rawMax + range * 0.08;
    const x = (index: number) => margin.left + (baseline.length <= 1 ? 0 : index / (baseline.length - 1)) * plotWidth;
    const y = (value: number) => margin.top + ((max - value) / (max - min)) * plotHeight;
    const path = (series: ProjectionYear[]) => series.map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command}${x(index).toFixed(2)},${y(netWorth(point, dollarView)).toFixed(2)}`;
    }).join(' ');
    return { min, max, x, y, baselinePath: path(baseline), comparisonPath: comparison ? path(comparison) : undefined };
  }, [baseline, comparison, dollarView, plotHeight, plotWidth]);

  if (!baseline.length) return <p className="empty-state">Add plan inputs to create a projection.</p>;

  const point = baseline[safeIndex];
  const comparisonPoint = comparison?.[Math.min(safeIndex, comparison.length - 1)];
  const inspectedX = geometry.x(safeIndex);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => geometry.max - (geometry.max - geometry.min) * ratio);
  const xIndexes = [...new Set([0, Math.round((baseline.length - 1) * 0.25), Math.round((baseline.length - 1) * 0.5), Math.round((baseline.length - 1) * 0.75), baseline.length - 1])];

  const inspectPointer = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const scaledX = ((event.clientX - bounds.left) / bounds.width) * width;
    const ratio = Math.max(0, Math.min(1, (scaledX - margin.left) / plotWidth));
    setSelectedIndex(Math.round(ratio * (baseline.length - 1)));
  };

  return (
    <div className="projection-chart">
      <div className="chart-legend" aria-label="Chart legend">
        <span><i className="baseline" />Baseline</span>
        {comparison && <span><i className="comparison" />{comparisonLabel}</span>}
      </div>
      <div
        className="chart-canvas"
        role="region"
        tabIndex={0}
        aria-label="Scrollable net worth projection chart"
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-labelledby={`${titleId} ${descriptionId}`}
          onPointerMove={inspectPointer}
        >
          <title id={titleId}>Net worth projection</title>
          <desc id={descriptionId}>
            Baseline net worth changes from {money.format(netWorth(baseline[0], dollarView))} at age {baseline[0].age} to {money.format(netWorth(baseline.at(-1)!, dollarView))} at age {baseline.at(-1)!.age}. Use the year inspector below for details.
          </desc>
          <g className="chart-grid" aria-hidden="true">
            {yTicks.map((value) => (
              <g key={value}>
                <line x1={margin.left} x2={width - margin.right} y1={geometry.y(value)} y2={geometry.y(value)} />
                <text x={margin.left - 12} y={geometry.y(value) + 4} textAnchor="end">{compactMoney(value)}</text>
              </g>
            ))}
            {xIndexes.map((index) => (
              <g key={index}>
                <line x1={geometry.x(index)} x2={geometry.x(index)} y1={margin.top} y2={height - margin.bottom} />
                <text x={geometry.x(index)} y={height - 26} textAnchor="middle">{baseline[index].year}</text>
                <text x={geometry.x(index)} y={height - 9} textAnchor="middle">Age {baseline[index].age}</text>
              </g>
            ))}
            {geometry.min < 0 && geometry.max > 0 && (
              <line className="zero-line" x1={margin.left} x2={width - margin.right} y1={geometry.y(0)} y2={geometry.y(0)} />
            )}
          </g>
          {geometry.comparisonPath && <path className="chart-path comparison" d={geometry.comparisonPath} aria-hidden="true" />}
          <path className="chart-path baseline" d={geometry.baselinePath} aria-hidden="true" />
          <g className="chart-inspector" aria-hidden="true">
            <line x1={inspectedX} x2={inspectedX} y1={margin.top} y2={height - margin.bottom} />
            <circle cx={inspectedX} cy={geometry.y(netWorth(point, dollarView))} r="6" />
            {comparisonPoint && <circle className="comparison" cx={inspectedX} cy={geometry.y(netWorth(comparisonPoint, dollarView))} r="5" />}
          </g>
        </svg>
        <div className={`chart-tooltip${inspectedX > width * 0.64 ? ' align-left' : ''}`} style={{ left: `${(inspectedX / width) * 100}%` }}>
          <strong>{point.year} · Age {point.age}</strong>
          <dl>
            <div><dt>Income</dt><dd>{money.format(field(point, dollarView, 'grossIncome', 'realGrossIncome'))}</dd></div>
            <div><dt>Taxes</dt><dd>{money.format(field(point, dollarView, 'taxes', 'realTaxes'))}</dd></div>
            <div><dt>Expenses</dt><dd>{money.format(field(point, dollarView, 'expenses', 'realExpenses'))}</dd></div>
            <div><dt>Investments</dt><dd>{money.format(field(point, dollarView, 'investmentAssets', 'realInvestmentAssets'))}</dd></div>
            <div><dt>Property</dt><dd>{money.format(field(point, dollarView, 'propertyAssets', 'realPropertyAssets'))}</dd></div>
            <div><dt>Debt</dt><dd>{money.format(field(point, dollarView, 'totalLiabilities', 'realTotalLiabilities'))}</dd></div>
            <div className="tooltip-total"><dt>Net worth</dt><dd>{money.format(netWorth(point, dollarView))}</dd></div>
            {comparisonPoint && <div><dt>{comparisonLabel}</dt><dd>{money.format(netWorth(comparisonPoint, dollarView))}</dd></div>}
          </dl>
        </div>
      </div>

      <label className="year-inspector">
        <span>Inspect projection year: <strong>{point.year}, age {point.age}</strong></span>
        <input
          type="range"
          min={0}
          max={baseline.length - 1}
          step={1}
          value={safeIndex}
          onChange={(event) => setSelectedIndex(Number(event.target.value))}
        />
      </label>

      <p className="chart-summary">
        In {dollarView === 'real' ? 'today’s dollars' : 'nominal dollars'}, the baseline reaches <strong>{money.format(netWorth(baseline.at(-1)!, dollarView))}</strong> by age {baseline.at(-1)!.age}.
        {comparisonPoint && <> At the inspected year, {comparisonLabel} is <strong>{money.format(netWorth(comparisonPoint, dollarView) - netWorth(point, dollarView))}</strong> different from baseline.</>}
      </p>

      <details className="chart-data-table">
        <summary>View projection as a data table</summary>
        <div className="table-scroll" tabIndex={0} aria-label="Scrollable projection table">
          <table>
            <thead><tr><th>Year</th><th>Age</th><th>Income</th><th>Taxes</th><th>Expenses</th><th>Assets</th><th>Debt</th><th>Net worth</th></tr></thead>
            <tbody>
              {baseline.map((row) => (
                <tr key={row.year}>
                  <th scope="row">{row.year}</th>
                  <td>{row.age}</td>
                  <td>{money.format(field(row, dollarView, 'grossIncome', 'realGrossIncome'))}</td>
                  <td>{money.format(field(row, dollarView, 'taxes', 'realTaxes'))}</td>
                  <td>{money.format(field(row, dollarView, 'expenses', 'realExpenses'))}</td>
                  <td>{money.format(field(row, dollarView, 'totalAssets', 'realTotalAssets'))}</td>
                  <td>{money.format(field(row, dollarView, 'totalLiabilities', 'realTotalLiabilities'))}</td>
                  <td>{money.format(netWorth(row, dollarView))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
