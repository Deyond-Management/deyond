/**
 * CreateGroupScreen
 * Screen for creating a new group chat
 * Features: set group name, add members, create encrypted group
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { useDeyondCrypt } from '../hooks';
import i18n from '../i18n';
import { logger } from '../utils';

type CreateGroupScreenProps = NativeStackScreenProps<RootStackParamList, 'CreateGroup'>;

const screenLogger = logger.child({ screen: 'CreateGroup' });

export const CreateGroupScreen: React.FC<CreateGroupScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors } = theme;

  const { contacts, createGroup } = useDeyondCrypt();

  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Toggle member selection
  const toggleMember = useCallback((address: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(address)) {
        return prev.filter(a => a !== address);
      }
      return [...prev, address];
    });
  }, []);

  // Create group
  const handleCreateGroup = useCallback(async () => {
    if (!groupName.trim()) {
      Alert.alert(i18n.t('common.error'), i18n.t('createGroup.errors.nameRequired'));
      return;
    }

    if (selectedMembers.length < 1) {
      Alert.alert(i18n.t('common.error'), i18n.t('createGroup.errors.membersRequired'));
      return;
    }

    setIsCreating(true);
    try {
      screenLogger.info('Creating group...', {
        name: groupName,
        memberCount: selectedMembers.length,
      });

      const result = await createGroup?.(groupName.trim(), selectedMembers);

      if (result?.groupId) {
        screenLogger.info('Group created successfully', { groupId: result.groupId });
        navigation.replace('GroupChat', {
          groupId: result.groupId,
          groupName: groupName.trim(),
        });
      }
    } catch (err) {
      screenLogger.error('Failed to create group', err as Error);
      Alert.alert(i18n.t('common.error'), i18n.t('createGroup.errors.createFailed'));
    } finally {
      setIsCreating(false);
    }
  }, [groupName, selectedMembers, createGroup, navigation]);

  // Format address for display
  const formatAddress = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  // Render contact item
  const renderContactItem = ({ item }: { item: { address: string; name?: string } }) => {
    const isSelected = selectedMembers.includes(item.address);
    return (
      <TouchableOpacity
        testID={`contact-item-${item.address}`}
        style={[
          styles.contactItem,
          { backgroundColor: isSelected ? colors.primary + '20' : colors.surface },
        ]}
        onPress={() => toggleMember(item.address)}
      >
        <View style={[styles.contactAvatar, { backgroundColor: colors.primary + '30' }]}>
          <Text style={[styles.contactAvatarText, { color: colors.primary }]}>
            {(item.name || item.address.slice(2, 4)).slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: colors.text.primary }]}>
            {item.name || formatAddress(item.address)}
          </Text>
          <Text style={[styles.contactAddress, { color: colors.text.secondary }]}>
            {formatAddress(item.address)}
          </Text>
        </View>
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: isSelected ? colors.primary : 'transparent',
              borderColor: isSelected ? colors.primary : colors.border,
            },
          ]}
        >
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
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
          {i18n.t('createGroup.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Group Name Input */}
        <Card style={styles.inputCard}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>
            {i18n.t('createGroup.groupName')}
          </Text>
          <TextInput
            testID="group-name-input"
            style={[
              styles.input,
              {
                color: colors.text.primary,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
            placeholder={i18n.t('createGroup.namePlaceholder')}
            placeholderTextColor={colors.text.disabled}
            value={groupName}
            onChangeText={setGroupName}
            maxLength={50}
          />
        </Card>

        {/* Member Count Badge */}
        {selectedMembers.length > 0 && (
          <View style={[styles.memberBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.memberBadgeText, { color: colors.primary }]}>
              {i18n.t('createGroup.selectedMembers', { count: selectedMembers.length })}
            </Text>
          </View>
        )}

        {/* Contacts List */}
        <View style={styles.contactsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            {i18n.t('createGroup.addMembers')}
          </Text>

          {contacts && contacts.length > 0 ? (
            <FlatList
              testID="contacts-list"
              data={contacts}
              renderItem={renderContactItem}
              keyExtractor={item => item.address}
              scrollEnabled={false}
              contentContainerStyle={styles.contactsList}
            />
          ) : (
            <View style={styles.emptyContacts}>
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                {i18n.t('createGroup.noContacts')}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('DeviceDiscovery')}>
                <Text style={[styles.addContactLink, { color: colors.primary }]}>
                  {i18n.t('createGroup.findContacts')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Encryption Notice */}
        <View style={[styles.encryptionNotice, { backgroundColor: colors.success + '10' }]}>
          <Text style={styles.encryptionIcon}>🔒</Text>
          <Text style={[styles.encryptionText, { color: colors.text.secondary }]}>
            {i18n.t('createGroup.encryptionNote')}
          </Text>
        </View>

        {/* Create Button */}
        <View style={styles.buttonContainer}>
          <Button
            testID="create-group-button"
            onPress={handleCreateGroup}
            loading={isCreating}
            disabled={isCreating || !groupName.trim() || selectedMembers.length < 1}
          >
            {i18n.t('createGroup.createButton')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  addContactLink: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
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
  checkbox: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  contactAddress: {
    fontSize: 12,
    marginTop: 2,
  },
  contactAvatar: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  contactAvatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  contactItem: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 12,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '500',
  },
  contactsList: {
    paddingTop: 8,
  },
  contactsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  emptyContacts: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  encryptionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  encryptionNotice: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 12,
  },
  encryptionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
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
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    marginTop: 8,
    padding: 14,
  },
  inputCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  memberBadge: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    marginLeft: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  memberBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
});

export default CreateGroupScreen;
