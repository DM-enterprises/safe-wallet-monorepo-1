import { createApi, skipToken } from '@reduxjs/toolkit/query/react'
import { AbiCoder, Contract, getAddress, Interface, isHexString } from 'ethers'
import { fetchRole, Operator } from 'zodiac-roles-sdk'
import type { Role } from 'zodiac-roles-sdk'
import type { JsonRpcProvider } from 'ethers'

import { isSwapperRoleChain, SWAPPER_ROLE_CONTRACTS } from '@/features/swapper-role/constants'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { CowOrderSignerAbi } from '@/features/swapper-role/abis/cow-order-signer'
import { RolesModifierAbi } from '@/features/swapper-role/abis/roles-modifier'

const CowOrderSignerInterface = new Interface(CowOrderSignerAbi)
const RolesModifierInterface = new Interface(RolesModifierAbi)

const signOrderSelector = CowOrderSignerInterface.getFunction('signOrder')!.selector

const noopBaseQuery = async () => ({ data: null })

const createBadRequestError = (message: string) => ({
  error: { status: 400, statusText: 'Bad Request', data: message },
})

export const swapperRoleApi = createApi({
  reducerPath: 'swapperApi',
  baseQuery: noopBaseQuery,
  tagTypes: ['SwapperRole'],
  endpoints: (builder) => ({
    getRolesModifier: builder.query<
      string | null,
      { chainId: string; provider: JsonRpcProvider; modules: SafeInfo['modules'] }
    >({
      async queryFn(args) {
        if (!args.modules || args.modules.length === 0) {
          return {
            data: null,
          }
        }

        if (!isSwapperRoleChain(args.chainId)) {
          return createBadRequestError('Unsupported chain')
        }

        const expectedByteCode = `0x363d3d373d3d3d363d73${SWAPPER_ROLE_CONTRACTS[args.chainId].roles.slice(2).toLowerCase()}5af43d82803e903d91602b57fd5bf3`

        for (const { value } of args.modules) {
          const code = await args.provider.getCode(value, 'latest')

          if (code === expectedByteCode) {
            return {
              data: value,
            }
          }
        }

        return {
          data: null,
        }
      },
      providesTags: ['SwapperRole'],
    }),
    getRole: builder.query<
      Role | null,
      { chainId: SafeInfo['chainId']; provider: JsonRpcProvider; roleKey: string; rolesModifierAddress: string }
    >({
      async queryFn(args) {
        const chainId = Number(args.chainId)

        // TODO: Improve type handling
        if (!isHexString(args.rolesModifierAddress) || !isHexString(args.roleKey) || chainId !== 11155111) {
          return createBadRequestError('Invalid address or role key')
        }

        return {
          data: await fetchRole({
            address: args.rolesModifierAddress,
            roleKey: args.roleKey,
            chainId,
          }),
        }
      },
      providesTags: ['SwapperRole'],
    }),
    getAllowances: builder.query<
      Array<{
        token: string
        type: 'sell' | 'buy'
        receivers: Array<string>
        allowanceKey: string
        allowance: {
          refill: string
          maxRefill: string
          period: string
          balance: string
          timestamp: string
          isUnset: boolean
        }
      }> | null,
      {
        chainId: SafeInfo['chainId']
        provider: JsonRpcProvider
        roleKey: string
        rolesModifierAddress: string
      }
    >({
      async queryFn(args) {
        const chainId = Number(args.chainId)

        // TODO: Improve type handling
        if (!isHexString(args.rolesModifierAddress) || !isHexString(args.roleKey) || chainId !== 11155111) {
          return createBadRequestError('Invalid address or role key')
        }

        const role = await fetchRole({
          address: args.rolesModifierAddress,
          roleKey: args.roleKey,
          chainId,
        })

        if (!role) {
          return { data: null }
        }

        const orderSignerTarget = role.targets.find((target) => {
          if (!isSwapperRoleChain(args.chainId)) {
            return false
          }
          return sameAddress(target.address, SWAPPER_ROLE_CONTRACTS[args.chainId].cowSwap.orderSigner)
        })

        if (!orderSignerTarget) {
          return { data: null }
        }

        const signOrderScope = orderSignerTarget.functions.find((func) => func.selector === signOrderSelector)

        if (!signOrderScope?.condition) {
          return { data: null }
        }
        // TODO: This does not work when having only one sell or buy token
        const signOrderConditions = signOrderScope.condition.children
          ?.find((child) => {
            return 'children' in child
          })
          ?.children?.filter((grandChild) => {
            return (
              'children' in grandChild &&
              grandChild.children?.some((greatGrandChild) => {
                return greatGrandChild.operator !== Operator.Pass
              })
            )
          })

        if (!signOrderConditions) {
          return { data: null }
        }

        const allowances = signOrderConditions
          .map((condition) => {
            if (condition.operator !== Operator.Matches || !condition.children) {
              return null
            }

            const [_sellToken, _buyToken, _receiver, _sellAmount, _buyAmount] = condition.children

            let sellToken: string | undefined
            let buyToken: string | undefined
            let receivers: Array<string> | undefined
            let sellAmountAllowanceKey: string | undefined
            let buyAmountAllowanceKey: string | undefined

            if (_sellToken.operator === Operator.EqualTo && _sellToken.compValue) {
              sellToken = decodeAddress(_sellToken.compValue)
            }

            if (_buyToken.operator === Operator.EqualTo && _buyToken.compValue) {
              buyToken = decodeAddress(_buyToken.compValue)
            }

            if (_receiver.operator === Operator.Or) {
              receivers = _receiver.children
                ?.map((child) => {
                  if (child.operator === Operator.EqualTo && child.compValue) {
                    return decodeAddress(child.compValue)
                  }
                })
                .filter((child) => child != null)
            } else if (_receiver.operator === Operator.EqualTo && _receiver.compValue) {
              receivers = [decodeAddress(_receiver.compValue)]
            }

            if (_sellAmount.operator === Operator.WithinAllowance && _sellAmount.compValue) {
              sellAmountAllowanceKey = decodeAllowanceKey(_sellAmount.compValue)
            }

            if (_buyAmount.operator === Operator.WithinAllowance && _buyAmount.compValue) {
              buyAmountAllowanceKey = decodeAllowanceKey(_buyAmount.compValue)
            }

            return {
              sellToken,
              buyToken,
              receivers,
              sellAmountAllowanceKey,
              buyAmountAllowanceKey,
            }
          })
          .filter((value) => value != null)

        const MAX_UINT128 = (BigInt(1) << BigInt(128)) - BigInt(1)
        const rolesModifier = new Contract(args.rolesModifierAddress, RolesModifierInterface, args.provider)

        const data = await Promise.all(
          allowances.map(async (a) => {
            const token = a.sellToken ?? a.buyToken
            const allowanceKey = a.sellAmountAllowanceKey ?? a.buyAmountAllowanceKey

            if (!token || !allowanceKey || !a.receivers) {
              return null
            }

            const allowance = (await rolesModifier.allowances(allowanceKey)) as {
              refill: bigint
              maxRefill: bigint
              period: bigint
              balance: bigint
              timestamp: bigint
            }

            const isUnset =
              allowance.balance === BigInt(0) &&
              allowance.period === BigInt(0) &&
              allowance.refill === BigInt(0) &&
              allowance.maxRefill === MAX_UINT128

            return {
              token,
              type: a.sellAmountAllowanceKey ? ('sell' as const) : ('buy' as const),
              receivers: a.receivers,
              allowanceKey,
              allowance: {
                refill: allowance.refill.toString(),
                maxRefill: allowance.maxRefill.toString(),
                period: allowance.period.toString(),
                balance: allowance.balance.toString(),
                timestamp: allowance.timestamp.toString(),
                isUnset,
              },
            }
          }),
        )

        return { data: data.filter((d) => d != null) }
      },
      providesTags: ['SwapperRole'],
    }),
  }),
})

function decodeAddress(compValue: `0x${string}`): string {
  return getAddress(`0x${compValue.slice(-40)}`)
}

const defaultAbiCoder = AbiCoder.defaultAbiCoder()
function decodeAllowanceKey(compValue: `0x${string}`): string {
  const [allowanceKey] = defaultAbiCoder.decode(['bytes32'], compValue)
  return allowanceKey
}

const {
  useGetRolesModifierQuery: _useGetRolesModifierQuery,
  useGetRoleQuery: _useGetRoleQuery,
  useGetAllowancesQuery: _useGetAllowancesQuery,
} = swapperRoleApi

export function useGetRolesModifierQuery() {
  const { safeLoaded, safe } = useSafeInfo()
  const web3ReadOnly = useWeb3ReadOnly()

  return _useGetRolesModifierQuery(
    safeLoaded && web3ReadOnly ? { provider: web3ReadOnly, chainId: safe.chainId, modules: safe.modules } : skipToken,
  )
}

export function useGetRoleQuery(roleKey: string, rolesModifierAddress?: string) {
  const { safeLoaded, safe } = useSafeInfo()
  const web3ReadOnly = useWeb3ReadOnly()

  return _useGetRoleQuery(
    safeLoaded && web3ReadOnly && rolesModifierAddress
      ? { provider: web3ReadOnly, chainId: safe.chainId, roleKey, rolesModifierAddress }
      : skipToken,
  )
}

export function useGetAllowancesQuery(roleKey: string, rolesModifierAddress?: string) {
  const { safeLoaded, safe } = useSafeInfo()
  const web3ReadOnly = useWeb3ReadOnly()

  return _useGetAllowancesQuery(
    safeLoaded && web3ReadOnly && rolesModifierAddress
      ? { provider: web3ReadOnly, chainId: safe.chainId, roleKey, rolesModifierAddress }
      : skipToken,
  )
}
