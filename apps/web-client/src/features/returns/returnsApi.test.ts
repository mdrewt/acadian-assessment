import { configureStore } from '@reduxjs/toolkit'
import type { BaseQueryApi } from '@reduxjs/toolkit/query'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

// Mock the generated SDK so the base query can be exercised without a server.
vi.mock('@acadian/sdk', () => ({ getReturns: vi.fn() }))

import { getReturns } from '@acadian/sdk'

import { returnsApi, sdkBaseQuery } from './returnsApi'

const mockedGetReturns = getReturns as unknown as Mock
const RANGE = { start: '2024-01-01', end: '2024-01-31' }

/** A minimal BaseQueryApi — the base query only reads `signal`. */
const fakeApi = { signal: new AbortController().signal } as unknown as BaseQueryApi

describe('sdkBaseQuery', () => {
  beforeEach(() => {
    mockedGetReturns.mockReset()
  })

  it('passes the date range to the SDK and returns its data', async () => {
    const payload = { AAPL: [{ date: '2024-01-02', return: 0.01 }] }
    mockedGetReturns.mockResolvedValue({ data: payload, error: undefined })

    const result = await sdkBaseQuery(RANGE, fakeApi, undefined)

    expect(result).toEqual({ data: payload })
    expect(mockedGetReturns).toHaveBeenCalledWith(
      expect.objectContaining({ query: RANGE, throwOnError: false }),
    )
  })

  it('maps a server error envelope to a message and status', async () => {
    mockedGetReturns.mockResolvedValue({
      data: undefined,
      error: { detail: '`start` must be on or before `end`.' },
      response: { status: 400 },
    })

    const result = await sdkBaseQuery(RANGE, fakeApi, undefined)

    expect(result.error).toMatchObject({
      status: 400,
      message: '`start` must be on or before `end`.',
    })
  })

  it('flattens FastAPI 422 validation detail arrays', async () => {
    mockedGetReturns.mockResolvedValue({
      data: undefined,
      error: { detail: [{ msg: 'invalid date', loc: ['query', 'start'] }] },
      response: { status: 422 },
    })

    const result = await sdkBaseQuery(RANGE, fakeApi, undefined)

    expect(result.error).toMatchObject({ status: 422, message: 'invalid date' })
  })

  it('reports a friendly message when the request rejects', async () => {
    mockedGetReturns.mockRejectedValue(new Error('network down'))

    const result = await sdkBaseQuery(RANGE, fakeApi, undefined)

    expect(result.error?.message).toMatch(/Unable to reach the API/)
  })
})

describe('returnsApi (through the store)', () => {
  beforeEach(() => {
    mockedGetReturns.mockReset()
  })

  it('resolves the getReturns query with SDK data', async () => {
    const payload = { MSFT: [{ date: '2024-01-02', return: -0.02 }] }
    mockedGetReturns.mockResolvedValue({ data: payload, error: undefined })

    const store = configureStore({
      reducer: { [returnsApi.reducerPath]: returnsApi.reducer },
      middleware: (getDefault) => getDefault().concat(returnsApi.middleware),
    })
    const result = await store.dispatch(returnsApi.endpoints.getReturns.initiate(RANGE))

    expect(result.data).toEqual(payload)
  })
})
