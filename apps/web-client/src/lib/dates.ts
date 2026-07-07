/**
 * Date helpers working in `YYYY-MM-DD` local-calendar strings — the format the
 * API expects and returns. Parsing is done component-wise so a date is never
 * shifted across a timezone boundary (as `new Date('2024-01-02')` would).
 */

export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayIso(): string {
  return toIsoDate(new Date())
}

export function isoDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return toIsoDate(date)
}

export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** e.g. "Jan 2, 2024" — used for axis ticks and tooltips. */
export function formatDisplayDate(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** e.g. "Jan 2" — a compact form for dense chart axes. */
export function formatShortDate(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}
