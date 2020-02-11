// @flow

import { connect } from 'react-redux'

import type {
  FioDisconnectWalletsDispatchProps as DispatchProps,
  FioDisconnectWalletsStateProps as StateProps
} from '../../components/scenes/FioDisconnectWalletScene'
import { FioDisconnectWalletScene } from '../../components/scenes/FioDisconnectWalletScene'
import { setFioWalletByFioAddress, updatePubAddressesToFioAddress } from '../../modules/FioAddress/action'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State, ownProps): StateProps => {
  const wallets = state.ui.wallets.byId
  const connectedPubAddresses = state.ui.scenes.fioAddress.connectedWalletsByFioAddress[ownProps.fioAddressName]
  const setPubAddressesLoading = state.ui.scenes.fioAddress.setPubAddressesLoading
  const connectedWallets = {}

  for (const walletKey: string in wallets) {
    if (wallets[walletKey].receiveAddress.publicAddress === connectedPubAddresses[wallets[walletKey].currencyCode]) {
      connectedWallets[wallets[walletKey].id] = wallets[walletKey]
    }
  }
  const out: StateProps = {
    connectedWallets,
    disconnectWalletsLoading: setPubAddressesLoading
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  disconnectWallets: (fioAddress: string, wallets: { tokenCode: string, publicAddress: string }[]) => {
    dispatch(updatePubAddressesToFioAddress(fioAddress, wallets))
  },
  setFioWalletByFioAddress: (fioAddress: string) => {
    dispatch(setFioWalletByFioAddress(fioAddress))
  }
})

export const FioDisconnectWalletsConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioDisconnectWalletScene)
