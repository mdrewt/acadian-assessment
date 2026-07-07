import type { ReturnsByTicker } from '@acadian/sdk'

import { TICKERS } from '../constants'
import { TickerCard } from './TickerCard'

interface TickerGridProps {
  data: ReturnsByTicker
}

export function TickerGrid({ data }: TickerGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {TICKERS.map((meta) => (
        <TickerCard key={meta.symbol} meta={meta} points={data[meta.symbol] ?? []} />
      ))}
    </div>
  )
}
