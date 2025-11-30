/**
 * BalanceCard Component
 * Displays total wallet balance
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import i18n from '../../i18n';

interface BalanceCardProps {
  totalBalance: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ totalBalance }) => {
  const { theme } = useTheme();

  // Format total balance for display - memoized to prevent recalculation
  const formattedTotalBalance = useMemo(
    () =>
      parseFloat(totalBalance).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [totalBalance]
  );

  return (
    <View style={styles.balanceSection}>
      <Text style={[styles.balanceLabel, { color: theme.colors.text.secondary }]}>
        {i18n.t('home.totalBalance')}
      </Text>
      <Text
        style={[styles.balanceAmount, { color: theme.colors.text.primary }]}
        testID="total-balance"
      >
        ${formattedTotalBalance}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 24,
  },
});
