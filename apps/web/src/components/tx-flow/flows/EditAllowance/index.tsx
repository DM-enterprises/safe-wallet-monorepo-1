import { CardActions, Button, Grid2, MenuItem, Select, TextField } from '@mui/material'
import { Interface } from 'ethers'
import { useForm, FormProvider, Controller } from 'react-hook-form'
import { useContext, useEffect, useMemo } from 'react'
import type { ReactElement } from 'react'

import TxLayout from '@/components/tx-flow/common/TxLayout'
import useTxStepper from '@/components/tx-flow/useTxStepper'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import ReviewTransaction from '@/components/tx/ReviewTransaction'
import { createTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import TxCard from '../../common/TxCard'
import type { SwapperRoleAllowanceData } from '../SetupSwapperRole'
import { SwapperRolePeriodsInSeconds } from '../SetupSwapperRole/SetupSwapperRoleAllowances'
import { RolesModifierAbi } from '@/features/swapper-role/abis/roles-modifier'

const RolesModifierInterface = new Interface(RolesModifierAbi)

export function EditAllowance({
  rolesModifierAddress,
  allowanceKey,
  tokenAddress,
  type,
  amount,
  periodInSeconds,
}: {
  rolesModifierAddress: string
  allowanceKey: string
  tokenAddress: string
  type: 'sell' | 'buy'
  amount: string
  periodInSeconds: number
}): ReactElement {
  const { data, step, nextStep, prevStep } = useTxStepper({
    tokenAddress,
    amount,
    periodInSeconds,
  })

  const steps = useMemo(
    () => [
      <EditAllowanceOverview
        key={0}
        data={data}
        type={type}
        onSubmit={(formData: SwapperRoleAllowanceData) => nextStep({ ...data, ...formData })}
      />,
      <ReviewEditAllowance
        key={1}
        rolesModifierAddress={rolesModifierAddress}
        allowanceKey={allowanceKey}
        data={data}
        onSubmit={() => nextStep(data)}
      />,
      <ConfirmTxDetails key={2} onSubmit={() => {}} />,
    ],
    [allowanceKey, data, nextStep, rolesModifierAddress, type],
  )

  return (
    <TxLayout title="Remove allowance" step={step} onBack={prevStep}>
      {steps}
    </TxLayout>
  )
}

function EditAllowanceOverview({
  data,
  onSubmit,
  type,
}: {
  data: SwapperRoleAllowanceData
  onSubmit: (data: SwapperRoleAllowanceData) => void
  type: 'sell' | 'buy'
}): ReactElement {
  const formData = useForm<SwapperRoleAllowanceData>({
    values: data,
    mode: 'onChange',
    defaultValues: data,
  })

  return (
    <TxCard>
      <FormProvider {...formData}>
        <form onSubmit={formData.handleSubmit(onSubmit)}>
          Change {type} limit for {data.tokenAddress}
          <Grid2 container spacing={3}>
            <Grid2 size={{ xs: 6 }}>
              <TextField fullWidth label="Amount" type="number" {...formData.register('amount')} />
            </Grid2>
            <Grid2 size={{ xs: 6 }}>
              <Controller
                name="periodInSeconds"
                control={formData.control}
                render={({ field }) => (
                  <Select fullWidth {...field}>
                    {SwapperRolePeriodsInSeconds.map(({ value, label }) => (
                      <MenuItem key={label} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </Grid2>
          </Grid2>
          <CardActions>
            <Button type="submit" variant="contained">
              Continue
            </Button>
          </CardActions>
        </form>
      </FormProvider>
    </TxCard>
  )
}

function ReviewEditAllowance({
  rolesModifierAddress,
  allowanceKey,
  data,
  onSubmit,
}: {
  rolesModifierAddress: string
  allowanceKey: string
  data: SwapperRoleAllowanceData
  onSubmit: () => void
}): ReactElement {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  useEffect(() => {
    const amount = BigInt(data.amount)

    createTx({
      to: rolesModifierAddress,
      value: '0',
      data: RolesModifierInterface.encodeFunctionData('setAllowance', [
        allowanceKey,
        amount,
        amount,
        amount,
        BigInt(data.periodInSeconds),
        BigInt(0),
      ]),
    })
      .then(setSafeTx)
      .catch(setSafeTxError)
  }, [rolesModifierAddress, allowanceKey, setSafeTx, setSafeTxError, data.amount, data.periodInSeconds])

  return <ReviewTransaction key={0} onSubmit={onSubmit} />
}
