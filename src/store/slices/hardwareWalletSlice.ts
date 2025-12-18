/**
 * Hardware Wallet Redux Slice
 * State management for hardware wallet connections and accounts
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import {
  HardwareWalletDevice,
  HardwareWalletAccount,
  HardwareWalletState,
  ConnectionStatus,
  ConnectionType,
  HardwareWalletType,
  BIP44_PATH,
} from '../../services/hardware/types';
import { hardwareWalletManager } from '../../services/hardware/HardwareWalletManager';

// Initial state
const initialState: HardwareWalletState = {
  device: null,
  status: 'disconnected',
  accounts: [],
  selectedAccount: null,
  error: null,
  isScanning: false,
  availableDevices: [],
};

// Async thunks

/**
 * Scan for available hardware wallet devices
 */
export const scanDevices = createAsyncThunk(
  'hardwareWallet/scanDevices',
  async (
    params: { walletType?: HardwareWalletType; connectionType: ConnectionType },
    { rejectWithValue }
  ) => {
    try {
      if (params.walletType) {
        return await hardwareWalletManager.scanDevices(params.walletType, params.connectionType);
      }
      return await hardwareWalletManager.scanAllDevices(params.connectionType);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Connect to a hardware wallet device
 */
export const connectDevice = createAsyncThunk(
  'hardwareWallet/connect',
  async (device: HardwareWalletDevice, { rejectWithValue }) => {
    try {
      await hardwareWalletManager.connect(device);
      return device;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Disconnect from the current device
 */
export const disconnectDevice = createAsyncThunk(
  'hardwareWallet/disconnect',
  async (_, { rejectWithValue }) => {
    try {
      await hardwareWalletManager.disconnect();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Fetch accounts from the connected device
 */
export const fetchAccounts = createAsyncThunk(
  'hardwareWallet/fetchAccounts',
  async (
    params: { basePath?: string; startIndex?: number; count?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const { basePath = BIP44_PATH.ETHEREUM, startIndex = 0, count = 5 } = params;
      return await hardwareWalletManager.getAccounts(basePath, startIndex, count);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Verify address on device
 */
export const verifyAddressOnDevice = createAsyncThunk(
  'hardwareWallet/verifyAddress',
  async (params: { address: string; path: string }, { rejectWithValue }) => {
    try {
      return await hardwareWalletManager.verifyAddress(params.address, params.path);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Slice
const hardwareWalletSlice = createSlice({
  name: 'hardwareWallet',
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.status = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
    selectAccount: (state, action: PayloadAction<HardwareWalletAccount | null>) => {
      state.selectedAccount = action.payload;
    },
    updateAccountName: (state, action: PayloadAction<{ address: string; name: string }>) => {
      const account = state.accounts.find(a => a.address === action.payload.address);
      if (account) {
        account.name = action.payload.name;
      }
      if (state.selectedAccount?.address === action.payload.address) {
        state.selectedAccount.name = action.payload.name;
      }
    },
    clearDevices: state => {
      state.availableDevices = [];
    },
    resetState: () => initialState,
  },
  extraReducers: builder => {
    // Scan devices
    builder
      .addCase(scanDevices.pending, state => {
        state.isScanning = true;
        state.error = null;
      })
      .addCase(scanDevices.fulfilled, (state, action) => {
        state.isScanning = false;
        state.availableDevices = action.payload;
      })
      .addCase(scanDevices.rejected, (state, action) => {
        state.isScanning = false;
        state.error = action.payload as string;
      });

    // Connect device
    builder
      .addCase(connectDevice.pending, state => {
        state.status = 'connecting';
        state.error = null;
      })
      .addCase(connectDevice.fulfilled, (state, action) => {
        state.status = 'connected';
        state.device = action.payload;
      })
      .addCase(connectDevice.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload as string;
        state.device = null;
      });

    // Disconnect device
    builder
      .addCase(disconnectDevice.pending, state => {
        state.status = 'disconnected';
      })
      .addCase(disconnectDevice.fulfilled, state => {
        state.status = 'disconnected';
        state.device = null;
        state.accounts = [];
        state.selectedAccount = null;
      })
      .addCase(disconnectDevice.rejected, (state, action) => {
        state.status = 'disconnected';
        state.error = action.payload as string;
        state.device = null;
      });

    // Fetch accounts
    builder
      .addCase(fetchAccounts.pending, state => {
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        // Merge new accounts with existing ones
        const existingAddresses = new Set(state.accounts.map(a => a.address));
        const newAccounts = action.payload.filter(a => !existingAddresses.has(a.address));
        state.accounts = [...state.accounts, ...newAccounts];

        // Auto-select first account if none selected
        if (!state.selectedAccount && state.accounts.length > 0) {
          state.selectedAccount = state.accounts[0];
        }
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  setStatus,
  setError,
  clearError,
  selectAccount,
  updateAccountName,
  clearDevices,
  resetState,
} = hardwareWalletSlice.actions;

// Selectors
export const selectHardwareWalletState = (state: RootState) => state.hardwareWallet;
export const selectDevice = (state: RootState) => state.hardwareWallet.device;
export const selectConnectionStatus = (state: RootState) => state.hardwareWallet.status;
export const selectAccounts = (state: RootState) => state.hardwareWallet.accounts;
export const selectSelectedAccount = (state: RootState) => state.hardwareWallet.selectedAccount;
export const selectIsScanning = (state: RootState) => state.hardwareWallet.isScanning;
export const selectAvailableDevices = (state: RootState) => state.hardwareWallet.availableDevices;
export const selectHardwareWalletError = (state: RootState) => state.hardwareWallet.error;
export const selectIsConnected = (state: RootState) => state.hardwareWallet.status === 'connected';

export default hardwareWalletSlice.reducer;
