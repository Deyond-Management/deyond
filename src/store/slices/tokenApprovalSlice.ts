/**
 * Token Approval Redux Slice
 * State management for token approval management
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import {
  TokenApproval,
  TokenApprovalState,
  RevokeApprovalParams,
  ApprovalStats,
} from '../../services/approval/types';
import { getTokenApprovalService } from '../../services/approval/TokenApprovalService';

// Initial state
const initialState: TokenApprovalState = {
  approvals: [],
  isLoading: false,
  isRevoking: false,
  error: null,
  lastScanned: null,
  selectedApproval: null,
};

// Async thunks

/**
 * Scan for token approvals
 */
export const scanApprovals = createAsyncThunk(
  'tokenApproval/scan',
  async (tokenAddresses: string[], { rejectWithValue }) => {
    try {
      const service = getTokenApprovalService();
      const result = await service.scanApprovals(tokenAddresses);
      return result;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Load mock approvals for demo
 */
export const loadMockApprovals = createAsyncThunk('tokenApproval/loadMock', async () => {
  const service = getTokenApprovalService();
  const approvals = service.getMockApprovals();
  return {
    approvals,
    scannedAt: Date.now(),
  };
});

/**
 * Revoke a token approval
 */
export const revokeApproval = createAsyncThunk(
  'tokenApproval/revoke',
  async (
    { params, signer }: { params: RevokeApprovalParams; signer: any },
    { rejectWithValue }
  ) => {
    try {
      const service = getTokenApprovalService();
      const txHash = await service.revokeApproval(params, signer);
      return {
        approvalId: `${params.tokenAddress}_${params.spenderAddress}`,
        txHash,
      };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Slice
const tokenApprovalSlice = createSlice({
  name: 'tokenApproval',
  initialState,
  reducers: {
    setApprovals: (state, action: PayloadAction<TokenApproval[]>) => {
      state.approvals = action.payload;
    },
    setSelectedApproval: (state, action: PayloadAction<TokenApproval | null>) => {
      state.selectedApproval = action.payload;
    },
    updateApprovalStatus: (
      state,
      action: PayloadAction<{ id: string; status: TokenApproval['status'] }>
    ) => {
      const approval = state.approvals.find(a => a.id === action.payload.id);
      if (approval) {
        approval.status = action.payload.status;
      }
    },
    clearError: state => {
      state.error = null;
    },
    resetState: () => initialState,
  },
  extraReducers: builder => {
    // Scan approvals
    builder
      .addCase(scanApprovals.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(scanApprovals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.approvals = action.payload.approvals;
        state.lastScanned = action.payload.scannedAt;
      })
      .addCase(scanApprovals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load mock approvals
    builder
      .addCase(loadMockApprovals.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadMockApprovals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.approvals = action.payload.approvals;
        state.lastScanned = action.payload.scannedAt;
      });

    // Revoke approval
    builder
      .addCase(revokeApproval.pending, state => {
        state.isRevoking = true;
        state.error = null;
      })
      .addCase(revokeApproval.fulfilled, (state, action) => {
        state.isRevoking = false;
        const approval = state.approvals.find(a => a.id === action.payload.approvalId);
        if (approval) {
          approval.status = 'revoked';
        }
        state.selectedApproval = null;
      })
      .addCase(revokeApproval.rejected, (state, action) => {
        state.isRevoking = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { setApprovals, setSelectedApproval, updateApprovalStatus, clearError, resetState } =
  tokenApprovalSlice.actions;

// Selectors
export const selectTokenApprovals = (state: RootState) => state.tokenApproval.approvals;
export const selectActiveApprovals = (state: RootState) =>
  state.tokenApproval.approvals.filter(a => a.status === 'active');
export const selectHighRiskApprovals = (state: RootState) =>
  state.tokenApproval.approvals.filter(
    a => a.status === 'active' && (a.riskLevel === 'high' || a.riskLevel === 'critical')
  );
export const selectUnlimitedApprovals = (state: RootState) =>
  state.tokenApproval.approvals.filter(a => a.status === 'active' && a.isUnlimited);
export const selectApprovalLoading = (state: RootState) => state.tokenApproval.isLoading;
export const selectApprovalRevoking = (state: RootState) => state.tokenApproval.isRevoking;
export const selectApprovalError = (state: RootState) => state.tokenApproval.error;
export const selectLastScanned = (state: RootState) => state.tokenApproval.lastScanned;
export const selectSelectedApproval = (state: RootState) => state.tokenApproval.selectedApproval;

// Stats selector
export const selectApprovalStats = (state: RootState): ApprovalStats => {
  const approvals = state.tokenApproval.approvals;
  const active = approvals.filter(a => a.status === 'active');
  const revoked = approvals.filter(a => a.status === 'revoked');
  const unlimited = active.filter(a => a.isUnlimited);
  const highRisk = active.filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical');

  return {
    totalApprovals: approvals.length,
    activeApprovals: active.length,
    revokedApprovals: revoked.length,
    unlimitedApprovals: unlimited.length,
    highRiskApprovals: highRisk.length,
    totalValueAtRisk: 'N/A',
  };
};

export default tokenApprovalSlice.reducer;
