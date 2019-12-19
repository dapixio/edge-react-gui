// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import { connect } from 'react-redux'

import type { DispatchProps, StateProps } from '../../components/scenes/FioRenewAddressScene'
import { FioRenewAddressScene } from '../../components/scenes/FioRenewAddressScene'
import { setFioAddress } from '../../modules/FioAddress/action'
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
  setFioAddress: (fioAddressName: string, expiration: string) => dispatch(setFioAddress(fioAddressName, expiration))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FioRenewAddressScene)
