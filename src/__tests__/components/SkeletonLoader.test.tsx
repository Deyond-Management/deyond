/**
 * SkeletonLoader Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import {
  SkeletonLoader,
  SkeletonText,
  SkeletonCard,
  TokenCardSkeleton,
  TransactionCardSkeleton,
  BalanceSkeleton,
} from '../../components/atoms/SkeletonLoader';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('SkeletonLoader', () => {
  describe('Base SkeletonLoader', () => {
    it('should render with default dimensions', () => {
      const { getByTestId } = renderWithTheme(<SkeletonLoader testID="skeleton-base" />);

      expect(getByTestId('skeleton-base')).toBeDefined();
    });

    it('should render with custom width and height', () => {
      const { getByTestId } = renderWithTheme(
        <SkeletonLoader width={200} height={50} testID="skeleton-custom" />
      );

      const skeleton = getByTestId('skeleton-custom');
      expect(skeleton.props.style).toEqual(expect.objectContaining({ width: 200, height: 50 }));
    });

    it('should render with custom border radius', () => {
      const { getByTestId } = renderWithTheme(
        <SkeletonLoader borderRadius={16} testID="skeleton-radius" />
      );

      const skeleton = getByTestId('skeleton-radius');
      expect(skeleton.props.style).toEqual(expect.objectContaining({ borderRadius: 16 }));
    });

    it('should apply custom styles', () => {
      const { getByTestId } = renderWithTheme(
        <SkeletonLoader style={{ marginTop: 10 }} testID="skeleton-style" />
      );

      const skeleton = getByTestId('skeleton-style');
      expect(skeleton.props.style).toEqual(expect.objectContaining({ marginTop: 10 }));
    });
  });

  describe('SkeletonText', () => {
    it('should render text skeleton', () => {
      const { getByTestId } = renderWithTheme(<SkeletonText testID="skeleton-text" />);

      expect(getByTestId('skeleton-text')).toBeDefined();
    });

    it('should render with custom width', () => {
      const { getByTestId } = renderWithTheme(
        <SkeletonText width={150} testID="skeleton-text-width" />
      );

      const skeleton = getByTestId('skeleton-text-width');
      expect(skeleton.props.style).toEqual(expect.objectContaining({ width: 150 }));
    });

    it('should render multiple lines', () => {
      const { getAllByTestId } = renderWithTheme(<SkeletonText lines={3} testID="skeleton-line" />);

      expect(getAllByTestId(/skeleton-line/).length).toBe(3);
    });
  });

  describe('SkeletonCard', () => {
    it('should render card skeleton', () => {
      const { getByTestId } = renderWithTheme(<SkeletonCard testID="skeleton-card" />);

      expect(getByTestId('skeleton-card')).toBeDefined();
    });

    it('should render with custom height', () => {
      const { getByTestId } = renderWithTheme(
        <SkeletonCard height={120} testID="skeleton-card-height" />
      );

      const skeleton = getByTestId('skeleton-card-height');
      expect(skeleton.props.style).toContainEqual(expect.objectContaining({ height: 120 }));
    });
  });

  describe('TokenCardSkeleton', () => {
    it('should render token card skeleton', () => {
      const { getByTestId } = renderWithTheme(<TokenCardSkeleton testID="token-skeleton" />);

      expect(getByTestId('token-skeleton')).toBeDefined();
    });

    it('should contain icon placeholder', () => {
      const { getByTestId } = renderWithTheme(<TokenCardSkeleton testID="token-skeleton" />);

      expect(getByTestId('token-skeleton-icon')).toBeDefined();
    });

    it('should contain text placeholders', () => {
      const { getByTestId } = renderWithTheme(<TokenCardSkeleton testID="token-skeleton" />);

      expect(getByTestId('token-skeleton-name')).toBeDefined();
      expect(getByTestId('token-skeleton-balance')).toBeDefined();
    });
  });

  describe('TransactionCardSkeleton', () => {
    it('should render transaction card skeleton', () => {
      const { getByTestId } = renderWithTheme(<TransactionCardSkeleton testID="tx-skeleton" />);

      expect(getByTestId('tx-skeleton')).toBeDefined();
    });

    it('should contain icon placeholder', () => {
      const { getByTestId } = renderWithTheme(<TransactionCardSkeleton testID="tx-skeleton" />);

      expect(getByTestId('tx-skeleton-icon')).toBeDefined();
    });

    it('should contain text placeholders', () => {
      const { getByTestId } = renderWithTheme(<TransactionCardSkeleton testID="tx-skeleton" />);

      expect(getByTestId('tx-skeleton-type')).toBeDefined();
      expect(getByTestId('tx-skeleton-amount')).toBeDefined();
    });
  });

  describe('BalanceSkeleton', () => {
    it('should render balance skeleton', () => {
      const { getByTestId } = renderWithTheme(<BalanceSkeleton testID="balance-skeleton" />);

      expect(getByTestId('balance-skeleton')).toBeDefined();
    });

    it('should contain label placeholder', () => {
      const { getByTestId } = renderWithTheme(<BalanceSkeleton testID="balance-skeleton" />);

      expect(getByTestId('balance-skeleton-label')).toBeDefined();
    });

    it('should contain amount placeholder', () => {
      const { getByTestId } = renderWithTheme(<BalanceSkeleton testID="balance-skeleton" />);

      expect(getByTestId('balance-skeleton-amount')).toBeDefined();
    });
  });

  describe('Animation', () => {
    it('should have animated property', () => {
      const { getByTestId } = renderWithTheme(
        <SkeletonLoader animated={true} testID="skeleton-animated" />
      );

      expect(getByTestId('skeleton-animated')).toBeDefined();
    });

    it('should allow disabling animation', () => {
      const { getByTestId } = renderWithTheme(
        <SkeletonLoader animated={false} testID="skeleton-static" />
      );

      expect(getByTestId('skeleton-static')).toBeDefined();
    });
  });
});
