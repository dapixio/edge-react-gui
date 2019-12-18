// @flow
import type { EdgeCurrencyWallet } from 'edge-core-js'
import { Alert } from 'react-native'

import { showError } from '../../components/services/AirshipInstance'
import { LIMIT } from '../../constants/indexConstants'
import { FIO_WALLET_TYPE } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings'
import type { Dispatch, GetState } from '../../types/reduxTypes.js'

const requestListPending = (fioRequestsPending: any, more = 0, page = 1) => ({
  type: 'FIO/FIO_REQUEST_LIST_PENDING',
  data: { fioRequestsPending, more, page }
})

const requestListSent = (fioRequestsSent: any, more = 0, page = 1) => ({
  type: 'FIO/FIO_REQUEST_LIST_SENT',
  data: { fioRequestsSent, more, page }
})

const requestListSelected = (fioPendingRequestSelected: any) => ({
  type: 'FIO/FIO_PENDING_REQUEST_SELECTED',
  data: { fioPendingRequestSelected }
})

const requestListSentSelected = (fioSentRequestSelected: any) => ({
  type: 'FIO/FIO_SENT_REQUEST_SELECTED',
  data: { fioSentRequestSelected }
})

const requestListRemove = (requestId: string) => ({
  type: 'FIO/FIO_REQUEST_LIST_REMOVE',
  data: { requestId }
})

const requestPendingConfirmed = (fioPendingRequestConfirmed: any) => ({
  type: 'FIO/FIO_PENDING_REQUEST_CONFIRMED',
  data: { fioPendingRequestConfirmed }
})

const requestPendingRejected = (fioPendingRequestConfirmed: any) => ({
  type: 'FIO/FIO_PENDING_REQUEST_REJECTED',
  data: { fioPendingRequestConfirmed }
})

export const getFioWalletWithFioAddress = async (getState: GetState, fioAddressToUse: string) => {
  const wallets = getFioWallets(getState)
  const fioAddress = fioAddressToUse.toLowerCase()
  if (wallets != null) {
    for (const wallet of wallets) {
      const names = await wallet.otherMethods.getFioAddress()
      if (names.length > 0) {
        for (const name of names) {
          if (name.toLowerCase() === fioAddress) {
            return wallet
          }
        }
      }
    }
  } else {
    return null
  }
}

export const getFioWalletByFioAddress = (fioAddressToUse: string) => async (dispatch: Dispatch, getState: GetState) => {
  const wallets = getFioWallets(getState)
  const fioAddress = fioAddressToUse.toLowerCase()
  if (wallets != null) {
    for (const wallet of wallets) {
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

export const getFioWallets = (getState: GetState) => {
  const { activeWalletIds } = getState().core.account
  const fioWallets = []
  for (const walletId of activeWalletIds) {
    const edgeWallet = getState().core.account.currencyWallets[walletId]
    if (edgeWallet && edgeWallet.type === FIO_WALLET_TYPE) {
      fioWallets.push(edgeWallet)
    }
  }

  return fioWallets
}

export const getFioRequestsPending = (page: number = 1) => (dispatch: Dispatch, getState: GetState) => {
  const wallets = getFioWallets(getState)
  dispatch(requestListPending([]))
  if (wallets != null) {
    wallets.forEach(wallet => {
      const fioPublicKey = wallet.publicWalletInfo.keys.publicKey
      wallet.otherMethods.getFioAddress().then(names => {
        if (names.length > 0) {
          wallet.otherMethods
            .fioAction('getPendingFioRequests', {
              fioPublicKey,
              limit: LIMIT,
              offset: (page - 1) * LIMIT
            })
            .then(({ requests, more }) => {
              if (requests) {
                dispatch(requestListPending(requests, more, page))
              } else {
                showError(s.strings.fio_get_requests_error)
              }
            })
            .catch(() => {
              //
            })
        }
      })
    })
  }
}

export const getFioRequestsSent = (page: number = 1) => (dispatch: Dispatch, getState: GetState) => {
  const wallets = getFioWallets(getState)
  dispatch(requestListSent([]))
  if (wallets != null) {
    wallets.forEach(wallet => {
      const fioPublicKey = wallet.publicWalletInfo.keys.publicKey
      wallet.otherMethods.getFioAddress().then(names => {
        if (names.length > 0) {
          wallet.otherMethods
            .fioAction('getSentFioRequests', {
              fioPublicKey,
              limit: LIMIT,
              offset: (page - 1) * LIMIT
            })
            .then(fioRequestsSentRes => {
              if (fioRequestsSentRes) {
                dispatch(requestListSent(fioRequestsSentRes.requests, fioRequestsSentRes.more, page))
              } else {
                showError(s.strings.fio_get_requests_error)
              }
            })
            .catch(() => {
              //
            })
        }
      })
    })
  }
}

export const setFioPendingRequestSelected = (fioPendingRequestSelected: Object) => async (dispatch: Dispatch, getState: GetState) => {
  dispatch(requestListSelected(fioPendingRequestSelected))
}

export const setFioSentRequestSelected = (fioSentRequestSelected: Object) => async (dispatch: Dispatch, getState: GetState) => {
  dispatch(requestListSentSelected(fioSentRequestSelected))
}

export const removeFioPendingRequest = (requestId: string) => async (dispatch: Dispatch, getState: GetState) => {
  dispatch(requestListRemove(requestId))
}

export const confirmRequest = (
  fioWalletByAddress: EdgeCurrencyWallet,
  pendingRequest: Object,
  payerPublicAddress: string,
  txId: string,
  notes?: string = '',
  fee: number = 0,
  cb: Function
) => async (dispatch: Dispatch) => {
  fioWalletByAddress.otherMethods
    .fioAction('recordObtData', {
      fioRequestId: pendingRequest.fio_request_id,
      payerFIOAddress: pendingRequest.payer_fio_address,
      payeeFIOAddress: pendingRequest.payee_fio_address,
      payerPublicAddress: pendingRequest.payer_fio_public_key,
      payeePublicAddress: pendingRequest.content.payee_public_address,
      amount: pendingRequest.content.amount,
      tokenCode: pendingRequest.content.token_code,
      obtId: txId,
      memo: pendingRequest.content.memo,
      maxFee: fee,
      tpid: '',
      status: 'sent_to_blockchain'
    })
    .then(() => {
      dispatch(requestPendingConfirmed('SUCCESS'))
      cb()
    })
    .catch(() => {
      showError(s.strings.fio_confirm_request_error)
      dispatch(requestPendingConfirmed('FAILURE'))
    })
}

export const rejectRequest = (fioRequestId: string, payerFioAddress: string, cb: Function) => async (dispatch: Dispatch, getState: GetState) => {
  const wallet = await getFioWalletWithFioAddress(getState, payerFioAddress)
  if (wallet != null) {
    wallet.otherMethods
      .fioAction('getFee', {
        endPoint: 'reject_funds_request',
        fioAddress: payerFioAddress
      })
      .then(({ fee }) => {
        if (fee) throw new Error(s.strings.fio_no_bundled_err_title)
        wallet.otherMethods
          .fioAction('rejectFundsRequest', {
            fioRequestId: fioRequestId,
            maxFee: fee
          })
          .then(() => {
            dispatch(requestPendingRejected('SUCCESS'))
            cb()
          })
          .catch(error => {
            showError(s.strings.fio_reject_request_message)
            dispatch(requestPendingRejected('FAILURE'))
            cb(error)
          })
      })
      .catch(e => {
        Alert.alert(s.strings.fio_no_bundled_err_title, s.strings.fio_no_bundled_err_msg)
        cb(e)
      })
  } else {
    Alert.alert(s.strings.err_no_address_title)
    cb(s.strings.err_no_address_title)
  }
}
