// @flow

import type { EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { TouchableHighlight, View } from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { connect } from 'react-redux'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../../../components/services/ThemeContext'
import * as intl from '../../../locales/intl.js'
import s from '../../../locales/strings'
import { type RootState } from '../../../types/reduxTypes'
import type { FioRequest } from '../../../types/types'
import { getFiatSymbol } from '../../../util/utils'
import { getDisplayDenomination } from '../../Settings/selectors'
import T from '../../UI/components/FormattedText/FormattedText.ui.js'
import { getSelectedWallet } from '../../UI/selectors'
import { isRejectedFioRequest, isSentFioRequest } from '../util'

type OwnProps = {
  fioRequest: FioRequest,
  onSelect: FioRequest => void,
  isLastOfDate?: boolean,
  isSent?: boolean
}

type StateProps = {
  fiatSymbol: string,
  fiatAmount: string,
  displayDenomination: EdgeDenomination
}

type Props = OwnProps & StateProps & ThemeProps

class FioRequestRow extends React.PureComponent<Props> {
  static defaultProps: OwnProps = {
    fioRequest: {
      fio_request_id: '',
      content: {
        payee_public_address: '',
        amount: '',
        token_code: '',
        chain_code: '',
        memo: ''
      },
      payee_fio_address: '',
      payer_fio_address: '',
      payer_fio_public_key: '',
      status: '',
      time_stamp: ''
    },
    onSelect: () => {},
    isLastOfDate: false,
    isSent: false
  }

  onSelect = () => {
    this.props.onSelect(this.props.fioRequest)
  }

  requestedTimeAndMemo = (time: Date, memo: string) => {
    const styles = getStyles(this.props.theme)
    return (
      <T ellipsizeMode="tail" numberOfLines={1} style={[styles.requestPendingTime, styles.requestTime]}>
        {intl.formatTime(time)}
        {memo ? ` - ${memo}` : ''}
      </T>
    )
  }

  currencyField = (amount: string, status: string) => {
    const styles = getStyles(this.props.theme)
    let fieldStyle = styles.requestPartialConfirmation
    if (status && isSentFioRequest(status)) {
      fieldStyle = styles.requestDetailsReceivedTx
    }
    if (status && isRejectedFioRequest(status)) {
      fieldStyle = styles.requestDetailsSentTx
    }

    const symbol = this.props.displayDenomination.symbol || ''

    return (
      <T style={[styles.requestAmount, fieldStyle]}>
        {symbol} {amount}
      </T>
    )
  }

  requestedField = () => {
    const { displayDenomination, fioRequest, theme } = this.props
    const styles = getStyles(theme)
    const name = displayDenomination.name || fioRequest.content.token_code.toUpperCase()
    return (
      <T style={styles.requestPendingTime}>
        {s.strings.title_fio_requested} {name}
      </T>
    )
  }

  showStatus = (status: string) => {
    const styles = getStyles(this.props.theme)

    let statusStyle = styles.requestPartialConfirmation
    let label = s.strings.fragment_wallet_unconfirmed
    if (isSentFioRequest(status)) {
      statusStyle = styles.requestDetailsReceivedTx
      label = s.strings.fragment_transaction_list_receive_prefix
    }
    if (isRejectedFioRequest(status)) {
      statusStyle = styles.requestPending
      label = s.strings.fio_reject_status
    }
    return <T style={[styles.requestPendingTime, statusStyle]}>{label}</T>
  }

  render() {
    const { fioRequest, isSent, isLastOfDate, displayDenomination, theme } = this.props
    const styles = getStyles(theme)
    if (!displayDenomination) return null

    return (
      <View key={fioRequest.fio_request_id.toString()} style={styles.singleTransactionWrap}>
        <TouchableHighlight
          onPress={this.onSelect}
          underlayColor={theme.secondaryButton}
          style={[styles.singleTransaction, { borderBottomWidth: isLastOfDate ? 0 : 1 }]}
        >
          <View style={styles.requestInfoWrap}>
            <View style={styles.requestLeft}>
              <FontAwesome name={isSent ? 'paper-plane' : 'history'} style={styles.icon} />
            </View>

            <View style={styles.requestRight}>
              <View style={[styles.requestDetailsRow, fioRequest.content.memo ? styles.requestDetailsRowMargin : null]}>
                <T style={styles.name}>{isSent ? fioRequest.payer_fio_address : fioRequest.payee_fio_address}</T>
                {this.currencyField(fioRequest.content.amount, isSent ? fioRequest.status : '')}
              </View>
              <View style={styles.requestDetailsRow}>
                {this.requestedTimeAndMemo(new Date(fioRequest.time_stamp), fioRequest.content.memo)}
                <T style={styles.requestFiat}>
                  {this.props.fiatSymbol} {this.props.fiatAmount}
                </T>
              </View>
              <View style={[styles.requestDetailsRow, styles.requestDetailsRowMargin]}>
                {isSent ? this.showStatus(fioRequest.status) : this.requestedField()}
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }
}
const emptyDisplayDenomination = { name: '', multiplier: '0' }

const getStyles = cacheStyles((theme: Theme) => ({
  singleTransaction: {
    height: theme.rem(5),
    marginBottom: theme.rem(0.0625),
    padding: theme.rem(1),
    paddingRight: theme.rem(1),
    paddingLeft: theme.rem(1)
  },
  singleTransactionWrap: {
    backgroundColor: theme.settingsRowBackground,
    flexDirection: 'column',
    flex: 1
  },
  singleDateArea: {
    backgroundColor: theme.settingsRowBackground,
    flex: 3,
    padding: theme.rem(0.175),
    paddingLeft: theme.rem(1),
    flexDirection: 'row',
    paddingRight: theme.rem(1.5)
  },
  leftDateArea: {
    flex: 1
  },
  formattedDate: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.875)
  },

  requestInfoWrap: {
    flex: 1,
    flexDirection: 'row',
    height: theme.rem(2.5)
  },
  requestLeft: {
    flexDirection: 'row'
  },
  requestLogo: {
    marginLeft: theme.rem(0.025),
    width: theme.rem(1.175),
    height: theme.rem(1.175)
  },
  icon: {
    marginTop: theme.rem(0.75),
    marginRight: theme.rem(0.625),
    color: theme.primaryText,
    fontSize: theme.rem(1.25)
  },
  name: {
    flex: 1,
    fontSize: theme.rem(0.875),
    color: theme.primaryText
  },
  requestRight: {
    flex: 1,
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  requestTime: {
    color: theme.secondaryText
  },
  requestPending: {
    color: theme.negativeText
  },
  requestAmount: {
    fontSize: theme.rem(0.875)
  },
  requestPartialConfirmation: {
    color: theme.warningText
  },
  requestDetailsRow: {
    flexDirection: 'row',
    width: '100%'
  },
  requestDetailsRowMargin: {
    marginBottom: theme.rem(0.125)
  },
  requestDetailsReceivedTx: {
    color: theme.textLink
  },
  requestDetailsSentTx: {
    color: theme.negativeText
  },
  requestFiat: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  requestPendingTime: {
    flex: 1,
    fontSize: theme.rem(0.75),
    color: theme.deactivatedText
  }
}))

const mapStateToProps = (state: RootState, ownProps: OwnProps) => {
  const { fioRequest } = ownProps
  const wallet = getSelectedWallet(state)
  if (!wallet) {
    return {
      displayDenomination: {},
      fiatSymbol: '',
      fiatAmount: ''
    }
  }
  let displayDenomination = emptyDisplayDenomination
  const tokenCode = fioRequest.content.token_code.toUpperCase()
  try {
    displayDenomination = getDisplayDenomination(state, tokenCode)
  } catch (e) {
    console.log('No denomination for this Token Code -', tokenCode)
  }
  const fiatSymbol = getFiatSymbol(wallet.fiatCurrencyCode)
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
  const exchangeRates = state.exchangeRates

  const rateKey = `${tokenCode}_${isoFiatCurrencyCode}`
  const fiatPerCrypto = exchangeRates[rateKey] ? exchangeRates[rateKey] : 0
  const amountToMultiply = parseFloat(fioRequest.content.amount)
  const fiatAmount = intl.formatNumber(fiatPerCrypto * amountToMultiply, { toFixed: 2 }) || '0'

  const out: StateProps = {
    displayDenomination,
    fiatSymbol,
    fiatAmount
  }
  return out
}

export const FioRequestRowConnector = connect(mapStateToProps, {})(withTheme(FioRequestRow))
