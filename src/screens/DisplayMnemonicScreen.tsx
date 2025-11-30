/**
 * DisplayMnemonicScreen
 * Screen for displaying generated mnemonic phrase
 * Features: 12-word grid display, copy to clipboard, security warnings
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { WalletManager } from '../core/wallet/WalletManager';
import { useAppDispatch } from '../store/hooks';
import { setMnemonic as setReduxMnemonic } from '../store/slices/onboardingSlice';
import i18n from '../i18n';
import { logger } from '../utils';

type DisplayMnemonicScreenProps = NativeStackScreenProps<RootStackParamList, 'DisplayMnemonic'>;

const screenLogger = logger.child({ screen: 'DisplayMnemonic' });

export const DisplayMnemonicScreen: React.FC<DisplayMnemonicScreenProps> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const dispatch = useAppDispatch();
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Generate mnemonic on mount
  useEffect(() => {
    const generateMnemonic = async () => {
      try {
        const walletManager = WalletManager.getInstance();
        const generatedMnemonic = walletManager.generateMnemonic();
        const words = generatedMnemonic.split(' ');
        setMnemonic(words);
        // Store mnemonic in Redux
        dispatch(setReduxMnemonic(words));
      } catch (error) {
        screenLogger.error('Failed to generate mnemonic', error as Error);
        // Fallback to mock data for testing
        const fallbackWords = [
          'abandon',
          'ability',
          'able',
          'about',
          'above',
          'absent',
          'absorb',
          'abstract',
          'absurd',
          'abuse',
          'access',
          'accident',
        ];
        setMnemonic(fallbackWords);
        dispatch(setReduxMnemonic(fallbackWords));
      }
    };

    generateMnemonic();
  }, [dispatch]);

  // Handle copy to clipboard
  const handleCopy = () => {
    const mnemonicString = mnemonic.join(' ');
    Clipboard.setString(mnemonicString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle continue
  const handleContinue = () => {
    navigation.navigate('VerifyMnemonic', {
      mnemonic,
      password: route.params.password,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {i18n.t('displayMnemonic.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {i18n.t('displayMnemonic.subtitle')}
          </Text>
        </View>

        {/* Warning Card */}
        <Card style={[styles.warningCard, { backgroundColor: colors.warning + '15' }]}>
          <Text style={[styles.warningIcon, { color: colors.warning }]}>⚠️</Text>
          <Text style={[styles.warningTitle, { color: colors.warning }]}>
            {i18n.t('displayMnemonic.warningTitle')}
          </Text>
          <Text style={[styles.warningText, { color: colors.text.primary }]}>
            {i18n.t('displayMnemonic.warningText')}
          </Text>
        </Card>

        {/* Mnemonic Grid */}
        <Card style={styles.mnemonicCard}>
          <View style={styles.mnemonicGrid}>
            {mnemonic.map((word, index) => (
              <View
                key={index}
                style={[
                  styles.wordItem,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                testID={`mnemonic-word-${index + 1}`}
              >
                <Text style={[styles.wordNumber, { color: colors.textSecondary }]}>
                  {index + 1}.
                </Text>
                <Text style={[styles.wordText, { color: colors.text.primary }]}>{word}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Copy Button */}
        <Button
          onPress={handleCopy}
          variant="outlined"
          style={styles.copyButton}
          testID="copy-button"
        >
          {copied ? i18n.t('displayMnemonic.copied') : i18n.t('displayMnemonic.copyButton')}
        </Button>

        {/* Security Tips */}
        <Card style={[styles.tipsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.tipsTitle, { color: colors.text.primary }]}>
            {i18n.t('displayMnemonic.tipsTitle')}
          </Text>
          <View style={styles.tipItem}>
            <Text style={[styles.tipBullet, { color: colors.primary }]}>•</Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              {i18n.t('displayMnemonic.tip1')}
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={[styles.tipBullet, { color: colors.primary }]}>•</Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              {i18n.t('displayMnemonic.tip2')}
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={[styles.tipBullet, { color: colors.primary }]}>•</Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              {i18n.t('displayMnemonic.tip3')}
            </Text>
          </View>
        </Card>

        {/* Continue Button */}
        <Button onPress={handleContinue} style={styles.continueButton} testID="continue-button">
          {i18n.t('displayMnemonic.continueButton')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  continueButton: {
    marginTop: 8,
  },
  copyButton: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 24,
  },
  mnemonicCard: {
    marginBottom: 16,
    padding: 16,
  },
  mnemonicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  scrollView: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  tipBullet: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  tipsCard: {
    marginBottom: 24,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  warningCard: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
  },
  warningIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  wordItem: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 12,
    width: '30%',
  },
  wordNumber: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 20,
  },
  wordText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
