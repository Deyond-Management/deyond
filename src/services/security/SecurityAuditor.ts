/**
 * SecurityAuditor
 * Security auditing and validation service
 */

import { getErrorReporter } from '../error/ErrorReporter';
import { ErrorSeverity, ErrorCategory, AppError } from '../../types/error';

export enum SecurityThreat {
  WEAK_PASSWORD = 'weak_password',
  EXPOSED_KEY = 'exposed_key',
  INSECURE_STORAGE = 'insecure_storage',
  SUSPICIOUS_TRANSACTION = 'suspicious_transaction',
  PHISHING_ATTEMPT = 'phishing_attempt',
  UNTRUSTED_DAPP = 'untrusted_dapp',
}

export interface SecurityIssue {
  threat: SecurityThreat;
  severity: ErrorSeverity;
  message: string;
  timestamp: number;
  context?: any;
}

class SecurityAuditor {
  private errorReporter = getErrorReporter();
  private issues: SecurityIssue[] = [];
  private readonly MAX_ISSUES = 100;

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (password.length < 8) {
      issues.push('Password must be at least 8 characters');
    }

    if (!/[A-Z]/.test(password)) {
      issues.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      issues.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      issues.push('Password must contain at least one number');
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      issues.push('Password must contain at least one special character');
    }

    const isValid = issues.length === 0;

    if (!isValid) {
      this.reportIssue({
        threat: SecurityThreat.WEAK_PASSWORD,
        severity: ErrorSeverity.MEDIUM,
        message: 'Weak password detected',
        timestamp: Date.now(),
        context: { issueCount: issues.length },
      });
    }

    return { isValid, issues };
  }

  /**
   * Validate Ethereum address
   */
  validateAddress(address: string): boolean {
    // Basic Ethereum address validation
    const isValid = /^0x[a-fA-F0-9]{40}$/.test(address);

    if (!isValid) {
      this.reportIssue({
        threat: SecurityThreat.SUSPICIOUS_TRANSACTION,
        severity: ErrorSeverity.HIGH,
        message: 'Invalid Ethereum address format',
        timestamp: Date.now(),
        context: { address: address.substring(0, 10) + '...' },
      });
    }

    return isValid;
  }

  /**
   * Check for suspicious transaction patterns
   */
  checkTransactionSecurity(transaction: { to: string; value: string; data?: string }): {
    isSafe: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Check for large transaction values
    const value = BigInt(transaction.value);
    const largeThreshold = BigInt('10000000000000000000'); // 10 ETH

    if (value > largeThreshold) {
      warnings.push('Large transaction amount detected');
      this.reportIssue({
        threat: SecurityThreat.SUSPICIOUS_TRANSACTION,
        severity: ErrorSeverity.HIGH,
        message: 'Large transaction amount',
        timestamp: Date.now(),
        context: { value: transaction.value },
      });
    }

    // Check for suspicious data
    if (transaction.data && transaction.data.length > 1000) {
      warnings.push('Large transaction data detected');
      this.reportIssue({
        threat: SecurityThreat.SUSPICIOUS_TRANSACTION,
        severity: ErrorSeverity.MEDIUM,
        message: 'Large transaction data',
        timestamp: Date.now(),
        context: { dataLength: transaction.data.length },
      });
    }

    return {
      isSafe: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Validate DApp domain
   */
  validateDAppDomain(url: string): {
    isTrusted: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    try {
      const urlObj = new URL(url);

      // Check for HTTPS
      if (urlObj.protocol !== 'https:') {
        warnings.push('DApp is not using HTTPS');
        this.reportIssue({
          threat: SecurityThreat.UNTRUSTED_DAPP,
          severity: ErrorSeverity.HIGH,
          message: 'Non-HTTPS DApp detected',
          timestamp: Date.now(),
          context: { url: urlObj.hostname },
        });
      }

      // Check for suspicious TLDs
      const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq'];
      const hasSuspiciousTld = suspiciousTlds.some(tld => urlObj.hostname.endsWith(tld));

      if (hasSuspiciousTld) {
        warnings.push('DApp uses suspicious domain extension');
        this.reportIssue({
          threat: SecurityThreat.PHISHING_ATTEMPT,
          severity: ErrorSeverity.CRITICAL,
          message: 'Suspicious domain TLD detected',
          timestamp: Date.now(),
          context: { hostname: urlObj.hostname },
        });
      }

      // Check for homograph attacks (simplified)
      if (/[а-яА-Я]/.test(urlObj.hostname)) {
        // Cyrillic characters
        warnings.push('DApp domain contains non-Latin characters');
        this.reportIssue({
          threat: SecurityThreat.PHISHING_ATTEMPT,
          severity: ErrorSeverity.CRITICAL,
          message: 'Potential homograph attack',
          timestamp: Date.now(),
          context: { hostname: urlObj.hostname },
        });
      }
    } catch (error) {
      warnings.push('Invalid URL format');
    }

    return {
      isTrusted: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Report security issue
   */
  private reportIssue(issue: SecurityIssue): void {
    this.issues.push(issue);

    // Keep only last MAX_ISSUES
    if (this.issues.length > this.MAX_ISSUES) {
      this.issues.shift();
    }

    // Report to error reporter if critical
    if (issue.severity === ErrorSeverity.CRITICAL || issue.severity === ErrorSeverity.HIGH) {
      this.errorReporter.report(
        new AppError(issue.message, ErrorCategory.WALLET, issue.severity, issue.context),
        issue.severity,
        ErrorCategory.WALLET,
        issue.context
      );
    }

    // Log in development
    if (__DEV__) {
      console.warn(`🔒 [Security] ${issue.threat}: ${issue.message}`, issue.context);
    }
  }

  /**
   * Get all security issues
   */
  getIssues(): SecurityIssue[] {
    return [...this.issues];
  }

  /**
   * Clear security issues
   */
  clearIssues(): void {
    this.issues = [];
  }

  /**
   * Get critical issues count
   */
  getCriticalIssuesCount(): number {
    return this.issues.filter(i => i.severity === ErrorSeverity.CRITICAL).length;
  }
}

// Singleton instance
let instance: SecurityAuditor | null = null;

export const getSecurityAuditor = (): SecurityAuditor => {
  if (!instance) {
    instance = new SecurityAuditor();
  }
  return instance;
};

export default SecurityAuditor;
