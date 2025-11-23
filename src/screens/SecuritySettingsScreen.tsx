/**
 * SecuritySettingsScreen
 * PIN, biometrics, and security preferences
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

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
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            testID="back-button"
            style={styles.backButton}
            onPress={handleBack}
            accessibilityLabel="Go back"
          >
            <Text style={[styles.backIcon, { color: theme.colors.primary }]}>
              ←
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Security
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Security Info */}
        <View
          testID="security-info"
          style={[styles.infoCard, { backgroundColor: theme.colors.primary + '15' }]}
        >
          <Text style={[styles.infoText, { color: theme.colors.primary }]}>
            Enable PIN and biometrics to protect your wallet from unauthorized access.
          </Text>
        </View>

        {/* PIN Section */}
        <Text style={[styles.sectionHeader, { color: theme.colors.text.secondary }]}>
          PIN
        </Text>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <View
            testID="pin-toggle"
            style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}
          >
            <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
              Enable PIN
            </Text>
            <Switch
              value={pinEnabled}
              onValueChange={handlePinToggle}
              trackColor={{ false: theme.colors.divider, true: theme.colors.primary }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Enable PIN"
            />
          </View>

          {pinEnabled && (
            <TouchableOpacity
              testID="change-pin"
              style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}
              onPress={() => {}}
            >
              <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                Change PIN
              </Text>
              <Text style={[styles.arrow, { color: theme.colors.text.secondary }]}>
                ›
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Biometrics Section */}
        <Text style={[styles.sectionHeader, { color: theme.colors.text.secondary }]}>
          Biometrics
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
                Use {biometricsType.toLowerCase()} to unlock
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
          Auto-lock
        </Text>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <TouchableOpacity
            testID="auto-lock"
            style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}
            onPress={() => {}}
          >
            <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
              Lock After
            </Text>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: theme.colors.text.secondary }]}>
                {autoLock}
              </Text>
              <Text style={[styles.arrow, { color: theme.colors.text.secondary }]}>
                ›
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Transaction Security */}
        <Text style={[styles.sectionHeader, { color: theme.colors.text.secondary }]}>
          Transactions
        </Text>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <View
            testID="require-auth-transactions"
            style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}
          >
            <View style={styles.settingLabelContainer}>
              <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                Require Authentication
              </Text>
              <Text style={[styles.settingSubLabel, { color: theme.colors.text.secondary }]}>
                For all transactions
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
          Sessions
        </Text>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <TouchableOpacity
            testID="active-sessions"
            style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}
            onPress={() => {}}
          >
            <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
              Active Sessions
            </Text>
            <Text style={[styles.arrow, { color: theme.colors.text.secondary }]}>
              ›
            </Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  infoCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
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
  settingLabelContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingSubLabel: {
    fontSize: 12,
    marginTop: 2,
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

export default SecuritySettingsScreen;
