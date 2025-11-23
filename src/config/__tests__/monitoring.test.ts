import {
  appMetrics,
  grafanaDashboard,
  datadogConfig,
  alertThresholds,
  MetricsCollector,
  metricsCollector,
} from '../monitoring';

describe('Monitoring Configuration', () => {
  describe('appMetrics', () => {
    it('should define performance metrics', () => {
      const perfMetrics = appMetrics.filter(
        m => m.name.includes('time') || m.name.includes('duration')
      );
      expect(perfMetrics.length).toBeGreaterThan(0);
    });

    it('should define transaction metrics', () => {
      const txMetrics = appMetrics.filter(m => m.name.includes('transaction'));
      expect(txMetrics.length).toBeGreaterThan(0);
    });

    it('should define error metrics', () => {
      const errorMetrics = appMetrics.filter(
        m => m.name.includes('error') || m.name.includes('crash')
      );
      expect(errorMetrics.length).toBeGreaterThan(0);
    });

    it('should have valid metric types', () => {
      const validTypes = ['counter', 'gauge', 'histogram', 'summary'];
      appMetrics.forEach(metric => {
        expect(validTypes).toContain(metric.type);
      });
    });
  });

  describe('grafanaDashboard', () => {
    it('should have title and uid', () => {
      expect(grafanaDashboard.title).toBe('Deyond Wallet Dashboard');
      expect(grafanaDashboard.uid).toBe('deyond-wallet-main');
    });

    it('should define panels', () => {
      expect(grafanaDashboard.panels.length).toBeGreaterThan(0);
    });

    it('should have panel with targets', () => {
      grafanaDashboard.panels.forEach(panel => {
        expect(panel.id).toBeDefined();
        expect(panel.title).toBeDefined();
        expect(panel.type).toBeDefined();
        expect(panel.targets).toBeDefined();
        expect(panel.targets.length).toBeGreaterThan(0);
      });
    });

    it('should have grid positions for panels', () => {
      grafanaDashboard.panels.forEach(panel => {
        expect(panel.gridPos).toBeDefined();
        expect(panel.gridPos.h).toBeGreaterThan(0);
        expect(panel.gridPos.w).toBeGreaterThan(0);
      });
    });
  });

  describe('datadogConfig', () => {
    it('should have service name', () => {
      expect(datadogConfig.service).toBe('deyond-wallet');
    });

    it('should have APM settings', () => {
      expect(datadogConfig.apm).toBeDefined();
      expect(datadogConfig.apm.enabled).toBe(true);
      expect(datadogConfig.apm.tracesSampleRate).toBeDefined();
    });

    it('should have RUM settings', () => {
      expect(datadogConfig.rum).toBeDefined();
      expect(datadogConfig.rum.sessionSampleRate).toBeDefined();
      expect(datadogConfig.rum.trackInteractions).toBe(true);
    });

    it('should have log settings', () => {
      expect(datadogConfig.logs).toBeDefined();
      expect(datadogConfig.logs.forwardConsoleLogs).toContain('error');
    });

    it('should have custom tags', () => {
      expect(datadogConfig.tags.team).toBe('mobile');
      expect(datadogConfig.tags.product).toBe('wallet');
    });
  });

  describe('alertThresholds', () => {
    it('should define performance thresholds', () => {
      expect(alertThresholds.apiLatencyP95).toBeDefined();
      expect(alertThresholds.rpcLatencyP95).toBeDefined();
      expect(alertThresholds.appStartupTime).toBeDefined();
    });

    it('should define error thresholds', () => {
      expect(alertThresholds.errorRatePerMinute).toBeDefined();
      expect(alertThresholds.crashRatePerHour).toBeDefined();
    });

    it('should define business thresholds', () => {
      expect(alertThresholds.transactionFailureRate).toBeDefined();
      expect(alertThresholds.lowBalanceWarning).toBeDefined();
    });

    it('should have reasonable values', () => {
      expect(alertThresholds.apiLatencyP95).toBeGreaterThan(0);
      expect(alertThresholds.cpuUsagePercent).toBeLessThanOrEqual(100);
      expect(alertThresholds.memoryUsagePercent).toBeLessThanOrEqual(100);
    });
  });
});

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  describe('increment', () => {
    it('should increment counter', () => {
      collector.increment('requests_total');
      collector.increment('requests_total');
      collector.increment('requests_total');

      const metrics = collector.getMetrics();
      expect(metrics['requests_total']).toBe(3);
    });

    it('should increment by value', () => {
      collector.increment('bytes_sent', 1024);

      const metrics = collector.getMetrics();
      expect(metrics['bytes_sent']).toBe(1024);
    });

    it('should increment with labels', () => {
      collector.increment('requests_total', 1, { method: 'GET' });
      collector.increment('requests_total', 1, { method: 'POST' });

      const metrics = collector.getMetrics();
      expect(metrics['requests_total{method="GET"}']).toBe(1);
      expect(metrics['requests_total{method="POST"}']).toBe(1);
    });
  });

  describe('gauge', () => {
    it('should set gauge value', () => {
      collector.gauge('active_users', 100);

      const metrics = collector.getMetrics();
      expect(metrics['active_users']).toBe(100);
    });

    it('should overwrite gauge value', () => {
      collector.gauge('active_users', 100);
      collector.gauge('active_users', 150);

      const metrics = collector.getMetrics();
      expect(metrics['active_users']).toBe(150);
    });

    it('should set gauge with labels', () => {
      collector.gauge('temperature', 25, { location: 'office' });

      const metrics = collector.getMetrics();
      expect(metrics['temperature{location="office"}']).toBe(25);
    });
  });

  describe('histogram', () => {
    it('should record histogram values', () => {
      collector.histogram('request_duration', 0.1);
      collector.histogram('request_duration', 0.2);
      collector.histogram('request_duration', 0.3);

      const metrics = collector.getMetrics();
      const values = metrics['request_duration'] as number[];
      expect(values).toHaveLength(3);
      expect(values).toContain(0.1);
      expect(values).toContain(0.2);
      expect(values).toContain(0.3);
    });

    it('should record histogram with labels', () => {
      collector.histogram('request_duration', 0.1, { endpoint: '/api/v1' });

      const metrics = collector.getMetrics();
      const values = metrics['request_duration{endpoint="/api/v1"}'] as number[];
      expect(values).toContain(0.1);
    });
  });

  describe('getMetrics', () => {
    it('should return all metrics', () => {
      collector.increment('counter');
      collector.gauge('gauge', 50);
      collector.histogram('histogram', 1.5);

      const metrics = collector.getMetrics();
      expect(Object.keys(metrics)).toHaveLength(3);
    });
  });

  describe('reset', () => {
    it('should clear all metrics', () => {
      collector.increment('counter');
      collector.gauge('gauge', 50);

      collector.reset();

      const metrics = collector.getMetrics();
      expect(Object.keys(metrics)).toHaveLength(0);
    });
  });

  describe('label ordering', () => {
    it('should sort labels consistently', () => {
      collector.increment('test', 1, { b: '2', a: '1' });
      collector.increment('test', 1, { a: '1', b: '2' });

      const metrics = collector.getMetrics();
      expect(metrics['test{a="1",b="2"}']).toBe(2);
    });
  });
});

describe('metricsCollector singleton', () => {
  it('should be a MetricsCollector instance', () => {
    expect(metricsCollector).toBeInstanceOf(MetricsCollector);
  });

  it('should work as expected', () => {
    metricsCollector.reset();
    metricsCollector.increment('singleton_test');

    const metrics = metricsCollector.getMetrics();
    expect(metrics['singleton_test']).toBe(1);

    metricsCollector.reset();
  });
});
