/**
 * The MAG7 universe with display names and chart colours.
 *
 * Order matches the backend's response ordering. Colours are chosen to be
 * distinguishable in both light and dark themes.
 */
export interface TickerMeta {
  symbol: string
  name: string
  color: string
}

export const TICKERS: readonly TickerMeta[] = [
  { symbol: 'AAPL', name: 'Apple', color: '#3b82f6' },
  { symbol: 'MSFT', name: 'Microsoft', color: '#06b6d4' },
  { symbol: 'GOOGL', name: 'Alphabet', color: '#8b5cf6' },
  { symbol: 'AMZN', name: 'Amazon', color: '#f59e0b' },
  { symbol: 'NVDA', name: 'NVIDIA', color: '#22c55e' },
  { symbol: 'META', name: 'Meta', color: '#ec4899' },
  { symbol: 'TSLA', name: 'Tesla', color: '#ef4444' },
] as const
