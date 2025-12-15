/**
 * Error Types
 * Type definitions for error handling and reporting
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  NETWORK = 'network',
  BLOCKCHAIN = 'blockchain',
  WALLET = 'wallet',
  STORAGE = 'storage',
  UI = 'ui',
  UNKNOWN = 'unknown',
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  walletAddress?: string;
  chainId?: number;
  [key: string]: any;
}

export interface ErrorReport {
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context?: ErrorContext;
  timestamp: number;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class AppError extends Error {
  public severity: ErrorSeverity;
  public category: ErrorCategory;
  public context?: ErrorContext;

  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: ErrorContext
  ) {
    super(message);
    this.name = 'AppError';
    this.severity = severity;
    this.category = category;
    this.context = context;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
