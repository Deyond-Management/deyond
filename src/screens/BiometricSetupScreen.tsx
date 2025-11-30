/**
 * BiometricSetupScreen
 * Screen for setting up biometric authentication (Face ID / Touch ID)
 * Features: enable biometric, skip option, password fallback info
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setBiometricEnabled,
  setOnboardingComplete,
  createWallet,
  selectOnboardingLoading,
  selectOnboardingError,
} from '../store/slices/onboardingSlice';
import { setWallet, unlockWallet } from '../store/slices/walletSlice';
import SecurityService from '../services/security/SecurityService';
import i18n from '../i18n';
import { logger } from '../utils';

type BiometricSetupScreenProps = NativeStackScreenProps<RootStackParamList, 'BiometricSetup'>;

const screenLogger = logger.child({ screen: 'BiometricSetup' });

export const BiometricSetupScreen: React.FC<BiometricSetupScreenProps> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const dispatch = useAppDispatch();
  const reduxLoading = useAppSelector(selectOnboardingLoading);
  const reduxError = useAppSelector(selectOnboardingError);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [securityService] = useState(() => new SecurityService());
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('biometric');

  // Check biometric availability on mount
  useEffect(() => {
    const checkBiometrics = async () => {
      const available = await securityService.isBiometricsAvailable();
      setBiometricAvailable(available);

      if (available) {
        const type = await securityService.getBiometricsType();
        if (type === 'face') {
          setBiometricType('Face ID');
        } else if (type === 'fingerprint') {
          setBiometricType('Touch ID');
        } else {
          setBiometricType('biometric');
        }
      }
    };

    checkBiometrics();
  }, [securityService]);

  // Handle enable biometric
  const handleEnableBiometric = async () => {
    if (!biometricAvailable) {
      setError('Biometric authentication is not available on this device');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // First, authenticate with biometrics to ensure it works
      await securityService.enableBiometrics();
      const authResult = await securityService.authenticateWithBiometrics();

      if (!authResult.success) {
        setError(authResult.error || 'Biometric authentication failed');
        setIsLoading(false);
        return;
      }

      // Set biometric preference in Redux
      dispatch(setBiometricEnabled(true));

      // Create wallet if mnemonic is provided
      if (route.params.mnemonic && route.params.password) {
        await dispatch(
          createWallet({
            password: route.params.password,
            mnemonic: route.params.mnemonic,
          })
        ).unwrap();
      }

      // Mark onboarding as complete
      dispatch(setOnboardingComplete(true));
      dispatch(unlockWallet());

      // Navigate to Home
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (err) {
      screenLogger.error('Biometric setup failed', err as Error);
      setError(i18n.t('biometricSetup.errors.enableFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle skip
  const handleSkip = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Set biometric disabled
      dispatch(setBiometricEnabled(false));

      // Create wallet if mnemonic is provided
      if (route.params.mnemonic && route.params.password) {
        await dispatch(
          createWallet({
            password: route.params.password,
            mnemonic: route.params.mnemonic,
          })
        ).unwrap();
      }

      // Mark onboarding as complete
      dispatch(setOnboardingComplete(true));
      dispatch(unlockWallet());

      // Navigate to Home without biometric
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (err) {
      screenLogger.error('Failed to create wallet', err as Error);
      setError(i18n.t('biometricSetup.errors.walletCreationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.iconText} testID="biometric-icon">
            🔐
          </Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text.primary }]}>Enable {biometricType}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Use {biometricType} to unlock your wallet quickly and securely
          </Text>
        </View>

        {/* Benefits Card */}
        <Card style={[styles.benefitsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.benefitsTitle, { color: colors.text.primary }]}>
            {i18n.t('biometricSetup.whyUse')}
          </Text>

          <View style={styles.benefitItem}>
            <Text style={[styles.benefitIcon, { color: colors.primary }]}>⚡</Text>
            <View style={styles.benefitContent}>
              <Text style={[styles.benefitLabel, { color: colors.text.primary }]}>
                {i18n.t('biometricSetup.benefits.quickAccess.title')}
              </Text>
              <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                {i18n.t('biometricSetup.benefits.quickAccess.description')}
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={[styles.benefitIcon, { color: colors.primary }]}>🔒</Text>
            <View style={styles.benefitContent}>
              <Text style={[styles.benefitLabel, { color: colors.text.primary }]}>
                {i18n.t('biometricSetup.benefits.moreSecure.title')}
              </Text>
              <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                {i18n.t('biometricSetup.benefits.moreSecure.description')}
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={[styles.benefitIcon, { color: colors.primary }]}>✨</Text>
            <View style={styles.benefitContent}>
              <Text style={[styles.benefitLabel, { color: colors.text.primary }]}>
                {i18n.t('biometricSetup.benefits.convenient.title')}
              </Text>
              <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                {i18n.t('biometricSetup.benefits.convenient.description')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Password Fallback Info */}
        <Card style={[styles.infoCard, { backgroundColor: colors.info + '15' }]}>
          <Text style={[styles.infoIcon, { color: colors.info }]}>ℹ️</Text>
          <Text style={[styles.infoText, { color: colors.text.primary }]}>
            {i18n.t('biometricSetup.fallbackInfo')}
          </Text>
        </Card>

        {/* Error Message */}
        {error.length > 0 && (
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        )}

        {/* Enable Button */}
        <Button
          onPress={handleEnableBiometric}
          loading={isLoading}
          disabled={!biometricAvailable}
          style={styles.enableButton}
          testID="enable-biometric-button"
        >
          {biometricAvailable ? `Enable ${biometricType}` : 'Biometric not available'}
        </Button>

        {/* Skip Button */}
        <Button onPress={handleSkip} variant="text" style={styles.skipButton} testID="skip-button">
          {i18n.t('biometricSetup.skipButton')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  benefitContent: {
    flex: 1,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  benefitLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 14,
    lineHeight: 20,
  },
  benefitsCard: {
    marginBottom: 16,
    padding: 20,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  enableButton: {
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 64,
  },
  infoCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    padding: 16,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  skipButton: {
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
});
