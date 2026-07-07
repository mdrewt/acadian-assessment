// Summary stats for a daily-returns series: min, max, mean, volatility, and
// the compounded total return.
import type { ReturnPoint } from '@acadian/sdk'

export interface ReturnsSummary {
  /** Number of daily observations in the window. */
  count: number
  /** Smallest single-day return. */
  min: number
  /** Largest single-day return. */
  max: number
  /** Arithmetic mean of the daily returns. */
  mean: number
  /** Sample standard deviation of daily returns (volatility). */
  volatility: number
  /** Compounded total return over the window: prod(1 + r) - 1. */
  cumulative: number
}

// Returns null for an empty series. Volatility is the sample standard
// deviation (n - 1 denominator), and 0 when there's only one observation.
export function computeSummary(points: readonly ReturnPoint[]): ReturnsSummary | null {
  if (points.length === 0) return null

  const values = points.map((point) => point.return)
  const count = values.length

  let min = values[0]
  let max = values[0]
  let sum = 0
  let compound = 1
  for (const value of values) {
    if (value < min) min = value
    if (value > max) max = value
    sum += value
    compound *= 1 + value
  }
  const mean = sum / count

  let squaredError = 0
  for (const value of values) {
    squaredError += (value - mean) ** 2
  }
  const volatility = count > 1 ? Math.sqrt(squaredError / (count - 1)) : 0

  return { count, min, max, mean, volatility, cumulative: compound - 1 }
}
