// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'

export const isPubAddressNotConnected = (pubAddress: string | null): boolean => {
  return !pubAddress || pubAddress === '0'
}

export const refreshPubAddressesForFioAddress = async (fioAddress: string, fioWallet: EdgeCurrencyWallet, wallets: EdgeCurrencyWallet[]) => {
  const pubAddresses = {}
  for (const wallet of wallets) {
    const enabledTokens = await wallet.getEnabledTokens()
    if (enabledTokens && enabledTokens.length) {
      for (const enabledToken: string of enabledTokens) {
        try {
          const { public_address } = await fioWallet.otherMethods.fioAction('getPublicAddress', {
            fioAddress,
            tokenCode: enabledToken,
            chainCode: wallet.currencyInfo.currencyCode
          })
          pubAddresses[enabledToken] = public_address
        } catch (e) {
          //
          console.log(e.json)
        }
      }
    }
    if (pubAddresses[wallet.currencyInfo.currencyCode] && pubAddresses[wallet.currencyInfo.currencyCode] !== '0') continue
    try {
      const { public_address } = await fioWallet.otherMethods.fioAction('getPublicAddress', {
        fioAddress,
        tokenCode: wallet.currencyInfo.currencyCode,
        chainCode: wallet.currencyInfo.currencyCode
      })
      pubAddresses[wallet.currencyInfo.currencyCode] = public_address
    } catch (e) {
      //
      console.log(e.json)
    }
  }
  return pubAddresses
}

export const findWalletByFioAddress = async (fioWallets: EdgeCurrencyWallet[], fioAddress: string): Promise<EdgeCurrencyWallet | null> => {
  if (fioWallets && fioWallets.length) {
    for (const wallet: EdgeCurrencyWallet of fioWallets) {
      const fioAddresses: string[] = await wallet.otherMethods.getFioAddressNames()
      if (fioAddresses.length > 0) {
        for (const address of fioAddresses) {
          if (address.toLowerCase() === fioAddress.toLowerCase()) {
            return wallet
          }
        }
      }
    }

    return null
  } else {
    return null
  }
}
