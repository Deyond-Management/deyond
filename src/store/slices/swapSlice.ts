/**
 * Swap Slice
 * Redux state management for token swap functionality
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  SwapToken,
  SwapQuote,
  SwapHistory,
  SwapSettings,
  DEFAULT_SWAP_SETTINGS,
} from '../../types/swap';

interface SwapState {
  // Token selection
  fromToken: SwapToken | null;
  toToken: SwapToken | null;

  // Amount and quote
  fromAmount: string;
  quote: SwapQuote | null;

  // Settings
  settings: SwapSettings;

  // History
  history: SwapHistory[];

  // UI state
  isLoadingQuote: boolean;
  isSwapping: boolean;
  error: string | null;

  // Available tokens
  availableTokens: SwapToken[];
}

const initialState: SwapState = {
  fromToken: null,
  toToken: null,
  fromAmount: '',
  quote: null,
  settings: DEFAULT_SWAP_SETTINGS,
  history: [],
  isLoadingQuote: false,
  isSwapping: false,
  error: null,
  availableTokens: [],
};

const swapSlice = createSlice({
  name: 'swap',
  initialState,
  reducers: {
    // Token selection
    setFromToken: (state, action: PayloadAction<SwapToken | null>) => {
      state.fromToken = action.payload;
      state.error = null;

      // If from and to tokens are the same, clear to token
      if (action.payload && state.toToken?.address === action.payload.address) {
        state.toToken = null;
      }
    },

    setToToken: (state, action: PayloadAction<SwapToken | null>) => {
      state.toToken = action.payload;
      state.error = null;

      // If from and to tokens are the same, clear from token
      if (action.payload && state.fromToken?.address === action.payload.address) {
        state.fromToken = null;
      }
    },

    // Swap tokens
    swapTokens: state => {
      const tempToken = state.fromToken;
      state.fromToken = state.toToken;
      state.toToken = tempToken;
      state.fromAmount = '';
      state.quote = null;
      state.error = null;
    },

    // Amount
    setFromAmount: (state, action: PayloadAction<string>) => {
      state.fromAmount = action.payload;
      state.error = null;
    },

    // Quote
    setQuote: (state, action: PayloadAction<SwapQuote | null>) => {
      state.quote = action.payload;
      state.isLoadingQuote = false;
    },

    setLoadingQuote: (state, action: PayloadAction<boolean>) => {
      state.isLoadingQuote = action.payload;
    },

    // Settings
    updateSettings: (state, action: PayloadAction<Partial<SwapSettings>>) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    },

    resetSettings: state => {
      state.settings = DEFAULT_SWAP_SETTINGS;
    },

    // Swap execution
    setSwapping: (state, action: PayloadAction<boolean>) => {
      state.isSwapping = action.payload;
    },

    // History
    addSwapHistory: (state, action: PayloadAction<SwapHistory>) => {
      state.history.unshift(action.payload);

      // Keep only last 50 swaps
      if (state.history.length > 50) {
        state.history = state.history.slice(0, 50);
      }
    },

    updateSwapHistory: (
      state,
      action: PayloadAction<{ id: string; status: SwapHistory['status'] }>
    ) => {
      const swap = state.history.find(s => s.id === action.payload.id);
      if (swap) {
        swap.status = action.payload.status;
      }
    },

    clearHistory: state => {
      state.history = [];
    },

    // Available tokens
    setAvailableTokens: (state, action: PayloadAction<SwapToken[]>) => {
      state.availableTokens = action.payload;
    },

    // Error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoadingQuote = false;
      state.isSwapping = false;
    },

    // Reset
    resetSwap: state => {
      state.fromToken = null;
      state.toToken = null;
      state.fromAmount = '';
      state.quote = null;
      state.error = null;
      state.isLoadingQuote = false;
      state.isSwapping = false;
    },

    resetAll: () => initialState,
  },
});

export const {
  setFromToken,
  setToToken,
  swapTokens,
  setFromAmount,
  setQuote,
  setLoadingQuote,
  updateSettings,
  resetSettings,
  setSwapping,
  addSwapHistory,
  updateSwapHistory,
  clearHistory,
  setAvailableTokens,
  setError,
  resetSwap,
  resetAll,
} = swapSlice.actions;

export default swapSlice.reducer;
