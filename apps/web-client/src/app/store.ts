import { configureStore } from '@reduxjs/toolkit'

import { dateRangeReducer } from '../features/dateRange/dateRangeSlice'
import { returnsApi } from '../features/returns/returnsApi'

export const store = configureStore({
  reducer: {
    [returnsApi.reducerPath]: returnsApi.reducer,
    dateRange: dateRangeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(returnsApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
