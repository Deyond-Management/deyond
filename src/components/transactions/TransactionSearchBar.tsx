/**
 * TransactionSearchBar Component
 * Search bar for filtering transactions by address or hash
 */

import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import i18n from '../../i18n';

interface TransactionSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export const TransactionSearchBar: React.FC<TransactionSearchBarProps> = ({
  value,
  onChangeText,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.searchContainer}>
      <TextInput
        testID="search-input"
        style={[
          styles.searchInput,
          {
            backgroundColor: theme.isDark ? '#424242' : '#F5F5F5',
            color: theme.colors.text.primary,
          },
        ]}
        placeholder={i18n.t('transactionHistory.searchPlaceholder')}
        placeholderTextColor={theme.colors.text.secondary}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  searchInput: {
    borderRadius: 8,
    fontSize: 14,
    height: 44,
    paddingHorizontal: 16,
  },
});
