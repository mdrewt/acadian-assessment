import { describe, expect, it } from 'vitest'

import { parseIsoDate, toIsoDate } from './dates'

describe('date helpers', () => {
  it('round-trips an ISO date without a timezone shift', () => {
    // Naive `new Date('2024-01-02')` parses as UTC midnight and can slip a day
    // in negative-offset timezones; component-wise parsing must not.
    const iso = '2024-01-02'
    expect(toIsoDate(parseIsoDate(iso))).toBe(iso)
  })

  it('formats a Date as YYYY-MM-DD with zero padding', () => {
    expect(toIsoDate(new Date(2024, 0, 5))).toBe('2024-01-05')
    expect(toIsoDate(new Date(2024, 11, 31))).toBe('2024-12-31')
  })

  it('parses an ISO date into the correct local calendar day', () => {
    const date = parseIsoDate('2024-03-09')
    expect(date.getFullYear()).toBe(2024)
    expect(date.getMonth()).toBe(2) // March (0-indexed)
    expect(date.getDate()).toBe(9)
  })
})
