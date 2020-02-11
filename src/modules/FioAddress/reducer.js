// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import { type Reducer } from 'redux'

import type { Action } from '../../types/reduxTypes.js'

export type FioAddressSceneState = {
  fioAddressName: string,
  fioAddresses: string[],
  selectedWallet: EdgeCurrencyWallet | null,
  expiration: Date,
  fee_collected: number,
  fioWalletByAddress: EdgeCurrencyWallet | null,
  setPubAddressesLoading: boolean,
  connectedWalletsByFioAddress: {
    [fioAddress: string]: {
      [currencyCode: string]: string
    }
  },
  getPubAddressesLoading: boolean,
  senderFioAddress: string,
  senderWallet: EdgeCurrencyWallet | null,
  senderMsgRecipient: string,
  senderFioError: string
}

const initialState: FioAddressSceneState = {
  fioAddressName: '',
  fioAddresses: [],
  selectedWallet: null,
  expiration: new Date('1/1/2019'),
  fee_collected: 0,
  fioWalletByAddress: null,
  setPubAddressesLoading: false,
  connectedWalletsByFioAddress: {},
  getPubAddressesLoading: false,
  senderFioAddress: '',
  senderWallet: null,
  senderMsgRecipient: '',
  senderFioError: ''
}

export const fioAddress: Reducer<FioAddressSceneState, Action> = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'FIO/FIO_ADDRESS_UPDATE_FIO_ADDRESS_NAME':
      if (!action.data) throw new Error('Invalid action FIO_ADDRESS_UPDATE_FIO_ADDRESS_NAME')
      return {
        ...state,
        fioAddressName: action.data.fioAddressName
      }
    case 'FIO/FIO_ADDRESS_UPDATE_SELECTED_WALLET':
      if (!action.data) throw new Error('Invalid action FIO_ADDRESS_UPDATE_FIO_ADDRESS_NAME')
      return {
        ...state,
        selectedWallet: action.data.selectedWallet,
        expiration: new Date(action.data.expiration),
        fee_collected: action.data.fee_collected
      }
    case 'FIO/FIO_ADDRESS_SET_FIO_ADDRESS':
      if (!action.data) throw new Error(`Invalid action FIO_ADDRESS_SET_FIO_ADDRESS`)
      return {
        ...state,
        fioAddressName: action.data.fioAddressName,
        expiration: new Date(action.data.expiration)
      }
    case 'FIO/FIO_WALLET_BY_ADDRESS':
      if (!action.data) throw new Error(`Invalid action FIO/FIO_WALLET_BY_ADDRESS`)
      return {
        ...state,
        fioWalletByAddress: action.data.wallet
      }
    case 'FIO/FIO_CONNECT_WALLETS_REQUEST':
      return {
        ...state,
        setPubAddressesLoading: true
      }
    case 'FIO/FIO_CONNECT_WALLETS_SUCCESS':
    case 'FIO/FIO_CONNECT_WALLETS_FAILURE':
      return {
        ...state,
        setPubAddressesLoading: false
      }
    case 'FIO/FIO_UPDATE_PUB_ADDRESSES':
      if (!action.data) throw new Error(`Invalid action FIO_UPDATE_PUB_ADDRESSES`)
      const { connectedWalletsByFioAddress } = state
      connectedWalletsByFioAddress[action.data.fioAddress] = action.data.pubAddresses
      return {
        ...state,
        connectedWalletsByFioAddress,
        getPubAddressesLoading: false
      }
    case 'FIO/FIO_UPDATE_PUB_ADDRESSES_LOADING':
      return {
        ...state,
        getPubAddressesLoading: true
      }
    case 'FIO/FIO_SET_SENDER_FIO_ADDRESS':
      if (!action.data) throw new Error(`Invalid action FIO_SET_SENDER_FIO_ADDRESS`)
      return {
        ...state,
        senderFioAddress: action.data.fioAddress,
        senderWallet: action.data.fioWallet,
        senderFioError: action.data.error
      }
    case 'FIO/FIO_SET_SENDER_MSG_TO_RECIPIENT':
      if (!action.data) throw new Error(`Invalid action FIO_SET_SENDER_MSG_TO_RECIPIENT`)
      return {
        ...state,
        senderMsgRecipient: action.data.msg
      }
    default:
      return state
  }
}
