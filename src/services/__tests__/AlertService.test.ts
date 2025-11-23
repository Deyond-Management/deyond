import AlertService from '../AlertService';

// Mock fetch
global.fetch = jest.fn();

describe('AlertService', () => {
  let service: AlertService;
  const mockConfig = {
    pagerduty: {
      integrationKey: 'test-pd-key',
      serviceId: 'test-service',
    },
    slack: {
      webhookUrl: 'https://hooks.slack.com/test',
      channel: '#alerts',
    },
    webhooks: [{ url: 'https://webhook.test/alert' }],
  };

  beforeEach(() => {
    service = new AlertService(mockConfig);
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({ ok: true });
  });

  describe('constructor', () => {
    it('should create service with config', () => {
      expect(service).toBeDefined();
    });
  });

  describe('triggerAlert', () => {
    it('should send alert to slack', async () => {
      await service.triggerAlert('Test Alert', 'This is a test', 'warning', ['slack']);

      expect(fetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should send alert to pagerduty', async () => {
      await service.triggerAlert('Critical Alert', 'System down', 'critical', ['pagerduty']);

      expect(fetch).toHaveBeenCalledWith(
        'https://events.pagerduty.com/v2/enqueue',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"event_action":"trigger"'),
        })
      );
    });

    it('should send alert to webhooks', async () => {
      await service.triggerAlert('Webhook Alert', 'Test message', 'info', ['webhook']);

      expect(fetch).toHaveBeenCalledWith(
        'https://webhook.test/alert',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should send to multiple channels', async () => {
      await service.triggerAlert('Multi Channel', 'Test', 'error', ['slack', 'pagerduty']);

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should include metadata in alert', async () => {
      const metadata = { userId: '123', errorCode: 500 };

      await service.triggerAlert('Alert with metadata', 'Test', 'error', ['slack'], metadata);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.attachments[0].fields).toBeDefined();
    });
  });

  describe('evaluateRules', () => {
    it('should trigger alert when rule condition is met', async () => {
      const metrics = {
        error_rate: 15, // Above threshold of 10
      };

      await service.evaluateRules(metrics);

      // Should trigger high_error_rate alert
      expect(fetch).toHaveBeenCalled();
    });

    it('should not trigger alert when condition not met', async () => {
      const metrics = {
        error_rate: 5, // Below threshold
      };

      await service.evaluateRules(metrics);

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should respect cooldown period', async () => {
      const metrics = {
        error_rate: 15,
      };

      // First evaluation triggers alert
      await service.evaluateRules(metrics);
      expect(fetch).toHaveBeenCalledTimes(2); // pagerduty + slack

      // Second evaluation within cooldown should not trigger
      await service.evaluateRules(metrics);
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('addRule', () => {
    it('should add custom rule', async () => {
      service.addRule({
        name: 'custom_rule',
        condition: metrics => metrics.custom_metric > 100,
        severity: 'warning',
        channels: ['slack'],
        cooldown: 60000,
      });

      const metrics = { custom_metric: 150 };
      await service.evaluateRules(metrics);

      // Should trigger custom rule
      expect(fetch).toHaveBeenCalledWith('https://hooks.slack.com/test', expect.anything());
    });
  });

  describe('getAlertHistory', () => {
    it('should return empty history initially', () => {
      const history = service.getAlertHistory();
      expect(history).toEqual([]);
    });

    it('should return alert history after sending alerts', async () => {
      await service.triggerAlert('Test', 'Message', 'info', ['slack']);

      const history = service.getAlertHistory();
      expect(history).toHaveLength(1);
      expect(history[0].title).toBe('Test');
    });

    it('should limit history results', async () => {
      // Send multiple alerts
      for (let i = 0; i < 5; i++) {
        await service.triggerAlert(`Alert ${i}`, 'Message', 'info', ['slack']);
      }

      const history = service.getAlertHistory(3);
      expect(history).toHaveLength(3);
    });
  });

  describe('clearHistory', () => {
    it('should clear alert history', async () => {
      await service.triggerAlert('Test', 'Message', 'info', ['slack']);
      expect(service.getAlertHistory()).toHaveLength(1);

      service.clearHistory();
      expect(service.getAlertHistory()).toHaveLength(0);
    });
  });

  describe('resolveAlert', () => {
    it('should send resolve event to pagerduty', async () => {
      await service.resolveAlert('test-alert-id');

      expect(fetch).toHaveBeenCalledWith(
        'https://events.pagerduty.com/v2/enqueue',
        expect.objectContaining({
          body: expect.stringContaining('"event_action":"resolve"'),
        })
      );
    });
  });

  describe('severity colors', () => {
    it('should use correct color for critical', async () => {
      await service.triggerAlert('Critical', 'Test', 'critical', ['slack']);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.attachments[0].color).toBe('#FF0000');
    });

    it('should use correct color for warning', async () => {
      await service.triggerAlert('Warning', 'Test', 'warning', ['slack']);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.attachments[0].color).toBe('#FFCC00');
    });
  });
});
