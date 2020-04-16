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
    const publicAddress = wallets[walletKey].receiveAddress.publicAddress
    if (!publicAddress) continue
    if (publicAddress === connectedPubAddresses[wallets[walletKey].currencyCode]) {
      connectedWallets[`${publicAddress}-${wallets[walletKey].currencyCode}`] = {
        key: `${publicAddress}-${wallets[walletKey].currencyCode}`,
        id: wallets[walletKey].id,
        publicAddress,
        symbolImage: wallets[walletKey].symbolImage,
        name: wallets[walletKey].name,
        currencyCode: wallets[walletKey].currencyCode,
        chainCode: wallets[walletKey].currencyCode
      }
    }
    if (wallets[walletKey].enabledTokens && wallets[walletKey].enabledTokens.length) {
      for (const enabledToken: string of wallets[walletKey].enabledTokens) {
        const tokenData = wallets[walletKey].metaTokens.find(metaToken => metaToken.currencyCode === enabledToken)
        if (!tokenData) continue
        if (publicAddress === connectedPubAddresses[tokenData.currencyCode]) {
          connectedWallets[`${publicAddress}-${tokenData.currencyCode}`] = {
            key: `${publicAddress}-${tokenData.currencyCode}`,
            id: wallets[walletKey].id,
            publicAddress,
            symbolImage: tokenData.symbolImage,
            name: wallets[walletKey].name,
            currencyCode: tokenData.currencyCode,
            chainCode: wallets[walletKey].currencyCode
          }
        }
      }
    }
  }
  const out: StateProps = {
    connectedWallets,
    disconnectWalletsLoading: setPubAddressesLoading
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  disconnectWallets: (fioAddress: string, wallets: { chainCode: string, tokenCode: string, publicAddress: string }[]) => {
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
