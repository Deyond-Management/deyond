/**
 * SecurityService
 * PIN, biometrics, and authentication management
 */

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

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION = 300000; // 5 minutes

export class SecurityService {
  private pinHash: string | null = null;
  private biometricsEnabled: boolean = false;
  private failedAttempts: number = 0;
  private lockedUntil: number = 0;
  private autoLockTimeout: number = 300000; // 5 minutes default

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

    this.pinHash = this.hashPIN(pin);
    return { success: true };
  }

  /**
   * Verify PIN
   */
  async verifyPIN(pin: string): Promise<boolean> {
    if (!this.pinHash) {
      return false;
    }

    return this.hashPIN(pin) === this.pinHash;
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
    this.biometricsEnabled = false;
  }

  /**
   * Check if biometrics is available
   */
  async isBiometricsAvailable(): Promise<boolean> {
    // Mock: In real app, check platform API
    return true;
  }

  /**
   * Get biometrics type
   */
  async getBiometricsType(): Promise<BiometricsType> {
    // Mock: In real app, check platform API
    return 'face';
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

    // Mock: In real app, use platform biometrics API
    return { success: true };
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
      if (this.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        this.lockedUntil = Date.now() + LOCK_DURATION;
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
   * Hash PIN (simple implementation for demo)
   */
  hashPIN(pin: string): string {
    // In real app, use proper cryptographic hash with salt
    let hash = 0;
    const str = pin + 'salt_key_for_hashing';
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}

export default SecurityService;
