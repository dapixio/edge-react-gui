// @flow

import { FormField, InputAndButtonStyle, MaterialInputStyle, Modal, ModalStyle, PrimaryButton, SecondaryButton, TertiaryButton } from 'edge-components'
import type { EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Clipboard, Text, View } from 'react-native'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import { sprintf } from 'sprintf-js'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import styles from '../../styles/scenes/ScaneStyle'
import { colors as COLORS } from '../../theme/variables/airbitz.js'
import ResolutionError, { ResolutionErrorCode } from '../common/ResolutionError.js'

// INTERACTIVE_MODAL /////////////////////////////////////////////////////////////////////////////
type AddressModalProps = {
  onDone: ({ uri?: string, fioAddress?: string }) => void,
  coreWallet: EdgeCurrencyWallet,
  fioPlugin: EdgeCurrencyConfig,
  currencyCode: string
}

type AddressModalState = {
  clipboard: string,
  uri: string,
  statusLabel: string,
  fioPublicAddress: string,
  fieldError: string,
  cryptoAddress?: string
}
export class AddressModal extends Component<AddressModalProps, AddressModalState> {
  /* static Icon = Icon
  static Title = Title
  static Description = Description
  static Body = Body
  static Footer = Footer
  static Item = Item
  static Row = Row */
  fioCheckQueue: number = 0

  constructor (props: AddressModalProps) {
    super(props)
    this.fioCheckQueue = 0
    this.state = {
      clipboard: '',
      uri: '',
      statusLabel: s.strings.fragment_send_address, // fragment_send_send_to_hint
      cryptoAddress: undefined,
      fioPublicAddress: '',
      fieldError: ''
    }
  }

  componentDidMount () {
    this._setClipboard(this.props)
  }

  _setClipboard = async props => {
    const coreWallet = props.coreWallet

    try {
      const uri = await Clipboard.getString()

      // Will throw in case uri is invalid
      await coreWallet.parseUri(uri)

      this.setState({
        clipboard: uri
      })
    } catch (e) {
      // Failure is acceptable
    }
  }

  _onAddressFocus = () => {
    this.setState({ statusLabel: s.strings.send_to_hint_fio })
  }

  _onAddressBlur = () => {
    if (!this.state.uri) {
      this.setState({ statusLabel: s.strings.fragment_send_address })
    }
  }

  setStatusLabel = (status: string) => {
    this.setState({ statusLabel: status })
  }

  setCryptoAddress = (address?: string) => {
    this.setState({ cryptoAddress: address })
  }

  onChangeTextDelayed = (domain: string) => {
    const { currencyCode } = this.props
    if (this.checkIfDomain(domain)) {
      this.resolveAddress(domain, currencyCode)
    }
    this.checkIfFioAddress(domain)
    this.updateUri(domain)
  }

  checkIfDomain = (domain: string): boolean => {
    return this.checkIfUnstoppableDomain(domain) || this.checkIfEnsDomain(domain)
  }

  checkIfUnstoppableDomain = (domain: string): boolean => {
    return domain.endsWith('.zil') || domain.endsWith('.crypto')
  }

  checkIfEnsDomain = (domain: string): boolean => {
    return domain.endsWith('.eth') || domain.endsWith('.luxe') || domain.endsWith('.kred') || domain.endsWith('.xyz')
  }

  fetchDomain = async (domain: string, currencyTicker: string): Promise<string> => {
    domain = domain.trim().toLowerCase()
    if (!this.checkIfDomain(domain)) {
      throw new ResolutionError(ResolutionErrorCode.UnsupportedDomain, { domain })
    }
    const baseurl = `https://unstoppabledomains.com/api/v1`
    const url = this.checkIfEnsDomain(domain) ? `${baseurl}/${domain}/${currencyTicker}` : `${baseurl}/${domain}`
    const response = await global.fetch(url).then(res => res.json())
    const { addresses, meta } = response
    if (!meta || !meta.owner) {
      throw new ResolutionError(ResolutionErrorCode.UnregisteredDomain, { domain })
    }
    const ticker = currencyTicker.toUpperCase()
    if (!addresses || !addresses[ticker]) {
      throw new ResolutionError(ResolutionErrorCode.UnspecifiedCurrency, { domain, currencyTicker })
    }
    return addresses[ticker]
  }

  resolveAddress = async (domain: string, currencyTicker: string) => {
    if (!domain) return
    try {
      this.setStatusLabel(s.strings.resolving)
      const addr = await this.fetchDomain(domain, currencyTicker)
      this.setStatusLabel(addr)
      this.setCryptoAddress(addr)
    } catch (err) {
      if (err instanceof ResolutionError) {
        const message = sprintf(s.strings[err.code], domain, currencyTicker)
        if (domain === '') this.setStatusLabel(s.strings.send_to_hint_fio)
        else {
          this.setStatusLabel(message)
          this.setCryptoAddress(undefined)
        }
      }
    }
  }

  checkFioPubAddressQueue (uri: string) {
    this.setStatusLabel(s.strings.resolving)
    this.fioCheckQueue++
    setTimeout(async () => {
      // do not check if user continue typing fio address
      if (this.fioCheckQueue > 1) {
        return --this.fioCheckQueue
      }
      this.fioCheckQueue = 0
      try {
        const { currencyCode, coreWallet, fioPlugin } = this.props
        const { public_address } = await fioPlugin.otherMethods.getConnectedPublicAddress(uri, coreWallet.currencyInfo.currencyCode, currencyCode)
        this.setStatusLabel(s.strings.send_to_hint_fio)
        if (public_address && public_address.length > 1) return this.setState({ fioPublicAddress: public_address })
      } catch (e) {
        this.setStatusLabel(s.strings.send_to_hint_fio)
        return this.setState({ fieldError: s.strings.err_no_address_title })
      }
    }, 1000)
  }

  async checkIfFioAddress (uri: string) {
    this.setState({ fieldError: '' })

    if (await this.isFioAddressValid(uri)) {
      this.checkFioPubAddressQueue(uri)
    }
  }

  isFioAddressValid = (fioAddress: string) => {
    const { fioPlugin } = this.props
    return fioPlugin.otherMethods.isFioAddressValid(fioAddress)
  }

  updateUri = (uri: string) => {
    this.setState({
      uri
    })
  }

  onPasteFromClipboard = () => {
    const { clipboard } = this.state
    this.setState({ uri: clipboard }, async () => {
      if (await this.isFioAddressValid(clipboard)) {
        await this.checkIfFioAddress(clipboard)
      }
      this.handleSubmit()
    })
  }

  handleSubmit = () => {
    const { uri, cryptoAddress, fioPublicAddress } = this.state
    let submitData = { uri: cryptoAddress || uri }
    if (fioPublicAddress) {
      const { fieldError } = this.state
      if (fieldError) return

      submitData = {
        uri: fioPublicAddress,
        fioAddress: uri
      }
    }
    this.props.onDone(submitData)
  }

  render () {
    const copyMessage = this.state.clipboard ? sprintf(s.strings.string_paste_address, this.state.clipboard) : null
    const { uri, statusLabel, fieldError } = this.state
    return (
      <View style={ModalStyle.modal}>
        <Modal.Icon>
          <FAIcon name={Constants.ADDRESS_BOOK_O} size={24} color={COLORS.primary} />
        </Modal.Icon>
        <Modal.Container>
          <Modal.Icon.AndroidHackSpacer />
          <Modal.Title style={{ textAlign: 'center' }}>
            <Text>{s.strings.fragment_send_address_dialog_title_short}</Text>
          </Modal.Title>
          <Modal.Body>
            <View>
              <FormField
                style={MaterialInputStyle}
                value={uri}
                onChangeText={this.onChangeTextDelayed}
                error={fieldError}
                label={statusLabel}
                onSubmit={this.handleSubmit}
                onFocus={this._onAddressFocus}
                onBlur={this._onAddressBlur}
              />
            </View>
          </Modal.Body>
          <Modal.Footer>
            {copyMessage && (
              <Modal.Row style={InputAndButtonStyle.tertiaryButtonRow}>
                <TertiaryButton ellipsizeMode={'middle'} onPress={this.onPasteFromClipboard} numberOfLines={1} style={styles.addressModalButton}>
                  <TertiaryButton.Text>{copyMessage}</TertiaryButton.Text>
                </TertiaryButton>
              </Modal.Row>
            )}
            <Modal.Row style={[InputAndButtonStyle.row]}>
              <SecondaryButton onPress={() => this.props.onDone({})} style={[InputAndButtonStyle.noButton]}>
                <SecondaryButton.Text style={[InputAndButtonStyle.buttonText]}>{s.strings.string_cancel_cap}</SecondaryButton.Text>
              </SecondaryButton>
              <PrimaryButton onPress={this.handleSubmit} style={[InputAndButtonStyle.yesButton]} disabled={statusLabel === s.strings.resolving}>
                {statusLabel === s.strings.resolving ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <PrimaryButton.Text style={[InputAndButtonStyle.buttonText]}>{s.strings.string_done_cap}</PrimaryButton.Text>
                )}
              </PrimaryButton>
            </Modal.Row>
          </Modal.Footer>
        </Modal.Container>
      </View>
    )
  }
}

export type AddressModalOpts = {
  walletId: string,
  coreWallet: EdgeCurrencyWallet,
  fioPlugin: EdgeCurrencyConfig,
  currencyCode: string
}

export const createAddressModal = (opts: AddressModalOpts) => {
  function AddressModalWrapped (props: { +onDone: Function }) {
    return <AddressModal {...opts} {...props} />
  }
  return AddressModalWrapped
}
