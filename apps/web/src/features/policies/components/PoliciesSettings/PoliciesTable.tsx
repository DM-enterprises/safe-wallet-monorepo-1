import CheckWallet from '@/components/common/CheckWallet'
import EnhancedTable from '@/components/common/EnhancedTable'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import { TxModalContext } from '@/components/tx-flow'
import policyContracts from '@/features/policies/contracts/contracts.json'
import { Box, Button, Skeleton, Stack, Typography } from '@mui/material'
import { ethers } from 'ethers'
import { useContext, useMemo } from 'react'
import { PolicyType } from '../../contracts/policyContracts'
import { AddPoliciesParams, PoliciesFields, policyFields } from '../tx-flow/AddPolicy/AddPolicy'
import { POLICY_TYPE_OPTIONS } from '../tx-flow/AddPolicy/CreatePolicy'
import ConfirmPolicyFlow from '../tx-flow/ConfirmPolicy'
import { PolicyEvent } from './PoliciesSettings'

const SKELETON_ROWS = new Array(3).fill('').map(() => {
  return {
    cells: {
      policyType: {
        rawValue: '',
        content: (
          <Typography>
            <Skeleton />
          </Typography>
        ),
      },
      target: {
        rawValue: '',
        content: (
          <Box display="flex" flexDirection="row" gap={1} alignItems="center">
            <Skeleton variant="circular" width={26} height={26} />
            <div>
              <Typography>
                <Skeleton width={75} />
              </Typography>
              <Typography>
                <Skeleton width={300} />
              </Typography>
            </div>
          </Box>
        ),
      },
      selector: {
        rawValue: '',
        content: (
          <Typography>
            <Skeleton />
          </Typography>
        ),
      },
      token: {
        rawValue: '',
        content: (
          <Typography>
            <Skeleton />
          </Typography>
        ),
      },
      cosigner: {
        rawValue: '',
        content: (
          <Typography>
            <Skeleton />
          </Typography>
        ),
      },
    },
  }
})

const PoliciesTable = ({
  policies,
  isLoading,
  pendingPolicies,
}: {
  policies: PolicyEvent[]
  isLoading: boolean
  pendingPolicies?: boolean
}) => {
  const { setTxFlow } = useContext(TxModalContext)

  const headCells = useMemo(
    () => [
      { id: 'policyType', label: 'Policy' },
      { id: 'target', label: 'Receiver' },
      { id: 'selector', label: 'Selector' },
      { id: 'token', label: 'Token' },
      { id: 'cosigner', label: 'Cosigner' },
      { id: 'actions', label: 'Actions', sticky: true },
    ],
    [],
  )

  const rows = useMemo(
    () =>
      isLoading
        ? SKELETON_ROWS
        : policies
            .map((policy) => {
              const policyType = Object.entries(policyContracts.policies).find(
                ([_, policyAddress]) => policyAddress === policy.args.policy,
              )?.[0]
              const policyTypeLabel = POLICY_TYPE_OPTIONS.find((p) => p.value === policyType)?.label
              if (!policyTypeLabel) return

              let targetAddress = policy.args.target
              let tokenAddress: React.ReactNode
              let cosignerAddress: React.ReactNode
              let context = ''

              if (policyType === 'erc20TransferPolicy') {
                targetAddress = ''
                if (policy.args.data) {
                  const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
                    ['tuple(address recipient, bool allowed)[]'],
                    policy.args.data,
                  )
                  targetAddress = decoded[0].toArray()[0][0]
                  context = decoded[0].toArray()[0][0]
                }
                tokenAddress = (
                  <Stack direction="row" gap={1} alignItems="center">
                    <NamedAddressInfo address={policy.args.target} shortAddress={true} hasExplorer showCopyButton />
                    {/*<Typography variant="body2">{decoded[0].toArray()[0][1] === true ? 'Allowed' : 'Not allowed'}</Typography>*/}
                  </Stack>
                )
              } else if (policyType === 'coSignerPolicy') {
                // TODO: This check can be removed once PolicyConfirmed event returns the data
                if (policy.args.data) {
                  const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['address'], policy.args.data)
                  cosignerAddress = (
                    <NamedAddressInfo address={decoded[0]} shortAddress={true} hasExplorer showCopyButton />
                  )
                  context = decoded[0]
                }
              }

              const confirmPolicy: AddPoliciesParams = {
                [PoliciesFields.policies]: [
                  {
                    [policyFields.policyType]: POLICY_TYPE_OPTIONS.find((p) => p.value === policyType)
                      ?.value as PolicyType,
                    [policyFields.policyAddress]: policy.args.policy,
                    [policyFields.targetAddress]: policy.args.target,
                    [policyFields.selector]: policy.args.selector,
                    [policyFields.operation]: policy.args.operation,
                    [policyFields.data]: policy.args.data,
                    [policyFields.context]: context,
                  },
                ],
              }

              return {
                cells: {
                  policyType: {
                    rawValue: policyTypeLabel,
                    content: <Typography>{policyTypeLabel}</Typography>,
                  },
                  target: {
                    rawValue: targetAddress,
                    content: targetAddress ? (
                      <NamedAddressInfo address={targetAddress} shortAddress={true} hasExplorer showCopyButton />
                    ) : '-',
                  },
                  selector: {
                    rawValue: policy.args.selector,
                    content: (
                      <Typography>{policy.args.selector === '0x00000000' ? '-' : policy.args.selector}</Typography>
                    ),
                  },
                  token: {
                    rawValue: context,
                    content: tokenAddress || '-',
                  },
                  cosigner: {
                    rawValue: context,
                    content: cosignerAddress || '-',
                  },
                  actions: {
                    rawValue: '',
                    sticky: true,
                    content: pendingPolicies && (
                      <CheckWallet>
                        {(isOk) => (
                          <Button
                            data-testid="new-policy"
                            onClick={() => setTxFlow(<ConfirmPolicyFlow policy={confirmPolicy} />)}
                            variant="contained"
                            disabled={!isOk}
                            size="small"
                          >
                            Confirm
                          </Button>
                        )}
                      </CheckWallet>
                    ),
                  },
                },
              }
            })
            .filter((row) => !!row),
    [isLoading, setTxFlow, policies],
  )
  return policies.length > 0 && <EnhancedTable rows={rows} headCells={headCells} />
}

export default PoliciesTable
