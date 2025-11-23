/**
 * BaseHttpClient
 * Centralized HTTP client with retry logic, timeout, and error handling
 */

import { API_TIMEOUT, RETRY_CONFIG } from '../../config/constants';
import { ERROR_CODES, mapHttpError, getErrorMessage } from '../../config/constants/ErrorCodes';

export interface HttpClientConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
  maxRetries?: number;
  retryDelay?: number;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  skipRetry?: boolean;
}

export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
}

export class HttpError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class BaseHttpClient {
  protected config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = {
      timeout: API_TIMEOUT.DEFAULT,
      maxRetries: RETRY_CONFIG.MAX_ATTEMPTS,
      retryDelay: RETRY_CONFIG.INITIAL_DELAY,
      ...config,
    };
  }

  /**
   * Make GET request
   */
  async get<T>(path: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>('GET', path, undefined, config);
  }

  /**
   * Make POST request
   */
  async post<T>(path: string, body?: unknown, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>('POST', path, body, config);
  }

  /**
   * Make PUT request
   */
  async put<T>(path: string, body?: unknown, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>('PUT', path, body, config);
  }

  /**
   * Make DELETE request
   */
  async delete<T>(path: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>('DELETE', path, undefined, config);
  }

  /**
   * Make request with retry logic
   */
  protected async request<T>(
    method: string,
    path: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<HttpResponse<T>> {
    const url = `${this.config.baseUrl}${path}`;
    const timeout = config?.timeout || this.config.timeout!;
    const maxRetries = config?.skipRetry ? 0 : this.config.maxRetries!;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(
          url,
          {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...this.config.headers,
              ...config?.headers,
            },
            body: body ? JSON.stringify(body) : undefined,
          },
          timeout
        );

        if (!response.ok) {
          const errorCode = mapHttpError(response.status);
          throw new HttpError(
            errorCode,
            getErrorMessage(errorCode),
            response.status,
            await this.safeParseJson(response)
          );
        }

        const data = await this.safeParseJson(response);
        return {
          data: data as T,
          status: response.status,
          headers: response.headers,
        };
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof HttpError && error.statusCode && error.statusCode < 500) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying with exponential backoff
        const delay = this.config.retryDelay! * Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, attempt);
        await this.sleep(Math.min(delay, RETRY_CONFIG.MAX_DELAY));
      }
    }

    // If we exhausted retries, throw the last error
    if (lastError instanceof HttpError) {
      throw lastError;
    }

    throw new HttpError(
      ERROR_CODES.NETWORK_ERROR,
      lastError?.message || getErrorMessage(ERROR_CODES.NETWORK_ERROR)
    );
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new HttpError(ERROR_CODES.TIMEOUT, getErrorMessage(ERROR_CODES.TIMEOUT));
      }
      throw new HttpError(ERROR_CODES.NETWORK_ERROR, (error as Error).message);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Safely parse JSON response
   */
  private async safeParseJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update base URL
   */
  setBaseUrl(url: string): void {
    this.config.baseUrl = url;
  }

  /**
   * Update default headers
   */
  setHeaders(headers: Record<string, string>): void {
    this.config.headers = { ...this.config.headers, ...headers };
  }
}

export default BaseHttpClient;
