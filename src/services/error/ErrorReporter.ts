/**
 * ErrorReporter
 * Service for logging and reporting errors
 *
 * In production, integrate with:
 * - Sentry (https://sentry.io)
 * - Bugsnag (https://www.bugsnag.com)
 * - Firebase Crashlytics
 */

import {
  ErrorReport,
  ErrorSeverity,
  ErrorCategory,
  ErrorContext,
  AppError,
} from '../../types/error';
import AppConfig from '../../config/app.config';

class ErrorReporter {
  private reports: ErrorReport[] = [];
  private readonly MAX_REPORTS = 100;

  /**
   * Report an error
   */
  report(
    error: Error,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    context?: ErrorContext
  ): void {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      severity,
      category,
      context,
      timestamp: Date.now(),
    };

    // Store locally
    this.storeReport(errorReport);

    // Log to console in development
    if (AppConfig.demoMode || __DEV__) {
      this.logToConsole(errorReport);
    }

    // TODO: In production, send to error tracking service
    // if (!AppConfig.demoMode && !__DEV__) {
    //   this.sendToSentry(errorReport);
    // }
  }

  /**
   * Report an AppError
   */
  reportAppError(error: AppError): void {
    this.report(error, error.severity, error.category, error.context);
  }

  /**
   * Capture exception with automatic categorization
   */
  captureException(error: Error, context?: ErrorContext): void {
    let category = ErrorCategory.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;

    // Auto-categorize based on error message
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      category = ErrorCategory.NETWORK;
      severity = ErrorSeverity.MEDIUM;
    } else if (
      message.includes('blockchain') ||
      message.includes('transaction') ||
      message.includes('gas')
    ) {
      category = ErrorCategory.BLOCKCHAIN;
      severity = ErrorSeverity.HIGH;
    } else if (
      message.includes('wallet') ||
      message.includes('key') ||
      message.includes('signature')
    ) {
      category = ErrorCategory.WALLET;
      severity = ErrorSeverity.CRITICAL;
    } else if (
      message.includes('storage') ||
      message.includes('save') ||
      message.includes('load')
    ) {
      category = ErrorCategory.STORAGE;
      severity = ErrorSeverity.HIGH;
    }

    this.report(error, severity, category, context);
  }

  /**
   * Get all error reports
   */
  getReports(): ErrorReport[] {
    return [...this.reports];
  }

  /**
   * Clear all error reports
   */
  clearReports(): void {
    this.reports = [];
  }

  /**
   * Store error report locally
   */
  private storeReport(report: ErrorReport): void {
    this.reports.push(report);

    // Keep only last MAX_REPORTS
    if (this.reports.length > this.MAX_REPORTS) {
      this.reports.shift();
    }
  }

  /**
   * Log error to console
   */
  private logToConsole(report: ErrorReport): void {
    const emoji = this.getSeverityEmoji(report.severity);
    console.group(`${emoji} [${report.category.toUpperCase()}] ${report.message}`);
    console.error('Severity:', report.severity);
    if (report.stack) {
      console.error('Stack:', report.stack);
    }
    if (report.context) {
      console.error('Context:', report.context);
    }
    console.groupEnd();
  }

  /**
   * Send error to Sentry (production)
   */
  private async sendToSentry(report: ErrorReport): Promise<void> {
    // TODO: Implement Sentry integration
    // import * as Sentry from '@sentry/react-native';
    //
    // Sentry.captureException(new Error(report.message), {
    //   level: this.mapSeverityToSentryLevel(report.severity),
    //   tags: {
    //     category: report.category,
    //   },
    //   contexts: {
    //     app: report.context,
    //   },
    // });
  }

  /**
   * Get emoji for severity level
   */
  private getSeverityEmoji(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'ℹ️';
      case ErrorSeverity.MEDIUM:
        return '⚠️';
      case ErrorSeverity.HIGH:
        return '🔴';
      case ErrorSeverity.CRITICAL:
        return '💥';
      default:
        return '❓';
    }
  }
}

// Singleton instance
let instance: ErrorReporter | null = null;

export const getErrorReporter = (): ErrorReporter => {
  if (!instance) {
    instance = new ErrorReporter();
  }
  return instance;
};

export default ErrorReporter;
