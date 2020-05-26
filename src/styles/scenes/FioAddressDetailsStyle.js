// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling'

export const styles = StyleSheet.create({
  view: {
    flex: 2,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: scale(15)
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
    fontSize: scale(16)
  },
  image: {
    marginBottom: scale(50)
  },
  title: {
    fontSize: scale(28),
    color: THEME.COLORS.WHITE,
    marginTop: scale(20),
    marginBottom: scale(10)
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: scale(35)
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
  },
  underlay: {
    color: THEME.COLORS.SECONDARY
  },
  viewGrey: {
    flex: 1,
    backgroundColor: THEME.COLORS.GRAY_3,
    paddingHorizontal: 0
  },
  expiration: {
    fontSize: scale(12),
    color: THEME.COLORS.WHITE,
    textAlign: 'center',
    marginTop: scale(-6),
    paddingBottom: scale(12)
  },
  titleWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  settingsText: {
    color: THEME.COLORS.GRAY_1,
    fontSize: scale(16)
  },
  iconImage: {
    color: THEME.COLORS.GRAY_1,
    width: scale(22),
    height: scale(22)
  },
  warning: {
    color: THEME.COLORS.ACCENT_RED
  }
})
