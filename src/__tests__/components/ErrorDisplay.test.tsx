/**
 * ErrorDisplay Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { ErrorDisplay } from '../../components/atoms/ErrorDisplay';
import { renderWithProviders } from '../utils/testUtils';

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return renderWithProviders(component);
};

describe('ErrorDisplay', () => {
  describe('Rendering', () => {
    it('should render error message', () => {
      const { getByText } = renderWithTheme(<ErrorDisplay message="Something went wrong" />);

      expect(getByText('Something went wrong')).toBeDefined();
    });

    it('should render with default title', () => {
      const { getByText } = renderWithTheme(<ErrorDisplay message="Error occurred" />);

      expect(getByText('Error')).toBeDefined();
    });

    it('should render with custom title', () => {
      const { getByText } = renderWithTheme(
        <ErrorDisplay title="Network Error" message="Failed to connect" />
      );

      expect(getByText('Network Error')).toBeDefined();
    });

    it('should render error icon', () => {
      const { getByTestId } = renderWithTheme(
        <ErrorDisplay message="Error" testID="error-display" />
      );

      expect(getByTestId('error-display-icon')).toBeDefined();
    });
  });

  describe('Retry Button', () => {
    it('should show retry button when onRetry is provided', () => {
      const mockRetry = jest.fn();
      const { getByText } = renderWithTheme(<ErrorDisplay message="Error" onRetry={mockRetry} />);

      expect(getByText('Retry')).toBeDefined();
    });

    it('should not show retry button when onRetry is not provided', () => {
      const { queryByText } = renderWithTheme(<ErrorDisplay message="Error" />);

      expect(queryByText('Retry')).toBeNull();
    });

    it('should call onRetry when retry button is pressed', () => {
      const mockRetry = jest.fn();
      const { getByText } = renderWithTheme(<ErrorDisplay message="Error" onRetry={mockRetry} />);

      fireEvent.press(getByText('Retry'));

      expect(mockRetry).toHaveBeenCalled();
    });

    it('should show custom retry text', () => {
      const mockRetry = jest.fn();
      const { getByText } = renderWithTheme(
        <ErrorDisplay message="Error" onRetry={mockRetry} retryText="Try Again" />
      );

      expect(getByText('Try Again')).toBeDefined();
    });
  });

  describe('Dismiss Button', () => {
    it('should show dismiss button when onDismiss is provided', () => {
      const mockDismiss = jest.fn();
      const { getByText } = renderWithTheme(
        <ErrorDisplay message="Error" onDismiss={mockDismiss} />
      );

      expect(getByText('Dismiss')).toBeDefined();
    });

    it('should call onDismiss when dismiss button is pressed', () => {
      const mockDismiss = jest.fn();
      const { getByText } = renderWithTheme(
        <ErrorDisplay message="Error" onDismiss={mockDismiss} />
      );

      fireEvent.press(getByText('Dismiss'));

      expect(mockDismiss).toHaveBeenCalled();
    });
  });

  describe('Variants', () => {
    it('should render inline variant', () => {
      const { getByTestId } = renderWithTheme(
        <ErrorDisplay message="Error" variant="inline" testID="error-inline" />
      );

      expect(getByTestId('error-inline')).toBeDefined();
    });

    it('should render banner variant', () => {
      const { getByTestId } = renderWithTheme(
        <ErrorDisplay message="Error" variant="banner" testID="error-banner" />
      );

      expect(getByTestId('error-banner')).toBeDefined();
    });

    it('should render fullscreen variant', () => {
      const { getByTestId } = renderWithTheme(
        <ErrorDisplay message="Error" variant="fullscreen" testID="error-fullscreen" />
      );

      expect(getByTestId('error-fullscreen')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible error message', () => {
      const { getByLabelText } = renderWithTheme(
        <ErrorDisplay message="Something went wrong" onRetry={() => {}} />
      );

      // Check retry button has accessibility label
      expect(getByLabelText('Retry')).toBeDefined();
    });
  });
});
