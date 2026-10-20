// @vitest-environment jsdom
import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FieldValidationScope, NumberField, validateNumberFields } from '../planner-app/src/components/FormFields';

const changed = vi.fn<(value: number | undefined) => void>();
const validity = vi.fn<(valid: boolean) => void>();
function input() { return document.getElementById('test-number') as HTMLInputElement; }
function Harness({ required = true }: { required?: boolean }) {
  const [value, setValue] = useState<number | undefined>(1234);
  return createElement(FieldValidationScope, { onValidityChange: validity },
    createElement(NumberField, {
      id: 'test-number', label: 'Test amount', value, required, min: 0, max: 5000,
      onChange: (next) => { changed(next); setValue(next); },
    }),
  );
}

describe('numeric draft validity', () => {
  let root: Root;
  const reactGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean };
  async function enter(value: string) {
    await act(async () => {
      input().focus();
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input(), value);
      input().dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
  beforeEach(() => {
    reactGlobal.IS_REACT_ACT_ENVIRONMENT = true;
    document.body.innerHTML = '<div id="root"></div>';
    root = createRoot(document.getElementById('root')!);
    changed.mockClear();
    validity.mockClear();
  });
  afterEach(() => {
    act(() => root.unmount());
    reactGlobal.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it.each([true, false])('invalidates a formerly valid %s-required field until corrected', async (required) => {
    await act(async () => root.render(createElement(Harness, { required })));
    await enter('abc');
    await act(async () => input().blur());
    expect(Number.isNaN(changed.mock.lastCall?.[0])).toBe(true);
    expect(input().value).toBe('abc');
    expect(input().validity.valid).toBe(false);
    expect(validateNumberFields()).toBe(false);
    expect(document.activeElement).toBe(input());
    expect(validity).toHaveBeenLastCalledWith(false);
    await enter('2500');
    await act(async () => input().blur());
    expect(changed).toHaveBeenLastCalledWith(2500);
    expect(validateNumberFields()).toBe(true);
    expect(validity).toHaveBeenLastCalledWith(true);
  });

  it('allows an intentionally empty optional field, but rejects an out-of-range value', async () => {
    await act(async () => root.render(createElement(Harness, { required: false })));
    await enter('');
    expect(changed).toHaveBeenLastCalledWith(undefined);
    expect(validateNumberFields()).toBe(true);
    await enter('6000');
    expect(validateNumberFields()).toBe(false);
    expect(input().validationMessage).toBe('Enter 5,000 or less.');
  });
});
