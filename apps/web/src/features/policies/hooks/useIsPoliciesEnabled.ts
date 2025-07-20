import policyContracts from '@/features/policies/contracts/contracts.json'
import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@/utils/addresses'

/**
 * Checks that the user's Safe is enabled for policies
 * @returns {boolean} Whether the policies guard is enabled for the user's Safe
 */
const useIsPoliciesEnabled = () => {
  const { safe } = useSafeInfo()
  return sameAddress(safe.guard?.value, policyContracts.safePolicyGuard)
}

export default useIsPoliciesEnabled
