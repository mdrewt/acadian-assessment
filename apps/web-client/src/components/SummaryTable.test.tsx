import type { ReturnsByTicker } from '@acadian/sdk'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { SummaryTable } from './SummaryTable'

const DATA: ReturnsByTicker = {
  AAPL: [
    { date: '2024-01-02', return: 0.1 },
    { date: '2024-01-03', return: -0.1 },
  ],
  MSFT: [{ date: '2024-01-02', return: 0.02 }],
  // GOOGL/AMZN/NVDA/META/TSLA intentionally omitted -> "no data" rows.
}

describe('SummaryTable', () => {
  it('renders one row per MAG7 ticker plus a header row', () => {
    render(<SummaryTable data={DATA} />)
    // 1 header row + 7 ticker rows.
    expect(screen.getAllByRole('row')).toHaveLength(8)
  })

  it('shows computed min/max for a ticker with data', () => {
    render(<SummaryTable data={DATA} />)
    const aapl = screen.getByRole('row', { name: /AAPL/ })
    expect(within(aapl).getByText('+10.00%')).toBeInTheDocument()
    expect(within(aapl).getByText('-10.00%')).toBeInTheDocument()
  })

  it('marks tickers without data', () => {
    render(<SummaryTable data={DATA} />)
    expect(screen.getAllByText('No data for this range').length).toBeGreaterThan(0)
  })

  it('sorts by a numeric column when its header is clicked', async () => {
    const user = userEvent.setup()
    render(<SummaryTable data={DATA} />)

    await user.click(screen.getByRole('button', { name: /Total/ }))

    // First click sorts descending: MSFT (+2%) ranks above AAPL (-1% compounded),
    // and the no-data tickers sink to the bottom.
    const bodyRows = screen.getAllByRole('row').slice(1)
    expect(within(bodyRows[0]).getByText('MSFT')).toBeInTheDocument()
    expect(within(bodyRows[1]).getByText('AAPL')).toBeInTheDocument()
  })
})
