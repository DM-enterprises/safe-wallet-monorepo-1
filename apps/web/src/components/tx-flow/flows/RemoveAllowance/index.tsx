import { Interface } from 'ethers'
import { useContext, useEffect, useMemo } from 'react'
import type { ReactElement } from 'react'

import TxLayout from '@/components/tx-flow/common/TxLayout'
import useTxStepper from '@/components/tx-flow/useTxStepper'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import ReviewTransaction from '@/components/tx/ReviewTransaction'
import { createTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { RolesModifierAbi } from '@/features/swapper-role/abis/roles-modifier'

const RolesModifierInterface = new Interface(RolesModifierAbi)

export function RemoveAllowance({
  rolesModifierAddress,
  token,
  allowanceKey,
}: {
  rolesModifierAddress: string
  token: string
  allowanceKey: string
}): ReactElement {
  const { data, step, nextStep, prevStep } = useTxStepper({})

  const steps = useMemo(
    () => [
      <ReviewRemoveAllowance
        key={0}
        rolesModifierAddress={rolesModifierAddress}
        token={token}
        allowanceKey={allowanceKey}
        onSubmit={() => nextStep(data)}
      />,
      <ConfirmTxDetails key={1} onSubmit={() => {}} />,
    ],
    [allowanceKey, data, nextStep, rolesModifierAddress, token],
  )

  return (
    <TxLayout title="Remove allowance" step={step} onBack={prevStep}>
      {steps}
    </TxLayout>
  )
}

function ReviewRemoveAllowance({
  rolesModifierAddress,
  token,
  allowanceKey,
  onSubmit,
}: {
  rolesModifierAddress: string
  token: string
  allowanceKey: string
  onSubmit: () => void
}): ReactElement {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  useEffect(() => {
    const data = RolesModifierInterface.encodeFunctionData('setAllowance', [allowanceKey, 0, 0, 0, 0, 0])

    createTx({
      to: rolesModifierAddress,
      value: '0',
      data,
    })
      .then(setSafeTx)
      .catch(setSafeTxError)
  }, [rolesModifierAddress, allowanceKey, setSafeTx, setSafeTxError])

  return (
    <ReviewTransaction key={0} onSubmit={onSubmit}>
      Remove allowance for {token}
    </ReviewTransaction>
  )
}
