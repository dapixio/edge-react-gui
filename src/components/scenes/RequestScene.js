// @flow

import { bns } from 'biggystring'
import { createSimpleConfirmModal } from 'edge-components'
import type { EdgeCurrencyInfo, EdgeCurrencyWallet, EdgeEncodeUri } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Alert, Clipboard, Dimensions, Platform, View } from 'react-native'
import ContactsWrapper from 'react-native-contacts-wrapper'
import RNFS from 'react-native-fs'
import Share from 'react-native-share'
import slowlog from 'react-native-slowlog'
import { sprintf } from 'sprintf-js'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import type { AccountState } from '../../modules/Core/Account/reducer'
import ExchangeRate from '../../modules/UI/components/ExchangeRate/index.js'
import type { ExchangedFlipInputAmounts } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2.js'
import { ExchangedFlipInput } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2.js'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui.js'
import RequestStatus from '../../modules/UI/components/RequestStatus/index.js'
import ShareButtons from '../../modules/UI/components/ShareButtons/index.js'
import WalletListModal from '../../modules/UI/components/WalletListModal/WalletListModalConnector'
import { styles } from '../../styles/scenes/RequestStyle.js'
import { THEME } from '../../theme/variables/airbitz.js'
import type { CheckConnectivityProps, GoToSceneProps, GuiCurrencyInfo, GuiWallet } from '../../types/types.js'
import { getObjectDiff } from '../../util/utils'
import { launchModal } from '../common/ModalProvider.js'
import { QrCode } from '../common/QrCode.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { createFioAddressModal } from '../modals/RequestFioAddressModal'
import { showError, showToast } from '../services/AirshipInstance.js'

const PUBLIC_ADDRESS_REFRESH_MS = 2000

export type RequestStateProps = {
  currencyCode: string,
  currencyInfo: EdgeCurrencyInfo | null,
  edgeWallet: EdgeCurrencyWallet,
  exchangeSecondaryToPrimaryRatio: number,
  guiWallet: GuiWallet,
  loading: false,
  primaryCurrencyInfo: GuiCurrencyInfo,
  publicAddress: string,
  legacyAddress: string,
  secondaryCurrencyInfo: GuiCurrencyInfo,
  showToWalletModal: boolean,
  useLegacyAddress: boolean,
  wallets: { [string]: GuiWallet },
  allWallets: any,
  account: AccountState
}
export type RequestLoadingProps = {
  edgeWallet: null,
  currencyCode: null,
  currencyInfo: null,
  exchangeSecondaryToPrimaryRatio: null,
  guiWallet: null,
  loading: true,
  primaryCurrencyInfo: null,
  publicAddress: string,
  legacyAddress: string,
  secondaryCurrencyInfo: null,
  showToWalletModal: null,
  useLegacyAddress: null,
  allWallets: any,
  account: AccountState
}

export type RequestDispatchProps = {
  refreshReceiveAddressRequest(string): void,
  onSelectWallet: (walletId: string, currencyCode: string) => void,
  requestChangeAmounts: ExchangedFlipInputAmounts => void,
  requestSaveFioModalData: any => void
}
type ModalState = 'NOT_YET_SHOWN' | 'VISIBLE' | 'SHOWN'
type CurrencyMinimumPopupState = { [currencyCode: string]: ModalState }

export type LoadingProps = RequestLoadingProps & RequestDispatchProps & CheckConnectivityProps & GoToSceneProps
export type LoadedProps = RequestStateProps & RequestDispatchProps & CheckConnectivityProps & GoToSceneProps
export type Props = LoadingProps | LoadedProps
export type State = {
  publicAddress: string,
  legacyAddress: string,
  encodedURI: string,
  minimumPopupModalState: CurrencyMinimumPopupState
}

export class Request extends Component<Props, State> {
  fioWallets = []
  amounts: ExchangedFlipInputAmounts

  constructor (props: Props) {
    super(props)
    const minimumPopupModalState: CurrencyMinimumPopupState = {}
    Object.keys(Constants.SPECIAL_CURRENCY_INFO).forEach(currencyCode => {
      if (Constants.getSpecialCurrencyInfo(currencyCode).minimumPopupModals) {
        minimumPopupModalState[currencyCode] = 'NOT_YET_SHOWN'
      }
    })
    this.state = {
      publicAddress: props.publicAddress,
      legacyAddress: props.legacyAddress,
      encodedURI: '',
      minimumPopupModalState
    }
    if (this.shouldShowMinimumModal(props)) {
      if (!props.currencyCode) return
      this.state.minimumPopupModalState[props.currencyCode] = 'VISIBLE'
      console.log('stop, in constructor')
      this.enqueueMinimumAmountModal()
    }
    const self = this
    if (this.props.allWallets) {
      const allWalletsArr: any[] = Object.values(this.props.allWallets)
      allWalletsArr.forEach(item => {
        if (item.type === Constants.FIO_WALLET_TYPE) {
          self.fioWallets.push(item)
        }
      })
    }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  componentDidMount () {
    this.generateEncodedUri()
  }

  onCloseXRPMinimumModal = () => {
    const minimumPopupModalState: CurrencyMinimumPopupState = Object.assign({}, this.state.minimumPopupModalState)
    if (!this.props.currencyCode) return
    minimumPopupModalState[this.props.currencyCode] = 'SHOWN'
    this.setState({ minimumPopupModalState })
  }

  shouldComponentUpdate (nextProps: Props, nextState: State) {
    let diffElement2: string = ''
    const diffElement = getObjectDiff(this.props, nextProps, {
      primaryCurrencyInfo: true,
      secondaryCurrencyInfo: true,
      displayDenomination: true,
      exchangeDenomination: true
    })
    if (!diffElement) {
      diffElement2 = getObjectDiff(this.state, nextState)
    }
    return !!diffElement || !!diffElement2
  }

  async generateEncodedUri () {
    const { edgeWallet, useLegacyAddress, currencyCode } = this.props
    if (!currencyCode) return
    let publicAddress = this.props.publicAddress
    let legacyAddress = this.props.legacyAddress
    const abcEncodeUri = useLegacyAddress ? { publicAddress, legacyAddress, currencyCode } : { publicAddress, currencyCode }
    let encodedURI = s.strings.loading
    try {
      encodedURI = edgeWallet ? await edgeWallet.encodeUri(abcEncodeUri) : s.strings.loading
      this.setState({
        encodedURI
      })
    } catch (e) {
      console.log(e)
      publicAddress = s.strings.loading
      legacyAddress = s.strings.loading
      this.setState({
        publicAddress,
        legacyAddress
      })
      setTimeout(() => {
        if (edgeWallet && edgeWallet.id) {
          this.props.refreshReceiveAddressRequest(edgeWallet.id)
        }
      }, PUBLIC_ADDRESS_REFRESH_MS)
    }
  }

  async UNSAFE_componentWillReceiveProps (nextProps: Props) {
    const { currencyCode } = nextProps
    if (nextProps.loading || currencyCode === null) return

    const didAddressChange = this.state.publicAddress !== nextProps.guiWallet.receiveAddress.publicAddress
    const changeLegacyPublic = nextProps.useLegacyAddress !== this.props.useLegacyAddress
    const didWalletChange = this.props.edgeWallet && nextProps.edgeWallet.id !== this.props.edgeWallet.id

    if (didAddressChange || changeLegacyPublic || didWalletChange) {
      let publicAddress = nextProps.guiWallet.receiveAddress.publicAddress
      let legacyAddress = nextProps.guiWallet.receiveAddress.legacyAddress

      const abcEncodeUri = nextProps.useLegacyAddress ? { publicAddress, legacyAddress, currencyCode } : { publicAddress, currencyCode }
      let encodedURI = s.strings.loading
      try {
        encodedURI = nextProps.edgeWallet ? await nextProps.edgeWallet.encodeUri(abcEncodeUri) : s.strings.loading
      } catch (e) {
        console.log(e)
        publicAddress = s.strings.loading
        legacyAddress = s.strings.loading
        setTimeout(() => {
          if (nextProps.edgeWallet && nextProps.edgeWallet.id) {
            nextProps.refreshReceiveAddressRequest(nextProps.edgeWallet.id)
          }
        }, PUBLIC_ADDRESS_REFRESH_MS)
      }

      this.setState({
        encodedURI,
        publicAddress: publicAddress,
        legacyAddress: legacyAddress
      })
    }
    // old blank address to new
    // include 'didAddressChange' because didWalletChange returns false upon initial request scene load
    if (didWalletChange || didAddressChange) {
      if (this.shouldShowMinimumModal(nextProps)) {
        const minimumPopupModalState: CurrencyMinimumPopupState = Object.assign({}, this.state.minimumPopupModalState)
        if (minimumPopupModalState[nextProps.currencyCode] === 'NOT_YET_SHOWN') {
          this.enqueueMinimumAmountModal()
        }
        minimumPopupModalState[nextProps.currencyCode] = 'VISIBLE'
        this.setState({ minimumPopupModalState })
      }
    }
  }

  enqueueMinimumAmountModal = async () => {
    let message = ''
    if (this.props.currencyCode && Constants.getSpecialCurrencyInfo(this.props.currencyCode).minimumPopupModals) {
      message = Constants.getSpecialCurrencyInfo(this.props.currencyCode).minimumPopupModals.modalMessage
    } else {
      return
    }
    const modal = createSimpleConfirmModal({
      title: s.strings.request_minimum_notification_title,
      message,
      icon: <Icon type={Constants.MATERIAL_COMMUNITY} name={Constants.EXCLAMATION} size={30} />,
      buttonText: s.strings.string_ok
    })

    await launchModal(modal)
    // resolve value doesn't really matter here
    this.onCloseXRPMinimumModal()
  }

  render () {
    if (this.props.loading) {
      return <ActivityIndicator style={{ flex: 1, alignSelf: 'center' }} size={'large'} />
    }

    const { primaryCurrencyInfo, secondaryCurrencyInfo, exchangeSecondaryToPrimaryRatio, onSelectWallet, wallets, currencyInfo } = this.props
    const addressExplorer = currencyInfo ? currencyInfo.addressExplorer : null
    const requestAddress = this.props.useLegacyAddress ? this.state.legacyAddress : this.state.publicAddress
    const allowedWallets = {}
    for (const id in wallets) {
      const wallet = wallets[id]
      if (wallet.receiveAddress && wallet.receiveAddress.publicAddress) {
        allowedWallets[id] = wallets[id]
      }
    }
    const qrSize = Dimensions.get('window').height / 4

    return (
      <SceneWrapper>
        <View style={styles.exchangeRateContainer}>
          <ExchangeRate primaryInfo={primaryCurrencyInfo} secondaryInfo={secondaryCurrencyInfo} secondaryDisplayAmount={exchangeSecondaryToPrimaryRatio} />
        </View>

        <View style={styles.main}>
          <ExchangedFlipInput
            primaryCurrencyInfo={primaryCurrencyInfo}
            secondaryCurrencyInfo={secondaryCurrencyInfo}
            exchangeSecondaryToPrimaryRatio={exchangeSecondaryToPrimaryRatio}
            overridePrimaryExchangeAmount={''}
            forceUpdateGuiCounter={0}
            onExchangeAmountChanged={this.onExchangeAmountChanged}
            keyboardVisible={false}
            color={THEME.COLORS.WHITE}
            isFiatOnTop={false}
            isFocus={false}
          />

          <View style={styles.qrContainer}>
            <QrCode data={this.state.encodedURI} size={qrSize} />
          </View>
          <RequestStatus requestAddress={requestAddress} addressExplorer={addressExplorer} amountRequestedInCrypto={0} amountReceivedInCrypto={0} />
        </View>

        <View style={styles.shareButtonsContainer}>
          <ShareButtons
            shareViaEmail={this.shareViaEmail}
            shareViaSMS={this.shareViaSMS}
            shareViaShare={this.shareViaShare}
            copyToClipboard={this.copyToClipboard}
            fioAddressModal={this.fioAddressModal}
          />
        </View>
        {this.props.showToWalletModal && <WalletListModal wallets={allowedWallets} type={Constants.TO} onSelectWallet={onSelectWallet} />}
      </SceneWrapper>
    )
  }

  onExchangeAmountChanged = async (amounts: ExchangedFlipInputAmounts) => {
    const { publicAddress, legacyAddress } = this.state
    const { currencyCode, requestChangeAmounts } = this.props
    this.amounts = amounts
    requestChangeAmounts(amounts)
    if (!currencyCode) return
    const edgeEncodeUri: EdgeEncodeUri =
      this.props.useLegacyAddress && legacyAddress ? { publicAddress, legacyAddress, currencyCode } : { publicAddress, currencyCode }
    if (bns.gt(amounts.nativeAmount, '0')) {
      edgeEncodeUri.nativeAmount = amounts.nativeAmount
    }
    let encodedURI = s.strings.loading
    try {
      encodedURI = this.props.edgeWallet ? await this.props.edgeWallet.encodeUri(edgeEncodeUri) : s.strings.loading
    } catch (e) {
      console.log(e)
      setTimeout(() => {
        if (this.props.edgeWallet && this.props.edgeWallet.id) {
          this.props.refreshReceiveAddressRequest(this.props.edgeWallet.id)
        }
      }, PUBLIC_ADDRESS_REFRESH_MS)
    }

    this.setState({ encodedURI })
  }

  copyToClipboard = () => {
    const requestAddress = this.props.useLegacyAddress ? this.state.legacyAddress : this.state.publicAddress
    Clipboard.setString(requestAddress)
    showToast(s.strings.fragment_request_address_copied)
  }

  shouldShowMinimumModal = (props: Props): boolean => {
    if (!props.currencyCode) return false
    if (this.state.minimumPopupModalState[props.currencyCode]) {
      if (this.state.minimumPopupModalState[props.currencyCode] === 'NOT_YET_SHOWN') {
        let minBalance = '0'
        if (Constants.getSpecialCurrencyInfo(props.currencyCode).minimumPopupModals) {
          minBalance = Constants.getSpecialCurrencyInfo(props.currencyCode).minimumPopupModals.minimumNativeBalance
        }
        if (bns.lt(props.guiWallet.primaryNativeBalance, minBalance)) {
          return true
        }
      }
    }
    return false
  }

  shareMessage = () => {
    const { currencyCode, publicAddress } = this.props
    let sharedAddress = this.state.encodedURI
    // if encoded (like XTZ), only share the public address
    if (currencyCode && Constants.getSpecialCurrencyInfo(currencyCode).isUriEncodedStructure) {
      sharedAddress = publicAddress
    }
    const title = sprintf(s.strings.request_qr_email_title, s.strings.app_name, currencyCode)
    const message = sprintf(s.strings.request_qr_email_title, s.strings.app_name, currencyCode) + ': ' + sharedAddress
    const path = Platform.OS === Constants.IOS ? RNFS.DocumentDirectoryPath + '/' + title + '.txt' : RNFS.ExternalDirectoryPath + '/' + title + '.txt'
    RNFS.writeFile(path, message, 'utf8')
      .then(success => {
        const url = Platform.OS === Constants.IOS ? 'file://' + path : ''
        const shareOptions = {
          url,
          title,
          message: sharedAddress
        }
        Share.open(shareOptions).catch(e => console.log(e))
      })
      .catch(showError)
  }

  shareViaEmail = () => {
    ContactsWrapper.getContact()
      .then(() => {
        this.shareMessage()
        // console.log('shareViaEmail')
      })
      .catch(showError)
  }

  shareViaSMS = () => {
    ContactsWrapper.getContact()
      .then(() => {
        this.shareMessage()
      })
      .catch(showError)
  }

  shareViaShare = () => {
    this.shareMessage()
  }

  fioAddressModal = async () => {
    if (!this.props.checkConnectivity()) return
    if (this.fioWallets.length === 0) {
      Alert.alert(s.strings.fio_request_by_fioaddress_error_no_address_header, s.strings.fio_request_by_fioaddress_error_no_address)
      return
    }
    let validFioAddress = false
    let engine
    for (const fioWallet of this.fioWallets) {
      engine = this.props.account.currencyWallets[fioWallet.id]
      if (engine) {
        const fioAddresses = await engine.otherMethods.getFioAddress()
        if (fioAddresses.length > 0) {
          validFioAddress = true
          break
        }
      }
    }
    if (!validFioAddress) {
      Alert.alert(s.strings.fio_request_by_fioaddress_error_no_address_header, s.strings.fio_request_by_fioaddress_error_no_address)
      return
    }
    if (this.amounts) {
      const native = parseFloat(this.amounts.nativeAmount)
      if (native <= 0) {
        Alert.alert(s.strings.fio_request_by_fioaddress_error_invalid_amount_header, s.strings.fio_request_by_fioaddress_error_invalid_amount)
        return
      }
    } else {
      Alert.alert(s.strings.fio_request_by_fioaddress_error_invalid_amount_header, s.strings.fio_request_by_fioaddress_error_invalid_amount)
      return
    }
    const fioAddressModal = createFioAddressModal({ engine, checkConnectivity: this.props.checkConnectivity })
    const data = await launchModal(fioAddressModal)
    if (data) {
      await this.props.requestSaveFioModalData(data)
      this.sendRequest()
    }
  }

  sendRequest = () => {
    this.props.goToScene(Constants.FIO_REQUEST_CONFIRMATION)
  }
}
