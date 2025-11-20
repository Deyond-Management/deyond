/**
 * Transaction Redux Slice
 * State management for transactions
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Transaction } from '../../types/wallet';

interface TransactionState {
  transactions: Transaction[];
  pendingTransactions: Transaction[];
  loading: boolean;
  error: string | null;
}

const initialState: TransactionState = {
  transactions: [],
  pendingTransactions: [],
  loading: false,
  error: null,
};

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
    },
    addPendingTransaction: (state, action: PayloadAction<Transaction>) => {
      state.pendingTransactions.push(action.payload);
    },
    updateTransaction: (state, action: PayloadAction<Transaction>) => {
      const index = state.transactions.findIndex(tx => tx.id === action.payload.id);
      if (index !== -1) {
        state.transactions[index] = action.payload;
      }

      const pendingIndex = state.pendingTransactions.findIndex(tx => tx.id === action.payload.id);
      if (pendingIndex !== -1) {
        state.pendingTransactions.splice(pendingIndex, 1);
      }
    },
    removePendingTransaction: (state, action: PayloadAction<string>) => {
      state.pendingTransactions = state.pendingTransactions.filter(tx => tx.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearTransactions: state => {
      state.transactions = [];
      state.pendingTransactions = [];
    },
  },
});

export const {
  addTransaction,
  addPendingTransaction,
  updateTransaction,
  removePendingTransaction,
  setLoading,
  setError,
  clearTransactions,
} = transactionSlice.actions;

export default transactionSlice.reducer;
