import { useContext, useEffect, useMemo } from 'react'
import type { ReactElement } from 'react'

import ReviewTransaction from '@/components/tx/ReviewTransaction'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import useSafeInfo from '@/hooks/useSafeInfo'
import { enableSwapper } from '@/features/swapper-role/transactions/enable'
import { SafeTxContext } from '../../SafeTxProvider'
import TxCard from '../../common/TxCard'
import { type SetupSwapperRoleData } from '.'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { safeParseUnits } from '@safe-global/utils/utils/formatters'

const SetupSwapperRoleReview = ({
  data,
  onSubmit,
}: {
  data: SetupSwapperRoleData
  onSubmit: (data: SetupSwapperRoleData) => void
}): ReactElement => {
  const { safe } = useSafeInfo()
  const sdk = useSafeSDK()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  const { balances: visibleBalances } = useVisibleBalances()

  const tokenInfos = useMemo(() => {
    return visibleBalances.items.map((item) => item.tokenInfo)
  }, [visibleBalances])

  useEffect(() => {
    if (!sdk) return

    const createTx = async () => {
      const members = data.members.map((member) => member.address as `0x${string}`)

      const sell = data.sell.map((asset) => {
        // TODO: Throw if we don't have token info?
        const tokenInfo = tokenInfos.find((token) => token.address === asset.tokenAddress)
        const amount = safeParseUnits(asset.amount, tokenInfo?.decimals || 18)?.toString()
        return {
          token: asset.tokenAddress as `0x${string}`,
          periodInSeconds: asset.periodInSeconds,
          amount: amount ? BigInt(amount) : BigInt(0),
          type: 'sell' as const,
        }
      })

      const buy = data.buy.map((asset) => {
        // TODO: Throw if we don't have token info?
        const tokenInfo = tokenInfos.find((token) => token.address === asset.tokenAddress)
        const amount = safeParseUnits(asset.amount, tokenInfo?.decimals || 18)?.toString()
        return {
          token: asset.tokenAddress as `0x${string}`,
          periodInSeconds: asset.periodInSeconds,
          amount: amount ? BigInt(amount) : BigInt(0),
          type: 'buy' as const,
        }
      })

      const transactions = await enableSwapper(
        safe.address.value as `0x${string}`,
        safe.chainId,
        members,
        [...sell, ...buy],
        data.receivers.map((receiver) => receiver.address as `0x${string}`),
      )
      return await sdk.createTransaction({ transactions, onlyCalls: true })
    }

    createTx().then(setSafeTx).catch(setSafeTxError)
  }, [
    sdk,
    safe.address.value,
    safe.chainId,
    setSafeTx,
    setSafeTxError,
    data.members,
    data.sell,
    data.buy,
    tokenInfos,
    data.receivers,
  ])

  return (
    <TxCard>
      <ReviewTransaction onSubmit={() => onSubmit(data)} />
    </TxCard>
  )
}

export default SetupSwapperRoleReview
