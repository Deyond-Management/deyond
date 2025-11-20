/**
 * Wallet Redux Slice
 * State management for wallet functionality
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Wallet, Account } from '../../types/wallet';

interface WalletState {
  currentWallet: Wallet | null;
  accounts: Account[];
  isLocked: boolean;
  isInitialized: boolean;
}

const initialState: WalletState = {
  currentWallet: null,
  accounts: [],
  isLocked: true,
  isInitialized: false,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWallet: (state, action: PayloadAction<Wallet>) => {
      state.currentWallet = action.payload;
      state.isInitialized = true;
    },
    unlockWallet: state => {
      state.isLocked = false;
    },
    lockWallet: state => {
      state.isLocked = true;
    },
    addAccount: (state, action: PayloadAction<Account>) => {
      state.accounts.push(action.payload);
    },
    updateAccountBalance: (state, action: PayloadAction<{ address: string; balance: string }>) => {
      const account = state.accounts.find(acc => acc.address === action.payload.address);
      if (account) {
        account.balance = action.payload.balance;
      }
    },
    removeAccount: (state, action: PayloadAction<string>) => {
      state.accounts = state.accounts.filter(acc => acc.address !== action.payload);
    },
    resetWallet: state => {
      state.currentWallet = null;
      state.accounts = [];
      state.isLocked = true;
      state.isInitialized = false;
    },
  },
});

export const {
  setWallet,
  unlockWallet,
  lockWallet,
  addAccount,
  updateAccountBalance,
  removeAccount,
  resetWallet,
} = walletSlice.actions;

export default walletSlice.reducer;
