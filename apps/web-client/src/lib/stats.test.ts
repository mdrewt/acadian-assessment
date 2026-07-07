import type { ReturnPoint } from '@acadian/sdk'
import { describe, expect, it } from 'vitest'

import { computeSummary } from './stats'

function points(...returns: number[]): ReturnPoint[] {
  return returns.map((value, index) => ({
    date: `2024-01-${String(index + 1).padStart(2, '0')}`,
    return: value,
  }))
}

describe('computeSummary', () => {
  it('returns null for an empty series', () => {
    expect(computeSummary([])).toBeNull()
  })

  it('computes min, max, and arithmetic mean', () => {
    const summary = computeSummary(points(0.01, -0.02, 0.03))
    expect(summary).not.toBeNull()
    expect(summary!.min).toBeCloseTo(-0.02)
    expect(summary!.max).toBeCloseTo(0.03)
    expect(summary!.mean).toBeCloseTo(0.02 / 3)
    expect(summary!.count).toBe(3)
  })

  it('compounds the cumulative return, not just sums it', () => {
    // +50% then -50% compounds to -25%, whereas summing would give 0%.
    const summary = computeSummary(points(0.5, -0.5))
    expect(summary!.cumulative).toBeCloseTo(-0.25)
  })

  it('uses the sample (n-1) standard deviation for volatility', () => {
    // returns [0.0, 0.02]: mean 0.01, variance = (0.01^2 + 0.01^2)/(2-1) = 0.0002
    const summary = computeSummary(points(0, 0.02))
    expect(summary!.volatility).toBeCloseTo(Math.sqrt(0.0002))
  })

  it('reports zero volatility for a single observation', () => {
    const summary = computeSummary(points(0.05))
    expect(summary!.volatility).toBe(0)
    expect(summary!.min).toBeCloseTo(0.05)
    expect(summary!.max).toBeCloseTo(0.05)
    expect(summary!.cumulative).toBeCloseTo(0.05)
  })
})
