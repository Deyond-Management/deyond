/**
 * QRScanner Component
 * Modal for scanning QR codes using device camera
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { Camera, CameraView, BarcodeScanningResult } from 'expo-camera';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './atoms/Button';

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ visible, onClose, onScan }) => {
  const { theme } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const requestPermission = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    if (visible) {
      requestPermission();
    }
  }, [visible]);

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    if (!scanned) {
      setScanned(true);
      onScan(data);
      setTimeout(() => {
        setScanned(false);
        onClose();
      }, 500);
    }
  };

  if (!visible) return null;

  if (hasPermission === null) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.9)' }]}>
          <Text style={[styles.text, { color: theme.colors.text.primary }]}>
            Requesting camera permission...
          </Text>
        </View>
      </Modal>
    );
  }

  if (hasPermission === false) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.9)' }]}>
          <Text style={[styles.text, { color: theme.colors.text.primary }]}>
            Camera permission denied
          </Text>
          <Button onPress={onClose} style={styles.button}>
            Close
          </Button>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: 'white' }]}>Scan QR Code</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.scanArea}>
            <View style={styles.corner} />
          </View>
          <Text style={[styles.instructions, { color: 'white' }]}>
            Align QR code within the frame
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 20,
  },
  camera: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
  },
  closeButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  closeText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  corner: {
    borderColor: 'white',
    borderRadius: 20,
    borderWidth: 3,
    height: 250,
    width: 250,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  instructions: {
    fontSize: 16,
    marginTop: 40,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  scanArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
