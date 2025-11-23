/**
 * EmptyState Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { EmptyState } from '../../components/atoms/EmptyState';
import { renderWithProviders } from '../utils/testUtils';

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return renderWithProviders(component);
};

describe('EmptyState', () => {
  describe('Rendering', () => {
    it('should render with title', () => {
      const { getByText } = renderWithTheme(<EmptyState title="No Tokens" />);

      expect(getByText('No Tokens')).toBeDefined();
    });

    it('should render with message', () => {
      const { getByText } = renderWithTheme(
        <EmptyState title="No Data" message="Add some items to get started" />
      );

      expect(getByText('Add some items to get started')).toBeDefined();
    });

    it('should render icon when provided', () => {
      const { getByTestId } = renderWithTheme(
        <EmptyState title="Empty" icon="wallet" testID="empty-state" />
      );

      expect(getByTestId('empty-state-icon')).toBeDefined();
    });
  });

  describe('Action Button', () => {
    it('should show action button when provided', () => {
      const mockAction = jest.fn();
      const { getByText } = renderWithTheme(
        <EmptyState title="No Tokens" actionLabel="Add Token" onAction={mockAction} />
      );

      expect(getByText('Add Token')).toBeDefined();
    });

    it('should call onAction when button is pressed', () => {
      const mockAction = jest.fn();
      const { getByText } = renderWithTheme(
        <EmptyState title="No Tokens" actionLabel="Add Token" onAction={mockAction} />
      );

      fireEvent.press(getByText('Add Token'));

      expect(mockAction).toHaveBeenCalled();
    });

    it('should not show action button when not provided', () => {
      const { queryByText } = renderWithTheme(<EmptyState title="No Data" />);

      expect(queryByText('Add Token')).toBeNull();
    });
  });

  describe('Icon Types', () => {
    it('should render wallet icon', () => {
      const { getByTestId } = renderWithTheme(
        <EmptyState title="Empty" icon="wallet" testID="empty" />
      );

      expect(getByTestId('empty-icon')).toBeDefined();
    });

    it('should render transaction icon', () => {
      const { getByTestId } = renderWithTheme(
        <EmptyState title="Empty" icon="transaction" testID="empty" />
      );

      expect(getByTestId('empty-icon')).toBeDefined();
    });

    it('should render search icon', () => {
      const { getByTestId } = renderWithTheme(
        <EmptyState title="Empty" icon="search" testID="empty" />
      );

      expect(getByTestId('empty-icon')).toBeDefined();
    });

    it('should render generic icon by default', () => {
      const { getByTestId } = renderWithTheme(<EmptyState title="Empty" testID="empty" />);

      expect(getByTestId('empty-icon')).toBeDefined();
    });
  });

  describe('Styling', () => {
    it('should apply custom styles', () => {
      const { getByTestId } = renderWithTheme(
        <EmptyState title="Empty" testID="empty-state" style={{ marginTop: 20 }} />
      );

      expect(getByTestId('empty-state')).toBeDefined();
    });

    it('should render compact variant', () => {
      const { getByTestId } = renderWithTheme(
        <EmptyState title="Empty" compact testID="empty-compact" />
      );

      expect(getByTestId('empty-compact')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible title', () => {
      const { getByLabelText } = renderWithTheme(
        <EmptyState
          title="No Transactions"
          message="Your transactions will appear here"
          actionLabel="Make Transaction"
          onAction={() => {}}
        />
      );

      expect(getByLabelText('Make Transaction')).toBeDefined();
    });
  });
});
