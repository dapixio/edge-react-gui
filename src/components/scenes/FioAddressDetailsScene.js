// @flow

import React, { Component } from 'react'
import { Alert, Image, View } from 'react-native'

import fioAddressDetailsIcon from '../../assets/images/details_fioAddress.png'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import styles from '../../styles/scenes/FioAddressDetailsStyle'

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

type Props = StateProps & SceneProps

export class FioAddressDetailsScene extends Component<Props, State> {
  componentDidMount () {
    const { fioAddress } = this.props

    if (!fioAddress) {
      Alert.alert(s.strings.fio_address_details_screen_alert_title, s.strings.fio_address_details_screen_alert_message, [
        { text: s.strings.fio_address_details_screen_alert_button }
      ])
    }
  }

  render () {
    const { fioAddressName, expirationFormatted } = this.props
    return (
      <SafeAreaView>
        <Gradient style={styles.view}>
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
        </Gradient>
      </SafeAreaView>
    )
  }
}
