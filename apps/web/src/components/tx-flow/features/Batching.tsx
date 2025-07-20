import { type ReactElement, useContext, type SyntheticEvent } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import BatchButton from '@/components/tx/SignOrExecuteForm/BatchButton'
import { TxModalContext } from '..'
import { useTxActions } from '@/components/tx/SignOrExecuteForm/hooks'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useSafeInfo from '@/hooks/useSafeInfo'
import { FlowFeature } from '.'
import { useHasFlowFeature } from '../useHasFlowFeature'
import { isDelegateCall } from '@/services/tx/tx-sender/sdk'
import { TxFlowContext } from '../common/TxFlow/TxFlowProvider'

export type BatchProps = {
  origin?: string
  submitDisabled?: boolean
  isCreation?: boolean
  isBatch?: boolean
}

export const Batching = ({ submitDisabled, isCreation, isBatch }: BatchProps): ReactElement | null => {
  const hasFlowFeature = useHasFlowFeature(FlowFeature.Batching)
  const { setTxFlow } = useContext(TxModalContext)
  const { addToBatch } = useTxActions()
  const { safeTx } = useContext(SafeTxContext)
  const { willExecute, isProposing, willExecuteThroughRole, isSubmittable, setIsSubmittable } =
    useContext(TxFlowContext)
  const isOwner = useIsSafeOwner()
  const { safe } = useSafeInfo()

  const isCounterfactualSafe = !safe.deployed

  const isBatchable = hasFlowFeature && !!safeTx && !isDelegateCall(safeTx)

  const onBatchClick = async (e: SyntheticEvent) => {
    e.preventDefault()

    if (!safeTx) return

    setIsSubmittable(false)

    await addToBatch(safeTx, origin)

    setIsSubmittable(true)

    setTxFlow(undefined)
  }

  if (
    !isOwner ||
    !isCreation ||
    isBatch ||
    isCounterfactualSafe ||
    willExecute ||
    willExecuteThroughRole ||
    isProposing
  ) {
    return null
  }

  return (
    <BatchButton
      onClick={onBatchClick}
      disabled={submitDisabled || !isSubmittable || !isBatchable}
      tooltip={!isBatchable ? `Cannot batch this type of transaction` : undefined}
    />
  )
}
