// @flow

import { connect } from 'react-redux'

import { goToScene } from '../../../../../actions/SettingsActions'
import type { Dispatch, State } from '../../../../../types/reduxTypes.js'
import { logoutRequest } from '../../../../Login/action'
import Main from './Main'

const mapStateToProps = (state: State) => ({
  usersView: state.ui.scenes.controlPanel.usersView
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  logout: (username?: string) => dispatch(logoutRequest(username)),
  goToScene: (route: string) => dispatch(goToScene(route))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Main)
