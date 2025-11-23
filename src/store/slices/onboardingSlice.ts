/**
 * Onboarding Redux Slice
 * State management for wallet onboarding flow
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { WalletManager } from '../../core/wallet/WalletManager';

// Types
export type OnboardingStep = 'password' | 'mnemonic' | 'verify' | 'biometric' | 'complete';

export interface ImportData {
  method: 'mnemonic' | 'privateKey';
  value: string;
}

export interface OnboardingState {
  password: string | null;
  mnemonic: string[] | null;
  importData: ImportData | null;
  biometricEnabled: boolean;
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;
  step: OnboardingStep;
}

// Initial state
const initialState: OnboardingState = {
  password: null,
  mnemonic: null,
  importData: null,
  biometricEnabled: false,
  isComplete: false,
  isLoading: false,
  error: null,
  step: 'password',
};

// Async Thunks
export const createWallet = createAsyncThunk(
  'onboarding/createWallet',
  async (
    { password, mnemonic }: { password: string; mnemonic: string[] },
    { rejectWithValue }
  ) => {
    try {
      const walletManager = WalletManager.getInstance();
      const mnemonicString = mnemonic.join(' ');

      // Create wallet from mnemonic
      await walletManager.createWallet(mnemonicString, password);

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create wallet';
      return rejectWithValue(message);
    }
  }
);

export const importWallet = createAsyncThunk(
  'onboarding/importWallet',
  async (
    { importData, password }: { importData: ImportData; password: string },
    { rejectWithValue }
  ) => {
    try {
      const walletManager = WalletManager.getInstance();

      if (importData.method === 'mnemonic') {
        // Validate and import from mnemonic
        if (!walletManager.validateMnemonic(importData.value)) {
          return rejectWithValue('Invalid mnemonic phrase');
        }
        await walletManager.createWallet(importData.value, password);
      } else {
        // Import from private key
        await walletManager.importFromPrivateKey(importData.value, password);
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import wallet';
      return rejectWithValue(message);
    }
  }
);

// Slice
const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    setPassword: (state, action: PayloadAction<string>) => {
      state.password = action.payload;
      state.step = 'mnemonic';
    },
    setMnemonic: (state, action: PayloadAction<string[]>) => {
      state.mnemonic = action.payload;
      state.step = 'verify';
    },
    setImportData: (state, action: PayloadAction<ImportData>) => {
      state.importData = action.payload;
    },
    setBiometricEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricEnabled = action.payload;
      state.step = 'complete';
    },
    setOnboardingComplete: (state, action: PayloadAction<boolean>) => {
      state.isComplete = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setStep: (state, action: PayloadAction<OnboardingStep>) => {
      state.step = action.payload;
    },
    resetOnboarding: (state) => {
      state.password = null;
      state.mnemonic = null;
      state.importData = null;
      state.biometricEnabled = false;
      state.isComplete = false;
      state.isLoading = false;
      state.error = null;
      state.step = 'password';
    },
  },
  extraReducers: (builder) => {
    // createWallet
    builder
      .addCase(createWallet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createWallet.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(createWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // importWallet
    builder
      .addCase(importWallet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(importWallet.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(importWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  setPassword,
  setMnemonic,
  setImportData,
  setBiometricEnabled,
  setOnboardingComplete,
  setError,
  clearError,
  setStep,
  resetOnboarding,
} = onboardingSlice.actions;

// Selectors
export const selectOnboarding = (state: { onboarding: OnboardingState }) => state.onboarding;
export const selectOnboardingStep = (state: { onboarding: OnboardingState }) => state.onboarding.step;
export const selectIsOnboardingComplete = (state: { onboarding: OnboardingState }) => state.onboarding.isComplete;
export const selectOnboardingError = (state: { onboarding: OnboardingState }) => state.onboarding.error;
export const selectOnboardingLoading = (state: { onboarding: OnboardingState }) => state.onboarding.isLoading;

export default onboardingSlice.reducer;
