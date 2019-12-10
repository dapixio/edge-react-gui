// @flow

import { connect } from 'react-redux'

import { registerFirstFioAddress } from '../../actions/FioActions'
import type { DispatchProps } from '../../components/scenes/FioAddressScene'
import { FioAddressScene } from '../../components/scenes/FioAddressScene'
import type { Dispatch } from '../../types/reduxTypes'

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  registerFirstFioAddress: () => dispatch(registerFirstFioAddress())
})

export default connect(
  null,
  mapDispatchToProps
)(FioAddressScene)
