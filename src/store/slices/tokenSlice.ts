/**
 * Token Redux Slice
 * State management for token balances
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { BalanceService, TokenBalance } from '../../services/BalanceService';

// Types
export interface TokenState {
  tokens: TokenBalance[];
  totalBalance: string;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Initial state
const initialState: TokenState = {
  tokens: [],
  totalBalance: '0.00',
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Balance service instance
const balanceService = new BalanceService();

// Async Thunks
export const fetchTokenBalances = createAsyncThunk(
  'token/fetchBalances',
  async (address: string, { rejectWithValue }) => {
    try {
      const tokens = await balanceService.getTokenBalances(address);
      const totalBalance = await balanceService.getTotalBalance(address);

      return { tokens, totalBalance };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch balances';
      return rejectWithValue(message);
    }
  }
);

export const refreshTokenBalances = createAsyncThunk(
  'token/refreshBalances',
  async (address: string, { rejectWithValue }) => {
    try {
      const tokens = await balanceService.refreshBalance(address);
      const totalBalance = await balanceService.getTotalBalance(address);

      return { tokens, totalBalance };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh balances';
      return rejectWithValue(message);
    }
  }
);

// Slice
const tokenSlice = createSlice({
  name: 'token',
  initialState,
  reducers: {
    clearTokens: state => {
      state.tokens = [];
      state.totalBalance = '0.00';
      state.error = null;
      state.lastUpdated = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    // fetchTokenBalances
    builder
      .addCase(fetchTokenBalances.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTokenBalances.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tokens = action.payload.tokens;
        state.totalBalance = action.payload.totalBalance;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchTokenBalances.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // refreshTokenBalances
    builder
      .addCase(refreshTokenBalances.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refreshTokenBalances.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tokens = action.payload.tokens;
        state.totalBalance = action.payload.totalBalance;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(refreshTokenBalances.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { clearTokens, setError, clearError } = tokenSlice.actions;

// Selectors
export const selectTokens = (state: { token: TokenState }) => state.token.tokens;
export const selectTotalBalance = (state: { token: TokenState }) => state.token.totalBalance;
export const selectTokenLoading = (state: { token: TokenState }) => state.token.isLoading;
export const selectTokenError = (state: { token: TokenState }) => state.token.error;
export const selectLastUpdated = (state: { token: TokenState }) => state.token.lastUpdated;

export default tokenSlice.reducer;
