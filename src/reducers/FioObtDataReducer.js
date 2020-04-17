// @flow

import { type Reducer } from 'redux'

import type { Action } from '../types/reduxTypes.js'
import type { FioObtRecord } from '../types/types'

export type FioObtDataState = {
  obtRecords: FioObtRecord[]
}

const initialState: FioObtDataState = {
  obtRecords: []
}

export const fioObtData: Reducer<FioObtDataState, Action> = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'FIO/SET_OBT_DATA':
      if (!action.data) throw new Error('Invalid action SET_OBT_DATA')
      return {
        ...state,
        obtRecords: action.data
      }
    default:
      return state
  }
}
