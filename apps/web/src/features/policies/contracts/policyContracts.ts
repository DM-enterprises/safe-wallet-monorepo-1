import { getSafeProvider } from '@/services/tx/tx-sender/sdk'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { ethers, Interface } from 'ethers'
import policyContracts from './contracts.json'

export enum PolicyType {
  ALLOW = 'allowPolicy',
  NATIVE_TRANSFER = 'nativeTransferPolicy',
  ERC20_TRANSFER = 'erc20TransferPolicy',
  MULTISEND = 'multiSendPolicy',
  COSIGNER = 'coSignerPolicy',
}

export const safePolicyGuardAbi = [
  'event PolicyConfigured(address safe, address target, bytes4 selector, uint8 operation, address policy, bytes data)',
  'event PolicyConfirmed(address indexed safe, address indexed target, bytes4 selector, uint8 operation, address policy)',
  'function DELAY() public view returns (uint256)',
  'function getPolicy(address safe, address to, bytes calldata data, uint8 operation) public view returns (address)',
  'function configurePolicy(address target, bytes4 selector, uint8 operation, address policy, bytes calldata data) public',
  'function configureAndConfirmPolicy(address target, bytes4 selector, uint8 operation, address policy, bytes calldata data) public',
  'function confirmPolicy(address safe, address target, bytes4 selector, uint8 operation, address policy, bytes memory data) external',
  'function pendingPolicies(address safe, bytes32 accessDataHash) public view returns (uint256)',
]

const safePolicyGuardInterface = new Interface(safePolicyGuardAbi)

export const getPolicyGuardContract = () => {
  const provider = getSafeProvider()
  return new ethers.Contract(policyContracts.safePolicyGuard, safePolicyGuardAbi, provider.getExternalProvider())
}

export const createConfigureAndConfimPolicyTx = ({
  safePolicyGuardAddress,
  targetAddress,
  selector,
  operation,
  policyAddress,
  data,
}: {
  safePolicyGuardAddress: string
  targetAddress: string
  selector: string
  operation: number
  policyAddress: string
  data: string
}) => {
  const txData = safePolicyGuardInterface.encodeFunctionData('configureAndConfirmPolicy', [
    targetAddress || ZERO_ADDRESS,
    selector || '0x00000000',
    operation || 0,
    policyAddress,
    data || '0x',
  ])

  return {
    to: safePolicyGuardAddress,
    value: '0',
    data: txData,
  }
}

export const createConfigurePolicyTx = ({
  safePolicyGuardAddress,
  targetAddress,
  selector,
  operation,
  policyAddress,
  data,
}: {
  safePolicyGuardAddress: string
  targetAddress: string
  selector: string
  operation: number
  policyAddress: string
  data: string
}) => {
  const txData = safePolicyGuardInterface.encodeFunctionData('configurePolicy', [
    targetAddress || ZERO_ADDRESS,
    selector || '0x00000000',
    operation || 0,
    policyAddress,
    data || '0x',
  ])

  return {
    to: safePolicyGuardAddress,
    value: '0',
    data: txData,
  }
}

export const createConfirmPolicyTx = ({
  safeAddress,
  targetAddress,
  selector,
  operation,
  policyAddress,
  data,
}: {
  safeAddress: string
  targetAddress: string
  selector: string
  operation: number
  policyAddress: string
  data: string
}) => {
  const txData = safePolicyGuardInterface.encodeFunctionData('confirmPolicy', [
    safeAddress,
    targetAddress || ZERO_ADDRESS,
    selector || '0x00000000',
    operation || 0,
    policyAddress,
    data || '0x',
  ])

  return {
    to: policyContracts.safePolicyGuard,
    value: '0',
    data: txData,
  }
}
