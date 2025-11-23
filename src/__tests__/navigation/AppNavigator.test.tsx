/**
 * AppNavigator Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator, RootStackParamList } from '../../navigation/AppNavigator';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { Provider } from 'react-redux';
import { store } from '../../store';

// Helper to render navigator
const renderNavigator = (initialRoute?: keyof RootStackParamList) => {
  return render(
    <Provider store={store}>
      <ThemeProvider>
        <NavigationContainer>
          <AppNavigator initialRouteName={initialRoute} />
        </NavigationContainer>
      </ThemeProvider>
    </Provider>
  );
};

describe('AppNavigator', () => {
  describe('Screen Registration', () => {
    it('should have Welcome screen', () => {
      const { getByTestId } = renderNavigator('Welcome');

      expect(getByTestId('welcome-container')).toBeDefined();
    });

    it('should have Home screen', () => {
      const { getByTestId } = renderNavigator('Home');

      expect(getByTestId('home-scroll')).toBeDefined();
    });

    it('should have Send screen', () => {
      const { getByText } = renderNavigator('Send');

      expect(getByText('Send')).toBeDefined();
    });

    it('should have Receive screen', () => {
      const { getByTestId } = renderNavigator('Receive');

      expect(getByTestId('qr-code')).toBeDefined();
    });

    it('should have Settings screen', () => {
      const { getByText } = renderNavigator('Settings');

      expect(getByText('Settings')).toBeDefined();
    });

    it('should have TransactionHistory screen', () => {
      const { getByTestId } = renderNavigator('TransactionHistory');

      expect(getByTestId('filter-all')).toBeDefined();
    });

    it('should have ChatHome screen', () => {
      const { getByText } = renderNavigator('ChatHome');

      expect(getByText('Messages')).toBeDefined();
    });
  });

  describe('Default Route', () => {
    it('should default to Welcome screen when not authenticated', () => {
      const { getByTestId } = renderNavigator();

      expect(getByTestId('welcome-container')).toBeDefined();
    });
  });

  describe('Stack Configuration', () => {
    it('should render without crashing', () => {
      const { toJSON } = renderNavigator('Welcome');

      expect(toJSON()).toBeTruthy();
    });
  });
});
