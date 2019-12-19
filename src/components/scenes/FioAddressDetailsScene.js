// @flow

import React, { Component } from 'react'
import { Alert, Image, TouchableHighlight, View } from 'react-native'

import fioAddressDetailsIcon from '../../assets/images/details_fioAddress.png'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/index'
import styles from '../../styles/scenes/FioAddressDetailsStyle'
import type { GoToSceneProps } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'

export type State = {}

export type StateProps = {
  fioAddressName: string,
  expiration: Date,
  expirationFormatted: string,
  fee_collected: number
}

export type SceneProps = {
  fioAddress: string
}

type Props = StateProps & SceneProps & GoToSceneProps

export class FioAddressDetailsScene extends Component<Props, State> {
  componentDidMount () {
    const { fioAddress } = this.props

    if (!fioAddress) {
      Alert.alert(s.strings.fio_address_details_screen_alert_title, s.strings.fio_address_details_screen_alert_message, [
        { text: s.strings.fio_address_details_screen_alert_button }
      ])
    }
  }

  _onToggleAccountSettings = (fioAddressName, expiration) => {
    this.props.goToScene(Constants.FIO_ACCOUNT_SETTINGS, { fioAddressName, expiration })
  }

  render () {
    const { fioAddressName, expirationFormatted } = this.props
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
              {expirationFormatted}
            </T>
          </View>
          <View style={styles.buttons}>
            <TouchableHighlight
              style={styles.bottomButton}
              onPress={() => this._onToggleAccountSettings(fioAddressName, expirationFormatted)}
              underlayColor={styles.underlay.color}
            >
              <View style={styles.bottomButtonTextWrap}>
                <T style={styles.bottomButtonText}>{s.strings.fio_address_details_screen_manage_account_settings}</T>
              </View>
            </TouchableHighlight>
          </View>
        </View>
      </SceneWrapper>
    )
  }
}
