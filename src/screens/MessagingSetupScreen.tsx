/**
 * MessagingSetupScreen
 * Screen for setting up end-to-end encrypted messaging
 * Features: generate messaging keys, show identity, share pre-key bundle
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { useDeyondCrypt } from '../hooks';
import { useAppSelector } from '../store/hooks';
import { SecureStorageService } from '../services/wallet/SecureStorageService';
import i18n from '../i18n';
import { logger } from '../utils';
import * as Clipboard from 'expo-clipboard';

type MessagingSetupScreenProps = NativeStackScreenProps<RootStackParamList, 'MessagingSetup'>;

const screenLogger = logger.child({ screen: 'MessagingSetup' });

export const MessagingSetupScreen: React.FC<MessagingSetupScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing } = theme;

  const wallet = useAppSelector(state => state.wallet);
  const {
    isLoading: hookLoading,
    hasIdentity,
    myAddress,
    setupMessaging,
    getMyPreKeyBundle,
  } = useDeyondCrypt();

  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupComplete, setSetupComplete] = useState(hasIdentity);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Setup messaging keys
  const handleSetup = useCallback(async () => {
    if (!wallet?.currentWallet?.address) {
      setError(i18n.t('messagingSetup.errors.noWallet'));
      return;
    }

    setIsSettingUp(true);
    setError(null);

    try {
      screenLogger.info('Setting up messaging keys...');

      // Get private key from secure storage
      const secureStorage = new SecureStorageService();
      const privateKey = await secureStorage.getPrivateKey(wallet.currentWallet.address);

      if (!privateKey) {
        setError(i18n.t('messagingSetup.errors.noWallet'));
        return;
      }

      // Convert hex private key to Uint8Array
      const privateKeyHex = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
      const privateKeyBytes = new Uint8Array(
        privateKeyHex.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []
      );

      await setupMessaging(privateKeyBytes, 'evm');

      setSetupComplete(true);
      screenLogger.info('Messaging setup complete');
    } catch (err) {
      screenLogger.error('Failed to setup messaging', err as Error);
      setError(i18n.t('messagingSetup.errors.setupFailed'));
    } finally {
      setIsSettingUp(false);
    }
  }, [wallet, setupMessaging]);

  // Copy address to clipboard
  const handleCopyAddress = useCallback(async () => {
    if (myAddress) {
      await Clipboard.setStringAsync(myAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [myAddress]);

  // Share pre-key bundle via QR
  const handleShareKeys = useCallback(async () => {
    try {
      const bundle = await getMyPreKeyBundle();
      if (bundle) {
        navigation.navigate('SharePreKeyBundle', { bundle });
      }
    } catch (err) {
      screenLogger.error('Failed to get pre-key bundle', err as Error);
      Alert.alert(i18n.t('common.error'), i18n.t('messagingSetup.errors.shareFailed'));
    }
  }, [getMyPreKeyBundle, navigation]);

  // Continue to chat
  const handleContinue = useCallback(() => {
    navigation.replace('ChatHome');
  }, [navigation]);

  // Render setup view
  const renderSetupView = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroIcon}>🔐</Text>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {i18n.t('messagingSetup.title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          {i18n.t('messagingSetup.subtitle')}
        </Text>
      </View>

      {/* Features */}
      <View style={styles.featuresSection}>
        <FeatureItem
          icon="🔒"
          title={i18n.t('messagingSetup.features.encryption.title')}
          description={i18n.t('messagingSetup.features.encryption.description')}
          colors={colors}
        />
        <FeatureItem
          icon="🔑"
          title={i18n.t('messagingSetup.features.keys.title')}
          description={i18n.t('messagingSetup.features.keys.description')}
          colors={colors}
        />
        <FeatureItem
          icon="👥"
          title={i18n.t('messagingSetup.features.contacts.title')}
          description={i18n.t('messagingSetup.features.contacts.description')}
          colors={colors}
        />
      </View>

      {/* Error Message */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      {/* Setup Button */}
      <View style={styles.buttonContainer}>
        <Button
          testID="setup-button"
          onPress={handleSetup}
          loading={isSettingUp}
          disabled={isSettingUp || hookLoading}
        >
          {i18n.t('messagingSetup.setupButton')}
        </Button>
        <TouchableOpacity style={styles.skipButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.skipText, { color: colors.text.secondary }]}>
            {i18n.t('messagingSetup.skipButton')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Render complete view
  const renderCompleteView = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Success Hero */}
      <View style={styles.heroSection}>
        <Text style={styles.heroIcon}>✅</Text>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {i18n.t('messagingSetup.complete.title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          {i18n.t('messagingSetup.complete.subtitle')}
        </Text>
      </View>

      {/* Identity Card */}
      <Card style={styles.identityCard}>
        <Text style={[styles.identityLabel, { color: colors.text.secondary }]}>
          {i18n.t('messagingSetup.complete.yourIdentity')}
        </Text>
        <View style={styles.addressContainer}>
          <Text
            style={[styles.addressText, { color: colors.text.primary }]}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {myAddress}
          </Text>
          <TouchableOpacity
            testID="copy-address-button"
            onPress={handleCopyAddress}
            style={[styles.copyButton, { backgroundColor: colors.primary + '20' }]}
          >
            <Text style={[styles.copyButtonText, { color: colors.primary }]}>
              {copied ? i18n.t('common.copied') : i18n.t('common.copy')}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.encryptionBadge, { backgroundColor: colors.success + '20' }]}>
          <Text style={[styles.encryptionBadgeText, { color: colors.success }]}>
            🔒 {i18n.t('messagingSetup.complete.encrypted')}
          </Text>
        </View>
      </Card>

      {/* Next Steps */}
      <View style={styles.nextStepsSection}>
        <Text style={[styles.nextStepsTitle, { color: colors.text.primary }]}>
          {i18n.t('messagingSetup.complete.nextSteps')}
        </Text>
        <NextStepItem number="1" text={i18n.t('messagingSetup.complete.step1')} colors={colors} />
        <NextStepItem number="2" text={i18n.t('messagingSetup.complete.step2')} colors={colors} />
        <NextStepItem number="3" text={i18n.t('messagingSetup.complete.step3')} colors={colors} />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button testID="continue-button" onPress={handleContinue}>
          {i18n.t('messagingSetup.complete.continueButton')}
        </Button>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="back-button"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {setupComplete ? renderCompleteView() : renderSetupView()}
    </SafeAreaView>
  );
};

// Feature Item Component
interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
  colors: any;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description, colors }) => (
  <View style={styles.featureItem}>
    <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
      <Text style={styles.featureIconText}>{icon}</Text>
    </View>
    <View style={styles.featureContent}>
      <Text style={[styles.featureTitle, { color: colors.text.primary }]}>{title}</Text>
      <Text style={[styles.featureDescription, { color: colors.text.secondary }]}>
        {description}
      </Text>
    </View>
  </View>
);

// Next Step Item Component
interface NextStepItemProps {
  number: string;
  text: string;
  colors: any;
}

const NextStepItem: React.FC<NextStepItemProps> = ({ number, text, colors }) => (
  <View style={styles.nextStepItem}>
    <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
      <Text style={styles.stepNumberText}>{number}</Text>
    </View>
    <Text style={[styles.stepText, { color: colors.text.secondary }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  addressContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  addressText: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
  },
  buttonContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  copyButton: {
    borderRadius: 8,
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  encryptionBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  encryptionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  featureIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    marginRight: 12,
    width: 44,
  },
  featureIconText: {
    fontSize: 20,
  },
  featureItem: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  featuresSection: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    padding: 8,
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 32,
  },
  identityCard: {
    marginHorizontal: 16,
    padding: 16,
  },
  identityLabel: {
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  nextStepItem: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  nextStepsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  skipText: {
    fontSize: 14,
  },
  stepNumber: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    marginRight: 12,
    width: 24,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
});

export default MessagingSetupScreen;
