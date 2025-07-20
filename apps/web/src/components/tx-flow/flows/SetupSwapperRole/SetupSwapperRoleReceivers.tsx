import { CardActions, Button, FormControlLabel, Switch, SvgIcon, Grid2, IconButton } from '@mui/material'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { Fragment, useState, type ReactElement } from 'react'

import TxCard from '../../common/TxCard'
import type { SetupSwapperRoleData } from '.'
import AddressBookInput from '@/components/common/AddressBookInput'
import AddressInputReadOnly from '@/components/common/AddressInputReadOnly'
import AddIcon from '@/public/images/common/add.svg'
import DeleteIcon from '@/public/images/common/delete.svg'

export function SetupSwapperRoleReceivers({
  data,
  onSubmit,
}: {
  data: SetupSwapperRoleData
  onSubmit: (data: SetupSwapperRoleData) => void
}): ReactElement {
  const [settleOutside, setSettleOutside] = useState(data.receivers.length > 1)

  const formData = useForm<SetupSwapperRoleData>({
    values: data,
    mode: 'onChange',
    defaultValues: data,
  })

  const fieldArray = useFieldArray({
    control: formData.control,
    name: 'receivers',
  })
  const [defaultReceiver, ...fields] = fieldArray.fields

  const onClick = (checked: boolean) => {
    if (!checked) {
      formData.setValue('receivers', [{ address: defaultReceiver.address }])
    } else {
      fieldArray.append({ address: '' })
    }
    setSettleOutside(checked)
  }

  return (
    <TxCard>
      <FormProvider {...formData}>
        <form onSubmit={formData.handleSubmit(onSubmit)}>
          Default receiver
          <AddressInputReadOnly key={defaultReceiver.id} address={defaultReceiver.address} />
          <FormControlLabel
            control={<Switch checked={settleOutside} onChange={(_, checked) => onClick(checked)} />}
            label="Allow to settle swaps outside of this Safe Account"
          />
          <Grid2 container spacing={3}>
            {fields.map((field, index) => {
              return (
                <Fragment key={field.id}>
                  <Grid2 size={{ xs: 11 }}>
                    <AddressBookInput name={`receivers.${index + 1}.address`} label="Receiver address or ENS" canAdd />
                  </Grid2>
                  <Grid2 size={{ xs: 1 }} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <IconButton onClick={() => fieldArray.remove(index + 1)}>
                      <SvgIcon component={DeleteIcon} inheritViewBox />
                    </IconButton>
                  </Grid2>
                  {index === fields.length - 1 && (
                    <Button
                      onClick={() => {
                        fieldArray.append({
                          address: '',
                        })
                      }}
                      variant="text"
                      startIcon={<SvgIcon component={AddIcon} inheritViewBox />}
                    >
                      Add receiver
                    </Button>
                  )}
                </Fragment>
              )
            })}
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
