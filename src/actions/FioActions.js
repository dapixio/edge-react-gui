// @flow

import { type EdgeAccount } from 'edge-core-js/types'
import { Linking } from 'react-native'

import { showActivity, showError } from '../components/services/AirshipInstance.js'
import { FIO_WALLET_TYPE } from '../constants/WalletAndCurrencyConstants'
import s from '../locales/strings.js'
import { type Dispatch, type GetState } from '../types/reduxTypes.js'

export function registerFirstFioAddress () {
  return function (dispatch: Dispatch, getState: GetState) {
    const state = getState()
    const defaultFiat = state.ui.settings.defaultIsoFiat
    const { account } = state.core

    return showActivity(s.strings.preparing_fio_wallet, getFioAddress(account, defaultFiat)).then(fioAddress => {
      Linking.openURL(`https://giveaway.fio.foundation/?referrer=edge&fpk=${fioAddress}`)
    }, showError)
  }
}

/**
 * Creates a FIO wallet (if needed) and grabs an address.
 */
async function getFioAddress (account: EdgeAccount, defaultFiat: string) {
  // Create a FIO wallet, if needed:
  let walletInfo
  for (const currencyWalletKey of Object.keys(account.currencyWallets)) {
    if (account.currencyWallets[currencyWalletKey].type === FIO_WALLET_TYPE) {
      walletInfo = account.currencyWallets[currencyWalletKey]
      break
    }
  }
  if (!walletInfo) {
    walletInfo = await account.createCurrencyWallet(FIO_WALLET_TYPE, {
      name: s.strings.string_first_fio_wallet_name,
      fiatCurrencyCode: defaultFiat
    })
  }

  if (walletInfo == null) throw new Error('Problem loading FIO wallet')

  // Get the wallet object itself:
  const fioCurrencyWallet = await account.waitForCurrencyWallet(walletInfo.id)
  const address = await fioCurrencyWallet.getReceiveAddress()
  return address.publicAddress
}
