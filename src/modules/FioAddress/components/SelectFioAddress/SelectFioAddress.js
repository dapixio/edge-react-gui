// @flow

import { FormField } from 'edge-components'
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, View } from 'react-native'

import { FormFieldSelect } from '../../../../components/common/FormFieldSelect'
import * as Constants from '../../../../constants/indexConstants'
import s from '../../../../locales/strings.js'
import { MaterialInput } from '../../../../styles/components/FormFieldStyles.js'
import { styles } from '../../../../styles/scenes/FioRequestConfirmationStyle'
import type { GuiWallet } from '../../../../types/types'
import Text from '../../../UI/components/FormattedText/index'

export type SelectFioAddressProps = {
  publicAddress: string,
  loading: boolean,
  fioWallets: EdgeCurrencyWallet[],
  selectedWallet: GuiWallet,
  currencyCode: string,
  account: EdgeAccount,
  senderFioAddress: string,
  senderMsgRecipient: string,
  senderMsgRecipientError: string
}

export type SelectFioAddressDispatchProps = {
  onSelectAddress: (fioAddress: string) => any,
  msgOnChange: (msg: string, msgError: string) => void
}

type Props = SelectFioAddressProps & SelectFioAddressDispatchProps

type LocalState = {
  loading: boolean,
  fioAddresses: { value: string }[]
}

export class SelectFioAddress extends Component<Props, LocalState> {
  MaterialInputStyle = {}
  constructor (props: Props) {
    super(props)
    this.state = {
      loading: false,
      fioAddresses: []
    }
  }

  componentDidMount () {
    this.checkForPubAddresses()

    const materialStyle = { ...MaterialInput }
    materialStyle.tintColor = styles.text.color
    materialStyle.baseColor = styles.text.color
    this.MaterialInputStyle = {
      ...materialStyle,
      container: {
        ...materialStyle.container,
        width: styles.selectFullWidth.width
      },
      titleTextStyle: styles.title
    }
  }

  async checkForPubAddresses () {
    const { fioWallets, selectedWallet, currencyCode } = this.props
    if (selectedWallet && selectedWallet.currencyCode === Constants.FIO_STR) {
      const fioWallet = fioWallets.find((fioWalletItem: EdgeCurrencyWallet) => fioWalletItem.id === selectedWallet.id)
      if (fioWallet) {
        const fioNames = await fioWallet.otherMethods.getFioAddressNames()
        this.setState({ fioAddresses: fioNames.map((name: string) => ({ value: name })) }, () => {
          this.handleFioAddressChange('', 0)
        })
      }
    } else {
      const fioAddresses = []
      this.setState({ loading: true })
      for (const fioWallet: EdgeCurrencyWallet of fioWallets) {
        const fioNames = await fioWallet.otherMethods.getFioAddressNames()
        for (const fioAddress: string of fioNames) {
          try {
            const { public_address } = await fioWallet.otherMethods.fioAction('getPublicAddress', {
              fioAddress,
              chainCode: selectedWallet.currencyCode,
              tokenCode: currencyCode
            })
            if (public_address && public_address.length > 1) fioAddresses.push({ value: fioAddress })
          } catch (e) {
            continue
          }
        }
      }
      this.setState({ fioAddresses, loading: false }, () => {
        this.handleFioAddressChange('', 0)
      })
    }
  }

  handleFioAddressChange = (something: string, index: number) => {
    const { fioAddresses } = this.state
    if (fioAddresses.length) {
      this.props.onSelectAddress(fioAddresses[index].value)
    }
  }

  labelFromWallet = (item: any) => {
    return item.value
  }

  onMsgChange = (msg: string) => {
    let msgError = ''
    if (msg && (!/^[\x20-\x7E]*$/.test(msg) || msg.length > 64)) {
      msgError = s.strings.fragment_send_send_to_fio_error_memo_inline
    }
    this.props.msgOnChange(msg, msgError)
  }

  render () {
    const { senderFioAddress, senderMsgRecipient, senderMsgRecipientError } = this.props
    const { fioAddresses, loading } = this.state
    if (!fioAddresses.length) return null

    return (
      <View style={[styles.selectContainer, styles.selectFullWidth]}>
        {loading ? (
          <ActivityIndicator style={styles.loading} size="small" />
        ) : (
          <FormFieldSelect
            style={this.MaterialInputStyle}
            onChangeText={this.handleFioAddressChange}
            label={s.strings.fio_select_address}
            value={senderFioAddress}
            labelExtractor={this.labelFromWallet}
            valueExtractor={this.labelFromWallet}
            data={fioAddresses}
          />
        )}
        {!loading && (
          <FormField
            style={this.MaterialInputStyle}
            value={senderMsgRecipient}
            onChangeText={this.onMsgChange}
            placeholder={s.strings.fio_sender_msg_to_recipient}
            label={s.strings.fio_sender_msg_to_recipient}
          />
        )}
        {senderMsgRecipientError ? <Text style={styles.error}>{senderMsgRecipientError}</Text> : null}
      </View>
    )
  }
}