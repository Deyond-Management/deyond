/**
 * ChainConfig
 * Chain metadata registry for all supported blockchains
 */

import { ChainMetadata, SupportedChain } from './types';

/**
 * Chain metadata registry
 */
export const CHAIN_METADATA: Record<SupportedChain, ChainMetadata> = {
  ethereum: {
    chainId: '1',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    type: 'evm',
    logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    rpcUrls: [
      'https://eth-mainnet.g.alchemy.com/v2/',
      'https://mainnet.infura.io/v3/',
      'https://cloudflare-eth.com',
    ],
    wsUrls: ['wss://eth-mainnet.g.alchemy.com/v2/'],
    explorerUrls: ['https://etherscan.io'],
    explorerApiUrls: ['https://api.etherscan.io/api'],
    testnet: false,
    blockTime: 12,
    coinType: 60,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },

  polygon: {
    chainId: '137',
    name: 'Polygon',
    symbol: 'MATIC',
    decimals: 18,
    type: 'evm',
    logo: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
    rpcUrls: [
      'https://polygon-mainnet.g.alchemy.com/v2/',
      'https://polygon-rpc.com',
      'https://rpc-mainnet.maticvigil.com',
    ],
    wsUrls: ['wss://polygon-mainnet.g.alchemy.com/v2/'],
    explorerUrls: ['https://polygonscan.com'],
    explorerApiUrls: ['https://api.polygonscan.com/api'],
    testnet: false,
    blockTime: 2,
    coinType: 60,
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },

  bsc: {
    chainId: '56',
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    decimals: 18,
    type: 'evm',
    logo: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
    rpcUrls: [
      'https://bsc-dataseed.binance.org',
      'https://bsc-dataseed1.defibit.io',
      'https://bsc-dataseed1.ninicoin.io',
    ],
    explorerUrls: ['https://bscscan.com'],
    explorerApiUrls: ['https://api.bscscan.com/api'],
    testnet: false,
    blockTime: 3,
    coinType: 60,
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
  },

  arbitrum: {
    chainId: '42161',
    name: 'Arbitrum One',
    symbol: 'ETH',
    decimals: 18,
    type: 'evm',
    logo: 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
    rpcUrls: ['https://arb-mainnet.g.alchemy.com/v2/', 'https://arb1.arbitrum.io/rpc'],
    wsUrls: ['wss://arb-mainnet.g.alchemy.com/v2/'],
    explorerUrls: ['https://arbiscan.io'],
    explorerApiUrls: ['https://api.arbiscan.io/api'],
    testnet: false,
    blockTime: 0.25,
    coinType: 60,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },

  optimism: {
    chainId: '10',
    name: 'Optimism',
    symbol: 'ETH',
    decimals: 18,
    type: 'evm',
    logo: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
    rpcUrls: ['https://opt-mainnet.g.alchemy.com/v2/', 'https://mainnet.optimism.io'],
    wsUrls: ['wss://opt-mainnet.g.alchemy.com/v2/'],
    explorerUrls: ['https://optimistic.etherscan.io'],
    explorerApiUrls: ['https://api-optimistic.etherscan.io/api'],
    testnet: false,
    blockTime: 2,
    coinType: 60,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },

  avalanche: {
    chainId: '43114',
    name: 'Avalanche C-Chain',
    symbol: 'AVAX',
    decimals: 18,
    type: 'evm',
    logo: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc', 'https://avalanche-mainnet.infura.io/v3/'],
    explorerUrls: ['https://snowtrace.io'],
    explorerApiUrls: ['https://api.snowtrace.io/api'],
    testnet: false,
    blockTime: 2,
    coinType: 60,
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
  },

  base: {
    chainId: '8453',
    name: 'Base',
    symbol: 'ETH',
    decimals: 18,
    type: 'evm',
    logo: 'https://assets.coingecko.com/asset_platforms/images/131/small/base.jpeg',
    rpcUrls: ['https://base-mainnet.g.alchemy.com/v2/', 'https://mainnet.base.org'],
    wsUrls: ['wss://base-mainnet.g.alchemy.com/v2/'],
    explorerUrls: ['https://basescan.org'],
    explorerApiUrls: ['https://api.basescan.org/api'],
    testnet: false,
    blockTime: 2,
    coinType: 60,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },

  solana: {
    chainId: 'mainnet-beta',
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    type: 'solana',
    logo: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    rpcUrls: ['https://api.mainnet-beta.solana.com', 'https://solana-mainnet.g.alchemy.com/v2/'],
    wsUrls: ['wss://api.mainnet-beta.solana.com'],
    explorerUrls: ['https://solscan.io', 'https://explorer.solana.com'],
    testnet: false,
    blockTime: 0.4,
    coinType: 501,
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
  },

  bitcoin: {
    chainId: 'mainnet',
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 8,
    type: 'bitcoin',
    logo: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    rpcUrls: ['https://blockstream.info/api', 'https://mempool.space/api'],
    explorerUrls: ['https://blockstream.info', 'https://mempool.space'],
    testnet: false,
    blockTime: 600,
    coinType: 0,
    nativeCurrency: {
      name: 'Bitcoin',
      symbol: 'BTC',
      decimals: 8,
    },
  },
};

/**
 * Testnet chain metadata
 */
export const TESTNET_CHAINS: Partial<Record<string, ChainMetadata>> = {
  sepolia: {
    chainId: '11155111',
    name: 'Sepolia',
    symbol: 'ETH',
    decimals: 18,
    type: 'evm',
    logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/', 'https://sepolia.infura.io/v3/'],
    explorerUrls: ['https://sepolia.etherscan.io'],
    explorerApiUrls: ['https://api-sepolia.etherscan.io/api'],
    testnet: true,
    blockTime: 12,
    coinType: 60,
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  'solana-devnet': {
    chainId: 'devnet',
    name: 'Solana Devnet',
    symbol: 'SOL',
    decimals: 9,
    type: 'solana',
    logo: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    rpcUrls: ['https://api.devnet.solana.com'],
    wsUrls: ['wss://api.devnet.solana.com'],
    explorerUrls: ['https://solscan.io/?cluster=devnet'],
    testnet: true,
    blockTime: 0.4,
    coinType: 501,
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
  },
  'bitcoin-testnet': {
    chainId: 'testnet',
    name: 'Bitcoin Testnet',
    symbol: 'tBTC',
    decimals: 8,
    type: 'bitcoin',
    logo: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    rpcUrls: ['https://blockstream.info/testnet/api'],
    explorerUrls: ['https://blockstream.info/testnet'],
    testnet: true,
    blockTime: 600,
    coinType: 1,
    nativeCurrency: {
      name: 'Testnet Bitcoin',
      symbol: 'tBTC',
      decimals: 8,
    },
  },
};

/**
 * Get chain metadata by chain ID
 */
export function getChainById(chainId: string): ChainMetadata | undefined {
  return Object.values(CHAIN_METADATA).find(chain => chain.chainId === chainId);
}

/**
 * Get chain metadata by name
 */
export function getChainByName(name: SupportedChain): ChainMetadata {
  return CHAIN_METADATA[name];
}

/**
 * Get all EVM chains
 */
export function getEVMChains(): ChainMetadata[] {
  return Object.values(CHAIN_METADATA).filter(chain => chain.type === 'evm');
}

/**
 * Check if chain is EVM compatible
 */
export function isEVMChain(chain: SupportedChain | string): boolean {
  const metadata =
    typeof chain === 'string' && chain in CHAIN_METADATA
      ? CHAIN_METADATA[chain as SupportedChain]
      : getChainById(chain);
  return metadata?.type === 'evm';
}

/**
 * Get BIP44 derivation path for chain
 */
export function getDerivationPath(
  chain: SupportedChain,
  accountIndex: number = 0,
  addressIndex: number = 0
): string {
  const metadata = CHAIN_METADATA[chain];
  const coinType = metadata.coinType;

  // Standard BIP44 path: m/44'/coin_type'/account'/change/address_index
  return `m/44'/${coinType}'/${accountIndex}'/0/${addressIndex}`;
}

export default CHAIN_METADATA;
