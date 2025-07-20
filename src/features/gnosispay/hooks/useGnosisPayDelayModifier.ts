import {
  isGenericProxy,
  getGenericProxyMasterCopy,
  isGnosisProxy,
  getGnosisProxyMasterCopy,
} from '@/features/recovery/services/proxies'
import { sameAddress } from '@/utils/addresses'
import { isAddress, type JsonRpcProvider } from 'ethers'

import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import useAsync from '@/hooks/useAsync'
import useWallet from '@/hooks/wallets/useWallet'
import { getDelayModifierContract } from '@/features/recovery/services/recovery-sender'

const GNOSIS_PAY_DELAY_MODIFIER_ADDRESS = '0x4a97e65188a950dd4b0f21f9b5434daee0bbf9f5'

async function isGnosisPayDelayModifier(
  chainId: string,
  moduleAddress: string,
  provider: JsonRpcProvider,
): Promise<boolean> {
  if (!isAddress(moduleAddress) || chainId !== '100') return false

  if (sameAddress(GNOSIS_PAY_DELAY_MODIFIER_ADDRESS, moduleAddress)) {
    return true
  }

  const bytecode = await provider.getCode(moduleAddress)

  if (isGenericProxy(bytecode)) {
    const masterCopy = getGenericProxyMasterCopy(bytecode)
    return await isGnosisPayDelayModifier(chainId, masterCopy, provider)
  }

  if (isGnosisProxy(bytecode)) {
    const masterCopy = await getGnosisProxyMasterCopy(moduleAddress, provider)
    return await isGnosisPayDelayModifier(chainId, masterCopy, provider)
  }

  return false
}

export const useGnosisPayDelayModifier = () => {
  const chainId = useChainId()
  const wallet = useWallet()
  const web3ReadOnly = useWeb3ReadOnly()

  const { safe } = useSafeInfo()

  const [gnosisPayDelayModifier] = useAsync(async () => {
    if (!web3ReadOnly || !safe.modules) {
      return undefined
    }
    const delayModuleMap = await Promise.all(
      safe.modules.map((module) => isGnosisPayDelayModifier(chainId, module.value, web3ReadOnly)),
    )
    return safe.modules[delayModuleMap.findIndex((v) => v)]
  }, [chainId, safe.modules, web3ReadOnly])

  return useAsync(
    () =>
      gnosisPayDelayModifier && wallet
        ? getDelayModifierContract({
            provider: wallet?.provider,
            chainId,
            delayModifierAddress: gnosisPayDelayModifier.value,
            signerAddress: wallet.address,
          })
        : undefined,
    [chainId, gnosisPayDelayModifier, wallet],
  )
}
