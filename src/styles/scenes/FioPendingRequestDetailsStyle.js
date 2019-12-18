// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'

const backgroundColor = 'rgba(245,245,245,1.0)'

const styles = StyleSheet.create({
  container: {
    backgroundColor: backgroundColor,
    borderBottomColor: THEME.COLORS.GRAY_3, // was #D9E2ED
    borderBottomWidth: 2,
    height: 50,
    justifyContent: 'center',
    paddingLeft: 15
  },
  line: {
    backgroundColor: THEME.COLORS.WHITE,
    height: 0,
    paddingLeft: 50,
    paddingRight: 50
  },
  memostyle: {
    paddingLeft: 50,
    paddingRight: 50
  },
  row: {
    height: 100,
    justifyContent: 'space-between',
    paddingTop: 40
  },
  row2: {
    justifyContent: 'center',
    paddingLeft: 50,
    paddingRight: 50,
    paddingTop: 0
  },
  row3: {
    justifyContent: 'center',
    paddingLeft: 50,
    paddingTop: 0
  },
  title: {
    color: THEME.COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'center'
  }
})

export default styles
