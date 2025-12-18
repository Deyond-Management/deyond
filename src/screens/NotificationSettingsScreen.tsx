/**
 * NotificationSettingsScreen
 * Screen for managing notification preferences
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  selectNotificationSettings,
  selectPermissionGranted,
  toggleEnabled,
  toggleCategory,
  updateQuietHours,
  toggleSound,
  toggleVibration,
  setPermissionGranted,
} from '../store/slices/notificationSlice';
import {
  NotificationCategory,
  getPushNotificationService,
} from '../services/notification/PushNotificationService';
import i18n from '../i18n';

interface NotificationSettingsScreenProps {
  navigation: any;
}

export const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({
  navigation,
}) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectNotificationSettings);
  const permissionGranted = useAppSelector(selectPermissionGranted);
  const [loading, setLoading] = useState(false);

  // Initialize notification service
  useEffect(() => {
    const initNotifications = async () => {
      const service = getPushNotificationService();
      const token = await service.registerForPushNotifications();
      dispatch(setPermissionGranted(!!token));
    };

    initNotifications();
  }, [dispatch]);

  // Handle toggle enabled
  const handleToggleEnabled = useCallback(
    async (value: boolean) => {
      if (value && !permissionGranted) {
        // Request permission
        setLoading(true);
        const service = getPushNotificationService();
        const token = await service.registerForPushNotifications();
        setLoading(false);

        if (!token) {
          Alert.alert(
            i18n.t('notifications.permissionRequired'),
            i18n.t('notifications.permissionMessage'),
            [{ text: i18n.t('common.ok') }]
          );
          return;
        }
        dispatch(setPermissionGranted(true));
      }

      dispatch(toggleEnabled(value));
      const service = getPushNotificationService();
      await service.toggleEnabled(value);
    },
    [dispatch, permissionGranted]
  );

  // Handle toggle category
  const handleToggleCategory = useCallback(
    async (category: NotificationCategory, value: boolean) => {
      dispatch(toggleCategory({ category, enabled: value }));
      const service = getPushNotificationService();
      await service.toggleCategory(category, value);
    },
    [dispatch]
  );

  // Handle toggle quiet hours
  const handleToggleQuietHours = useCallback(
    async (value: boolean) => {
      dispatch(updateQuietHours({ enabled: value }));
      const service = getPushNotificationService();
      await service.setQuietHours(value);
    },
    [dispatch]
  );

  // Handle toggle sound
  const handleToggleSound = useCallback(
    async (value: boolean) => {
      dispatch(toggleSound(value));
      const service = getPushNotificationService();
      await service.updateSettings({ sound: value });
    },
    [dispatch]
  );

  // Handle toggle vibration
  const handleToggleVibration = useCallback(
    async (value: boolean) => {
      dispatch(toggleVibration(value));
      const service = getPushNotificationService();
      await service.updateSettings({ vibration: value });
    },
    [dispatch]
  );

  // Get category label
  const getCategoryLabel = (category: NotificationCategory): string => {
    switch (category) {
      case NotificationCategory.TRANSACTION:
        return i18n.t('notifications.categories.transaction');
      case NotificationCategory.PRICE_ALERT:
        return i18n.t('notifications.categories.priceAlert');
      case NotificationCategory.SECURITY:
        return i18n.t('notifications.categories.security');
      case NotificationCategory.SYSTEM:
        return i18n.t('notifications.categories.system');
      default:
        return category;
    }
  };

  // Get category description
  const getCategoryDescription = (category: NotificationCategory): string => {
    switch (category) {
      case NotificationCategory.TRANSACTION:
        return i18n.t('notifications.descriptions.transaction');
      case NotificationCategory.PRICE_ALERT:
        return i18n.t('notifications.descriptions.priceAlert');
      case NotificationCategory.SECURITY:
        return i18n.t('notifications.descriptions.security');
      case NotificationCategory.SYSTEM:
        return i18n.t('notifications.descriptions.system');
      default:
        return '';
    }
  };

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
          {i18n.t('notifications.title')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Main toggle */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                {i18n.t('notifications.enableNotifications')}
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                {i18n.t('notifications.enableDescription')}
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: theme.colors.divider, true: theme.colors.primary + '60' }}
              thumbColor={settings.enabled ? theme.colors.primary : '#f4f3f4'}
              disabled={loading}
            />
          </View>
        </View>

        {/* Categories */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
          {i18n.t('notifications.categories.title')}
        </Text>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          {Object.values(NotificationCategory).map((category, index) => (
            <View key={category}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                    {getCategoryLabel(category)}
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                    {getCategoryDescription(category)}
                  </Text>
                </View>
                <Switch
                  value={settings.categories[category]}
                  onValueChange={value => handleToggleCategory(category, value)}
                  trackColor={{ false: theme.colors.divider, true: theme.colors.primary + '60' }}
                  thumbColor={settings.categories[category] ? theme.colors.primary : '#f4f3f4'}
                  disabled={!settings.enabled}
                />
              </View>
              {index < Object.values(NotificationCategory).length - 1 && (
                <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
              )}
            </View>
          ))}
        </View>

        {/* Quiet Hours */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
          {i18n.t('notifications.quietHours.title')}
        </Text>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                {i18n.t('notifications.quietHours.enable')}
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                {i18n.t('notifications.quietHours.description', {
                  start: settings.quietHours.startHour,
                  end: settings.quietHours.endHour,
                })}
              </Text>
            </View>
            <Switch
              value={settings.quietHours.enabled}
              onValueChange={handleToggleQuietHours}
              trackColor={{ false: theme.colors.divider, true: theme.colors.primary + '60' }}
              thumbColor={settings.quietHours.enabled ? theme.colors.primary : '#f4f3f4'}
              disabled={!settings.enabled}
            />
          </View>
        </View>

        {/* Sound & Vibration */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
          {i18n.t('notifications.alerts.title')}
        </Text>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                {i18n.t('notifications.alerts.sound')}
              </Text>
            </View>
            <Switch
              value={settings.sound}
              onValueChange={handleToggleSound}
              trackColor={{ false: theme.colors.divider, true: theme.colors.primary + '60' }}
              thumbColor={settings.sound ? theme.colors.primary : '#f4f3f4'}
              disabled={!settings.enabled}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                {i18n.t('notifications.alerts.vibration')}
              </Text>
            </View>
            <Switch
              value={settings.vibration}
              onValueChange={handleToggleVibration}
              trackColor={{ false: theme.colors.divider, true: theme.colors.primary + '60' }}
              thumbColor={settings.vibration ? theme.colors.primary : '#f4f3f4'}
              disabled={!settings.enabled}
            />
          </View>
        </View>

        {/* Info text */}
        <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
          {i18n.t('notifications.infoText')}
        </Text>
      </ScrollView>
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
  content: {
    padding: 16,
  },
  divider: {
    height: 1,
    marginLeft: 16,
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
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  placeholder: {
    width: 50,
  },
  section: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
});

export default NotificationSettingsScreen;
