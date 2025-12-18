/**
 * Price Alert Redux Slice
 * State management for price alerts
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import {
  PriceAlert,
  PriceAlertState,
  CreateAlertParams,
  AlertStatus,
} from '../../services/price/types';
import { getPriceAlertService } from '../../services/price/PriceAlertService';

// Initial state
const initialState: PriceAlertState = {
  alerts: [],
  isLoading: false,
  error: null,
  lastChecked: null,
};

// Async thunks

/**
 * Create a new price alert
 */
export const createPriceAlert = createAsyncThunk(
  'priceAlert/create',
  async (params: CreateAlertParams, { rejectWithValue }) => {
    try {
      const service = getPriceAlertService();
      return service.createAlert(params);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Delete a price alert
 */
export const deletePriceAlert = createAsyncThunk(
  'priceAlert/delete',
  async (alertId: string, { rejectWithValue }) => {
    try {
      const service = getPriceAlertService();
      const success = service.deleteAlert(alertId);
      if (!success) {
        throw new Error('Alert not found');
      }
      return alertId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Toggle alert enabled/disabled
 */
export const togglePriceAlert = createAsyncThunk(
  'priceAlert/toggle',
  async (alertId: string, { rejectWithValue }) => {
    try {
      const service = getPriceAlertService();
      const alert = service.toggleAlert(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }
      return alert;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Check all alerts (manual trigger)
 */
export const checkPriceAlerts = createAsyncThunk(
  'priceAlert/check',
  async (_, { rejectWithValue }) => {
    try {
      const service = getPriceAlertService();
      await service.checkAlerts();
      return service.getAlerts();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Start monitoring prices
 */
export const startPriceMonitoring = createAsyncThunk(
  'priceAlert/startMonitoring',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const service = getPriceAlertService();

    // Initialize service with stored alerts
    service.initialize(state.priceAlert.alerts);

    // Start monitoring
    service.startMonitoring();

    return true;
  }
);

/**
 * Stop monitoring prices
 */
export const stopPriceMonitoring = createAsyncThunk('priceAlert/stopMonitoring', async () => {
  const service = getPriceAlertService();
  service.stopMonitoring();
  return true;
});

// Slice
const priceAlertSlice = createSlice({
  name: 'priceAlert',
  initialState,
  reducers: {
    setAlerts: (state, action: PayloadAction<PriceAlert[]>) => {
      state.alerts = action.payload;
    },
    updateAlert: (state, action: PayloadAction<PriceAlert>) => {
      const index = state.alerts.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.alerts[index] = action.payload;
      }
    },
    markAlertTriggered: (state, action: PayloadAction<{ id: string; price: number }>) => {
      const alert = state.alerts.find(a => a.id === action.payload.id);
      if (alert) {
        alert.status = 'triggered';
        alert.triggeredAt = Date.now();
        alert.currentPrice = action.payload.price;
        alert.notificationSent = true;
      }
    },
    updateAlertPrice: (state, action: PayloadAction<{ id: string; price: number }>) => {
      const alert = state.alerts.find(a => a.id === action.payload.id);
      if (alert) {
        alert.currentPrice = action.payload.price;
      }
    },
    clearError: state => {
      state.error = null;
    },
    resetState: () => initialState,
  },
  extraReducers: builder => {
    // Create alert
    builder
      .addCase(createPriceAlert.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPriceAlert.fulfilled, (state, action) => {
        state.isLoading = false;
        state.alerts.push(action.payload);
      })
      .addCase(createPriceAlert.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete alert
    builder
      .addCase(deletePriceAlert.pending, state => {
        state.isLoading = true;
      })
      .addCase(deletePriceAlert.fulfilled, (state, action) => {
        state.isLoading = false;
        state.alerts = state.alerts.filter(a => a.id !== action.payload);
      })
      .addCase(deletePriceAlert.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Toggle alert
    builder.addCase(togglePriceAlert.fulfilled, (state, action) => {
      const index = state.alerts.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.alerts[index] = action.payload;
      }
    });

    // Check alerts
    builder
      .addCase(checkPriceAlerts.pending, state => {
        state.isLoading = true;
      })
      .addCase(checkPriceAlerts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.alerts = action.payload;
        state.lastChecked = Date.now();
      })
      .addCase(checkPriceAlerts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  setAlerts,
  updateAlert,
  markAlertTriggered,
  updateAlertPrice,
  clearError,
  resetState,
} = priceAlertSlice.actions;

// Selectors
export const selectPriceAlerts = (state: RootState) => state.priceAlert.alerts;
export const selectActiveAlerts = (state: RootState) =>
  state.priceAlert.alerts.filter(a => a.status === 'active');
export const selectTriggeredAlerts = (state: RootState) =>
  state.priceAlert.alerts.filter(a => a.status === 'triggered');
export const selectPriceAlertLoading = (state: RootState) => state.priceAlert.isLoading;
export const selectPriceAlertError = (state: RootState) => state.priceAlert.error;
export const selectLastChecked = (state: RootState) => state.priceAlert.lastChecked;

export default priceAlertSlice.reducer;
