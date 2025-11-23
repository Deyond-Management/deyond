/**
 * PrivacyComplianceService
 * GDPR and CCPA compliance utilities
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface ConsentPreferences {
  analytics: boolean;
  crashReporting: boolean;
  marketing: boolean;
  timestamp: number;
}

interface DataExport {
  walletAddresses: string[];
  preferences: Record<string, unknown>;
  exportDate: string;
}

const CONSENT_KEY = '@privacy_consent';
const DATA_RETENTION_DAYS = 365;

export class PrivacyComplianceService {
  /**
   * Get current consent preferences
   */
  async getConsent(): Promise<ConsentPreferences | null> {
    const data = await AsyncStorage.getItem(CONSENT_KEY);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Save consent preferences
   */
  async saveConsent(preferences: Omit<ConsentPreferences, 'timestamp'>): Promise<void> {
    const consent: ConsentPreferences = {
      ...preferences,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  }

  /**
   * Check if user has given consent
   */
  async hasConsent(type: keyof Omit<ConsentPreferences, 'timestamp'>): Promise<boolean> {
    const consent = await this.getConsent();
    return consent?.[type] ?? false;
  }

  /**
   * Withdraw all consent
   */
  async withdrawConsent(): Promise<void> {
    await this.saveConsent({
      analytics: false,
      crashReporting: false,
      marketing: false,
    });
  }

  /**
   * Export user data (GDPR Right to Data Portability)
   */
  async exportUserData(): Promise<DataExport> {
    // Collect all user data
    const allKeys = await AsyncStorage.getAllKeys();
    const userData: Record<string, unknown> = {};

    for (const key of allKeys) {
      if (!key.startsWith('@sensitive_')) {
        const value = await AsyncStorage.getItem(key);
        userData[key] = value ? JSON.parse(value) : null;
      }
    }

    return {
      walletAddresses: [], // Add wallet addresses
      preferences: userData,
      exportDate: new Date().toISOString(),
    };
  }

  /**
   * Delete all user data (GDPR Right to Erasure)
   */
  async deleteAllData(): Promise<void> {
    const allKeys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(allKeys);
  }

  /**
   * Get data retention policy
   */
  getDataRetentionPolicy(): {
    retentionDays: number;
    dataTypes: Array<{ type: string; retention: string }>;
  } {
    return {
      retentionDays: DATA_RETENTION_DAYS,
      dataTypes: [
        { type: 'Transaction History', retention: 'Until deletion' },
        { type: 'Preferences', retention: 'Until deletion' },
        { type: 'Analytics', retention: '90 days' },
        { type: 'Crash Reports', retention: '90 days' },
      ],
    };
  }

  /**
   * Check if region requires consent (GDPR regions)
   */
  requiresExplicitConsent(region: string): boolean {
    const gdprRegions = [
      'AT',
      'BE',
      'BG',
      'HR',
      'CY',
      'CZ',
      'DK',
      'EE',
      'FI',
      'FR',
      'DE',
      'GR',
      'HU',
      'IE',
      'IT',
      'LV',
      'LT',
      'LU',
      'MT',
      'NL',
      'PL',
      'PT',
      'RO',
      'SK',
      'SI',
      'ES',
      'SE',
      'GB',
      'IS',
      'LI',
      'NO',
      'CH',
    ];
    return gdprRegions.includes(region.toUpperCase());
  }

  /**
   * Check if CCPA applies (California)
   */
  isCCPAApplicable(region: string): boolean {
    return region.toUpperCase() === 'US-CA';
  }

  /**
   * Log consent change for audit trail
   */
  async logConsentChange(
    previousConsent: ConsentPreferences | null,
    newConsent: ConsentPreferences
  ): Promise<void> {
    const log = {
      timestamp: Date.now(),
      previous: previousConsent,
      new: newConsent,
      action: previousConsent ? 'update' : 'initial',
    };

    // Store in audit log
    const auditKey = '@consent_audit';
    const existingLogs = await AsyncStorage.getItem(auditKey);
    const logs = existingLogs ? JSON.parse(existingLogs) : [];
    logs.push(log);

    // Keep only last 100 entries
    const trimmedLogs = logs.slice(-100);
    await AsyncStorage.setItem(auditKey, JSON.stringify(trimmedLogs));
  }

  /**
   * Generate privacy report
   */
  async generatePrivacyReport(): Promise<string> {
    const consent = await this.getConsent();
    const retention = this.getDataRetentionPolicy();

    return `
PRIVACY REPORT
==============
Generated: ${new Date().toISOString()}

CONSENT STATUS
--------------
Analytics: ${consent?.analytics ? 'Granted' : 'Denied'}
Crash Reporting: ${consent?.crashReporting ? 'Granted' : 'Denied'}
Marketing: ${consent?.marketing ? 'Granted' : 'Denied'}
Last Updated: ${consent?.timestamp ? new Date(consent.timestamp).toISOString() : 'Never'}

DATA RETENTION
--------------
Default Retention: ${retention.retentionDays} days

Data Types:
${retention.dataTypes.map(d => `- ${d.type}: ${d.retention}`).join('\n')}

YOUR RIGHTS
-----------
- Access your data
- Export your data
- Delete your data
- Withdraw consent

Contact: privacy@deyond.io
    `.trim();
  }
}

export const privacyCompliance = new PrivacyComplianceService();
export default PrivacyComplianceService;
