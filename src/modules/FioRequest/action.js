// @flow
import type { EdgeCurrencyWallet } from 'edge-core-js'

import { showError } from '../../components/services/AirshipInstance'
import { FIO_STR, LIMIT } from '../../constants/indexConstants'
import s from '../../locales/strings'
import type { Dispatch, GetState } from '../../types/reduxTypes.js'
import { findWalletByFioAddress, getFioWallets } from '../UI/selectors'

const requestListPending = (fioRequestsPending: any, more = 0, page = 1) => ({
  type: 'FIO/FIO_REQUEST_LIST_PENDING',
  data: { fioRequestsPending, more, page }
})

const requestListSent = (fioRequestsSent: any, more = 0, page = 1) => ({
  type: 'FIO/FIO_REQUEST_LIST_SENT',
  data: { fioRequestsSent, more, page }
})

const requestPendingConfirmed = (fioPendingRequestConfirmed: any) => ({
  type: 'FIO/FIO_PENDING_REQUEST_CONFIRMED',
  data: { fioPendingRequestConfirmed }
})

const requestPendingRejected = (fioPendingRequestConfirmed: any) => ({
  type: 'FIO/FIO_PENDING_REQUEST_REJECTED',
  data: { fioPendingRequestConfirmed }
})

export const getFioRequestsPending = (page: number = 1) => (dispatch: Dispatch, getState: GetState) => {
  const wallets = getFioWallets(getState())
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
  const wallets = getFioWallets(getState())
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
      chainCode: pendingRequest.content.chain_code,
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

export const rejectRequest = (fioRequestId: string, payerFioAddress: string, payeeFioAddress: string, cb: Function) => async (
  dispatch: Dispatch,
  getState: GetState
) => {
  const wallet = findWalletByFioAddress(getState(), payerFioAddress)
  if (wallet != null) {
    wallet.otherMethods
      .fioAction('getFeeForRejectFundsRequest', {
        payeeFioAddress
      })
      .then(({ fee }) => {
        if (fee) throw new Error(s.strings.fio_no_bundled_err_msg)
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
        showError(s.strings.fio_no_bundled_err_msg)
        cb(e)
      })
  } else {
    showError(s.strings.err_no_address_title)
    cb(s.strings.err_no_address_title)
  }
}

export const refreshFioObtData = (wallet: EdgeCurrencyWallet) => async (dispatch: Dispatch) => {
  if (wallet != null && wallet.currencyInfo.currencyCode === FIO_STR) {
    try {
      const res = await wallet.otherMethods.fioAction('getObtData', {})
      dispatch({
        type: 'FIO/SET_OBT_DATA',
        data: res.obt_data_records
      })
    } catch (e) {
      //
    }
  }
}
