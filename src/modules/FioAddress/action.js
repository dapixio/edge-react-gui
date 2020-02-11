// @flow
import type { EdgeCurrencyWallet } from 'edge-core-js'

import type { Dispatch, GetState } from '../../types/reduxTypes.js'
import { getFioWallets } from '../UI/selectors'

export const setFioWalletByFioAddress = (fioAddressToUse: string) => async (dispatch: Dispatch, getState: GetState) => {
  const wallets: EdgeCurrencyWallet[] = getFioWallets(getState())
  const fioAddress = fioAddressToUse.toLowerCase()
  if (wallets != null) {
    for (const wallet: EdgeCurrencyWallet of wallets) {
      const names = await wallet.otherMethods.getFioAddress()
      if (names.length > 0) {
        for (const name of names) {
          if (name.toLowerCase() === fioAddress) {
            return dispatch({
              type: 'FIO/FIO_WALLET_BY_ADDRESS',
              data: { wallet }
            })
          }
        }
      }
    }
  } else {
    return dispatch({
      type: 'FIO/FIO_WALLET_BY_ADDRESS',
      data: { wallet: null }
    })
  }
}
