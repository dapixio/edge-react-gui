// @flow

import { connect } from 'react-redux'

import type { DispatchProps, StateProps } from '../../components/scenes/FioRequestListScene'
import { FioRequestList } from '../../components/scenes/FioRequestListScene'
import { isConnectedState } from '../../modules/Core/selectors'
import { getFioRequestsPending, getFioRequestsSent, rejectRequest } from '../../modules/FioRequest/action'
import { getDisplayDenomination } from '../../modules/Settings/selectors'
import { getSelectedCurrencyCode, getSelectedWallet, getWallets } from '../../modules/UI/selectors.js'
import type { Dispatch, State } from '../../types/reduxTypes'
import { getFiatSymbol } from '../../util/utils'

const mapStateToProps = (state: State) => {
  const wallets = getWallets(state)
  const wallet = getSelectedWallet(state)
  if (!wallet) {
    const out: StateProps = {
      loading: true,
      selectedCurrencyCode: '',
      isoFiatCurrencyCode: '',
      fiatSymbol: '',
      displayDenominations: {},
      fioRequestsPending: [],
      fioRequestsSent: [],
      exchangeRates: {},
      wallets: {},
      isConnected: isConnectedState(state)
    }
    return out
  }
  const fiatSymbol = getFiatSymbol(getSelectedWallet(state).fiatCurrencyCode)
  const currencyCode = getSelectedCurrencyCode(state)
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode

  const { fioRequestsPending, fioRequestsSent, pendingRequestsLoading, sentRequestsLoading } = state.ui.scenes.fioRequest
  const exchangeRates = state.exchangeRates
  const displayDenominations = {}
  for (const pRequest of fioRequestsPending) {
    const {
      content: { token_code }
    } = pRequest
    if (!displayDenominations[token_code]) {
      displayDenominations[token_code] = getDisplayDenomination(state, token_code)
    }
  }
  for (const sRequest of fioRequestsSent) {
    const {
      content: { token_code }
    } = sRequest
    if (!displayDenominations[token_code]) {
      displayDenominations[token_code] = getDisplayDenomination(state, token_code)
    }
  }

  const out: StateProps = {
    loading: pendingRequestsLoading || sentRequestsLoading,
    selectedCurrencyCode: currencyCode,
    isoFiatCurrencyCode,
    fiatSymbol,
    displayDenominations,
    fioRequestsPending: fioRequestsPending.sort((a, b) => (a.time_stamp < b.time_stamp ? -1 : 1)),
    fioRequestsSent: fioRequestsSent.sort((a, b) => (a.time_stamp > b.time_stamp ? -1 : 1)),
    exchangeRates,
    wallets,
    isConnected: isConnectedState(state)
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  getFioRequestsPending: () => dispatch(getFioRequestsPending()),
  getFioRequestsSent: () => dispatch(getFioRequestsSent()),
  fioRejectRequest: (fioRequestId: string, payerFioAddress: string, cb: Function) => dispatch(rejectRequest(fioRequestId, payerFioAddress, cb)),
  removeFioPendingRequest: (requestId: string) => dispatch({ type: 'FIO/FIO_REQUEST_LIST_REMOVE', data: { requestId } })
})

export const FioRequestListConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioRequestList)
