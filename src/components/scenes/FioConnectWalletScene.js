// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, FlatList, Image, ScrollView, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../constants/SceneKeys'
import s from '../../locales/strings.js'
import { findWalletByFioAddress } from '../../modules/FioAddress/util'
import T from '../../modules/UI/components/FormattedText/index'
import { CryptoExchangeWalletListRowStyle as walletStyles } from '../../styles/components/CryptoExchangeWalletListRowStyle'
import { styles } from '../../styles/scenes/FioConnectWalletStyle'
import type { FioConnectionWalletItem } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'

export type State = {
  selectedWallets: { [walletId: string]: FioConnectionWalletItem },
  fioWallet: EdgeCurrencyWallet | null,
  fioWalletLoading: boolean
}

export type FioConnectWalletStateProps = {
  wallets: {
    [publicAddressCurrencyCode: string]: FioConnectionWalletItem
  },
  fioWallets: EdgeCurrencyWallet[],
  loading: boolean
}

export type FioConnectWalletRouteProps = {
  fioAddressName: string
}

type Props = FioConnectWalletStateProps & FioConnectWalletRouteProps

export class FioConnectWalletScene extends Component<Props, State> {
  state = {
    selectedWallets: {},
    fioWallet: null,
    fioWalletLoading: false
  }

  componentDidMount (): void {
    this.findFioWallet()
  }

  findFioWallet = async () => {
    const { fioAddressName, fioWallets } = this.props
    this.setState({ fioWalletLoading: true })
    const fioWallet = await findWalletByFioAddress(fioWallets, fioAddressName)
    this.setState({ fioWalletLoading: false, fioWallet })
  }

  _onToggleContinue = async (): Promise<void> => {
    const { fioAddressName } = this.props
    const { selectedWallets, fioWallet } = this.state
    if (fioWallet) {
      Actions[Constants.FIO_CONNECT_TO_WALLETS_CONFIRM]({ fioAddressName, fioWallet, selectedWallets: Object.values(selectedWallets) })
    } else {
      showError(s.strings.fio_connect_wallets_err)
    }
  }

  _onToggleConnected = async (): Promise<void> => {
    const { fioAddressName } = this.props
    const { fioWallet } = this.state
    if (fioWallet) {
      Actions[Constants.FIO_ADDRESS_DISCONNECT_WALLETS]({ fioAddressName, fioWallet })
    } else {
      showError(s.strings.fio_connect_wallets_err)
    }
  }

  selectWallet (wallet: FioConnectionWalletItem): void {
    const { selectedWallets } = this.state
    if (selectedWallets[wallet.key]) {
      delete selectedWallets[wallet.key]
    } else {
      selectedWallets[wallet.key] = wallet
    }

    this.setState({ selectedWallets })
  }

  keyExtractor = (item: {}, index: number): string => index.toString()

  renderFioConnectionWalletItem = ({ item: wallet }: { item: FioConnectionWalletItem }) => {
    const { selectedWallets } = this.state
    if (wallet) {
      const isSelected = !!selectedWallets[wallet.key]
      const disabled =
        !isSelected && !!Object.keys(selectedWallets).find((walletItemKey: string) => selectedWallets[walletItemKey].currencyCode === wallet.currencyCode)

      return (
        <TouchableHighlight
          style={disabled ? styles.walletDisabled : isSelected ? styles.walletSelected : styles.wallet}
          underlayColor={styles.underlay.color}
          onPress={() => this.selectWallet(wallet)}
          disabled={disabled}
        >
          <View style={walletStyles.rowContainerTop}>
            <View style={walletStyles.containerLeft}>
              <Image style={walletStyles.imageContainer} source={{ uri: wallet.symbolImage }} resizeMode={'contain'} />
            </View>
            <View style={styles.walletDetailsContainer}>
              <View style={styles.walletDetailsCol}>
                <T style={[styles.walletDetailsRowCurrency]}>{wallet.currencyCode}</T>
                <T style={[styles.walletDetailsRowName]}>{wallet.name}</T>
              </View>
              <View style={styles.walletDetailsCol}>
                <T style={[walletStyles.walletDetailsRowFiat]}>
                  {disabled ? '' : isSelected ? s.strings.fio_wallet_connect_remove : s.strings.fio_wallet_connect_add}
                </T>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      )
    }
    return null
  }

  renderNoWallets () {
    const { loading } = this.props
    return <T style={styles.no_wallets_text}>{loading ? s.strings.loading : s.strings.fio_connect_no_wallets}</T>
  }

  render () {
    const { wallets } = this.props
    const { selectedWallets, fioWalletLoading } = this.state
    const continueDisabled = !Object.keys(selectedWallets).length

    return (
      <SceneWrapper background="body">
        <ScrollView style={styles.list}>
          {Object.keys(wallets).length ? (
            <FlatList
              data={Object.values(wallets)}
              contentContainerStyle={styles.contentContainer}
              initialNumToRender={24}
              keyboardShouldPersistTaps="handled"
              keyExtractor={this.keyExtractor}
              renderItem={this.renderFioConnectionWalletItem}
            />
          ) : (
            this.renderNoWallets()
          )}
        </ScrollView>
        <View style={styles.bottomSection}>
          <TouchableHighlight
            style={[styles.button, continueDisabled ? styles.btnDisabled : null]}
            onPress={this._onToggleContinue}
            underlayColor={styles.btnUnderlay.color}
            disabled={continueDisabled || fioWalletLoading}
          >
            <View style={styles.buttonTextWrap}>
              {fioWalletLoading ? <ActivityIndicator size="small" /> : <T style={styles.buttonText}>{s.strings.legacy_address_modal_continue}</T>}
            </View>
          </TouchableHighlight>
          <TouchableHighlight style={[styles.button, styles.connectedBtn]} onPress={this._onToggleConnected} underlayColor={styles.btnDisabled.backgroundColor}>
            <View style={styles.buttonTextWrap}>
              <T style={[styles.buttonText, styles.buttonTextBlue]}>{s.strings.fio_show_connected_wallets}</T>
            </View>
          </TouchableHighlight>
        </View>
      </SceneWrapper>
    )
  }
}
