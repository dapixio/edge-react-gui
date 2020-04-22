// @flow

import { connect } from 'react-redux'

import type { DispatchProps, StateProps } from '../../components/scenes/FioAccountSettingsScene'
import { FioAccountSettingsScene } from '../../components/scenes/FioAccountSettingsScene'
import { getRenewalFee } from '../../modules/FioAddress/action'
import { getFioWalletByAddress } from '../../modules/UI/selectors'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const out: StateProps = {
    wallet: getFioWalletByAddress(state),
    feeLoading: state.ui.scenes.fioAddress.feeLoading,
    walletLoading: state.ui.scenes.fioAddress.walletLoading
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setFees: () => dispatch(getRenewalFee())
})

export const FioAccountSettingsConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioAccountSettingsScene)
