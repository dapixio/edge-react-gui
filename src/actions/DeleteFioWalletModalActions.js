// @flow

import { createYesNoModal } from 'edge-components'
import React from 'react'

import { launchModal } from '../components/common/ModalProvider.js'
import { DELETE } from '../constants/indexConstants.js'
import s from '../locales/strings.js'
import { getAccount, getWalletName } from '../modules/Core/selectors.js'
import Text from '../modules/UI/components/FormattedText/index'
import OptionIcon from '../modules/UI/components/OptionIcon/OptionIcon.ui'
import type { Dispatch, GetState } from '../types/reduxTypes'

export const showDeleteFioWalletModal = (walletId: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const walletName = getWalletName(state, walletId)
  const account = getAccount(state)

  // Use `showModal` to put the modal component on screen:
  const modal = createYesNoModal({
    title: s.strings.fragment_wallets_delete_wallet,
    message: (
      <Text style={{ textAlign: 'center' }}>
        {s.strings.fragmet_wallets_delete_wallet_first_confirm_message_mobile}
        <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>{`${walletName}?\n`}</Text>
        {`${s.strings.fragmet_wallets_delete_fio_extra_message_mobile}`}
      </Text>
    ),
    icon: <OptionIcon iconName={DELETE} />,
    noButtonText: s.strings.string_cancel_cap,
    yesButtonText: s.strings.string_delete
  })

  const resolveValue = await launchModal(modal)

  if (resolveValue) {
    try {
      account.changeWalletStates({ [walletId]: { deleted: true } })
    } catch (e) {
      throw new Error(e)
    }
  }
}
