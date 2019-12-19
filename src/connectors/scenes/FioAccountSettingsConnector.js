// @flow

import { connect } from 'react-redux'

import { FioAccountSettingsScene } from '../../components/scenes/FioAccountSettingsScene'
import type { State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  return {
    core: state.core
  }
}

export default connect(
  mapStateToProps,
  {}
)(FioAccountSettingsScene)
