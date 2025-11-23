/**
 * QATestService
 * Manages QA test cases, execution, and reporting
 */

type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
type TestPriority = 'P0' | 'P1' | 'P2' | 'P3';
type TestCategory = 'functional' | 'performance' | 'security' | 'usability' | 'regression';

interface TestCase {
  id: string;
  name: string;
  description: string;
  category: TestCategory;
  priority: TestPriority;
  steps: string[];
  expectedResult: string;
  status: TestStatus;
  duration?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
  status: TestStatus;
  startTime?: number;
  endTime?: number;
}

interface TestReport {
  suiteId: string;
  suiteName: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  timestamp: number;
  results: Array<{
    testId: string;
    testName: string;
    status: TestStatus;
    duration: number;
    error?: string;
  }>;
}

interface NetworkCondition {
  name: string;
  download: number; // Kbps
  upload: number;   // Kbps
  latency: number;  // ms
}

export class QATestService {
  private suites: Map<string, TestSuite> = new Map();
  private reports: TestReport[] = [];
  private currentNetworkCondition: NetworkCondition | null = null;

  constructor() {
    this.initializeDefaultTestSuites();
  }

  /**
   * Initialize default test suites
   */
  private initializeDefaultTestSuites(): void {
    // Wallet Management Suite
    this.addTestSuite({
      id: 'wallet-management',
      name: 'Wallet Management',
      description: 'Tests for wallet creation, import, and management',
      testCases: [
        {
          id: 'wm-001',
          name: 'Create new wallet',
          description: 'User can create a new wallet with seed phrase',
          category: 'functional',
          priority: 'P0',
          steps: [
            'Launch app',
            'Tap "Create Wallet"',
            'Accept terms',
            'View and backup seed phrase',
            'Verify seed phrase',
            'Set PIN',
          ],
          expectedResult: 'Wallet created successfully with valid address',
          status: 'pending',
        },
        {
          id: 'wm-002',
          name: 'Import wallet from seed phrase',
          description: 'User can import existing wallet using seed phrase',
          category: 'functional',
          priority: 'P0',
          steps: [
            'Launch app',
            'Tap "Import Wallet"',
            'Enter valid 12-word seed phrase',
            'Set PIN',
          ],
          expectedResult: 'Wallet imported with correct address and balance',
          status: 'pending',
        },
        {
          id: 'wm-003',
          name: 'Invalid seed phrase handling',
          description: 'App rejects invalid seed phrases',
          category: 'functional',
          priority: 'P1',
          steps: [
            'Go to import wallet',
            'Enter invalid seed phrase',
            'Tap "Import"',
          ],
          expectedResult: 'Show error message about invalid phrase',
          status: 'pending',
        },
      ],
      status: 'pending',
    });

    // Transaction Suite
    this.addTestSuite({
      id: 'transactions',
      name: 'Transactions',
      description: 'Tests for sending and receiving transactions',
      testCases: [
        {
          id: 'tx-001',
          name: 'Send ETH',
          description: 'User can send ETH to another address',
          category: 'functional',
          priority: 'P0',
          steps: [
            'Navigate to Send',
            'Select ETH',
            'Enter recipient address',
            'Enter amount',
            'Review transaction',
            'Confirm with PIN',
          ],
          expectedResult: 'Transaction submitted and appears in history',
          status: 'pending',
        },
        {
          id: 'tx-002',
          name: 'Send with insufficient balance',
          description: 'App prevents sending more than balance',
          category: 'functional',
          priority: 'P1',
          steps: [
            'Navigate to Send',
            'Enter amount > balance',
            'Tap "Continue"',
          ],
          expectedResult: 'Show insufficient balance error',
          status: 'pending',
        },
        {
          id: 'tx-003',
          name: 'View transaction history',
          description: 'User can view past transactions',
          category: 'functional',
          priority: 'P1',
          steps: [
            'Navigate to History tab',
            'Scroll through transactions',
            'Tap on transaction',
          ],
          expectedResult: 'Transaction list displays with correct details',
          status: 'pending',
        },
      ],
      status: 'pending',
    });

    // Security Suite
    this.addTestSuite({
      id: 'security',
      name: 'Security',
      description: 'Tests for authentication and security features',
      testCases: [
        {
          id: 'sec-001',
          name: 'PIN authentication',
          description: 'App requires PIN to access wallet',
          category: 'security',
          priority: 'P0',
          steps: [
            'Lock app',
            'Reopen app',
            'Enter correct PIN',
          ],
          expectedResult: 'App unlocks with correct PIN',
          status: 'pending',
        },
        {
          id: 'sec-002',
          name: 'Failed PIN attempts',
          description: 'App locks after multiple failed attempts',
          category: 'security',
          priority: 'P0',
          steps: [
            'Lock app',
            'Enter wrong PIN 5 times',
          ],
          expectedResult: 'App locks with cooldown timer',
          status: 'pending',
        },
        {
          id: 'sec-003',
          name: 'Biometric authentication',
          description: 'User can use biometrics to unlock',
          category: 'security',
          priority: 'P1',
          steps: [
            'Enable biometrics in settings',
            'Lock app',
            'Use biometrics to unlock',
          ],
          expectedResult: 'App unlocks with valid biometrics',
          status: 'pending',
        },
      ],
      status: 'pending',
    });

    // Performance Suite
    this.addTestSuite({
      id: 'performance',
      name: 'Performance',
      description: 'Tests for app performance and responsiveness',
      testCases: [
        {
          id: 'perf-001',
          name: 'App launch time',
          description: 'App launches within acceptable time',
          category: 'performance',
          priority: 'P1',
          steps: [
            'Close app completely',
            'Launch app',
            'Measure time to interactive',
          ],
          expectedResult: 'App launches in < 3 seconds',
          status: 'pending',
        },
        {
          id: 'perf-002',
          name: 'Balance refresh',
          description: 'Balance refreshes quickly',
          category: 'performance',
          priority: 'P1',
          steps: [
            'Pull to refresh on dashboard',
            'Measure refresh time',
          ],
          expectedResult: 'Balance updates in < 2 seconds',
          status: 'pending',
        },
      ],
      status: 'pending',
    });
  }

  /**
   * Add a test suite
   */
  addTestSuite(suite: TestSuite): void {
    this.suites.set(suite.id, suite);
  }

  /**
   * Get all test suites
   */
  getAllSuites(): TestSuite[] {
    return Array.from(this.suites.values());
  }

  /**
   * Get test suite by ID
   */
  getSuite(suiteId: string): TestSuite | undefined {
    return this.suites.get(suiteId);
  }

  /**
   * Add test case to suite
   */
  addTestCase(suiteId: string, testCase: TestCase): boolean {
    const suite = this.suites.get(suiteId);
    if (!suite) return false;

    suite.testCases.push(testCase);
    return true;
  }

  /**
   * Update test case status
   */
  updateTestStatus(
    suiteId: string,
    testId: string,
    status: TestStatus,
    details?: { duration?: number; error?: string }
  ): boolean {
    const suite = this.suites.get(suiteId);
    if (!suite) return false;

    const testCase = suite.testCases.find(tc => tc.id === testId);
    if (!testCase) return false;

    testCase.status = status;
    if (details?.duration) testCase.duration = details.duration;
    if (details?.error) testCase.error = details.error;

    return true;
  }

  /**
   * Run test suite
   */
  async runSuite(
    suiteId: string,
    executor: (testCase: TestCase) => Promise<{ passed: boolean; duration: number; error?: string }>
  ): Promise<TestReport> {
    const suite = this.suites.get(suiteId);
    if (!suite) {
      throw new Error(`Suite ${suiteId} not found`);
    }

    suite.status = 'running';
    suite.startTime = Date.now();

    const results: TestReport['results'] = [];
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    for (const testCase of suite.testCases) {
      if (testCase.status === 'skipped') {
        skipped++;
        results.push({
          testId: testCase.id,
          testName: testCase.name,
          status: 'skipped',
          duration: 0,
        });
        continue;
      }

      testCase.status = 'running';

      try {
        const result = await executor(testCase);

        testCase.status = result.passed ? 'passed' : 'failed';
        testCase.duration = result.duration;
        testCase.error = result.error;

        if (result.passed) {
          passed++;
        } else {
          failed++;
        }

        results.push({
          testId: testCase.id,
          testName: testCase.name,
          status: testCase.status,
          duration: result.duration,
          error: result.error,
        });
      } catch (error) {
        testCase.status = 'failed';
        testCase.error = (error as Error).message;
        failed++;

        results.push({
          testId: testCase.id,
          testName: testCase.name,
          status: 'failed',
          duration: 0,
          error: testCase.error,
        });
      }
    }

    suite.endTime = Date.now();
    suite.status = failed > 0 ? 'failed' : 'passed';

    const report: TestReport = {
      suiteId,
      suiteName: suite.name,
      total: suite.testCases.length,
      passed,
      failed,
      skipped,
      duration: suite.endTime - suite.startTime,
      timestamp: Date.now(),
      results,
    };

    this.reports.push(report);
    return report;
  }

  /**
   * Get test reports
   */
  getReports(): TestReport[] {
    return this.reports;
  }

  /**
   * Get latest report for suite
   */
  getLatestReport(suiteId: string): TestReport | undefined {
    return this.reports
      .filter(r => r.suiteId === suiteId)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
  }

  /**
   * Set network condition for testing
   */
  setNetworkCondition(condition: NetworkCondition): void {
    this.currentNetworkCondition = condition;
  }

  /**
   * Get predefined network conditions
   */
  getNetworkConditions(): NetworkCondition[] {
    return [
      { name: 'Fast WiFi', download: 50000, upload: 20000, latency: 10 },
      { name: 'Normal', download: 10000, upload: 5000, latency: 50 },
      { name: 'Slow 3G', download: 1000, upload: 500, latency: 200 },
      { name: 'Edge', download: 240, upload: 100, latency: 500 },
      { name: 'Offline', download: 0, upload: 0, latency: Infinity },
    ];
  }

  /**
   * Get tests by priority
   */
  getTestsByPriority(priority: TestPriority): TestCase[] {
    const tests: TestCase[] = [];
    this.suites.forEach(suite => {
      tests.push(...suite.testCases.filter(tc => tc.priority === priority));
    });
    return tests;
  }

  /**
   * Get tests by category
   */
  getTestsByCategory(category: TestCategory): TestCase[] {
    const tests: TestCase[] = [];
    this.suites.forEach(suite => {
      tests.push(...suite.testCases.filter(tc => tc.category === category));
    });
    return tests;
  }

  /**
   * Get failed tests
   */
  getFailedTests(): TestCase[] {
    const tests: TestCase[] = [];
    this.suites.forEach(suite => {
      tests.push(...suite.testCases.filter(tc => tc.status === 'failed'));
    });
    return tests;
  }

  /**
   * Generate summary
   */
  generateSummary(): {
    totalSuites: number;
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    pending: number;
    passRate: number;
  } {
    let totalTests = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let pending = 0;

    this.suites.forEach(suite => {
      suite.testCases.forEach(tc => {
        totalTests++;
        switch (tc.status) {
          case 'passed':
            passed++;
            break;
          case 'failed':
            failed++;
            break;
          case 'skipped':
            skipped++;
            break;
          case 'pending':
            pending++;
            break;
        }
      });
    });

    const executed = passed + failed;
    const passRate = executed > 0 ? (passed / executed) * 100 : 0;

    return {
      totalSuites: this.suites.size,
      totalTests,
      passed,
      failed,
      skipped,
      pending,
      passRate: Math.round(passRate * 100) / 100,
    };
  }

  /**
   * Reset all test statuses
   */
  resetAllTests(): void {
    this.suites.forEach(suite => {
      suite.status = 'pending';
      suite.startTime = undefined;
      suite.endTime = undefined;
      suite.testCases.forEach(tc => {
        tc.status = 'pending';
        tc.duration = undefined;
        tc.error = undefined;
      });
    });
  }

  /**
   * Export report to markdown
   */
  exportReportToMarkdown(report: TestReport): string {
    let md = `# Test Report: ${report.suiteName}\n\n`;
    md += `**Date**: ${new Date(report.timestamp).toISOString()}\n`;
    md += `**Duration**: ${report.duration}ms\n\n`;

    md += `## Summary\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Total | ${report.total} |\n`;
    md += `| Passed | ${report.passed} |\n`;
    md += `| Failed | ${report.failed} |\n`;
    md += `| Skipped | ${report.skipped} |\n`;
    md += `| Pass Rate | ${Math.round((report.passed / report.total) * 100)}% |\n\n`;

    md += `## Results\n\n`;
    md += `| Test | Status | Duration | Error |\n`;
    md += `|------|--------|----------|-------|\n`;

    report.results.forEach(r => {
      const status = r.status === 'passed' ? '✅' : r.status === 'failed' ? '❌' : '⏭️';
      md += `| ${r.testName} | ${status} ${r.status} | ${r.duration}ms | ${r.error || '-'} |\n`;
    });

    return md;
  }
}

export const qaTestService = new QATestService();
export default QATestService;
