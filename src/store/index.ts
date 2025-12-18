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
import browserReducer from './slices/browserSlice';
import walletConnectReducer from './slices/walletConnectSlice';
import notificationReducer from './slices/notificationSlice';
import hardwareWalletReducer from './slices/hardwareWalletSlice';
import priceAlertReducer from './slices/priceAlertSlice';
import tokenApprovalReducer from './slices/tokenApprovalSlice';
import simulationReducer from './slices/simulationSlice';

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

const browserPersistConfig = {
  key: 'browser',
  storage: AsyncStorage,
  whitelist: ['history', 'bookmarks'], // Persist browser history and bookmarks
};

const walletConnectPersistConfig = {
  key: 'walletConnect',
  storage: AsyncStorage,
  whitelist: ['sessions', 'lastConnectedDApp'], // Persist WalletConnect sessions
};

const notificationPersistConfig = {
  key: 'notification',
  storage: AsyncStorage,
  whitelist: ['settings', 'history'], // Persist notification settings and history
};

const hardwareWalletPersistConfig = {
  key: 'hardwareWallet',
  storage: AsyncStorage,
  whitelist: ['accounts'], // Only persist account names, not connection state
};

const priceAlertPersistConfig = {
  key: 'priceAlert',
  storage: AsyncStorage,
  whitelist: ['alerts'], // Persist alerts
};

const tokenApprovalPersistConfig = {
  key: 'tokenApproval',
  storage: AsyncStorage,
  whitelist: ['approvals', 'lastScanned'], // Persist approvals cache
};

// Create persisted reducers
const persistedWalletReducer = persistReducer(walletPersistConfig, walletReducer);
const persistedTransactionReducer = persistReducer(transactionPersistConfig, transactionReducer);
const persistedChatReducer = persistReducer(chatPersistConfig, chatReducer);
const persistedNetworkReducer = persistReducer(networkPersistConfig, networkReducer);
const persistedOnboardingReducer = persistReducer(onboardingPersistConfig, onboardingReducer);
const persistedAddressBookReducer = persistReducer(addressBookPersistConfig, addressBookReducer);
const persistedSwapReducer = persistReducer(swapPersistConfig, swapReducer);
const persistedBrowserReducer = persistReducer(browserPersistConfig, browserReducer);
const persistedWalletConnectReducer = persistReducer(
  walletConnectPersistConfig,
  walletConnectReducer
);
const persistedNotificationReducer = persistReducer(notificationPersistConfig, notificationReducer);
const persistedHardwareWalletReducer = persistReducer(
  hardwareWalletPersistConfig,
  hardwareWalletReducer
);
const persistedPriceAlertReducer = persistReducer(priceAlertPersistConfig, priceAlertReducer);
const persistedTokenApprovalReducer = persistReducer(
  tokenApprovalPersistConfig,
  tokenApprovalReducer
);

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
    browser: persistedBrowserReducer,
    walletConnect: persistedWalletConnectReducer,
    notification: persistedNotificationReducer,
    hardwareWallet: persistedHardwareWalletReducer,
    priceAlert: persistedPriceAlertReducer,
    tokenApproval: persistedTokenApprovalReducer,
    simulation: simulationReducer, // Not persisted - transient state
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
