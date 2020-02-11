// @flow

import React, { Component } from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/index'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import ABSlider from '../../modules/UI/components/Slider/index.js'
import styles from '../../styles/scenes/FioConnectWalletStyle'
import type { GuiWallet, IsConnectedProp } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'

export type State = {
  acknowledge: boolean
}

export type FioConnectWalletConfirmStateProps = {
  connectWalletsLoading: boolean,
  isConnected: boolean
}

export type FioConnectWalletConfirmRouteProps = {
  fioAddressName: string,
  selectedWallets: GuiWallet[]
}

export type FioConnectWalletConfirmDispatchProps = {
  connectToWallets: (fioAddressName: string, selectedWallets: { tokenCode: string, publicAddress: string }[]) => void,
  setFioWalletByFioAddress: (fioAddressName: string) => void
}

type Props = FioConnectWalletConfirmStateProps & FioConnectWalletConfirmDispatchProps & FioConnectWalletConfirmRouteProps & IsConnectedProp

export class FioConnectWalletConfirmScene extends Component<Props, State> {
  state = {
    acknowledge: false
  }

  componentDidMount (): void {
    this.props.setFioWalletByFioAddress(this.props.fioAddressName)
  }

  confirm () {
    const { fioAddressName, selectedWallets, connectToWallets, isConnected } = this.props
    if (isConnected) {
      connectToWallets(
        fioAddressName,
        selectedWallets.map((wallet: GuiWallet) => ({
          tokenCode: wallet.currencyCode,
          publicAddress: wallet.receiveAddress.publicAddress
        }))
      )
    }
  }

  check () {
    const { acknowledge } = this.state

    this.setState({ acknowledge: !acknowledge })
  }

  render () {
    const { fioAddressName, selectedWallets, connectWalletsLoading } = this.props
    const { acknowledge } = this.state

    return (
      <SceneWrapper>
        <View>
          <View style={styles.info}>
            <T style={styles.title}>{s.strings.fio_address_label}</T>
            <T style={styles.titleLarge}>{fioAddressName}</T>
            <View style={styles.spacer} />
            <View style={styles.spacer} />
            <T style={styles.title}>{s.strings.title_fio_connect_to_wallet}</T>
            <View style={styles.spacer} />
            {selectedWallets.map(wallet => (
              <T key={wallet.id} style={styles.walletName}>
                {wallet.name}
              </T>
            ))}
          </View>
          <View style={styles.spacer} />
          <View style={styles.spacer} />
          <View style={styles.info}>
            <TouchableWithoutFeedback onPress={() => this.check()}>
              <View style={styles.checkBoxContainer}>
                <View style={styles.checkBox}>
                  {acknowledge && (
                    <Icon
                      style={styles.checkBoxIconOk}
                      type={Constants.MATERIAL_COMMUNITY}
                      name={Constants.CHECK_CIRCLE}
                      size={styles.checkBoxIconOk.fontSize}
                    />
                  )}
                </View>
                <T style={styles.checkTitle}>{s.strings.fio_connect_checkbox_text}</T>
              </View>
            </TouchableWithoutFeedback>
            <View style={styles.spacer} />
            <View style={styles.spacer} />
            <ABSlider
              forceUpdateGuiCounter={false}
              resetSlider={true}
              onSlidingComplete={() => this.confirm()}
              sliderDisabled={!acknowledge}
              disabledText={s.strings.send_confirmation_slide_to_confirm}
              showSpinner={connectWalletsLoading}
            />
          </View>
        </View>
      </SceneWrapper>
    )
  }
}
