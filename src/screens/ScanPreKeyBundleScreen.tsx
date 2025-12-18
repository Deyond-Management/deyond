/**
 * ScanPreKeyBundleScreen
 * Screen for scanning QR code to receive pre-key bundle from another user
 * Used to establish encrypted session with new contacts
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../contexts/ThemeContext';
import { useDeyondCrypt } from '../hooks';
import i18n from '../i18n';
import { logger } from '../utils';

type ScanPreKeyBundleScreenProps = NativeStackScreenProps<RootStackParamList, 'ScanPreKeyBundle'>;

const screenLogger = logger.child({ screen: 'ScanPreKeyBundle' });

// Note: This screen uses a placeholder for QR scanning
// In production, integrate with expo-camera or expo-barcode-scanner
export const ScanPreKeyBundleScreen: React.FC<ScanPreKeyBundleScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors } = theme;

  const { processPreKeyBundle, addContact } = useDeyondCrypt();

  const [isProcessing, setIsProcessing] = useState(false);
  const [scanned, setScanned] = useState(false);

  // Process scanned QR code data
  const handleBarCodeScanned = useCallback(
    async (data: string) => {
      if (scanned || isProcessing) return;

      setScanned(true);
      setIsProcessing(true);

      try {
        screenLogger.info('Processing scanned QR code...');

        // Decode base64 bundle
        const bundleString = Buffer.from(data, 'base64').toString('utf-8');
        const bundle = JSON.parse(bundleString);

        // Process the pre-key bundle
        const result = await processPreKeyBundle?.(bundle);

        if (result) {
          // Add as contact
          await addContact?.({
            address: bundle.address,
            chainType: bundle.chainType || 'evm',
            name: bundle.name,
            verified: true,
            addedAt: Date.now(),
          });

          screenLogger.info('Contact added successfully', { address: bundle.address });

          Alert.alert(
            i18n.t('scanPreKeyBundle.success.title'),
            i18n.t('scanPreKeyBundle.success.message', {
              name: bundle.name || bundle.address.slice(0, 8),
            }),
            [
              {
                text: i18n.t('scanPreKeyBundle.success.sendMessage'),
                onPress: () => {
                  navigation.replace('ChatConversation', {
                    sessionId: `dm:${bundle.address}`,
                    peerName: bundle.name || bundle.address.slice(0, 8) + '...',
                    peerAddress: bundle.address,
                  });
                },
              },
              {
                text: i18n.t('common.done'),
                onPress: () => navigation.goBack(),
              },
            ]
          );
        }
      } catch (err) {
        screenLogger.error('Failed to process QR code', err as Error);
        Alert.alert(i18n.t('common.error'), i18n.t('scanPreKeyBundle.errors.invalidQR'), [
          {
            text: i18n.t('scanPreKeyBundle.tryAgain'),
            onPress: () => setScanned(false),
          },
          {
            text: i18n.t('common.cancel'),
            onPress: () => navigation.goBack(),
          },
        ]);
      } finally {
        setIsProcessing(false);
      }
    },
    [scanned, isProcessing, processPreKeyBundle, addContact, navigation]
  );

  // Simulate scan for demo (in production, use camera)
  const handleDemoScan = useCallback(() => {
    // This is a demo function - in production, use expo-camera
    Alert.alert(i18n.t('scanPreKeyBundle.demo.title'), i18n.t('scanPreKeyBundle.demo.message'), [
      { text: i18n.t('common.ok') },
    ]);
  }, []);

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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          {i18n.t('scanPreKeyBundle.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Scanner Area */}
      <View style={styles.content}>
        <View
          testID="scanner-area"
          style={[styles.scannerArea, { backgroundColor: colors.surface }]}
        >
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.processingText, { color: colors.text.secondary }]}>
                {i18n.t('scanPreKeyBundle.processing')}
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.scannerFrame, { borderColor: colors.primary }]}>
                <Text style={styles.scannerIcon}>📷</Text>
              </View>
              <Text style={[styles.instruction, { color: colors.text.secondary }]}>
                {i18n.t('scanPreKeyBundle.instruction')}
              </Text>
            </>
          )}
        </View>

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: colors.primary + '10' }]}>
          <Text style={styles.infoIcon}>🔐</Text>
          <Text style={[styles.infoText, { color: colors.text.secondary }]}>
            {i18n.t('scanPreKeyBundle.info')}
          </Text>
        </View>

        {/* Demo Button (for testing without camera) */}
        <TouchableOpacity
          testID="demo-scan-button"
          style={[styles.demoButton, { borderColor: colors.border }]}
          onPress={handleDemoScan}
        >
          <Text style={[styles.demoButtonText, { color: colors.text.secondary }]}>
            {i18n.t('scanPreKeyBundle.demo.button')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  demoButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 24,
    padding: 12,
  },
  demoButtonText: {
    fontSize: 14,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoSection: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    marginTop: 24,
    padding: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  instruction: {
    fontSize: 15,
    marginTop: 24,
    textAlign: 'center',
  },
  processingContainer: {
    alignItems: 'center',
  },
  processingText: {
    fontSize: 15,
    marginTop: 16,
  },
  safeArea: {
    flex: 1,
  },
  scannerArea: {
    alignItems: 'center',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    width: '100%',
  },
  scannerFrame: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 3,
    height: 200,
    justifyContent: 'center',
    width: 200,
  },
  scannerIcon: {
    fontSize: 48,
    opacity: 0.5,
  },
});

export default ScanPreKeyBundleScreen;
