// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ScrollView, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings'
import T from '../../modules/UI/components/FormattedText/index'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import { styles } from '../../styles/scenes/FioAccountSettingsStyle'
import FullScreenLoader from '../common/FullScreenLoader'
import { SceneWrapper } from '../common/SceneWrapper'

export type StateProps = {
  wallet: EdgeCurrencyWallet | null,
  feeLoading: boolean,
  walletLoading: boolean
}
export type NavigationProps = {
  fioAddressName: string
}
export type DispatchProps = {
  setFees: () => Promise<void>
}

type Props = NavigationProps & StateProps & DispatchProps

export class FioAccountSettingsScene extends Component<Props> {
  componentDidMount (): void {
    if (this.props.wallet) {
      this.props.setFees()
    }
  }
  componentDidUpdate (prevProps: StateProps): void {
    if (this.props.wallet && !prevProps.wallet) {
      this.props.setFees()
    }
  }

  showRenew = () => {
    const { fioAddressName } = this.props
    Actions[Constants.FIO_RENEW_ADDRESS]({ fioAddressName })
  }

  render () {
    const { fioAddressName, feeLoading, walletLoading } = this.props

    return (
      <SceneWrapper background="body">
        {feeLoading || walletLoading ? <FullScreenLoader /> : null}
        <ScrollView style={styles.list}>
          <TouchableHighlight onPress={this.showRenew}>
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
