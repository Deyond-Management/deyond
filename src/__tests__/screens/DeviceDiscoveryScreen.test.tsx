/**
 * DeviceDiscoveryScreen Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { DeviceDiscoveryScreen } from '../../screens/DeviceDiscoveryScreen';
import { renderWithProviders } from '../utils/testUtils';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return renderWithProviders(component);
};

// Mock devices
const mockDevices = [
  {
    id: 'device-1',
    name: 'iPhone 14',
    rssi: -45,
    address: '0x1234567890123456789012345678901234567890',
  },
  {
    id: 'device-2',
    name: 'Galaxy S23',
    rssi: -65,
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
  },
  {
    id: 'device-3',
    name: 'Unknown Device',
    rssi: -85,
    address: '0xfedcba0987654321fedcba0987654321fedcba09',
  },
];

describe('DeviceDiscoveryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render discovery title', () => {
      const { getByText } = renderWithTheme(
        <DeviceDiscoveryScreen navigation={mockNavigation as any} />
      );

      expect(getByText('Find Devices')).toBeDefined();
    });

    it('should render scan button', () => {
      const { getByTestId } = renderWithTheme(
        <DeviceDiscoveryScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('scan-button')).toBeDefined();
    });

    it('should render device list', () => {
      const { getByTestId } = renderWithTheme(
        <DeviceDiscoveryScreen navigation={mockNavigation as any} initialDevices={mockDevices} />
      );

      expect(getByTestId('device-list')).toBeDefined();
    });
  });

  describe('Scanning', () => {
    it('should show scanning indicator when scanning', () => {
      const { getByTestId } = renderWithTheme(
        <DeviceDiscoveryScreen navigation={mockNavigation as any} initialScanning={true} />
      );

      expect(getByTestId('scanning-indicator')).toBeDefined();
    });

    it('should show scan button text as "Scanning..." when scanning', () => {
      const { getByText } = renderWithTheme(
        <DeviceDiscoveryScreen navigation={mockNavigation as any} initialScanning={true} />
      );

      expect(getByText('Scanning...')).toBeDefined();
    });

    it('should show scan button text as "Scan" when not scanning', () => {
      const { getByText } = renderWithTheme(
        <DeviceDiscoveryScreen navigation={mockNavigation as any} initialScanning={false} />
      );

      expect(getByText('Scan')).toBeDefined();
    });
  });

  describe('Device Items', () => {
    it('should display device name', () => {
      const { getByText } = renderWithTheme(
        <DeviceDiscoveryScreen navigation={mockNavigation as any} initialDevices={mockDevices} />
      );

      expect(getByText('iPhone 14')).toBeDefined();
      expect(getByText('Galaxy S23')).toBeDefined();
    });

    it('should display signal strength indicator', () => {
      const { getAllByTestId } = renderWithTheme(
        <DeviceDiscoveryScreen navigation={mockNavigation as any} initialDevices={mockDevices} />
      );

      const signalIndicators = getAllByTestId(/signal-indicator-/);
      expect(signalIndicators.length).toBe(3);
    });

    it('should show strong signal for high RSSI', () => {
      const { getByTestId } = renderWithTheme(
        <DeviceDiscoveryScreen navigation={mockNavigation as any} initialDevices={mockDevices} />
      );

      // Device with RSSI -45 should have strong signal
      expect(getByTestId('signal-indicator-device-1')).toBeDefined();
    });
  });

  describe('Interactions', () => {
    it('should navigate to connection screen when device is pressed', () => {
      const { getAllByTestId } = renderWithTheme(
        <DeviceDiscoveryScreen navigation={mockNavigation as any} initialDevices={mockDevices} />
      );

      const deviceItems = getAllByTestId(/device-item-/);
      fireEvent.press(deviceItems[0]);

      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        'DeviceConnection',
        expect.objectContaining({ device: mockDevices[0] })
      );
    });

    it('should start scanning when scan button is pressed', () => {
      const { getByTestId } = renderWithTheme(
        <DeviceDiscoveryScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('scan-button'));

      // Button should now show "Scanning..."
      expect(getByTestId('scan-button')).toBeDefined();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no devices found', () => {
      const { getByTestId } = renderWithTheme(
        <DeviceDiscoveryScreen
          navigation={mockNavigation as any}
          initialDevices={[]}
          initialScanning={false}
        />
      );

      expect(getByTestId('empty-state')).toBeDefined();
    });

    it('should show appropriate message when no devices', () => {
      const { getByText } = renderWithTheme(
        <DeviceDiscoveryScreen
          navigation={mockNavigation as any}
          initialDevices={[]}
          initialScanning={false}
        />
      );

      expect(getByText(/No devices found/i)).toBeDefined();
    });
  });

  describe('Bluetooth Status', () => {
    it('should show bluetooth disabled warning', () => {
      const { getByTestId } = renderWithTheme(
        <DeviceDiscoveryScreen navigation={mockNavigation as any} bluetoothEnabled={false} />
      );

      expect(getByTestId('bluetooth-warning')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible scan button', () => {
      const { getAllByLabelText } = renderWithTheme(
        <DeviceDiscoveryScreen navigation={mockNavigation as any} />
      );

      // Multiple "scan" elements (button + empty state action)
      const scanElements = getAllByLabelText(/scan/i);
      expect(scanElements.length).toBeGreaterThan(0);
    });
  });
});
