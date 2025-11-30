/**
 * Logger Tests
 * Test environment-based logging functionality
 */

import { Logger, LogLevel, logger } from '../../utils/Logger';
import { ErrorMonitoringService } from '../../services/ErrorMonitoringService';

// Mock console methods
const originalConsole = { ...console };

describe('Logger', () => {
  let testLogger: Logger;
  let mockErrorMonitoring: jest.Mocked<ErrorMonitoringService>;

  beforeEach(() => {
    testLogger = new Logger();

    // Mock console methods
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    console.group = jest.fn();
    console.groupEnd = jest.fn();

    // Mock ErrorMonitoringService
    mockErrorMonitoring = {
      logError: jest.fn(),
      logWarning: jest.fn(),
    } as any;
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.group = originalConsole.group;
    console.groupEnd = originalConsole.groupEnd;
  });

  describe('Configuration', () => {
    it('should use development config in DEV mode', () => {
      // In test environment, __DEV__ is true
      const devLogger = new Logger();

      devLogger.debug('test message');

      expect(console.log).toHaveBeenCalled();
    });

    it('should allow custom configuration', () => {
      testLogger.configure({
        level: LogLevel.ERROR,
        enableConsole: false,
      });

      testLogger.info('test message');

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should set error monitoring service', () => {
      testLogger.setErrorMonitoring(mockErrorMonitoring);
      testLogger.configure({ enableErrorMonitoring: true });

      testLogger.error('test error');

      expect(mockErrorMonitoring.logError).toHaveBeenCalled();
    });
  });

  describe('Log Levels', () => {
    beforeEach(() => {
      testLogger.configure({
        level: LogLevel.DEBUG,
        enableConsole: true,
      });
    });

    it('should log debug messages', () => {
      testLogger.debug('debug message');

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[DEBUG] debug message'));
    });

    it('should log info messages', () => {
      testLogger.info('info message');

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[INFO] info message'));
    });

    it('should log warn messages', () => {
      testLogger.warn('warn message');

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[WARN] warn message'));
    });

    it('should log error messages', () => {
      testLogger.error('error message');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] error message'),
        undefined
      );
    });

    it('should log error with Error object', () => {
      const error = new Error('test error');
      testLogger.error('error message', error);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] error message'),
        error
      );
    });
  });

  describe('Log Level Filtering', () => {
    it('should not log below configured level', () => {
      testLogger.configure({
        level: LogLevel.WARN,
        enableConsole: true,
      });

      testLogger.debug('debug message');
      testLogger.info('info message');

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should log at or above configured level', () => {
      testLogger.configure({
        level: LogLevel.WARN,
        enableConsole: true,
      });

      testLogger.warn('warn message');
      testLogger.error('error message');

      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('should not log anything when level is NONE', () => {
      testLogger.configure({
        level: LogLevel.NONE,
        enableConsole: true,
      });

      testLogger.debug('debug');
      testLogger.info('info');
      testLogger.warn('warn');
      testLogger.error('error');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('Context', () => {
    beforeEach(() => {
      testLogger.configure({
        level: LogLevel.DEBUG,
        enableConsole: true,
      });
    });

    it('should include context in log message', () => {
      const context = { userId: '123', action: 'login' };

      testLogger.info('user logged in', context);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining(JSON.stringify(context)));
    });

    it('should format message with timestamp', () => {
      testLogger.info('test message');

      expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T/));
    });
  });

  describe('Error Monitoring Integration', () => {
    beforeEach(() => {
      testLogger.setErrorMonitoring(mockErrorMonitoring);
      testLogger.configure({
        level: LogLevel.DEBUG,
        enableConsole: true,
        enableErrorMonitoring: true,
      });
    });

    it('should send warnings to error monitoring', () => {
      const context = { feature: 'payment' };

      testLogger.warn('warning message', context);

      expect(mockErrorMonitoring.logWarning).toHaveBeenCalledWith('warning message', context);
    });

    it('should send errors to error monitoring', () => {
      const error = new Error('test error');
      const context = { userId: '123' };

      testLogger.error('error message', error, context);

      expect(mockErrorMonitoring.logError).toHaveBeenCalledWith(error, context);
    });

    it('should create Error object if none provided', () => {
      testLogger.error('error message without Error object');

      expect(mockErrorMonitoring.logError).toHaveBeenCalledWith(expect.any(Error), undefined);
    });

    it('should not send to error monitoring when disabled', () => {
      testLogger.configure({ enableErrorMonitoring: false });

      testLogger.error('error message');

      expect(mockErrorMonitoring.logError).not.toHaveBeenCalled();
    });
  });

  describe('Child Logger', () => {
    beforeEach(() => {
      testLogger.configure({
        level: LogLevel.DEBUG,
        enableConsole: true,
      });
    });

    it('should create child logger with persistent context', () => {
      const childLogger = testLogger.child({ component: 'PaymentScreen' });

      childLogger.info('payment initiated');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('"component":"PaymentScreen"')
      );
    });

    it('should merge child context with additional context', () => {
      const childLogger = testLogger.child({ component: 'PaymentScreen' });

      childLogger.info('payment completed', { amount: 100 });

      const logCall = (console.log as jest.Mock).mock.calls[0][0];
      expect(logCall).toContain('"component":"PaymentScreen"');
      expect(logCall).toContain('"amount":100');
    });

    it('should override parent context with additional context', () => {
      const childLogger = testLogger.child({ status: 'pending' });

      childLogger.info('status changed', { status: 'completed' });

      const logCall = (console.log as jest.Mock).mock.calls[0][0];
      expect(logCall).toContain('"status":"completed"');
    });

    it('should support all log levels', () => {
      const childLogger = testLogger.child({ component: 'TestComponent' });

      childLogger.debug('debug');
      childLogger.info('info');
      childLogger.warn('warn');
      childLogger.error('error');

      expect(console.log).toHaveBeenCalledTimes(2); // debug + info
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('Grouping', () => {
    beforeEach(() => {
      testLogger.configure({
        enableConsole: true,
      });
    });

    it('should support log grouping in dev mode', () => {
      testLogger.group('Transaction Processing');
      testLogger.info('step 1');
      testLogger.info('step 2');
      testLogger.groupEnd();

      expect(console.group).toHaveBeenCalledWith('Transaction Processing');
      expect(console.groupEnd).toHaveBeenCalled();
    });
  });

  describe('Console Disabled', () => {
    beforeEach(() => {
      testLogger.configure({
        level: LogLevel.DEBUG,
        enableConsole: false,
      });
    });

    it('should not log to console when disabled', () => {
      testLogger.debug('debug');
      testLogger.info('info');
      testLogger.warn('warn');
      testLogger.error('error');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('Singleton Instance', () => {
    it('should export singleton logger instance', () => {
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should use same instance across imports', () => {
      const { logger: importedLogger } = require('../../utils/Logger');
      expect(importedLogger).toBe(logger);
    });
  });

  describe('Error with Context', () => {
    beforeEach(() => {
      testLogger.configure({
        level: LogLevel.DEBUG,
        enableConsole: true,
      });
    });

    it('should log error with context using errorWithContext', () => {
      const error = new Error('test error');
      const context = { userId: '123', screen: 'Payment' };

      testLogger.errorWithContext('Payment failed', error, context);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Payment failed'),
        error
      );
      expect((console.error as jest.Mock).mock.calls[0][0]).toContain('"userId":"123"');
    });
  });
});
