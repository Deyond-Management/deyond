/**
 * AlertService
 * PagerDuty, Slack, and other alert integrations
 */

type AlertSeverity = 'critical' | 'error' | 'warning' | 'info';
type AlertChannel = 'pagerduty' | 'slack' | 'email' | 'webhook';

interface AlertConfig {
  pagerduty?: {
    integrationKey: string;
    serviceId: string;
  };
  slack?: {
    webhookUrl: string;
    channel: string;
  };
  email?: {
    recipients: string[];
    smtpConfig: {
      host: string;
      port: number;
      user: string;
      pass: string;
    };
  };
  webhooks?: Array<{
    url: string;
    headers?: Record<string, string>;
  }>;
}

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  source: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface AlertRule {
  name: string;
  condition: (metrics: Record<string, number>) => boolean;
  severity: AlertSeverity;
  channels: AlertChannel[];
  cooldown: number; // ms between alerts
}

export class AlertService {
  private config: AlertConfig;
  private alertHistory: Alert[] = [];
  private lastAlertTime: Map<string, number> = new Map();
  private rules: AlertRule[] = [];

  constructor(config: AlertConfig) {
    this.config = config;
    this.initializeDefaultRules();
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    this.rules = [
      {
        name: 'high_error_rate',
        condition: metrics => (metrics.error_rate || 0) > 10,
        severity: 'critical',
        channels: ['pagerduty', 'slack'],
        cooldown: 300000, // 5 minutes
      },
      {
        name: 'high_latency',
        condition: metrics => (metrics.api_latency_p95 || 0) > 2000,
        severity: 'warning',
        channels: ['slack'],
        cooldown: 600000, // 10 minutes
      },
      {
        name: 'transaction_failures',
        condition: metrics => (metrics.tx_failure_rate || 0) > 5,
        severity: 'error',
        channels: ['pagerduty', 'slack'],
        cooldown: 300000,
      },
      {
        name: 'rpc_provider_down',
        condition: metrics => (metrics.rpc_success_rate || 100) < 90,
        severity: 'critical',
        channels: ['pagerduty', 'slack'],
        cooldown: 60000, // 1 minute
      },
    ];
  }

  /**
   * Add custom alert rule
   */
  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  /**
   * Evaluate all rules against current metrics
   */
  async evaluateRules(metrics: Record<string, number>): Promise<void> {
    for (const rule of this.rules) {
      if (rule.condition(metrics)) {
        const lastTime = this.lastAlertTime.get(rule.name) || 0;
        if (Date.now() - lastTime > rule.cooldown) {
          await this.sendAlert(
            {
              id: `${rule.name}_${Date.now()}`,
              title: `Alert: ${rule.name.replace(/_/g, ' ')}`,
              message: `Rule "${rule.name}" triggered`,
              severity: rule.severity,
              source: 'alert_service',
              timestamp: Date.now(),
              metadata: metrics,
            },
            rule.channels
          );

          this.lastAlertTime.set(rule.name, Date.now());
        }
      }
    }
  }

  /**
   * Send alert to specified channels
   */
  async sendAlert(alert: Alert, channels: AlertChannel[]): Promise<void> {
    this.alertHistory.push(alert);

    const promises = channels.map(channel => {
      switch (channel) {
        case 'pagerduty':
          return this.sendToPagerDuty(alert);
        case 'slack':
          return this.sendToSlack(alert);
        case 'email':
          return this.sendEmail(alert);
        case 'webhook':
          return this.sendToWebhooks(alert);
        default:
          return Promise.resolve();
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Send alert to PagerDuty
   */
  private async sendToPagerDuty(alert: Alert): Promise<void> {
    if (!this.config.pagerduty) return;

    const payload = {
      routing_key: this.config.pagerduty.integrationKey,
      event_action: 'trigger',
      dedup_key: alert.id,
      payload: {
        summary: alert.title,
        severity: this.mapSeverityToPagerDuty(alert.severity),
        source: alert.source,
        timestamp: new Date(alert.timestamp).toISOString(),
        custom_details: {
          message: alert.message,
          ...alert.metadata,
        },
      },
    };

    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  /**
   * Map severity to PagerDuty format
   */
  private mapSeverityToPagerDuty(severity: AlertSeverity): string {
    const mapping: Record<AlertSeverity, string> = {
      critical: 'critical',
      error: 'error',
      warning: 'warning',
      info: 'info',
    };
    return mapping[severity];
  }

  /**
   * Send alert to Slack
   */
  private async sendToSlack(alert: Alert): Promise<void> {
    if (!this.config.slack) return;

    const color = this.getSeverityColor(alert.severity);

    const payload = {
      channel: this.config.slack.channel,
      attachments: [
        {
          color,
          title: alert.title,
          text: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Source',
              value: alert.source,
              short: true,
            },
            {
              title: 'Time',
              value: new Date(alert.timestamp).toISOString(),
              short: false,
            },
          ],
          footer: 'Deyond Wallet Alert System',
          ts: Math.floor(alert.timestamp / 1000),
        },
      ],
    };

    await fetch(this.config.slack.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  /**
   * Get color for severity
   */
  private getSeverityColor(severity: AlertSeverity): string {
    const colors: Record<AlertSeverity, string> = {
      critical: '#FF0000',
      error: '#FF6600',
      warning: '#FFCC00',
      info: '#0066FF',
    };
    return colors[severity];
  }

  /**
   * Send email alert
   */
  private async sendEmail(alert: Alert): Promise<void> {
    if (!this.config.email) return;

    // Email sending would be implemented with nodemailer or similar
    // This is a placeholder for the actual implementation
    // TODO: Implement email alert sending
  }

  /**
   * Send alert to webhooks
   */
  private async sendToWebhooks(alert: Alert): Promise<void> {
    if (!this.config.webhooks) return;

    const promises = this.config.webhooks.map(webhook =>
      fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers,
        },
        body: JSON.stringify(alert),
      })
    );

    await Promise.allSettled(promises);
  }

  /**
   * Manually trigger an alert
   */
  async triggerAlert(
    title: string,
    message: string,
    severity: AlertSeverity,
    channels: AlertChannel[] = ['slack'],
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const alert: Alert = {
      id: `manual_${Date.now()}`,
      title,
      message,
      severity,
      source: 'manual',
      timestamp: Date.now(),
      metadata,
    };

    await this.sendAlert(alert, channels);
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Clear alert history
   */
  clearHistory(): void {
    this.alertHistory = [];
  }

  /**
   * Resolve a PagerDuty alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    if (!this.config.pagerduty) return;

    const payload = {
      routing_key: this.config.pagerduty.integrationKey,
      event_action: 'resolve',
      dedup_key: alertId,
    };

    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
}

export default AlertService;
