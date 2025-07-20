import AddressBookInput from '@/components/common/AddressBookInput'
import AddressInput from '@/components/common/AddressInput'
import NameInput from '@/components/common/NameInput'
import css from '@/components/tx/ExecuteCheckbox/styles.module.css'
import policyContracts from '@/features/policies/contracts/contracts.json'
import { PolicyType } from '@/features/policies/contracts/policyContracts'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import DeleteIcon from '@/public/images/common/delete.svg'
import { getMultiSendCallOnlyContractDeployment } from '@/services/contracts/deployments'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import {
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  SvgIcon,
  Typography,
} from '@mui/material'
import { getMultiSendCallOnlyDeployment } from '@safe-global/safe-deployments'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { defaultPolicy, policyFields } from './AddPolicy'
import { POLICY_TYPE_OPTIONS } from './CreatePolicy'

const CreateAllowPolicy = ({ fieldName }: { fieldName: string }) => {
  const { setValue } = useFormContext()

  useEffect(() => {
    setValue(`${fieldName}.${policyFields.operation}`, 0)
    setValue(`${fieldName}.${policyFields.data}`, '0x')
  }, [])

  return (
    <>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <AddressBookInput
          data-testid="target-section"
          name={`${fieldName}.${policyFields.targetAddress}`}
          label="Target address"
          required
        />
      </FormControl>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <NameInput
          data-testid="selector-section"
          name={`${fieldName}.${policyFields.selector}`}
          label="Function selector"
          required
        />
      </FormControl>
    </>
  )
}

const CreateNativeTransferPolicy = ({ fieldName }: { fieldName: string }) => {
  const { setValue } = useFormContext()

  useEffect(() => {
    setValue(`${fieldName}.${policyFields.operation}`, 0)
    setValue(`${fieldName}.${policyFields.selector}`, '0x00000000')
    setValue(`${fieldName}.${policyFields.data}`, '0x')
  }, [])

  return (
    <FormControl fullWidth sx={{ mb: 3 }} required>
      <AddressBookInput
        data-testid="target-section"
        name={`${fieldName}.${policyFields.targetAddress}`}
        label="Target address"
        required
      />
    </FormControl>
  )
}

const CreateErc20TransferPolicy = ({ fieldName }: { fieldName: string }) => {
  const { setValue, control } = useFormContext()

  const targetAddress = useWatch({ name: `${fieldName}.${policyFields.context}`, control })

  useEffect(() => {
    setValue(`${fieldName}.${policyFields.operation}`, 0)
    setValue(`${fieldName}.${policyFields.selector}`, '0xa9059cbb')
  }, [])

  useEffect(() => {
    if (!targetAddress) return

    // TODO: allow adding multiple recipients at once
    const recipientData = [
      {
        recipient: targetAddress,
        allowed: true,
      },
    ]
    const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
      ['tuple(address recipient, bool allowed)[]'],
      [recipientData],
    )
    setValue(`${fieldName}.${policyFields.data}`, encodedData)
  }, [targetAddress, fieldName, setValue])

  return (
    <>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <AddressBookInput
          data-testid="target-section"
          name={`${fieldName}.${policyFields.context}`}
          label="Target address"
          required
        />
      </FormControl>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <AddressInput
          data-testid="token-section"
          name={`${fieldName}.${policyFields.targetAddress}`}
          label="Token address"
          required
        />
      </FormControl>
    </>
  )
}

const CreateMultiSendPolicy = ({ fieldName }: { fieldName: string }) => {
  const { setValue } = useFormContext()
  const chain = useCurrentChain()
  const { safe } = useSafeInfo()

  useEffect(() => {
    if (!chain || !safe) return

    const multiSendDeployment = getMultiSendCallOnlyContractDeployment(chain, safe.version)
    const multiSendCallOnlyAddress = multiSendDeployment?.networkAddresses[chain.chainId]
    if (!multiSendCallOnlyAddress) return

    const contract = getMultiSendCallOnlyDeployment({ network: chain.chainId, version: safe.version || '1.3.0' })
    if (!contract) return
    const iface = new ethers.Interface(contract.abi)
    const multiSendFunction = iface.getFunction('multiSend')
    if (!multiSendFunction) return

    setValue(`${fieldName}.${policyFields.targetAddress}`, multiSendCallOnlyAddress)
    setValue(`${fieldName}.${policyFields.operation}`, 1)
    setValue(`${fieldName}.${policyFields.selector}`, multiSendFunction.selector)
    setValue(`${fieldName}.${policyFields.data}`, '0x')
  }, [])

  return (
    <>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <AddressBookInput
          data-testid="target-section"
          name={`${fieldName}.${policyFields.targetAddress}`}
          label="Target address"
          disabled
        />
      </FormControl>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <NameInput
          data-testid="selector-section"
          name={`${fieldName}.${policyFields.selector}`}
          label="Function selector"
          disabled
          value="multiSend"
        />
      </FormControl>
    </>
  )
}

const CreateCosignerPolicy = ({ fieldName }: { fieldName: string }) => {
  const [displaySelector, setDisplaySelector] = useState(false)
  const provider = useWeb3ReadOnly()
  const { setValue, control } = useFormContext()

  const cosignerAddress = useWatch({ name: `${fieldName}.${policyFields.context}`, control })
  const targetAddress = useWatch({ name: `${fieldName}.${policyFields.targetAddress}`, control })

  useEffect(() => {
    setValue(`${fieldName}.${policyFields.operation}`, 0)
  }, [])

  useEffect(() => {
    if (!cosignerAddress) return

    const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(['address'], [cosignerAddress])
    setValue(`${fieldName}.${policyFields.data}`, encodedData)
  }, [cosignerAddress, fieldName, setValue])

  useEffect(() => {
    const checkCode = async () => {
      if (!provider || !targetAddress || !ethers.isAddress(targetAddress)) {
        setDisplaySelector(false)
        return
      }

      let code = '0x'
      try {
        code = await provider.getCode(targetAddress)
      } catch (error) {
        console.error('Failed to check contract code:', error)
      }
      if (code === '0x') {
        setValue(`${fieldName}.${policyFields.selector}`, '0x00000000')
      }
      setDisplaySelector(code !== '0x')
    }
    checkCode()
  }, [provider, targetAddress])

  return (
    <>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <AddressBookInput
          data-testid="data-section"
          name={`${fieldName}.${policyFields.context}`}
          label="Co-signer address"
          required
        />
      </FormControl>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <AddressBookInput
          data-testid="target-section"
          name={`${fieldName}.${policyFields.targetAddress}`}
          label="Target address"
        />
      </FormControl>
      {displaySelector && (
        <FormControl fullWidth sx={{ mb: 3 }}>
          <NameInput
            data-testid="selector-section"
            name={`${fieldName}.${policyFields.selector}`}
            label="Function selector"
            required
          />
        </FormControl>
      )}
    </>
  )
}

export const PolicyRow = ({
  index,
  groupName,
  removable = true,
  remove,
}: {
  index: number
  removable?: boolean
  groupName: string
  remove?: (index: number) => void
}) => {
  const fieldName = `${groupName}.${index}`
  const { setValue, control } = useFormContext()

  const policy = useWatch({
    control,
    name: fieldName,
  })

  const handlePolicyTypeChange = (event: SelectChangeEvent<string>) => {
    const policyAddress = policyContracts.policies[event.target.value as keyof typeof policyContracts.policies]
    setValue(`${fieldName}.${policyFields.policyType}`, event.target.value)
    setValue(`${fieldName}.${policyFields.policyAddress}`, policyAddress)
    setValue(`${fieldName}.${policyFields.targetAddress}`, defaultPolicy.targetAddress)
    setValue(`${fieldName}.${policyFields.selector}`, defaultPolicy.selector)
    setValue(`${fieldName}.${policyFields.operation}`, defaultPolicy.operation)
    setValue(`${fieldName}.${policyFields.data}`, defaultPolicy.data)
    setValue(`${fieldName}.${policyFields.context}`, defaultPolicy.context)
  }

  return (
    <Grid
      container
      xs={12}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Typography
        variant="body1"
        sx={{
          mb: 2,
          fontWeight: 'bold',
        }}
      >
        {`Policy ${index > 0 ? index + 1 : ''}`}
      </Typography>
      {removable && (
        <>
          <IconButton data-testid="remove-policy-btn" onClick={() => remove?.(index)} aria-label="Remove policy">
            <SvgIcon component={DeleteIcon} inheritViewBox />
          </IconButton>
        </>
      )}
      <FormControl fullWidth className={css.select} sx={{ mb: 3, mt: '0px !important' }}>
        <InputLabel shrink={false}>Policy type</InputLabel>
        <Controller
          rules={{ required: true }}
          control={control}
          name={`${fieldName}.${policyFields.policyType}`}
          render={({ field }) => (
            <Select
              data-testid="policy-type-section"
              {...field}
              sx={{ textAlign: 'right', fontWeight: 700 }}
              IconComponent={ExpandMoreRoundedIcon}
              onChange={handlePolicyTypeChange}
            >
              {POLICY_TYPE_OPTIONS.map((policyType) => (
                <MenuItem
                  data-testid="policy-type-item"
                  key={policyType.value}
                  value={policyType.value}
                  sx={{ overflow: 'hidden' }}
                >
                  {policyType.label}
                </MenuItem>
              ))}
            </Select>
          )}
        />
      </FormControl>
      {policy.policyType === PolicyType.ALLOW && <CreateAllowPolicy fieldName={fieldName} />}
      {policy.policyType === PolicyType.NATIVE_TRANSFER && <CreateNativeTransferPolicy fieldName={fieldName} />}
      {policy.policyType === PolicyType.ERC20_TRANSFER && <CreateErc20TransferPolicy fieldName={fieldName} />}
      {policy.policyType === PolicyType.MULTISEND && <CreateMultiSendPolicy fieldName={fieldName} />}
      {policy.policyType === PolicyType.COSIGNER && <CreateCosignerPolicy fieldName={fieldName} />}
    </Grid>
  )
}

export default PolicyRow
