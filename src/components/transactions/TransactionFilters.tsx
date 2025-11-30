/**
 * TransactionFilters Component
 * Basic and advanced filters for transaction history
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import i18n from '../../i18n';

export type FilterType = 'all' | 'sent' | 'received';
export type DateRangeFilter = 'today' | 'thisWeek' | 'thisMonth' | 'allTime';
export type StatusFilter = 'allStatus' | 'pending' | 'confirmed' | 'failed';

interface TransactionFiltersProps {
  filter: FilterType;
  dateRangeFilter: DateRangeFilter;
  statusFilter: StatusFilter;
  tokenFilter: string;
  availableTokens: string[];
  showAdvancedFilters: boolean;
  onFilterChange: (filter: FilterType) => void;
  onDateRangeChange: (range: DateRangeFilter) => void;
  onStatusFilterChange: (status: StatusFilter) => void;
  onTokenFilterChange: (token: string) => void;
  onToggleAdvancedFilters: () => void;
  onClearFilters: () => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filter,
  dateRangeFilter,
  statusFilter,
  tokenFilter,
  availableTokens,
  showAdvancedFilters,
  onFilterChange,
  onDateRangeChange,
  onStatusFilterChange,
  onTokenFilterChange,
  onToggleAdvancedFilters,
  onClearFilters,
}) => {
  const { theme } = useTheme();

  // Check if any advanced filter is active
  const hasActiveAdvancedFilters = useMemo(() => {
    return dateRangeFilter !== 'allTime' || statusFilter !== 'allStatus' || tokenFilter !== 'all';
  }, [dateRangeFilter, statusFilter, tokenFilter]);

  // Render basic filter button
  const renderFilterButton = (filterType: FilterType, label: string) => (
    <TouchableOpacity
      key={filterType}
      testID={`filter-${filterType}`}
      style={[
        styles.filterButton,
        filter === filterType && {
          backgroundColor: theme.colors.primary,
        },
        filter !== filterType && {
          backgroundColor: theme.colors.surface,
        },
      ]}
      onPress={() => onFilterChange(filterType)}
    >
      <Text
        style={[
          styles.filterText,
          {
            color: filter === filterType ? '#FFFFFF' : theme.colors.text.primary,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      {/* Basic Filters */}
      <View style={styles.filters}>
        {renderFilterButton('all', i18n.t('transactionHistory.filters.all'))}
        {renderFilterButton('sent', i18n.t('transactionHistory.filters.sent'))}
        {renderFilterButton('received', i18n.t('transactionHistory.filters.received'))}
      </View>

      {/* Advanced Filters Toggle */}
      <TouchableOpacity
        testID="advanced-filters-toggle"
        style={styles.advancedToggle}
        onPress={onToggleAdvancedFilters}
      >
        <Text style={[styles.advancedToggleText, { color: theme.colors.primary }]}>
          {showAdvancedFilters ? '▼' : '▶'} {i18n.t('transactionHistory.filterBy')}
          {hasActiveAdvancedFilters && ' (Active)'}
        </Text>
      </TouchableOpacity>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <View style={[styles.advancedFilters, { backgroundColor: theme.colors.surface }]}>
          {/* Date Range */}
          <Text style={[styles.filterLabel, { color: theme.colors.text.secondary }]}>
            {i18n.t('transactionHistory.dateRange')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {(['allTime', 'today', 'thisWeek', 'thisMonth'] as DateRangeFilter[]).map(range => (
              <TouchableOpacity
                key={range}
                testID={`date-filter-${range}`}
                style={[
                  styles.smallFilterButton,
                  dateRangeFilter === range && {
                    backgroundColor: theme.colors.primary,
                  },
                  dateRangeFilter !== range && {
                    backgroundColor: theme.isDark ? '#424242' : '#E0E0E0',
                  },
                ]}
                onPress={() => onDateRangeChange(range)}
              >
                <Text
                  style={[
                    styles.smallFilterText,
                    {
                      color: dateRangeFilter === range ? '#FFFFFF' : theme.colors.text.primary,
                    },
                  ]}
                >
                  {i18n.t(`transactionHistory.filters.${range}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Status Filter */}
          <Text style={[styles.filterLabel, { color: theme.colors.text.secondary }]}>
            {i18n.t('transactionHistory.status')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {(['allStatus', 'pending', 'confirmed', 'failed'] as StatusFilter[]).map(status => (
              <TouchableOpacity
                key={status}
                testID={`status-filter-${status}`}
                style={[
                  styles.smallFilterButton,
                  statusFilter === status && {
                    backgroundColor: theme.colors.primary,
                  },
                  statusFilter !== status && {
                    backgroundColor: theme.isDark ? '#424242' : '#E0E0E0',
                  },
                ]}
                onPress={() => onStatusFilterChange(status)}
              >
                <Text
                  style={[
                    styles.smallFilterText,
                    {
                      color: statusFilter === status ? '#FFFFFF' : theme.colors.text.primary,
                    },
                  ]}
                >
                  {i18n.t(`transactionHistory.filters.${status}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Token Filter */}
          <Text style={[styles.filterLabel, { color: theme.colors.text.secondary }]}>
            {i18n.t('transactionHistory.token')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {availableTokens.map(token => (
              <TouchableOpacity
                key={token}
                testID={`token-filter-${token}`}
                style={[
                  styles.smallFilterButton,
                  tokenFilter === token && {
                    backgroundColor: theme.colors.primary,
                  },
                  tokenFilter !== token && {
                    backgroundColor: theme.isDark ? '#424242' : '#E0E0E0',
                  },
                ]}
                onPress={() => onTokenFilterChange(token)}
              >
                <Text
                  style={[
                    styles.smallFilterText,
                    {
                      color: tokenFilter === token ? '#FFFFFF' : theme.colors.text.primary,
                    },
                  ]}
                >
                  {token === 'all' ? i18n.t('transactionHistory.filters.allTokens') : token}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Clear Filters Button */}
          {hasActiveAdvancedFilters && (
            <TouchableOpacity
              testID="clear-filters-button"
              style={[styles.clearButton, { borderColor: theme.colors.primary }]}
              onPress={onClearFilters}
            >
              <Text style={[styles.clearButtonText, { color: theme.colors.primary }]}>
                {i18n.t('transactionHistory.clearFilters')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  advancedFilters: {
    borderRadius: 8,
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 12,
  },
  advancedToggle: {
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  advancedToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  filterRow: {
    flexGrow: 0,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  smallFilterButton: {
    borderRadius: 16,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
