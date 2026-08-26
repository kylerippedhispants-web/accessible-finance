import { describe, expect, it } from 'vitest';
import { parseNumberEntry } from '../planner-app/src/components/FormFields';

describe('formatted financial number entry', () => {
  it('parses Canadian currency and percentage display strings into numbers', () => {
    expect(parseNumberEntry('$1,234.56')).toBe(1234.56);
    expect(parseNumberEntry(' 12.5% ')).toBe(12.5);
    expect(parseNumberEntry('-0.75%')).toBe(-0.75);
    expect(parseNumberEntry('.5')).toBe(0.5);
  });

  it('keeps clear and intermediate editing states non-numeric', () => {
    expect(parseNumberEntry('')).toBeUndefined();
    expect(parseNumberEntry('-')).toBeUndefined();
    expect(parseNumberEntry('.')).toBeUndefined();
    expect(parseNumberEntry('-.')).toBeUndefined();
    expect(parseNumberEntry('12 dollars')).toBeUndefined();
  });
});
