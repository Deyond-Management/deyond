/**
 * AnalyticsService
 * Privacy-focused analytics tracking
 */

interface AnalyticsConfig {
  enabled: boolean;
  debug?: boolean;
  anonymize?: boolean;
}

interface EventData {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: number;
}

interface TransactionData extends Record<string, unknown> {
  network: string;
  token?: string;
  amount?: string;
  gasUsed?: string;
  error?: string;
}

export class AnalyticsService {
  private enabled: boolean = false;
  private debug: boolean = false;
  private anonymize: boolean = false;
  private userId: string | null = null;
  private userProperties: Record<string, unknown> = {};
  private eventQueue: EventData[] = [];
  private isOffline: boolean = false;
  private doNotTrack: boolean = false;

  /**
   * Initialize analytics
   */
  initialize(config: AnalyticsConfig): void {
    this.enabled = config.enabled;
    this.debug = config.debug || false;
    this.anonymize = config.anonymize || false;
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Track custom event
   */
  track(eventName: string, properties?: Record<string, unknown>): void {
    if (!this.shouldTrack()) {
      return;
    }

    const event: EventData = {
      name: eventName,
      properties,
      timestamp: Date.now(),
    };

    if (this.isOffline) {
      this.eventQueue.push(event);
      return;
    }

    this.sendEvent(event);
  }

  /**
   * Track screen view
   */
  trackScreen(screenName: string, properties?: Record<string, unknown>): void {
    this.track('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  /**
   * Set user ID
   */
  setUserId(userId: string): void {
    if (this.anonymize) {
      this.userId = this.hashValue(userId);
    } else {
      this.userId = userId;
    }
  }

  /**
   * Get user ID
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, unknown>): void {
    this.userProperties = {
      ...this.userProperties,
      ...properties,
    };
  }

  /**
   * Get user properties
   */
  getUserProperties(): Record<string, unknown> {
    return this.userProperties;
  }

  /**
   * Clear user data
   */
  clearUser(): void {
    this.userId = null;
    this.userProperties = {};
  }

  // Wallet events
  trackWalletCreated(network: string): void {
    this.track('wallet_created', { network });
  }

  trackWalletImported(network: string, importMethod: string): void {
    this.track('wallet_imported', {
      network,
      import_method: importMethod,
    });
  }

  // Transaction events
  trackTransactionSent(data: TransactionData): void {
    this.track('transaction_sent', data);
  }

  trackTransactionReceived(data: TransactionData): void {
    this.track('transaction_received', data);
  }

  trackTransactionFailed(data: TransactionData): void {
    this.track('transaction_failed', data);
  }

  // Engagement events
  trackAppOpen(): void {
    this.track('app_open', {
      timestamp: Date.now(),
    });
  }

  trackSessionStart(): void {
    this.track('session_start', {
      timestamp: Date.now(),
    });
  }

  trackSessionEnd(durationSeconds: number): void {
    this.track('session_end', {
      duration_seconds: durationSeconds,
    });
  }

  // Feature usage
  trackFeatureUsed(feature: string): void {
    this.track('feature_used', { feature });
  }

  trackError(errorType: string, errorMessage: string): void {
    this.track('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
    });
  }

  // Offline support
  setOffline(offline: boolean): void {
    this.isOffline = offline;
  }

  getEventQueue(): EventData[] {
    return [...this.eventQueue];
  }

  async flushQueue(): Promise<void> {
    if (this.isOffline) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    for (const event of events) {
      this.sendEvent(event);
    }
  }

  // Privacy
  setDoNotTrack(dnt: boolean): void {
    this.doNotTrack = dnt;
  }

  private shouldTrack(): boolean {
    return this.enabled && !this.doNotTrack;
  }

  private sendEvent(event: EventData): void {
    if (this.debug) {
      console.log('[Analytics]', event.name, event.properties);
    }

    // In production, send to analytics backend
    // For now, just log in debug mode
  }

  private hashValue(value: string): string {
    // Simple hash for anonymization
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

export default AnalyticsService;
