import QATestService from '../QATestService';

describe('QATestService', () => {
  let service: QATestService;

  beforeEach(() => {
    service = new QATestService();
  });

  describe('constructor', () => {
    it('should initialize with default test suites', () => {
      const suites = service.getAllSuites();
      expect(suites.length).toBeGreaterThan(0);
    });

    it('should have wallet management suite', () => {
      const suite = service.getSuite('wallet-management');
      expect(suite).toBeDefined();
      expect(suite?.testCases.length).toBeGreaterThan(0);
    });

    it('should have transactions suite', () => {
      const suite = service.getSuite('transactions');
      expect(suite).toBeDefined();
    });

    it('should have security suite', () => {
      const suite = service.getSuite('security');
      expect(suite).toBeDefined();
    });

    it('should have performance suite', () => {
      const suite = service.getSuite('performance');
      expect(suite).toBeDefined();
    });
  });

  describe('addTestSuite', () => {
    it('should add new test suite', () => {
      service.addTestSuite({
        id: 'custom-suite',
        name: 'Custom Suite',
        description: 'Custom test suite',
        testCases: [],
        status: 'pending',
      });

      const suite = service.getSuite('custom-suite');
      expect(suite).toBeDefined();
      expect(suite?.name).toBe('Custom Suite');
    });
  });

  describe('addTestCase', () => {
    it('should add test case to existing suite', () => {
      const result = service.addTestCase('wallet-management', {
        id: 'custom-test',
        name: 'Custom Test',
        description: 'Custom test case',
        category: 'functional',
        priority: 'P2',
        steps: ['Step 1', 'Step 2'],
        expectedResult: 'Expected result',
        status: 'pending',
      });

      expect(result).toBe(true);

      const suite = service.getSuite('wallet-management');
      const testCase = suite?.testCases.find(tc => tc.id === 'custom-test');
      expect(testCase).toBeDefined();
    });

    it('should return false for non-existent suite', () => {
      const result = service.addTestCase('non-existent', {
        id: 'test',
        name: 'Test',
        description: 'Test',
        category: 'functional',
        priority: 'P1',
        steps: [],
        expectedResult: 'Result',
        status: 'pending',
      });

      expect(result).toBe(false);
    });
  });

  describe('updateTestStatus', () => {
    it('should update test status', () => {
      const result = service.updateTestStatus(
        'wallet-management',
        'wm-001',
        'passed',
        { duration: 1000 }
      );

      expect(result).toBe(true);

      const suite = service.getSuite('wallet-management');
      const testCase = suite?.testCases.find(tc => tc.id === 'wm-001');
      expect(testCase?.status).toBe('passed');
      expect(testCase?.duration).toBe(1000);
    });

    it('should update with error', () => {
      service.updateTestStatus(
        'wallet-management',
        'wm-001',
        'failed',
        { error: 'Test failed' }
      );

      const suite = service.getSuite('wallet-management');
      const testCase = suite?.testCases.find(tc => tc.id === 'wm-001');
      expect(testCase?.status).toBe('failed');
      expect(testCase?.error).toBe('Test failed');
    });

    it('should return false for non-existent test', () => {
      const result = service.updateTestStatus(
        'wallet-management',
        'non-existent',
        'passed'
      );
      expect(result).toBe(false);
    });
  });

  describe('runSuite', () => {
    it('should run suite and generate report', async () => {
      const executor = jest.fn().mockResolvedValue({
        passed: true,
        duration: 100,
      });

      const report = await service.runSuite('wallet-management', executor);

      expect(report.suiteId).toBe('wallet-management');
      expect(report.total).toBeGreaterThan(0);
      expect(report.passed).toBe(report.total);
      expect(report.failed).toBe(0);
      expect(executor).toHaveBeenCalled();
    });

    it('should handle test failures', async () => {
      let callCount = 0;
      const executor = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ passed: false, duration: 100, error: 'Failed' });
        }
        return Promise.resolve({ passed: true, duration: 100 });
      });

      const report = await service.runSuite('wallet-management', executor);

      expect(report.failed).toBeGreaterThan(0);
    });

    it('should handle executor exceptions', async () => {
      const executor = jest.fn().mockRejectedValue(new Error('Executor error'));

      const report = await service.runSuite('wallet-management', executor);

      expect(report.failed).toBe(report.total);
    });

    it('should skip tests marked as skipped', async () => {
      service.updateTestStatus('wallet-management', 'wm-001', 'skipped');

      const executor = jest.fn().mockResolvedValue({
        passed: true,
        duration: 100,
      });

      const report = await service.runSuite('wallet-management', executor);

      expect(report.skipped).toBe(1);
    });

    it('should throw for non-existent suite', async () => {
      await expect(
        service.runSuite('non-existent', jest.fn())
      ).rejects.toThrow('Suite non-existent not found');
    });
  });

  describe('getReports', () => {
    it('should return all reports', async () => {
      const executor = jest.fn().mockResolvedValue({
        passed: true,
        duration: 100,
      });

      await service.runSuite('wallet-management', executor);
      await service.runSuite('transactions', executor);

      const reports = service.getReports();
      expect(reports.length).toBe(2);
    });
  });

  describe('getLatestReport', () => {
    it('should return latest report for suite', async () => {
      const executor = jest.fn().mockResolvedValue({
        passed: true,
        duration: 100,
      });

      await service.runSuite('wallet-management', executor);
      await service.runSuite('wallet-management', executor);

      const report = service.getLatestReport('wallet-management');
      expect(report).toBeDefined();
    });

    it('should return undefined for suite with no reports', () => {
      const report = service.getLatestReport('non-existent');
      expect(report).toBeUndefined();
    });
  });

  describe('getNetworkConditions', () => {
    it('should return predefined network conditions', () => {
      const conditions = service.getNetworkConditions();

      expect(conditions.length).toBeGreaterThan(0);
      expect(conditions.find(c => c.name === 'Fast WiFi')).toBeDefined();
      expect(conditions.find(c => c.name === 'Offline')).toBeDefined();
    });
  });

  describe('setNetworkCondition', () => {
    it('should set network condition', () => {
      const condition = { name: 'Test', download: 1000, upload: 500, latency: 100 };
      service.setNetworkCondition(condition);
      // No error means success
      expect(true).toBe(true);
    });
  });

  describe('getTestsByPriority', () => {
    it('should return P0 tests', () => {
      const tests = service.getTestsByPriority('P0');
      expect(tests.length).toBeGreaterThan(0);
      tests.forEach(test => {
        expect(test.priority).toBe('P0');
      });
    });

    it('should return tests from multiple suites', () => {
      const tests = service.getTestsByPriority('P1');
      expect(tests.length).toBeGreaterThan(0);
    });
  });

  describe('getTestsByCategory', () => {
    it('should return functional tests', () => {
      const tests = service.getTestsByCategory('functional');
      expect(tests.length).toBeGreaterThan(0);
      tests.forEach(test => {
        expect(test.category).toBe('functional');
      });
    });

    it('should return security tests', () => {
      const tests = service.getTestsByCategory('security');
      expect(tests.length).toBeGreaterThan(0);
    });
  });

  describe('getFailedTests', () => {
    it('should return empty array when no failures', () => {
      const failed = service.getFailedTests();
      expect(failed).toHaveLength(0);
    });

    it('should return failed tests', () => {
      service.updateTestStatus('wallet-management', 'wm-001', 'failed');
      service.updateTestStatus('transactions', 'tx-001', 'failed');

      const failed = service.getFailedTests();
      expect(failed).toHaveLength(2);
    });
  });

  describe('generateSummary', () => {
    it('should generate accurate summary', () => {
      service.updateTestStatus('wallet-management', 'wm-001', 'passed');
      service.updateTestStatus('wallet-management', 'wm-002', 'failed');

      const summary = service.generateSummary();

      expect(summary.totalSuites).toBeGreaterThan(0);
      expect(summary.totalTests).toBeGreaterThan(0);
      expect(summary.passed).toBe(1);
      expect(summary.failed).toBe(1);
      expect(summary.passRate).toBe(50);
    });

    it('should handle zero executed tests', () => {
      const summary = service.generateSummary();
      // All tests are pending
      expect(summary.pending).toBe(summary.totalTests);
      expect(summary.passRate).toBe(0);
    });
  });

  describe('resetAllTests', () => {
    it('should reset all test statuses', async () => {
      // Run some tests
      service.updateTestStatus('wallet-management', 'wm-001', 'passed');
      service.updateTestStatus('wallet-management', 'wm-002', 'failed');

      // Reset
      service.resetAllTests();

      const suite = service.getSuite('wallet-management');
      suite?.testCases.forEach(tc => {
        expect(tc.status).toBe('pending');
        expect(tc.duration).toBeUndefined();
        expect(tc.error).toBeUndefined();
      });
    });
  });

  describe('exportReportToMarkdown', () => {
    it('should generate markdown report', async () => {
      const executor = jest.fn().mockResolvedValue({
        passed: true,
        duration: 100,
      });

      const report = await service.runSuite('wallet-management', executor);
      const markdown = service.exportReportToMarkdown(report);

      expect(markdown).toContain('# Test Report');
      expect(markdown).toContain('Wallet Management');
      expect(markdown).toContain('## Summary');
      expect(markdown).toContain('## Results');
      expect(markdown).toContain('Pass Rate');
    });

    it('should include test results in table', async () => {
      const executor = jest.fn()
        .mockResolvedValueOnce({ passed: true, duration: 100 })
        .mockResolvedValueOnce({ passed: false, duration: 50, error: 'Test error' })
        .mockResolvedValue({ passed: true, duration: 100 });

      const report = await service.runSuite('wallet-management', executor);
      const markdown = service.exportReportToMarkdown(report);

      expect(markdown).toContain('✅');
      expect(markdown).toContain('❌');
      expect(markdown).toContain('Test error');
    });
  });
});
