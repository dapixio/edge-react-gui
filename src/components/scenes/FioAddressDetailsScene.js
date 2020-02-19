// @flow

import React, { Component } from 'react'
import { ActivityIndicator, Alert, Image, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import fioAddressDetailsIcon from '../../assets/images/details_fioAddress.png'
import * as Constants from '../../constants/SceneKeys'
import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/index'
import styles from '../../styles/scenes/FioAddressDetailsStyle'
import { SceneWrapper } from '../common/SceneWrapper'

export type State = {}

export type StateProps = {
  fioAddressName: string,
  expiration: Date,
  fee_collected: number,
  getPubAddressesLoading: boolean,
  registerSuccess?: boolean
}

export type DispatchProps = {
  refreshPubAddresses: string => void
}

export type SceneProps = {
  fioAddress: string
}

type Props = StateProps & SceneProps & DispatchProps

export class FioAddressDetailsScene extends Component<Props, State> {
  componentDidMount () {
    const { fioAddress } = this.props

    if (!fioAddress) {
      Alert.alert(s.strings.fio_address_details_screen_alert_title, s.strings.fio_address_details_screen_alert_message, [
        { text: s.strings.fio_address_details_screen_alert_button }
      ])
    }

    if (!this.props.registerSuccess) this.props.refreshPubAddresses(fioAddress)
  }

  _onToggleConnectWallets = (fioAddressName: string) => {
    Actions[Constants.FIO_CONNECT_TO_WALLETS]({ fioAddressName })
  }

  _onToggleAccountSettings = (fioAddressName: string, expiration: string) => {
    Actions[Constants.FIO_ACCOUNT_SETTINGS]({ fioAddressName, expiration })
  }

  renderButton () {
    if (this.props.registerSuccess) {
      return (
        <View style={styles.buttons}>
          <TouchableHighlight style={styles.bottomButton} onPress={() => Actions[Constants.FIO_ADDRESS_LIST]()} underlayColor={styles.underlay.color}>
            <View style={styles.bottomButtonTextWrap}>
              <T style={styles.bottomButtonText}>{s.strings.fio_address_list}</T>
            </View>
          </TouchableHighlight>
        </View>
      )
    }

    const { fioAddressName, expiration, getPubAddressesLoading } = this.props

    return (
      <View style={styles.buttons}>
        <TouchableHighlight
          style={styles.bottomButton}
          disabled={getPubAddressesLoading}
          onPress={() => this._onToggleConnectWallets(fioAddressName)}
          underlayColor={styles.underlay.color}
        >
          <View style={[styles.bottomButtonTextWrap, styles.buttonWithLoader]}>
            <T style={styles.bottomButtonText}>{s.strings.fio_address_details_screen_connect_to_wallets}</T>
            {getPubAddressesLoading && <ActivityIndicator style={styles.loading} size="small" />}
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.bottomButton}
          onPress={() => this._onToggleAccountSettings(fioAddressName, intl.formatExpDate(expiration))}
          underlayColor={styles.underlay.color}
        >
          <View style={styles.bottomButtonTextWrap}>
            <T style={styles.bottomButtonText}>{s.strings.fio_address_details_screen_manage_account_settings}</T>
          </View>
        </TouchableHighlight>
      </View>
    )
  }

  render () {
    const { fioAddressName, expiration } = this.props
    return (
      <SceneWrapper>
        <View style={styles.view}>
          <View style={styles.texts}>
            <View style={styles.image}>
              <Image source={fioAddressDetailsIcon} />
            </View>
            <T style={styles.text}>{s.strings.fio_address_details_screen_registered}</T>
            <T style={styles.title}>{fioAddressName}</T>
            <T style={styles.text}>
              {`${s.strings.fio_address_details_screen_expires} `}
              {intl.formatExpDate(expiration)}
            </T>
          </View>
          {this.renderButton()}
        </View>
      </SceneWrapper>
    )
  }
}
