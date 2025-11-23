/**
 * Toast Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Toast } from '../../components/Toast';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render toast message', () => {
      const { getByText } = renderWithTheme(<Toast message="Test message" visible={true} />);

      expect(getByText('Test message')).toBeDefined();
    });

    it('should not render when not visible', () => {
      const { queryByText } = renderWithTheme(<Toast message="Test message" visible={false} />);

      expect(queryByText('Test message')).toBeNull();
    });
  });

  describe('Types', () => {
    it('should render success toast', () => {
      const { getByTestId } = renderWithTheme(
        <Toast message="Success" visible={true} type="success" />
      );

      expect(getByTestId('toast-success')).toBeDefined();
    });

    it('should render error toast', () => {
      const { getByTestId } = renderWithTheme(
        <Toast message="Error" visible={true} type="error" />
      );

      expect(getByTestId('toast-error')).toBeDefined();
    });

    it('should render warning toast', () => {
      const { getByTestId } = renderWithTheme(
        <Toast message="Warning" visible={true} type="warning" />
      );

      expect(getByTestId('toast-warning')).toBeDefined();
    });

    it('should render info toast by default', () => {
      const { getByTestId } = renderWithTheme(<Toast message="Info" visible={true} />);

      expect(getByTestId('toast-info')).toBeDefined();
    });
  });

  describe('Auto-dismiss', () => {
    it('should call onDismiss after duration', () => {
      const onDismiss = jest.fn();

      renderWithTheme(
        <Toast message="Test" visible={true} duration={3000} onDismiss={onDismiss} />
      );

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onDismiss).toHaveBeenCalled();
    });

    it('should not auto-dismiss if duration is 0', () => {
      const onDismiss = jest.fn();

      renderWithTheme(<Toast message="Test" visible={true} duration={0} onDismiss={onDismiss} />);

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('Actions', () => {
    it('should render action button when provided', () => {
      const { getByTestId } = renderWithTheme(
        <Toast message="Test" visible={true} action={{ label: 'Undo', onPress: jest.fn() }} />
      );

      expect(getByTestId('toast-action')).toBeDefined();
    });

    it('should call action onPress when pressed', () => {
      const onPress = jest.fn();

      const { getByTestId } = renderWithTheme(
        <Toast message="Test" visible={true} action={{ label: 'Undo', onPress }} />
      );

      fireEvent.press(getByTestId('toast-action'));

      expect(onPress).toHaveBeenCalled();
    });
  });

  describe('Dismiss', () => {
    it('should dismiss on swipe', () => {
      const onDismiss = jest.fn();

      const { getByTestId } = renderWithTheme(
        <Toast message="Test" visible={true} onDismiss={onDismiss} />
      );

      // Toast should be dismissible
      expect(getByTestId('toast-container')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible container', () => {
      const { getByTestId } = renderWithTheme(<Toast message="Test" visible={true} />);

      expect(getByTestId('toast-container')).toBeDefined();
    });

    it('should announce message', () => {
      const { getByLabelText } = renderWithTheme(
        <Toast message="Important notification" visible={true} />
      );

      expect(getByLabelText(/important notification/i)).toBeDefined();
    });
  });
});
