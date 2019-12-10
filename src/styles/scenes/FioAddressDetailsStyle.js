// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling'

const styles = StyleSheet.create({
  gradient: {
    height: THEME.HEADER
  },
  view: {
    flex: 2,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingLeft: scale(15),
    paddingRight: scale(15)
  },
  texts: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(40)
  },
  text: {
    color: THEME.COLORS.WHITE,
    fontSize: 16
  },
  image: {
    marginBottom: scale(50)
  },
  title: {
    fontSize: 28,
    color: THEME.COLORS.WHITE,
    marginTop: scale(20),
    marginBottom: scale(10)
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: scale(15)
  },
  bottomButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`,
    borderRadius: scale(3),
    height: scale(50),
    marginLeft: scale(1),
    marginRight: scale(1),
    marginTop: scale(15)
  },
  bottomButtonTextWrap: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  bottomButtonText: {
    opacity: 1,
    color: THEME.COLORS.WHITE,
    fontSize: scale(14),
    backgroundColor: THEME.COLORS.TRANSPARENT
  }
})

export default styles
