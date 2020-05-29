// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { Alert, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import IonIcon from 'react-native-vector-icons/Ionicons'

import * as Constants from '../../constants/indexConstants'
import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import { ConnectWalletsConnector as ConnectWallets } from '../../modules/FioAddress/components/ConnectWallets'
import { findWalletByFioAddress } from '../../modules/FioAddress/util'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { styles as mainStyles } from '../../styles/MainStyle'
import { styles } from '../../styles/scenes/FioAddressDetailsStyle'
import { THEME } from '../../theme/variables/airbitz'
import { SceneWrapper } from '../common/SceneWrapper'
import { SettingsHeaderRow } from '../common/SettingsHeaderRow'
import { SettingsRow } from '../common/SettingsRow'
import { showError } from '../services/AirshipInstance'

export type StateProps = {
  fioWallets: EdgeCurrencyWallet[]
}

export type NavProps = {
  fioAddressName: string,
  expiration: string,
  navigation: any
}

export type LocalState = {
  fioWalletLoading: boolean,
  fioWallet: EdgeCurrencyWallet | null
}

type Props = StateProps & NavProps

const rightArrow = <AntDesignIcon name="right" color={THEME.COLORS.GRAY_2} size={THEME.rem(1)} />
const headerIconSize = 26

export class FioAddressDetailsScene extends Component<Props, LocalState> {
  state: LocalState = {
    fioWalletLoading: false,
    fioWallet: null
  }

  componentDidMount() {
    const { fioAddressName } = this.props
    if (!fioAddressName) {
      Alert.alert(s.strings.fio_address_details_screen_alert_title, s.strings.fio_address_details_screen_alert_message, [
        { text: s.strings.fio_address_details_screen_alert_button }
      ])
    }
    this.props.navigation.setParams({
      renderTitle: this.renderTitle(fioAddressName)
    })
    this.findFioWallet()
  }

  findFioWallet = async () => {
    const { fioAddressName, fioWallets } = this.props
    this.setState({ fioWalletLoading: true })
    const fioWallet = await findWalletByFioAddress(fioWallets, fioAddressName)
    this.setState({ fioWalletLoading: false, fioWallet })
  }

  _onPressAccountSettings = (): void => {
    const { fioAddressName, expiration } = this.props
    const { fioWallet } = this.state
    if (fioWallet) {
      Actions[Constants.FIO_ADDRESS_SETTINGS]({ fioWallet, fioAddressName, expiration: intl.formatExpDate(expiration) })
    } else {
      showError(s.strings.fio_wallet_missing_for_fio_address)
    }
  }

  checkExpiredSoon = (): boolean => {
    const { expiration } = this.props
    const month = 1000 * 60 * 60 * 24 * 30
    return new Date(expiration).getTime() - new Date().getTime() < month
  }

  renderTitle = (title: string) => {
    return (
      <View style={styles.titleWrapper}>
        <T style={mainStyles.titleStyle}>{title}</T>
      </View>
    )
  }

  renderAccountSettings = () => {
    let icon, displayName
    if (this.checkExpiredSoon()) {
      icon = <IonIcon name="ios-warning" color={THEME.COLORS.ACCENT_ORANGE} size={headerIconSize} />
      displayName = <T style={styles.warning}>{s.strings.fio_address_details_expired_soon}</T>
    } else {
      icon = <IonIcon name="ios-settings" color={THEME.COLORS.GRAY_1} size={headerIconSize} />
      displayName = <T style={styles.settingsText}>{s.strings.fio_address_details_screen_manage_account_settings}</T>
    }

    return <SettingsRow icon={icon} text={displayName} onPress={this._onPressAccountSettings} right={rightArrow} />
  }

  render() {
    const { fioAddressName, expiration } = this.props
    return (
      <SceneWrapper>
        <T style={styles.expiration}>
          {`${s.strings.fio_address_details_screen_expires} `}
          {intl.formatExpDate(expiration)}
        </T>
        <View style={styles.viewGrey}>
          {this.renderAccountSettings()}
          <SettingsHeaderRow
            icon={<IonIcon name="ios-link" color={THEME.COLORS.WHITE} size={headerIconSize} />}
            text={s.strings.fio_address_details_connect_to_wallets}
          />
          <ConnectWallets fioAddressName={fioAddressName} fioWallet={this.state.fioWallet} disabled={this.state.fioWalletLoading} />
        </View>
      </SceneWrapper>
    )
  }
}
