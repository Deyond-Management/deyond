/**
 * NetworkStatus Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { NetworkStatus } from '../../components/NetworkStatus';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('NetworkStatus', () => {
  describe('Online State', () => {
    it('should not show banner when online', () => {
      const { queryByTestId } = renderWithTheme(
        <NetworkStatus isConnected={true} />
      );

      expect(queryByTestId('network-banner')).toBeNull();
    });
  });

  describe('Offline State', () => {
    it('should show banner when offline', () => {
      const { getByTestId } = renderWithTheme(
        <NetworkStatus isConnected={false} />
      );

      expect(getByTestId('network-banner')).toBeDefined();
    });

    it('should display offline message', () => {
      const { getByText } = renderWithTheme(
        <NetworkStatus isConnected={false} />
      );

      expect(getByText(/offline/i)).toBeDefined();
    });

    it('should show warning icon', () => {
      const { getByTestId } = renderWithTheme(
        <NetworkStatus isConnected={false} />
      );

      expect(getByTestId('offline-icon')).toBeDefined();
    });
  });

  describe('Network Type', () => {
    it('should display wifi indicator', () => {
      const { getByTestId } = renderWithTheme(
        <NetworkStatus isConnected={true} networkType="wifi" showIndicator />
      );

      expect(getByTestId('network-indicator')).toBeDefined();
    });

    it('should display cellular indicator', () => {
      const { getByTestId } = renderWithTheme(
        <NetworkStatus isConnected={true} networkType="cellular" showIndicator />
      );

      expect(getByTestId('network-indicator')).toBeDefined();
    });
  });

  describe('Custom Message', () => {
    it('should display custom offline message', () => {
      const { getByText } = renderWithTheme(
        <NetworkStatus
          isConnected={false}
          offlineMessage="Custom offline message"
        />
      );

      expect(getByText('Custom offline message')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible offline banner', () => {
      const { getByLabelText } = renderWithTheme(
        <NetworkStatus isConnected={false} />
      );

      expect(getByLabelText(/network status/i)).toBeDefined();
    });
  });
});
