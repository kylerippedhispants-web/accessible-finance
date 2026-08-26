import {
  useId,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { formatCadInput, formatPercent } from '../lib/formatters';

interface FieldShellProps {
  inputId: string;
  label: string;
  hint?: string;
  hintId?: string;
  error?: string;
  errorId?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function FieldShell({
  inputId,
  label,
  hint,
  hintId,
  error,
  errorId,
  required,
  className,
  children,
}: FieldShellProps) {
  return (
    <div className={`field${error ? ' field-error' : ''}${className ? ` ${className}` : ''}`}>
      <label className="field-label" htmlFor={inputId}>
        {label}{required && <span className="field-required"> (required)</span>}
      </label>
      {children}
      {hint && <span className="field-hint" id={hintId}>{hint}</span>}
      {error && <span className="field-message" id={errorId} role="alert">{error}</span>}
    </div>
  );
}

function useFieldIds(
  requestedId: string | undefined,
  hint: string | undefined,
  error: string | undefined,
  describedBy: string | undefined,
) {
  const generatedId = useId();
  const inputId = requestedId ?? `field-${generatedId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const descriptionIds = [describedBy, hintId, errorId].filter(Boolean).join(' ') || undefined;
  return { inputId, hintId, errorId, descriptionIds };
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  hint?: string;
  error?: string;
  onChange: (value: string) => void;
}

export function TextField({ label, hint, error, onChange, id, required, onBlur, ...props }: TextFieldProps) {
  const [entryError, setEntryError] = useState<string>();
  const effectiveError = error ?? entryError;
  const ids = useFieldIds(id, hint, effectiveError, props['aria-describedby']);
  return (
    <FieldShell {...ids} label={label} hint={hint} error={effectiveError} required={required}>
      <input
        {...props}
        id={ids.inputId}
        required={required}
        aria-describedby={ids.descriptionIds}
        aria-invalid={effectiveError ? true : undefined}
        onChange={(event) => {
          setEntryError(undefined);
          onChange(event.target.value);
        }}
        onBlur={(event) => {
          setEntryError(required && !event.currentTarget.value.trim() ? 'Enter a value.' : undefined);
          onBlur?.(event);
        }}
      />
    </FieldShell>
  );
}

type NumberDisplay = 'number' | 'currency' | 'percent';

interface NumberFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'value'> {
  label: string;
  hint?: string;
  error?: string;
  value: number | null | undefined;
  onChange: (value: number | undefined) => void;
  prefix?: string;
  suffix?: string;
  display?: NumberDisplay;
  maximumFractionDigits?: number;
}

function decimalPlaces(step: string | number | undefined): number {
  if (step === undefined || step === 'any') return 2;
  const text = String(step);
  const decimal = text.indexOf('.');
  return decimal < 0 ? 0 : Math.min(8, text.length - decimal - 1);
}

function formatForDisplay(
  value: number | null | undefined,
  display: NumberDisplay,
  maximumFractionDigits: number,
): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return '';
  if (display === 'currency') return formatCadInput(value, maximumFractionDigits);
  if (display === 'percent') return formatPercent(value, maximumFractionDigits);
  return String(value);
}

export function parseNumberEntry(raw: string): number | undefined {
  const normalized = raw
    .trim()
    .replace(/[$%]/g, '')
    .replace(/[\s,\u00a0\u202f]/g, '');
  if (!normalized || normalized === '-' || normalized === '.' || normalized === '-.') return undefined;
  if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function NumberField({
  label,
  hint,
  error,
  value,
  onChange,
  prefix,
  suffix,
  display = 'number',
  maximumFractionDigits,
  id,
  min,
  max,
  step,
  required,
  inputMode,
  onFocus,
  onBlur,
  onKeyDown,
  ...props
}: NumberFieldProps) {
  const fractionDigits = maximumFractionDigits ?? decimalPlaces(step);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => value === undefined || value === null ? '' : String(value));
  const [entryError, setEntryError] = useState<string>();
  const effectiveError = error ?? entryError;
  const ids = useFieldIds(id, hint, effectiveError, props['aria-describedby']);
  const displayedValue = editing || entryError
    ? draft
    : formatForDisplay(value, display, fractionDigits);

  const updateDraft = (event: ChangeEvent<HTMLInputElement>) => {
    const nextText = event.target.value;
    setDraft(nextText);
    setEntryError(undefined);
    if (!nextText.trim()) {
      onChange(undefined);
      return;
    }
    const parsed = parseNumberEntry(nextText);
    if (parsed !== undefined) {
      onChange(parsed);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const increment = step === 'any' ? 1 : Number(step ?? 1);
      const direction = event.key === 'ArrowUp' ? 1 : -1;
      const minimum = min === undefined ? -Infinity : Number(min);
      const maximum = max === undefined ? Infinity : Number(max);
      const current = parseNumberEntry(draft) ?? value ?? 0;
      const next = Math.min(maximum, Math.max(minimum, current + (Number.isFinite(increment) ? increment : 1) * direction));
      setDraft(String(next));
      onChange(next);
    }
    onKeyDown?.(event);
  };

  const numericValue = parseNumberEntry(displayedValue) ?? value ?? undefined;
  const affixed = Boolean(prefix || suffix);
  const input = (
    <input
      {...props}
      id={ids.inputId}
      type="text"
      role="spinbutton"
      inputMode={inputMode ?? (decimalPlaces(step) === 0 && Number(min ?? 0) >= 0 ? 'numeric' : 'decimal')}
      required={required}
      value={displayedValue}
      aria-describedby={ids.descriptionIds}
      aria-invalid={effectiveError ? true : undefined}
      aria-valuemin={min === undefined ? undefined : Number(min)}
      aria-valuemax={max === undefined ? undefined : Number(max)}
      aria-valuenow={numericValue}
      onChange={updateDraft}
      onKeyDown={handleKeyDown}
      onFocus={(event) => {
        setEditing(true);
        if (entryError) {
          const parsedDraft = parseNumberEntry(draft);
          setDraft(parsedDraft === undefined ? draft : String(parsedDraft));
        } else {
          setDraft(value === undefined || value === null ? '' : String(value));
        }
        onFocus?.(event);
      }}
      onBlur={(event) => {
        const parsed = parseNumberEntry(event.currentTarget.value);
        const empty = !event.currentTarget.value.trim();
        const minimum = min === undefined ? undefined : Number(min);
        const maximum = max === undefined ? undefined : Number(max);
        if (empty) {
          onChange(undefined);
          setEntryError(required ? 'Enter a value.' : undefined);
        } else if (parsed === undefined) {
          setEntryError('Enter a valid number.');
        } else if (minimum !== undefined && parsed < minimum) {
          setEntryError(`Enter ${minimum.toLocaleString('en-CA')} or more.`);
        } else if (maximum !== undefined && parsed > maximum) {
          setEntryError(`Enter ${maximum.toLocaleString('en-CA')} or less.`);
        } else {
          setEntryError(undefined);
          onChange(parsed);
        }
        setEditing(false);
        onBlur?.(event);
      }}
    />
  );

  return (
    <FieldShell
      {...ids}
      label={label}
      hint={hint}
      error={effectiveError}
      required={required}
      className={display === 'number' ? undefined : 'formatted-number-field'}
    >
      {affixed ? (
        <span className="input-affix">
          {prefix && <span aria-hidden="true">{prefix}</span>}
          {input}
          {suffix && <span aria-hidden="true">{suffix}</span>}
        </span>
      ) : input}
    </FieldShell>
  );
}

type FormattedNumberFieldProps = Omit<NumberFieldProps, 'display' | 'prefix' | 'suffix'>;

export function MoneyField(props: FormattedNumberFieldProps) {
  return <NumberField {...props} display="currency" />;
}

export function PercentField(props: FormattedNumberFieldProps) {
  return <NumberField {...props} display="percent" />;
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  hint?: string;
  error?: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function SelectField({ label, hint, error, options, onChange, id, required, ...props }: SelectFieldProps) {
  const ids = useFieldIds(id, hint, error, props['aria-describedby']);
  return (
    <FieldShell {...ids} label={label} hint={hint} error={error} required={required}>
      <select
        {...props}
        id={ids.inputId}
        required={required}
        aria-describedby={ids.descriptionIds}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </FieldShell>
  );
}

interface ToggleFieldProps {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleField({ label, hint, checked, disabled, onChange }: ToggleFieldProps) {
  const generatedId = useId();
  const inputId = `toggle-${generatedId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  return (
    <label className="toggle-field" htmlFor={inputId}>
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-describedby={hintId}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="toggle" aria-hidden="true"><span /></span>
      <span><strong>{label}</strong>{hint && <small id={hintId}>{hint}</small>}</span>
    </label>
  );
}
