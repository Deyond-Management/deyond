/**
 * Onboarding Slice Tests
 * Test onboarding flow state management and async actions
 */

import { configureStore } from '@reduxjs/toolkit';
import onboardingReducer, {
  setPassword,
  setMnemonic,
  setImportData,
  setBiometricEnabled,
  setOnboardingComplete,
  setError,
  clearError,
  resetOnboarding,
  createWallet,
  importWallet,
  OnboardingState,
} from '../../store/slices/onboardingSlice';

// Create test store
const createTestStore = (preloadedState?: Partial<OnboardingState>) => {
  return configureStore({
    reducer: {
      onboarding: onboardingReducer,
    },
    preloadedState: preloadedState
      ? { onboarding: { ...getInitialState(), ...preloadedState } }
      : undefined,
  });
};

const getInitialState = (): OnboardingState => ({
  password: null,
  mnemonic: null,
  importData: null,
  biometricEnabled: false,
  isComplete: false,
  isLoading: false,
  error: null,
  step: 'password',
});

describe('Onboarding Slice', () => {
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const store = createTestStore();
      const state = store.getState().onboarding;

      expect(state.password).toBeNull();
      expect(state.mnemonic).toBeNull();
      expect(state.importData).toBeNull();
      expect(state.biometricEnabled).toBe(false);
      expect(state.isComplete).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.step).toBe('password');
    });
  });

  describe('Synchronous Actions', () => {
    it('should set password', () => {
      const store = createTestStore();
      store.dispatch(setPassword('Test123!@#'));

      const state = store.getState().onboarding;
      expect(state.password).toBe('Test123!@#');
      expect(state.step).toBe('mnemonic');
    });

    it('should set mnemonic', () => {
      const store = createTestStore();
      const mnemonic = ['word1', 'word2', 'word3', 'word4', 'word5', 'word6', 'word7', 'word8', 'word9', 'word10', 'word11', 'word12'];
      store.dispatch(setMnemonic(mnemonic));

      const state = store.getState().onboarding;
      expect(state.mnemonic).toEqual(mnemonic);
      expect(state.step).toBe('verify');
    });

    it('should set import data', () => {
      const store = createTestStore();
      const importData = {
        method: 'mnemonic' as const,
        value: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      };
      store.dispatch(setImportData(importData));

      const state = store.getState().onboarding;
      expect(state.importData).toEqual(importData);
    });

    it('should set biometric enabled', () => {
      const store = createTestStore();
      store.dispatch(setBiometricEnabled(true));

      const state = store.getState().onboarding;
      expect(state.biometricEnabled).toBe(true);
      expect(state.step).toBe('complete');
    });

    it('should set onboarding complete', () => {
      const store = createTestStore();
      store.dispatch(setOnboardingComplete(true));

      const state = store.getState().onboarding;
      expect(state.isComplete).toBe(true);
    });

    it('should set error', () => {
      const store = createTestStore();
      store.dispatch(setError('Something went wrong'));

      const state = store.getState().onboarding;
      expect(state.error).toBe('Something went wrong');
    });

    it('should clear error', () => {
      const store = createTestStore({ error: 'Previous error' });
      store.dispatch(clearError());

      const state = store.getState().onboarding;
      expect(state.error).toBeNull();
    });

    it('should reset onboarding', () => {
      const store = createTestStore({
        password: 'Test123!@#',
        mnemonic: ['word1'],
        biometricEnabled: true,
        isComplete: true,
        step: 'complete',
      });

      store.dispatch(resetOnboarding());

      const state = store.getState().onboarding;
      expect(state.password).toBeNull();
      expect(state.mnemonic).toBeNull();
      expect(state.biometricEnabled).toBe(false);
      expect(state.isComplete).toBe(false);
      expect(state.step).toBe('password');
    });
  });

  describe('Async Thunks', () => {
    describe('createWallet', () => {
      it('should set loading state when pending', () => {
        const store = createTestStore();
        const action = { type: createWallet.pending.type };
        store.dispatch(action);

        const state = store.getState().onboarding;
        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle successful wallet creation', () => {
        const store = createTestStore();
        const action = {
          type: createWallet.fulfilled.type,
          payload: { success: true },
        };
        store.dispatch(action);

        const state = store.getState().onboarding;
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
      });

      it('should handle wallet creation failure', () => {
        const store = createTestStore();
        const action = {
          type: createWallet.rejected.type,
          payload: 'Failed to create wallet',
        };
        store.dispatch(action);

        const state = store.getState().onboarding;
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe('Failed to create wallet');
      });
    });

    describe('importWallet', () => {
      it('should set loading state when pending', () => {
        const store = createTestStore();
        const action = { type: importWallet.pending.type };
        store.dispatch(action);

        const state = store.getState().onboarding;
        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle successful wallet import', () => {
        const store = createTestStore();
        const action = {
          type: importWallet.fulfilled.type,
          payload: { success: true },
        };
        store.dispatch(action);

        const state = store.getState().onboarding;
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
      });

      it('should handle wallet import failure', () => {
        const store = createTestStore();
        const action = {
          type: importWallet.rejected.type,
          payload: 'Invalid mnemonic',
        };
        store.dispatch(action);

        const state = store.getState().onboarding;
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe('Invalid mnemonic');
      });
    });
  });

  describe('Step Progression', () => {
    it('should progress through onboarding steps', () => {
      const store = createTestStore();

      // Step 1: Password
      expect(store.getState().onboarding.step).toBe('password');

      // Step 2: Mnemonic display
      store.dispatch(setPassword('Test123!@#'));
      expect(store.getState().onboarding.step).toBe('mnemonic');

      // Step 3: Verify
      const mnemonic = ['word1', 'word2', 'word3', 'word4', 'word5', 'word6', 'word7', 'word8', 'word9', 'word10', 'word11', 'word12'];
      store.dispatch(setMnemonic(mnemonic));
      expect(store.getState().onboarding.step).toBe('verify');

      // Step 4: Biometric
      store.dispatch(setBiometricEnabled(true));
      expect(store.getState().onboarding.step).toBe('complete');
    });
  });
});
