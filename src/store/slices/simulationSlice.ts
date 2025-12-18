/**
 * Simulation Redux Slice
 * State management for transaction simulation
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import {
  SimulationResult,
  SimulationRequest,
  SimulationState,
} from '../../services/simulation/types';
import { getTransactionSimulationService } from '../../services/simulation/TransactionSimulationService';

// Initial state
const initialState: SimulationState = {
  currentSimulation: null,
  isSimulating: false,
  error: null,
  history: [],
};

// Async thunks

/**
 * Simulate a transaction
 */
export const simulateTransaction = createAsyncThunk(
  'simulation/simulate',
  async (request: SimulationRequest, { rejectWithValue }) => {
    try {
      const service = getTransactionSimulationService();
      const result = await service.simulate(request);
      return result;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Get mock simulation for demo
 */
export const getMockSimulation = createAsyncThunk(
  'simulation/getMock',
  async (request: SimulationRequest) => {
    const service = getTransactionSimulationService();
    return service.getMockSimulation(request);
  }
);

// Slice
const simulationSlice = createSlice({
  name: 'simulation',
  initialState,
  reducers: {
    setCurrentSimulation: (state, action: PayloadAction<SimulationResult | null>) => {
      state.currentSimulation = action.payload;
    },
    clearSimulation: state => {
      state.currentSimulation = null;
      state.error = null;
    },
    clearError: state => {
      state.error = null;
    },
    addToHistory: (state, action: PayloadAction<SimulationResult>) => {
      state.history.unshift(action.payload);
      // Keep only last 50 simulations
      if (state.history.length > 50) {
        state.history = state.history.slice(0, 50);
      }
    },
    clearHistory: state => {
      state.history = [];
    },
    resetState: () => initialState,
  },
  extraReducers: builder => {
    // Simulate transaction
    builder
      .addCase(simulateTransaction.pending, state => {
        state.isSimulating = true;
        state.error = null;
        state.currentSimulation = null;
      })
      .addCase(simulateTransaction.fulfilled, (state, action) => {
        state.isSimulating = false;
        state.currentSimulation = action.payload;
        // Add to history
        state.history.unshift(action.payload);
        if (state.history.length > 50) {
          state.history = state.history.slice(0, 50);
        }
      })
      .addCase(simulateTransaction.rejected, (state, action) => {
        state.isSimulating = false;
        state.error = action.payload as string;
      });

    // Mock simulation
    builder
      .addCase(getMockSimulation.pending, state => {
        state.isSimulating = true;
        state.error = null;
        state.currentSimulation = null;
      })
      .addCase(getMockSimulation.fulfilled, (state, action) => {
        state.isSimulating = false;
        state.currentSimulation = action.payload;
        // Add to history
        state.history.unshift(action.payload);
        if (state.history.length > 50) {
          state.history = state.history.slice(0, 50);
        }
      });
  },
});

// Export actions
export const {
  setCurrentSimulation,
  clearSimulation,
  clearError,
  addToHistory,
  clearHistory,
  resetState,
} = simulationSlice.actions;

// Selectors
export const selectCurrentSimulation = (state: RootState) => state.simulation.currentSimulation;
export const selectIsSimulating = (state: RootState) => state.simulation.isSimulating;
export const selectSimulationError = (state: RootState) => state.simulation.error;
export const selectSimulationHistory = (state: RootState) => state.simulation.history;
export const selectSimulationSuccess = (state: RootState) =>
  state.simulation.currentSimulation?.success ?? false;
export const selectSimulationWarnings = (state: RootState) =>
  state.simulation.currentSimulation?.warnings ?? [];
export const selectSimulationRiskLevel = (state: RootState) =>
  state.simulation.currentSimulation?.riskLevel ?? 'safe';

export default simulationSlice.reducer;
