import { describe, expect, it } from 'vitest';
import {
  formatCadDelta,
  formatCadInput,
  formatCadMetric,
  formatPercent,
} from '../planner-app/src/lib/formatters';

describe('Canadian planner formatters', () => {
  it('preserves cents for editable currency values without padding whole dollars', () => {
    expect(formatCadInput(1_234.56)).toBe('$1,234.56');
    expect(formatCadInput(1_234)).toBe('$1,234');
    expect(formatCadInput(1_234.567, 1)).toBe('$1,234.6');
  });

  it('pairs compact dashboard values with exact whole-dollar context', () => {
    expect(formatCadMetric(987_654)).toEqual({
      display: '$987.7K',
      precise: '$987,654',
      isCompact: true,
    });
    expect(formatCadMetric(12_345)).toEqual({
      display: '$12,345',
      precise: '$12,345',
      isCompact: false,
    });
  });

  it('makes scenario differences and percentages unambiguous', () => {
    expect(formatCadDelta(250)).toBe('+$250');
    expect(formatCadDelta(-250)).toBe('-$250');
    expect(formatPercent(4.25, 2)).toBe('4.25%');
  });
});
