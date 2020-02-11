// @flow

/* globals test expect */

import { initialState as SendConfirmationInitialState } from '../modules/UI/scenes/SendConfirmation/selectors.js'
import { request } from '../reducers/scenes/RequestReducer.js'
import { scenes as scenesReducer } from '../reducers/scenes/ScenesReducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

test('initialState', () => {
  const expected = {
    controlPanel: {
      usersView: false
    },
    createWallet: {
      isCreatingWallet: false,
      walletAccountActivationPaymentInfo: {
        paymentAddress: '',
        amount: '',
        currencyCode: '',
        exchangeAmount: '',
        expireTime: 0
      },
      isCheckingHandleAvailability: false,
      handleAvailableStatus: '',
      handleActivationInfo: {
        supportedCurrencies: {},
        activationCost: ''
      },
      walletAccountActivationQuoteError: ''
    },
    editToken: {
      deleteCustomTokenProcessing: false,
      deleteTokenModalVisible: false,
      editCustomTokenProcessing: false
    },
    exchangeRate: {
      exchangeRates: {}
    },
    fioAddress: {
      expiration: new Date('1/1/2019'),
      fee_collected: 0,
      fioAddressName: '',
      fioAddresses: [],
      selectedWallet: null,
      fioWalletByAddress: null
    },
    fioRequest: {
      requests: [],
      pendingMore: 0,
      pendingPage: 1,
      amounts: {
        exchangeAmount: '',
        nativeAmount: ''
      },
      fioModalData: {},
      sentRequests: [],
      sentMore: 0,
      sentPage: 1,
      fioPendingRequestSelected: {},
      fioPendingRequestConfirmedStatus: '',
      fioPendingRequestRejectedStatus: '',
      fioSentRequestSelected: {}
    },
    request: request(undefined, dummyAction),
    requestType: {
      useLegacyAddress: false,
      uniqueLegacyAddress: false
    },
    scan: {
      scanEnabled: false,
      torchEnabled: false,
      privateKeyModal: {
        error: null,
        isSweeping: false,
        secondaryModal: {
          isActive: false
        }
      },
      parsedUri: null
    },
    sendConfirmation: SendConfirmationInitialState,
    transactionDetails: {
      subcategories: []
    },
    transactionList: {
      transactions: [],
      transactionIdMap: {},
      currentCurrencyCode: '',
      currentEndIndex: 0,
      numTransactions: 0,
      currentWalletId: ''
    },
    walletList: {
      viewXPubWalletModalVisible: false,
      xPubExplorer: '',
      xPubSyntax: '',
      walletArchivesVisible: false,
      walletId: ''
    },
    passwordReminderModal: {
      status: null
    },
    passwordRecoveryReminderModal: {
      isVisible: false
    },
    uniqueIdentifierModal: {
      isActive: false,
      uniqueIdentifier: undefined
    }
  }
  const actual = scenesReducer(undefined, dummyAction)

  expect(actual).toEqual(expected)
})
