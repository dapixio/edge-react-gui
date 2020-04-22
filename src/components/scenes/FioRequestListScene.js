// @flow

import type { EdgeDenomination } from 'edge-core-js'
import React, { Component } from 'react'
import { Alert, FlatList, TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import slowlog from 'react-native-slowlog'
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view'

import * as Constants from '../../constants/indexConstants'
import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import type { ExchangeRatesState } from '../../modules/ExchangeRates/reducer'
import FioRequestRow from '../../modules/FioRequest/components/FioRequestRow'
import T from '../../modules/UI/components/FormattedText/index'
import { styles as requestListStyles } from '../../styles/scenes/FioRequestListStyle'
import styles from '../../styles/scenes/TransactionListStyle'
import type { FioRequest, GuiWallet } from '../../types/types'
import FullScreenLoader from '../common/FullScreenLoader'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'

const SCROLL_THRESHOLD = 0.5

export type State = {
  rejectLoading: boolean
}

export type StateProps = {
  wallets: { [walletId: string]: GuiWallet },
  loading: boolean,
  isoFiatCurrencyCode: string,
  fiatSymbol: string,
  displayDenominations: { [string]: EdgeDenomination },
  exchangeRates: ExchangeRatesState,
  fioRequestsPending: FioRequest[],
  fioRequestsSent: FioRequest[],
  isConnected: boolean
}

export type DispatchProps = {
  getFioRequestsPending: () => Promise<void>,
  getFioRequestsSent: () => Promise<void>,
  fioRejectRequest: (fioRequestId: string, payerFioAddress: string, cb: Function) => Promise<void>,
  removeFioPendingRequest: (requestId: string) => void
}

type Props = StateProps & DispatchProps

export class FioRequestList extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      rejectLoading: false
    }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  componentDidMount = () => {
    this.props.getFioRequestsPending()
    this.props.getFioRequestsSent()
  }

  closeRow = (rowMap: { [string]: SwipeRow }, rowKey: string) => {
    if (rowMap[rowKey]) {
      rowMap[rowKey].closeRow()
    }
  }

  rejectFioRequest = (rowMap: { [string]: SwipeRow }, rowKey: string, requestId: string, payerFioAddress: string) => {
    if (!this.props.isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    this.setState({ rejectLoading: true })
    this.props.fioRejectRequest(`${requestId}`, payerFioAddress, (e: Error | null) => {
      if (!e) {
        this.props.removeFioPendingRequest(requestId)
        this.closeRow(rowMap, rowKey)
      }
      this.setState({ rejectLoading: false })
    })
  }

  rejectRow = (rowMap: { [string]: SwipeRow }, rowKey: string, requestId: string, payerFioAddress: string) => {
    Alert.alert(
      s.strings.fio_reject_request_title,
      s.strings.fio_reject_request_message,
      [
        {
          text: s.strings.string_cancel_cap,
          onPress: () => this.closeRow(rowMap, rowKey),
          style: 'cancel'
        },
        { text: s.strings.fio_reject_request_yes, onPress: () => this.rejectFioRequest(rowMap, rowKey, requestId, payerFioAddress) }
      ],
      { cancelable: false }
    )
  }

  fiatAmount = (currencyCode: string, amount: string): string => {
    const { exchangeRates, isoFiatCurrencyCode } = this.props
    const rateKey = `${currencyCode}_${isoFiatCurrencyCode}`
    const fiatPerCrypto = exchangeRates[rateKey] ? exchangeRates[rateKey] : 0
    const amountToMultiply = parseFloat(amount)

    return intl.formatNumber(fiatPerCrypto * amountToMultiply, { toFixed: 2 }) || '0'
  }

  headerRowUsingTitle = (sectionObj: { section: { title: string } }) => {
    return (
      <View style={styles.singleDateArea}>
        <View style={styles.leftDateArea}>
          <T style={styles.formattedDate}>{sectionObj.section.title}</T>
        </View>
      </View>
    )
  }

  selectRequest = (fioRequest: FioRequest) => {
    if (!this.props.isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    const { wallets } = this.props
    for (const walletKey: string of Object.keys(wallets)) {
      if (wallets[walletKey].currencyCode.toLowerCase() === fioRequest.content.chain_code.toLowerCase()) {
        Actions[Constants.FIO_PENDING_REQUEST_DETAILS]({ selectedFioPendingRequest: fioRequest })
        return
      }
    }
    showError(`${s.strings.err_token_not_in_wallet_title}. ${s.strings.err_token_not_in_wallet_msg}`)
  }

  selectSentRequest = (fioRequest: FioRequest) => {
    if (!this.props.isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    Actions[Constants.FIO_SENT_REQUEST_DETAILS]({ selectedFioSentRequest: fioRequest })
  }

  pendingRequestHeaders = () => {
    const { fioRequestsPending } = this.props
    const headers: { title: string, data: FioRequest[] }[] = []
    let requestsInSection: FioRequest[] = []
    let previousTimestamp = 0
    let previousTitle = ''
    if (fioRequestsPending) {
      fioRequestsPending.forEach((fioRequest, i) => {
        if (i === 0) {
          requestsInSection = []
          previousTimestamp = fioRequest.time_stamp
        }
        if (i > 0 && intl.formatExpDate(new Date(previousTimestamp)) !== intl.formatExpDate(new Date(fioRequest.time_stamp))) {
          headers.push({ title: previousTitle, data: requestsInSection })
          requestsInSection = []
        }
        requestsInSection.push(fioRequest)
        previousTimestamp = fioRequest.time_stamp
        previousTitle = intl.formatExpDate(new Date(fioRequest.time_stamp), true)
      })
      headers.push({ title: previousTitle, data: requestsInSection })
    }

    return headers
  }

  listKeyExtractor (item: FioRequest) {
    return item.fio_request_id.toString()
  }

  renderPending = (itemObj: { item: FioRequest, index: number }) => {
    const { item: fioRequest, index } = itemObj
    const isLastOfDate =
      index + 1 === this.props.fioRequestsPending.length ||
      (index > 0 &&
        intl.formatExpDate(new Date(this.props.fioRequestsPending[index + 1].time_stamp), true) !== intl.formatExpDate(new Date(fioRequest.time_stamp), true))
    return (
      <FioRequestRow
        fioRequest={fioRequest}
        isLastOfDate={isLastOfDate}
        onSelect={this.selectRequest}
        fiatSymbol={this.props.fiatSymbol}
        fiatAmount={this.fiatAmount}
        displayDenominations={this.props.displayDenominations}
      />
    )
  }

  renderSent = (itemObj: { item: FioRequest, index: number }) => {
    const { item: fioRequest, index } = itemObj
    const isHeaderRow =
      index === 0 ||
      (index > 0 &&
        intl.formatExpDate(new Date(this.props.fioRequestsSent[index - 1].time_stamp), true) !== intl.formatExpDate(new Date(fioRequest.time_stamp), true))
    const isLastOfDate =
      index + 1 === this.props.fioRequestsSent.length ||
      (index > 0 &&
        intl.formatExpDate(new Date(this.props.fioRequestsSent[index + 1].time_stamp), true) !== intl.formatExpDate(new Date(fioRequest.time_stamp), true))
    return (
      <FioRequestRow
        fioRequest={fioRequest}
        onSelect={this.selectSentRequest}
        isSent={true}
        isHeaderRow={isHeaderRow}
        isLastOfDate={isLastOfDate}
        fiatSymbol={this.props.fiatSymbol}
        fiatAmount={this.fiatAmount}
        displayDenominations={this.props.displayDenominations}
      />
    )
  }

  renderHiddenItem = (rowObj: { item: FioRequest }, rowMap: { [string]: SwipeRow }) => {
    return (
      <View style={requestListStyles.rowBack}>
        <TouchableOpacity
          style={[requestListStyles.backRightBtn, requestListStyles.backRightBtnRight]}
          onPress={_ => this.rejectRow(rowMap, rowObj.item.fio_request_id.toString(), rowObj.item.fio_request_id, rowObj.item.payer_fio_address)}
        >
          <T style={requestListStyles.backTextWhite}>{s.strings.swap_terms_reject_button}</T>
        </TouchableOpacity>
      </View>
    )
  }

  render () {
    const { loading, fioRequestsPending, fioRequestsSent } = this.props
    const { rejectLoading } = this.state

    return (
      <SceneWrapper>
        {(rejectLoading || loading) && <FullScreenLoader />}
        <View style={requestListStyles.scene}>
          <View style={requestListStyles.row}>
            <View style={requestListStyles.listContainer}>
              <T style={requestListStyles.listTitle}>{s.strings.fio_pendingrequest}</T>
            </View>
            {!loading && !fioRequestsPending.length ? (
              <View style={requestListStyles.emptyListContainer}>
                <T style={requestListStyles.text}>{s.strings.fio_no_requests_label}</T>
              </View>
            ) : null}
            <View style={requestListStyles.container}>
              <SwipeListView
                useSectionList
                sections={this.pendingRequestHeaders()}
                renderItem={this.renderPending}
                keyExtractor={this.listKeyExtractor}
                renderHiddenItem={this.renderHiddenItem}
                renderSectionHeader={this.headerRowUsingTitle}
                rightOpenValue={requestListStyles.swipeRow.right}
                disableRightSwipe={true}
              />
            </View>
          </View>
          <View style={requestListStyles.row}>
            <View style={requestListStyles.listContainer}>
              <T style={requestListStyles.listTitle}>{s.strings.fio_sentrequest}</T>
            </View>
            {!loading && !fioRequestsSent.length ? (
              <View style={requestListStyles.emptyListContainer}>
                <T style={requestListStyles.text}>{s.strings.fio_no_requests_label}</T>
              </View>
            ) : null}
            <View style={requestListStyles.scrollView}>
              <View style={requestListStyles.container}>
                <View style={requestListStyles.requestsWrap}>
                  <FlatList
                    style={styles.transactionsScrollWrap}
                    data={fioRequestsSent}
                    renderItem={this.renderSent}
                    initialNumToRender={fioRequestsSent ? fioRequestsSent.length : 0}
                    onEndReachedThreshold={SCROLL_THRESHOLD}
                    keyExtractor={item => item.fio_request_id.toString()}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </SceneWrapper>
    )
  }
}
