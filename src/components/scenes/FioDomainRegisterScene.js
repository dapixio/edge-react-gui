// @flow

import { type EdgeCurrencyConfig, type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { TextAndIconButton, TextAndIconButtonStyle } from '../../modules/UI/components/Buttons/TextAndIconButton.ui.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/SafeAreaView.ui.js'
import { getFioWallets } from '../../modules/UI/selectors'
import { THEME } from '../../theme/variables/airbitz.js'
import { PLATFORM } from '../../theme/variables/platform'
import type { State } from '../../types/reduxTypes'
import { FormField, MaterialInputOnWhite } from '../common/FormField.js'
import type { WalletListResult } from '../modals/WalletListModal'
import { WalletListModal } from '../modals/WalletListModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import type { Theme, ThemeProps } from '../services/ThemeContext'
import { cacheStyles, withTheme } from '../services/ThemeContext'

export type LocalState = {
  selectedWallet: EdgeCurrencyWallet | null,
  fioDomain: string,
  isValid: boolean,
  touched: boolean,
  loading: boolean,
  walletLoading: boolean,
  domainsLoading: boolean,
  isAvailable: boolean | null,
  fieldPos: number
}

export type StateProps = {
  fioWallets: EdgeCurrencyWallet[],
  fioPlugin: EdgeCurrencyConfig,
  isConnected: boolean
}

export type DispatchProps = {
  createFioWallet: () => Promise<EdgeCurrencyWallet>
}

type Props = StateProps & DispatchProps & ThemeProps

const ionIconSize = THEME.rem(4)
class FioDomainRegister extends React.Component<Props, LocalState> {
  fioCheckQueue: number = 0
  clearButtonMode = 'while-editing'
  returnKeyType = 'next'

  state = {
    selectedWallet: null,
    fioDomain: '',
    isValid: true,
    touched: false,
    isAvailable: false,
    loading: false,
    walletLoading: false,
    domainsLoading: true,
    fieldPos: 200
  }

  componentDidMount() {
    const { fioWallets } = this.props
    if (fioWallets.length > 0) {
      this.setState({
        selectedWallet: fioWallets[0]
      })
    } else {
      this.createFioWallet()
    }
  }

  createFioWallet = async (): Promise<void> => {
    const { createFioWallet } = this.props
    showToast(s.strings.preparing_fio_wallet)
    this.setState({ walletLoading: true })
    try {
      const wallet = await createFioWallet()
      this.setState({
        selectedWallet: wallet,
        walletLoading: false
      })
    } catch (e) {
      this.setState({ walletLoading: false })
      showError(s.strings.create_wallet_failed_message)
    }
  }

  handleNextButton = () => {
    const { isConnected } = this.props
    const { fioDomain, selectedWallet, isValid, isAvailable, loading, walletLoading } = this.state
    if (isValid && isAvailable && !loading && !walletLoading) {
      if (isConnected) {
        if (!selectedWallet) return showError(s.strings.create_wallet_failed_message)
        Actions[Constants.FIO_DOMAIN_REGISTER_SELECT_WALLET]({
          fioDomain,
          selectedWallet
        })
      }
    } else {
      showError(s.strings.fio_network_alert_text)
    }
  }

  checkFioDomain(fioDomain: string) {
    this.setState({
      loading: true
    })
    this.fioCheckQueue++
    setTimeout(async () => {
      // do not check if user continue typing fio address
      if (this.fioCheckQueue > 1) {
        return --this.fioCheckQueue
      }
      this.fioCheckQueue = 0
      try {
        const { fioPlugin } = this.props
        const isAvailable = fioPlugin.otherMethods ? await fioPlugin.otherMethods.validateAccount(fioDomain, true) : false
        this.setState({
          isAvailable,
          loading: false
        })
      } catch (e) {
        this.setState({
          loading: false
        })
      }
    }, 1000)
  }

  handleFioDomainChange = (fioDomainChanged: string) => {
    if (!this.props.isConnected) {
      return this.setState({
        fioDomain: fioDomainChanged,
        touched: true,
        isAvailable: null,
        loading: false
      })
    }
    this.checkFioDomain(fioDomainChanged)

    this.setState({
      fioDomain: fioDomainChanged.toLowerCase(),
      touched: true,
      isAvailable: null
    })
  }

  handleFioDomainFocus = () => {
    this.refs._scrollView.scrollTo({ x: 0, y: this.state.fieldPos, animated: true })
  }

  fieldViewOnLayout = () => {
    this.refs._fieldView.measure((x, y) => {
      this.setState({ fieldPos: y })
    })
  }

  handleFioWalletChange = (walletId: string) => {
    this.setState({
      selectedWallet: this.props.fioWallets.find(fioWallet => fioWallet.id === walletId)
    })
  }

  selectFioWallet = () => {
    Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={[Constants.FIO_STR]} />).then(
      ({ walletId, currencyCode }: WalletListResult) => {
        if (walletId && currencyCode) {
          if (currencyCode === Constants.FIO_STR) {
            this.handleFioWalletChange(walletId)
          } else {
            showError(`${s.strings.create_wallet_select_valid_crypto}: ${Constants.FIO_STR}`)
          }
        }
      }
    )
  }

  renderButton() {
    const { theme } = this.props
    const { isValid, isAvailable, loading, walletLoading } = this.state
    const styles = getStyles(theme)

    if (isValid && isAvailable && !loading) {
      return (
        <View style={styles.buttons}>
          <PrimaryButton style={styles.next} onPress={this.handleNextButton} disabled={!isAvailable || walletLoading}>
            {walletLoading ? <ActivityIndicator size="small" /> : <PrimaryButton.Text>{s.strings.string_next_capitalized}</PrimaryButton.Text>}
          </PrimaryButton>
        </View>
      )
    }

    return null
  }

  renderLoader() {
    const { theme } = this.props
    const { isValid, touched, isAvailable, loading } = this.state
    const styles = getStyles(theme)

    let icon = null
    if ((!isValid || isAvailable === false) && touched) {
      icon = <Icon style={[styles.statusIcon, styles.statusIconError]} type={Constants.MATERIAL_COMMUNITY} name={Constants.CLOSE_CIRCLE_ICON} size={25} />
    }
    if (isValid && isAvailable && touched) {
      icon = <Icon style={[styles.statusIcon, styles.statusIconOk]} type={Constants.MATERIAL_COMMUNITY} name={Constants.CHECK_CIRCLE_ICON} size={25} />
    }

    return <View style={styles.statusIconContainer}>{loading ? <ActivityIndicator style={styles.statusIcon} size="small" /> : icon}</View>
  }

  renderFioWallets() {
    const { fioWallets, theme } = this.props
    const { selectedWallet } = this.state
    const styles = getStyles(theme)
    if (fioWallets && fioWallets.length > 1) {
      const title = `${s.strings.title_fio_connect_to_wallet}: ${
        selectedWallet && selectedWallet.name ? selectedWallet.name : s.strings.fio_address_register_no_wallet_name
      }`
      return (
        <TextAndIconButton
          style={{ ...TextAndIconButtonStyle, container: styles.selectWalletBtn }}
          onPress={this.selectFioWallet}
          icon={Constants.KEYBOARD_ARROW_DOWN}
          title={title}
        />
      )
    }
  }

  render() {
    const { theme } = this.props
    const { fioDomain, touched, isAvailable, domainsLoading, walletLoading } = this.state
    const styles = getStyles(theme)
    let chooseHandleErrorMessage = ''
    if (touched && !this.props.isConnected) {
      chooseHandleErrorMessage = s.strings.fio_address_register_screen_cant_check
    }
    if (touched && isAvailable === false) {
      chooseHandleErrorMessage = s.strings.fio_address_register_screen_not_available
    }

    const materialInputOnWhiteStyle = {
      ...MaterialInputOnWhite,
      container: {
        ...MaterialInputOnWhite.container,
        ...styles.inputContainer,
        width: '100%'
      }
    }

    return (
      <SafeAreaView>
        <Gradient style={styles.scrollableGradient} />
        <ScrollView ref="_scrollView">
          <View style={styles.scrollableView}>
            <IonIcon name="ios-at" style={styles.iconIon} color={THEME.COLORS.BLUE_3} size={ionIconSize} />
            <View style={[styles.createWalletPromptArea, styles.paddings, styles.title]}>
              <T style={styles.instructionalText}>{s.strings.fio_domain_reg_text}</T>
            </View>
            <View style={[styles.createWalletPromptArea, styles.paddings, styles.title]}>
              <T style={styles.instructionalText}>{s.strings.fio_domain_reg_descr}</T>
            </View>

            <View style={styles.formFieldView} ref="_fieldView" onLayout={this.fieldViewOnLayout}>
              <View style={styles.formFieldViewContainer}>
                <FormField
                  style={materialInputOnWhiteStyle}
                  clearButtonMode={this.clearButtonMode}
                  autoCorrect={false}
                  autoCapitalize="none"
                  placeholder={s.strings.fio_domain_label}
                  caretHidden
                  onFocus={this.handleFioDomainFocus}
                  onChangeText={this.handleFioDomainChange}
                  onSubmitEditing={this.handleNextButton}
                  selectionColor={THEME.COLORS.ACCENT_MINT}
                  label={s.strings.fio_domain_choose_label}
                  value={fioDomain}
                  returnKeyType={this.returnKeyType}
                  error={chooseHandleErrorMessage}
                  disabled={walletLoading || domainsLoading}
                  prefix="@"
                />
              </View>
              {this.renderLoader()}
            </View>

            {this.renderFioWallets()}
            {this.renderButton()}
            <View style={styles.bottomSpace} />
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  scrollableGradient: {
    height: THEME.HEADER
  },
  scrollableView: {
    position: 'relative',
    paddingHorizontal: theme.rem(1)
  },
  createWalletPromptArea: {
    paddingTop: theme.rem(1),
    paddingBottom: theme.rem(0.5)
  },
  instructionalText: {
    fontSize: theme.rem(1),
    textAlign: 'center',
    color: theme.deactivatedText
  },
  handleRequirementsText: {
    fontSize: theme.rem(1),
    textAlign: 'left',
    color: theme.deactivatedText
  },
  buttons: {
    marginTop: theme.rem(1.5),
    flexDirection: 'row'
  },
  next: {
    flex: 1
  },

  image: {
    alignSelf: 'center',
    marginTop: theme.rem(1.5),
    height: theme.rem(3.1),
    width: theme.rem(3.5)
  },
  title: {
    paddingTop: theme.rem(1.5)
  },
  paddings: {
    paddingVertical: theme.rem(0.5)
  },
  inputContainer: {
    width: 'auto',
    marginTop: 0,
    marginBottom: 0
  },
  statusIconError: {
    color: theme.negativeText
  },
  statusIconOk: {
    color: theme.positiveText
  },
  formFieldView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.rem(0.8),
    marginBottom: theme.rem(0.75)
  },
  formFieldViewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: PLATFORM.deviceWidth - theme.rem(4.5)
  },
  statusIconContainer: {
    width: theme.rem(1.5),
    height: theme.rem(1.5)
  },
  statusIcon: {
    alignSelf: 'flex-end',
    marginTop: theme.rem(1.75),
    width: theme.rem(1.5),
    height: theme.rem(1.5)
  },
  bottomSpace: {
    paddingBottom: theme.rem(30)
  },
  selectWalletBtn: {
    marginTop: theme.rem(1),
    paddingVertical: theme.rem(0.6),
    paddingHorizontal: theme.rem(0.3),
    backgroundColor: theme.backgroundGradientLeft
  },
  domain: {
    marginTop: theme.rem(1),
    marginLeft: theme.rem(0.3),
    paddingHorizontal: theme.rem(0.6),
    paddingVertical: theme.rem(0.25),
    borderRadius: theme.rem(0.4),
    borderColor: theme.backgroundGradientLeft,
    borderWidth: theme.rem(0.1)
  },
  domainText: {
    color: theme.backgroundGradientLeft,
    fontSize: theme.rem(1)
  },
  domainListRowName: {
    flex: 1,
    fontSize: theme.rem(1),
    color: theme.secondaryText
  },
  domainListRowContainerTop: {
    height: 'auto',
    paddingLeft: theme.rem(0.75),
    paddingRight: theme.rem(0.75),
    paddingVertical: theme.rem(0.75)
  },
  iconIon: {
    alignSelf: 'center',
    marginTop: theme.rem(1.5),
    height: theme.rem(4),
    width: theme.rem(4),
    textAlign: 'center'
  }
}))

const FioDomainRegisterScene = connect((state: State) => {
  const { account } = state.core
  if (!account || !account.currencyConfig) {
    return {
      fioWallets: [],
      fioPlugin: {},
      isConnected: state.network.isConnected
    }
  }
  const fioWallets: EdgeCurrencyWallet[] = getFioWallets(state)
  const fioPlugin = account.currencyConfig[Constants.CURRENCY_PLUGIN_NAMES.FIO]

  const out: StateProps = {
    fioWallets,
    fioPlugin,
    isConnected: state.network.isConnected
  }
  return out
}, {})(withTheme(FioDomainRegister))
export { FioDomainRegisterScene }
