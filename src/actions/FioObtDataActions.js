// @flow

import type { Dispatch, GetState } from '../types/reduxTypes'

export const recordSend = (params: {
  payeeFioAddress: string,
  payerPublicAddress: string,
  payeePublicAddress: string,
  amount: string,
  currencyCode: string,
  chainCode: string,
  txid: string
}) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { senderFioAddress, senderMsgRecipient, senderWallet } = state.ui.scenes.fioAddress
  if (senderFioAddress && senderWallet) {
    const { payeeFioAddress, payerPublicAddress, payeePublicAddress, amount, currencyCode, chainCode, txid } = params
    try {
      await senderWallet.otherMethods.fioAction('recordObtData', {
        payerFioAddress: senderFioAddress,
        payeeFioAddress,
        payerPublicAddress,
        payeePublicAddress,
        amount,
        tokenCode: currencyCode,
        chainCode,
        obtId: txid,
        memo: senderMsgRecipient,
        maxFee: 0,
        tpid: '',
        status: 'sent_to_blockchain'
      })
    } catch (e) {
      //
      console.log(e.message)
      console.log(e.json)
    }
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
