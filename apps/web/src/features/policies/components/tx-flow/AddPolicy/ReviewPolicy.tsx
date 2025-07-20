import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import FieldsGrid from '@/components/tx/FieldsGrid'
import ReviewTransaction from '@/components/tx/ReviewTransaction'
import SendToBlock from '@/components/tx/SendToBlock'
import policyContracts from '@/features/policies/contracts/contracts.json'
import {
  createConfigureAndConfimPolicyTx,
  createConfigurePolicyTx,
  createConfirmPolicyTx,
  PolicyType,
} from '@/features/policies/contracts/policyContracts'
import useSafeInfo from '@/hooks/useSafeInfo'
import { createEnableGuardTx, createMultiSendCallOnlyTx } from '@/services/tx/tx-sender'
import { sameAddress } from '@/utils/addresses'
import { Divider, Typography } from '@mui/material'
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import { useContext, useEffect } from 'react'
import { AddPoliciesParams } from './AddPolicy'
import { POLICY_TYPE_OPTIONS } from './CreatePolicy'

const configurePoliciesTx = async (
  params: AddPoliciesParams,
  isGuardEnabled: boolean,
  safePolicyGuardAddress: string,
) => {
  const txs: MetaTransactionData[] = []

  if (!isGuardEnabled) {
    // Initial policies setup if the guard is not enabled
    const calls = params.policies
      .map((policy) => {
        return createConfigureAndConfimPolicyTx({
          safePolicyGuardAddress,
          targetAddress: policy.targetAddress,
          selector: policy.selector,
          operation: policy.operation,
          policyAddress: policyContracts.policies[policy.policyType],
          data: policy.data,
        })
      })
      .flat()
    txs.push(...calls)
    // Add the guard *after* the initial policies setup
    const enableGuardTx = await createEnableGuardTx(safePolicyGuardAddress)
    const tx = {
      to: enableGuardTx.data.to,
      value: '0',
      data: enableGuardTx.data.data,
    }
    txs.push(tx)
  } else {
    const calls = params.policies
      .map((policy) => {
        return createConfigurePolicyTx({
          safePolicyGuardAddress,
          targetAddress: policy.targetAddress,
          selector: policy.selector,
          operation: policy.operation,
          policyAddress: policyContracts.policies[policy.policyType],
          data: policy.data,
        })
      })
      .flat()
    txs.push(...calls)
  }

  return txs
}

const confirmPoliciesTx = (params: AddPoliciesParams, safeAddress: string) => {
  const txs: MetaTransactionData[] = []

  const calls = params.policies
    .map((policy) => {
      return createConfirmPolicyTx({
        safeAddress,
        targetAddress: policy.targetAddress,
        selector: policy.selector,
        operation: policy.operation,
        policyAddress: policyContracts.policies[policy.policyType],
        data: policy.data,
      })
    })
    .flat()
  txs.push(...calls)

  return txs
}

const ReviewPolicy = ({
  params,
  onSubmit,
  confirmPolicies,
}: {
  params: AddPoliciesParams
  onSubmit: () => void
  confirmPolicies?: boolean
}) => {
  const { safe } = useSafeInfo()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  const safePolicyGuardAddress = policyContracts.safePolicyGuard
  const isGuardEnabled = sameAddress(safe.guard?.value, safePolicyGuardAddress)

  useEffect(() => {
    const init = async () => {
      console.log('Review policies', params)

      const txs = confirmPolicies
        ? confirmPoliciesTx(params, safe.address.value)
        : await configurePoliciesTx(params, isGuardEnabled, safePolicyGuardAddress)

      createMultiSendCallOnlyTx(txs).then(setSafeTx).catch(setSafeTxError)
    }
    init()
  }, [params, safe, setSafeTx, setSafeTxError])

  const onFormSubmit = () => {
    onSubmit()
  }

  return (
    <ReviewTransaction onSubmit={onFormSubmit}>
      {params.policies.map((policy, i) => {
        return (
          <>
            <Typography variant="body1" fontWeight={700}>
              {POLICY_TYPE_OPTIONS.find((policyType) => policyType.value === policy.policyType)?.label} policy
            </Typography>

            {policy.context && (
              <SendToBlock
                address={policy.context}
                title={policy.policyType === PolicyType.COSIGNER ? 'Co-signer:' : 'Receiver:'}
              />
            )}

            {policy.targetAddress && (
              <SendToBlock
                address={policy.targetAddress}
                title={policy.policyType === PolicyType.ERC20_TRANSFER ? 'Token:' : 'Receiver:'}
              />
            )}

            {policy.selector !== '0x00000000' && (
              <FieldsGrid title="Selector:">
                <Typography
                  component="span"
                  variant="body2"
                  alignContent="center"
                  color="primary.light"
                  py={0.5}
                  px={1}
                  borderRadius={0.5}
                  bgcolor="background.light"
                >
                  {policy.selector}
                </Typography>
              </FieldsGrid>
            )}

            {params.policies.length - 1 > i && <Divider sx={{ mt: 1, mb: 1 }} />}
          </>
        )
      })}
    </ReviewTransaction>
  )
}

export default ReviewPolicy
