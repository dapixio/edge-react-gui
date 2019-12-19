// @flow
import type { EdgeCurrencyWallet } from 'edge-core-js'

export const changeFioAddressName = (fioAddressName: string) => ({
  type: 'FIO/FIO_ADDRESS_UPDATE_FIO_ADDRESS_NAME',
  data: { fioAddressName }
})

export const changeConfirmSelectedWallet = (selectedWallet: EdgeCurrencyWallet | null, expiration: Date, fee_collected: number) => ({
  type: 'FIO/FIO_ADDRESS_UPDATE_SELECTED_WALLET',
  data: { selectedWallet, expiration, fee_collected }
})

export const setFioAddress = (fioAddressName: string, expiration: string) => ({
  type: 'FIO/FIO_ADDRESS_SET_FIO_ADDRESS',
  data: { fioAddressName, expiration }
})
