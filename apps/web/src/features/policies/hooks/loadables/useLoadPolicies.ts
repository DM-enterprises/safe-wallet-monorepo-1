import useAsync, { AsyncResult } from '@/hooks/useAsync'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { Errors, logError } from '@/services/exceptions'
import { ethers, type JsonRpcProvider } from 'ethers'
import { useEffect } from 'react'
import { PoliciesState } from '@/store/slices'

export const getPolicies = async (
  provider: JsonRpcProvider,
  safeAddress: string,
  chainId: string,
): Promise<PoliciesState[] | undefined> => {
  // TODO: Load policies
  return
}

export const useLoadPolicies = (): AsyncResult<PoliciesState[]> => {
  const { safeAddress, safe, safeLoaded } = useSafeInfo()
  const chainId = useChainId()
  const provider = useWeb3ReadOnly()

  const [data, error, loading] = useAsync<PoliciesState[] | undefined>(
    () => {
      if (!provider || !safeLoaded || !safe.guard) return

      return getPolicies(provider, safeAddress, chainId)
    },
    [provider, safeLoaded, safeAddress, chainId],
    false,
  )

  useEffect(() => {
    if (error) {
      logError(Errors._642, error.message)
    }
  }, [error])

  return [data, error, loading]
}

export default useLoadPolicies
