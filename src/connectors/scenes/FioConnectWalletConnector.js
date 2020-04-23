// @flow

import { connect } from 'react-redux'

import type { FioConnectWalletStateProps as StateProps } from '../../components/scenes/FioConnectWalletScene'
import { FioConnectWalletScene } from '../../components/scenes/FioConnectWalletScene'
import { isPubAddressNotConnected } from '../../modules/FioAddress/util'
import { getFioWallets, getWallets } from '../../modules/UI/selectors'
import type { State } from '../../types/reduxTypes'

const mapStateToProps = (state: State, ownProps): StateProps => {
  const wallets = getWallets(state)
  const fioWallets = getFioWallets(state)
  const connectedPubAddresses = state.ui.fio.connectedPubAddresses[ownProps.fioAddressName]
  const notConnectedWallets = {}

  if (!connectedPubAddresses) return { wallets: {}, fioWallets, loading: true }

  for (const walletKey: string in wallets) {
    const publicAddress = wallets[walletKey].receiveAddress.publicAddress
    if (!publicAddress) continue
    if (isPubAddressNotConnected(connectedPubAddresses[wallets[walletKey].currencyCode])) {
      notConnectedWallets[`${publicAddress}-${wallets[walletKey].currencyCode}`] = {
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
        if (isPubAddressNotConnected(connectedPubAddresses[tokenData.currencyCode])) {
          notConnectedWallets[`${publicAddress}-${tokenData.currencyCode}`] = {
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
    wallets: notConnectedWallets,
    fioWallets,
    loading: false
  }
  return out
}

export const FioConnectWalletConnector = connect(mapStateToProps)(FioConnectWalletScene)
