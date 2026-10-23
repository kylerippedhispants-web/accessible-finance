// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectionChart } from '../planner-app/src/components/ProjectionChart';
import { createDemoSnapshot } from '../planner-app/src/data/demoPlan';
import { projectFinances, type ProjectionYear } from '../planner-app/src/finance-engine';
import { formatCad, formatCadDelta } from '../planner-app/src/lib/formatters';

async function setTableOpen(open: boolean) {
  const details = document.querySelector('details')!;
  await act(async () => {
    details.open = open;
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
}

describe('projection table rendering', () => {
  let root: Root;
  let baseline: ProjectionYear[];
  const reactGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean };

  beforeEach(() => {
    reactGlobal.IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn<() => void>(),
      removeEventListener: vi.fn<() => void>(),
    }));
    document.body.innerHTML = '<div id="root"></div>';
    root = createRoot(document.getElementById('root')!);
    baseline = projectFinances(createDemoSnapshot().plan);
  });

  afterEach(() => {
    act(() => root.unmount());
    vi.unstubAllGlobals();
    reactGlobal.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it('builds the complete accessible table on demand and retains it after closing', async () => {
    await act(async () => root.render(createElement(ProjectionChart, {
      baseline,
      dollarView: 'real',
      milestones: [{ year: baseline[1].year, label: 'FIRE timing', kind: 'fire' }],
    })));
    expect(document.querySelector('summary')?.textContent).toBe('View projection as a data table');
    expect(document.querySelector('table')).toBeNull();

    await setTableOpen(true);
    const table = document.querySelector('table')!;
    expect(table.querySelectorAll('tbody tr')).toHaveLength(baseline.length);
    expect(table.querySelector('caption')?.textContent).toContain('today’s dollars');
    expect(table.querySelectorAll('thead th[scope="col"]')).toHaveLength(9);
    expect(table.querySelectorAll('tbody th[scope="row"]')).toHaveLength(baseline.length);
    expect(table.querySelectorAll('tbody tr')[1].textContent).toContain('FIRE timing');
    expect(table.querySelectorAll('tbody tr')[1].lastElementChild?.textContent).toBe(formatCad(baseline[1].realNetWorth));
    expect(table.parentElement?.getAttribute('tabindex')).toBe('0');

    await setTableOpen(false);
    expect(document.querySelector('table')).toBe(table);
    await setTableOpen(true);
    expect(document.querySelector('table')).toBe(table);
  });

  it('inspects years without reading or reformatting unchanged table rows', async () => {
    const tableIncome = baseline[1].realGrossIncome;
    const readTableIncome = vi.fn<() => number>(() => tableIncome);
    Object.defineProperty(baseline[1], 'realGrossIncome', { get: readTableIncome });
    await act(async () => root.render(createElement(ProjectionChart, { baseline, dollarView: 'real' })));
    expect(readTableIncome).not.toHaveBeenCalled();
    await setTableOpen(true);
    expect(readTableIncome).toHaveBeenCalledTimes(1);
    readTableIncome.mockClear();

    const chart = document.querySelector('.chart-canvas')!;
    await act(async () => chart.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true })));
    expect((document.querySelector('input[type="range"]') as HTMLInputElement).value).toBe(String(baseline.length - 1));
    expect(document.querySelector('.chart-inspector-card h3')?.textContent).toContain(String(baseline.at(-1)!.year));
    await act(async () => chart.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true })));
    expect((document.querySelector('input[type="range"]') as HTMLInputElement).value).toBe('0');
    expect(readTableIncome).not.toHaveBeenCalled();
  });

  it('refreshes open table values and comparison columns when projection inputs change', async () => {
    await act(async () => root.render(createElement(ProjectionChart, { baseline, dollarView: 'real' })));
    await setTableOpen(true);
    const comparison = baseline.map((row) => ({ ...row, netWorth: row.netWorth + 2500 }));
    await act(async () => root.render(createElement(ProjectionChart, {
      baseline,
      comparison,
      comparisonLabel: 'Changed plan',
      dollarView: 'nominal',
    })));
    const table = document.querySelector('table')!;
    const row = table.querySelectorAll('tbody tr')[1];
    expect(table.querySelector('caption')?.textContent).toContain('nominal dollars');
    expect(table.querySelector('thead')?.textContent).toContain('Changed plan net worth');
    expect(row.children[7].textContent).toBe(formatCad(baseline[1].netWorth));
    expect(row.children[8].textContent).toBe(formatCad(comparison[1].netWorth));
    expect(row.children[9].textContent).toBe(formatCadDelta(2500));

    await act(async () => root.render(createElement(ProjectionChart, { baseline, dollarView: 'real' })));
    expect(table.querySelector('thead')?.textContent).not.toContain('Changed plan');
    expect(table.querySelectorAll('thead th')).toHaveLength(8);
    expect(table.querySelectorAll('tbody tr')[1].lastElementChild?.textContent).toBe(formatCad(baseline[1].realNetWorth));
  });
});
