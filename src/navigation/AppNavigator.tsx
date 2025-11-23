/**
 * AppNavigator
 * Main app navigation stack
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';

// Import screens
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SendScreen } from '../screens/SendScreen';
import { ReceiveScreen } from '../screens/ReceiveScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SecuritySettingsScreen } from '../screens/SecuritySettingsScreen';
import { TransactionHistoryScreen } from '../screens/TransactionHistoryScreen';
import { TransactionPreviewScreen } from '../screens/TransactionPreviewScreen';
import { TransactionStatusScreen } from '../screens/TransactionStatusScreen';
import { ChatHomeScreen } from '../screens/ChatHomeScreen';
import { DeviceDiscoveryScreen } from '../screens/DeviceDiscoveryScreen';
import { DeviceConnectionScreen } from '../screens/DeviceConnectionScreen';
import { ChatConversationScreen } from '../screens/ChatConversationScreen';

// Define route params
export type RootStackParamList = {
  Welcome: undefined;
  Home: undefined;
  Send: { tokenAddress?: string };
  Receive: undefined;
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
        animation: 'slide_from_right',
      }}
    >
      {/* Auth Flow */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />

      {/* Main Screens */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Send" component={SendScreen} />
      <Stack.Screen name="Receive" component={ReceiveScreen} />
      <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />

      {/* Transaction Flow */}
      <Stack.Screen
        name="TransactionPreview"
        component={TransactionPreviewScreen as any}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="TransactionStatus"
        component={TransactionStatusScreen as any}
        options={{ gestureEnabled: false }}
      />

      {/* Settings */}
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />

      {/* Chat/BLE */}
      <Stack.Screen name="ChatHome" component={ChatHomeScreen} />
      <Stack.Screen name="DeviceDiscovery" component={DeviceDiscoveryScreen} />
      <Stack.Screen
        name="DeviceConnection"
        component={DeviceConnectionScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="ChatConversation" component={ChatConversationScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
