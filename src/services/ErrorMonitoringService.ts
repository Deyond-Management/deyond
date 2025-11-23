/**
 * ErrorMonitoringService
 * Sentry integration for crash reporting and error tracking
 */

import * as Sentry from '@sentry/react-native';

type SeverityLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

interface UserContext {
  id: string;
  address?: string;
  email?: string;
}

interface BreadcrumbData {
  category: string;
  message: string;
  level?: SeverityLevel;
  data?: Record<string, unknown>;
}

interface InitOptions {
  environment?: string;
  release?: string;
  debug?: boolean;
  tracesSampleRate?: number;
}

export class ErrorMonitoringService {
  private initialized = false;

  /**
   * Initialize Sentry
   */
  initialize(dsn: string, options?: InitOptions): void {
    if (this.initialized) {
      return;
    }

    Sentry.init({
      dsn,
      environment: options?.environment || 'development',
      release: options?.release,
      debug: options?.debug || false,
      tracesSampleRate: options?.tracesSampleRate || 0.2,
      enableAutoSessionTracking: true,
      attachStacktrace: true,
      beforeSend: event => {
        // Scrub sensitive data
        if (event.extra) {
          delete event.extra.privateKey;
          delete event.extra.mnemonic;
          delete event.extra.pin;
        }
        return event;
      },
    });

    this.initialized = true;
  }

  /**
   * Capture error/exception
   */
  captureError(error: Error, context?: Record<string, unknown>): void {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        Sentry.setExtra(key, value);
      });
    }

    Sentry.captureException(error);
  }

  /**
   * Capture message
   */
  captureMessage(message: string, level: SeverityLevel = 'info'): void {
    Sentry.captureMessage(message, level);
  }

  /**
   * Set user context
   */
  setUser(user: UserContext): void {
    Sentry.setUser({
      id: user.id,
      // Don't send full address, use truncated version
      username: user.address
        ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}`
        : undefined,
    });
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    Sentry.setUser(null);
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(data: BreadcrumbData): void {
    Sentry.addBreadcrumb({
      category: data.category,
      message: data.message,
      level: data.level || 'info',
      data: data.data,
    });
  }

  /**
   * Set tag for filtering
   */
  setTag(key: string, value: string): void {
    Sentry.setTag(key, value);
  }

  /**
   * Set extra context
   */
  setExtra(key: string, value: unknown): void {
    Sentry.setExtra(key, value);
  }

  /**
   * Track transaction for performance monitoring
   */
  startTransaction(name: string, op: string): unknown {
    // Sentry.startTransaction({ name, op });
    return null;
  }

  /**
   * Log navigation event
   */
  logNavigation(from: string, to: string): void {
    this.addBreadcrumb({
      category: 'navigation',
      message: `${from} -> ${to}`,
      level: 'info',
    });
  }

  /**
   * Log user action
   */
  logAction(action: string, data?: Record<string, unknown>): void {
    this.addBreadcrumb({
      category: 'user-action',
      message: action,
      level: 'info',
      data,
    });
  }

  /**
   * Log network request
   */
  logNetworkRequest(method: string, url: string, status: number, duration: number): void {
    this.addBreadcrumb({
      category: 'http',
      message: `${method} ${url}`,
      level: status >= 400 ? 'error' : 'info',
      data: { status, duration },
    });
  }

  /**
   * Log transaction event
   */
  logTransaction(
    type: 'send' | 'receive',
    hash: string,
    status: 'pending' | 'confirmed' | 'failed'
  ): void {
    this.addBreadcrumb({
      category: 'transaction',
      message: `${type} tx: ${hash.slice(0, 10)}...`,
      level: status === 'failed' ? 'error' : 'info',
      data: { type, status },
    });
  }
}

// Singleton instance
export const errorMonitoring = new ErrorMonitoringService();

export default ErrorMonitoringService;
