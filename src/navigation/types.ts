/**
 * Navigation Types
 * Type definitions for React Navigation
 */

import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

/**
 * Root Stack Navigator
 * Handles onboarding and authentication flows
 */
export type RootStackParamList = {
  Welcome: undefined;
  CreatePassword: undefined;
  DisplayMnemonic: { mnemonic: string };
  VerifyMnemonic: { mnemonic: string };
  ImportWallet: undefined;
  BiometricSetup: undefined;
  Main: undefined;
};

/**
 * Main Tab Navigator
 * Bottom tabs for main app sections
 */
export type MainTabParamList = {
  Home: undefined;
  Chat: undefined;
  Settings: undefined;
};

/**
 * Home Stack Navigator
 * Screens within the Home tab
 */
export type HomeStackParamList = {
  HomeScreen: undefined;
  SendTransaction: undefined;
  ReceiveScreen: undefined;
  TransactionDetail: { transactionId: string };
  QRScanner: { onScan: (address: string) => void };
};

/**
 * Chat Stack Navigator
 * Screens within the Chat tab
 */
export type ChatStackParamList = {
  ChatHome: undefined;
  DeviceDiscovery: undefined;
  ChatConversation: { sessionId: string };
  SessionInfo: { sessionId: string };
};

/**
 * Settings Stack Navigator
 * Screens within the Settings tab
 */
export type SettingsStackParamList = {
  SettingsHome: undefined;
  SecuritySettings: undefined;
  NetworkSettings: undefined;
  AddNetwork: undefined;
  EditNetwork: { networkId: string };
  DisplaySettings: undefined;
  AccountManagement: undefined;
  AccountDetail: { accountIndex: number };
  About: undefined;
};

/**
 * Navigation Props for Screens
 */
export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;
export type HomeStackNavigationProp = StackNavigationProp<HomeStackParamList>;
export type ChatStackNavigationProp = StackNavigationProp<ChatStackParamList>;
export type SettingsStackNavigationProp = StackNavigationProp<SettingsStackParamList>;

/**
 * Route Props for Screens
 */
export type DisplayMnemonicRouteProp = RouteProp<RootStackParamList, 'DisplayMnemonic'>;
export type VerifyMnemonicRouteProp = RouteProp<RootStackParamList, 'VerifyMnemonic'>;
export type TransactionDetailRouteProp = RouteProp<HomeStackParamList, 'TransactionDetail'>;
export type QRScannerRouteProp = RouteProp<HomeStackParamList, 'QRScanner'>;
export type ChatConversationRouteProp = RouteProp<ChatStackParamList, 'ChatConversation'>;
export type SessionInfoRouteProp = RouteProp<ChatStackParamList, 'SessionInfo'>;
export type EditNetworkRouteProp = RouteProp<SettingsStackParamList, 'EditNetwork'>;
export type AccountDetailRouteProp = RouteProp<SettingsStackParamList, 'AccountDetail'>;
