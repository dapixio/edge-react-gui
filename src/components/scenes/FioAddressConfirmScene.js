// @flow

import { Scene } from 'edge-components'
import { type EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../constants/indexConstants'
import { FIO_WALLET_TYPE } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import ABSlider from '../../modules/UI/components/Slider/index.js'
import { MaterialInput } from '../../styles/components/FormFieldStyles.js'
import styles from '../../styles/scenes/FioAddressConfirmStyle'
import type { CheckConnectivityProps } from '../../types/types'
import { getFeeDisplayed } from '../../util/utils'
import { FormFieldSelect } from '../common/FormFieldSelect.js'
import { showError } from '../services/AirshipInstance'

export type State = {
  walletAddresses: Array<Object>,
  selectedWallet: Object | null,
  fee: number | null,
  displayFee: number | null,
  balance: number | null,
  sliderDisabled: boolean | false,
  loading: boolean | false
}

export type StateProps = {
  fioAddressName: string,
  fioWallets: EdgeCurrencyWallet[],
  account: any
}

export type DispatchProps = {
  createCurrencyWallet: (walletName: string, walletType: string) => any,
  changeConfirmSelectedWallet: (selectedWallet: EdgeCurrencyWallet | null, expiration: Date, fee_collected: number) => any
}

type Props = StateProps & DispatchProps & CheckConnectivityProps

export class FioAddressConfirmScene extends Component<Props, State> {
  state: State = {
    walletAddresses: [],
    selectedWallet: null,
    fee: null,
    displayFee: null,
    balance: null,
    sliderDisabled: false,
    loading: false
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

    this.setState({
      walletAddresses
    })
  }

  async componentDidMount () {
    this.fetchData()
    const { fioWallets } = this.props
    if (fioWallets.length === 0) {
      const wallet: EdgeCurrencyWallet | null = await this.createFioWallet()
      await this.setState({
        selectedWallet: {
          value: wallet ? wallet.name : 'no wallet name',
          wallet
        }
      })
      this.setFeeAndBalance()
    } else if (fioWallets.length > 0) {
      await this.setState({
        selectedWallet: {
          value: fioWallets[0].name,
          wallet: fioWallets[0]
        }
      })
      this.setFeeAndBalance()
    }
  }

  toggleLoading (loading: boolean = false) {
    this.setState({ loading })
  }

  createFioWallet = async () => {
    const { createCurrencyWallet } = this.props
    try {
      const wallet = await createCurrencyWallet(s.strings.fio_address_register_default_fio_wallet_name, FIO_WALLET_TYPE)
      return wallet
    } catch (e) {
      return null
    }
  }

  handleFioWalletChange = (value: string, index: number, data: Object) => {
    this.setState({
      selectedWallet: data[index]
    })
    this.setFeeAndBalance()
  }

  saveFioAddress = async () => {
    const { selectedWallet, fee } = this.state
    if (selectedWallet) {
      const { wallet } = selectedWallet
      const { fioAddressName } = this.props
      try {
        await wallet.otherMethods.fioAction('registerFioAddress', {
          fioAddress: fioAddressName,
          maxFee: fee
        })
        wallet.otherMethods.setFioAddress(fioAddressName)
        this.confirmSelected()
      } catch (e) {
        showError('Error registering address')
      }
    }
    this.toggleLoading()
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

  toggleButton = () => {
    const { displayFee, balance } = this.state
    if (displayFee !== null && balance !== null) {
      if (displayFee > balance) {
        this.setState({
          sliderDisabled: true
        })
      }
    }
  }

  setFeeAndBalance = async () => {
    await this.setFee()
    await this.setBalance()
    this.toggleButton()
  }

  setFee = async () => {
    const { selectedWallet } = this.state
    if (selectedWallet) {
      const { wallet } = selectedWallet
      try {
        const obj = await wallet.otherMethods.fioAction('getFee', { endPoint: 'register_fio_address', fioAddress: '' })
        if (obj) {
          if (obj.fee) {
            const displayFee = obj.fee / Constants.BILLION
            this.setState({
              fee: obj.fee,
              displayFee
            })
            return displayFee
          }
        }
      } catch (e) {
        return 0
      }
    }
    return 0
  }

  setBalance = async () => {
    const { selectedWallet } = this.state
    if (selectedWallet) {
      const { wallet } = selectedWallet
      try {
        const obj = await wallet.otherMethods.fioAction('getFioBalance', {})

        if (obj) {
          if (obj.balance || obj.balance === 0) {
            const newBalance = obj.balance / Constants.BILLION
            this.setState({
              balance: newBalance
            })
            return newBalance
          }
        }
      } catch (e) {
        this.setState({
          balance: 0
        })
        return 0
      }
    }
  }

  confirmSelected = async () => {
    const { selectedWallet } = this.state
    const { changeConfirmSelectedWallet } = this.props
    if (!this.props.checkConnectivity()) return
    if (selectedWallet) {
      const { wallet } = selectedWallet
      const { fioAddressName } = this.props
      try {
        const receiveAddress = await wallet.getReceiveAddress()
        const fioNames = await wallet.otherMethods.fioAction('getFioNames', { fioPublicKey: receiveAddress.publicAddress })

        let name = ''
        if (fioNames) {
          if (fioNames.fio_addresses) {
            name = fioNames.fio_addresses.find(item => item.fio_address === fioAddressName)
            if (name) {
              if (name.expiration) {
                changeConfirmSelectedWallet(selectedWallet, new Date(name.expiration), 300000)
                setTimeout(() => Actions[Constants.FIO_ADDRESS_DETAILS]())
              }
            }
          }
        }
      } catch (e) {
        //
      }
    } else {
      changeConfirmSelectedWallet(selectedWallet, new Date(), 300000)
      setTimeout(() => Actions[Constants.FIO_ADDRESS_DETAILS]())
    }
  }

  onNextPress = () => {
    const { selectedWallet } = this.state
    if (selectedWallet) {
      if (!this.props.checkConnectivity()) return
      this.toggleLoading(true)
      this.saveFioAddress()
    }
  }

  render () {
    const { fioAddressName, fioWallets } = this.props
    const { selectedWallet, displayFee, balance, loading } = this.state

    const MaterialInputStyle = {
      ...MaterialInput,
      container: {
        ...MaterialInput.container,
        width: '100%'
      }
    }

    return (
      <SafeAreaView>
        <Gradient style={styles.scene}>
          <Gradient style={styles.gradient} />

          <View style={{ paddingTop: 30, paddingLeft: 6, paddingRight: 6 }}>
            <T style={styles.title}>{s.strings.fio_address_confirm_screen_label}</T>
            <T style={styles.titleLarge}>{fioAddressName}</T>
            <View style={{ paddingTop: 20 }} />
            <T style={styles.title}>{s.strings.fio_address_confirm_screen_registration_label}</T>
            <T style={styles.title}>
              {displayFee ? getFeeDisplayed(displayFee) : '0'} {balance ? s.strings.fio_address_confirm_screen_fio_label : ''}
            </T>
            <View style={{ paddingTop: 20 }} />
            <T style={styles.title}>{s.strings.fio_address_confirm_screen_balance_label}</T>
            <T style={balance && displayFee !== null && displayFee <= balance ? styles.title : styles.titleDisabled}>
              {balance ? balance.toFixed(2) : '0'} {balance ? s.strings.fio_address_confirm_screen_fio_label : ''}
            </T>
          </View>
          {fioWallets && fioWallets.length > 1 && (
            <View style={{ paddingTop: 54, paddingLeft: 20, paddingRight: 20 }}>
              <View style={styles.select}>
                <FormFieldSelect
                  style={MaterialInputStyle}
                  onChangeText={this.handleFioWalletChange}
                  label={s.strings.fio_address_confirm_screen_select_wallet_label}
                  value={selectedWallet ? selectedWallet.value : ''}
                  data={fioWallets.map(wallet => ({
                    value: wallet.name ? wallet.name : 'no wallet name',
                    wallet
                  }))}
                />
              </View>
            </View>
          )}
          <View style={{ paddingTop: 54, paddingLeft: 20, paddingRight: 20 }}>
            <Scene.Footer style={styles.footer}>
              <ABSlider
                forceUpdateGuiCounter={false}
                resetSlider={false}
                parentStyle={styles.sliderStyle}
                onSlidingComplete={this.onNextPress}
                sliderDisabled={!balance || (balance !== null && displayFee !== null && displayFee > balance) || !selectedWallet}
                showSpinner={loading}
                disabledText={
                  selectedWallet
                    ? s.strings.fio_address_confirm_screen_disabled_slider_label
                    : s.strings.fio_address_confirm_screen_disabled_slider_nowallet_label
                }
              />
            </Scene.Footer>
          </View>
        </Gradient>
      </SafeAreaView>
    )
  }
}
