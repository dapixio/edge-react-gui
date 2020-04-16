// @flow

import { connect } from 'react-redux'

import type { DispatchProps, StateProps } from '../../components/scenes/FioAddressDetailsScene'
import { FioAddressDetailsScene } from '../../components/scenes/FioAddressDetailsScene'
import { refreshPubAddresses, setFioWalletByFioAddress } from '../../modules/FioAddress/action'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const { fioAddressName, expiration, getPubAddressesLoading } = state.ui.scenes.fioAddress

  const out: StateProps = {
    fioAddressName,
    expiration,
    getPubAddressesLoading
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setFioWalletByFioAddress: (fioAddress: string) => dispatch(setFioWalletByFioAddress(fioAddress)),
  refreshPubAddresses: (fioAddressName: string) => {
    dispatch(refreshPubAddresses(fioAddressName))
  }
})

export const FioAddressDetailsConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioAddressDetailsScene)
