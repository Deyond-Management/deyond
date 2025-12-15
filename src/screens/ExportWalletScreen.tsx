/**
 * ExportWalletScreen
 * Screen for exporting wallet (mnemonic or private key)
 * Features: PIN verification, export method selection, secure display
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { Input } from '../components/atoms/Input';
import WalletService from '../services/wallet/WalletService';
import i18n from '../i18n';
import * as Haptics from 'expo-haptics';

interface ExportWalletScreenProps {
  navigation: any;
}

type ExportMethod = 'mnemonic' | 'privateKey';

export const ExportWalletScreen: React.FC<ExportWalletScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const [exportMethod, setExportMethod] = useState<ExportMethod>('mnemonic');
  const [pin, setPin] = useState('');
  const [exportedData, setExportedData] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const walletService = new WalletService();

  // Handle export
  const handleExport = async () => {
    setError('');
    setLoading(true);

    try {
      if (!pin) {
        setError(i18n.t('exportWallet.errors.pinRequired'));
        return;
      }

      let data: string;

      if (exportMethod === 'mnemonic') {
        data = await walletService.exportMnemonic(pin);
      } else {
        data = await walletService.exportPrivateKey(pin);
      }

      setExportedData(data);
      setIsRevealed(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setError(err.message || i18n.t('exportWallet.errors.exportFailed'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (exportedData) {
      Clipboard.setString(exportedData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(i18n.t('exportWallet.copied.title'), i18n.t('exportWallet.copied.message'), [
        { text: 'OK' },
      ]);
    }
  };

  // Show warning before exporting
  const showExportWarning = () => {
    Alert.alert(i18n.t('exportWallet.warning.title'), i18n.t('exportWallet.warning.message'), [
      {
        text: i18n.t('common.cancel'),
        style: 'cancel',
      },
      {
        text: i18n.t('common.continue'),
        style: 'destructive',
        onPress: handleExport,
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Warning Card */}
        <Card style={[styles.warningCard, { backgroundColor: colors.error + '20' }]}>
          <Text style={[styles.warningTitle, { color: colors.error }]}>
            {i18n.t('exportWallet.securityWarning.title')}
          </Text>
          <Text style={[styles.warningText, { color: colors.text.secondary }]}>
            {i18n.t('exportWallet.securityWarning.message')}
          </Text>
        </Card>

        {!isRevealed ? (
          <>
            {/* Export Method Selection */}
            <View style={styles.methodContainer}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                {i18n.t('exportWallet.selectMethod')}
              </Text>

              <View style={styles.methodButtons}>
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    {
                      backgroundColor: exportMethod === 'mnemonic' ? colors.primary : colors.card,
                      borderColor: exportMethod === 'mnemonic' ? colors.primary : colors.divider,
                    },
                  ]}
                  onPress={() => setExportMethod('mnemonic')}
                >
                  <Text
                    style={[
                      styles.methodButtonText,
                      {
                        color:
                          exportMethod === 'mnemonic' ? colors.background : colors.text.primary,
                      },
                    ]}
                  >
                    {i18n.t('exportWallet.methods.mnemonic')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    {
                      backgroundColor: exportMethod === 'privateKey' ? colors.primary : colors.card,
                      borderColor: exportMethod === 'privateKey' ? colors.primary : colors.divider,
                    },
                  ]}
                  onPress={() => setExportMethod('privateKey')}
                >
                  <Text
                    style={[
                      styles.methodButtonText,
                      {
                        color:
                          exportMethod === 'privateKey' ? colors.background : colors.text.primary,
                      },
                    ]}
                  >
                    {i18n.t('exportWallet.methods.privateKey')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Method Description */}
            <Card style={styles.descriptionCard}>
              <Text style={[styles.descriptionText, { color: colors.text.secondary }]}>
                {exportMethod === 'mnemonic'
                  ? i18n.t('exportWallet.descriptions.mnemonic')
                  : i18n.t('exportWallet.descriptions.privateKey')}
              </Text>
            </Card>

            {/* PIN Input */}
            <View style={styles.pinContainer}>
              <Input
                label={i18n.t('exportWallet.enterPin')}
                value={pin}
                onChangeText={setPin}
                placeholder="••••••"
                secureTextEntry
                keyboardType="number-pad"
                maxLength={12}
                error={error}
              />
            </View>

            {/* Export Button */}
            <Button
              onPress={showExportWarning}
              loading={loading}
              disabled={!pin}
              style={styles.exportButton}
            >
              {i18n.t('exportWallet.export')}
            </Button>
          </>
        ) : (
          <>
            {/* Exported Data Display */}
            <Card style={styles.exportedCard}>
              <Text style={[styles.exportedLabel, { color: colors.text.secondary }]}>
                {exportMethod === 'mnemonic'
                  ? i18n.t('exportWallet.yourMnemonic')
                  : i18n.t('exportWallet.yourPrivateKey')}
              </Text>

              <View style={[styles.exportedDataContainer, { backgroundColor: colors.background }]}>
                <Text style={[styles.exportedData, { color: colors.text.primary }]} selectable>
                  {exportedData}
                </Text>
              </View>

              <Button onPress={handleCopy} variant="secondary" style={styles.copyButton}>
                {i18n.t('exportWallet.copyToClipboard')}
              </Button>
            </Card>

            {/* Important Notes */}
            <Card style={styles.notesCard}>
              <Text style={[styles.notesTitle, { color: colors.text.primary }]}>
                {i18n.t('exportWallet.notes.title')}
              </Text>
              <Text style={[styles.notesText, { color: colors.text.secondary }]}>
                • {i18n.t('exportWallet.notes.note1')}
              </Text>
              <Text style={[styles.notesText, { color: colors.text.secondary }]}>
                • {i18n.t('exportWallet.notes.note2')}
              </Text>
              <Text style={[styles.notesText, { color: colors.text.secondary }]}>
                • {i18n.t('exportWallet.notes.note3')}
              </Text>
            </Card>

            {/* Done Button */}
            <Button onPress={() => navigation.goBack()} style={styles.doneButton}>
              {i18n.t('common.done')}
            </Button>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  warningCard: {
    marginBottom: 24,
    padding: 16,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
  },
  methodContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  methodButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionCard: {
    marginBottom: 24,
    padding: 16,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  pinContainer: {
    marginBottom: 24,
  },
  exportButton: {
    marginBottom: 16,
  },
  exportedCard: {
    marginBottom: 24,
    padding: 16,
  },
  exportedLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  exportedDataContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  exportedData: {
    fontSize: 14,
    lineHeight: 24,
    fontFamily: 'monospace',
  },
  copyButton: {
    marginTop: 8,
  },
  notesCard: {
    marginBottom: 24,
    padding: 16,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  doneButton: {
    marginBottom: 16,
  },
});

export default ExportWalletScreen;
