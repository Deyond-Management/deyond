/**
 * GasTrackerCard Component
 * Displays current gas prices and allows speed selection
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Card } from './atoms/Card';
import { GasService, GasPrices, GasPreset } from '../services/blockchain/GasService';
import i18n from '../i18n';

interface GasTrackerCardProps {
  onSelectGasPrice?: (speed: 'slow' | 'standard' | 'fast', preset: GasPreset) => void;
  selectedSpeed?: 'slow' | 'standard' | 'fast';
  showSelector?: boolean;
}

export const GasTrackerCard: React.FC<GasTrackerCardProps> = ({
  onSelectGasPrice,
  selectedSpeed = 'standard',
  showSelector = false,
}) => {
  const { theme } = useTheme();
  const [gasPrices, setGasPrices] = useState<GasPrices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [gasService] = useState(() => new GasService());

  // Fetch gas prices
  const fetchGasPrices = useCallback(async () => {
    try {
      setError(false);
      const prices = await gasService.getGasPrices();
      setGasPrices(prices);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [gasService]);

  // Initial fetch
  useEffect(() => {
    fetchGasPrices();
  }, [fetchGasPrices]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchGasPrices();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchGasPrices]);

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    if (seconds < 60) {
      return i18n.t('gasTracker.seconds', { count: seconds });
    }
    const minutes = Math.round(seconds / 60);
    return i18n.t('gasTracker.minutes', { count: minutes });
  }, []);

  // Handle gas speed selection
  const handleSelectSpeed = useCallback(
    (speed: 'slow' | 'standard' | 'fast') => {
      if (gasPrices && onSelectGasPrice) {
        onSelectGasPrice(speed, gasPrices[speed]);
      }
    },
    [gasPrices, onSelectGasPrice]
  );

  // Render gas option
  const renderGasOption = useCallback(
    (speed: 'slow' | 'standard' | 'fast', label: string, preset: GasPreset) => {
      const isSelected = showSelector && selectedSpeed === speed;

      return (
        <TouchableOpacity
          key={speed}
          testID={`gas-option-${speed}`}
          style={[
            styles.gasOption,
            {
              backgroundColor: isSelected ? theme.colors.primary + '20' : theme.colors.surface,
              borderColor: isSelected ? theme.colors.primary : theme.colors.divider,
            },
          ]}
          onPress={() => handleSelectSpeed(speed)}
          disabled={!showSelector}
        >
          <Text style={[styles.speedLabel, { color: theme.colors.text.secondary }]}>{label}</Text>
          <Text
            testID={`gas-price-${speed}`}
            style={[
              styles.gasPrice,
              { color: isSelected ? theme.colors.primary : theme.colors.text.primary },
            ]}
          >
            {preset.maxFeePerGas} {i18n.t('gasTracker.gwei')}
          </Text>
          <Text style={[styles.estimatedTime, { color: theme.colors.text.secondary }]}>
            {i18n.t('gasTracker.estimatedTime', { time: formatTime(preset.estimatedTime) })}
          </Text>
        </TouchableOpacity>
      );
    },
    [showSelector, selectedSpeed, theme, handleSelectSpeed, formatTime]
  );

  if (loading) {
    return (
      <Card style={styles.card} elevation={1}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator testID="loading-indicator" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            {i18n.t('gasTracker.updating')}
          </Text>
        </View>
      </Card>
    );
  }

  if (error || !gasPrices) {
    return (
      <Card style={styles.card} elevation={1}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {i18n.t('errors.generic')}
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card} elevation={1} testID="gas-tracker-card">
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {showSelector ? i18n.t('gasTracker.selectSpeed') : i18n.t('gasTracker.currentGasPrices')}
        </Text>
        <Text style={[styles.baseFee, { color: theme.colors.text.secondary }]}>
          {i18n.t('gasTracker.baseFee')}: {gasPrices.baseFee} {i18n.t('gasTracker.gwei')}
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {renderGasOption('slow', i18n.t('gasTracker.slow'), gasPrices.slow)}
        {renderGasOption('standard', i18n.t('gasTracker.standard'), gasPrices.standard)}
        {renderGasOption('fast', i18n.t('gasTracker.fast'), gasPrices.fast)}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  baseFee: {
    fontSize: 12,
  },
  card: {
    marginBottom: 16,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
  },
  estimatedTime: {
    fontSize: 11,
    marginTop: 2,
  },
  gasOption: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
  },
  gasPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  header: {
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
  },
  speedLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
});

export default GasTrackerCard;
