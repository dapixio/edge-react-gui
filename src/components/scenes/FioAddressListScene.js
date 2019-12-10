// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ScrollView, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import FioAddressItem from '../../components/common/FioAddressItem'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { Button } from '../../modules/UI/components/ControlPanel/Component/Button/Button.ui'
import T from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import styles from '../../styles/scenes/FioAddressListStyle'
import type { GoToSceneProps } from '../../types/types'

export type State = {
  walletAddresses: Array<Object>
}

export type StateProps = {
  fioWallets: EdgeCurrencyWallet[]
}

export type DispatchProps = {
  setFioAddress: (fioAddress: string, expiration: string) => void
}

export type NavigationProps = {
  navigation: any
}

type Props = StateProps & DispatchProps & GoToSceneProps & NavigationProps

export class FioAddressListScene extends Component<Props, State> {
  willFocusSubscription = null
  state: State = {
    walletAddresses: []
  }

  async fetchData () {
    const { fioWallets } = this.props
    const walletAddresses = []
    for (const fioWallet of fioWallets) {
      const addresses = await this.getAddressFromWallet(fioWallet)
      if (addresses) {
        walletAddresses.push({
          wallet: fioWallet,
          addresses
        })
      }
    }

    if (walletAddresses.length === 0) {
      Actions[Constants.FIO_ADDRESS]()
      return
    }

    this.setState({
      walletAddresses
    })
  }

  componentDidMount () {
    this.fetchData()

    this.willFocusSubscription = this.props.navigation.addListener('willFocus', () => {
      this.fetchData()
    })
  }

  componentWillUnmount () {
    this.willFocusSubscription && this.willFocusSubscription.remove()
  }

  getAddressFromWallet = async (wallet: EdgeCurrencyWallet) => {
    try {
      const receiveAddress = await wallet.getReceiveAddress()
      const fioNames = await wallet.otherMethods.fioAction('getFioNames', { fioPublicKey: receiveAddress.publicAddress })
      return fioNames
    } catch (e) {
      return null
    }
  }

  onPress = (fioAddress: string, expirationValue: string) => {
    this.props.setFioAddress(fioAddress, expirationValue)
    this.props.goToScene(Constants.FIO_ADDRESS_DETAILS, { fioAddress, expirationValue })
  }

  render () {
    const { goToScene } = this.props
    const { walletAddresses } = this.state

    return (
      <SafeAreaView>
        <Gradient style={styles.gradient} />
        <ScrollView style={styles.list}>
          {walletAddresses &&
            walletAddresses.map(walletAddress => {
              const { wallet, addresses } = walletAddress
              return <FioAddressItem key={`${wallet.name}-item`} wallet={wallet} addresses={addresses} onFioAddressPress={this.onPress} />
            })}
        </ScrollView>
        <View style={styles.view}>
          <T>{s.strings.fio_address_first_screen_end}</T>
        </View>
        <View style={styles.button}>
          <Button onPress={() => goToScene(Constants.FIO_ADDRESS_REGISTER)} style={styles.toggleButton} underlayColor={styles.underlay.color}>
            <Button.Center>
              <Button.Text>
                <T>{s.strings.fio_address_list_screen_button_register}</T>
              </Button.Text>
            </Button.Center>
          </Button>
        </View>
      </SafeAreaView>
    )
  }
}
