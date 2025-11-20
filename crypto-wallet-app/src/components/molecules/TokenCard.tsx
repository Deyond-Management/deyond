/**
 * TokenCard Component
 * Display cryptocurrency token information
 * Shows balance, USD value, and price changes
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  ImageSourcePropType,
} from 'react-native';
import { Card } from '../atoms/Card';
import { useTheme } from '../../contexts/ThemeContext';

export interface TokenCardProps {
  /** Token symbol (e.g., ETH, BTC) */
  symbol: string;
  /** Token name (e.g., Ethereum, Bitcoin) */
  name: string;
  /** Token balance */
  balance: string;
  /** USD value */
  usdValue: string;
  /** 24h price change percentage */
  priceChange24h?: number;
  /** Token icon URL */
  iconUrl?: string;
  /** Loading state */
  loading?: boolean;
  /** Custom style */
  style?: ViewStyle;
  /** On press handler */
  onPress?: () => void;
  /** Test ID */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  symbol,
  name,
  balance,
  usdValue,
  priceChange24h = 0,
  iconUrl,
  loading = false,
  style,
  onPress,
  testID,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();

  // Format USD value with commas
  const formatUSD = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return '$0.00';
    return `$${num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Format price change
  const formatPriceChange = (change: number): string => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  // Get price change color
  const getPriceChangeColor = (): string => {
    if (priceChange24h > 0) {
      return theme.isDark ? '#4CAF50' : '#388E3C';
    } else if (priceChange24h < 0) {
      return theme.isDark ? '#EF5350' : '#D32F2F';
    }
    return theme.colors.text.secondary;
  };

  // Container style
  const containerStyle: ViewStyle = {
    padding: theme.spacing.md,
  };

  // Content style
  const contentStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
  };

  // Icon style
  const iconStyle: ViewStyle = {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.md,
  };

  // Info container style
  const infoContainerStyle: ViewStyle = {
    flex: 1,
  };

  // Values container style
  const valuesContainerStyle: ViewStyle = {
    alignItems: 'flex-end',
  };

  // Token name style
  const tokenNameStyle: TextStyle = {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  };

  // Token symbol style
  const tokenSymbolStyle: TextStyle = {
    fontSize: 14,
    color: theme.colors.text.secondary,
  };

  // Balance style
  const balanceStyle: TextStyle = {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
    textAlign: 'right',
  };

  // USD value style
  const usdValueStyle: TextStyle = {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
    textAlign: 'right',
  };

  // Price change style
  const priceChangeStyle: TextStyle = {
    fontSize: 12,
    fontWeight: '600',
    color: getPriceChangeColor(),
    textAlign: 'right',
  };

  // Generate default accessibility label
  const getAccessibilityLabel = (): string => {
    if (accessibilityLabel) return accessibilityLabel;
    return `${name}, ${balance} ${symbol}, ${formatUSD(usdValue)}, ${formatPriceChange(priceChange24h)}`;
  };

  // Loading state
  if (loading) {
    return (
      <Card
        style={[containerStyle, style]}
        testID={testID}
        elevation={1}
      >
        <View style={{ alignItems: 'center', paddingVertical: theme.spacing.lg }}>
          <ActivityIndicator
            size="large"
            color={theme.colors.text.primary}
            testID="loading-indicator"
          />
        </View>
      </Card>
    );
  }

  return (
    <Card
      style={style}
      onPress={onPress}
      testID={testID}
      accessibilityLabel={getAccessibilityLabel()}
      elevation={1}
      padding="md"
    >
      <View style={contentStyle}>
        {/* Token Icon */}
        {iconUrl ? (
          <Image
            source={{ uri: iconUrl } as ImageSourcePropType}
            style={iconStyle}
            testID="token-icon"
          />
        ) : (
          <View
            style={[
              iconStyle,
              {
                backgroundColor: theme.isDark ? '#424242' : '#E0E0E0',
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
            testID="token-fallback-icon"
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.colors.text.primary,
              }}
            >
              {symbol.charAt(0)}
            </Text>
          </View>
        )}

        {/* Token Info */}
        <View style={infoContainerStyle}>
          <Text style={tokenNameStyle}>{name}</Text>
          <Text style={tokenSymbolStyle}>{symbol}</Text>
        </View>

        {/* Token Values */}
        <View style={valuesContainerStyle}>
          <Text style={balanceStyle}>
            {balance} {symbol}
          </Text>
          <Text style={usdValueStyle}>{formatUSD(usdValue)}</Text>
          <Text style={priceChangeStyle}>
            {formatPriceChange(priceChange24h)}
          </Text>
        </View>
      </View>
    </Card>
  );
};

export default TokenCard;
