/**
 * Receive Screen
 * Screen for receiving cryptocurrency
 * Displays wallet address and QR code
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';

interface ReceiveScreenProps {
  navigation: any;
}

export const ReceiveScreen: React.FC<ReceiveScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  // Mock wallet address - in real app, this would come from Redux
  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  // Handle copy to clipboard
  const handleCopyAddress = () => {
    Clipboard.setString(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle share
  const handleShare = () => {
    // In real app, would use React Native Share API
    console.log('Share:', walletAddress);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>Receive Crypto</Text>
          <Text style={[styles.instructions, { color: theme.colors.text.secondary }]}>
            Share this address to receive cryptocurrency
          </Text>
        </View>

        {/* QR Code Card */}
        <Card style={styles.card} elevation={2}>
          <View style={styles.qrContainer}>
            {/* QR Code Placeholder - in real app, would use QR code library */}
            <View
              style={[
                styles.qrPlaceholder,
                { backgroundColor: theme.isDark ? '#424242' : '#E0E0E0' },
              ]}
              testID="qr-code"
            >
              <Text style={[styles.qrText, { color: theme.colors.text.primary }]}>QR Code</Text>
              <Text style={[styles.qrSubtext, { color: theme.colors.text.secondary }]}>
                Scan to receive
              </Text>
            </View>
          </View>
        </Card>

        {/* Address Card */}
        <Card style={styles.card} elevation={1}>
          <Text style={[styles.addressLabel, { color: theme.colors.text.secondary }]}>
            Your Address
          </Text>
          <Text
            style={[styles.address, { color: theme.colors.text.primary }]}
            testID="wallet-address"
            selectable
          >
            {walletAddress}
          </Text>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <Button
            onPress={handleCopyAddress}
            variant={copied ? 'outlined' : 'primary'}
            size="large"
            fullWidth
            style={styles.button}
            accessibilityLabel="Copy Address"
          >
            {copied ? 'Copied!' : 'Copy Address'}
          </Button>

          <Button
            onPress={handleShare}
            variant="outlined"
            size="large"
            fullWidth
            style={styles.button}
            accessibilityLabel="Share"
          >
            Share
          </Button>
        </View>

        {/* Warning */}
        <Card style={styles.warningCard} backgroundColor={theme.isDark ? '#332800' : '#FFF3E0'}>
          <Text style={[styles.warningTitle, { color: theme.isDark ? '#FFB74D' : '#F57C00' }]}>
            ⚠️ Important
          </Text>
          <Text style={[styles.warningText, { color: theme.isDark ? '#FFE0B2' : '#EF6C00' }]}>
            Only send ETH and ERC-20 tokens to this address. Sending other assets may result in
            permanent loss.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  address: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  button: {
    marginBottom: 12,
  },
  buttonsContainer: {
    marginTop: 8,
  },
  card: {
    marginBottom: 16,
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
  },
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  qrPlaceholder: {
    alignItems: 'center',
    borderRadius: 12,
    height: 200,
    justifyContent: 'center',
    width: 200,
  },
  qrSubtext: {
    fontSize: 14,
  },
  qrText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  warningCard: {
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 18,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});

export default ReceiveScreen;
