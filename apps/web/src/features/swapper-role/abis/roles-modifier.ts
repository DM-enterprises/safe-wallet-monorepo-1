export const RolesModifierAbi = [
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'allowances',
    outputs: [
      { internalType: 'uint128', name: 'refill', type: 'uint128' },
      { internalType: 'uint128', name: 'maxRefill', type: 'uint128' },
      { internalType: 'uint64', name: 'period', type: 'uint64' },
      { internalType: 'uint128', name: 'balance', type: 'uint128' },
      { internalType: 'uint64', name: 'timestamp', type: 'uint64' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  'function execTransactionWithRole(address,uint256,bytes,uint8,bytes32,bool)',
  'function setAllowance(bytes32,uint128,uint128,uint128,uint64,uint64)',
]
