export const SWAPPER_ROLE_KEY = 'SafeSwapperRole'

export const COW_SWAP_API = {
  '11155111': 'https://api.cow.fi/sepolia',
} as const

export function isSwapperRoleChain(
  chainId: string,
): chainId is keyof typeof SWAPPER_ROLE_CONTRACTS & keyof typeof COW_SWAP_API {
  return chainId in SWAPPER_ROLE_CONTRACTS && chainId in COW_SWAP_API
}

export const SWAPPER_ROLE_CONTRACTS = {
  // '1': {
  //   cowSwap: {
  //     orderSigner: '0x23dA9AdE38E4477b23770DeD512fD37b12381FAB',
  //     gpv2VaultRelayer: '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110',
  //   },
  //   weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  // },
  // '100': {
  //   cowSwap: {
  //     orderSigner: '0x23dA9AdE38E4477b23770DeD512fD37b12381FAB',
  //     gpv2VaultRelayer: '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110',
  //   },
  //   wxdai: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
  // },
  // '42161': {
  //   cowSwap: {
  //     orderSigner: '0x23dA9AdE38E4477b23770DeD512fD37b12381FAB',
  //   },
  //   weth: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  // },
  '11155111': {
    cowSwap: {
      orderSigner: '0x23dA9AdE38E4477b23770DeD512fD37b12381FAB',
      gpv2VaultRelayer: '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110',
    },
    weth: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    roles: '0x9646fDAD06d3e24444381f44362a3B0eB343D337',
  },
} as const
