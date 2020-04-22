// @flow
import type { EdgeCurrencyWallet, EdgeMetadata, EdgeTransaction } from 'edge-core-js'

import s from '../locales/strings.js'
import { getWallets } from '../modules/Core/selectors'
import { getFioWallets, getWalletLoadingPercent } from '../modules/UI/selectors'
import type { Dispatch, GetState } from '../types/reduxTypes'
import type { FioObtRecord } from '../types/types'

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

export const checkFioObtData = (walletId: string, transactions: EdgeTransaction[]) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const progressPercentage = getWalletLoadingPercent(state)
  if (progressPercentage < 100) {
    setTimeout(() => {
      dispatch(checkFioObtData(walletId, transactions))
    }, 400)
    return
  }
  const wallets = getWallets(state)
  const fioWallets = getFioWallets(state)

  const wallet = wallets[walletId]
  let obtDataRecords = []
  for (const fioWallet of fioWallets) {
    try {
      const { obt_data_records } = await fioWallet.otherMethods.fioAction('getObtData', {})
      obtDataRecords = [...obtDataRecords, ...obt_data_records]
    } catch (e) {
      // no obt data for pub key
    }
  }

  dispatch({
    type: 'FIO/SET_OBT_DATA',
    data: obtDataRecords
  })

  for (const transaction: EdgeTransaction of transactions) {
    const edgeMetadata: EdgeMetadata = transaction.metadata || { notes: '' }
    const obtForTx: FioObtRecord | void = obtDataRecords.find(obtRecord => obtRecord.content.obt_id === transaction.txid)
    if (!obtForTx) return
    if (!edgeMetadata.notes) edgeMetadata.notes = ''
    edgeMetadata.notes += `${edgeMetadata.notes.length ? '\n' : ''}${s.strings.fragment_transaction_list_sent_prefix}${
      s.strings.word_to_in_convert_from_to_string
    } ${obtForTx.payee_fio_address}`
    if (obtForTx.content.memo) edgeMetadata.notes += `\n${obtForTx.content.memo}`
    edgeMetadata.name = obtForTx.payer_fio_address
    try {
      await wallet.saveTxMetadata(transaction.txid, transaction.currencyCode, edgeMetadata)
    } catch (e) {
      //
      console.log(e.message)
    }
  }
}

export const refreshFioObtData = () => async (dispatch: Dispatch, getState: GetState) => {
  try {
    let obtDataRecords = []
    const fioWallets = getFioWallets(getState())
    for (const fioWallet: EdgeCurrencyWallet of fioWallets) {
      try {
        const { obt_data_records } = await fioWallet.otherMethods.fioAction('getObtData', {})
        obtDataRecords = [...obtDataRecords, ...obt_data_records]
      } catch (e) {
        //
      }
    }
    dispatch({
      type: 'FIO/SET_OBT_DATA',
      data: obtDataRecords
    })
  } catch (e) {
    //
  }
}
