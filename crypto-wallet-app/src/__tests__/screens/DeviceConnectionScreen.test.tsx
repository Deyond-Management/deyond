/**
 * DeviceConnectionScreen Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { DeviceConnectionScreen } from '../../screens/DeviceConnectionScreen';
import { renderWithProviders } from '../utils/testUtils';

// Mock navigation and route
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
};

const mockRoute = {
  params: {
    device: {
      id: 'device-1',
      name: 'iPhone 14',
      rssi: -45,
      address: '0x1234567890123456789012345678901234567890',
    },
  },
};

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return renderWithProviders(component);
};

describe('DeviceConnectionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render device name', () => {
      const { getByText } = renderWithTheme(
        <DeviceConnectionScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByText('iPhone 14')).toBeDefined();
    });

    it('should render connection status', () => {
      const { getByTestId } = renderWithTheme(
        <DeviceConnectionScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByTestId('connection-status')).toBeDefined();
    });

    it('should render cancel button', () => {
      const { getByTestId } = renderWithTheme(
        <DeviceConnectionScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByTestId('cancel-button')).toBeDefined();
    });
  });

  describe('Connection States', () => {
    it('should show connecting state initially', () => {
      const { getByText } = renderWithTheme(
        <DeviceConnectionScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          initialState="connecting"
        />
      );

      expect(getByText(/Connecting/i)).toBeDefined();
    });

    it('should show pairing state', () => {
      const { getByText } = renderWithTheme(
        <DeviceConnectionScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          initialState="pairing"
        />
      );

      expect(getByText(/Pairing/i)).toBeDefined();
    });

    it('should show connected state', () => {
      const { getByText } = renderWithTheme(
        <DeviceConnectionScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          initialState="connected"
        />
      );

      expect(getByText(/Connected/i)).toBeDefined();
    });

    it('should show failed state', () => {
      const { getAllByText } = renderWithTheme(
        <DeviceConnectionScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          initialState="failed"
        />
      );

      expect(getAllByText(/Failed/i).length).toBeGreaterThan(0);
    });

    it('should show progress indicator when connecting', () => {
      const { getByTestId } = renderWithTheme(
        <DeviceConnectionScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          initialState="connecting"
        />
      );

      expect(getByTestId('connection-progress')).toBeDefined();
    });
  });

  describe('Pairing Code', () => {
    it('should display pairing code when in pairing state', () => {
      const { getByTestId } = renderWithTheme(
        <DeviceConnectionScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          initialState="pairing"
          pairingCode="123456"
        />
      );

      expect(getByTestId('pairing-code')).toBeDefined();
    });

    it('should show pairing code value', () => {
      const { getByText } = renderWithTheme(
        <DeviceConnectionScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          initialState="pairing"
          pairingCode="123456"
        />
      );

      expect(getByText('123456')).toBeDefined();
    });

    it('should have confirm button when pairing', () => {
      const { getByTestId } = renderWithTheme(
        <DeviceConnectionScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          initialState="pairing"
          pairingCode="123456"
        />
      );

      expect(getByTestId('confirm-pairing')).toBeDefined();
    });
  });

  describe('Actions', () => {
    it('should go back when cancel is pressed', () => {
      const { getByTestId } = renderWithTheme(
        <DeviceConnectionScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      fireEvent.press(getByTestId('cancel-button'));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('should show retry button on failure', () => {
      const { getByTestId } = renderWithTheme(
        <DeviceConnectionScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          initialState="failed"
        />
      );

      expect(getByTestId('retry-button')).toBeDefined();
    });

    it('should show continue button when connected', () => {
      const { getByTestId } = renderWithTheme(
        <DeviceConnectionScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          initialState="connected"
        />
      );

      expect(getByTestId('continue-button')).toBeDefined();
    });

    it('should navigate to chat when continue is pressed', () => {
      const { getByTestId } = renderWithTheme(
        <DeviceConnectionScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          initialState="connected"
        />
      );

      fireEvent.press(getByTestId('continue-button'));

      expect(mockNavigation.replace).toHaveBeenCalledWith(
        'ChatConversation',
        expect.objectContaining({
          peerName: 'iPhone 14',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should display error message on failure', () => {
      const { getByText } = renderWithTheme(
        <DeviceConnectionScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          initialState="failed"
          errorMessage="Connection timed out"
        />
      );

      expect(getByText('Connection timed out')).toBeDefined();
    });
  });

  describe('Device Info', () => {
    it('should display truncated device address', () => {
      const { getByText } = renderWithTheme(
        <DeviceConnectionScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByText(/0x1234...7890/)).toBeDefined();
    });

    it('should display signal strength', () => {
      const { getByTestId } = renderWithTheme(
        <DeviceConnectionScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByTestId('signal-strength')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible cancel button', () => {
      const { getByLabelText } = renderWithTheme(
        <DeviceConnectionScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByLabelText(/cancel/i)).toBeDefined();
    });

    it('should have accessible status indicator', () => {
      const { getByLabelText } = renderWithTheme(
        <DeviceConnectionScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          initialState="connecting"
        />
      );

      expect(getByLabelText(/connection status/i)).toBeDefined();
    });
  });
});
