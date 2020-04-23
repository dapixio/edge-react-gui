// @flow

import { connect } from 'react-redux'

import type {
  FioDisconnectWalletsDispatchProps as DispatchProps,
  FioDisconnectWalletsStateProps as StateProps
} from '../../components/scenes/FioDisconnectWalletScene'
import { FioDisconnectWalletScene } from '../../components/scenes/FioDisconnectWalletScene'
import { isConnectedState } from '../../modules/Core/selectors'
import { getWallets } from '../../modules/UI/selectors'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State, ownProps): StateProps => {
  const wallets = getWallets(state)
  const connectedPubAddresses = state.ui.fio.connectedPubAddresses[ownProps.fioAddressName]
  if (!connectedPubAddresses) {
    return {
      pubAddresses: {},
      connectedWallets: {},
      isConnected: isConnectedState(state)
    }
  }
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
    pubAddresses: connectedPubAddresses,
    connectedWallets,
    isConnected: isConnectedState(state)
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  updatePubAddresses: (fioAddress: string, pubAddresses: { [currencyCode: string]: string }) => {
    dispatch({
      type: 'FIO/UPDATE_PUB_ADDRESSES_FOR_FIO_ADDRESS',
      data: {
        fioAddress,
        pubAddresses
      }
    })
  }
})

export const FioDisconnectWalletsConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioDisconnectWalletScene)
