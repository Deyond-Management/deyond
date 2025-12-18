/**
 * Price Alert Types
 * Type definitions for price alert system
 */

export type AlertCondition = 'above' | 'below' | 'change_percent';
export type AlertStatus = 'active' | 'triggered' | 'disabled' | 'expired';

export interface PriceAlert {
  id: string;
  tokenSymbol: string;
  tokenAddress?: string;
  chainId: number;
  condition: AlertCondition;
  targetPrice?: number; // For 'above' and 'below' conditions
  changePercent?: number; // For 'change_percent' condition (e.g., 5 for 5%)
  changeDirection?: 'up' | 'down' | 'any'; // For 'change_percent' condition
  timeframe?: '1h' | '24h' | '7d'; // For 'change_percent' condition
  createdAt: number;
  triggeredAt?: number;
  status: AlertStatus;
  currentPrice?: number;
  notificationSent: boolean;
  repeating: boolean; // If true, alert reactivates after triggering
}

export interface CreateAlertParams {
  tokenSymbol: string;
  tokenAddress?: string;
  chainId: number;
  condition: AlertCondition;
  targetPrice?: number;
  changePercent?: number;
  changeDirection?: 'up' | 'down' | 'any';
  timeframe?: '1h' | '24h' | '7d';
  repeating?: boolean;
}

export interface PriceAlertState {
  alerts: PriceAlert[];
  isLoading: boolean;
  error: string | null;
  lastChecked: number | null;
}

export interface TokenPrice {
  symbol: string;
  address?: string;
  chainId: number;
  price: number;
  change24h: number;
  change1h?: number;
  change7d?: number;
  lastUpdated: number;
}

export interface PriceCheckResult {
  alert: PriceAlert;
  triggered: boolean;
  currentPrice: number;
  message?: string;
}

export const DEFAULT_CHECK_INTERVAL = 60000; // 1 minute
export const MAX_ALERTS_PER_USER = 20;
