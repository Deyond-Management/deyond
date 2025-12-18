/**
 * ContactDetailScreen
 * Screen for viewing and managing contact details
 * Features: view contact info, send message, verify keys, delete contact
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { useDeyondCrypt } from '../hooks';
import i18n from '../i18n';
import { logger } from '../utils';
import * as Clipboard from 'expo-clipboard';

type ContactDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ContactDetail'>;

const screenLogger = logger.child({ screen: 'ContactDetail' });

export const ContactDetailScreen: React.FC<ContactDetailScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const { contactAddress, contactName } = route.params;

  const { contacts, removeContact } = useDeyondCrypt();

  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Find contact from contacts list
  const contact = contacts?.find(c => c.address === contactAddress);

  // Copy address to clipboard
  const handleCopyAddress = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(contactAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      screenLogger.error('Failed to copy address', err as Error);
    }
  }, [contactAddress]);

  // Start chat with contact
  const handleSendMessage = useCallback(() => {
    navigation.navigate('ChatConversation', {
      sessionId: `dm:${contactAddress}`,
      peerName: contactName || contactAddress.slice(0, 8) + '...',
      peerAddress: contactAddress,
    });
  }, [navigation, contactAddress, contactName]);

  // Delete contact
  const handleDeleteContact = useCallback(() => {
    Alert.alert(
      i18n.t('contactDetail.deleteConfirm.title'),
      i18n.t('contactDetail.deleteConfirm.message', { name: contactName }),
      [
        {
          text: i18n.t('common.cancel'),
          style: 'cancel',
        },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await removeContact?.(contactAddress);
              navigation.goBack();
            } catch (err) {
              screenLogger.error('Failed to delete contact', err as Error);
              Alert.alert(i18n.t('common.error'), i18n.t('contactDetail.errors.deleteFailed'));
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [removeContact, contactAddress, contactName, navigation]);

  // Format address for display
  const formatAddress = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
  };

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
          {i18n.t('contactDetail.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar & Name */}
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {(contactName || contactAddress.slice(2, 4)).slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text testID="contact-name" style={[styles.name, { color: colors.text.primary }]}>
            {contactName || formatAddress(contactAddress)}
          </Text>
          {contact?.verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: colors.success + '20' }]}>
              <Text style={[styles.verifiedText, { color: colors.success }]}>
                ✓ {i18n.t('contactDetail.verified')}
              </Text>
            </View>
          )}
        </View>

        {/* Address Card */}
        <Card style={styles.addressCard}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>
            {i18n.t('contactDetail.address')}
          </Text>
          <View style={styles.addressRow}>
            <Text
              testID="contact-address"
              style={[styles.addressText, { color: colors.text.primary }]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {contactAddress}
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
        </Card>

        {/* Encryption Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusIcon}>🔒</Text>
            <View style={styles.statusContent}>
              <Text style={[styles.statusTitle, { color: colors.text.primary }]}>
                {i18n.t('contactDetail.encryption.title')}
              </Text>
              <Text style={[styles.statusDescription, { color: colors.text.secondary }]}>
                {contact?.hasSession
                  ? i18n.t('contactDetail.encryption.active')
                  : i18n.t('contactDetail.encryption.inactive')}
              </Text>
            </View>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: contact?.hasSession ? colors.success : colors.warning },
              ]}
            />
          </View>
        </Card>

        {/* Chain Info */}
        {contact?.chainType && (
          <Card style={styles.chainCard}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              {i18n.t('contactDetail.chainType')}
            </Text>
            <Text style={[styles.chainText, { color: colors.text.primary }]}>
              {contact.chainType.toUpperCase()}
            </Text>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Button testID="send-message-button" onPress={handleSendMessage}>
            {i18n.t('contactDetail.sendMessage')}
          </Button>
          <View style={styles.buttonSpacer} />
          <Button
            testID="delete-contact-button"
            onPress={handleDeleteContact}
            variant="outlined"
            loading={isDeleting}
            disabled={isDeleting}
          >
            {i18n.t('contactDetail.deleteContact')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  actionsSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  addressCard: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
  },
  addressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  addressText: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: 16,
    width: 80,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
  },
  buttonSpacer: {
    height: 12,
  },
  chainCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
  },
  chainText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
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
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  statusCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statusIndicator: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  verifiedBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ContactDetailScreen;
