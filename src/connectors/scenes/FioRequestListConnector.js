// @flow

import { Animated } from 'react-native'
import { connect } from 'react-redux'

import type { DispatchProps, StateProps } from '../../components/scenes/FioRequestListScene'
import { FioRequestList } from '../../components/scenes/FioRequestListScene'
import { updateExchangeRates } from '../../modules/ExchangeRates/action.js'
import {
  getFioRequestsPending,
  getFioRequestsSent,
  rejectRequest,
  removeFioPendingRequest,
  setFioPendingRequestSelected,
  setFioSentRequestSelected
} from '../../modules/FioRequest/action'
import { getSelectedCurrencyCode, getSelectedWallet, getWallets } from '../../modules/UI/selectors.js'
import type { Dispatch, State } from '../../types/reduxTypes'
import { getFiatSymbol } from '../../util/utils'

const mapStateToProps = (state: State) => {
  const wallets = getWallets(state)
  const wallet = getSelectedWallet(state)
  if (!wallet) {
    return {
      loading: true
    }
  }
  const fiatSymbol = getFiatSymbol(getSelectedWallet(state).fiatCurrencyCode)
  const currencyCode = getSelectedCurrencyCode(state)
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode

  const pendingFioRequests = state.ui.scenes.fioRequest.requests
  const sentFioRequests = state.ui.scenes.fioRequest.sentRequests
  const exchangeRates = state.exchangeRates
  const animation = new Animated.Value(0)
  const out: StateProps = {
    loading: false,
    selectedCurrencyCode: currencyCode,
    isoFiatCurrencyCode,
    fiatSymbol,
    pendingFioRequests,
    sentFioRequests,
    exchangeRates,
    animation,
    wallets
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  getFioRequestsPending: () => dispatch(getFioRequestsPending()),
  getFioRequestsSent: () => dispatch(getFioRequestsSent()),
  setFioPendingRequestSelected: (fioPendingRequestSelected: Object) => dispatch(setFioPendingRequestSelected(fioPendingRequestSelected)),
  setFioSentRequestSelected: (fioSentRequestSelected: Object) => dispatch(setFioSentRequestSelected(fioSentRequestSelected)),
  fioRejectRequest: (fioRequestId: string, payerFioAddress: string, cb: Function) => {
    dispatch(rejectRequest(fioRequestId, payerFioAddress, cb))
  },
  removeFioPendingRequest: (requestId: string) => dispatch(removeFioPendingRequest(requestId)),
  updateExchangeRates: () => dispatch(updateExchangeRates())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FioRequestList)
