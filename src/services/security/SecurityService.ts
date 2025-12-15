/**
 * SecurityService
 * PIN, biometrics, and authentication management
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { CryptoUtils } from '../../core/crypto/CryptoUtils';
import { DEFAULT_SERVICES_CONFIG, SecurityConfig } from '../../config/services.config';

type BiometricsType = 'none' | 'fingerprint' | 'face' | 'iris';
type SecurityLevel = 'low' | 'medium' | 'high';

interface AuthParams {
  type: 'pin' | 'biometrics';
  value?: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface SetPINResult {
  success: boolean;
}

export class SecurityService {
  private pinHash: string | null = null;
  private pinSalt: string | null = null; // Store salt for PBKDF2
  private biometricsEnabled: boolean = false;
  private failedAttempts: number = 0;
  private lockedUntil: number = 0;
  private autoLockTimeout: number;
  private maxFailedAttempts: number;
  private lockDuration: number;

  constructor(config?: Partial<SecurityConfig>) {
    const securityConfig = { ...DEFAULT_SERVICES_CONFIG.security, ...config };
    this.maxFailedAttempts = securityConfig.maxFailedAttempts;
    this.lockDuration = securityConfig.lockDuration;
    this.autoLockTimeout = securityConfig.defaultAutoLockTimeout;
  }

  /**
   * Set a new PIN
   */
  async setPIN(pin: string): Promise<SetPINResult> {
    // Validate PIN
    if (pin.length !== 6) {
      throw new Error('PIN must be 6 digits');
    }

    if (!/^\d+$/.test(pin)) {
      throw new Error('PIN must contain only digits');
    }

    // Generate new salt and hash PIN using PBKDF2
    const { hash, salt } = await this.hashPIN(pin);
    this.pinHash = hash;
    this.pinSalt = salt;

    return { success: true };
  }

  /**
   * Verify PIN
   */
  async verifyPIN(pin: string): Promise<boolean> {
    if (!this.pinHash || !this.pinSalt) {
      return false;
    }

    const { hash } = await this.hashPIN(pin, this.pinSalt);
    return hash === this.pinHash;
  }

  /**
   * Check if PIN is set
   */
  isPINSet(): boolean {
    return this.pinHash !== null;
  }

  /**
   * Change PIN
   */
  async changePIN(currentPIN: string, newPIN: string): Promise<SetPINResult> {
    const isValid = await this.verifyPIN(currentPIN);
    if (!isValid) {
      throw new Error('Current PIN is incorrect');
    }

    return this.setPIN(newPIN);
  }

  /**
   * Remove PIN
   */
  async removePIN(currentPIN: string): Promise<void> {
    const isValid = await this.verifyPIN(currentPIN);
    if (!isValid) {
      throw new Error('Current PIN is incorrect');
    }

    this.pinHash = null;
    this.pinSalt = null;
    this.biometricsEnabled = false;
  }

  /**
   * Check if biometrics is available
   */
  async isBiometricsAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  }

  /**
   * Get biometrics type
   */
  async getBiometricsType(): Promise<BiometricsType> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'face';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'fingerprint';
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'iris';
    }

    return 'none';
  }

  /**
   * Enable biometrics
   */
  async enableBiometrics(): Promise<AuthResult> {
    if (!this.isPINSet()) {
      throw new Error('PIN must be set first');
    }

    this.biometricsEnabled = true;
    return { success: true };
  }

  /**
   * Disable biometrics
   */
  async disableBiometrics(): Promise<AuthResult> {
    this.biometricsEnabled = false;
    return { success: true };
  }

  /**
   * Check if biometrics is enabled
   */
  isBiometricsEnabled(): boolean {
    return this.biometricsEnabled;
  }

  /**
   * Authenticate with biometrics
   */
  async authenticateWithBiometrics(): Promise<AuthResult> {
    if (!this.biometricsEnabled) {
      return { success: false, error: 'Biometrics not enabled' };
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your wallet',
        fallbackLabel: 'Use password',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: 'Biometric authentication failed' };
      }
    } catch (error) {
      return { success: false, error: 'Biometric authentication error' };
    }
  }

  /**
   * Authenticate user
   */
  async authenticate(params: AuthParams): Promise<AuthResult> {
    // Check if locked
    if (this.isLocked()) {
      return {
        success: false,
        error: `Account locked. Try again in ${Math.ceil(
          this.getLockTimeRemaining() / 1000
        )} seconds`,
      };
    }

    let success = false;

    if (params.type === 'pin' && params.value) {
      success = await this.verifyPIN(params.value);
    } else if (params.type === 'biometrics') {
      const result = await this.authenticateWithBiometrics();
      success = result.success;
    }

    if (success) {
      this.failedAttempts = 0;
      return { success: true };
    } else {
      this.failedAttempts++;
      if (this.failedAttempts >= this.maxFailedAttempts) {
        this.lockedUntil = Date.now() + this.lockDuration;
      }
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Get failed attempts count
   */
  getFailedAttempts(): number {
    return this.failedAttempts;
  }

  /**
   * Check if account is locked
   */
  isLocked(): boolean {
    if (this.lockedUntil === 0) {
      return false;
    }

    if (Date.now() >= this.lockedUntil) {
      this.lockedUntil = 0;
      this.failedAttempts = 0;
      return false;
    }

    return true;
  }

  /**
   * Get remaining lock time in milliseconds
   */
  getLockTimeRemaining(): number {
    if (!this.isLocked()) {
      return 0;
    }

    return Math.max(0, this.lockedUntil - Date.now());
  }

  /**
   * Set auto-lock timeout
   */
  async setAutoLockTimeout(timeout: number): Promise<void> {
    // Validate timeout
    if (typeof timeout !== 'number') {
      throw new Error('Timeout must be a number');
    }

    if (timeout < 0) {
      throw new Error('Timeout cannot be negative');
    }

    // Set reasonable limits: min 30 seconds, max 1 hour
    if (timeout > 0 && timeout < 30000) {
      throw new Error('Timeout must be at least 30 seconds (30000ms)');
    }

    if (timeout > 3600000) {
      throw new Error('Timeout cannot exceed 1 hour (3600000ms)');
    }

    this.autoLockTimeout = timeout;
  }

  /**
   * Get auto-lock timeout
   */
  getAutoLockTimeout(): number {
    return this.autoLockTimeout;
  }

  /**
   * Get security level
   */
  getSecurityLevel(): SecurityLevel {
    if (!this.isPINSet()) {
      return 'low';
    }

    if (this.biometricsEnabled) {
      return 'high';
    }

    return 'medium';
  }

  /**
   * Hash PIN using PBKDF2 with salt
   * @param pin - The PIN to hash
   * @param saltHex - Optional hex-encoded salt (if verifying), otherwise generates new salt
   * @returns Object containing hash and salt as hex strings
   */
  private async hashPIN(pin: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
    // Use provided salt or generate new one
    const salt = saltHex ? this.hexToBytes(saltHex) : CryptoUtils.generateRandomBytes(32);

    // Derive key from PIN using PBKDF2
    const hashBytes = await CryptoUtils.deriveKey(pin, salt);

    // Convert to hex
    const hash = this.bytesToHex(hashBytes);
    const saltHexStr = this.bytesToHex(salt);

    return { hash, salt: saltHexStr };
  }

  /**
   * Convert bytes to hexadecimal string
   */
  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert hexadecimal string to bytes
   */
  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }
}

export default SecurityService;
