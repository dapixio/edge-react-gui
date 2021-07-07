// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling'

export const styles = StyleSheet.create({
  view: {
    flex: 1
  },
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
  spacer: {
    paddingTop: scale(20)
  },
  checkTitle: {
    fontSize: scale(12),
    color: THEME.COLORS.WHITE,
    marginLeft: scale(15)
  },
  checkBox: {
    borderStyle: 'solid',
    borderWidth: scale(2),
    borderColor: THEME.COLORS.WHITE,
    borderRadius: 15,
    width: scale(24),
    height: scale(24),
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkBoxIconOk: {
    width: scale(18),
    height: scale(18),
    borderRadius: 12,
    backgroundColor: THEME.COLORS.ACCENT_MINT
  },
  checkBoxContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    color: THEME.COLORS.WHITE
  },
  confirmContainer: {
    paddingHorizontal: scale(30)
  },
  list: {
    flex: 5,
    backgroundColor: THEME.COLORS.WHITE
  },
  no_wallets_text: {
    padding: scale(30),
    fontSize: scale(22),
    color: THEME.COLORS.GRAY_2,
    textAlign: 'center'
  },
  wallet: {
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  walletDisabled: {
    opacity: 0.7
  },
  walletDetailsContainer: {
    flex: 1,
    flexDirection: 'row'
  },
  walletDetailsCol: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center'
  },
  switchContainer: {
    alignItems: 'flex-end',
    paddingRight: scale(5)
  },
  walletDetailsRowCurrency: {
    fontSize: scale(18)
  },
  walletDetailsRowName: {
    fontSize: scale(14),
    color: THEME.COLORS.SECONDARY
  },
  underlay: {
    color: THEME.COLORS.GRAY_2
  },
  bottomSection: {
    flex: 2,
    backgroundColor: THEME.COLORS.GRAY_3,
    paddingBottom: scale(20)
  },
  button: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.BLUE_3,
    borderRadius: scale(3),
    height: scale(50),
    marginLeft: scale(15),
    marginRight: scale(15),
    marginTop: scale(15),
    marginBottom: scale(15)
  },
  buttonTextWrap: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonText: {
    opacity: 1,
    color: THEME.COLORS.WHITE,
    fontSize: scale(16),
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  buttonTextBlue: {
    color: THEME.COLORS.BLUE_3
  },
  btnUnderlay: {
    color: THEME.COLORS.SECONDARY
  },
  btnDisabled: {
    backgroundColor: THEME.COLORS.GRAY_2
  }
})
