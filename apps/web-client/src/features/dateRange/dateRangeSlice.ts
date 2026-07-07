import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import { isoDaysAgo, todayIso } from '../../lib/dates'

export interface DateRange {
  start: string
  end: string
}

/** Default to the trailing ~3 months so the app shows data on first load. */
const initialState: DateRange = {
  start: isoDaysAgo(90),
  end: todayIso(),
}

const dateRangeSlice = createSlice({
  name: 'dateRange',
  initialState,
  reducers: {
    setStart(state, action: PayloadAction<string>) {
      state.start = action.payload
    },
    setEnd(state, action: PayloadAction<string>) {
      state.end = action.payload
    },
    setRange(_state, action: PayloadAction<DateRange>) {
      return action.payload
    },
  },
})

export const { setStart, setEnd, setRange } = dateRangeSlice.actions
export const dateRangeReducer = dateRangeSlice.reducer
