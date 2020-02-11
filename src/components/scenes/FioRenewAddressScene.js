// @flow

import { Scene } from 'edge-components'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import { BILLION } from '../../constants/indexConstants'
import s from '../../locales/strings'
import { Button } from '../../modules/UI/components/ControlPanel/Component/Button/Button.ui'
import T from '../../modules/UI/components/FormattedText/index'
import ABSlider from '../../modules/UI/components/Slider/index.js'
import styles from '../../styles/scenes/FioAddressConfirmStyle'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError, showToast } from '../services/AirshipInstance'

type State = {
  wallet: Object | null,
  loading: boolean,
  renewLoading: boolean,
  fee: number,
  displayFee: number,
  balance: number,
  errMsg: string
}

export type StateProps = {
  fioWallets: EdgeCurrencyWallet[],
  isConnected: boolean
}

export type RouteProps = {
  fioAddressName: string,
  expiration: Date
}

export type DispatchProps = {
  setFioAddress: (fioAddressName: string, expiration: string) => void
}

type Props = StateProps & RouteProps & DispatchProps

export class FioRenewAddressScene extends Component<Props, State> {
  state: State = {
    wallet: null,
    loading: false,
    renewLoading: false,
    fee: 0,
    balance: 0,
    displayFee: 0,
    errMsg: ''
  }

  componentDidMount () {
    this.getFee()
  }

  async setWallet () {
    const { fioAddressName, fioWallets } = this.props
    let wallet
    for (const fioWallet of fioWallets) {
      const fioNames = await this.getAddressFromWallet(fioWallet)
      if (fioNames.indexOf(fioAddressName) > -1) {
        wallet = fioWallet
        break
      }
    }

    if (!wallet) wallet = fioWallets[0]
    const getBalanceRes = await wallet.otherMethods.fioAction('getFioBalance', {})
    this.setState({ wallet, balance: this.formatFio(getBalanceRes.balance) })
  }

  async getFee () {
    this.toggleLoading(true)
    await this.setWallet()
    const { wallet } = this.state
    if (!wallet) return
    const { fee } = await wallet.otherMethods.fioAction('getFee', { endPoint: 'renew_fio_address', fioAddress: '' })
    const displayFee = this.formatFio(fee)
    this.setState({ fee, displayFee })
    this.toggleLoading()
  }

  toggleLoading (loading: boolean = false) {
    this.setState({ loading })
  }

  toggleRenewLoading (renewLoading: boolean = false) {
    this.setState({ renewLoading })
  }

  formatFio (val: number) {
    return val / BILLION
  }

  getAddressFromWallet = async (wallet: EdgeCurrencyWallet) => {
    if (!wallet) return []
    try {
      const receiveAddress = await wallet.getReceiveAddress()
      const fioNamesRes = await wallet.otherMethods.fioAction('getFioNames', { fioPublicKey: receiveAddress.publicAddress })
      return fioNamesRes.fio_addresses.map(fioAddressItem => fioAddressItem.fio_address)
    } catch (e) {
      return []
    }
  }

  onNextPress = async () => {
    const { fioAddressName, setFioAddress, isConnected } = this.props
    const { wallet, fee } = this.state

    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    if (!wallet) return
    try {
      this.toggleRenewLoading(true)
      const renewRes = await wallet.otherMethods.fioAction('renewFioAddress', { fioAddress: fioAddressName, maxFee: fee })

      setFioAddress(fioAddressName, renewRes.expiration)

      showToast(s.strings.fio_request_renew_ok_text)
      Actions.pop()
    } catch (e) {
      this.setState({ errMsg: e.message })
    }
    this.toggleRenewLoading()
  }

  renderContent (containerStyles: Object, textStyles: Object = styles.textBlack) {
    const { fioAddressName } = this.props
    const { displayFee, balance, loading, renewLoading, errMsg } = this.state

    return (
      <View style={containerStyles}>
        <View style={styles.texts}>
          <T style={[styles.title, textStyles]}>{s.strings.fio_address_label}</T>
          <T style={[styles.titleLarge, textStyles]}>{fioAddressName}</T>
          <View style={styles.spacer} />
          <T style={[styles.title, textStyles]}>{s.strings.fio_renew_address_fee_label}</T>
          <T style={[styles.title, textStyles]}>
            {displayFee ? `${displayFee} ${s.strings.fio_address_confirm_screen_fio_label}` : s.strings.fio_address_confirm_screen_free_label}
          </T>
          <View style={styles.spacer} />
          {displayFee ? (
            <View>
              <View style={styles.balanceText} />
              <T style={[styles.title, textStyles]}>{s.strings.fio_address_confirm_screen_balance_label}</T>
              <T style={[displayFee > balance ? styles.balanceTitleDisabled : styles.balanceTitle, textStyles]}>
                {balance ? balance.toFixed(2) : '0'} {balance ? s.strings.fio_address_confirm_screen_fio_label : ''}
              </T>
            </View>
          ) : (
            <View />
          )}
        </View>
        {displayFee ? (
          <View style={styles.blockPadding}>
            <Scene.Footer style={styles.footer}>
              <ABSlider
                forceUpdateGuiCounter={false}
                resetSlider={false}
                parentStyle={styles.sliderStyle}
                onSlidingComplete={this.onNextPress}
                sliderDisabled={displayFee > balance}
                showSpinner={renewLoading}
                disabledText={s.strings.fio_address_confirm_screen_disabled_slider_label}
              />
            </Scene.Footer>
          </View>
        ) : (
          <View style={styles.button}>
            <Button disabled={loading} onPress={this.onNextPress} style={styles.toggleButton} underlayColor={styles.underlay.color}>
              <Button.Center>
                <Button.Text>{renewLoading ? <ActivityIndicator size={'small'} /> : <T>{s.strings.fio_renew_label}</T>}</Button.Text>
              </Button.Center>
            </Button>
          </View>
        )}

        {errMsg ? <T style={styles.errMsg}>{errMsg}</T> : <T />}
        {loading && <ActivityIndicator style={styles.activityIndicator} size={'large'} />}
      </View>
    )
  }

  render () {
    const { displayFee } = this.state

    if (displayFee) {
      return (
        <SceneWrapper>
          <View style={styles.scene}>{this.renderContent(styles.mainViewBg, styles.textWhite)}</View>
        </SceneWrapper>
      )
    }

    return (
      <SceneWrapper>
        <View style={styles.scene}>{this.renderContent(styles.mainView)}</View>
      </SceneWrapper>
    )
  }
}
