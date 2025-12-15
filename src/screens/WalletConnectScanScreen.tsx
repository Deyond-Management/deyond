/**
 * WalletConnectScanScreen
 * QR code scanner for WalletConnect pairing
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../contexts/ThemeContext';
import { getWalletConnectService } from '../services/walletconnect/WalletConnectService';
import i18n from '../i18n';

interface WalletConnectScanScreenProps {
  navigation: any;
  route?: {
    params?: {
      onScan?: (uri: string) => void;
    };
  };
}

export const WalletConnectScanScreen: React.FC<WalletConnectScanScreenProps> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);

  // Request camera permission on mount
  useEffect(() => {
    if (!permission?.granted && !permission?.canAskAgain) {
      Alert.alert(
        i18n.t('walletConnect.cameraPermissionTitle'),
        i18n.t('walletConnect.cameraPermissionMessage'),
        [
          { text: i18n.t('common.cancel'), style: 'cancel' },
          {
            text: i18n.t('common.settings'),
            onPress: () => Linking.openSettings(),
          },
        ]
      );
    }
  }, [permission]);

  // Handle QR code scan
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || !scanning) return;

    setScanned(true);
    setScanning(false);

    // Validate WalletConnect URI
    if (!data.startsWith('wc:')) {
      Alert.alert(i18n.t('walletConnect.invalidQR'), i18n.t('walletConnect.invalidQRMessage'), [
        {
          text: i18n.t('common.ok'),
          onPress: () => {
            setScanned(false);
            setScanning(true);
          },
        },
      ]);
      return;
    }

    try {
      // If callback provided, use it
      if (route?.params?.onScan) {
        route.params.onScan(data);
        navigation.goBack();
        return;
      }

      // Otherwise, pair directly
      const wcService = getWalletConnectService();
      await wcService.pair(data);

      Alert.alert(i18n.t('walletConnect.connecting'), i18n.t('walletConnect.connectingMessage'), [
        {
          text: i18n.t('common.ok'),
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to pair:', error);
      Alert.alert(i18n.t('common.error'), error.message || i18n.t('walletConnect.pairingFailed'), [
        {
          text: i18n.t('common.ok'),
          onPress: () => {
            setScanned(false);
            setScanning(true);
          },
        },
      ]);
    }
  };

  // Show permission request
  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.message, { color: theme.colors.text.primary }]}>
            {i18n.t('walletConnect.requestingPermission')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {i18n.t('walletConnect.cameraPermissionTitle')}
          </Text>
          <Text style={[styles.message, { color: theme.colors.text.secondary }]}>
            {i18n.t('walletConnect.cameraPermissionMessage')}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.buttonText}>{i18n.t('walletConnect.grantPermission')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.colors.primary }]}>
            {i18n.t('common.cancel')}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {i18n.t('walletConnect.scanQR')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={[styles.scanArea, { borderColor: theme.colors.primary }]}>
              {/* Corner markers */}
              <View
                style={[styles.corner, styles.cornerTopLeft, { borderColor: theme.colors.primary }]}
              />
              <View
                style={[
                  styles.corner,
                  styles.cornerTopRight,
                  { borderColor: theme.colors.primary },
                ]}
              />
              <View
                style={[
                  styles.corner,
                  styles.cornerBottomLeft,
                  { borderColor: theme.colors.primary },
                ]}
              />
              <View
                style={[
                  styles.corner,
                  styles.cornerBottomRight,
                  { borderColor: theme.colors.primary },
                ]}
              />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom}>
            <Text style={[styles.instructions, { color: '#FFF' }]}>
              {i18n.t('walletConnect.scanInstructions')}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backButton: {
    padding: 8,
    width: 80,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    borderRadius: 12,
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
  },
  centerContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    flex: 1,
  },
  corner: {
    borderWidth: 3,
    height: 40,
    position: 'absolute',
    width: 40,
  },
  cornerBottomLeft: {
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 0,
    borderTopWidth: 0,
    bottom: 0,
    left: 0,
  },
  cornerBottomRight: {
    borderBottomWidth: 3,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderTopWidth: 0,
    bottom: 0,
    right: 0,
  },
  cornerTopLeft: {
    borderBottomWidth: 0,
    borderLeftWidth: 3,
    borderRightWidth: 0,
    borderTopWidth: 3,
    left: 0,
    top: 0,
  },
  cornerTopRight: {
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderTopWidth: 3,
    right: 0,
    top: 0,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayBottom: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  overlayMiddle: {
    flexDirection: 'row',
  },
  overlaySide: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flex: 1,
  },
  overlayTop: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flex: 1,
  },
  placeholder: {
    width: 80,
  },
  scanArea: {
    borderRadius: 16,
    borderWidth: 2,
    height: 250,
    width: 250,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default WalletConnectScanScreen;
