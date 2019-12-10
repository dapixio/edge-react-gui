// @flow

import { connect } from 'react-redux'

import { registerFirstFioAddress } from '../../actions/FioActions'
import type { DispatchProps, StateProps } from '../../components/scenes/FioAddressScene'
import { FioAddressScene } from '../../components/scenes/FioAddressScene'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const out: StateProps = {
    core: state.core
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  registerFirstFioAddress: () => dispatch(registerFirstFioAddress())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FioAddressScene)
