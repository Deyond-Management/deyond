/**
 * NetworkService
 * Secure network client with SSL pinning support
 */

interface NetworkServiceConfig {
  timeout?: number;
}

interface RequestOptions {
  headers?: Record<string, string>;
  retries?: number;
  signal?: AbortSignal;
}

type PinConfig = Record<string, string[]>;

export class NetworkService {
  private pins: Map<string, string[]> = new Map();
  private timeout: number;

  constructor(config?: NetworkServiceConfig) {
    this.timeout = config?.timeout || 30000;
  }

  /**
   * Configure SSL pins for multiple domains
   */
  configurePins(pins: PinConfig): void {
    Object.entries(pins).forEach(([domain, pinList]) => {
      this.pins.set(domain, [...pinList]);
    });
  }

  /**
   * Add SSL pin for a domain
   */
  addPin(domain: string, pin: string): void {
    const existing = this.pins.get(domain) || [];
    if (!existing.includes(pin)) {
      existing.push(pin);
      this.pins.set(domain, existing);
    }
  }

  /**
   * Remove SSL pin for a domain
   */
  removePin(domain: string, pin: string): void {
    const existing = this.pins.get(domain) || [];
    const filtered = existing.filter((p) => p !== pin);
    this.pins.set(domain, filtered);
  }

  /**
   * Clear all pins for a domain
   */
  clearPins(domain: string): void {
    this.pins.set(domain, []);
  }

  /**
   * Get pins for a domain
   */
  getPins(domain: string): string[] {
    return this.pins.get(domain) || [];
  }

  /**
   * Make secure GET request
   */
  async secureGet<T>(url: string, options?: RequestOptions): Promise<T> {
    this.validateHttps(url);
    return this.request<T>('GET', url, undefined, options);
  }

  /**
   * Make secure POST request
   */
  async securePost<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    this.validateHttps(url);
    return this.request<T>('POST', url, body, options);
  }

  /**
   * Make secure PUT request
   */
  async securePut<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    this.validateHttps(url);
    return this.request<T>('PUT', url, body, options);
  }

  /**
   * Make secure DELETE request
   */
  async secureDelete<T>(url: string, options?: RequestOptions): Promise<T> {
    this.validateHttps(url);
    return this.request<T>('DELETE', url, undefined, options);
  }

  /**
   * Validate certificate against pins
   */
  validateCertificate(domain: string, certificatePin: string): boolean {
    const pins = this.getPins(domain);

    // Allow unpinned domains
    if (pins.length === 0) {
      return true;
    }

    return pins.includes(certificatePin);
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }

  /**
   * Check if network is available
   */
  async isNetworkAvailable(): Promise<boolean> {
    try {
      await fetch('https://www.google.com', {
        method: 'HEAD',
        mode: 'no-cors',
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate that URL uses HTTPS
   */
  private validateHttps(url: string): void {
    if (!url.startsWith('https://')) {
      throw new Error('HTTPS required');
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const retries = options?.retries || 0;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: options?.signal,
        });

        if (!response.ok) {
          throw new Error(response.statusText);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;

        if (attempt < retries) {
          await this.delay(Math.pow(2, attempt) * 1000);
          continue;
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: options.signal || controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default NetworkService;
