// @flow

import { connect } from 'react-redux'

import type { FioConnectWalletStateProps as StateProps } from '../../components/scenes/FioConnectWalletScene'
import { FioConnectWalletScene } from '../../components/scenes/FioConnectWalletScene'
import type { State } from '../../types/reduxTypes'

const mapStateToProps = (state: State, ownProps): StateProps => {
  const wallets = state.ui.wallets.byId
  const connectedPubAddresses = state.ui.scenes.fioAddress.connectedWalletsByFioAddress[ownProps.fioAddressName]
  const notConnectedWallets = {}

  for (const walletKey: string in wallets) {
    if (!connectedPubAddresses[wallets[walletKey].currencyCode] || connectedPubAddresses[wallets[walletKey].currencyCode] === '0') {
      notConnectedWallets[wallets[walletKey].id] = wallets[walletKey]
    }
  }

  const out: StateProps = {
    wallets: notConnectedWallets
  }
  return out
}

export const FioConnectWalletConnector = connect(mapStateToProps)(FioConnectWalletScene)
