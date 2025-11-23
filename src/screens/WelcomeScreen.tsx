/**
 * Welcome Screen
 * First screen shown to new users
 * Allows users to create a new wallet or import existing one
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
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
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>Welcome to</Text>
          <Text style={[styles.appName, { color: theme.colors.text.primary }]}>Crypto Wallet</Text>
        </View>

        {/* Description Section */}
        <View style={styles.descriptionContainer}>
          <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
            Secure, decentralized, and easy to use wallet for managing your cryptocurrency assets
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
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  button: {
    marginBottom: 16,
  },
  buttonsContainer: {
    marginBottom: 32,
    marginTop: 'auto',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  descriptionContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  footerContainer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoPlaceholder: {
    alignItems: 'center',
    borderRadius: 50,
    height: 100,
    justifyContent: 'center',
    width: 100,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
  },
  safeArea: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '400',
    marginBottom: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
});

export default WelcomeScreen;
