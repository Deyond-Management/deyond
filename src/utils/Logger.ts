/**
 * Logger Utility
 * Environment-based logging with different log levels
 * Integrates with ErrorMonitoringService for production error tracking
 */

import { ErrorMonitoringService } from '../services/monitoring/ErrorMonitoringService';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableErrorMonitoring: boolean;
}

class Logger {
  private config: LoggerConfig;
  private errorMonitoring: ErrorMonitoringService | null = null;

  constructor() {
    // Default configuration based on environment
    this.config = this.getDefaultConfig();
  }

  /**
   * Get default configuration based on environment
   */
  private getDefaultConfig(): LoggerConfig {
    const isDevelopment = __DEV__;

    if (isDevelopment) {
      return {
        level: LogLevel.DEBUG,
        enableConsole: true,
        enableErrorMonitoring: false,
      };
    } else {
      return {
        level: LogLevel.WARN,
        enableConsole: false,
        enableErrorMonitoring: true,
      };
    }
  }

  /**
   * Configure logger
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Set error monitoring service
   */
  setErrorMonitoring(service: ErrorMonitoringService): void {
    this.errorMonitoring = service;
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  /**
   * Format log message with metadata
   */
  private formatMessage(level: string, message: string, context?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    if (this.config.enableConsole) {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    if (this.config.enableConsole) {
      console.log(this.formatMessage('INFO', message, context));
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    if (this.config.enableConsole) {
      console.warn(this.formatMessage('WARN', message, context));
    }

    if (this.config.enableErrorMonitoring && this.errorMonitoring) {
      this.errorMonitoring.logWarning(message, context);
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    if (this.config.enableConsole) {
      console.error(this.formatMessage('ERROR', message, context), error);
    }

    if (this.config.enableErrorMonitoring && this.errorMonitoring) {
      if (error) {
        this.errorMonitoring.logError(message, error, context);
      } else {
        this.errorMonitoring.logError(message, new Error(message), context);
      }
    }
  }

  /**
   * Log error with additional metadata
   */
  errorWithContext(message: string, error: Error, context: Record<string, any>): void {
    this.error(message, error, context);
  }

  /**
   * Group logs (for related operations)
   */
  group(label: string): void {
    if (this.config.enableConsole && __DEV__) {
      console.group(label);
    }
  }

  /**
   * End log group
   */
  groupEnd(): void {
    if (this.config.enableConsole && __DEV__) {
      console.groupEnd();
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, any>): ChildLogger {
    return new ChildLogger(this, context);
  }
}

/**
 * Child Logger with persistent context
 */
class ChildLogger {
  constructor(
    private parent: Logger,
    private context: Record<string, any>
  ) {}

  private mergeContext(additionalContext?: Record<string, any>): Record<string, any> {
    return {
      ...this.context,
      ...additionalContext,
    };
  }

  debug(message: string, context?: Record<string, any>): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  info(message: string, context?: Record<string, any>): void {
    this.parent.info(message, this.mergeContext(context));
  }

  warn(message: string, context?: Record<string, any>): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.parent.error(message, error, this.mergeContext(context));
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for testing
export { Logger };
