/**
 * SecuritySettingsScreen
 * PIN, biometrics, and security preferences
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import i18n from '../i18n';

interface SecuritySettingsScreenProps {
  navigation: any;
  initialPinEnabled?: boolean;
  initialBiometricsEnabled?: boolean;
  biometricsType?: string;
  initialAutoLock?: string;
  initialRequireAuthTransactions?: boolean;
}

export const SecuritySettingsScreen: React.FC<SecuritySettingsScreenProps> = ({
  navigation,
  initialPinEnabled = true,
  initialBiometricsEnabled = false,
  biometricsType = 'Biometrics',
  initialAutoLock = '5 minutes',
  initialRequireAuthTransactions = true,
}) => {
  const { theme } = useTheme();
  const [pinEnabled, setPinEnabled] = useState(initialPinEnabled);
  const [biometricsEnabled, setBiometricsEnabled] = useState(initialBiometricsEnabled);
  const [autoLock, setAutoLock] = useState(initialAutoLock);
  const [requireAuthTransactions, setRequireAuthTransactions] = useState(
    initialRequireAuthTransactions
  );

  // Handle back
  const handleBack = () => {
    navigation.goBack();
  };

  // Handle PIN toggle
  const handlePinToggle = (value: boolean) => {
    setPinEnabled(value);
    if (!value) {
      setBiometricsEnabled(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            testID="back-button"
            style={styles.backButton}
            onPress={handleBack}
            accessibilityLabel={i18n.t('common.back')}
          >
            <Text style={[styles.backIcon, { color: theme.colors.primary }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {i18n.t('securitySettings.title')}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Security Info */}
        <View
          testID="security-info"
          style={[styles.infoCard, { backgroundColor: theme.colors.primary + '15' }]}
        >
          <Text style={[styles.infoText, { color: theme.colors.primary }]}>
            {i18n.t('securitySettings.infoText')}
          </Text>
        </View>

        {/* PIN Section */}
        <Text style={[styles.sectionHeader, { color: theme.colors.text.secondary }]}>
          {i18n.t('securitySettings.sections.pin')}
        </Text>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <View
            testID="pin-toggle"
            style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}
          >
            <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
              {i18n.t('securitySettings.items.enablePin')}
            </Text>
            <Switch
              value={pinEnabled}
              onValueChange={handlePinToggle}
              trackColor={{ false: theme.colors.divider, true: theme.colors.primary }}
              thumbColor="#FFFFFF"
              accessibilityLabel={i18n.t('securitySettings.items.enablePin')}
            />
          </View>

          {pinEnabled && (
            <TouchableOpacity
              testID="change-pin"
              style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}
              onPress={() => {}}
            >
              <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                {i18n.t('securitySettings.items.changePin')}
              </Text>
              <Text style={[styles.arrow, { color: theme.colors.text.secondary }]}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Biometrics Section */}
        <Text style={[styles.sectionHeader, { color: theme.colors.text.secondary }]}>
          {i18n.t('securitySettings.sections.biometrics')}
        </Text>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <View
            testID="biometrics-toggle"
            style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}
            accessibilityState={{ disabled: !pinEnabled }}
          >
            <View>
              <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                {biometricsType}
              </Text>
              <Text style={[styles.settingSubLabel, { color: theme.colors.text.secondary }]}>
                {i18n.t('securitySettings.items.useBiometricsToUnlock', {
                  type: biometricsType.toLowerCase(),
                })}
              </Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: theme.colors.divider, true: theme.colors.primary }}
              thumbColor="#FFFFFF"
              disabled={!pinEnabled}
            />
          </View>
        </View>

        {/* Auto-lock Section */}
        <Text style={[styles.sectionHeader, { color: theme.colors.text.secondary }]}>
          {i18n.t('securitySettings.sections.autoLock')}
        </Text>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <TouchableOpacity
            testID="auto-lock"
            style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}
            onPress={() => {}}
          >
            <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
              {i18n.t('securitySettings.items.lockAfter')}
            </Text>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: theme.colors.text.secondary }]}>
                {autoLock}
              </Text>
              <Text style={[styles.arrow, { color: theme.colors.text.secondary }]}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Transaction Security */}
        <Text style={[styles.sectionHeader, { color: theme.colors.text.secondary }]}>
          {i18n.t('securitySettings.sections.transactions')}
        </Text>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <View
            testID="require-auth-transactions"
            style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}
          >
            <View style={styles.settingLabelContainer}>
              <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                {i18n.t('securitySettings.items.requireAuth')}
              </Text>
              <Text style={[styles.settingSubLabel, { color: theme.colors.text.secondary }]}>
                {i18n.t('securitySettings.items.requireAuthSubtext')}
              </Text>
            </View>
            <Switch
              value={requireAuthTransactions}
              onValueChange={setRequireAuthTransactions}
              trackColor={{ false: theme.colors.divider, true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Sessions */}
        <Text style={[styles.sectionHeader, { color: theme.colors.text.secondary }]}>
          {i18n.t('securitySettings.sections.sessions')}
        </Text>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <TouchableOpacity
            testID="active-sessions"
            style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}
            onPress={() => {}}
          >
            <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
              {i18n.t('securitySettings.items.activeSessions')}
            </Text>
            <Text style={[styles.arrow, { color: theme.colors.text.secondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  arrow: {
    fontSize: 20,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
  },
  bottomPadding: {
    height: 32,
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  infoCard: {
    borderRadius: 12,
    margin: 16,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  placeholder: {
    width: 40,
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
  settingLabelContainer: {
    flex: 1,
  },
  settingRight: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  settingSubLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  settingValue: {
    fontSize: 16,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default SecuritySettingsScreen;
