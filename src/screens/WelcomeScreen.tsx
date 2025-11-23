/**
 * Welcome Screen
 * First screen shown to new users
 * Allows users to create a new wallet or import existing one
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/atoms/Button';

interface WelcomeScreenProps {
  navigation: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();

  const handleCreateWallet = () => {
    navigation.navigate('CreatePassword');
  };

  const handleImportWallet = () => {
    navigation.navigate('ImportWallet');
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.container} testID="welcome-container">
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View
            style={[
              styles.logoPlaceholder,
              { backgroundColor: theme.isDark ? '#2196F3' : '#1976D2' },
            ]}
            testID="app-logo"
          >
            <Text style={styles.logoText}>₿</Text>
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Welcome to
          </Text>
          <Text
            style={[styles.appName, { color: theme.colors.text.primary }]}
          >
            Crypto Wallet
          </Text>
        </View>

        {/* Description Section */}
        <View style={styles.descriptionContainer}>
          <Text
            style={[styles.description, { color: theme.colors.text.secondary }]}
          >
            Secure, decentralized, and easy to use wallet for managing your
            cryptocurrency assets
          </Text>
        </View>

        {/* Buttons Section */}
        <View style={styles.buttonsContainer}>
          <Button
            onPress={handleCreateWallet}
            variant="primary"
            size="large"
            fullWidth
            accessibilityLabel="Create New Wallet"
            style={styles.button}
          >
            Create New Wallet
          </Button>

          <Button
            onPress={handleImportWallet}
            variant="outlined"
            size="large"
            fullWidth
            accessibilityLabel="Import Existing Wallet"
            style={styles.button}
          >
            Import Existing Wallet
          </Button>
        </View>

        {/* Footer Section */}
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: theme.colors.text.hint }]}>
            Your keys, your crypto
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '400',
    marginBottom: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  descriptionContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsContainer: {
    marginTop: 'auto',
    marginBottom: 32,
  },
  button: {
    marginBottom: 16,
  },
  footerContainer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
});

export default WelcomeScreen;
