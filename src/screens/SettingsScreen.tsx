/**
 * SettingsScreen
 * App settings and preferences
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  setCurrentNetwork,
  toggleShowTestnets,
  selectNetworks,
  selectCurrentNetwork,
  selectShowTestnets,
} from '../store/slices/networkSlice';
import { NetworkSelectorModal } from '../components/organisms/NetworkSelectorModal';
import { Network } from '../types/wallet';
import i18n, { setLanguage, getCurrentLanguage, getAvailableLanguages } from '../i18n';

interface SettingsScreenProps {
  navigation: any;
}

interface SettingItemProps {
  testID: string;
  label: string;
  value?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  showArrow?: boolean;
  danger?: boolean;
}

interface SettingToggleProps {
  testID: string;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const dispatch = useAppDispatch();

  // Redux state for network
  const networks = useAppSelector(selectNetworks);
  const currentNetwork = useAppSelector(selectCurrentNetwork);
  const showTestnets = useAppSelector(selectShowTestnets);

  // Local state
  const [notifications, setNotifications] = useState(true);
  const [currency, setCurrency] = useState('USD');
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());
  const [networkModalVisible, setNetworkModalVisible] = useState(false);
  const [, forceUpdate] = useState({});

  // Get current language display name
  const getCurrentLanguageDisplay = useCallback(() => {
    const languages = getAvailableLanguages();
    const found = languages.find(lang => lang.code === currentLang);
    return found?.name || 'English';
  }, [currentLang]);

  // Handle language change
  const handleLanguageChange = useCallback(() => {
    const languages = getAvailableLanguages();
    Alert.alert(i18n.t('settingsScreen.items.language'), i18n.t('settingsScreen.selectLanguage'), [
      ...languages.map(lang => ({
        text: lang.name,
        onPress: () => {
          setLanguage(lang.code);
          setCurrentLang(lang.code);
          // Force re-render to update all i18n strings
          forceUpdate({});
        },
      })),
      {
        text: i18n.t('common.cancel'),
        style: 'cancel' as const,
      },
    ]);
  }, []);

  // Handle network selection
  const handleNetworkSelect = useCallback(
    (network: Network) => {
      dispatch(setCurrentNetwork(network));
      setNetworkModalVisible(false);
    },
    [dispatch]
  );

  // Handle testnet toggle
  const handleToggleTestnets = useCallback(() => {
    dispatch(toggleShowTestnets());
  }, [dispatch]);

  // Setting item component
  const SettingItem: React.FC<SettingItemProps> = ({
    testID,
    label,
    value,
    onPress,
    accessibilityLabel,
    showArrow = true,
    danger = false,
  }) => (
    <TouchableOpacity
      testID={testID}
      style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel || label}
    >
      <Text
        style={[
          styles.settingLabel,
          { color: danger ? theme.colors.error : theme.colors.text.primary },
        ]}
      >
        {label}
      </Text>
      <View style={styles.settingRight}>
        {value && (
          <Text style={[styles.settingValue, { color: theme.colors.text.secondary }]}>{value}</Text>
        )}
        {showArrow && <Text style={[styles.arrow, { color: theme.colors.text.secondary }]}>›</Text>}
      </View>
    </TouchableOpacity>
  );

  // Setting toggle component
  const SettingToggle: React.FC<SettingToggleProps> = ({
    testID,
    label,
    value,
    onValueChange,
    accessibilityLabel,
  }) => (
    <View testID={testID} style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}>
      <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.divider, true: theme.colors.primary }}
        thumbColor="#FFFFFF"
        accessibilityLabel={accessibilityLabel || label}
      />
    </View>
  );

  // Section header component
  const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <Text style={[styles.sectionHeader, { color: theme.colors.text.secondary }]}>{title}</Text>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {i18n.t('settingsScreen.title')}
          </Text>
        </View>

        {/* Security Section */}
        <SectionHeader title={i18n.t('settingsScreen.sections.security')} />
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <SettingItem
            testID="security-settings"
            label={i18n.t('settingsScreen.items.securitySettings')}
            onPress={() => navigation.navigate('SecuritySettings')}
            accessibilityLabel={i18n.t('settingsScreen.items.securitySettings')}
          />
          <SettingItem
            testID="backup-wallet"
            label={i18n.t('settingsScreen.items.backupWallet')}
            onPress={() => navigation.navigate('BackupWallet')}
          />
        </View>

        {/* Network Section */}
        <SectionHeader title={i18n.t('settingsScreen.sections.network')} />
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <SettingItem
            testID="network-selector"
            label={i18n.t('settingsScreen.items.network')}
            value={currentNetwork?.name || 'Ethereum'}
            onPress={() => setNetworkModalVisible(true)}
          />
          <SettingToggle
            testID="testnet-toggle"
            label={i18n.t('settingsScreen.items.showTestnets')}
            value={showTestnets}
            onValueChange={handleToggleTestnets}
          />
        </View>

        {/* Preferences Section */}
        <SectionHeader title={i18n.t('settingsScreen.sections.preferences')} />
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <SettingToggle
            testID="theme-toggle"
            label={i18n.t('settingsScreen.items.darkMode')}
            value={isDark}
            onValueChange={toggleTheme}
            accessibilityLabel={i18n.t('settingsScreen.items.darkMode')}
          />
          <SettingItem
            testID="currency-selector"
            label={i18n.t('settingsScreen.items.currency')}
            value={currency}
            onPress={() => {}}
          />
          <SettingItem
            testID="language-selector"
            label={i18n.t('settingsScreen.items.language')}
            value={getCurrentLanguageDisplay()}
            onPress={handleLanguageChange}
          />
          <SettingToggle
            testID="notifications-toggle"
            label={i18n.t('settingsScreen.items.notifications')}
            value={notifications}
            onValueChange={setNotifications}
          />
        </View>

        {/* About Section */}
        <SectionHeader title={i18n.t('settingsScreen.sections.about')} />
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <SettingItem
            testID="app-version"
            label={i18n.t('settingsScreen.items.version')}
            value="1.0.0"
            showArrow={false}
          />
          <SettingItem
            testID="terms-of-service"
            label={i18n.t('settingsScreen.items.termsOfService')}
            onPress={() => {}}
          />
          <SettingItem
            testID="privacy-policy"
            label={i18n.t('settingsScreen.items.privacyPolicy')}
            onPress={() => {}}
          />
        </View>

        {/* Danger Zone */}
        <SectionHeader title={i18n.t('settingsScreen.sections.dangerZone')} />
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <SettingItem
            testID="reset-wallet"
            label={i18n.t('settingsScreen.items.resetWallet')}
            onPress={() => {}}
            danger={true}
            showArrow={false}
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Network Selector Modal */}
      <NetworkSelectorModal
        visible={networkModalVisible}
        networks={networks}
        selectedNetworkId={currentNetwork?.id ?? ''}
        showTestnets={showTestnets}
        onSelect={handleNetworkSelect}
        onClose={() => setNetworkModalVisible(false)}
        onToggleTestnets={handleToggleTestnets}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  arrow: {
    fontSize: 20,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  safeArea: {
    flex: 1,
  },
  section: {
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 16,
    marginTop: 24,
    textTransform: 'uppercase',
  },
  settingItem: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingRight: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  settingValue: {
    fontSize: 16,
    marginRight: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
