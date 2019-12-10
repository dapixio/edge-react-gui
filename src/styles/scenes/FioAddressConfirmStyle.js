// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling'

const redColor = '#d02424'

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch'
  },
  gradient: {
    height: THEME.HEADER
  },
  mainView: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: THEME.COLORS.WHITE,
    paddingTop: scale(90),
    paddingBottom: scale(20),
    paddingLeft: scale(15),
    paddingRight: scale(15)
  },
  mainViewBg: {
    paddingTop: scale(90),
    paddingBottom: scale(20),
    paddingLeft: scale(15),
    paddingRight: scale(15)
  },
  textWhite: {
    color: THEME.COLORS.WHITE
  },
  textBlack: {
    color: THEME.COLORS.BLACK
  },
  texts: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  button: {
    marginTop: scale(40)
  },
  balanceTitle: {
    textAlign: 'center'
  },
  balanceTitleDisabled: {
    color: redColor,
    fontWeight: 'normal',
    textAlign: 'center'
  },
  toggleButton: {
    backgroundColor: THEME.COLORS.PRIMARY,
    height: scale(58),
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  underlay: {
    color: `${THEME.COLORS.PRIMARY}${THEME.ALPHA.LOW}`
  },
  errMsg: {
    marginTop: scale(20),
    color: redColor,
    fontSize: 14,
    fontWeight: 'normal',
    textAlign: 'center'
  },
  title: {
    color: THEME.COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'center'
  },
  titleDisabled: {
    color: THEME.COLORS.ACCENT_RED,
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'center'
  },
  titleLarge: {
    color: THEME.COLORS.WHITE,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center'
  }
})

export default styles
