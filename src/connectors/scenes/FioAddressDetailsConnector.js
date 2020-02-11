// @flow

import { connect } from 'react-redux'

import type { DispatchProps, StateProps } from '../../components/scenes/FioAddressDetailsScene'
import { FioAddressDetailsScene } from '../../components/scenes/FioAddressDetailsScene'
import { refreshPubAddresses } from '../../modules/FioAddress/action'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const { fioAddress } = state.ui.scenes

  const out: StateProps = {
    fioAddressName: fioAddress.fioAddressName,
    expiration: fioAddress.expiration,
    fee_collected: fioAddress.fee_collected,
    getPubAddressesLoading: fioAddress.getPubAddressesLoading
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  refreshPubAddresses: (fioAddressName: string) => {
    dispatch(refreshPubAddresses(fioAddressName))
  }
})

export const FioAddressDetailsConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioAddressDetailsScene)
