// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'

import { FIO_WALLET_TYPE } from '../constants/WalletAndCurrencyConstants'
import { refreshPubAddressesForFioAddress } from '../modules/FioAddress/util'
import type { Dispatch } from '../types/reduxTypes.js'

export const refreshPubAddresses = (currencyWallets: { [walletId: string]: EdgeCurrencyWallet }) => async (dispatch: Dispatch) => {
  const wallets: EdgeCurrencyWallet[] = []
  const fioWallets: EdgeCurrencyWallet[] = []
  for (const walletId of Object.keys(currencyWallets)) {
    if (currencyWallets[walletId] && currencyWallets[walletId].type === FIO_WALLET_TYPE) {
      fioWallets.push(currencyWallets[walletId])
    }
    wallets.push(currencyWallets[walletId])
  }
  const connectedPubAddresses = {}
  for (const fioWallet: EdgeCurrencyWallet of fioWallets) {
    const fioAddresses = await fioWallet.otherMethods.getFioAddressNames()
    for (const fioAddress: string of fioAddresses) {
      connectedPubAddresses[fioAddress] = await refreshPubAddressesForFioAddress(fioAddress, fioWallet, wallets)
    }
  }

  dispatch({
    type: 'FIO/UPDATE_PUB_ADDRESSES',
    data: {
      connectedPubAddresses
    }
  })
}
