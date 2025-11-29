/**
 * ImportWalletScreen
 * Screen for importing existing wallet via mnemonic or private key
 * Features: import method selection, input validation, error handling
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { WalletManager } from '../core/wallet/WalletManager';
import i18n from '../i18n';

interface ImportWalletScreenProps {
  navigation: any;
}

type ImportMethod = 'mnemonic' | 'privateKey';

export const ImportWalletScreen: React.FC<ImportWalletScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const [importMethod, setImportMethod] = useState<ImportMethod>('mnemonic');
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  // Validate mnemonic
  const validateMnemonic = (mnemonic: string): boolean => {
    const trimmed = mnemonic.trim();
    const words = trimmed.split(/\s+/);

    // Check word count
    if (words.length !== 12 && words.length !== 24) {
      setError(i18n.t('importWallet.errors.wordCount'));
      return false;
    }

    // Validate using WalletManager
    try {
      const walletManager = WalletManager.getInstance();
      return walletManager.validateMnemonic(trimmed);
    } catch (err) {
      setError(i18n.t('importWallet.errors.invalidMnemonic'));
      return false;
    }
  };

  // Validate private key
  const validatePrivateKey = (privateKey: string): boolean => {
    const trimmed = privateKey.trim();

    // Remove 0x prefix if present
    const cleanKey = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;

    // Check if it's 64 hexadecimal characters
    const hexRegex = /^[0-9a-fA-F]{64}$/;

    if (!hexRegex.test(cleanKey)) {
      setError(i18n.t('importWallet.errors.invalidPrivateKey'));
      return false;
    }

    return true;
  };

  // Handle import
  const handleImport = async () => {
    setError('');

    if (!inputValue.trim()) {
      setError(i18n.t('importWallet.errors.required'));
      return;
    }

    let isValid = false;

    if (importMethod === 'mnemonic') {
      isValid = validateMnemonic(inputValue);
    } else {
      isValid = validatePrivateKey(inputValue);
    }

    if (!isValid) {
      return;
    }

    // Navigate to CreatePassword to set password for imported wallet
    navigation.navigate('CreatePassword', {
      importData: {
        method: importMethod,
        value: inputValue.trim(),
      },
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
            {i18n.t('importWallet.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {i18n.t('importWallet.subtitle')}
          </Text>
        </View>

        {/* Import Method Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor: importMethod === 'mnemonic' ? colors.primary : 'transparent',
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              setImportMethod('mnemonic');
              setInputValue('');
              setError('');
            }}
            testID="mnemonic-tab"
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: importMethod === 'mnemonic' ? '#FFFFFF' : colors.text.primary,
                },
              ]}
            >
              {i18n.t('importWallet.seedPhrase')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor: importMethod === 'privateKey' ? colors.primary : 'transparent',
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              setImportMethod('privateKey');
              setInputValue('');
              setError('');
            }}
            testID="private-key-tab"
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: importMethod === 'privateKey' ? '#FFFFFF' : colors.text.primary,
                },
              ]}
            >
              {i18n.t('importWallet.privateKey')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Card */}
        <Card style={styles.inputCard}>
          {importMethod === 'mnemonic' ? (
            <>
              <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                {i18n.t('importWallet.recoveryPhrase')}
              </Text>
              <TextInput
                testID="mnemonic-input"
                style={[
                  styles.textInput,
                  {
                    color: colors.text.primary,
                    backgroundColor: colors.surface,
                    borderColor: error ? colors.error : colors.border,
                  },
                ]}
                placeholder={i18n.t('importWallet.recoveryPhrasePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={inputValue}
                onChangeText={text => {
                  setInputValue(text);
                  setError('');
                }}
                multiline
                numberOfLines={4}
                autoCapitalize="none"
                autoCorrect={false}
                textAlignVertical="top"
              />
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                {i18n.t('importWallet.separateWords')}
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                {i18n.t('importWallet.privateKeyLabel')}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: colors.text.primary,
                    backgroundColor: colors.surface,
                    borderColor: error ? colors.error : colors.border,
                  },
                ]}
                placeholder={i18n.t('importWallet.privateKeyPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={inputValue}
                onChangeText={text => {
                  setInputValue(text);
                  setError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                {i18n.t('importWallet.hexCharacters')}
              </Text>
            </>
          )}
        </Card>

        {/* Warning Card */}
        <Card style={[styles.warningCard, { backgroundColor: colors.warning + '15' }]}>
          <Text style={[styles.warningIcon, { color: colors.warning }]}>⚠️</Text>
          <Text style={[styles.warningText, { color: colors.text.primary }]}>
            {i18n.t('importWallet.warning')}
          </Text>
        </Card>

        {/* Error Message */}
        {error.length > 0 && (
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        )}

        {/* Import Button */}
        <Button onPress={handleImport} style={styles.importButton} testID="import-button">
          {i18n.t('importWallet.importButton')}
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
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  header: {
    marginBottom: 24,
  },
  helperText: {
    fontSize: 12,
    marginTop: 8,
  },
  importButton: {
    marginTop: 8,
  },
  inputCard: {
    marginBottom: 16,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  tab: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 100,
    padding: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  warningCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    padding: 16,
  },
  warningIcon: {
    fontSize: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
