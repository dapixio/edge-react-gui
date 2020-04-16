// @flow
import type { EdgeCurrencyWallet } from 'edge-core-js'

import { showError } from '../../components/services/AirshipInstance'
import s from '../../locales/strings'
import type { Dispatch, GetState } from '../../types/reduxTypes.js'
import type { FioRequest } from '../../types/types'
import { findWalletByFioAddress, getFioWallets } from '../UI/selectors'

const requestListPending = (fioRequestsPending: FioRequest[], isLoading?: boolean = true, isReset?: boolean = false) => ({
  type: 'FIO/FIO_REQUEST_LIST_PENDING',
  data: { fioRequestsPending, isLoading, isReset }
})

const requestListSent = (fioRequestsSent: FioRequest[], isLoading?: boolean = true, isReset?: boolean = false) => ({
  type: 'FIO/FIO_REQUEST_LIST_SENT',
  data: { fioRequestsSent, isLoading, isReset }
})

export const getFioRequestsPending = () => async (dispatch: Dispatch, getState: GetState) => {
  const wallets = getFioWallets(getState())
  dispatch(requestListPending([], true, true))
  if (wallets.length) {
    try {
      for (const wallet of wallets) {
        const fioPublicKey = wallet.publicWalletInfo.keys.publicKey
        const fioAddresses = await wallet.otherMethods.getFioAddresses()
        if (fioAddresses.length > 0) {
          try {
            const { requests } = await wallet.otherMethods.fioAction('getPendingFioRequests', { fioPublicKey })
            if (requests) {
              dispatch(requestListPending(requests))
            } else {
              showError(s.strings.fio_get_requests_error)
            }
          } catch (e) {
            //
          }
        }
      }
    } catch (e) {
      showError(s.strings.fio_get_requests_error)
    }
  }
  dispatch(requestListPending([], false))
}

export const getFioRequestsSent = () => async (dispatch: Dispatch, getState: GetState) => {
  const wallets = getFioWallets(getState())
  dispatch(requestListSent([], true, true))
  if (wallets.length) {
    try {
      for (const wallet of wallets) {
        const fioPublicKey = wallet.publicWalletInfo.keys.publicKey
        const fioAddresses = await wallet.otherMethods.getFioAddresses()
        if (fioAddresses.length > 0) {
          try {
            const { requests } = await wallet.otherMethods.fioAction('getSentFioRequests', { fioPublicKey })
            if (requests) {
              dispatch(requestListSent(requests))
            } else {
              showError(s.strings.fio_get_requests_error)
            }
          } catch (e) {
            //
          }
        }
      }
    } catch (e) {
      showError(s.strings.fio_get_requests_error)
    }
  }
  dispatch(requestListSent([], false))
}

export const confirmRequest = (
  fioWalletByAddress: EdgeCurrencyWallet,
  pendingRequest: FioRequest,
  payerPublicAddress: string,
  txId: string,
  memo: string = '',
  cb: Function
) => async (dispatch: Dispatch) => {
  try {
    await fioWalletByAddress.otherMethods.fioAction('recordObtData', {
      fioRequestId: pendingRequest.fio_request_id,
      payerFioAddress: pendingRequest.payer_fio_address,
      payeeFioAddress: pendingRequest.payee_fio_address,
      payerPublicAddress: pendingRequest.payer_fio_public_key,
      payeePublicAddress: pendingRequest.content.payee_public_address,
      amount: pendingRequest.content.amount,
      tokenCode: pendingRequest.content.token_code,
      chainCode: pendingRequest.content.chain_code,
      obtId: txId,
      memo,
      tpid: '',
      status: 'sent_to_blockchain'
    })
    dispatch(getFioRequestsPending())
    cb()
  } catch (e) {
    showError(s.strings.fio_confirm_request_error)
  }
}

export const rejectRequest = (fioRequestId: string, payerFioAddress: string, cb: Function) => async (dispatch: Dispatch, getState: GetState) => {
  const wallet = await findWalletByFioAddress(getState(), payerFioAddress)
  if (wallet != null) {
    try {
      const { fee } = await wallet.otherMethods.fioAction('getFeeForRejectFundsRequest', { payerFioAddress })
      if (fee) {
        return showError(s.strings.fio_no_bundled_err_msg)
      }
      await wallet.otherMethods.fioAction('rejectFundsRequest', { fioRequestId: fioRequestId, payerFioAddress })
      cb()
    } catch (e) {
      showError(s.strings.fio_reject_request_error)
      cb(e)
    }
  } else {
    showError(s.strings.err_no_address_title)
    cb(s.strings.err_no_address_title)
  }
}
