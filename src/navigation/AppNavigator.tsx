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
  nftTransitions,
  swapTransitions,
  chatTransitions,
  walletActionTransitions,
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
import { TokenListScreen } from '../screens/TokenListScreen';
import { NFTGalleryScreen } from '../screens/NFTGalleryScreen';
import { NFTDetailScreen } from '../screens/NFTDetailScreen';
import { DAppBrowserScreen } from '../screens/DAppBrowserScreen';
import { ExportWalletScreen } from '../screens/ExportWalletScreen';
import { WalletConnectScanScreen } from '../screens/WalletConnectScanScreen';
import { WalletConnectSessionsScreen } from '../screens/WalletConnectSessionsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SecuritySettingsScreen } from '../screens/SecuritySettingsScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import { TransactionHistoryScreen } from '../screens/TransactionHistoryScreen';
import { TransactionPreviewScreen } from '../screens/TransactionPreviewScreen';
import { TransactionStatusScreen } from '../screens/TransactionStatusScreen';
import { ChatHomeScreen } from '../screens/ChatHomeScreen';
import { DeviceDiscoveryScreen } from '../screens/DeviceDiscoveryScreen';
import { DeviceConnectionScreen } from '../screens/DeviceConnectionScreen';
import { ChatConversationScreen } from '../screens/ChatConversationScreen';
import { MessagingSetupScreen } from '../screens/MessagingSetupScreen';
import { SharePreKeyBundleScreen } from '../screens/SharePreKeyBundleScreen';
import { ContactDetailScreen } from '../screens/ContactDetailScreen';
import { CreateGroupScreen } from '../screens/CreateGroupScreen';
import { GroupChatScreen } from '../screens/GroupChatScreen';
import { GroupInfoScreen } from '../screens/GroupInfoScreen';
import { ScanPreKeyBundleScreen } from '../screens/ScanPreKeyBundleScreen';
import { HardwareWalletScreen } from '../screens/HardwareWalletScreen';
import { PriceAlertScreen } from '../screens/PriceAlertScreen';
import { TokenApprovalScreen } from '../screens/TokenApprovalScreen';
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
  TokenList: undefined;
  NFTGallery: { walletAddress?: string };
  NFTDetail: { nft: NFT };
  DAppBrowser: { url?: string; address?: string };
  ExportWallet: undefined;
  WalletConnectScan: { onScan?: (uri: string) => void };
  WalletConnectSessions: undefined;
  Settings: undefined;
  SecuritySettings: undefined;
  NotificationSettings: undefined;
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
  MessagingSetup: undefined;
  SharePreKeyBundle: { bundle: any };
  ContactDetail: {
    contactAddress: string;
    contactName?: string;
  };
  CreateGroup: undefined;
  GroupChat: {
    groupId: string;
    groupName: string;
  };
  GroupInfo: {
    groupId: string;
  };
  ScanPreKeyBundle: undefined;
  HardwareWallet: undefined;
  PriceAlert: undefined;
  TokenApproval: undefined;
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
      <Stack.Screen name="Home" component={HomeScreen} options={fade} />
      <Stack.Screen
        name="Send"
        component={SendScreen as any}
        options={walletActionTransitions.send}
      />
      <Stack.Screen
        name="Receive"
        component={ReceiveScreen}
        options={walletActionTransitions.receive}
      />
      <Stack.Screen name="Swap" component={SwapScreen as any} options={swapTransitions.main} />
      <Stack.Screen
        name="SwapHistory"
        component={SwapHistoryScreen}
        options={swapTransitions.history}
      />
      <Stack.Screen
        name="TokenDetails"
        component={TokenDetailsScreen as any}
        options={walletActionTransitions.tokenDetails}
      />
      <Stack.Screen name="TokenList" component={TokenListScreen as any} options={slideFromRight} />
      <Stack.Screen
        name="NFTGallery"
        component={NFTGalleryScreen as any}
        options={nftTransitions.gallery}
      />
      <Stack.Screen
        name="NFTDetail"
        component={NFTDetailScreen as any}
        options={nftTransitions.detail}
      />
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
      <Stack.Screen
        name="WalletConnectSessions"
        component={WalletConnectSessionsScreen as any}
        options={slideFromRight}
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
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen as any}
        options={settingsTransitions.detail}
      />

      {/* Chat/BLE */}
      <Stack.Screen name="ChatHome" component={ChatHomeScreen} options={chatTransitions.home} />
      <Stack.Screen
        name="DeviceDiscovery"
        component={DeviceDiscoveryScreen}
        options={chatTransitions.discovery}
      />
      <Stack.Screen
        name="DeviceConnection"
        component={DeviceConnectionScreen}
        options={chatTransitions.connection}
      />
      <Stack.Screen
        name="ChatConversation"
        component={ChatConversationScreen}
        options={chatTransitions.conversation}
      />
      <Stack.Screen
        name="MessagingSetup"
        component={MessagingSetupScreen}
        options={chatTransitions.discovery}
      />
      <Stack.Screen
        name="SharePreKeyBundle"
        component={SharePreKeyBundleScreen}
        options={slideFromBottom}
      />
      <Stack.Screen name="ContactDetail" component={ContactDetailScreen} options={slideFromRight} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={slideFromRight} />
      <Stack.Screen
        name="GroupChat"
        component={GroupChatScreen}
        options={chatTransitions.conversation}
      />
      <Stack.Screen name="GroupInfo" component={GroupInfoScreen} options={slideFromRight} />
      <Stack.Screen
        name="ScanPreKeyBundle"
        component={ScanPreKeyBundleScreen}
        options={slideFromBottom}
      />

      {/* Hardware Wallet */}
      <Stack.Screen
        name="HardwareWallet"
        component={HardwareWalletScreen}
        options={slideFromRight}
      />

      {/* Price Alerts */}
      <Stack.Screen name="PriceAlert" component={PriceAlertScreen} options={slideFromRight} />

      {/* Token Approvals */}
      <Stack.Screen name="TokenApproval" component={TokenApprovalScreen} options={slideFromRight} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
