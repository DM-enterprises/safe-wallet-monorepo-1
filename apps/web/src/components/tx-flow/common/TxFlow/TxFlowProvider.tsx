import { createContext, useContext, useState } from 'react'
import type { ReactNode, ReactElement, SetStateAction, Dispatch } from 'react'
import { FlowFeature } from '../../features'
import useSafeInfo from '@/hooks/useSafeInfo'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsWalletProposer } from '@/hooks/useProposers'
import { useImmediatelyExecutable, useValidateNonce } from '@/components/tx/SignOrExecuteForm/hooks'
import { SafeTxContext } from '../../SafeTxProvider'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'
import {
  findAllowingRole,
  findMostLikelyRole,
  useRoles,
} from '@/components/tx/SignOrExecuteForm/ExecuteThroughRoleForm/hooks'

export type TxFlowContextType = {
  features: FlowFeature[]
  onlyExecute: boolean
  isProposing: boolean
  willExecute: boolean
  canExecute: boolean
  shouldExecute: boolean
  setShouldExecute: Dispatch<SetStateAction<boolean>>
  isSubmittable: boolean
  setIsSubmittable: Dispatch<SetStateAction<boolean>>
  willExecuteThroughRole: boolean
}

const initialContext: TxFlowContextType = {
  features: Object.values(FlowFeature),
  onlyExecute: false,
  isProposing: false,
  willExecute: false,
  canExecute: false,
  shouldExecute: false,
  setShouldExecute: () => {},
  isSubmittable: true,
  setIsSubmittable: () => {},
  willExecuteThroughRole: false,
}

export const TxFlowContext = createContext<TxFlowContextType>(initialContext)

type TxFlowProviderProps = {
  children: ReactNode
  txId?: string
  isExecutable?: boolean
  features?: TxFlowContextType['features']
  onlyExecute?: TxFlowContextType['onlyExecute']
}

const TxFlowProvider = ({
  children,
  features = initialContext.features,
  txId,
  isExecutable,
  onlyExecute = initialContext.onlyExecute,
}: TxFlowProviderProps): ReactElement => {
  const { safe } = useSafeInfo()
  const isSafeOwner = useIsSafeOwner()
  const isProposer = useIsWalletProposer()
  const { safeTx } = useContext(SafeTxContext)
  const isCorrectNonce = useValidateNonce(safeTx)
  const { transactionExecution } = useAppSelector(selectSettings)
  const [shouldExecute, setShouldExecute] = useState<boolean>(transactionExecution)
  const [isSubmittable, setIsSubmittable] = useState<boolean>(true)

  const isCreation = !txId
  const isNewExecutableTx = useImmediatelyExecutable() && isCreation

  const isProposing = !!isProposer && !isSafeOwner && isCreation
  const isCounterfactualSafe = !safe.deployed

  // Check if a Zodiac Roles mod is enabled and if the user is a member of any role that allows the transaction
  const roles = useRoles(
    !isCounterfactualSafe && isCreation && !(isNewExecutableTx && isSafeOwner) ? safeTx : undefined,
  )
  const allowingRole = findAllowingRole(roles)
  const mostLikelyRole = findMostLikelyRole(roles)
  const canExecuteThroughRole = !!allowingRole || (!!mostLikelyRole && !isSafeOwner)
  const preferThroughRole = canExecuteThroughRole && !isSafeOwner // execute through role if a non-owner role member wallet is connected

  // If checkbox is checked and the transaction is executable, execute it, otherwise sign it
  const canExecute = isCorrectNonce && (isExecutable || isNewExecutableTx)
  const willExecute = (onlyExecute || shouldExecute) && canExecute && !preferThroughRole
  const willExecuteThroughRole =
    (onlyExecute || shouldExecute) && canExecuteThroughRole && (!canExecute || preferThroughRole)

  const value = {
    features,
    onlyExecute,
    isProposing,
    canExecute,
    willExecute,
    shouldExecute,
    setShouldExecute,
    isSubmittable,
    setIsSubmittable,
    willExecuteThroughRole,
  }

  return <TxFlowContext.Provider value={value}>{children}</TxFlowContext.Provider>
}

export default TxFlowProvider
