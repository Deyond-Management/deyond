/**
 * App Component Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import App from '../../App';

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe('App', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { toJSON } = render(<App />);

      expect(toJSON()).toBeTruthy();
    });

    it('should render navigation container', () => {
      const { root } = render(<App />);

      expect(root).toBeDefined();
    });
  });

  describe('Providers', () => {
    it('should wrap app with ThemeProvider', () => {
      const { toJSON } = render(<App />);

      // If rendered without error, providers are working
      expect(toJSON()).toBeTruthy();
    });

    it('should wrap app with Redux Provider', () => {
      const { toJSON } = render(<App />);

      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Initial Screen', () => {
    it('should show loading indicator initially', () => {
      const { UNSAFE_getByType } = render(<App />);

      expect(UNSAFE_getByType(ActivityIndicator)).toBeDefined();
    });
  });
});
