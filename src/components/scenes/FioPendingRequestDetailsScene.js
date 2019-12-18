// @flow

import { bns } from 'biggystring'
import { FormField } from 'edge-components'
import type { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'
import React, { Component } from 'react'
import { Alert, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import type { ExchangeRatesState } from '../../modules/ExchangeRates/reducer'
import { getExchangeDenomination } from '../../modules/Settings/selectors.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import { CryptoExchangeFlipInputWrapperComponent } from '../../modules/UI/components/FlipInput/CryptoExchangeFlipInputWrapperComponent.js'
import type { ExchangedFlipInputAmounts } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2'
import T from '../../modules/UI/components/FormattedText/index'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import { MaterialInput } from '../../styles/components/FormFieldStyles.js'
import { styles as CryptoExchangeSceneStyle } from '../../styles/scenes/CryptoExchangeSceneStyles.js'
import styles from '../../styles/scenes/FioPendingRequestDetailsStyle.js'
import type { State } from '../../types/reduxTypes'
import type { GoToSceneProps, GuiWallet } from '../../types/types'
import { emptyCurrencyInfo } from '../../types/types'
import { getMonthName } from '../../util/utils.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { WalletListModal } from '../modals/WalletListModal'
import { Airship } from '../services/AirshipInstance'

export type FioPendingRequestDetailsStateProps = {
  fromWallet: GuiWallet,
  fromButtonText: string,
  fromFiatToCrypto: number,
  toWallet: GuiWallet,

  // The following props are used to populate the confirmation modal
  fromCurrencyCode: string,
  fromCurrencyIcon: string,
  fromDisplayAmount: string,
  toCurrencyCode: string,

  // Number of times To and From wallets were flipped
  wallets: { [string]: GuiWallet },
  supportedWalletTypes: Array<Object>,
  state: State,
  exchangeRates: ExchangeRatesState,

  fioWalletByAddress: EdgeCurrencyWallet | null,
  selectedFioPendingRequest: any,
  isoFiatCurrencyCode: any
}

export type FioPendingRequestDetailsDispatchProps = {
  onSelectWallet: (walletId: string, currencyCode: string) => void,
  openModal(data: 'from' | 'to'): mixed,
  fioAcceptRequest: (
    fioWalletByAddress: EdgeCurrencyWallet,
    pendingRequest: Object,
    payerPublicAddress: string,
    txId: string,
    notes?: string,
    fee: number,
    cb: Function
  ) => any,
  createCurrencyWallet: (walletType: string, currencyCode: string) => void,
  getFioWalletByFioAddress: string => void
}

type Props = FioPendingRequestDetailsStateProps & FioPendingRequestDetailsDispatchProps & GoToSceneProps

type LocalState = {
  whichWallet: string, // Which wallet selector dropdown was tapped
  whichWalletFocus: string, // Which wallet FlipInput was last focused and edited
  fromExchangeAmount: string,
  forceUpdateGuiCounter: number,
  memo: string,
  focused: boolean
}

export class FioPendingRequestDetailsComponent extends Component<Props, LocalState> {
  fromAmountNative: string
  fromAmountDisplay: string

  constructor (props: Props) {
    super(props)
    const newState: LocalState = {
      whichWallet: Constants.TO,
      whichWalletFocus: Constants.TO,
      forceUpdateGuiCounter: 0,
      fromExchangeAmount: '',
      memo: this.props.selectedFioPendingRequest.content.memo,
      focused: false
    }
    this.state = newState
  }

  componentDidMount (): void {
    this.props.getFioWalletByFioAddress(this.props.selectedFioPendingRequest.payer_fio_address)
  }

  fiatAmount = (currencyCode: string, amount: string) => {
    const { exchangeRates, isoFiatCurrencyCode } = this.props
    let fiatPerCrypto
    if (currencyCode === Constants.FIO_STR) {
      fiatPerCrypto = 1
    } else {
      const rateKey = `${currencyCode}_${isoFiatCurrencyCode}`
      fiatPerCrypto = exchangeRates[rateKey] ? exchangeRates[rateKey] : 0
    }
    const amountToMultiply = parseFloat(amount)

    return (fiatPerCrypto * amountToMultiply).toFixed(2)
  }

  amountField = (amount: string, currencyCode: string, cryptoSymbol: string, currencySymbol: string) => {
    return (
      <View style={styles.row}>
        <T style={styles.title}>
          Amount: {amount} {cryptoSymbol} ({currencySymbol}
          {this.fiatAmount(currencyCode, amount)})
        </T>
      </View>
    )
  }

  requestedField = (payee: string) => {
    return (
      <View style={styles.row}>
        <T style={styles.title}>Request from</T>
        <T style={styles.title}>{payee}</T>
      </View>
    )
  }

  dateField = (date: Date) => {
    return (
      <View style={styles.row}>
        <T style={styles.title}>Date</T>
        <T style={styles.title}>{getMonthName(date.getMonth(), true) + ' ' + date.getDate() + ', ' + date.getFullYear()}</T>
      </View>
    )
  }

  launchFromWalletSelector = () => {
    this.props.openModal('from')
    this.renderDropUp(Constants.FROM)
    this.setState({
      whichWallet: Constants.FROM
    })
  }

  focusFromWallet = () => {
    this.setState({
      whichWallet: Constants.FROM,
      whichWalletFocus: Constants.FROM
    })
  }

  fromAmountChanged = (amounts: ExchangedFlipInputAmounts) => {
    this.fromAmountNative = amounts.nativeAmount
    this.fromAmountDisplay = amounts.exchangeAmount
  }

  sendCrypto = async () => {
    const { fioWalletByAddress, selectedFioPendingRequest: pendingRequest } = this.props
    if (!fioWalletByAddress) return
    const paymentDenom = getExchangeDenomination(this.props.state, pendingRequest.content.token_code)
    let nativeAmount = bns.mul(pendingRequest.content.amount, paymentDenom.multiplier)
    nativeAmount = bns.toFixed(nativeAmount, 0, 0)
    const guiMakeSpendInfo = {
      memo: this.state.memo,
      fioAddress: pendingRequest.payee_fio_address,
      currencyCode: pendingRequest.content.token_code,
      nativeAmount: nativeAmount,
      publicAddress: pendingRequest.content.payee_public_address,
      lockInputs: true,
      beforeTransaction: async () => {
        try {
          const getFeeResult = await fioWalletByAddress.otherMethods.fioAction('getFee', {
            endPoint: 'record_obt_data',
            fioAddress: pendingRequest.payer_fio_address
          })
          if (getFeeResult.fee) {
            Alert.alert(s.strings.fio_no_bundled_err_title, s.strings.fio_no_bundled_err_msg)
            throw new Error(s.strings.fio_no_bundled_err_title)
          }
        } catch (e) {
          Alert.alert(s.strings.fio_no_bundled_err_title, s.strings.fio_no_bundled_err_msg)
          throw e
        }
      },
      onDone: (error: Error | null, edgeTransaction?: EdgeTransaction) => {
        if (error) {
          setTimeout(() => {
            Alert.alert(s.strings.create_wallet_account_error_sending_transaction)
          }, 750)
        } else if (edgeTransaction) {
          let payerWalletAddress = ''
          if (edgeTransaction.otherParams) {
            if (edgeTransaction.otherParams.from && edgeTransaction.otherParams.from.length > 0) {
              payerWalletAddress = edgeTransaction.otherParams.from[0]
            }
          }
          this.props.fioAcceptRequest(
            fioWalletByAddress,
            pendingRequest,
            payerWalletAddress,
            edgeTransaction.txid,
            edgeTransaction.metadata ? edgeTransaction.metadata.notes : this.state.memo,
            0,
            () => {
              Actions.pop()
              Actions.pop()
              Actions.replace(Constants.TRANSACTION_DETAILS, { edgeTransaction: edgeTransaction })
            }
          )
        }
      }
    }

    this.props.goToScene(Constants.SEND_CONFIRMATION, { guiMakeSpendInfo })
  }

  renderButton = () => {
    if (this.props.fromCurrencyCode !== '') {
      return (
        <PrimaryButton onPress={() => this.sendCrypto()}>
          <PrimaryButton.Text>{s.strings.string_next_capitalized}</PrimaryButton.Text>
        </PrimaryButton>
      )
    }
    return null
  }

  renderDropUp = (whichWallet: string) => {
    const { onSelectWallet, fromCurrencyCode, fromWallet, toCurrencyCode, toWallet, wallets } = this.props

    let excludedCurrencyCode = '' // should allow for multiple excluded currencyCodes
    // some complex logic because 'toCurrencyCode/fromCurrencyCode'
    // can be denomination (needs to change to actual currencyCode)
    if (whichWallet === Constants.TO) {
      if (fromWallet) {
        if (fromWallet.enabledTokens.length > 1) {
          // could be token
          excludedCurrencyCode = fromCurrencyCode
        } else {
          excludedCurrencyCode = fromWallet.currencyCode
        }
      }
    } else {
      if (toWallet) {
        if (toWallet.enabledTokens.length > 1) {
          // could be token
          excludedCurrencyCode = toCurrencyCode
        } else {
          excludedCurrencyCode = toWallet.currencyCode
        }
      }
    }
    const walletCurrencyCodes = []
    const allowedWallets = []
    for (const id in wallets) {
      const wallet = wallets[id]
      if (excludedCurrencyCode === wallet.currencyCode && excludedCurrencyCode === 'ETH' && wallet.enabledTokens.length > 0) {
        walletCurrencyCodes.push(wallet.currencyCode)
        if (wallet.receiveAddress && wallet.receiveAddress.publicAddress) {
          if (wallet.currencyCode === this.props.selectedFioPendingRequest.content.token_code) {
            allowedWallets.push(wallets[id])
          }
        }
      }
      if (excludedCurrencyCode !== wallet.currencyCode) {
        walletCurrencyCodes.push(wallet.currencyCode)
        if (wallet.receiveAddress && wallet.receiveAddress.publicAddress) {
          if (wallet.currencyCode === this.props.selectedFioPendingRequest.content.token_code) {
            allowedWallets.push(wallets[id])
          }
        }
      }
    }
    const supportedWalletTypes = []
    for (let i = 0; i < this.props.supportedWalletTypes.length; i++) {
      const swt = this.props.supportedWalletTypes[i]
      if (!walletCurrencyCodes.includes(swt.currencyCode) && swt.currencyCode !== 'EOS' && excludedCurrencyCode !== swt.currencyCode) {
        supportedWalletTypes.push(swt)
      }
    }
    const filterWalletId = whichWallet === Constants.TO ? fromWallet.id : toWallet.id
    const filterWalletCurrencyCode = whichWallet === Constants.TO ? fromCurrencyCode : toCurrencyCode
    Airship.show(bridge => (
      <WalletListModal
        bridge={bridge}
        wallets={allowedWallets}
        type={whichWallet}
        existingWalletToFilterId={filterWalletId}
        existingWalletToFilterCurrencyCode={filterWalletCurrencyCode}
        supportedWalletTypes={supportedWalletTypes}
        excludedCurrencyCode={[]}
        showWalletCreators={whichWallet === Constants.TO}
        state={this.props.state}
        headerTitle={whichWallet === Constants.TO ? s.strings.select_recv_wallet : s.strings.fio_src_wallet}
        excludedTokens={[]}
        noWalletCodes={[]}
        disableZeroBalance={false}
      />
    )).then((response: any) => {
      if (response) {
        if (response.id) {
          onSelectWallet(response.id, response.currencyCode)
          return
        }
        this.props.createCurrencyWallet(response.value, response.currencyCode)
      }
    })
    return null
  }

  render () {
    const materialStyle = MaterialInput
    materialStyle.tintColor = 'white'
    materialStyle.baseColor = 'white'
    const isFromFocused = this.state.whichWalletFocus === Constants.FROM

    return (
      <SceneWrapper>
        <SafeAreaView>
          <View>
            {this.amountField(
              this.props.selectedFioPendingRequest.content.amount,
              this.props.selectedFioPendingRequest.content.token_code,
              this.props.selectedFioPendingRequest.content.token_code,
              '$'
            )}
          </View>
          <View>{this.requestedField(this.props.selectedFioPendingRequest.payee_fio_address)}</View>
          <View>{this.dateField(new Date(this.props.selectedFioPendingRequest.time_stamp))}</View>
          <View style={styles.memostyle}>
            <FormField style={materialStyle} label="Memo" onChangeText={text => this.setState({ memo: text })} value={this.state.memo} placeholder="Memo" />
          </View>
          <View style={styles.row2}>
            <View style={styles.line} />
          </View>
          <View style={CryptoExchangeSceneStyle.shim} />
          <View style={styles.row3}>
            {
              <CryptoExchangeFlipInputWrapperComponent
                style={CryptoExchangeSceneStyle.flipWrapper}
                guiWallet={this.props.fromWallet}
                buttonText={this.props.fromButtonText}
                currencyLogo={this.props.fromCurrencyIcon}
                primaryCurrencyInfo={emptyCurrencyInfo}
                secondaryCurrencyInfo={emptyCurrencyInfo}
                fiatPerCrypto={this.props.fromFiatToCrypto}
                overridePrimaryExchangeAmount={this.state.fromExchangeAmount}
                forceUpdateGuiCounter={this.state.forceUpdateGuiCounter}
                launchWalletSelector={this.launchFromWalletSelector}
                onCryptoExchangeAmountChanged={this.fromAmountChanged}
                isFocused={isFromFocused}
                focusMe={this.focusFromWallet}
                onNext={() => {}}
              />
            }
          </View>
          <View style={CryptoExchangeSceneStyle.shim} />
          <View style={styles.row3}>
            <View style={CryptoExchangeSceneStyle.actionButtonContainer}>{this.renderButton()}</View>
          </View>
          <View style={CryptoExchangeSceneStyle.shim} />
        </SafeAreaView>
      </SceneWrapper>
    )
  }
}
