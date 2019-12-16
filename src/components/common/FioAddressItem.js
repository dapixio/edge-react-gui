// @flow

import React from 'react'
import { Image, TouchableHighlight, View } from 'react-native'

import fioAddressListIcon from '../../assets/images/list_fioAddress.png'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/index'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import styles from '../../styles/scenes/FioAddressListStyle'
import { scale } from '../../util/scaling.js'
import { getMonthName } from '../../util/utils'

type FioAddressItemProps = {
  addresses: Object,
  wallet: Object,
  onFioAddressPress: (fioAddress: string, expiration: string) => void
}

const FioAddressItem = (props: FioAddressItemProps) => {
  const { addresses, wallet, onFioAddressPress } = props

  return addresses.fio_addresses.map(address => {
    const expiration = new Date(address.expiration)
    return (
      <TouchableHighlight onPress={() => onFioAddressPress(`${address.fio_address}`, address.expiration)} key={`${wallet.name}-${address.fio_address}`}>
        <View style={styles.item}>
          <View style={styles.icon}>
            <Image source={fioAddressListIcon} style={{ height: scale(40), width: scale(45) }} />
          </View>
          <View style={styles.info}>
            <T style={styles.infoTitle}>{address.fio_address}</T>
            <T style={styles.infoSubtitle}>
              {`${s.strings.fio_address_details_screen_expires} `}&nbsp;
              {getMonthName(expiration.getMonth()) + ' ' + expiration.getDate() + ', ' + expiration.getFullYear()}
            </T>
          </View>
          <View style={styles.arrow}>
            <Icon type={Constants.FONT_AWESOME} name={Constants.ANGLE_RIGHT} size={30} />
          </View>
        </View>
      </TouchableHighlight>
    )
  })
}

export default FioAddressItem
