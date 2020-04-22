// @flow

import { connect } from 'react-redux'

import type { DispatchProps, StateProps } from '../../components/scenes/FioAddressDetailsScene'
import { FioAddressDetailsScene } from '../../components/scenes/FioAddressDetailsScene'
import { setFioWalletByFioAddress } from '../../modules/FioAddress/action'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const { fioAddressName, expiration } = state.ui.scenes.fioAddress

  const out: StateProps = {
    fioAddressName,
    expiration
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setFioWalletByFioAddress: (fioAddress: string) => dispatch(setFioWalletByFioAddress(fioAddress))
})

export const FioAddressDetailsConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioAddressDetailsScene)
