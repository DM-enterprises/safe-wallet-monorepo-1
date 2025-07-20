import CheckWallet from '@/components/common/CheckWallet'
import { TxModalContext } from '@/components/tx-flow'
import { getPolicyGuardContract } from '@/features/policies/contracts/policyContracts'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { sameAddress } from '@/utils/addresses'
import { Box, Button, Grid, Paper, Stack, Typography } from '@mui/material'
import { Contract } from 'ethers'
import { useContext, useEffect, useState } from 'react'
import AddPolicyFlow from '../tx-flow/AddPolicy'
import PoliciesTable from './PoliciesTable'

export type PolicyEvent = {
  args: {
    safe: string
    target: string
    selector: string
    operation: number
    policy: string
    data: string
  }
  blockNumber: number
}

const getPendingPoliciesEvents = async (
  policyGuardContract: Contract,
  safeAddress: string,
  confirmedPolicies: PolicyEvent[],
) => {
  const policiesFilter = policyGuardContract.filters.PolicyConfigured()
  const policies = (await policyGuardContract.queryFilter(
    policiesFilter,
    7999262,
    'latest',
  )) as unknown as PolicyEvent[]

  // TODO: Once the safe parameter in the onchain event is indexed the safeAddress filter should be filtered in `policiesFilter`
  const safePolicies = policies.filter(
    (event) =>
      sameAddress(event.args?.safe, safeAddress) &&
      !confirmedPolicies.some(
        (confirmedPolicy) =>
          sameAddress(confirmedPolicy.args.safe, event.args?.safe) &&
          sameAddress(confirmedPolicy.args.target, event.args?.target) &&
          confirmedPolicy.args.selector === event.args?.selector &&
          confirmedPolicy.args.operation === event.args?.operation &&
          sameAddress(confirmedPolicy.args.policy, event.args?.policy),
      ),
  )
  console.log('PolicyConfigured events', safePolicies)
  return safePolicies
}

const getConfirmedPoliciesEvents = async (policyGuardContract: Contract, safeAddress: string) => {
  const policiesFilter = policyGuardContract.filters.PolicyConfirmed(safeAddress, null)
  const safePolicies = (await policyGuardContract.queryFilter(
    policiesFilter,
    7999262,
    'latest',
  )) as unknown as PolicyEvent[]
  console.log('PolicyConfirmed events', safePolicies)
  return safePolicies
}

const PoliciesSettings = () => {
  const { setTxFlow } = useContext(TxModalContext)
  //const policies = useSelector(selectPolicies)
  //const policiesLoading = useSelector(selectPoliciesLoading)
  const provider = useWeb3ReadOnly()
  const { safe } = useSafeInfo()

  const [confirmedPolicies, setConfirmedPolicies] = useState<PolicyEvent[]>([])
  const [pendingPolicies, setPendingPolicies] = useState<PolicyEvent[]>([])

  useEffect(() => {
    const init = async () => {
      if (!provider || !safe.guard) return
      const policyGuardContract = getPolicyGuardContract()

      const safeConfirmedPolicies = await getConfirmedPoliciesEvents(policyGuardContract, safe.address.value)
      const safePendingPolicies = await getPendingPoliciesEvents(
        policyGuardContract,
        safe.address.value,
        safeConfirmedPolicies,
      )

      setConfirmedPolicies(safeConfirmedPolicies)
      setPendingPolicies(safePendingPolicies)
    }
    init()
  }, [provider, safe.address.value])

  return (
    <Paper data-testid="policies-section" sx={{ p: 4, mb: 2 }}>
      <Grid
        container
        direction="row"
        spacing={3}
        sx={{
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Grid item lg={4} xs={12}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
            }}
          >
            Policies
          </Typography>
        </Grid>

        <Grid item xs>
          <Box>
            <Typography>
              You can set a granular mandatory access control for this Safe Account, powered by an on-chain transaction
              guard that validates transactions against a set of policies.
            </Typography>
            <CheckWallet>
              {(isOk) => (
                <Button
                  data-testid="new-policy"
                  onClick={() => setTxFlow(<AddPolicyFlow />)}
                  sx={{ mt: 2 }}
                  variant="contained"
                  disabled={!isOk}
                  size="small"
                >
                  New policy
                </Button>
              )}
            </CheckWallet>
          </Box>
        </Grid>
      </Grid>
      <Stack spacing={3}>
        {pendingPolicies.length > 0 && (
          <Box>
            <Typography variant="h5">Pending policies</Typography>
            <PoliciesTable isLoading={!pendingPolicies} policies={pendingPolicies} pendingPolicies />
          </Box>
        )}
        {confirmedPolicies.length > 0 && (
          <Box>
            <Typography variant="h5">Confirmed policies</Typography>
            <PoliciesTable isLoading={!confirmedPolicies} policies={confirmedPolicies} />
          </Box>
        )}
      </Stack>
    </Paper>
  )
}

export default PoliciesSettings
