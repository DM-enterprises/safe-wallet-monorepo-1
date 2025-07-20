import AddIcon from '@mui/icons-material/Add'
import { Box, Button, CardActions, Divider, SvgIcon } from '@mui/material'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'

import TxCard from '@/components/tx-flow/common/TxCard'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import policyContracts from '@/features/policies/contracts/contracts.json'
import { PolicyType } from '@/features/policies/contracts/policyContracts'
import { AddPoliciesFields, AddPoliciesParams } from './AddPolicy'
import PolicyRow from './PolicyRow'

export const POLICY_TYPE_OPTIONS = [
  { label: 'Allow', value: PolicyType.ALLOW },
  { label: 'Native transfer', value: PolicyType.NATIVE_TRANSFER },
  { label: 'ERC-20 transfer', value: PolicyType.ERC20_TRANSFER },
  { label: 'MultiSend', value: PolicyType.MULTISEND },
  { label: 'Co-signer', value: PolicyType.COSIGNER },
]

const CreatePolicy = ({
  params,
  onSubmit,
}: {
  params: AddPoliciesParams
  onSubmit: (data: AddPoliciesParams) => void
}) => {
  const formMethods = useForm<AddPoliciesParams>({
    defaultValues: params,
    mode: 'onChange',
    delayError: 500,
  })

  const { handleSubmit, control, watch } = formMethods

  const {
    fields: policyFields,
    append,
    remove: removePolicy,
  } = useFieldArray({ control, name: AddPoliciesFields.policies })

  const addPolicy = (): void => {
    append({
      policyType: PolicyType.ALLOW,
      policyAddress: policyContracts.policies.allowPolicy,
      targetAddress: '',
      selector: '',
      operation: 0,
      data: '',
      context: '',
    })
  }

  const policiesValues = watch(AddPoliciesFields.policies)

  return (
    <TxCard>
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {policyFields.map((field, i) => (
            <PolicyRow
              key={field.id}
              index={i}
              removable={i > 0}
              groupName={AddPoliciesFields.policies}
              remove={removePolicy}
            />
          ))}
          <Box mb={4}>
            <Button
              data-testid="add-policy-btn"
              variant="text"
              onClick={addPolicy}
              startIcon={<SvgIcon component={AddIcon} inheritViewBox fontSize="small" />}
              size="large"
            >
              Add new policy
            </Button>
          </Box>
          <Divider className={commonCss.nestedDivider} />
          <CardActions>
            <Button data-testid="next-btn" variant="contained" type="submit">
              Next
            </Button>
          </CardActions>
        </form>
      </FormProvider>
    </TxCard>
  )
}

export default CreatePolicy
