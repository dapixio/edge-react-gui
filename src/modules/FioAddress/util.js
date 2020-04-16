// @flow

export const isPubAddressNotConnected = (pubAddress: string | null): boolean => {
  return !pubAddress || pubAddress === '0'
}
