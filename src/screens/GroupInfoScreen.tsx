/**
 * GroupInfoScreen
 * Screen for viewing and managing group info
 * Features: view members, add members, leave group
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

type GroupInfoScreenProps = NativeStackScreenProps<RootStackParamList, 'GroupInfo'>;

const screenLogger = logger.child({ screen: 'GroupInfo' });

export const GroupInfoScreen: React.FC<GroupInfoScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const { groupId } = route.params;

  const { groups, leaveGroup, myAddress } = useDeyondCrypt();

  const [isLeaving, setIsLeaving] = useState(false);

  // Find group
  const group = groups?.find(g => g.groupId === groupId);

  // Leave group
  const handleLeaveGroup = useCallback(() => {
    Alert.alert(i18n.t('groupInfo.leaveConfirm.title'), i18n.t('groupInfo.leaveConfirm.message'), [
      {
        text: i18n.t('common.cancel'),
        style: 'cancel',
      },
      {
        text: i18n.t('groupInfo.leave'),
        style: 'destructive',
        onPress: async () => {
          setIsLeaving(true);
          try {
            await leaveGroup?.(groupId);
            navigation.popToTop();
          } catch (err) {
            screenLogger.error('Failed to leave group', err as Error);
            Alert.alert(i18n.t('common.error'), i18n.t('groupInfo.errors.leaveFailed'));
          } finally {
            setIsLeaving(false);
          }
        },
      },
    ]);
  }, [groupId, leaveGroup, navigation]);

  // Format address for display
  const formatAddress = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  // Render member item
  const renderMemberItem = ({
    item,
  }: {
    item: { address: string; name?: string; isAdmin?: boolean };
  }) => {
    const isMe = item.address === myAddress;
    return (
      <TouchableOpacity
        testID={`member-${item.address}`}
        style={[styles.memberItem, { backgroundColor: colors.surface }]}
        onPress={() =>
          !isMe &&
          navigation.navigate('ContactDetail', {
            contactAddress: item.address,
            contactName: item.name,
          })
        }
        disabled={isMe}
      >
        <View style={[styles.memberAvatar, { backgroundColor: colors.primary + '30' }]}>
          <Text style={[styles.memberAvatarText, { color: colors.primary }]}>
            {(item.name || item.address.slice(2, 4)).slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={[styles.memberName, { color: colors.text.primary }]}>
              {item.name || formatAddress(item.address)}
            </Text>
            {isMe && (
              <Text style={[styles.youBadge, { color: colors.text.secondary }]}>
                ({i18n.t('groupInfo.you')})
              </Text>
            )}
          </View>
          {item.isAdmin && (
            <Text style={[styles.adminBadge, { color: colors.primary }]}>
              {i18n.t('groupInfo.admin')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!group) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundText, { color: colors.text.secondary }]}>
            {i18n.t('groupInfo.notFound')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          {i18n.t('groupInfo.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Group Avatar & Name */}
        <View style={styles.profileSection}>
          <View style={[styles.groupAvatar, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.groupAvatarText, { color: colors.primary }]}>
              {group.groupName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text testID="group-name" style={[styles.groupName, { color: colors.text.primary }]}>
            {group.groupName}
          </Text>
          <View style={[styles.encryptionBadge, { backgroundColor: colors.success + '20' }]}>
            <Text style={[styles.encryptionText, { color: colors.success }]}>
              🔒 {i18n.t('groupInfo.encrypted')}
            </Text>
          </View>
        </View>

        {/* Members Card */}
        <Card style={styles.membersCard}>
          <View style={styles.membersSectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              {i18n.t('groupInfo.members')}
            </Text>
            <Text style={[styles.memberCount, { color: colors.text.secondary }]}>
              {group.memberCount || 0}
            </Text>
          </View>

          {/* Members list placeholder - actual members to be loaded */}
          <View style={styles.membersList}>
            <Text style={[styles.memberCount, { color: colors.text.secondary }]}>
              {i18n.t('groupInfo.members')}: {group.memberCount}
            </Text>
          </View>
        </Card>

        {/* Group Info */}
        <Card style={styles.infoCard}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>
            {i18n.t('groupInfo.created')}
          </Text>
          <Text style={[styles.infoText, { color: colors.text.primary }]}>
            {group.createdAt
              ? new Date(group.createdAt).toLocaleDateString()
              : i18n.t('common.unknown')}
          </Text>
        </Card>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Button
            testID="leave-group-button"
            onPress={handleLeaveGroup}
            variant="outlined"
            loading={isLeaving}
            disabled={isLeaving}
          >
            {i18n.t('groupInfo.leaveGroup')}
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
  adminBadge: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
  },
  encryptionBadge: {
    borderRadius: 12,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  encryptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  groupAvatar: {
    alignItems: 'center',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: 16,
    width: 80,
  },
  groupAvatarText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  groupName: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
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
  infoCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  memberAvatar: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  memberCount: {
    fontSize: 14,
  },
  memberInfo: {
    flex: 1,
  },
  memberItem: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 12,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '500',
  },
  memberNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  membersCard: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
  },
  membersList: {
    marginTop: 12,
  },
  membersSectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notFoundContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  youBadge: {
    fontSize: 13,
    marginLeft: 4,
  },
});

export default GroupInfoScreen;
