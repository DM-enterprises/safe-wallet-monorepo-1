import TxLayout, { TxStep } from '@/components/tx-flow/common/TxLayout'
import useTxStepper from '@/components/tx-flow/useTxStepper'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import { useMemo } from 'react'
import { AddPoliciesParams } from '../AddPolicy/AddPolicy'
import ReviewPolicy from '../AddPolicy/ReviewPolicy'

const ConfimPolicyFlow = ({ policy }: { policy: AddPoliciesParams }) => {
  const { step, nextStep, prevStep } = useTxStepper(undefined)

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <ReviewPolicy key={0} params={policy} onSubmit={() => nextStep(undefined)} confirmPolicies />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={1} onSubmit={() => {}} />,
      },
    ],
    [nextStep, policy],
  )

  return (
    <TxLayout subtitle="Confirm policy" step={step} onBack={prevStep} {...(steps?.[step]?.txLayoutProps || {})}>
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default ConfimPolicyFlow
