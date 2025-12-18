/**
 * WalletConnectSessionsScreen
 * Displays and manages WalletConnect sessions
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  selectWalletConnectSessions,
  selectActiveSessions,
  selectPendingRequestCount,
  removeSession,
  clearAllSessions,
  SessionInfo,
} from '../store/slices/walletConnectSlice';
import { getWalletConnectService } from '../services/walletconnect/WalletConnectService';
import i18n from '../i18n';

interface WalletConnectSessionsScreenProps {
  navigation: any;
}

// Session Card Component
const SessionCard: React.FC<{
  session: SessionInfo;
  onDisconnect: (topic: string) => void;
  theme: any;
}> = ({ session, onDisconnect, theme }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const isExpired = session.expiry * 1000 < Date.now();

  return (
    <View style={[styles.sessionCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.sessionHeader}>
        {session.peerIcon ? (
          <Image source={{ uri: session.peerIcon }} style={styles.dappIcon} />
        ) : (
          <View style={[styles.dappIconPlaceholder, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.dappIconText}>{session.peerName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.sessionInfo}>
          <Text style={[styles.dappName, { color: theme.colors.text.primary }]}>
            {session.peerName}
          </Text>
          <Text style={[styles.dappUrl, { color: theme.colors.text.secondary }]} numberOfLines={1}>
            {session.peerUrl}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isExpired
                  ? theme.colors.error
                  : session.isActive
                    ? theme.colors.success
                    : theme.colors.text.secondary,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.sessionDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
            {i18n.t('walletConnect.connectedAt')}
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
            {formatDate(session.connectedAt)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
            {i18n.t('walletConnect.chains')}
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
            {session.chains.length > 0 ? session.chains.join(', ') : 'N/A'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
            {i18n.t('walletConnect.methods')}
          </Text>
          <Text
            style={[styles.detailValue, { color: theme.colors.text.primary }]}
            numberOfLines={1}
          >
            {session.methods.length > 0 ? session.methods.slice(0, 3).join(', ') : 'N/A'}
            {session.methods.length > 3 ? '...' : ''}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.disconnectButton, { borderColor: theme.colors.error }]}
        onPress={() => onDisconnect(session.topic)}
        accessibilityRole="button"
        accessibilityLabel={i18n.t('walletConnect.disconnect')}
      >
        <Text style={[styles.disconnectButtonText, { color: theme.colors.error }]}>
          {i18n.t('walletConnect.disconnect')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export const WalletConnectSessionsScreen: React.FC<WalletConnectSessionsScreenProps> = ({
  navigation,
}) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const sessions = useAppSelector(selectWalletConnectSessions);
  const activeSessions = useAppSelector(selectActiveSessions);
  const pendingRequestCount = useAppSelector(selectPendingRequestCount);
  const [refreshing, setRefreshing] = useState(false);

  // Handle disconnect
  const handleDisconnect = useCallback(
    async (topic: string) => {
      const session = sessions.find(s => s.topic === topic);
      if (!session) return;

      Alert.alert(
        i18n.t('walletConnect.disconnectTitle'),
        i18n.t('walletConnect.disconnectConfirm', { name: session.peerName }),
        [
          { text: i18n.t('common.cancel'), style: 'cancel' },
          {
            text: i18n.t('walletConnect.disconnect'),
            style: 'destructive',
            onPress: async () => {
              try {
                const wcService = getWalletConnectService();
                await wcService.disconnect(topic);
                dispatch(removeSession(topic));
              } catch (error: any) {
                console.error('Failed to disconnect:', error);
                // Still remove from state even if WC disconnect fails
                dispatch(removeSession(topic));
              }
            },
          },
        ]
      );
    },
    [sessions, dispatch]
  );

  // Handle disconnect all
  const handleDisconnectAll = useCallback(() => {
    if (sessions.length === 0) return;

    Alert.alert(
      i18n.t('walletConnect.disconnectAllTitle'),
      i18n.t('walletConnect.disconnectAllConfirm'),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('walletConnect.disconnectAll'),
          style: 'destructive',
          onPress: async () => {
            try {
              const wcService = getWalletConnectService();
              for (const session of sessions) {
                try {
                  await wcService.disconnect(session.topic);
                } catch (e) {
                  console.error('Failed to disconnect session:', session.topic, e);
                }
              }
              dispatch(clearAllSessions());
            } catch (error) {
              console.error('Failed to disconnect all:', error);
              dispatch(clearAllSessions());
            }
          },
        },
      ]
    );
  }, [sessions, dispatch]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const wcService = getWalletConnectService();
      await wcService.refreshSessions();
    } catch (error) {
      console.error('Failed to refresh sessions:', error);
    }
    setRefreshing(false);
  }, []);

  // Navigate to scan screen
  const handleScan = useCallback(() => {
    navigation.navigate('WalletConnectScan');
  }, [navigation]);

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyIcon, { color: theme.colors.text.secondary }]}>🔗</Text>
      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
        {i18n.t('walletConnect.noSessions')}
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.text.secondary }]}>
        {i18n.t('walletConnect.noSessionsDescription')}
      </Text>
      <TouchableOpacity
        style={[styles.scanButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleScan}
        accessibilityRole="button"
        accessibilityLabel={i18n.t('walletConnect.scanQR')}
      >
        <Text style={styles.scanButtonText}>{i18n.t('walletConnect.scanQR')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('common.back')}
        >
          <Text style={[styles.backText, { color: theme.colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {i18n.t('walletConnect.sessions')}
        </Text>
        <TouchableOpacity
          onPress={handleScan}
          style={styles.scanHeaderButton}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('walletConnect.scanQR')}
        >
          <Text style={[styles.scanHeaderText, { color: theme.colors.primary }]}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      {sessions.length > 0 && (
        <View style={[styles.summary, { backgroundColor: theme.colors.card }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
              {activeSessions.length}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
              {i18n.t('walletConnect.activeSessions')}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: theme.colors.divider }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
              {pendingRequestCount}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
              {i18n.t('walletConnect.pendingRequests')}
            </Text>
          </View>
        </View>
      )}

      {/* Session List */}
      <FlatList
        data={sessions}
        keyExtractor={item => item.topic}
        renderItem={({ item }) => (
          <SessionCard session={item} onDisconnect={handleDisconnect} theme={theme} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      />

      {/* Disconnect All Button */}
      {sessions.length > 1 && (
        <View style={[styles.footer, { backgroundColor: theme.colors.background }]}>
          <TouchableOpacity
            style={[styles.disconnectAllButton, { borderColor: theme.colors.error }]}
            onPress={handleDisconnectAll}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('walletConnect.disconnectAll')}
          >
            <Text style={[styles.disconnectAllText, { color: theme.colors.error }]}>
              {i18n.t('walletConnect.disconnectAll')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backButton: {
    padding: 8,
    width: 50,
  },
  backText: {
    fontSize: 24,
  },
  container: {
    flex: 1,
  },
  dappIcon: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  dappIconPlaceholder: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  dappIconText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dappName: {
    fontSize: 16,
    fontWeight: '600',
  },
  dappUrl: {
    fontSize: 12,
    marginTop: 2,
  },
  detailLabel: {
    flex: 1,
    fontSize: 13,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  detailValue: {
    flex: 2,
    fontSize: 13,
    textAlign: 'right',
  },
  disconnectAllButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  disconnectAllText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disconnectButton: {
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    paddingVertical: 10,
  },
  disconnectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyDescription: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  scanButton: {
    borderRadius: 12,
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scanHeaderButton: {
    padding: 8,
    width: 50,
  },
  scanHeaderText: {
    fontSize: 28,
    textAlign: 'right',
  },
  sessionCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  sessionDetails: {
    marginTop: 12,
    paddingTop: 12,
  },
  sessionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  sessionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  statusContainer: {
    padding: 4,
  },
  statusDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  summary: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  summaryDivider: {
    marginHorizontal: 16,
    width: 1,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default WalletConnectSessionsScreen;
