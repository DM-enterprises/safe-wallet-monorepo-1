import {
  Typography,
  CardActions,
  Button,
  Select,
  MenuItem,
  Grid2,
  IconButton,
  SvgIcon,
  Box,
  Divider,
} from '@mui/material'
import { Fragment } from 'react'
import { useForm, useFieldArray, FormProvider, Controller, useFormContext } from 'react-hook-form'
import type { ReactElement } from 'react'
import type { UseFieldArrayReturn } from 'react-hook-form'

import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import TokenAmountInput from '@/components/common/TokenAmountInput'
import AddIcon from '@/public/images/common/add.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import TxCard from '../../common/TxCard'
import type { SetupSwapperRoleData } from '.'

export const SwapperRolePeriodsInSeconds = [
  {
    value: 0,
    label: 'No limit',
  },
  {
    value: 60 * 60 * 24,
    label: 'Daily',
  },
  {
    value: 60 * 60 * 24 * 7,
    label: 'Weekly',
  },
  {
    value: 60 * 60 * 24 * 30,
    label: 'Monthly',
  },
]

export function SetupSwapperRoleAllowances({
  data,
  onSubmit,
}: {
  data: SetupSwapperRoleData
  onSubmit: (data: SetupSwapperRoleData) => void
}): ReactElement {
  const formData = useForm<SetupSwapperRoleData>({
    values: data,
    mode: 'onChange',
    defaultValues: data,
  })

  const sellFieldArray = useFieldArray({
    control: formData.control,
    name: 'sell',
  })

  const buyFieldArray = useFieldArray({
    control: formData.control,
    name: 'buy',
  })

  return (
    <TxCard>
      <FormProvider {...formData}>
        <form onSubmit={formData.handleSubmit(onSubmit)}>
          <SetupSwapperRoleForm type="sell" fieldArray={sellFieldArray} />

          <Divider flexItem sx={{ my: 3 }} />

          <SetupSwapperRoleForm type="buy" fieldArray={buyFieldArray} />

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

function SetupSwapperRoleForm({
  type,
  fieldArray,
}: {
  type: 'sell' | 'buy'
  fieldArray: UseFieldArrayReturn<SetupSwapperRoleData, 'sell' | 'buy', 'id'>
}): ReactElement {
  const { balances } = useVisibleBalances()
  const formData = useFormContext()

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Box
          sx={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            backgroundColor: type === 'sell' ? 'success.background' : 'error.background',
            mr: 2,
          }}
        />
        <Typography fontWeight={700}>{type === 'sell' ? 'Sell limits' : 'Buy limits'}</Typography>
      </Box>

      <Box ml={6}>
        <Typography my={2}>Set the amount a Swapper can {type === 'sell' ? 'sell' : 'buy'}.</Typography>

        <Grid2 container spacing={3}>
          {fieldArray.fields.map((field, index) => (
            <Fragment key={field.id}>
              <Grid2 size={{ xs: 8 }}>
                <TokenAmountInput
                  fieldArray={{ name: type, index }}
                  balances={balances.items}
                  selectedToken={balances.items.find((b) => b.tokenInfo.address === field.tokenAddress)}
                />
              </Grid2>

              <Grid2 size={{ xs: 3 }}>
                <Controller
                  name={`${type}.${index}.periodInSeconds`}
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

              <Grid2 size={{ xs: 1 }} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {index > 0 && (
                  <IconButton onClick={() => fieldArray.remove(index)}>
                    <SvgIcon component={DeleteIcon} inheritViewBox />
                  </IconButton>
                )}
              </Grid2>
            </Fragment>
          ))}
        </Grid2>
      </Box>

      <Button
        onClick={() => {
          fieldArray.append({
            tokenAddress: '',
            periodInSeconds: 0,
            amount: '0',
          })
        }}
        variant="text"
        startIcon={<SvgIcon component={AddIcon} inheritViewBox />}
        sx={{
          mt: 3,
          ml: 4,
          ':hover': {
            backgroundColor: 'transparent',
          },
        }}
        disableRipple
      >
        Add token limit
      </Button>
    </>
  )
}
