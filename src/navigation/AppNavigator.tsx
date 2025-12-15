/**
 * AppNavigator
 * Main app navigation stack
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import {
  slideFromRight,
  slideFromBottom,
  fade,
  fadeFromCenter,
  transactionTransitions,
  authTransitions,
  settingsTransitions,
} from './transitions';

// Import screens
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { CreatePasswordScreen } from '../screens/CreatePasswordScreen';
import { DisplayMnemonicScreen } from '../screens/DisplayMnemonicScreen';
import { VerifyMnemonicScreen } from '../screens/VerifyMnemonicScreen';
import { ImportWalletScreen } from '../screens/ImportWalletScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { BiometricSetupScreen } from '../screens/BiometricSetupScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SendScreen } from '../screens/SendScreen';
import { ReceiveScreen } from '../screens/ReceiveScreen';
import { SwapScreen } from '../screens/SwapScreen';
import { SwapHistoryScreen } from '../screens/SwapHistoryScreen';
import { TokenDetailsScreen } from '../screens/TokenDetailsScreen';
import { NFTGalleryScreen } from '../screens/NFTGalleryScreen';
import { NFTDetailScreen } from '../screens/NFTDetailScreen';
import { DAppBrowserScreen } from '../screens/DAppBrowserScreen';
import { ExportWalletScreen } from '../screens/ExportWalletScreen';
import { WalletConnectScanScreen } from '../screens/WalletConnectScanScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SecuritySettingsScreen } from '../screens/SecuritySettingsScreen';
import { TransactionHistoryScreen } from '../screens/TransactionHistoryScreen';
import { TransactionPreviewScreen } from '../screens/TransactionPreviewScreen';
import { TransactionStatusScreen } from '../screens/TransactionStatusScreen';
import { ChatHomeScreen } from '../screens/ChatHomeScreen';
import { DeviceDiscoveryScreen } from '../screens/DeviceDiscoveryScreen';
import { DeviceConnectionScreen } from '../screens/DeviceConnectionScreen';
import { ChatConversationScreen } from '../screens/ChatConversationScreen';
import { NFT } from '../types/nft';

// Define route params
export type RootStackParamList = {
  Welcome: undefined;
  CreatePassword: undefined;
  DisplayMnemonic: { password: string };
  VerifyMnemonic: { mnemonic: string[]; password: string };
  ImportWallet: undefined;
  Auth: undefined;
  BiometricSetup: { password: string; mnemonic?: string[] };
  Home: undefined;
  Send: { tokenAddress?: string };
  Receive: undefined;
  Swap: undefined;
  SwapHistory: undefined;
  TokenDetails: { symbol: string };
  NFTGallery: { walletAddress?: string };
  NFTDetail: { nft: NFT };
  DAppBrowser: { url?: string; address?: string };
  ExportWallet: undefined;
  WalletConnectScan: { onScan?: (uri: string) => void };
  Settings: undefined;
  SecuritySettings: undefined;
  TransactionHistory: undefined;
  TransactionPreview: {
    to: string;
    amount: string;
    tokenAddress?: string;
  };
  TransactionStatus: {
    txHash: string;
    status: 'pending' | 'confirmed' | 'failed';
  };
  ChatHome: undefined;
  DeviceDiscovery: undefined;
  DeviceConnection: {
    device: {
      id: string;
      name: string;
      rssi: number;
      address: string;
    };
  };
  ChatConversation: {
    sessionId: string;
    peerName: string;
    peerAddress: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  initialRouteName?: keyof RootStackParamList;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({ initialRouteName = 'Welcome' }) => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        ...slideFromRight,
      }}
    >
      {/* Auth Flow */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={authTransitions.welcome} />
      <Stack.Screen
        name="CreatePassword"
        component={CreatePasswordScreen}
        options={authTransitions.login}
      />
      <Stack.Screen
        name="DisplayMnemonic"
        component={DisplayMnemonicScreen}
        options={authTransitions.login}
      />
      <Stack.Screen
        name="VerifyMnemonic"
        component={VerifyMnemonicScreen}
        options={authTransitions.login}
      />
      <Stack.Screen
        name="ImportWallet"
        component={ImportWalletScreen}
        options={authTransitions.login}
      />
      <Stack.Screen name="Auth" component={AuthScreen} options={authTransitions.biometric} />
      <Stack.Screen
        name="BiometricSetup"
        component={BiometricSetupScreen}
        options={authTransitions.biometric}
      />

      {/* Main Screens */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Send" component={SendScreen as any} />
      <Stack.Screen name="Receive" component={ReceiveScreen} />
      <Stack.Screen name="Swap" component={SwapScreen as any} />
      <Stack.Screen name="SwapHistory" component={SwapHistoryScreen} />
      <Stack.Screen name="TokenDetails" component={TokenDetailsScreen as any} />
      <Stack.Screen name="NFTGallery" component={NFTGalleryScreen as any} />
      <Stack.Screen name="NFTDetail" component={NFTDetailScreen as any} />
      <Stack.Screen
        name="DAppBrowser"
        component={DAppBrowserScreen as any}
        options={slideFromBottom}
      />
      <Stack.Screen name="ExportWallet" component={ExportWalletScreen as any} />
      <Stack.Screen
        name="WalletConnectScan"
        component={WalletConnectScanScreen as any}
        options={slideFromBottom}
      />
      <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />

      {/* Transaction Flow */}
      <Stack.Screen
        name="TransactionPreview"
        component={TransactionPreviewScreen as any}
        options={transactionTransitions.preview}
      />
      <Stack.Screen
        name="TransactionStatus"
        component={TransactionStatusScreen as any}
        options={transactionTransitions.status}
      />

      {/* Settings */}
      <Stack.Screen name="Settings" component={SettingsScreen} options={settingsTransitions.main} />
      <Stack.Screen
        name="SecuritySettings"
        component={SecuritySettingsScreen}
        options={settingsTransitions.detail}
      />

      {/* Chat/BLE */}
      <Stack.Screen name="ChatHome" component={ChatHomeScreen} options={slideFromRight} />
      <Stack.Screen
        name="DeviceDiscovery"
        component={DeviceDiscoveryScreen}
        options={slideFromRight}
      />
      <Stack.Screen name="DeviceConnection" component={DeviceConnectionScreen} options={fade} />
      <Stack.Screen
        name="ChatConversation"
        component={ChatConversationScreen}
        options={slideFromRight}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
