/**
 * TransactionCard Component
 * Display transaction information in a card
 * Shows type, amount, address, timestamp, and status
 */

import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { useTheme } from '../../contexts/ThemeContext';

export type TransactionType = 'sent' | 'received' | 'contract';
export type TransactionStatus = 'confirmed' | 'pending' | 'failed';

export interface TransactionCardProps {
  /** Transaction type */
  type: TransactionType;
  /** Transaction amount */
  amount: string;
  /** Token symbol */
  symbol: string;
  /** Recipient address */
  to?: string;
  /** Sender address */
  from?: string;
  /** Transaction timestamp */
  timestamp: number;
  /** Transaction status */
  status: TransactionStatus;
  /** Transaction hash */
  hash: string;
  /** Custom style */
  style?: ViewStyle;
  /** On press handler */
  onPress?: () => void;
  /** Test ID */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  type,
  amount,
  symbol,
  to,
  from,
  timestamp,
  status,
  hash,
  style,
  onPress,
  testID,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();

  // Get transaction type display
  const getTypeDisplay = (): string => {
    switch (type) {
      case 'sent':
        return 'Sent';
      case 'received':
        return 'Received';
      case 'contract':
        return 'Contract';
      default:
        return 'Unknown';
    }
  };

  // Get amount display with sign
  const getAmountDisplay = (): string => {
    const sign = type === 'received' ? '+' : type === 'sent' ? '-' : '';
    return `${sign}${amount} ${symbol}`;
  };

  // Get amount color
  const getAmountColor = (): string => {
    if (type === 'received') {
      return theme.isDark ? '#4CAF50' : '#388E3C';
    } else if (type === 'sent') {
      return theme.isDark ? '#EF5350' : '#D32F2F';
    }
    return theme.colors.text.primary;
  };

  // Get address display
  const getAddressDisplay = (): string => {
    if (type === 'sent' && to) {
      return `To: ${to}`;
    } else if (type === 'received' && from) {
      return `From: ${from}`;
    } else if (type === 'contract' && to) {
      return `Contract: ${to}`;
    }
    return '';
  };

  // Format timestamp
  const formatTimestamp = (): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Get status badge variant
  const getStatusVariant = (): 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'neutral' as any;
    }
  };

  // Get status display
  const getStatusDisplay = (): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Get transaction icon (using text emoji for simplicity)
  const getTransactionIcon = (): string => {
    switch (type) {
      case 'sent':
        return '↑';
      case 'received':
        return '↓';
      case 'contract':
        return '⚙';
      default:
        return '•';
    }
  };

  // Content style
  const contentStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
  };

  // Icon container style
  const iconContainerStyle: ViewStyle = {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.isDark ? '#424242' : '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  };

  // Icon style
  const iconStyle: TextStyle = {
    fontSize: 20,
    color: theme.colors.text.primary,
  };

  // Info container style
  const infoContainerStyle: ViewStyle = {
    flex: 1,
  };

  // Values container style
  const valuesContainerStyle: ViewStyle = {
    alignItems: 'flex-end',
  };

  // Type text style
  const typeTextStyle: TextStyle = {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  };

  // Address text style
  const addressTextStyle: TextStyle = {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  };

  // Timestamp text style
  const timestampTextStyle: TextStyle = {
    fontSize: 12,
    color: theme.colors.text.hint,
  };

  // Amount text style
  const amountTextStyle: TextStyle = {
    fontSize: 16,
    fontWeight: '600',
    color: getAmountColor(),
    marginBottom: 4,
    textAlign: 'right',
  };

  // Generate default accessibility label
  const getAccessibilityLabel = (): string => {
    if (accessibilityLabel) return accessibilityLabel;
    return `${getTypeDisplay()} ${amount} ${symbol}, ${getAddressDisplay()}, ${formatTimestamp()}, ${getStatusDisplay()}`;
  };

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
        {/* Transaction Icon */}
        <View style={iconContainerStyle} testID="tx-icon">
          <Text style={iconStyle}>{getTransactionIcon()}</Text>
        </View>

        {/* Transaction Info */}
        <View style={infoContainerStyle}>
          <Text style={typeTextStyle}>{getTypeDisplay()}</Text>
          {getAddressDisplay() && <Text style={addressTextStyle}>{getAddressDisplay()}</Text>}
          <Text style={timestampTextStyle} testID="tx-timestamp">
            {formatTimestamp()}
          </Text>
        </View>

        {/* Transaction Values */}
        <View style={valuesContainerStyle}>
          <Text style={amountTextStyle}>{getAmountDisplay()}</Text>
          <Badge variant={getStatusVariant()} size="small">
            {getStatusDisplay()}
          </Badge>
        </View>
      </View>
    </Card>
  );
};

export default TransactionCard;
