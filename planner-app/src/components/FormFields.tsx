import type { ChangeEvent, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function FieldShell({ label, hint, error, children }: FieldShellProps) {
  return (
    <label className={`field${error ? ' field-error' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
      {error && <span className="field-message" role="alert">{error}</span>}
    </label>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  hint?: string;
  error?: string;
  onChange: (value: string) => void;
}

export function TextField({ label, hint, error, onChange, ...props }: TextFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      <input {...props} onChange={(event) => onChange(event.target.value)} />
    </FieldShell>
  );
}

interface NumberFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string;
  hint?: string;
  error?: string;
  value: number | null | undefined;
  onChange: (value: number | undefined) => void;
  prefix?: string;
  suffix?: string;
}

export function NumberField({
  label,
  hint,
  error,
  value,
  onChange,
  prefix,
  suffix,
  ...props
}: NumberFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    onChange(nextValue === '' ? undefined : Number(nextValue));
  };

  return (
    <FieldShell label={label} hint={hint} error={error}>
      <span className="input-affix">
        {prefix && <span aria-hidden="true">{prefix}</span>}
        <input
          {...props}
          type="number"
          inputMode="decimal"
          value={value ?? ''}
          onChange={handleChange}
        />
        {suffix && <span aria-hidden="true">{suffix}</span>}
      </span>
    </FieldShell>
  );
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  hint?: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function SelectField({ label, hint, options, onChange, ...props }: SelectFieldProps) {
  return (
    <FieldShell label={label} hint={hint}>
      <select {...props} onChange={(event) => onChange(event.target.value)}>
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
  onChange: (checked: boolean) => void;
}

export function ToggleField({ label, hint, checked, onChange }: ToggleFieldProps) {
  return (
    <label className="toggle-field">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="toggle" aria-hidden="true"><span /></span>
      <span><strong>{label}</strong>{hint && <small>{hint}</small>}</span>
    </label>
  );
}
