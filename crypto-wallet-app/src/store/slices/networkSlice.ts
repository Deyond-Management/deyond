/**
 * Network Redux Slice
 * State management for blockchain networks
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Network } from '../../types/wallet';

interface NetworkState {
  networks: Network[];
  currentNetwork: Network | null;
}

const initialState: NetworkState = {
  networks: [
    {
      id: 'ethereum-mainnet',
      name: 'Ethereum Mainnet',
      chainId: 1,
      rpcUrl: 'https://eth.llamarpc.com',
      currencySymbol: 'ETH',
      blockExplorerUrl: 'https://etherscan.io',
      isTestnet: false,
    },
    {
      id: 'ethereum-sepolia',
      name: 'Sepolia Testnet',
      chainId: 11155111,
      rpcUrl: 'https://rpc.sepolia.org',
      currencySymbol: 'SepoliaETH',
      blockExplorerUrl: 'https://sepolia.etherscan.io',
      isTestnet: true,
    },
    {
      id: 'polygon-mainnet',
      name: 'Polygon Mainnet',
      chainId: 137,
      rpcUrl: 'https://polygon-rpc.com',
      currencySymbol: 'MATIC',
      blockExplorerUrl: 'https://polygonscan.com',
      isTestnet: false,
    },
    {
      id: 'bsc-mainnet',
      name: 'BNB Smart Chain',
      chainId: 56,
      rpcUrl: 'https://bsc-dataseed.binance.org',
      currencySymbol: 'BNB',
      blockExplorerUrl: 'https://bscscan.com',
      isTestnet: false,
    },
  ],
  currentNetwork: null,
};

// Set default network
initialState.currentNetwork = initialState.networks[0];

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setCurrentNetwork: (state, action: PayloadAction<Network>) => {
      state.currentNetwork = action.payload;
    },
    addNetwork: (state, action: PayloadAction<Network>) => {
      state.networks.push(action.payload);
    },
    updateNetwork: (state, action: PayloadAction<Network>) => {
      const index = state.networks.findIndex(n => n.id === action.payload.id);
      if (index !== -1) {
        state.networks[index] = action.payload;
      }
    },
    removeNetwork: (state, action: PayloadAction<string>) => {
      state.networks = state.networks.filter(n => n.id !== action.payload);
      if (state.currentNetwork?.id === action.payload) {
        state.currentNetwork = state.networks[0] || null;
      }
    },
  },
});

export const { setCurrentNetwork, addNetwork, updateNetwork, removeNetwork } =
  networkSlice.actions;

export default networkSlice.reducer;
