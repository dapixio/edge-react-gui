// @flow
import type { EdgeCurrencyWallet } from 'edge-core-js'
import { Actions } from 'react-native-router-flux'

import { showError, showToast } from '../../components/services/AirshipInstance'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings'
import type { Dispatch, GetState } from '../../types/reduxTypes'
import { findWalletByFioAddress, getFioWallets, getWallets } from '../UI/selectors'

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
    const { fee } = await wallet.otherMethods.fioAction('getFeeForPublicAddress', {
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

export const recordSend = (params: any) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { senderFioAddress, senderMsgRecipient, senderWallet } = state.ui.scenes.fioAddress
  if (senderFioAddress && senderMsgRecipient && senderWallet) {
    const { payeeFIOAddress, payerPublicAddress, payeePublicAddress, amount, currencyCode, txid, memo } = params
    await senderWallet.otherMethods.fioAction('recordObtData', {
      payerFIOAddress: senderFioAddress,
      payeeFIOAddress,
      payerPublicAddress,
      payeePublicAddress,
      amount,
      tokenCode: currencyCode,
      chainCode: currencyCode,
      obtId: txid,
      memo,
      maxFee: 0,
      tpid: '',
      status: 'sent_to_blockchain'
    })
    dispatch({
      type: 'FIO/FIO_SET_SENDER_FIO_ADDRESS',
      data: {
        fioAddress: '',
        fioWallet: null,
        error: ''
      }
    })
    dispatch({
      type: 'FIO/FIO_SET_SENDER_MSG_TO_RECIPIENT',
      data: {
        msg: ''
      }
    })
  }
}
