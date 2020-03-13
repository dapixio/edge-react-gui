// @flow

import { connect } from 'react-redux'

import type {
  FioConnectWalletConfirmDispatchProps as DispatchProps,
  FioConnectWalletConfirmStateProps as StateProps
} from '../../components/scenes/FioConnectWalletConfirmScene'
import { FioConnectWalletConfirmScene } from '../../components/scenes/FioConnectWalletConfirmScene'
import { isConnectedState } from '../../modules/Core/selectors'
import { setFioWalletByFioAddress, updatePubAddressesToFioAddress } from '../../modules/FioAddress/action'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const connectWalletsLoading = state.ui.scenes.fioAddress.setPubAddressesLoading

  const out: StateProps = {
    connectWalletsLoading,
    isConnected: isConnectedState(state)
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  connectToWallets: (fioAddress: string, wallets: { chainCode: string, tokenCode: string, publicAddress: string }[]) => {
    dispatch(updatePubAddressesToFioAddress(fioAddress, wallets))
  },
  setFioWalletByFioAddress: (fioAddress: string) => {
    dispatch(setFioWalletByFioAddress(fioAddress))
  }
})

export const FioConnectWalletConfirmConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioConnectWalletConfirmScene)
