// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import { connect } from 'react-redux'

import * as CORE_SELECTORS from '../../../../modules/Core/selectors.js'
import type { Dispatch, State } from '../../../../types/reduxTypes'
import type { GuiWallet } from '../../../../types/types'
import * as UI_SELECTORS from '../../../UI/selectors.js'
import { setSenderFioAddress } from '../../action'
import type { SelectFioAddressDispatchProps, SelectFioAddressProps } from './SelectFioAddress'
import { SelectFioAddress } from './SelectFioAddress'

const mapStateToProps = (state: State): SelectFioAddressProps => {
  const guiWallet: GuiWallet = UI_SELECTORS.getSelectedWallet(state)
  const account = CORE_SELECTORS.getAccount(state)
  const currencyCode: string = UI_SELECTORS.getSelectedCurrencyCode(state)
  const fioWallets: EdgeCurrencyWallet[] = UI_SELECTORS.getFioWallets(state)
  const { senderFioAddress, senderMsgRecipient, senderMsgRecipientError } = state.ui.scenes.fioAddress

  if (!guiWallet || !currencyCode) {
    return {
      loading: true,
      publicAddress: '',
      fioWallets,
      currencyCode,
      selectedWallet: guiWallet,
      account,
      senderFioAddress: '',
      senderMsgRecipient: '',
      senderMsgRecipientError: ''
    }
  }

  return {
    publicAddress: guiWallet.receiveAddress.publicAddress || '',
    loading: false,
    fioWallets,
    currencyCode,
    selectedWallet: guiWallet,
    account,
    senderFioAddress,
    senderMsgRecipient,
    senderMsgRecipientError
  }
}
const mapDispatchToProps = (dispatch: Dispatch): SelectFioAddressDispatchProps => ({
  onSelectAddress: (fioAddress: string) => dispatch(setSenderFioAddress(fioAddress)),
  msgOnChange: (msg: string, msgError?: string) =>
    dispatch({
      type: 'FIO/FIO_SET_SENDER_MSG_TO_RECIPIENT',
      data: {
        msg,
        msgError
      }
    })
})

export const SelectFioAddressConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(SelectFioAddress)
