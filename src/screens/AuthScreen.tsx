/**
 * AuthScreen
 * PIN/Biometrics unlock screen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import i18n from '../i18n';

interface AuthScreenProps {
  navigation: any;
  biometricsAvailable?: boolean;
  initialError?: string;
  attemptsRemaining?: number;
  isLocked?: boolean;
  lockoutTime?: number;
  onSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  navigation,
  biometricsAvailable = false,
  initialError = '',
  attemptsRemaining = 5,
  isLocked = false,
  lockoutTime = 0,
  onSuccess,
}) => {
  const { theme } = useTheme();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(initialError);

  const PIN_LENGTH = 6;

  // Handle number press
  const handleNumberPress = (num: string) => {
    if (isLocked || pin.length >= PIN_LENGTH) return;

    const newPin = pin + num;
    setPin(newPin);

    // Auto-submit when PIN is complete
    if (newPin.length === PIN_LENGTH) {
      handleSubmit(newPin);
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (isLocked || pin.length === 0) return;
    setPin(pin.slice(0, -1));
    setError('');
  };

  // Handle submit
  const handleSubmit = (submittedPin: string) => {
    // Mock verification - in real app, use SecurityService
    if (submittedPin === '123456') {
      onSuccess?.();
      navigation.replace?.('Home');
    } else {
      setError(i18n.t('auth.incorrectPin'));
      setPin('');
    }
  };

  // Handle biometrics
  const handleBiometrics = () => {
    // Mock biometrics success
    onSuccess?.();
    navigation.replace?.('Home');
  };

  // Render PIN dots
  const renderPinDots = () => {
    const dots = [];
    for (let i = 0; i < PIN_LENGTH; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.pinDot,
            {
              backgroundColor: i < pin.length ? theme.colors.primary : theme.colors.divider,
            },
          ]}
        />
      );
    }
    return dots;
  };

  // Render number key
  const renderKey = (value: string, label?: string) => (
    <TouchableOpacity
      testID={`pin-${value}`}
      style={[styles.key, { backgroundColor: theme.colors.card }]}
      onPress={() => handleNumberPress(value)}
      disabled={isLocked}
      accessibilityLabel={label || value}
      accessibilityState={{ disabled: isLocked }}
    >
      <Text style={[styles.keyText, { color: theme.colors.text.primary }]}>{value}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        {/* Lock Icon */}
        <View testID="lock-icon" style={styles.iconContainer}>
          <Text style={[styles.lockIcon, { color: theme.colors.primary }]}>🔒</Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {isLocked ? i18n.t('auth.locked') : i18n.t('auth.title')}
        </Text>

        {/* Lockout Message */}
        {isLocked && (
          <Text style={[styles.lockoutText, { color: theme.colors.error }]}>
            {i18n.t('auth.lockedMessage', { minutes: Math.ceil(lockoutTime / 60) })}
          </Text>
        )}

        {/* PIN Input */}
        <View testID="pin-input" style={styles.pinContainer}>
          {renderPinDots()}
        </View>

        {/* Error Message */}
        {error && !isLocked && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        )}

        {/* Attempts Remaining */}
        {attemptsRemaining < 5 && !isLocked && (
          <Text style={[styles.attemptsText, { color: theme.colors.text.secondary }]}>
            {i18n.t('auth.attemptsRemaining', { count: attemptsRemaining })}
          </Text>
        )}

        {/* Biometric Prompt */}
        {biometricsAvailable && (
          <View testID="biometric-prompt" style={styles.biometricPrompt}>
            <TouchableOpacity
              testID="use-pin-button"
              onPress={() => {}}
              style={styles.usePinButton}
            >
              <Text style={[styles.usePinText, { color: theme.colors.primary }]}>
                {i18n.t('auth.usePinInstead')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Number Pad */}
        <View testID="pin-pad" style={styles.numberPad}>
          <View style={styles.row}>
            {renderKey('1')}
            {renderKey('2')}
            {renderKey('3')}
          </View>
          <View style={styles.row}>
            {renderKey('4')}
            {renderKey('5')}
            {renderKey('6')}
          </View>
          <View style={styles.row}>
            {renderKey('7')}
            {renderKey('8')}
            {renderKey('9')}
          </View>
          <View style={styles.row}>
            {biometricsAvailable ? (
              <TouchableOpacity
                testID="biometrics-button"
                style={[styles.key, { backgroundColor: 'transparent' }]}
                onPress={handleBiometrics}
                disabled={isLocked}
              >
                <Text style={[styles.keyText, { color: theme.colors.primary }]}>👆</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.key, { backgroundColor: 'transparent' }]} />
            )}
            {renderKey('0')}
            <TouchableOpacity
              testID="key-delete"
              style={[styles.key, { backgroundColor: 'transparent' }]}
              onPress={handleDelete}
              disabled={isLocked}
              accessibilityLabel="Delete"
              accessibilityState={{ disabled: isLocked }}
            >
              <Text style={[styles.keyText, { color: theme.colors.text.primary }]}>⌫</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  attemptsText: {
    fontSize: 12,
    marginBottom: 16,
  },
  biometricPrompt: {
    alignItems: 'center',
    marginBottom: 16,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 8,
  },
  usePinButton: {
    padding: 8,
  },
  usePinText: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconContainer: {
    marginBottom: 24,
  },
  key: {
    alignItems: 'center',
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    margin: 8,
    width: 72,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '500',
  },
  lockIcon: {
    fontSize: 48,
  },
  lockoutText: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  numberPad: {
    marginTop: 16,
  },
  pinContainer: {
    flexDirection: 'row',
    marginVertical: 32,
  },
  pinDot: {
    borderRadius: 8,
    height: 16,
    marginHorizontal: 8,
    width: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
});

export default AuthScreen;
