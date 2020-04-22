// @flow
import { bns } from 'biggystring'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import { Actions } from 'react-native-router-flux'

import { showError, showToast } from '../../components/services/AirshipInstance'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings'
import type { Dispatch, GetState } from '../../types/reduxTypes'
import { getAccount } from '../Core/selectors'
import { getExchangeDenomination } from '../Settings/selectors'
import { findWalletByFioAddress, getFioWalletByAddress, getFioWallets, getWallets } from '../UI/selectors'
import type { BuyAddressResponse } from './reducer'

export const setFioWalletByFioAddress = (fioAddressToUse: string) => async (dispatch: Dispatch, getState: GetState) => {
  dispatch({
    type: 'FIO/FIO_WALLET_BY_ADDRESS',
    data: { wallet: null, loading: true }
  })
  const wallet = await findWalletByFioAddress(getState(), fioAddressToUse)
  dispatch({
    type: 'FIO/FIO_WALLET_BY_ADDRESS',
    data: { wallet }
  })
}

export const refreshAllFioAddresses = (cb?: Function) => async (dispatch: Dispatch, getState: GetState) => {
  const wallets: EdgeCurrencyWallet[] = getFioWallets(getState())
  let fioAddresses = []

  dispatch({
    type: 'FIO/SET_FIO_ADDRESSES_PROGRESS'
  })

  if (wallets != null) {
    for (const wallet: EdgeCurrencyWallet of wallets) {
      const walletFioAddresses = await wallet.otherMethods.getFioAddresses()
      fioAddresses = [...fioAddresses, ...walletFioAddresses]
    }
  }

  dispatch({
    type: 'FIO/SET_FIO_ADDRESSES',
    data: { fioAddresses }
  })
  if (cb) cb()
}

export const getRegInfo = (fioAddress: string, selectedWallet: EdgeCurrencyWallet) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = getAccount(state)
  const currencyPluginName = Constants.CURRENCY_PLUGIN_NAMES[Constants.FIO_STR]
  const fioPlugin = account.currencyConfig[currencyPluginName]

  let activationCost = 0

  dispatch({
    type: 'FIO/FIO_ADDRESS_REG_INFO_LOADING',
    data: true
  })

  try {
    const fee = await selectedWallet.otherMethods.getFee('registerFioAddress')
    activationCost = fee / Constants.BILLION
  } catch (e) {
    showError(s.strings.fio_get_fee_err_msg)
  }

  try {
    const buyAddressResponse: BuyAddressResponse = await fioPlugin.otherMethods.buyAddressRequest({
      address: fioAddress,
      referralCode: 'edge',
      publicKey: selectedWallet.publicWalletInfo.keys.publicKey
    })

    if (buyAddressResponse.error) {
      console.log(buyAddressResponse.error)
      showError(s.strings.fio_get_reg_info_err_msg)
    }

    if (buyAddressResponse.success) {
      const supportedCurrencies = { [Constants.FIO_STR]: true }
      const paymentInfo = {
        [Constants.FIO_STR]: {
          amount: `${activationCost}`,
          nativeAmount: '',
          address: ''
        }
      }

      for (const currencyKey in buyAddressResponse.success.charge.pricing) {
        const currencyCode = buyAddressResponse.success.charge.pricing[currencyKey].currency
        supportedCurrencies[currencyCode] = true

        const exchangeDenomination = getExchangeDenomination(state, currencyCode)
        let nativeAmount = bns.mul(buyAddressResponse.success.charge.pricing[currencyKey].amount, exchangeDenomination.multiplier)
        nativeAmount = bns.toFixed(nativeAmount, 0, 0)

        paymentInfo[currencyCode] = {
          amount: buyAddressResponse.success.charge.pricing[currencyKey].amount,
          nativeAmount,
          address: buyAddressResponse.success.charge.addresses[currencyKey]
        }
      }

      dispatch({
        type: 'FIO/SET_FIO_ADDRESS_REG_INFO',
        data: { handleRegistrationInfo: { activationCost, supportedCurrencies }, addressRegistrationPaymentInfo: paymentInfo }
      })
    }
  } catch (e) {
    console.log(e)
    showError(s.strings.fio_get_reg_info_err_msg)
  }

  dispatch({
    type: 'FIO/FIO_ADDRESS_REG_INFO_LOADING',
    data: false
  })
}

export const getRenewalFee = () => async (dispatch: Dispatch, getState: GetState) => {
  const fioWallet: EdgeCurrencyWallet | null = getFioWalletByAddress(getState())
  dispatch({
    type: 'FIO/SET_FIO_ADDRESS_RENEWAL_FEE',
    data: { fee: null, loading: true }
  })
  if (fioWallet) {
    try {
      const { fee } = await fioWallet.otherMethods.fioAction('getFee', { endPoint: 'renew_fio_address', fioAddress: '' })
      return dispatch({
        type: 'FIO/SET_FIO_ADDRESS_RENEWAL_FEE',
        data: { fee }
      })
    } catch (e) {
      //
    }
  }
  dispatch({
    type: 'FIO/SET_FIO_ADDRESS_RENEWAL_FEE',
    data: { fee: null, loading: false }
  })
}

export const refreshPubAddresses = (fioAddress: string) => async (dispatch: Dispatch, getState: GetState) => {
  const wallets = getWallets(getState())
  const fioWallet = await findWalletByFioAddress(getState(), fioAddress)

  const pubAddresses = {}
  dispatch({
    type: 'FIO/FIO_UPDATE_PUB_ADDRESSES_LOADING'
  })
  for (const walletKey: string in wallets) {
    if (!fioWallet) continue
    if (wallets[walletKey].enabledTokens && wallets[walletKey].enabledTokens.length) {
      for (const enabledToken: string of wallets[walletKey].enabledTokens) {
        try {
          const { public_address } = await fioWallet.otherMethods.fioAction('getPublicAddress', {
            fioAddress,
            tokenCode: enabledToken,
            chainCode: wallets[walletKey].currencyCode
          })
          pubAddresses[enabledToken] = public_address
        } catch (e) {
          //
          console.log(e.json)
        }
      }
    }
    if (pubAddresses[wallets[walletKey].currencyCode] && pubAddresses[wallets[walletKey].currencyCode] !== '0') continue
    try {
      const { public_address } = await fioWallet.otherMethods.fioAction('getPublicAddress', {
        fioAddress,
        tokenCode: wallets[walletKey].currencyCode,
        chainCode: wallets[walletKey].currencyCode
      })
      pubAddresses[wallets[walletKey].currencyCode] = public_address
    } catch (e) {
      //
      console.log(e.json)
    }
  }

  dispatch({
    type: 'FIO/FIO_UPDATE_PUB_ADDRESSES',
    data: {
      fioAddress,
      pubAddresses
    }
  })
}

export const updatePubAddressesToFioAddress = (fioAddress: string, wallets: { chainCode: string, tokenCode: string, publicAddress: string }[]) => async (
  dispatch: Dispatch,
  getState: GetState
) => {
  const wallet: EdgeCurrencyWallet | null = getState().ui.scenes.fioAddress.fioWalletByAddress
  if (!wallet) return showError(s.strings.fio_connect_wallets_err)
  let maxFee: number
  dispatch({
    type: 'FIO/FIO_CONNECT_WALLETS_REQUEST'
  })
  try {
    const { fee } = await wallet.otherMethods.fioAction('getFeeForAddPublicAddress', {
      fioAddress
    })
    maxFee = fee
  } catch (e) {
    showError(s.strings.fio_get_fee_err_msg)
    return dispatch({
      type: 'FIO/FIO_CONNECT_WALLETS_FAILURE'
    })
  }
  try {
    await wallet.otherMethods.fioAction('addPublicAddresses', {
      fioAddress,
      publicAddresses: wallets.map(({ chainCode, tokenCode, publicAddress }) => ({
        token_code: tokenCode,
        chain_code: chainCode,
        public_address: publicAddress
      })),
      maxFee
    })
  } catch (e) {
    showError(s.strings.fio_connect_wallets_err)
    return dispatch({
      type: 'FIO/FIO_CONNECT_WALLETS_FAILURE'
    })
  }

  dispatch({
    type: 'FIO/FIO_CONNECT_WALLETS_SUCCESS'
  })
  dispatch(refreshPubAddresses(fioAddress))

  showToast(wallets[0].publicAddress === '0' ? s.strings.fio_disconnect_wallets_success : s.strings.fio_connect_wallets_success)
  Actions.popTo(Constants.FIO_ADDRESS_DETAILS)
}

export const setSenderFioAddress = (fioAddress: string) => async (dispatch: Dispatch, getState: GetState) => {
  const fioWallet = await findWalletByFioAddress(getState(), fioAddress)
  let error = ''

  if (!fioWallet) {
    error = s.strings.fio_select_address_no_wallet_err
    showError(error)
    return dispatch({
      type: 'FIO/FIO_SET_SENDER_FIO_ADDRESS',
      data: {
        fioAddress,
        fioWallet,
        error
      }
    })
  }

  try {
    const getFeeResult = await fioWallet.otherMethods.fioAction('getFee', {
      endPoint: 'record_obt_data',
      fioAddress: fioAddress
    })
    if (getFeeResult.fee) {
      error = s.strings.fio_no_bundled_err_msg
    }
  } catch (e) {
    showError(s.strings.fio_get_fee_err_msg)
  }

  dispatch({
    type: 'FIO/FIO_SET_SENDER_FIO_ADDRESS',
    data: {
      fioAddress,
      fioWallet,
      error
    }
  })
}
