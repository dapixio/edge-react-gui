// @flow

import { bns } from 'biggystring'
import type { EdgeAccount } from 'edge-core-js/src/types/types'
import React, { Component } from 'react'
import { ActivityIndicator, Alert, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import ExchangeRate from '../../modules/UI/components/ExchangeRate/index.js'
import type { ExchangedFlipInputAmounts } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2'
import T from '../../modules/UI/components/FormattedText/index'
import { MaterialInput } from '../../styles/components/FormFieldStyles.js'
import { styles as CryptoExchangeSceneStyle } from '../../styles/scenes/CryptoExchangeSceneStyles.js'
import styles from '../../styles/scenes/FioRequestConfirmationStyle'
import type { CheckConnectivityProps, GuiCurrencyInfo } from '../../types/types'
import { FormFieldSelect } from '../common/FormFieldSelect'
import { SceneWrapper } from '../common/SceneWrapper'

export type FioRequestConfirmationProps = {
  exchangeSecondaryToPrimaryRatio: number,
  publicAddress: string,
  loading: boolean,
  primaryCurrencyInfo: GuiCurrencyInfo,
  secondaryCurrencyInfo: GuiCurrencyInfo,
  amounts: ExchangedFlipInputAmounts,
  fioModalData: any,
  allWallets: any,
  account: EdgeAccount
}

export type FioRequestConfirmationDispatchProps = {
  refreshReceiveAddressRequest: (walletId: string) => any,
  onSelectWallet: (walletId: string, currencyCode: string) => any
}

type Props = FioRequestConfirmationProps & FioRequestConfirmationDispatchProps & CheckConnectivityProps

type LocalState = {
  loading: boolean
}

export class FioRequestConfirmationComponent extends Component<Props, LocalState> {
  fioWallets = []
  selectedWallet: string
  selectedWalletID: string
  selectedWalletFioAddress: string

  constructor (props: Props) {
    super(props)
    this.state = {
      loading: false
    }
  }

  async componentDidMount () {
    if (this.props.allWallets) {
      const allWalletsArr: any = Object.values(this.props.allWallets)
      try {
        for (const item of allWalletsArr) {
          // allWalletsArr.forEach(async function (item, index, arr) {
          if (item.type === 'wallet:fio') {
            const engine = this.props.account.currencyWallets[item.id]
            const names = await engine.otherMethods.getFioAddress()
            if (names.length > 0) {
              for (const name of names) {
                this.fioWallets.push({ wallet: item, engine: 'engine', name: name })
              }
            }
          }
        }
      } catch (error) {}
      this.selectedWallet = this.fioWallets[0].wallet.name + ': ' + this.fioWallets[0].name
      this.selectedWalletID = this.fioWallets[0].wallet.id
      this.selectedWalletFioAddress = this.fioWallets[0].name
    }
  }

  onNextPress = async () => {
    const engine = this.props.account.currencyWallets[this.selectedWalletID]

    if (engine) {
      const val = bns.div(this.props.amounts.nativeAmount, this.props.primaryCurrencyInfo.exchangeDenomination.multiplier, 18)
      try {
        if (!this.props.checkConnectivity()) return
        this.setState({ loading: true })
        try {
          const getFeeRes = await engine.otherMethods.fioAction('getFee', { endPoint: 'new_funds_request', fioAddress: this.selectedWalletFioAddress })
          if (getFeeRes.fee) return Alert.alert(s.strings.fio_no_bundled_err_title, s.strings.fio_no_bundled_err_msg)
        } catch (e) {
          this.setState({ loading: false })
          return Alert.alert(s.strings.fio_no_bundled_err_title, s.strings.fio_no_bundled_err_msg)
        }
        await engine.otherMethods.fioAction('requestFunds', {
          payerFioAddress: this.props.fioModalData.fioAddress,
          payeeFioAddress: this.selectedWalletFioAddress,
          payeePublicAddress: this.props.publicAddress,
          amount: val,
          tokenCode: this.props.primaryCurrencyInfo.exchangeCurrencyCode,
          memo: this.props.fioModalData.memo,
          maxFee: 0
        })
        this.setState({ loading: false })
        await Alert.alert(s.strings.fio_reqiuest_ok_header, s.strings.fio_reqiuest_ok_body)
        Actions[Constants.TRANSACTION_LIST]()
      } catch (error) {
        this.setState({ loading: false })
        await Alert.alert(s.strings.fio_reqiuest_error_header, JSON.stringify(error.json.fields[0].error))
      }
    }
  }

  fiatAmount = (amount: string) => {
    const fiatPerCrypto = this.props.exchangeSecondaryToPrimaryRatio
    return (fiatPerCrypto * parseFloat(amount)).toFixed(2)
  }

  handleFioWalletChange = (something: string, index: number, data: any) => {
    this.selectedWalletID = this.fioWallets[index].wallet.id
    this.selectedWalletFioAddress = this.fioWallets[index].name
  }

  labelFromWallet = (item: any) => {
    return item.wallet.name + ': ' + item.name
  }

  render () {
    const { loading } = this.state
    const { primaryCurrencyInfo, secondaryCurrencyInfo, exchangeSecondaryToPrimaryRatio } = this.props
    if (!primaryCurrencyInfo || !secondaryCurrencyInfo) return null
    const finalvalue = bns.div(this.props.amounts.nativeAmount, primaryCurrencyInfo.displayDenomination.multiplier, 18)
    const val = bns.div(this.props.amounts.nativeAmount, primaryCurrencyInfo.exchangeDenomination.multiplier, 18)
    const fiat = this.fiatAmount(val)
    const style = CryptoExchangeSceneStyle
    const materialStyle = MaterialInput
    materialStyle.tintColor = 'white'
    materialStyle.baseColor = 'white'
    const MaterialInputStyle = {
      ...MaterialInput,
      container: {
        ...MaterialInput.container,
        width: '70%'
      }
    }
    return (
      <SceneWrapper>
        <View style={styles.exchangeRateContainer}>
          <ExchangeRate primaryInfo={primaryCurrencyInfo} secondaryInfo={secondaryCurrencyInfo} secondaryDisplayAmount={exchangeSecondaryToPrimaryRatio} />
        </View>
        <View style={styles.textContainer}>
          <T style={styles.text}>
            {s.strings.fio_request_amount} {finalvalue} {primaryCurrencyInfo.displayDenomination.name} ({secondaryCurrencyInfo.displayDenomination.symbol}
            {fiat})
          </T>
        </View>
        <View style={styles.textContainer}>
          <T style={styles.text}>{s.strings.fio_request_requesting_from}</T>
          <T style={styles.text}>{this.props.fioModalData.fioAddress}</T>
        </View>
        <View style={styles.selectContainer}>
          <FormFieldSelect
            style={MaterialInputStyle}
            onChangeText={this.handleFioWalletChange}
            label={s.strings.fio_address_confirm_screen_select_wallet_label}
            value={this.selectedWallet}
            labelExtractor={this.labelFromWallet}
            valueExtractor={this.labelFromWallet}
            data={this.fioWallets}
          />
        </View>
        <View style={styles.textContainer}>
          <T style={styles.text}>{s.strings.fio_request_memo}</T>
          <T style={styles.text}>{this.props.fioModalData.memo}</T>
        </View>
        <View style={styles.button}>
          <PrimaryButton onPress={this.onNextPress}>
            {loading ? <ActivityIndicator size={'small'} /> : <PrimaryButton.Text>{s.strings.string_next_capitalized}</PrimaryButton.Text>}
          </PrimaryButton>
        </View>
        <View style={style.shim} />
      </SceneWrapper>
    )
  }
}
