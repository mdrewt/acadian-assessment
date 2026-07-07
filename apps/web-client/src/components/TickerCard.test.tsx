import type { ReturnPoint } from '@acadian/sdk'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { TickerMeta } from '../constants'
import { TickerCard } from './TickerCard'

const META: TickerMeta = { symbol: 'AAPL', name: 'Apple', color: '#3b82f6' }
const POINTS: ReturnPoint[] = [
  { date: '2024-01-02', return: 0.01 },
  { date: '2024-01-03', return: -0.02 },
  { date: '2024-01-04', return: 0.015 },
]

describe('TickerCard', () => {
  it('renders the ticker header, min/max/mean stats, and mounts the chart', () => {
    render(<TickerCard meta={META} points={POINTS} />)

    expect(screen.getByRole('heading', { name: 'AAPL' })).toBeInTheDocument()
    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.getByText('Min')).toBeInTheDocument()
    expect(screen.getByText('Mean')).toBeInTheDocument()
    expect(screen.getByText('Max')).toBeInTheDocument()
    expect(screen.getByText('-2.00%')).toBeInTheDocument()
    expect(screen.getByText('+1.50%')).toBeInTheDocument()
  })

  it('shows an empty state when there is no data', () => {
    render(<TickerCard meta={META} points={[]} />)
    expect(screen.getByText(/No return data/i)).toBeInTheDocument()
  })
})
