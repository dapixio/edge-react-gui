// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import { connect } from 'react-redux'

import { createCurrencyWallet } from '../../actions/CreateWalletActions.js'
import type { DispatchProps, StateProps } from '../../components/scenes/FioAddressRegisterScene'
import { FioAddressRegisterScene } from '../../components/scenes/FioAddressRegisterScene'
import { changeFioAddressName } from '../../modules/FioAddress/action'
import { getFioWallets } from '../../modules/UI/selectors'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const fioWallets: EdgeCurrencyWallet[] = getFioWallets(state)

  const out: StateProps = {
    fioWallets
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  changeFioAddressName: (fioAddressName: string) => dispatch(changeFioAddressName(fioAddressName)),
  createCurrencyWallet: (walletName: string, walletType: string) => dispatch(createCurrencyWallet(walletName, walletType, 'iso:USD', false, false))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FioAddressRegisterScene)
