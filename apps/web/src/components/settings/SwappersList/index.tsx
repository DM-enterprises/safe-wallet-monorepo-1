import { Box, Button, Grid2, IconButton, SvgIcon, Tooltip, Typography } from '@mui/material'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { useContext, useMemo } from 'react'
import { encodeRoleKey } from 'zodiac-roles-sdk'
import type { ReactElement } from 'react'
import type { Role } from 'zodiac-roles-sdk'

import { Chip } from '@/components/common/Chip'
import OnlyOwner from '@/components/common/OnlyOwner'
import EnhancedTable from '@/components/common/EnhancedTable'
import EthHashInfo from '@/components/common/EthHashInfo'
import { TxModalContext } from '@/components/tx-flow'
import { SetupSwapperRoleFlow } from '@/components/tx-flow/flows'
import { SWAPPER_ROLE_KEY } from '@/features/swapper-role/constants'
import { useWeb3 } from '@/hooks/wallets/web3'
import AddIcon from '@/public/images/common/add.svg'
import useBalances from '@/hooks/useBalances'
import { getERC20TokenInfoOnChain } from '@/utils/tokens'
import DeleteIcon from '@/public/images/common/delete.svg'
import EditIcon from '@/public/images/common/edit.svg'
import CheckWallet from '@/components/common/CheckWallet'
import { RemoveAllowance } from '@/components/tx-flow/flows/RemoveAllowance'
import { EditAllowance } from '@/components/tx-flow/flows/EditAllowance'
import { useGetAllowancesQuery, useGetRoleQuery, useGetRolesModifierQuery } from '@/store/api/swapper-role'
import useAsync from '@/hooks/useAsync'

export function SwappersList(): ReactElement {
  const { setTxFlow } = useContext(TxModalContext)
  const roleKey = encodeRoleKey(SWAPPER_ROLE_KEY)
  const { data: rolesModifierAddress } = useGetRolesModifierQuery()
  const { data: role } = useGetRoleQuery(roleKey, rolesModifierAddress ?? undefined)
  const { data: allowances } = useGetAllowancesQuery(roleKey, rolesModifierAddress ?? undefined)

  const onAdd = () => {
    setTxFlow(<SetupSwapperRoleFlow />)
  }

  return (
    <Grid2 container spacing={3} display="flex" mt={2} justifyContent="flex-end">
      <Grid2 size={{ lg: 8, xs: 12 }}>
        <Typography fontWeight="bold" mb={2}>
          Swappers <Chip label="New" sx={{ backgroundColor: 'secondary.light', color: 'static.main' }} />
        </Typography>
        <Typography mb={2}>
          Swappers can execute swap and limit orders without collecting signatures for each trade. You can define limits
          of the tokens and amounts they can trade.
        </Typography>

        <Box>
          <OnlyOwner>
            {(isOk) => (
              <Button
                onClick={onAdd}
                variant="text"
                startIcon={<SvgIcon component={AddIcon} inheritViewBox fontSize="small" />}
                disabled={!isOk}
                size="compact"
              >
                Add Swapper
              </Button>
            )}
          </OnlyOwner>
        </Box>

        {role && <MemberList role={role} />}

        {allowances && rolesModifierAddress && (
          <AllowanceList allowances={allowances} rolesModifierAddress={rolesModifierAddress} />
        )}
      </Grid2>
    </Grid2>
  )
}

function MemberList({ role }: { role: Role }): ReactElement | null {
  const rows = useMemo(() => {
    if (!role?.members) {
      return []
    }

    return role.members.map((member) => {
      return {
        cells: {
          member: {
            rawValue: member,
            content: <EthHashInfo address={member} showCopyButton hasExplorer shortAddress={false} />,
          },
          actions: {
            rawValue: '',
            sticky: true,
            content: null,
          },
        },
      }
    })
  }, [role])

  if (rows.length === 0) {
    return null
  }

  return <EnhancedTable rows={rows} headCells={[]} />
}

const headCells = [
  { id: 'type', label: 'Type' },
  { id: 'receivers', label: 'Receiver' },
  { id: 'allowance', label: 'Allowance' },
  { id: 'actions', label: '' },
]

function AllowanceList({
  allowances,
  rolesModifierAddress,
}: {
  allowances: Array<{
    token: string
    type: 'sell' | 'buy'
    receivers: Array<string>
    allowanceKey: string
    allowance: {
      refill: string
      maxRefill: string
      period: string
      balance: string
      timestamp: string
      isUnset: boolean
    }
  }>
  rolesModifierAddress: string
}): ReactElement | null {
  const { setTxFlow } = useContext(TxModalContext)

  const rows = useMemo(() => {
    if (allowances.length === 0) {
      return []
    }

    return allowances.map(({ token, type, receivers, allowanceKey, allowance }) => {
      return {
        cells: {
          type: {
            rawValue: type,
            content: type,
          },
          receivers: {
            rawValue: receivers.join(', '),
            content: receivers.map((receiver) => (
              <EthHashInfo key={receiver} address={receiver} showCopyButton hasExplorer shortAddress={false} />
            )),
          },
          value: {
            rawValue: allowanceKey,
            content: allowance.isUnset ? 'Unset' : <AllowanceBalanceItem balance={allowance.balance} token={token} />,
          },
          actions: {
            rawValue: '',
            sticky: true,
            content: (
              <CheckWallet>
                {(isOk) => (
                  <>
                    <Tooltip title={isOk ? 'Edit allowance' : undefined}>
                      <span>
                        <IconButton
                          onClick={() =>
                            setTxFlow(
                              <EditAllowance
                                rolesModifierAddress={rolesModifierAddress}
                                tokenAddress={token}
                                allowanceKey={allowanceKey}
                                type={type}
                                amount={allowance.refill}
                                periodInSeconds={Number(allowance.period)}
                              />,
                            )
                          }
                          size="small"
                          disabled={!isOk}
                        >
                          <SvgIcon component={EditIcon} inheritViewBox color="border" fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip title={isOk ? 'Remove allowance' : undefined}>
                      <span>
                        <IconButton
                          onClick={() =>
                            setTxFlow(
                              <RemoveAllowance
                                rolesModifierAddress={rolesModifierAddress}
                                token={token}
                                allowanceKey={allowanceKey}
                              />,
                            )
                          }
                          size="small"
                          disabled={!isOk}
                        >
                          <SvgIcon component={DeleteIcon} inheritViewBox color="error" fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </>
                )}
              </CheckWallet>
            ),
          },
        },
      }
    })
  }, [allowances, rolesModifierAddress, setTxFlow])

  if (rows.length === 0) {
    return null
  }

  return <EnhancedTable rows={rows} headCells={headCells} />
}

function AllowanceBalanceItem({ balance, token }: { balance: string; token: string }): ReactElement {
  const web3 = useWeb3()
  const { balances } = useBalances()

  const [tokenInfo] = useAsync(async () => {
    const item = balances.items.find((item) => {
      return sameAddress(item.tokenInfo.address, token)
    })

    if (item?.tokenInfo) {
      return item.tokenInfo
    }

    if (!web3) {
      return
    }

    return getERC20TokenInfoOnChain(token)
  }, [balances.items, token, web3])

  if (!tokenInfo?.decimals) {
    return <>{balance}</>
  }

  return (
    <>
      {formatVisualAmount(balance, tokenInfo.decimals)} {tokenInfo.symbol}
    </>
  )
}
