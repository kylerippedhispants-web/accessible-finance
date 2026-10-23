// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { afterEach, describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

function loadPage(htmlPath: string, scriptPath: string) {
  const parsed = new DOMParser().parseFromString(read(htmlPath), 'text/html');
  document.body.innerHTML = parsed.body.innerHTML;
  runInNewContext(read(scriptPath), {
    document,
    window: {
      localStorage: window.localStorage,
      location: window.location,
      setTimeout,
      clearTimeout,
      addEventListener: () => {},
      matchMedia: () => ({ matches: false }),
      IntersectionObserver: class { observe() {} },
      requestAnimationFrame: (callback: () => void) => callback(),
    },
    URLSearchParams,
    CSS: { escape: (value: string) => value },
  });
}

function setField(id: string, value: string) {
  const input = document.getElementById(id) as HTMLInputElement | HTMLSelectElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

const text = (id: string) => document.getElementById(id)?.textContent || '';
const dollars = (id: string) => Number(text(id).replace(/[^0-9.-]/g, ''));
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.round(value));

afterEach(() => {
  window.localStorage.clear();
  document.body.innerHTML = '';
});

describe('verified US state tax estimates', () => {
  it.each(['single', 'marriedJoint', 'headOfHousehold', 'marriedSeparate'])('applies Ohio’s statutory base above the threshold for %s', (status) => {
    loadPage('us/tax-calculator.html', 'us/tax-calculator.js');
    setField('filingStatus', status);
    setField('state', 'OH');
    setField('stateTaxableOverride', '26050');
    expect(text('stateTax')).toBe('$0');
    setField('stateTaxableOverride', '26051');
    expect(text('stateTax')).toBe('$332');
    expect(text('stateBracketRows')).toContain('Statutory base');
    setField('stateTaxableOverride', '75000');
    expect(text('stateTax')).toBe(money(1678.125));
    expect(text('stateMethodNote')).toContain('nonbusiness income only');
  });

  it.each(['single', 'marriedJoint', 'headOfHousehold', 'marriedSeparate'])('uses Rhode Island’s uniform schedule for %s without multiplying widths', (status) => {
    loadPage('us/tax-calculator.html', 'us/tax-calculator.js');
    setField('filingStatus', status);
    setField('state', 'RI');
    for (const [income, expected] of [[82050, 3076.875], [82051, 3076.9225], [150000, 6304.5], [186450, 8035.875], [186451, 8035.9349]]) {
      setField('stateTaxableOverride', String(income));
      expect(text('stateTax')).toBe(money(expected));
    }
    expect(text('stateBreakdownLabel')).toContain('all filing statuses');
  });

  it.each([['IL', 3712.5], ['MI', 3187.5], ['NC', 2992.5]])('uses verified flat rate for %s', (state, expected) => {
    loadPage('us/tax-calculator.html', 'us/tax-calculator.js');
    setField('state', String(state));
    setField('stateTaxableOverride', '75000');
    expect(text('stateTax')).toBe(money(Number(expected)));
  });

  it('does not turn unsupported state tax into a zero or a combined total', () => {
    loadPage('us/tax-calculator.html', 'us/tax-calculator.js');
    setField('state', 'CA');
    expect(text('stateTax')).toBe('Not estimated');
    expect(text('resultStatus')).toContain('Federal only');
    expect(text('taxSummary')).toContain('California tax is not included');
    expect(text('stateBracketRows')).toContain('not $0');
    expect(dollars('totalTax')).toBe(dollars('federalTax'));
    expect(text('afterIncomeTaxLabel')).toContain('state and payroll taxes excluded');
  });

  it('distinguishes a no-income-tax state from Washington’s unmodeled gains tax', () => {
    loadPage('us/tax-calculator.html', 'us/tax-calculator.js');
    setField('state', 'FL');
    expect(text('stateTax')).toBe('$0');
    setField('state', 'WA');
    setField('longTermGains', '500000');
    expect(text('stateTax')).toBe('Not estimated');
    expect(text('stateMethodNote')).toContain('separate tax');
  });

  it('uses direct state taxable income without silently comparing incompatible scenarios', () => {
    loadPage('us/tax-calculator.html', 'us/tax-calculator.js');
    setField('state', 'IL');
    setField('stateDeductions', '40000');
    setField('stateTaxableOverride', '100000');
    expect(text('stateTax')).toBe('$4,950');
    expect((document.getElementById('stateDeductions') as HTMLInputElement).disabled).toBe(true);
    expect(text('capitalGainsTax')).toBe('Not compared*');
    expect(text('contributionSavings')).toBe('Not compared*');
    setField('stateTaxableOverride', '');
    expect((document.getElementById('stateDeductions') as HTMLInputElement).disabled).toBe(false);
    expect(text('stateTax')).toBe('$1,733');
  });
});

describe('cash-flow classifications and accessible alternative', () => {
  it('keeps savings stable when its category is renamed, persists it, and allows an explicit change', () => {
    loadPage('cash-flow.html', 'cash-flow.js');
    expect(text('savingsRate')).toBe('18%');
    setField('expenses-name-6', 'TFSA');
    expect(text('savingsRate')).toBe('18%');
    expect(text('cashFlowDataRows')).toContain('TFSASaving / investing');
    loadPage('cash-flow.html', 'cash-flow.js');
    expect(text('savingsRate')).toBe('18%');
    setField('expenses-kind-6', 'debt');
    expect(text('savingsRate')).toBe('0.0%');
    expect(text('cashFlowDataRows')).toContain('TFSADebt payment');
  });

  it('migrates old saved rows once and does not reclassify them after a name change', () => {
    window.localStorage.setItem('accessibleFinanceCashFlowV1', JSON.stringify({
      period: 'monthly', income: [{ id: 'pay', name: 'Pay', amount: 2000 }],
      expenses: [{ id: 'save', name: 'Emergency fund', amount: 200 }, { id: 'debt', name: 'Loan', amount: 100 }],
    }));
    loadPage('cash-flow.html', 'cash-flow.js');
    expect(text('savingsRate')).toBe('10%');
    setField('expenses-name-0', 'My TFSA');
    loadPage('cash-flow.html', 'cash-flow.js');
    expect(text('savingsRate')).toBe('10%');
    expect((document.getElementById('expenses-kind-1') as HTMLSelectElement).value).toBe('debt');
  });

  it('keeps chart name and description and complete values available even when chart dependencies fail', () => {
    loadPage('cash-flow.html', 'cash-flow.js');
    expect(text('sankeyTitle')).toContain('Income and expense');
    expect(text('sankeyDescription')).toContain('$5,000');
    expect(text('cashFlowDataRows')).toContain('Take-home pay');
    expect(text('cashFlowDataRows')).toContain('Unassigned surplus');
    setField('income-amount-0', '0');
    expect(text('cashFlowDataRows')).toContain('Funding shortfall');
    expect(text('sankeyDescription')).toContain('funding shortfall');
  });
});
