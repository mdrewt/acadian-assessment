/** Formatting helpers for percentage returns. */

/** Fraction to percentage string, e.g. 0.0123 -> "1.23%". */
export function formatPercent(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)}%`
}

/** Like {@link formatPercent} but always shows a leading sign, e.g. "+1.23%". */
export function formatSignedPercent(value: number, digits = 2): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${(value * 100).toFixed(digits)}%`
}
