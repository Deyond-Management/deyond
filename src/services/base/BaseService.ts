/**
 * BaseService
 * Abstract base class for all services with common patterns
 */

import { EventEmitter } from 'events';
import { CacheManager } from './CacheManager';
import { AppError, createAppError } from './AppError';
import { ERROR_CODES, ErrorCode } from '../../config/constants/ErrorCodes';

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Cache prefix */
  prefix: string;
  /** Default TTL in ms */
  defaultTtl?: number;
  /** Use persistent storage */
  useStorage?: boolean;
}

/**
 * Service configuration
 */
export interface ServiceConfig {
  /** Service name for logging */
  name: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Cache configuration */
  cache?: CacheConfig;
  /** Enable event emission */
  enableEvents?: boolean;
  /** Initialization timeout in ms */
  initTimeout?: number;
}

/**
 * Service status
 */
export enum ServiceStatus {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  ERROR = 'error',
  DISPOSED = 'disposed',
}

/**
 * Service events
 */
export interface ServiceEvents {
  statusChange: (status: ServiceStatus) => void;
  error: (error: AppError) => void;
  initialized: () => void;
  disposed: () => void;
}

/**
 * Abstract base service class
 */
export abstract class BaseService<
  TConfig extends ServiceConfig = ServiceConfig,
> extends EventEmitter {
  protected readonly config: TConfig;
  protected readonly cache: CacheManager;
  protected status: ServiceStatus = ServiceStatus.UNINITIALIZED;
  private initPromise: Promise<void> | null = null;

  constructor(config: TConfig) {
    super();
    this.config = config;
    this.cache = new CacheManager({
      prefix: config.cache?.prefix || `${config.name}_`,
      defaultTtl: config.cache?.defaultTtl,
      useStorage: config.cache?.useStorage,
    });
  }

  // ==================== Lifecycle Methods ====================

  /**
   * Initialize the service
   * Override in subclass to add custom initialization logic
   */
  async initialize(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Skip if already initialized
    if (this.status === ServiceStatus.READY) {
      return;
    }

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      this.setStatus(ServiceStatus.INITIALIZING);
      this.log('Initializing...');

      // Apply timeout if configured
      const timeout = this.config.initTimeout || 30000;
      await this.withTimeout(this.onInitialize(), timeout, 'Initialization timeout');

      this.setStatus(ServiceStatus.READY);
      this.emit('initialized');
      this.log('Initialized successfully');
    } catch (error) {
      this.setStatus(ServiceStatus.ERROR);
      const appError = createAppError(error, ERROR_CODES.UNKNOWN_ERROR);
      this.emit('error', appError);
      throw appError;
    } finally {
      this.initPromise = null;
    }
  }

  /**
   * Override this method to add custom initialization logic
   */
  protected abstract onInitialize(): Promise<void>;

  /**
   * Dispose the service and cleanup resources
   */
  async dispose(): Promise<void> {
    if (this.status === ServiceStatus.DISPOSED) {
      return;
    }

    this.log('Disposing...');

    try {
      await this.onDispose();
      await this.cache.clear();
      this.removeAllListeners();
      this.setStatus(ServiceStatus.DISPOSED);
      this.emit('disposed');
      this.log('Disposed successfully');
    } catch (error) {
      this.logError('Failed to dispose', error);
    }
  }

  /**
   * Override this method to add custom cleanup logic
   */
  protected async onDispose(): Promise<void> {
    // Default implementation does nothing
  }

  // ==================== Status Management ====================

  /**
   * Get current service status
   */
  getStatus(): ServiceStatus {
    return this.status;
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.status === ServiceStatus.READY;
  }

  /**
   * Ensure service is ready, throw if not
   */
  protected ensureReady(): void {
    if (!this.isReady()) {
      throw new AppError(
        ERROR_CODES.UNKNOWN_ERROR,
        `Service ${this.config.name} is not ready. Current status: ${this.status}`
      );
    }
  }

  /**
   * Set service status and emit event
   */
  protected setStatus(status: ServiceStatus): void {
    const previousStatus = this.status;
    this.status = status;

    if (this.config.enableEvents && previousStatus !== status) {
      this.emit('statusChange', status);
    }
  }

  // ==================== Error Handling ====================

  /**
   * Handle error with logging and optional rethrow
   */
  protected handleError(
    error: unknown,
    code: ErrorCode = ERROR_CODES.UNKNOWN_ERROR,
    rethrow: boolean = true
  ): AppError {
    const appError = createAppError(error, code);
    this.logError(appError.message, error);

    if (this.config.enableEvents) {
      this.emit('error', appError);
    }

    if (rethrow) {
      throw appError;
    }

    return appError;
  }

  /**
   * Wrap async operation with error handling
   */
  protected async safeExecute<T>(
    operation: () => Promise<T>,
    errorCode: ErrorCode = ERROR_CODES.UNKNOWN_ERROR
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw this.handleError(error, errorCode, true);
    }
  }

  /**
   * Wrap async operation with error handling and default value
   */
  protected async safeExecuteWithDefault<T>(
    operation: () => Promise<T>,
    defaultValue: T,
    errorCode: ErrorCode = ERROR_CODES.UNKNOWN_ERROR
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, errorCode, false);
      return defaultValue;
    }
  }

  // ==================== Caching ====================

  /**
   * Get value from cache or fetch
   */
  protected async getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.cache.get(key);
    if (cached !== null) {
      this.log(`Cache hit: ${key}`);
      return cached as T;
    }

    this.log(`Cache miss: ${key}`);
    const value = await fetcher();
    await this.cache.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidate cache entries
   */
  protected async invalidateCache(): Promise<void> {
    await this.cache.clear();
  }

  // ==================== Logging ====================

  /**
   * Log debug message
   */
  protected log(message: string, ...args: unknown[]): void {
    if (this.config.debug) {
      console.log(`[${this.config.name}] ${message}`, ...args);
    }
  }

  /**
   * Log warning
   */
  protected logWarn(message: string, ...args: unknown[]): void {
    console.warn(`[${this.config.name}] ${message}`, ...args);
  }

  /**
   * Log error
   */
  protected logError(message: string, error?: unknown): void {
    console.error(`[${this.config.name}] ${message}`, error);
  }

  // ==================== Utility Methods ====================

  /**
   * Execute operation with timeout
   */
  protected async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string = 'Operation timed out'
  ): Promise<T> {
    let timeoutHandle: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new AppError(ERROR_CODES.TIMEOUT, timeoutMessage));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutHandle!);
    }
  }

  /**
   * Execute operation with retry
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000,
    backoffMultiplier: number = 2
  ): Promise<T> {
    let lastError: unknown;
    let currentDelay = delayMs;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        this.log(`Attempt ${attempt}/${maxRetries} failed`, error);

        if (attempt < maxRetries) {
          await this.sleep(currentDelay);
          currentDelay *= backoffMultiplier;
        }
      }
    }

    throw lastError;
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Debounce function calls
   */
  protected debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        func.apply(this, args);
        timeoutId = null;
      }, wait);
    };
  }

  /**
   * Throttle function calls
   */
  protected throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }
}

/**
 * Decorator for ensuring service is ready before method execution
 */
export function RequireReady() {
  return function (
    target: BaseService,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = function (this: BaseService, ...args: unknown[]) {
      this['ensureReady']();
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

export default BaseService;
