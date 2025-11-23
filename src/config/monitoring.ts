/**
 * Monitoring Configuration
 * Grafana, DataDog, and custom metrics setup
 */

// Metric types
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

interface MetricDefinition {
  name: string;
  type: MetricType;
  description: string;
  labels?: string[];
}

// Application metrics
export const appMetrics: MetricDefinition[] = [
  // Performance metrics
  {
    name: 'app_startup_time_seconds',
    type: 'histogram',
    description: 'Time taken for app to start',
  },
  {
    name: 'screen_load_time_seconds',
    type: 'histogram',
    description: 'Time taken to load a screen',
    labels: ['screen_name'],
  },
  {
    name: 'api_request_duration_seconds',
    type: 'histogram',
    description: 'API request duration',
    labels: ['endpoint', 'method', 'status'],
  },

  // Transaction metrics
  {
    name: 'transactions_total',
    type: 'counter',
    description: 'Total number of transactions',
    labels: ['network', 'status'],
  },
  {
    name: 'transaction_value_eth',
    type: 'histogram',
    description: 'Transaction value in ETH',
    labels: ['network'],
  },
  {
    name: 'gas_used_wei',
    type: 'histogram',
    description: 'Gas used per transaction',
    labels: ['network'],
  },

  // Wallet metrics
  {
    name: 'wallets_created_total',
    type: 'counter',
    description: 'Total wallets created',
  },
  {
    name: 'wallets_imported_total',
    type: 'counter',
    description: 'Total wallets imported',
  },
  {
    name: 'active_wallets',
    type: 'gauge',
    description: 'Number of active wallets',
  },

  // Error metrics
  {
    name: 'errors_total',
    type: 'counter',
    description: 'Total errors',
    labels: ['error_type', 'severity'],
  },
  {
    name: 'crashes_total',
    type: 'counter',
    description: 'Total app crashes',
    labels: ['platform'],
  },

  // Network metrics
  {
    name: 'rpc_requests_total',
    type: 'counter',
    description: 'Total RPC requests',
    labels: ['provider', 'method', 'status'],
  },
  {
    name: 'rpc_latency_seconds',
    type: 'histogram',
    description: 'RPC request latency',
    labels: ['provider'],
  },

  // User engagement
  {
    name: 'dau',
    type: 'gauge',
    description: 'Daily active users',
  },
  {
    name: 'session_duration_seconds',
    type: 'histogram',
    description: 'User session duration',
  },
];

// Grafana dashboard configuration
export const grafanaDashboard = {
  title: 'Deyond Wallet Dashboard',
  uid: 'deyond-wallet-main',
  panels: [
    {
      id: 1,
      title: 'Active Users',
      type: 'stat',
      gridPos: { h: 4, w: 6, x: 0, y: 0 },
      targets: [
        {
          expr: 'dau',
          legendFormat: 'DAU',
        },
      ],
    },
    {
      id: 2,
      title: 'Transaction Success Rate',
      type: 'gauge',
      gridPos: { h: 4, w: 6, x: 6, y: 0 },
      targets: [
        {
          expr: 'sum(transactions_total{status="success"}) / sum(transactions_total) * 100',
          legendFormat: 'Success Rate',
        },
      ],
    },
    {
      id: 3,
      title: 'API Latency P95',
      type: 'stat',
      gridPos: { h: 4, w: 6, x: 12, y: 0 },
      targets: [
        {
          expr: 'histogram_quantile(0.95, api_request_duration_seconds_bucket)',
          legendFormat: 'P95 Latency',
        },
      ],
    },
    {
      id: 4,
      title: 'Error Rate',
      type: 'stat',
      gridPos: { h: 4, w: 6, x: 18, y: 0 },
      targets: [
        {
          expr: 'sum(rate(errors_total[5m]))',
          legendFormat: 'Errors/s',
        },
      ],
    },
    {
      id: 5,
      title: 'Transactions Over Time',
      type: 'graph',
      gridPos: { h: 8, w: 12, x: 0, y: 4 },
      targets: [
        {
          expr: 'sum(rate(transactions_total[5m])) by (status)',
          legendFormat: '{{status}}',
        },
      ],
    },
    {
      id: 6,
      title: 'RPC Provider Health',
      type: 'graph',
      gridPos: { h: 8, w: 12, x: 12, y: 4 },
      targets: [
        {
          expr: 'histogram_quantile(0.95, rpc_latency_seconds_bucket) by (provider)',
          legendFormat: '{{provider}}',
        },
      ],
    },
  ],
};

// DataDog configuration
export const datadogConfig = {
  site: 'datadoghq.com',
  service: 'deyond-wallet',
  env: process.env.NODE_ENV || 'development',
  version: process.env.APP_VERSION || '1.0.0',

  // APM settings
  apm: {
    enabled: true,
    tracesSampleRate: 0.1,
  },

  // RUM settings
  rum: {
    applicationId: process.env.DATADOG_RUM_APP_ID,
    clientToken: process.env.DATADOG_CLIENT_TOKEN,
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackInteractions: true,
    trackResources: true,
    trackLongTasks: true,
  },

  // Log settings
  logs: {
    forwardConsoleLogs: ['error', 'warn'],
    forwardReports: ['error'],
  },

  // Custom tags
  tags: {
    team: 'mobile',
    product: 'wallet',
  },
};

// Alert thresholds
export const alertThresholds = {
  // Performance alerts
  apiLatencyP95: 2000, // ms
  rpcLatencyP95: 1000, // ms
  appStartupTime: 3000, // ms

  // Error alerts
  errorRatePerMinute: 10,
  crashRatePerHour: 5,

  // Business alerts
  transactionFailureRate: 5, // %
  lowBalanceWarning: 0.01, // ETH

  // Infrastructure alerts
  cpuUsagePercent: 80,
  memoryUsagePercent: 85,
};

// Custom metrics collector
export class MetricsCollector {
  private metrics: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  increment(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels);
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + value);
  }

  gauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels);
    this.metrics.set(key, value);
  }

  histogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }

  private getKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  getMetrics(): Record<string, number | number[]> {
    const result: Record<string, number | number[]> = {};

    this.metrics.forEach((value, key) => {
      result[key] = value;
    });

    this.histograms.forEach((values, key) => {
      result[key] = values;
    });

    return result;
  }

  reset(): void {
    this.metrics.clear();
    this.histograms.clear();
  }
}

export const metricsCollector = new MetricsCollector();
export default metricsCollector;
