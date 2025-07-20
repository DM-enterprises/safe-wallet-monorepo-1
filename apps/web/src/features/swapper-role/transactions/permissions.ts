import { ERC20__factory } from '@safe-global/utils/types/contracts'
import { Interface } from 'ethers'
import { c, forAll } from 'zodiac-roles-sdk'
import type { Permission } from 'zodiac-roles-sdk'

import { CowOrderSignerAbi } from '@/features/swapper-role/abis/cow-order-signer'
import { isSwapperRoleChain, SWAPPER_ROLE_CONTRACTS } from '../constants'

const CowOrderSignerInterface = new Interface(CowOrderSignerAbi)
const Erc20Interface = ERC20__factory.createInterface()
const WrappedNativeTokenInterface = new Interface(['function deposit()', 'function withdraw(uint)'])

const oneOf = <T extends unknown>(values: readonly T[]) => {
  if (values.length === 0) {
    throw new Error('`oneOf` values must not be empty')
  }

  return values.length === 1 ? c.eq(values[0]) : c.or(...(values as [T, T, ...T[]]))
}

export const allowErc20Approve = (tokens: readonly `0x${string}`[], spenders: readonly `0x${string}`[]) =>
  forAll(tokens, {
    send: false,
    delegatecall: false,
    selector: Erc20Interface.getFunction('approve').selector as `0x${string}`,
    condition: c.calldataMatches([oneOf(spenders)], ['address', 'uint256']),
  })

export const allowWrappingNativeTokens = (tokenAddress: `0x${string}`): Permission => ({
  targetAddress: tokenAddress,
  send: true,
  delegatecall: false,
  selector: WrappedNativeTokenInterface.getFunction('deposit')!.selector as `0x${string}`,
})

export const allowUnwrappingNativeTokens = (tokenAddress: `0x${string}`): Permission => ({
  targetAddress: tokenAddress,
  send: false,
  delegatecall: false,
  selector: WrappedNativeTokenInterface.getFunction('withdraw')!.selector as `0x${string}`,
})

export const allowCreatingOrders = (
  chainId: string,
  tokenAllowances: Array<{
    token: `0x${string}`
    amount: bigint
    type: 'sell' | 'buy'
    allowanceKey: `0x${string}`
  }>,
  receivers: Array<`0x${string}`>,
): Permission => {
  if (!isSwapperRoleChain(chainId)) {
    throw new Error('Unsupported chain')
  }

  const signOrder = CowOrderSignerInterface.getFunction('signOrder')!
  const orderStruct = `tuple(${signOrder.inputs[0].components!.map((x) => x.type).join(',')})`

  const conditions = tokenAllowances.map((condition) => {
    const isSell = condition.type === 'sell'
    const isBuy = condition.type === 'buy'

    return c.calldataMatches(
      [
        c.matches([
          isSell ? c.eq(condition.token) : c.pass,
          isBuy ? c.eq(condition.token) : c.pass,
          oneOf(receivers),
          isSell ? c.withinAllowance(condition.allowanceKey) : c.pass,
          isBuy ? c.withinAllowance(condition.allowanceKey) : c.pass,
          c.pass,
          c.pass,
          c.pass,
          c.pass,
          c.pass,
          c.pass,
          c.pass,
        ]),
      ],
      [orderStruct, 'uint32', 'uint256'],
    )
  })

  return {
    targetAddress: SWAPPER_ROLE_CONTRACTS[chainId].cowSwap.orderSigner,
    send: false,
    delegatecall: true, // Delegate call is required for signing orders
    selector: signOrder.selector as `0x${string}`,
    condition: oneOf(conditions),
  }
}
