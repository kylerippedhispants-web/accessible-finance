const cadWhole = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
});

const cadCompact = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
});

const cadDelta = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
  signDisplay: 'exceptZero',
});

const integer = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 0 });
const cadInputFormatters = new Map<number, Intl.NumberFormat>();

function finite(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

/** Formats a whole-dollar Canadian amount for precise supporting context. */
export function formatCad(value: number): string {
  return cadWhole.format(finite(value));
}

/**
 * Formats a Canadian-dollar value for editable fields while preserving cents.
 * The caller controls the maximum precision; whole values are not padded.
 */
export function formatCadInput(value: number, maximumFractionDigits = 2): string {
  const digits = Math.min(20, Math.max(0, Math.trunc(maximumFractionDigits)));
  let formatter = cadInputFormatters.get(digits);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    });
    cadInputFormatters.set(digits, formatter);
  }
  return formatter.format(finite(value));
}

/** Formats a Canadian amount for dense, high-level displays such as chart axes. */
export function formatCadCompact(value: number): string {
  return cadCompact.format(finite(value));
}

/** Formats a signed Canadian-dollar difference, including a plus sign when positive. */
export function formatCadDelta(value: number): string {
  return cadDelta.format(finite(value));
}

/** Returns the calm headline value and exact value used by summary metrics. */
export function formatCadMetric(value: number): {
  display: string;
  precise: string;
  isCompact: boolean;
} {
  const normalized = finite(value);
  const isCompact = Math.abs(normalized) >= 100_000;
  return {
    display: isCompact ? formatCadCompact(normalized) : formatCad(normalized),
    precise: formatCad(normalized),
    isCompact,
  };
}

export function formatPercent(value: number, maximumFractionDigits = 1): string {
  return `${finite(value).toLocaleString('en-CA', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  })}%`;
}

export function formatInteger(value: number): string {
  return integer.format(finite(value));
}
