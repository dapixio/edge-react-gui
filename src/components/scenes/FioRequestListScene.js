// @flow

import { bns } from 'biggystring'
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import slowlog from 'react-native-slowlog'
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import fioRequestsIcon from '../../assets/images/sidenav/fiorequests.png'
import * as Constants from '../../constants/indexConstants'
import * as intl from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { addToFioAddressCache } from '../../modules/FioAddress/util.js'
import { FioRequestRowConnector as FioRequestRow } from '../../modules/FioRequest/components/FioRequestRow'
import { getExchangeDenomination } from '../../modules/Settings/selectors'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import type { State } from '../../types/reduxTypes'
import type { FioRequest, GuiWallet } from '../../types/types'
import { scale } from '../../util/scaling.js'
import FullScreenLoader from '../common/FullScreenLoader'
import { SceneWrapper } from '../common/SceneWrapper'
import { SettingsHeaderRow } from '../common/SettingsHeaderRow.js'
import type { WalletListResult } from '../modals/WalletListModal'
import { WalletListModal } from '../modals/WalletListModal'
import { Airship, showError } from '../services/AirshipInstance'

const SCROLL_THRESHOLD = 0.5

export type LocalState = {
  loadingPending: boolean,
  loadingSent: boolean,
  rejectLoading: boolean,
  addressCachedUpdated: boolean,
  fioRequestsPending: FioRequest[],
  fioRequestsSent: FioRequest[],
  prevPendingAmount: number,
  prevSentAmount: number,
  pendingRequestPaging: { [string]: number },
  sentRequestPaging: { [string]: number }
}

export type StateProps = {
  state: State,
  account: EdgeAccount,
  wallets: { [walletId: string]: GuiWallet },
  fioWallets: EdgeCurrencyWallet[],
  isConnected: boolean
}

export type DispatchProps = {
  onSelectWallet: (walletId: string, currencyCode: string) => void
}

export type OwnProps = {
  navigation: any
}

type Props = OwnProps & StateProps & DispatchProps

const ITEMS_PER_PAGE = 5
export class FioRequestList extends React.Component<Props, LocalState> {
  headerIconSize = THEME.rem(1.375)
  willFocusSubscription: { remove: () => void } | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      loadingPending: false,
      loadingSent: true,
      addressCachedUpdated: false,
      rejectLoading: false,
      fioRequestsPending: [],
      fioRequestsSent: [],
      prevPendingAmount: 0,
      prevSentAmount: 0,
      pendingRequestPaging: {},
      sentRequestPaging: {}
    }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  componentWillUnmount(): void {
    this.willFocusSubscription && this.willFocusSubscription.remove()
  }

  componentDidUpdate = () => {
    if (this.state.addressCachedUpdated || this.state.loadingPending || this.state.loadingSent) return

    const { fioRequestsPending, fioRequestsSent } = this.state
    const addressArray = []
    for (const request of fioRequestsPending) {
      addressArray.push(request.payee_fio_address)
      addressArray.push(request.payer_fio_address)
    }
    for (const request of fioRequestsSent) {
      addressArray.push(request.payee_fio_address)
      addressArray.push(request.payer_fio_address)
    }

    addToFioAddressCache(this.props.account, addressArray)
    this.setState({ addressCachedUpdated: true })
  }

  getFioRequestsPending = async () => {
    // testing API url - http://13.66.174.255:8889
    const { fioWallets } = this.props
    const { pendingRequestPaging, fioRequestsPending } = this.state
    const nextFioRequestsPending = []
    this.setState({ loadingPending: true, prevPendingAmount: fioRequestsPending.length })
    if (fioWallets.length) {
      try {
        for (const wallet of fioWallets) {
          const fioPublicKey = wallet.publicWalletInfo.keys.publicKey
          const fioAddresses = await wallet.otherMethods.getFioAddresses()
          if (fioAddresses.length > 0) {
            try {
              const page = pendingRequestPaging[fioPublicKey] || 1
              console.log('query========')
              console.log({
                fioPublicKey,
                limit: ITEMS_PER_PAGE,
                offset: (page - 1) * ITEMS_PER_PAGE
              })
              const { requests } = await wallet.otherMethods.fioAction('getPendingFioRequests', {
                fioPublicKey,
                limit: ITEMS_PER_PAGE,
                offset: (page - 1) * ITEMS_PER_PAGE
              })
              if (requests) {
                let newRequests = 0
                for (const fioRequest: FioRequest of requests) {
                  if (
                    fioRequestsPending.findIndex((exFioRequest: FioRequest) => exFioRequest.fio_request_id === fioRequest.fio_request_id) < 0 &&
                    nextFioRequestsPending.findIndex((exFioRequest: FioRequest) => exFioRequest.fio_request_id === fioRequest.fio_request_id) < 0
                  ) {
                    fioRequest.fioWalletId = wallet.id
                    nextFioRequestsPending.push(fioRequest)
                    newRequests++
                  }
                }
                if (newRequests === ITEMS_PER_PAGE) {
                  pendingRequestPaging[fioPublicKey] = page + 1
                }
              } else {
                showError(s.strings.fio_get_requests_error)
              }
            } catch (e) {
              console.log('error========')
              console.log(e.json)
              //
            }
          }
        }
      } catch (e) {
        showError(s.strings.fio_get_requests_error)
      }
    }
    fioRequestsPending.push(...nextFioRequestsPending)

    this.setState({
      fioRequestsPending: fioRequestsPending.sort((a, b) => (a.time_stamp < b.time_stamp ? -1 : 1)),
      loadingPending: false,
      pendingRequestPaging
    })
  }

  getFioRequestsSent = async () => {
    const { fioWallets } = this.props
    const { fioRequestsSent, sentRequestPaging } = this.state
    const nextFioRequestsSent = []
    this.setState({ loadingSent: true, prevSentAmount: fioRequestsSent.length })
    if (fioWallets.length) {
      try {
        for (const wallet of fioWallets) {
          const fioPublicKey = wallet.publicWalletInfo.keys.publicKey
          const fioAddresses = await wallet.otherMethods.getFioAddresses()
          if (fioAddresses.length > 0) {
            try {
              const page = sentRequestPaging[fioPublicKey] || 1
              const { requests } = await wallet.otherMethods.fioAction('getSentFioRequests', {
                fioPublicKey,
                limit: ITEMS_PER_PAGE,
                offset: (page - 1) * ITEMS_PER_PAGE
              })
              if (requests) {
                let newRequests = 0
                for (const fioRequest: FioRequest of requests) {
                  if (
                    fioRequestsSent.findIndex((exFioRequest: FioRequest) => exFioRequest.fio_request_id === fioRequest.fio_request_id) < 0 &&
                    nextFioRequestsSent.findIndex((exFioRequest: FioRequest) => exFioRequest.fio_request_id === fioRequest.fio_request_id) < 0
                  ) {
                    fioRequest.fioWalletId = wallet.id
                    nextFioRequestsSent.push(fioRequest)
                    newRequests++
                  }
                }
                if (newRequests === ITEMS_PER_PAGE) {
                  sentRequestPaging[fioPublicKey] = page + 1
                }
              } else {
                showError(s.strings.fio_get_requests_error)
              }
            } catch (e) {
              //
            }
          }
        }
      } catch (e) {
        showError(s.strings.fio_get_requests_error)
      }
    }
    fioRequestsSent.push(...nextFioRequestsSent)

    this.setState({
      fioRequestsSent: fioRequestsSent.sort((a, b) => (a.time_stamp < b.time_stamp ? -1 : 1)),
      loadingSent: false,
      sentRequestPaging
    })
  }

  removeFioPendingRequest = (requestId: string): void => {
    const { fioRequestsPending } = this.state
    this.setState({ fioRequestsPending: fioRequestsPending.filter(item => parseInt(item.fio_request_id) !== parseInt(requestId)) })
  }

  closeRow = (rowMap: { [string]: SwipeRow }, rowKey: string) => {
    if (rowMap[rowKey]) {
      rowMap[rowKey].closeRow()
    }
  }

  rejectFioRequest = async (rowMap: { [string]: SwipeRow }, rowKey: string, request: FioRequest, payerFioAddress: string) => {
    if (!this.props.isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    this.setState({ rejectLoading: true })
    const { fioWallets } = this.props
    const fioWallet = fioWallets.find(wallet => wallet.id === request.fioWalletId)

    if (fioWallet) {
      try {
        const { fee } = await fioWallet.otherMethods.fioAction('getFeeForRejectFundsRequest', { payerFioAddress })
        if (fee) {
          showError(`${s.strings.fio_no_bundled_err_title}. ${s.strings.fio_no_bundled_err_msg}`)
        } else {
          await fioWallet.otherMethods.fioAction('rejectFundsRequest', { fioRequestId: request.fio_request_id, payerFioAddress })
          this.removeFioPendingRequest(request.fio_request_id)
          this.closeRow(rowMap, rowKey)
        }
      } catch (e) {
        showError(s.strings.fio_reject_request_error)
      }
    } else {
      showError(s.strings.err_no_address_title)
    }
    this.setState({ rejectLoading: false })
  }

  rejectRowConfirm = (rowMap: { [string]: SwipeRow }, rowKey: string, request: FioRequest, payerFioAddress: string) => {
    Alert.alert(
      s.strings.fio_reject_request_title,
      s.strings.fio_reject_request_message,
      [
        {
          text: s.strings.string_cancel_cap,
          onPress: () => this.closeRow(rowMap, rowKey),
          style: 'cancel'
        },
        { text: s.strings.fio_reject_request_yes, onPress: () => this.rejectFioRequest(rowMap, rowKey, request, payerFioAddress) }
      ],
      { cancelable: false }
    )
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

  selectPendingRequest = (fioRequest: FioRequest) => {
    if (!this.props.isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    const { wallets, onSelectWallet } = this.props
    const availableWallets: { id: string, currencyCode: string }[] = []
    for (const walletKey: string of Object.keys(wallets)) {
      if (wallets[walletKey].currencyCode.toUpperCase() === fioRequest.content.token_code.toUpperCase()) {
        availableWallets.push({ id: wallets[walletKey].id, currencyCode: wallets[walletKey].currencyCode })
        if (availableWallets.length > 1) {
          this.renderDropUp(fioRequest)
          return
        }
      }
      if (
        wallets[walletKey].currencyCode.toUpperCase() === fioRequest.content.chain_code.toUpperCase() &&
        wallets[walletKey].enabledTokens.indexOf(fioRequest.content.token_code.toUpperCase()) > -1
      ) {
        availableWallets.push({ id: wallets[walletKey].id, currencyCode: fioRequest.content.token_code.toUpperCase() })
        if (availableWallets.length > 1) {
          this.renderDropUp(fioRequest)
          return
        }
      }
    }
    if (availableWallets.length) {
      onSelectWallet(availableWallets[0].id, availableWallets[0].currencyCode)
      this.sendCrypto(fioRequest)
      return
    }
    Alert.alert(
      sprintf(s.strings.err_token_not_in_wallet_title, fioRequest.content.token_code),
      sprintf(s.strings.err_token_not_in_wallet_msg, fioRequest.content.token_code),
      [{ text: s.strings.string_ok_cap }]
    )
  }

  renderDropUp = async (selectedFioPendingRequest: FioRequest) => {
    const { onSelectWallet } = this.props
    const { chain_code, token_code } = selectedFioPendingRequest.content
    const allowedFullCurrencyCode = chain_code !== token_code && token_code && token_code !== '' ? [`${chain_code}:${token_code}`] : [chain_code]

    const { walletId, currencyCode }: WalletListResult = await Airship.show(bridge => (
      <WalletListModal bridge={bridge} headerTitle={s.strings.fio_src_wallet} allowedCurrencyCodes={allowedFullCurrencyCode} />
    ))
    if (walletId && currencyCode) {
      onSelectWallet(walletId, currencyCode)
      this.sendCrypto(selectedFioPendingRequest)
    }
  }

  sendCrypto = async (pendingRequest: FioRequest) => {
    const { fioWallets, state } = this.props
    const fioWalletByAddress = fioWallets.find(wallet => wallet.id === pendingRequest.fioWalletId) || null
    if (!fioWalletByAddress) return showError(s.strings.fio_wallet_missing_for_fio_address)
    const exchangeDenomination = getExchangeDenomination(state, pendingRequest.content.token_code)
    let nativeAmount = bns.mul(pendingRequest.content.amount, exchangeDenomination.multiplier)
    nativeAmount = bns.toFixed(nativeAmount, 0, 0)
    const guiMakeSpendInfo = {
      fioPendingRequest: pendingRequest,
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
            showError(s.strings.fio_no_bundled_err_msg)
            throw new Error(s.strings.fio_no_bundled_err_msg)
          }
        } catch (e) {
          showError(s.strings.fio_get_fee_err_msg)
          throw e
        }
      },
      onDone: (err, edgeTransaction) => {
        if (!err) {
          this.getFioRequestsPending()
          Actions.replace(Constants.TRANSACTION_DETAILS, { edgeTransaction })
        }
      }
    }

    Actions[Constants.SEND_CONFIRMATION]({ guiMakeSpendInfo })
  }

  selectSentRequest = (fioRequest: FioRequest) => {
    if (!this.props.isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    Actions[Constants.FIO_SENT_REQUEST_DETAILS]({ selectedFioSentRequest: fioRequest })
  }

  pendingRequestHeaders = () => {
    const { fioRequestsPending } = this.state
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

  listKeyExtractor(item: FioRequest) {
    return item.fio_request_id.toString()
  }

  pendingLazyLoad = ({ distanceFromEnd }: { distanceFromEnd: number }) => {
    const { loadingPending, fioRequestsPending, prevPendingAmount } = this.state
    if (!loadingPending && (prevPendingAmount < fioRequestsPending.length || fioRequestsPending.length === 0 || distanceFromEnd < 0)) {
      this.getFioRequestsPending()
    }
  }

  sentLazyLoad = ({ distanceFromEnd }: { distanceFromEnd: number }) => {
    const { loadingSent, fioRequestsSent, prevSentAmount } = this.state
    if (!loadingSent && (prevSentAmount < fioRequestsSent.length || fioRequestsSent.length === 0 || distanceFromEnd < 0)) {
      this.getFioRequestsSent()
    }
  }

  renderPending = (itemObj: { item: FioRequest, index: number }) => {
    const { item: fioRequest, index } = itemObj
    const isLastOfDate =
      index + 1 === this.state.fioRequestsPending.length ||
      (index > 0 &&
        intl.formatExpDate(new Date(this.state.fioRequestsPending[index + 1].time_stamp), true) !== intl.formatExpDate(new Date(fioRequest.time_stamp), true))
    return <FioRequestRow fioRequest={fioRequest} isLastOfDate={isLastOfDate} onSelect={this.selectPendingRequest} />
  }

  renderSent = (itemObj: { item: FioRequest, index: number }) => {
    const { item: fioRequest, index } = itemObj
    const isHeaderRow =
      index === 0 ||
      (index > 0 &&
        intl.formatExpDate(new Date(this.state.fioRequestsSent[index - 1].time_stamp), true) !== intl.formatExpDate(new Date(fioRequest.time_stamp), true))
    const isLastOfDate =
      index + 1 === this.state.fioRequestsSent.length ||
      (index > 0 &&
        intl.formatExpDate(new Date(this.state.fioRequestsSent[index + 1].time_stamp), true) !== intl.formatExpDate(new Date(fioRequest.time_stamp), true))
    return <FioRequestRow fioRequest={fioRequest} onSelect={this.selectSentRequest} isSent isHeaderRow={isHeaderRow} isLastOfDate={isLastOfDate} />
  }

  renderHiddenItem = (rowObj: { item: FioRequest }, rowMap: { [string]: SwipeRow }) => {
    return (
      <View style={styles.rowBack}>
        <TouchableOpacity
          style={[styles.backRightBtn, styles.backRightBtnRight]}
          onPress={_ => this.rejectRowConfirm(rowMap, rowObj.item.fio_request_id.toString(), rowObj.item, rowObj.item.payer_fio_address)}
        >
          <T style={styles.backTextWhite}>{s.strings.swap_terms_reject_button}</T>
        </TouchableOpacity>
      </View>
    )
  }

  render() {
    const { loadingPending, loadingSent, rejectLoading, fioRequestsPending, fioRequestsSent } = this.state

    return (
      <SceneWrapper>
        {rejectLoading && <FullScreenLoader indicatorStyles={styles.rejectLoading} />}
        <View style={styles.scene}>
          <View style={styles.row}>
            <SettingsHeaderRow
              icon={loadingPending ? <ActivityIndicator size="small" /> : <Image source={fioRequestsIcon} style={styles.iconImage} />}
              text={s.strings.fio_pending_requests}
            />
            {!loadingPending && !fioRequestsPending.length ? (
              <View style={styles.emptyListContainer}>
                <T style={styles.text}>{s.strings.fio_no_requests_label}</T>
              </View>
            ) : null}
            <View style={styles.container}>
              {loadingPending && !fioRequestsPending.length && <ActivityIndicator style={styles.loading} size="small" />}
              <SwipeListView
                useSectionList
                sections={this.pendingRequestHeaders()}
                renderItem={this.renderPending}
                keyExtractor={this.listKeyExtractor}
                renderHiddenItem={this.renderHiddenItem}
                renderSectionHeader={this.headerRowUsingTitle}
                rightOpenValue={scale(-75)}
                onEndReached={this.pendingLazyLoad}
                onEndReachedThreshold={0.1}
                disableRightSwipe
              />
            </View>
          </View>
          <View style={styles.row}>
            <SettingsHeaderRow
              icon={loadingSent ? <ActivityIndicator size="small" /> : <IonIcon name="ios-send" color={THEME.COLORS.WHITE} size={this.headerIconSize} />}
              text={s.strings.fio_sent_requests}
            />
            {!loadingSent && !fioRequestsSent.length ? (
              <View style={styles.emptyListContainer}>
                <T style={styles.text}>{s.strings.fio_no_requests_label}</T>
              </View>
            ) : null}
            <View style={styles.scrollView}>
              <View style={styles.container}>
                <View style={styles.requestsWrap}>
                  {loadingSent && !fioRequestsSent.length && <ActivityIndicator style={styles.loading} size="small" />}
                  <FlatList
                    style={styles.transactionsScrollWrap}
                    data={fioRequestsSent}
                    renderItem={this.renderSent}
                    initialNumToRender={fioRequestsSent ? fioRequestsSent.length : 0}
                    onEndReached={this.sentLazyLoad}
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

const rawStyles = {
  scene: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: THEME.COLORS.GRAY_4
  },
  requestsWrap: {
    flex: 1
  },
  scrollView: {
    flex: 1
  },
  container: {
    flex: 1,
    alignItems: 'stretch'
  },
  backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: scale(75)
  },
  backRightBtnRight: {
    backgroundColor: THEME.COLORS.ACCENT_RED,
    right: 0
  },
  backTextWhite: {
    color: THEME.COLORS.WHITE
  },
  rowBack: {
    alignItems: 'center',
    backgroundColor: THEME.COLORS.GRAY_3,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: scale(15)
  },
  row: {
    height: '50%'
  },
  text: {
    fontSize: scale(14),
    fontWeight: 'normal'
  },
  transactionLogo: {
    width: scale(44),
    height: scale(44)
  },
  emptyListContainer: {
    paddingVertical: scale(30),
    paddingHorizontal: scale(20),
    opacity: 0.5
  },
  iconImage: {
    width: scale(22),
    height: scale(22)
  },
  rejectLoading: {
    paddingBottom: scale(130)
  },
  loading: {
    flex: 1,
    marginTop: scale(40),
    alignSelf: 'center'
  },

  transactionsScrollWrap: {
    flex: 1
  },
  singleDateArea: {
    backgroundColor: THEME.COLORS.GRAY_4,
    flex: 3,
    padding: scale(3),
    paddingLeft: scale(15),
    flexDirection: 'row',
    paddingRight: scale(24)
  },
  leftDateArea: {
    flex: 1
  },
  formattedDate: {
    color: THEME.COLORS.GRAY_2,
    fontSize: scale(14)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
