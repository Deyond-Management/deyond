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
      setError('Mnemonic must be 12 or 24 words');
      return false;
    }

    // Validate using WalletManager
    try {
      const walletManager = WalletManager.getInstance();
      return walletManager.validateMnemonic(trimmed);
    } catch (err) {
      setError('Invalid mnemonic phrase');
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
      setError('Invalid private key. Must be 64 hexadecimal characters.');
      return false;
    }

    return true;
  };

  // Handle import
  const handleImport = async () => {
    setError('');

    if (!inputValue.trim()) {
      setError('Please enter your recovery phrase or private key');
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
          <Text style={[styles.title, { color: colors.text.primary }]}>Import Wallet</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Import an existing wallet using your recovery phrase or private key
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
              Seed Phrase
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
              Private Key
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Card */}
        <Card style={styles.inputCard}>
          {importMethod === 'mnemonic' ? (
            <>
              <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                Recovery Phrase
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
                placeholder="Enter your 12 or 24 word recovery phrase"
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
                Separate each word with a space
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Private Key</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: colors.text.primary,
                    backgroundColor: colors.surface,
                    borderColor: error ? colors.error : colors.border,
                  },
                ]}
                placeholder="Enter your private key (with or without 0x)"
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
                64 hexadecimal characters
              </Text>
            </>
          )}
        </Card>

        {/* Warning Card */}
        <Card style={[styles.warningCard, { backgroundColor: colors.warning + '15' }]}>
          <Text style={[styles.warningIcon, { color: colors.warning }]}>⚠️</Text>
          <Text style={[styles.warningText, { color: colors.text.primary }]}>
            Never share your recovery phrase or private key with anyone. We will never ask for it.
          </Text>
        </Card>

        {/* Error Message */}
        {error.length > 0 && (
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        )}

        {/* Import Button */}
        <Button onPress={handleImport} style={styles.importButton} testID="import-button">
          Import Wallet
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
