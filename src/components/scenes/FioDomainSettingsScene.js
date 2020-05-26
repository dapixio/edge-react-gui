// @flow

import { bns } from 'biggystring'
import { Scene } from 'edge-components'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../constants/indexConstants'
import { intl } from '../../locales/intl'
import s from '../../locales/strings'
import { getRenewalFee, renewFioDomain } from '../../modules/FioAddress/util'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { Slider } from '../../modules/UI/components/Slider/Slider.ui.js'
import { styles } from '../../styles/scenes/FioAddressSettingsStyle'
import { truncateDecimals } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError, showToast } from '../services/AirshipInstance'

const DIVIDE_PRECISION = 18

export type State = {
  feeLoading: boolean,
  renewalFee: number | null,
  renewLoading: boolean,
  displayFee: number,
  balance: number
}

export type StateProps = {
  denominationMultiplier: string,
  isConnected: boolean
}

export type DispatchProps = {
  refreshAllFioAddresses: () => void
}

export type NavigationProps = {
  fioWallet: EdgeCurrencyWallet,
  fioDomainName: string,
  expiration: string
}

type Props = NavigationProps & StateProps & DispatchProps

export class FioDomainSettingsScene extends Component<Props, State> {
  state: State = {
    feeLoading: false,
    renewalFee: null,
    renewLoading: false,
    displayFee: 0,
    balance: 0
  }

  componentDidMount(): void {
    this.setFee()
    this.setBalance()
  }

  setFee = async (): Promise<void> => {
    const { fioWallet } = this.props
    let renewalFee = null
    let displayFee = 0
    if (fioWallet) {
      this.setState({ feeLoading: true })
      try {
        renewalFee = await getRenewalFee(fioWallet, true)
        if (renewalFee) {
          displayFee = this.formatFio(`${renewalFee}`)
        }
      } catch (e) {
        showError(e.message)
      }
      this.setState({ renewalFee, displayFee, feeLoading: false })
    }
  }

  setBalance = async (): Promise<void> => {
    const { fioWallet } = this.props
    if (fioWallet) {
      const balance = await fioWallet.getBalance()
      this.setState({ balance: this.formatFio(balance) })
    } else {
      showError(s.strings.fio_wallet_missing_for_fio_domain)
    }
  }

  toggleRenewLoading(renewLoading: boolean = false) {
    this.setState({ renewLoading })
  }

  formatFio(val: string): number {
    return parseFloat(truncateDecimals(bns.div(val, this.props.denominationMultiplier, DIVIDE_PRECISION), 6))
  }

  onNextPress = async () => {
    const { fioWallet, fioDomainName, isConnected, refreshAllFioAddresses } = this.props
    const { renewalFee } = this.state

    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }

    if (!fioWallet) {
      showError(s.strings.fio_wallet_missing_for_fio_domain)
      return
    }

    if (renewalFee === null) {
      showError(s.strings.fio_get_fee_err_msg)
      return
    }

    try {
      this.toggleRenewLoading(true)
      await renewFioDomain(fioWallet, fioDomainName, renewalFee)

      refreshAllFioAddresses()

      showToast(s.strings.fio_request_renew_ok_text)
      Actions.pop()
    } catch (e) {
      showError(e.message)
    }
    this.toggleRenewLoading()
  }

  renderFeeAndBalance() {
    const { feeLoading, displayFee, balance, renewalFee } = this.state

    if (feeLoading) return <ActivityIndicator style={styles.activityIndicator} size="small" />

    if (renewalFee === null && !feeLoading) {
      return (
        <View>
          <T style={styles.title}>{s.strings.fio_get_fee_err_msg}</T>
        </View>
      )
    }

    return (
      <View style={styles.texts}>
        <View style={styles.spacer} />
        <View style={styles.spacer} />
        <T style={styles.title}>{s.strings.fio_renew_fee_label}</T>
        <T style={styles.content}>
          {displayFee ? `${displayFee} ${s.strings.fio_address_confirm_screen_fio_label}` : s.strings.fio_address_confirm_screen_free_label}
        </T>
        <View style={styles.spacer} />
        {displayFee ? (
          <View>
            <View style={styles.balanceText} />
            <T style={styles.title}>{s.strings.fio_address_confirm_screen_balance_label}</T>
            <T style={displayFee > balance ? styles.balanceTitleDisabled : styles.balanceTitle}>
              {balance ? balance.toFixed(2) : '0'} {balance ? s.strings.fio_address_confirm_screen_fio_label : ''}
            </T>
          </View>
        ) : null}
      </View>
    )
  }

  render() {
    const { fioDomainName, expiration } = this.props
    const { feeLoading, displayFee, balance, renewalFee, renewLoading } = this.state

    return (
      <SceneWrapper>
        <View style={styles.info}>
          <T style={styles.title}>{s.strings.fio_domain_label}</T>
          <T style={styles.content}>
            {Constants.FIO_ADDRESS_DELIMITER}
            {fioDomainName}
          </T>
        </View>
        <View style={styles.info}>
          <T style={styles.title}>{s.strings.fio_address_details_screen_expires}</T>
          <T style={styles.content}>{intl.formatExpDate(expiration)}</T>
        </View>
        {this.renderFeeAndBalance()}
        {renewalFee !== null && !feeLoading ? (
          <View style={styles.blockPadding}>
            <Scene.Footer style={styles.footer}>
              <Slider
                forceUpdateGuiCounter={0}
                resetSlider={false}
                onSlidingComplete={this.onNextPress}
                sliderDisabled={displayFee > balance}
                showSpinner={renewLoading}
                disabledText={s.strings.fio_address_confirm_screen_disabled_slider_label}
              />
            </Scene.Footer>
          </View>
        ) : null}
      </SceneWrapper>
    )
  }
}
