// @flow

import React, { Component } from 'react'
import { FlatList, Image, ScrollView, TouchableHighlight, View } from 'react-native'

import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/index'
import ABSlider from '../../modules/UI/components/Slider/index.js'
import { CryptoExchangeWalletListRowStyle as walletStyles } from '../../styles/components/CryptoExchangeWalletListRowStyle'
import { styles } from '../../styles/scenes/FioConnectWalletStyle'
import type { FioConnectionWalletItem } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'

export type State = {
  selectedToRemove: { [walletId: string]: FioConnectionWalletItem }
}

export type FioDisconnectWalletsStateProps = {
  connectedWallets: { [walletId: string]: FioConnectionWalletItem },
  disconnectWalletsLoading: boolean
}

export type FioDisconnectWalletsDispatchProps = {
  disconnectWallets: (fioAddressName: string, selectedToRemove: { chainCode: string, tokenCode: string, publicAddress: string }[]) => void,
  setFioWalletByFioAddress: (fioAddressName: string) => void
}

export type FioDisconnectWalletsRouteProps = {
  fioAddressName: string
}

type Props = FioDisconnectWalletsStateProps & FioDisconnectWalletsDispatchProps & FioDisconnectWalletsRouteProps

export class FioDisconnectWalletScene extends Component<Props, State> {
  state = {
    selectedToRemove: {}
  }

  componentDidMount (): void {
    this.props.setFioWalletByFioAddress(this.props.fioAddressName)
  }

  confirm = (): void => {
    const { selectedToRemove } = this.state
    const { fioAddressName, disconnectWallets } = this.props
    disconnectWallets(
      fioAddressName,
      Object.keys(selectedToRemove).map((walletKey: string) => ({
        chainCode: selectedToRemove[walletKey].chainCode,
        tokenCode: selectedToRemove[walletKey].currencyCode,
        publicAddress: '0'
      }))
    )
  }

  selectWallet (wallet: FioConnectionWalletItem): void {
    const { selectedToRemove } = this.state
    if (selectedToRemove[wallet.key]) {
      delete selectedToRemove[wallet.key]
    } else {
      selectedToRemove[wallet.key] = wallet
    }

    this.setState({ selectedToRemove })
  }

  keyExtractor = (item: {}, index: number): string => index.toString()

  renderWalletItem = ({ item: wallet }: { item: FioConnectionWalletItem }) => {
    const { selectedToRemove } = this.state
    if (wallet) {
      const isSelected = !!selectedToRemove[wallet.key]

      return (
        <TouchableHighlight
          style={isSelected ? styles.walletSelected : styles.wallet}
          underlayColor={styles.underlay.color}
          onPress={() => this.selectWallet(wallet)}
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
                <T style={[walletStyles.walletDetailsRowFiat]}>{isSelected ? s.strings.fio_wallet_connect_return : s.strings.fio_wallet_connect_remove}</T>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      )
    }
    return null
  }

  render () {
    const { connectedWallets, disconnectWalletsLoading } = this.props
    const { selectedToRemove } = this.state

    if (!Object.keys(connectedWallets).length) {
      return (
        <SceneWrapper background="body">
          <ScrollView style={styles.list}>
            <T style={styles.no_wallets_text}>{s.strings.fio_connect_no_wallets}</T>
          </ScrollView>
        </SceneWrapper>
      )
    }

    return (
      <SceneWrapper background="body">
        <ScrollView style={styles.list}>
          <FlatList
            data={Object.values(connectedWallets)}
            contentContainerStyle={styles.contentStyles}
            initialNumToRender={24}
            keyboardShouldPersistTaps="handled"
            keyExtractor={this.keyExtractor}
            renderItem={this.renderWalletItem}
          />
        </ScrollView>
        <View style={[styles.bottomSection, styles.bottomSectionBlue]}>
          <ABSlider
            forceUpdateGuiCounter={false}
            resetSlider={true}
            onSlidingComplete={this.confirm}
            sliderDisabled={!Object.keys(selectedToRemove).length}
            disabledText={s.strings.send_confirmation_slide_to_confirm}
            showSpinner={disconnectWalletsLoading}
          />
        </View>
      </SceneWrapper>
    )
  }
}
