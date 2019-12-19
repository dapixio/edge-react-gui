// @flow

import React, { Component } from 'react'
import { ScrollView, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings'
import T from '../../modules/UI/components/FormattedText/index'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import styles from '../../styles/scenes/FioAccountSettingsStyle'
import { SceneWrapper } from '../common/SceneWrapper'

export type StateProps = {
  fioAddressName: string,
  expiration: Date
}

type Props = StateProps

export class FioAccountSettingsScene extends Component<Props> {
  showRenew = (fioAddressName: string) => {
    Actions[Constants.FIO_RENEW_ADDRESS]({ fioAddressName })
  }

  render () {
    const { fioAddressName } = this.props

    return (
      <SceneWrapper background="body">
        <ScrollView style={styles.list}>
          <TouchableHighlight onPress={() => this.showRenew(fioAddressName)}>
            <View style={styles.item}>
              <View style={styles.info}>
                <T style={styles.infoTitle}>
                  {s.strings.fio_renew_label} {fioAddressName}
                </T>
              </View>
              <View style={styles.arrow}>
                <Icon type={Constants.FONT_AWESOME} name={Constants.ANGLE_RIGHT} size={30} />
              </View>
            </View>
          </TouchableHighlight>
        </ScrollView>
      </SceneWrapper>
    )
  }
}
