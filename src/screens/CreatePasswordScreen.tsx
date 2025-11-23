/**
 * CreatePasswordScreen
 * Screen for creating a new wallet password
 * Features: password strength meter, validation rules, password confirmation
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { useAppDispatch } from '../store/hooks';
import { setPassword as setReduxPassword } from '../store/slices/onboardingSlice';

interface CreatePasswordScreenProps {
  navigation: any;
}

interface ValidationRule {
  label: string;
  test: (password: string) => boolean;
}

type PasswordStrength = 'Weak' | 'Medium' | 'Strong';

export const CreatePasswordScreen: React.FC<CreatePasswordScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const dispatch = useAppDispatch();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  // Password validation rules
  const validationRules: ValidationRule[] = [
    { label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { label: 'One uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { label: 'One lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { label: 'One number', test: (pwd) => /\d/.test(pwd) },
    { label: 'One special character', test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
  ];

  // Calculate password strength
  const passwordStrength: PasswordStrength = useMemo(() => {
    const passedRules = validationRules.filter((rule) => rule.test(password)).length;

    if (passedRules <= 2) return 'Weak';
    if (passedRules <= 4) return 'Medium';
    return 'Strong';
  }, [password]);

  // Get strength color
  const getStrengthColor = (strength: PasswordStrength): string => {
    switch (strength) {
      case 'Weak':
        return '#F44336'; // Red
      case 'Medium':
        return '#FF9800'; // Orange
      case 'Strong':
        return '#4CAF50'; // Green
    }
  };

  // Validate password meets all rules
  const isPasswordValid = (): boolean => {
    return validationRules.every((rule) => rule.test(password));
  };

  // Handle password creation
  const handleCreate = () => {
    setError('');

    // Check if password meets all requirements
    if (!isPasswordValid()) {
      setError('Password must meet all requirements');
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Store password in Redux
    dispatch(setReduxPassword(password));

    // Navigate to DisplayMnemonic screen
    navigation.navigate('DisplayMnemonic', { password });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text.primary }]}>Create Password</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            This password will encrypt your wallet on this device
          </Text>
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Input
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            accessibilityLabel="Password input"
          />
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowPassword(!showPassword)}
            testID="toggle-password-visibility"
          >
            <Text style={{ color: colors.primary }}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Password Strength Meter */}
        {password.length > 0 && (
          <Card style={styles.strengthCard}>
            <Text style={[styles.strengthLabel, { color: colors.textSecondary }]}>
              Password Strength
            </Text>
            <View style={styles.strengthMeterContainer}>
              <View
                style={[
                  styles.strengthMeter,
                  {
                    width:
                      passwordStrength === 'Weak'
                        ? '33%'
                        : passwordStrength === 'Medium'
                        ? '66%'
                        : '100%',
                    backgroundColor: getStrengthColor(passwordStrength),
                  },
                ]}
              />
            </View>
            <Text style={[styles.strengthText, { color: getStrengthColor(passwordStrength) }]}>
              {passwordStrength}
            </Text>
          </Card>
        )}

        {/* Confirm Password Input */}
        <View style={[styles.inputContainer, { marginTop: spacing.md }]}>
          <Input
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            accessibilityLabel="Confirm password input"
          />
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            testID="toggle-confirm-password-visibility"
          >
            <Text style={{ color: colors.primary }}>
              {showConfirmPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Validation Rules */}
        <Card style={styles.rulesCard}>
          <Text style={[styles.rulesTitle, { color: colors.text.primary }]}>
            Password Requirements
          </Text>
          {validationRules.map((rule, index) => {
            const isValid = rule.test(password);
            return (
              <View key={index} style={styles.ruleRow}>
                <Text
                  style={[
                    styles.ruleIcon,
                    { color: isValid ? colors.success : colors.textSecondary },
                  ]}
                >
                  {isValid ? '✓' : '○'}
                </Text>
                <Text
                  style={[
                    styles.ruleText,
                    { color: isValid ? colors.text : colors.textSecondary },
                  ]}
                >
                  {rule.label}
                </Text>
              </View>
            );
          })}
        </Card>

        {/* Error Message */}
        {error.length > 0 && (
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        )}

        {/* Create Button */}
        <Button
          onPress={handleCreate}
          style={styles.createButton}
          accessibilityLabel="Create password button"
          testID="create-password-button"
        >
          Create
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  toggleButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 8,
  },
  strengthCard: {
    padding: 16,
    marginBottom: 16,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  strengthMeterContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  strengthMeter: {
    height: '100%',
    borderRadius: 4,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  rulesCard: {
    padding: 16,
    marginBottom: 16,
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  ruleText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  createButton: {
    marginTop: 8,
  },
});
