/**
 * PriceAlertService
 * Service for managing and monitoring price alerts
 */

import { v4 as uuidv4 } from 'uuid';
import {
  PriceAlert,
  CreateAlertParams,
  AlertStatus,
  TokenPrice,
  PriceCheckResult,
  DEFAULT_CHECK_INTERVAL,
  MAX_ALERTS_PER_USER,
} from './types';
import {
  getPushNotificationService,
  NotificationType,
} from '../notification/PushNotificationService';

// Simple UUID generator if uuid package not available
const generateId = (): string => {
  try {
    return uuidv4();
  } catch {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

class PriceAlertService {
  private alerts: Map<string, PriceAlert> = new Map();
  private priceCache: Map<string, TokenPrice> = new Map();
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;
  private onAlertTriggered?: (alert: PriceAlert) => void;

  /**
   * Initialize the service with existing alerts
   */
  initialize(alerts: PriceAlert[]): void {
    this.alerts.clear();
    alerts.forEach(alert => {
      this.alerts.set(alert.id, alert);
    });
  }

  /**
   * Set callback for when an alert is triggered
   */
  setAlertTriggeredCallback(callback: (alert: PriceAlert) => void): void {
    this.onAlertTriggered = callback;
  }

  /**
   * Create a new price alert
   */
  createAlert(params: CreateAlertParams): PriceAlert {
    if (this.alerts.size >= MAX_ALERTS_PER_USER) {
      throw new Error(`Maximum of ${MAX_ALERTS_PER_USER} alerts allowed`);
    }

    const alert: PriceAlert = {
      id: generateId(),
      tokenSymbol: params.tokenSymbol,
      tokenAddress: params.tokenAddress,
      chainId: params.chainId,
      condition: params.condition,
      targetPrice: params.targetPrice,
      changePercent: params.changePercent,
      changeDirection: params.changeDirection,
      timeframe: params.timeframe,
      createdAt: Date.now(),
      status: 'active',
      notificationSent: false,
      repeating: params.repeating ?? false,
    };

    this.alerts.set(alert.id, alert);
    return alert;
  }

  /**
   * Get all alerts
   */
  getAlerts(): PriceAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PriceAlert[] {
    return this.getAlerts().filter(alert => alert.status === 'active');
  }

  /**
   * Get alert by ID
   */
  getAlert(id: string): PriceAlert | undefined {
    return this.alerts.get(id);
  }

  /**
   * Update alert status
   */
  updateAlertStatus(id: string, status: AlertStatus): PriceAlert | undefined {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.status = status;
      if (status === 'triggered') {
        alert.triggeredAt = Date.now();
      }
      this.alerts.set(id, alert);
    }
    return alert;
  }

  /**
   * Delete an alert
   */
  deleteAlert(id: string): boolean {
    return this.alerts.delete(id);
  }

  /**
   * Enable/disable an alert
   */
  toggleAlert(id: string): PriceAlert | undefined {
    const alert = this.alerts.get(id);
    if (alert) {
      if (alert.status === 'active') {
        alert.status = 'disabled';
      } else if (alert.status === 'disabled') {
        alert.status = 'active';
      } else if (alert.status === 'triggered' && alert.repeating) {
        alert.status = 'active';
        alert.notificationSent = false;
      }
      this.alerts.set(id, alert);
    }
    return alert;
  }

  /**
   * Start monitoring prices
   */
  startMonitoring(interval: number = DEFAULT_CHECK_INTERVAL): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.checkInterval = setInterval(() => {
      this.checkAlerts();
    }, interval);

    // Initial check
    this.checkAlerts();
  }

  /**
   * Stop monitoring prices
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
  }

  /**
   * Check all active alerts against current prices
   */
  async checkAlerts(): Promise<PriceCheckResult[]> {
    const activeAlerts = this.getActiveAlerts();
    const results: PriceCheckResult[] = [];

    for (const alert of activeAlerts) {
      try {
        const price = await this.getTokenPrice(alert.tokenSymbol, alert.chainId);
        if (price) {
          const result = this.evaluateAlert(alert, price);
          results.push(result);

          // Update alert with current price
          alert.currentPrice = price.price;
          this.alerts.set(alert.id, alert);

          // Handle triggered alerts
          if (result.triggered && !alert.notificationSent) {
            await this.handleTriggeredAlert(alert, result);
          }
        }
      } catch (error) {
        console.error(`Error checking alert ${alert.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Evaluate if an alert should trigger based on current price
   */
  private evaluateAlert(alert: PriceAlert, price: TokenPrice): PriceCheckResult {
    let triggered = false;
    let message = '';

    switch (alert.condition) {
      case 'above':
        if (alert.targetPrice && price.price >= alert.targetPrice) {
          triggered = true;
          message = `${alert.tokenSymbol} is now above $${alert.targetPrice.toFixed(2)} at $${price.price.toFixed(2)}`;
        }
        break;

      case 'below':
        if (alert.targetPrice && price.price <= alert.targetPrice) {
          triggered = true;
          message = `${alert.tokenSymbol} is now below $${alert.targetPrice.toFixed(2)} at $${price.price.toFixed(2)}`;
        }
        break;

      case 'change_percent':
        if (alert.changePercent) {
          let change = 0;
          switch (alert.timeframe) {
            case '1h':
              change = price.change1h ?? 0;
              break;
            case '24h':
              change = price.change24h;
              break;
            case '7d':
              change = price.change7d ?? 0;
              break;
          }

          const absChange = Math.abs(change);
          const meetsThreshold = absChange >= alert.changePercent;

          if (meetsThreshold) {
            if (alert.changeDirection === 'any') {
              triggered = true;
            } else if (alert.changeDirection === 'up' && change > 0) {
              triggered = true;
            } else if (alert.changeDirection === 'down' && change < 0) {
              triggered = true;
            }
          }

          if (triggered) {
            const direction = change > 0 ? 'up' : 'down';
            message = `${alert.tokenSymbol} moved ${direction} ${absChange.toFixed(2)}% in the last ${alert.timeframe}`;
          }
        }
        break;
    }

    return {
      alert,
      triggered,
      currentPrice: price.price,
      message,
    };
  }

  /**
   * Handle a triggered alert
   */
  private async handleTriggeredAlert(alert: PriceAlert, result: PriceCheckResult): Promise<void> {
    // Update alert status
    alert.status = 'triggered';
    alert.triggeredAt = Date.now();
    alert.notificationSent = true;
    this.alerts.set(alert.id, alert);

    // Send push notification
    try {
      const notificationService = getPushNotificationService();
      await notificationService.sendLocalNotification({
        type: NotificationType.PRICE_THRESHOLD,
        title: `${alert.tokenSymbol} Price Alert`,
        body: result.message || `Price alert triggered for ${alert.tokenSymbol}`,
        data: {
          alertId: alert.id,
          tokenSymbol: alert.tokenSymbol,
          price: result.currentPrice,
        },
      });
    } catch (error) {
      console.error('Failed to send price alert notification:', error);
    }

    // Callback
    if (this.onAlertTriggered) {
      this.onAlertTriggered(alert);
    }

    // If repeating, reset after a delay
    if (alert.repeating) {
      setTimeout(() => {
        alert.status = 'active';
        alert.notificationSent = false;
        this.alerts.set(alert.id, alert);
      }, 60000); // 1 minute cooldown before re-enabling
    }
  }

  /**
   * Get token price (mock implementation - would integrate with real price service)
   */
  private async getTokenPrice(symbol: string, chainId: number): Promise<TokenPrice | null> {
    const cacheKey = `${symbol}_${chainId}`;
    const cached = this.priceCache.get(cacheKey);

    // Return cached price if less than 30 seconds old
    if (cached && Date.now() - cached.lastUpdated < 30000) {
      return cached;
    }

    try {
      // In real implementation, this would fetch from a price API
      // For demo, generate mock prices
      const mockPrice = this.generateMockPrice(symbol);

      const price: TokenPrice = {
        symbol,
        chainId,
        price: mockPrice.price,
        change24h: mockPrice.change24h,
        change1h: mockPrice.change1h,
        change7d: mockPrice.change7d,
        lastUpdated: Date.now(),
      };

      this.priceCache.set(cacheKey, price);
      return price;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return cached || null;
    }
  }

  /**
   * Generate mock price data for demo
   */
  private generateMockPrice(symbol: string): {
    price: number;
    change24h: number;
    change1h: number;
    change7d: number;
  } {
    // Base prices for common tokens
    const basePrices: Record<string, number> = {
      ETH: 2500,
      BTC: 45000,
      USDC: 1,
      USDT: 1,
      DAI: 1,
      MATIC: 0.8,
      ARB: 1.2,
      OP: 2.5,
      AVAX: 35,
      FTM: 0.5,
    };

    const basePrice = basePrices[symbol] || 10;

    // Add some randomness
    const variance = basePrice * 0.02; // 2% variance
    const price = basePrice + (Math.random() - 0.5) * variance;

    return {
      price,
      change24h: (Math.random() - 0.5) * 10, // -5% to +5%
      change1h: (Math.random() - 0.5) * 2, // -1% to +1%
      change7d: (Math.random() - 0.5) * 20, // -10% to +10%
    };
  }

  /**
   * Update price cache (called from external price service)
   */
  updatePriceCache(price: TokenPrice): void {
    const cacheKey = `${price.symbol}_${price.chainId}`;
    this.priceCache.set(cacheKey, {
      ...price,
      lastUpdated: Date.now(),
    });
  }

  /**
   * Clear all alerts
   */
  clearAllAlerts(): void {
    this.alerts.clear();
  }

  /**
   * Get monitoring status
   */
  isMonitoring(): boolean {
    return this.isRunning;
  }
}

// Singleton instance
let priceAlertServiceInstance: PriceAlertService | null = null;

export const getPriceAlertService = (): PriceAlertService => {
  if (!priceAlertServiceInstance) {
    priceAlertServiceInstance = new PriceAlertService();
  }
  return priceAlertServiceInstance;
};

export default PriceAlertService;
