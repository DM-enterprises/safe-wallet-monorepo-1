import { Fragment, type ReactElement } from 'react'
import { Button, CardActions, Grid2, SvgIcon } from '@mui/material'
import TxCard from '../../common/TxCard'
import { type SetupSwapperRoleData } from '.'
import AddressBookInput from '@/components/common/AddressBookInput'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import AddIcon from '@/public/images/common/add.svg'
import NameInput from '@/components/common/NameInput'

const SetupSwapperRoleMembers = ({
  data,
  onSubmit,
}: {
  data: SetupSwapperRoleData
  onSubmit: (data: SetupSwapperRoleData) => void
}): ReactElement => {
  const formData = useForm<SetupSwapperRoleData>({
    values: data,
    mode: 'onChange',
    defaultValues: data,
  })

  const { fields, append } = useFieldArray({
    control: formData.control,
    name: 'members',
  })

  return (
    <TxCard>
      <FormProvider {...formData}>
        <form onSubmit={formData.handleSubmit(onSubmit)}>
          <Grid2 container spacing={3}>
            {fields.map((field, index) => (
              <Fragment key={field.id}>
                <Grid2 size={{ xs: 12 }}>
                  <NameInput name={`members.${index}.name`} label="Swapper name" />
                </Grid2>
                <Grid2 size={{ xs: 12 }} mb={2}>
                  <AddressBookInput name={`members.${index}.address`} label="Swapper address or ENS" canAdd />
                </Grid2>
              </Fragment>
            ))}
          </Grid2>

          <Button
            onClick={() => append({ name: '', address: '' })}
            variant="text"
            startIcon={<SvgIcon component={AddIcon} inheritViewBox />}
          >
            Add Swapper
          </Button>

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

export default SetupSwapperRoleMembers
