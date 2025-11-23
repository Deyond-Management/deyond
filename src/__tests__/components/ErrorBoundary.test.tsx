/**
 * ErrorBoundary Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Component that throws error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>No error</Text>;
};

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

// Suppress console.error for error boundary tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  describe('Normal Rendering', () => {
    it('should render children when no error', () => {
      const { getByText } = renderWithTheme(
        <ErrorBoundary>
          <Text>Child content</Text>
        </ErrorBoundary>
      );

      expect(getByText('Child content')).toBeDefined();
    });

    it('should render multiple children', () => {
      const { getByText } = renderWithTheme(
        <ErrorBoundary>
          <Text>First child</Text>
          <Text>Second child</Text>
        </ErrorBoundary>
      );

      expect(getByText('First child')).toBeDefined();
      expect(getByText('Second child')).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should catch errors and display fallback', () => {
      const { getByText } = renderWithTheme(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(getByText(/something went wrong/i)).toBeDefined();
    });

    it('should display error message', () => {
      const { getByTestId } = renderWithTheme(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(getByTestId('error-message')).toBeDefined();
    });

    it('should have retry button', () => {
      const { getByTestId } = renderWithTheme(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(getByTestId('retry-button')).toBeDefined();
    });

    it('should reset error state on retry', () => {
      let shouldThrow = true;
      const TestComponent = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <Text>Recovered</Text>;
      };

      const { getByTestId, queryByText } = renderWithTheme(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      // Error state
      expect(getByTestId('retry-button')).toBeDefined();

      // Fix error condition
      shouldThrow = false;

      // Press retry
      fireEvent.press(getByTestId('retry-button'));

      // Should attempt to recover (component will re-render)
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const CustomFallback = () => <Text>Custom error view</Text>;

      const { getByText } = renderWithTheme(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(getByText('Custom error view')).toBeDefined();
    });
  });

  describe('Error Reporting', () => {
    it('should call onError callback when error occurs', () => {
      const onError = jest.fn();

      renderWithTheme(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible retry button', () => {
      const { getByLabelText } = renderWithTheme(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(getByLabelText(/try again/i)).toBeDefined();
    });
  });
});
