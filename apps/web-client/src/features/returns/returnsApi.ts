// RTK Query API for daily returns. The base query calls the generated
// @acadian/sdk; RTK Query adds per-range caching (keyed by {start, end}),
// request de-duplication, loading/error state, and cancellation of superseded
// requests via the abort signal, so fast date changes only render the latest.
import { getReturns, type ReturnsByTicker } from '@acadian/sdk'
import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react'

import type { DateRange } from '../dateRange/dateRangeSlice'

export interface ApiError {
  /** HTTP status code, when the failure came from a server response. */
  status?: number
  /** User-facing message. */
  message: string
}

/** Pull a friendly message out of the API's error envelope (or FastAPI's 422). */
function extractMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'detail' in error) {
    const detail = (error as { detail: unknown }).detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) =>
          item && typeof item === 'object' && 'msg' in item
            ? String((item as { msg: unknown }).msg)
            : null,
        )
        .filter((msg): msg is string => msg !== null)
      if (messages.length > 0) return messages.join('; ')
    }
  }
  return 'The server returned an unexpected error.'
}

export const sdkBaseQuery: BaseQueryFn<DateRange, ReturnsByTicker, ApiError> = async (
  { start, end },
  api,
) => {
  try {
    const { data, error, response } = await getReturns({
      query: { start, end },
      signal: api.signal,
      throwOnError: false,
    })
    if (error) {
      return { error: { status: response?.status, message: extractMessage(error) } }
    }
    return { data: (data ?? {}) as ReturnsByTicker }
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') {
      // Superseded by a newer request; RTK Query discards this result.
      return { error: { message: 'Request cancelled.' } }
    }
    return {
      error: {
        message: 'Unable to reach the API. Please check that the server is running.',
      },
    }
  }
}

export const returnsApi = createApi({
  reducerPath: 'returnsApi',
  baseQuery: sdkBaseQuery,
  endpoints: (build) => ({
    getReturns: build.query<ReturnsByTicker, DateRange>({
      query: (range) => range,
    }),
  }),
})

export const { useGetReturnsQuery } = returnsApi
