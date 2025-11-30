/**
 * ErrorMonitoringService Tests
 * Sentry integration for crash reporting
 */

import { ErrorMonitoringService } from '../../services/monitoring/ErrorMonitoringService';

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setExtra: jest.fn(),
  addBreadcrumb: jest.fn(),
  Severity: {
    Error: 'error',
    Warning: 'warning',
    Info: 'info',
  },
}));

import * as Sentry from '@sentry/react-native';

describe('ErrorMonitoringService', () => {
  let errorMonitoring: ErrorMonitoringService;

  beforeEach(() => {
    errorMonitoring = new ErrorMonitoringService();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize Sentry with DSN', () => {
      errorMonitoring.initialize('test-dsn');

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'test-dsn',
        })
      );
    });

    it('should configure environment', () => {
      errorMonitoring.initialize('test-dsn', { environment: 'production' });

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: 'production',
        })
      );
    });
  });

  describe('captureError', () => {
    it('should capture exception with Sentry', () => {
      const error = new Error('Test error');
      errorMonitoring.captureError(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should add extra context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };

      errorMonitoring.captureError(error, context);

      expect(Sentry.setExtra).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });
  });

  describe('captureMessage', () => {
    it('should capture message with Sentry', () => {
      errorMonitoring.captureMessage('Test message');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', expect.any(String));
    });

    it('should capture with severity level', () => {
      errorMonitoring.captureMessage('Warning message', 'warning');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Warning message', 'warning');
    });
  });

  describe('setUser', () => {
    it('should set user context', () => {
      errorMonitoring.setUser({
        id: '123',
        address: '0x1234',
      });

      expect(Sentry.setUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '123',
        })
      );
    });

    it('should clear user', () => {
      errorMonitoring.clearUser();

      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('breadcrumbs', () => {
    it('should add breadcrumb', () => {
      errorMonitoring.addBreadcrumb({
        category: 'navigation',
        message: 'Navigated to Home',
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'navigation',
          message: 'Navigated to Home',
        })
      );
    });
  });

  describe('tags', () => {
    it('should set tag', () => {
      errorMonitoring.setTag('network', 'ethereum');

      expect(Sentry.setTag).toHaveBeenCalledWith('network', 'ethereum');
    });
  });
});
