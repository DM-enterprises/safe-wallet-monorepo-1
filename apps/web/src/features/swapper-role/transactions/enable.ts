import { id, ZeroAddress } from 'ethers'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { setUpRolesMod, setUpRoles, applyAllowances } from 'zodiac-roles-sdk'
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import type { Allowance, Permission } from 'zodiac-roles-sdk'

import {
  allowErc20Approve,
  allowWrappingNativeTokens,
  allowCreatingOrders,
  allowUnwrappingNativeTokens,
} from './permissions'
import { createAllowanceKey } from './allowances'
import { isSwapperRoleChain, SWAPPER_ROLE_CONTRACTS, SWAPPER_ROLE_KEY } from '../constants'

const SafeInterface = Safe__factory.createInterface()

const enableModuleSelector = SafeInterface.getFunction('enableModule')!.selector

export async function enableSwapper(
  safeAddress: `0x${string}`,
  chainId: string,
  members: Array<`0x${string}`>,
  tokenAllowances: Array<{
    token: `0x${string}`
    amount: bigint
    type: 'sell' | 'buy'
    periodInSeconds: number
  }>,
  receivers: Array<`0x${string}`>,
): Promise<Array<MetaTransactionData>> {
  if (!isSwapperRoleChain(chainId)) {
    throw new Error('Unsupported chain')
  }

  const transactions = setUpRolesMod({
    avatar: safeAddress,
    saltNonce: id(SWAPPER_ROLE_KEY + Date.now()) as `0x${string}`,
  })

  const enableModule = transactions.find((transaction) => {
    return transaction.data.startsWith(enableModuleSelector)
  })

  if (!enableModule) {
    throw new Error('No enableModule not found')
  }

  const [rolesModifierAddress] = SafeInterface.decodeFunctionData('enableModule', enableModule.data)

  const permissions: Array<Permission> = []

  const { weth } = SWAPPER_ROLE_CONTRACTS[chainId]

  // Allow ERC-20 approve for CowSwap on selected tokens sell tokens
  const allowanceAddresses = tokenAllowances
    .filter((c) => c.type === 'sell')
    .map((config) => {
      if (config.token === ZeroAddress) {
        // Native tokens are wrapped and then swapped. So we need to approve the wrapped native tokens
        return weth
      } else {
        return config.token
      }
    })
  permissions.push(...allowErc20Approve(allowanceAddresses, [SWAPPER_ROLE_CONTRACTS[chainId].cowSwap.gpv2VaultRelayer]))

  const hasNativeToken = tokenAllowances.some((config) => config.token === ZeroAddress)
  if (hasNativeToken) {
    // Allow wrapping of WETH
    permissions.push(allowWrappingNativeTokens(weth))
    // Allow unwrapping of WETH
    permissions.push(allowUnwrappingNativeTokens(weth))
  }

  // Format allowances
  const allowances = tokenAllowances.map<Allowance>((config) => {
    const token = config.token === ZeroAddress ? weth : config.token
    const allowanceKey = createAllowanceKey(token, config.type)

    return {
      key: allowanceKey,
      balance: config.amount,
      refill: config.amount,
      maxRefill: config.amount,
      period: BigInt(config.periodInSeconds),
      timestamp: BigInt(0),
    }
  })

  // Apply allowances
  transactions.push(
    ...(
      await applyAllowances(allowances, {
        currentAllowances: [],
        mode: 'extend',
      })
    ).map((allowanceCallData) => ({
      data: allowanceCallData,
      to: rolesModifierAddress,
      value: '0',
    })),
  )

  // Allow creating orders using OrderSigner
  permissions.push(
    allowCreatingOrders(
      chainId,
      tokenAllowances.map((config) => {
        const token = config.token === ZeroAddress ? weth : config.token
        const allowanceKey = createAllowanceKey(token, config.type)
        return {
          token,
          amount: config.amount,
          type: config.type,
          allowanceKey,
        }
      }),
      receivers,
    ),
  )

  transactions.push(
    ...setUpRoles({
      address: rolesModifierAddress,
      roles: [
        {
          key: SWAPPER_ROLE_KEY,
          members,
          permissions,
        },
      ],
    }),
  )

  return transactions
}
