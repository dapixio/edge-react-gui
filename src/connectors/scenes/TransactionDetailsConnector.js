// @flow

import type { EdgeCurrencyInfo, EdgeCurrencyWallet, EdgeMetadata, EdgeTransaction } from 'edge-core-js'
import { connect } from 'react-redux'

import { getSubcategories, setNewSubcategory, setTransactionDetails } from '../../actions/TransactionDetailsActions.js'
import type { TransactionDetailsOwnProps } from '../../components/scenes/TransactionDetailsScene'
import { TransactionDetails } from '../../components/scenes/TransactionDetailsScene'
import { refreshFioObtData } from '../../modules/FioRequest/action'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors.js'
import * as UI_SELECTORS from '../../modules/UI/selectors'
import type { Dispatch, State } from '../../types/reduxTypes.js'
import type { FioObtRecord } from '../../types/types'
import * as UTILS from '../../util/utils'

const mapStateToProps = (state: State, ownProps: TransactionDetailsOwnProps) => {
  const wallets = UI_SELECTORS.getWallets(state)
  const contacts = state.contacts
  const subcategoriesList: Array<string> = state.ui.scenes.transactionDetails.subcategories.sort()
  const settings = SETTINGS_SELECTORS.getSettings(state)
  const currencyCode: string = ownProps.edgeTransaction.currencyCode
  const plugins: Object = SETTINGS_SELECTORS.getPlugins(state)
  const allCurrencyInfos: Array<EdgeCurrencyInfo> = plugins.allCurrencyInfos
  const currencyInfo: EdgeCurrencyInfo | void = UTILS.getCurrencyInfo(allCurrencyInfos, currencyCode)
  const fioObtData: FioObtRecord | null = UI_SELECTORS.getFioObtData(state, ownProps.edgeTransaction.txid)

  return {
    contacts,
    subcategoriesList,
    settings,
    currencyInfo,
    currencyCode,
    wallets,
    fioObtData
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  setTransactionDetails: (transaction: EdgeTransaction, edgeMetadata: EdgeMetadata) => {
    dispatch(setTransactionDetails(transaction, edgeMetadata))
  },
  getSubcategories: () => dispatch(getSubcategories()),
  setNewSubcategory: (newSubcategory: string) => dispatch(setNewSubcategory(newSubcategory)),
  refreshFioObtData: (wallet: EdgeCurrencyWallet) => dispatch(refreshFioObtData(wallet))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TransactionDetails)
