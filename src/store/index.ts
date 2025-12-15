/**
 * Redux Store Configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore, persistReducer } from 'redux-persist';
import walletReducer from './slices/walletSlice';
import transactionReducer from './slices/transactionSlice';
import chatReducer from './slices/chatSlice';
import networkReducer from './slices/networkSlice';
import onboardingReducer from './slices/onboardingSlice';
import tokenReducer from './slices/tokenSlice';
import addressBookReducer from './slices/addressBookSlice';
import swapReducer from './slices/swapSlice';

// Persist configurations
const walletPersistConfig = {
  key: 'wallet',
  storage: AsyncStorage,
  whitelist: ['isInitialized'], // Only persist initialization status
};

const transactionPersistConfig = {
  key: 'transaction',
  storage: AsyncStorage,
  whitelist: ['transactions'], // Persist transaction history
};

const chatPersistConfig = {
  key: 'chat',
  storage: AsyncStorage,
  whitelist: ['messages'], // Persist chat messages
};

const networkPersistConfig = {
  key: 'network',
  storage: AsyncStorage,
  whitelist: ['currentNetwork', 'networks'], // Persist network configuration
};

const onboardingPersistConfig = {
  key: 'onboarding',
  storage: AsyncStorage,
  whitelist: ['isComplete', 'biometricEnabled'], // Persist completion status
};

const addressBookPersistConfig = {
  key: 'addressBook',
  storage: AsyncStorage,
  whitelist: ['contacts'], // Persist saved contacts
};

const swapPersistConfig = {
  key: 'swap',
  storage: AsyncStorage,
  whitelist: ['history', 'settings'], // Persist swap history and settings
};

// Create persisted reducers
const persistedWalletReducer = persistReducer(walletPersistConfig, walletReducer);
const persistedTransactionReducer = persistReducer(transactionPersistConfig, transactionReducer);
const persistedChatReducer = persistReducer(chatPersistConfig, chatReducer);
const persistedNetworkReducer = persistReducer(networkPersistConfig, networkReducer);
const persistedOnboardingReducer = persistReducer(onboardingPersistConfig, onboardingReducer);
const persistedAddressBookReducer = persistReducer(addressBookPersistConfig, addressBookReducer);
const persistedSwapReducer = persistReducer(swapPersistConfig, swapReducer);

// Configure store
export const store = configureStore({
  reducer: {
    wallet: persistedWalletReducer,
    transaction: persistedTransactionReducer,
    chat: persistedChatReducer,
    network: persistedNetworkReducer,
    onboarding: persistedOnboardingReducer,
    token: tokenReducer, // Token balances not persisted - fetched fresh
    addressBook: persistedAddressBookReducer,
    swap: persistedSwapReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
