// @flow

import { type Reducer, combineReducers } from 'redux'

import { type FioObtDataState, fioObtData } from '../../reducers/FioObtDataReducer.js'
import { type PasswordReminderState, passwordReminder } from '../../reducers/PasswordReminderReducer.js'
import { type ScenesState, scenes } from '../../reducers/scenes/ScenesReducer.js'
import { type SettingsState, settings } from '../../reducers/scenes/SettingsReducer.js'
import { type WalletsState, wallets } from '../../reducers/scenes/WalletsReducer.js'
import { type Action } from '../../types/reduxTypes.js'

export { passwordReminder, scenes, wallets, settings }

export type UiState = {
  +passwordReminder: PasswordReminderState,
  +scenes: ScenesState,
  +settings: SettingsState,
  +wallets: WalletsState,
  +fioObtData: FioObtDataState
}

const uiInner: Reducer<UiState, Action> = combineReducers({
  passwordReminder,
  scenes,
  settings,
  wallets,
  fioObtData
})

export const ui: Reducer<UiState, Action> = (state, action: Action) => {
  if (action.type === 'LOGOUT') {
    return uiInner(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })
  }

  return uiInner(state, action)
}
