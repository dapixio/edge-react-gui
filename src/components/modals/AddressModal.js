// @flow

import { FormField, InputAndButtonStyle, MaterialInputStyle, Modal, ModalStyle, PrimaryButton, SecondaryButton, TertiaryButton } from 'edge-components'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { Clipboard, Text, View } from 'react-native'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import { sprintf } from 'sprintf-js'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import styles from '../../styles/scenes/ScaneStyle'
import { colors as COLORS } from '../../theme/variables/airbitz.js'

// INTERACTIVE_MODAL /////////////////////////////////////////////////////////////////////////////
type AddressModalProps = {
  currencyCode: string,
  onDone: any => void,
  coreWallet: EdgeCurrencyWallet
}

type AddressModalState = {
  clipboard: string,
  uri: string,
  memo: string,
  fieldError: string,
  memoError: string,
  addressLabel: string
}
export class AddressModal extends Component<AddressModalProps, AddressModalState> {
  /* static Icon = Icon
  static Title = Title
  static Description = Description
  static Body = Body
  static Footer = Footer
  static Item = Item
  static Row = Row */

  constructor (props: AddressModalProps) {
    super(props)
    this.state = {
      clipboard: '',
      uri: '',
      memo: '',
      fieldError: '',
      memoError: '',
      addressLabel: s.strings.fragment_send_address
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

  _onAddressFocus (isBlur: boolean = false) {
    if (isBlur) {
      if (!this.state.uri) {
        this.setState({ addressLabel: s.strings.fragment_send_address })
      }
    } else {
      this.setState({ addressLabel: s.strings.fragment_send_send_to_hint_fio })
    }
  }

  async _onDone () {
    const { currencyCode, coreWallet, onDone, fioDemoServer } = this.props
    const { uri, memo, memoError } = this.state
    this.setState({ fieldError: '' })

    if (memoError) return
    if (this.fioAddressCheck(uri)) {
      try {
        const apiUrl = fioDemoServer ? 'https://demo2.fio.dev:443/v1/' : 'https://testnet.fioprotocol.io:443/v1/'
        const res = await window.fetch(apiUrl + 'chain/get_pub_address', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fio_address: uri,
            chain_code: coreWallet.currencyInfo.currencyCode,
            token_code: currencyCode
          })
        })
        const { public_address } = await res.json()
        if (public_address && public_address.length > 1) return onDone({ uri: public_address, memo, fioAddress: uri })
      } catch (e) {
        console.log(e)
        console.log(e.json)
        return this.setState({ fieldError: s.strings.err_no_address_title })
      }
    }

    onDone({ uri, memo })
  }

  fioAddressCheck (fioAddress: string) {
    if (fioAddress.indexOf(Constants.FIO_DOMAIN_DEFAULT) < 0) return false
    return new RegExp(`^(([a-z0-9]+)(-?[a-z0-9]+)*${Constants.FIO_DOMAIN_DEFAULT}{1})$`, 'gim').test(fioAddress)
  }

  updateUri = (uri: string) => {
    this.setState({
      uri
    })
  }

  updateMemo = (memo: string) => {
    let memoError = ''
    if (memo && (!/^[\x20-\x7E]*$/.test(memo) || memo.length > 64)) {
      memoError = s.strings.fragment_send_send_to_fio_error_memo_inline
    }
    this.setState({
      memo,
      memoError
    })
  }

  onPasteFromClipboard = () => {
    const { clipboard } = this.state
    this.setState({ uri: clipboard }, () => {
      this._onDone()
    })
  }

  render () {
    const copyMessage = this.state.clipboard ? sprintf(s.strings.string_paste_address, this.state.clipboard) : null
    const { uri, memo, fieldError, memoError, addressLabel } = this.state
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
                onChangeText={this.updateUri}
                error={fieldError}
                label={addressLabel}
                onSubmit={() => this._onDone()}
                onFocus={() => this._onAddressFocus()}
                onBlur={() => this._onAddressFocus(true)}
              />
            </View>
            <View>
              <FormField
                style={MaterialInputStyle}
                value={memo}
                onChangeText={this.updateMemo}
                error={memoError}
                placeholder={s.strings.unique_identifier_memo}
                label={s.strings.unique_identifier_memo}
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
              <PrimaryButton onPress={() => this._onDone()} style={[InputAndButtonStyle.yesButton]}>
                <PrimaryButton.Text style={[InputAndButtonStyle.buttonText]}>{s.strings.string_done_cap}</PrimaryButton.Text>
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
  currencyCode: string,
  fioDemoServer: boolean
}

export const createAddressModal = (opts: AddressModalOpts) => {
  function AddressModalWrapped (props: { +onDone: Function }) {
    return <AddressModal {...opts} {...props} />
  }
  return AddressModalWrapped
}
