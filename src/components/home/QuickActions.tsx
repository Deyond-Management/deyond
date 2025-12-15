/**
 * QuickActions Component
 * Quick action buttons for Send, Receive, and Buy
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from '../atoms/Button';
import i18n from '../../i18n';

interface QuickActionsProps {
  onSend: () => void;
  onReceive: () => void;
  onBuy: () => void;
  onSwap: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onSend, onReceive, onBuy, onSwap }) => {
  return (
    <View style={styles.actionsContainer}>
      <Button
        testID="send-button"
        onPress={onSend}
        variant="primary"
        style={styles.actionButton}
        accessibilityLabel={i18n.t('home.send')}
      >
        {i18n.t('home.send')}
      </Button>
      <Button
        testID="receive-button"
        onPress={onReceive}
        variant="outlined"
        style={styles.actionButton}
        accessibilityLabel={i18n.t('home.receive')}
      >
        {i18n.t('home.receive')}
      </Button>
      <Button
        testID="swap-button"
        onPress={onSwap}
        variant="outlined"
        style={styles.actionButton}
        accessibilityLabel={i18n.t('home.swap')}
      >
        {i18n.t('home.swap')}
      </Button>
      <Button
        testID="buy-button"
        onPress={onBuy}
        variant="outlined"
        style={styles.actionButton}
        accessibilityLabel={i18n.t('home.buy')}
      >
        {i18n.t('home.buy')}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
});
