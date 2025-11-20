/**
 * SettingsScreen
 * App settings and preferences
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

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
  const [notifications, setNotifications] = useState(true);
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('English');
  const [network, setNetwork] = useState('Ethereum Mainnet');

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
          <Text style={[styles.settingValue, { color: theme.colors.text.secondary }]}>
            {value}
          </Text>
        )}
        {showArrow && (
          <Text style={[styles.arrow, { color: theme.colors.text.secondary }]}>
            ›
          </Text>
        )}
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
    <View
      testID={testID}
      style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}
    >
      <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
        {label}
      </Text>
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
    <Text style={[styles.sectionHeader, { color: theme.colors.text.secondary }]}>
      {title}
    </Text>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Settings
          </Text>
        </View>

        {/* Security Section */}
        <SectionHeader title="Security" />
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <SettingItem
            testID="security-settings"
            label="Security Settings"
            onPress={() => navigation.navigate('SecuritySettings')}
            accessibilityLabel="Security settings"
          />
          <SettingItem
            testID="backup-wallet"
            label="Backup Wallet"
            onPress={() => navigation.navigate('BackupWallet')}
          />
        </View>

        {/* Network Section */}
        <SectionHeader title="Network" />
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <SettingItem
            testID="network-selector"
            label="Network"
            value={network}
            onPress={() => {}}
          />
        </View>

        {/* Preferences Section */}
        <SectionHeader title="Preferences" />
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <SettingToggle
            testID="theme-toggle"
            label="Dark Mode"
            value={isDark}
            onValueChange={toggleTheme}
            accessibilityLabel="Dark mode"
          />
          <SettingItem
            testID="currency-selector"
            label="Currency"
            value={currency}
            onPress={() => {}}
          />
          <SettingItem
            testID="language-selector"
            label="Language"
            value={language}
            onPress={() => {}}
          />
          <SettingToggle
            testID="notifications-toggle"
            label="Notifications"
            value={notifications}
            onValueChange={setNotifications}
          />
        </View>

        {/* About Section */}
        <SectionHeader title="About" />
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <SettingItem
            testID="app-version"
            label="Version"
            value="1.0.0"
            showArrow={false}
          />
          <SettingItem
            testID="terms-of-service"
            label="Terms of Service"
            onPress={() => {}}
          />
          <SettingItem
            testID="privacy-policy"
            label="Privacy Policy"
            onPress={() => {}}
          />
        </View>

        {/* Danger Zone */}
        <SectionHeader title="Danger Zone" />
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <SettingItem
            testID="reset-wallet"
            label="Reset Wallet"
            onPress={() => {}}
            danger={true}
            showArrow={false}
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginLeft: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 16,
    marginRight: 8,
  },
  arrow: {
    fontSize: 20,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
});

export default SettingsScreen;
