/**
 * Network Redux Slice
 * State management for blockchain networks
 * Supports EVM, Solana, and Bitcoin networks
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Network, NetworkType } from '../../types/wallet';

interface NetworkState {
  networks: Network[];
  currentNetwork: Network | null;
  showTestnets: boolean;
}

/**
 * All supported networks
 */
const ALL_NETWORKS: Network[] = [
  // EVM Mainnets
  {
    id: 'ethereum-mainnet',
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    currencySymbol: 'ETH',
    blockExplorerUrl: 'https://etherscan.io',
    isTestnet: false,
    networkType: 'evm',
    decimals: 18,
    coinType: 60,
  },
  {
    id: 'polygon-mainnet',
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    currencySymbol: 'MATIC',
    blockExplorerUrl: 'https://polygonscan.com',
    isTestnet: false,
    networkType: 'evm',
    decimals: 18,
    coinType: 60,
  },
  {
    id: 'bsc-mainnet',
    name: 'BNB Smart Chain',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    currencySymbol: 'BNB',
    blockExplorerUrl: 'https://bscscan.com',
    isTestnet: false,
    networkType: 'evm',
    decimals: 18,
    coinType: 60,
  },
  {
    id: 'arbitrum-mainnet',
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    currencySymbol: 'ETH',
    blockExplorerUrl: 'https://arbiscan.io',
    isTestnet: false,
    networkType: 'evm',
    decimals: 18,
    coinType: 60,
  },
  {
    id: 'optimism-mainnet',
    name: 'Optimism',
    chainId: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    currencySymbol: 'ETH',
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    isTestnet: false,
    networkType: 'evm',
    decimals: 18,
    coinType: 60,
  },
  {
    id: 'base-mainnet',
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    currencySymbol: 'ETH',
    blockExplorerUrl: 'https://basescan.org',
    isTestnet: false,
    networkType: 'evm',
    decimals: 18,
    coinType: 60,
  },
  // Solana
  {
    id: 'solana-mainnet',
    name: 'Solana',
    chainId: 'mainnet-beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    currencySymbol: 'SOL',
    blockExplorerUrl: 'https://solscan.io',
    isTestnet: false,
    networkType: 'solana',
    decimals: 9,
    coinType: 501,
  },
  // Bitcoin
  {
    id: 'bitcoin-mainnet',
    name: 'Bitcoin',
    chainId: 'mainnet',
    rpcUrl: 'https://blockstream.info/api',
    currencySymbol: 'BTC',
    blockExplorerUrl: 'https://blockstream.info',
    isTestnet: false,
    networkType: 'bitcoin',
    decimals: 8,
    coinType: 0,
  },
  // Testnets
  {
    id: 'ethereum-sepolia',
    name: 'Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://rpc.sepolia.org',
    currencySymbol: 'ETH',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
    networkType: 'evm',
    decimals: 18,
    coinType: 60,
  },
  {
    id: 'solana-devnet',
    name: 'Solana Devnet',
    chainId: 'devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    currencySymbol: 'SOL',
    blockExplorerUrl: 'https://solscan.io/?cluster=devnet',
    isTestnet: true,
    networkType: 'solana',
    decimals: 9,
    coinType: 501,
  },
  {
    id: 'bitcoin-testnet',
    name: 'Bitcoin Testnet',
    chainId: 'testnet',
    rpcUrl: 'https://blockstream.info/testnet/api',
    currencySymbol: 'tBTC',
    blockExplorerUrl: 'https://blockstream.info/testnet',
    isTestnet: true,
    networkType: 'bitcoin',
    decimals: 8,
    coinType: 1,
  },
];

const initialState: NetworkState = {
  networks: ALL_NETWORKS,
  currentNetwork: ALL_NETWORKS[0], // Ethereum Mainnet
  showTestnets: false,
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setCurrentNetwork: (state, action: PayloadAction<Network>) => {
      state.currentNetwork = action.payload;
    },
    setCurrentNetworkById: (state, action: PayloadAction<string>) => {
      const network = state.networks.find(n => n.id === action.payload);
      if (network) {
        state.currentNetwork = network;
      }
    },
    toggleShowTestnets: state => {
      state.showTestnets = !state.showTestnets;
    },
    setShowTestnets: (state, action: PayloadAction<boolean>) => {
      state.showTestnets = action.payload;
    },
    addNetwork: (state, action: PayloadAction<Network>) => {
      const exists = state.networks.some(n => n.id === action.payload.id);
      if (!exists) {
        state.networks.push(action.payload);
      }
    },
    updateNetwork: (state, action: PayloadAction<Network>) => {
      const index = state.networks.findIndex(n => n.id === action.payload.id);
      if (index !== -1) {
        state.networks[index] = action.payload;
      }
    },
    removeNetwork: (state, action: PayloadAction<string>) => {
      // Prevent removing built-in networks
      const network = state.networks.find(n => n.id === action.payload);
      if (network && ALL_NETWORKS.some(n => n.id === action.payload)) {
        return; // Don't remove built-in networks
      }
      state.networks = state.networks.filter(n => n.id !== action.payload);
      if (state.currentNetwork?.id === action.payload) {
        state.currentNetwork = state.networks[0] || null;
      }
    },
  },
});

export const {
  setCurrentNetwork,
  setCurrentNetworkById,
  toggleShowTestnets,
  setShowTestnets,
  addNetwork,
  updateNetwork,
  removeNetwork,
} = networkSlice.actions;

// Selectors
export const selectNetworks = (state: { network: NetworkState }) => state.network.networks;
export const selectCurrentNetwork = (state: { network: NetworkState }) =>
  state.network.currentNetwork;
export const selectShowTestnets = (state: { network: NetworkState }) => state.network.showTestnets;

export const selectVisibleNetworks = (state: { network: NetworkState }) => {
  const { networks, showTestnets } = state.network;
  return showTestnets ? networks : networks.filter(n => !n.isTestnet);
};

export const selectNetworksByType = (state: { network: NetworkState }, type: NetworkType) => {
  return state.network.networks.filter(n => n.networkType === type);
};

export const selectMainnets = (state: { network: NetworkState }) => {
  return state.network.networks.filter(n => !n.isTestnet);
};

export const selectTestnets = (state: { network: NetworkState }) => {
  return state.network.networks.filter(n => n.isTestnet);
};

export default networkSlice.reducer;
