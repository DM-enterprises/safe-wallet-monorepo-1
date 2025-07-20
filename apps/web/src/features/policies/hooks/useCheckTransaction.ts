
import useAsync from '@/hooks/useAsync'
import { getPolicyGuardContractSDK } from '../contracts/policyContracts'

export type TransactionParameters = {
  safe: string
  to: string
  value: bigint
  data: string
  operation: number
  context?: string
}

export const useCheckTransaction = ({ safe, to, value, data, operation, context }: TransactionParameters) => {
  context = context ?? '0x'
  return useAsync(async () => {
    const policyGuard = getPolicyGuardContractSDK()
    console.log('checkTransaction')
    try {
      const asdf = await policyGuard.checkTransaction.staticCall(safe, to, value, data, operation, context)
      console.log('checkTransaction success', asdf)
      return true
    } catch (err) {
      console.log('checkTransaction error')
      console.warn(err)
      return false
    }
  }, [safe, to, value, data, operation, context])
}
