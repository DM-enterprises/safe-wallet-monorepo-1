import { concat, keccak256 } from 'ethers'

import { encodeRoleKey } from 'zodiac-roles-sdk'
import { SWAPPER_ROLE_KEY } from '../constants'

export const createAllowanceKey = (tokenAddress: `0x${string}`, buyOrSell: 'buy' | 'sell'): `0x${string}` => {
  const key = concat([encodeRoleKey(SWAPPER_ROLE_KEY), tokenAddress, buyOrSell === 'buy' ? '0x00' : '0x01'])
  return keccak256(key) as `0x${string}`
}
