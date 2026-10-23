// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const text = (id: string) => document.getElementById(id)?.textContent || '';
const libraryScripts = () => Array.from(document.querySelectorAll<HTMLScriptElement>('script[data-cash-flow-library]'));
type VisibilityCallback = (entries: { isIntersecting: boolean }[]) => void;
type ChartData = { nodes: unknown[]; links: unknown[] };

function loadCashFlow(narrow = true) {
  document.body.innerHTML = new DOMParser().parseFromString(read('cash-flow.html'), 'text/html').body.innerHTML;
  let onVisibility: VisibilityCallback | undefined;
  const runtimeWindow = {
    localStorage: window.localStorage,
    location: window.location,
    setTimeout,
    clearTimeout,
    addEventListener: () => {},
    matchMedia: () => ({ matches: narrow }),
    requestAnimationFrame: (callback: () => void) => callback(),
    IntersectionObserver: class {
      constructor(callback: VisibilityCallback) { onVisibility = callback; }
      observe() {}
    },
    d3: undefined as Record<string, unknown> | undefined,
  };
  runInNewContext(read('cash-flow.js'), { document, window: runtimeWindow, URLSearchParams, CSS: { escape: (value: string) => value } });
  return {
    runtimeWindow,
    setVisible: (visible: boolean) => onVisibility?.([{ isIntersecting: visible }]),
    setOpen: (open: boolean) => {
      const details = document.getElementById('cashFlowMap') as HTMLDetailsElement;
      details.open = open;
      details.dispatchEvent(new Event('toggle'));
    },
  };
}

function setAmount(value: string) {
  const input = document.getElementById('income-amount-0') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

const settle = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  window.localStorage.clear();
  libraryScripts().forEach((script) => script.remove());
  document.body.innerHTML = '';
});

describe('cash-flow chart demand loading', () => {
  it('keeps phone totals and values usable without chart requests, even after scrolling or editing', () => {
    const page = loadCashFlow();
    page.setVisible(true);
    expect(libraryScripts()).toHaveLength(0);
    expect(text('summaryIncome')).toBe('$5,000');
    setAmount('7000');
    expect(text('summaryIncome')).toBe('$7,500');
    expect(text('cashFlowDataRows')).toContain('$7,000');
    expect(text('sankeyDescription')).toContain('$7,500');
    expect(libraryScripts()).toHaveLength(0);
  });

  it('waits until the expanded desktop map approaches the viewport', () => {
    const page = loadCashFlow(false);
    expect(libraryScripts()).toHaveLength(0);
    page.setVisible(true);
    expect(libraryScripts()).toHaveLength(1);
    expect(libraryScripts()[0].src).toContain('d3@7.9.0');
    expect(document.getElementById('chartLoading')?.hidden).toBe(false);
    expect(document.getElementById('sankeyFrame')?.getAttribute('aria-busy')).toBe('true');
  });

  it('reports a failed request, keeps inputs working, and provides a retry without duplicate loads', async () => {
    const page = loadCashFlow();
    page.setOpen(true);
    const first = libraryScripts()[0];
    page.setVisible(true);
    setAmount('6000');
    expect(libraryScripts()).toHaveLength(1);
    first.dispatchEvent(new Event('error'));
    await settle();
    expect(document.getElementById('chartError')?.hidden).toBe(false);
    expect(document.getElementById('chartLoading')?.hidden).toBe(true);
    expect(text('summaryIncome')).toBe('$6,500');
    expect(libraryScripts()).toHaveLength(0);
    document.getElementById('retryChart')?.click();
    expect(libraryScripts()).toHaveLength(1);
    expect(document.activeElement).toBe(document.querySelector('#cashFlowMap summary'));
    expect(document.getElementById('chartError')?.hidden).toBe(true);
  });

  it('recovers from a stalled request instead of leaving an endless loading state', async () => {
    const page = loadCashFlow();
    page.setOpen(true);
    await vi.advanceTimersByTimeAsync(15000);
    expect(document.getElementById('chartError')?.hidden).toBe(false);
    expect(document.getElementById('sankeyFrame')?.getAttribute('aria-busy')).toBe('false');
    expect(libraryScripts()).toHaveLength(0);
    setAmount('5500');
    expect(text('summaryIncome')).toBe('$6,000');
  });

  it('loads libraries in order and renders current values only while the map is open and visible', async () => {
    const page = loadCashFlow();
    const selection: Record<string, unknown> = {};
    ['selectAll', 'remove', 'attr', 'append', 'data', 'join', 'text'].forEach((method) => { selection[method] = () => selection; });
    const select = vi.fn<() => typeof selection>(() => selection);
    const layout = vi.fn<(data: ChartData) => ChartData>((data) => data);
    const sankey = Object.assign(layout, Object.fromEntries(['nodeId', 'nodeAlign', 'nodeWidth', 'nodePadding', 'nodeSort', 'extent'].map((method) => [method, () => sankey])));
    page.setOpen(true);
    page.setVisible(true);
    page.runtimeWindow.d3 = { select };
    libraryScripts()[0].dispatchEvent(new Event('load'));
    await settle();
    expect(libraryScripts()).toHaveLength(2);
    expect(libraryScripts()[1].src).toContain('d3-sankey@0.12.3');
    setAmount('8000');
    page.setOpen(false);
    Object.assign(page.runtimeWindow.d3, { sankey: () => sankey, sankeyJustify: () => {}, sankeyLinkHorizontal: () => {} });
    libraryScripts()[1].dispatchEvent(new Event('load'));
    await settle();
    expect(select).not.toHaveBeenCalled();
    page.setOpen(true);
    expect(select).toHaveBeenCalledTimes(1);
    expect(layout.mock.calls[0][0].nodes).toContainEqual(expect.objectContaining({ name: 'Take-home pay', amount: 8000 }));
    page.setVisible(false);
    setAmount('9000');
    expect(select).toHaveBeenCalledTimes(1);
    expect(text('summaryIncome')).toBe('$9,500');
    page.setVisible(true);
    expect(select).toHaveBeenCalledTimes(2);
    expect(layout.mock.calls[1][0].nodes).toContainEqual(expect.objectContaining({ name: 'Take-home pay', amount: 9000 }));
  });
});
