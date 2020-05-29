// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling'

export const styles = StyleSheet.create({
  info: {
    backgroundColor: THEME.COLORS.SECONDARY,
    paddingVertical: scale(15),
    paddingHorizontal: scale(15),
    marginBottom: scale(3)
  },
  title: {
    color: THEME.COLORS.TRANSACTION_DETAILS_GREY_1,
    marginBottom: scale(4),
    fontSize: scale(11),
    fontWeight: 'normal',
    textAlign: 'left'
  },
  content: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(15),
    textAlign: 'left'
  },
  texts: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  balanceTitle: {
    fontSize: scale(15),
    color: THEME.COLORS.WHITE,
    textAlign: 'center'
  },
  balanceTitleDisabled: {
    fontSize: scale(15),
    color: THEME.COLORS.ACCENT_RED,
    fontWeight: 'normal',
    textAlign: 'center'
  },
  blockPadding: {
    paddingTop: scale(34),
    paddingLeft: scale(20),
    paddingRight: scale(20)
  },
  spacer: {
    paddingTop: scale(20)
  },
  activityIndicator: {
    marginTop: scale(50),
    alignSelf: 'center'
  }
})
