/**
 * SharePreKeyBundleScreen
 * Screen for sharing pre-key bundle via QR code
 * Allows other users to establish encrypted sessions
 */

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import i18n from '../i18n';
import { logger } from '../utils';
import * as Clipboard from 'expo-clipboard';

type SharePreKeyBundleScreenProps = NativeStackScreenProps<RootStackParamList, 'SharePreKeyBundle'>;

const screenLogger = logger.child({ screen: 'SharePreKeyBundle' });

export const SharePreKeyBundleScreen: React.FC<SharePreKeyBundleScreenProps> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const { bundle } = route.params;

  const [copied, setCopied] = useState(false);

  // Serialize bundle to base64 for sharing
  const bundleString = JSON.stringify(bundle);
  const bundleBase64 = Buffer.from(bundleString).toString('base64');

  // Copy bundle to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(bundleBase64);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      screenLogger.error('Failed to copy bundle', err as Error);
    }
  }, [bundleBase64]);

  // Share bundle
  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: bundleBase64,
        title: i18n.t('sharePreKeyBundle.shareTitle'),
      });
    } catch (err) {
      screenLogger.error('Failed to share bundle', err as Error);
      Alert.alert(i18n.t('common.error'), i18n.t('sharePreKeyBundle.errors.shareFailed'));
    }
  }, [bundleBase64]);

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
          {i18n.t('sharePreKeyBundle.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroIcon}>🔑</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {i18n.t('sharePreKeyBundle.subtitle')}
          </Text>
        </View>

        {/* QR Code Placeholder */}
        <Card style={styles.qrCard}>
          <View
            testID="qr-code-container"
            style={[styles.qrContainer, { backgroundColor: colors.surface }]}
          >
            <Text style={styles.qrPlaceholder}>QR</Text>
            <Text style={[styles.qrNote, { color: colors.text.secondary }]}>
              {i18n.t('sharePreKeyBundle.qrNote')}
            </Text>
          </View>
        </Card>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={[styles.instructionsTitle, { color: colors.text.primary }]}>
            {i18n.t('sharePreKeyBundle.howToUse')}
          </Text>
          <InstructionItem number="1" text={i18n.t('sharePreKeyBundle.step1')} colors={colors} />
          <InstructionItem number="2" text={i18n.t('sharePreKeyBundle.step2')} colors={colors} />
          <InstructionItem number="3" text={i18n.t('sharePreKeyBundle.step3')} colors={colors} />
        </View>

        {/* Security Notice */}
        <View style={[styles.securityNotice, { backgroundColor: colors.warning + '20' }]}>
          <Text style={[styles.securityIcon]}>⚠️</Text>
          <Text style={[styles.securityText, { color: colors.text.secondary }]}>
            {i18n.t('sharePreKeyBundle.securityNotice')}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button testID="copy-button" onPress={handleCopy} variant="outlined">
            {copied ? i18n.t('common.copied') : i18n.t('sharePreKeyBundle.copyButton')}
          </Button>
          <View style={styles.buttonSpacer} />
          <Button testID="share-button" onPress={handleShare}>
            {i18n.t('sharePreKeyBundle.shareButton')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Instruction Item Component
interface InstructionItemProps {
  number: string;
  text: string;
  colors: any;
}

const InstructionItem: React.FC<InstructionItemProps> = ({ number, text, colors }) => (
  <View style={styles.instructionItem}>
    <View style={[styles.instructionNumber, { backgroundColor: colors.primary }]}>
      <Text style={styles.instructionNumberText}>{number}</Text>
    </View>
    <Text style={[styles.instructionText, { color: colors.text.secondary }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
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
  buttonSpacer: {
    height: 12,
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
  heroIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  instructionItem: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  instructionNumber: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    marginRight: 12,
    width: 24,
  },
  instructionNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  instructionsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  qrCard: {
    marginHorizontal: 16,
    padding: 24,
  },
  qrContainer: {
    alignItems: 'center',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    width: '100%',
  },
  qrNote: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  qrPlaceholder: {
    fontSize: 48,
    fontWeight: 'bold',
    opacity: 0.3,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  securityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  securityNotice: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});

export default SharePreKeyBundleScreen;
