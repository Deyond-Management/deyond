/**
 * SecurityService Tests
 * TDD: Write tests first, then implement
 */

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  supportedAuthenticationTypesAsync: jest.fn().mockResolvedValue([1]), // FINGERPRINT
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

import { SecurityService } from '../../services/SecurityService';

describe('SecurityService', () => {
  let securityService: SecurityService;

  beforeEach(() => {
    securityService = new SecurityService();
  });

  describe('PIN Management', () => {
    it('should set a PIN', async () => {
      const result = await securityService.setPIN('123456');

      expect(result.success).toBe(true);
    });

    it('should verify correct PIN', async () => {
      await securityService.setPIN('123456');
      const result = await securityService.verifyPIN('123456');

      expect(result).toBe(true);
    });

    it('should reject incorrect PIN', async () => {
      await securityService.setPIN('123456');
      const result = await securityService.verifyPIN('000000');

      expect(result).toBe(false);
    });

    it('should validate PIN length', async () => {
      await expect(securityService.setPIN('123')).rejects.toThrow('PIN must be 6 digits');
    });

    it('should validate PIN is numeric', async () => {
      await expect(securityService.setPIN('12345a')).rejects.toThrow(
        'PIN must contain only digits'
      );
    });

    it('should check if PIN is set', async () => {
      expect(securityService.isPINSet()).toBe(false);

      await securityService.setPIN('123456');

      expect(securityService.isPINSet()).toBe(true);
    });

    it('should change PIN', async () => {
      await securityService.setPIN('123456');
      const result = await securityService.changePIN('123456', '654321');

      expect(result.success).toBe(true);

      const verified = await securityService.verifyPIN('654321');
      expect(verified).toBe(true);
    });

    it('should reject change PIN with wrong current PIN', async () => {
      await securityService.setPIN('123456');

      await expect(securityService.changePIN('000000', '654321')).rejects.toThrow(
        'Current PIN is incorrect'
      );
    });

    it('should remove PIN', async () => {
      await securityService.setPIN('123456');
      await securityService.removePIN('123456');

      expect(securityService.isPINSet()).toBe(false);
    });
  });

  describe('Biometrics', () => {
    it('should check biometrics availability', async () => {
      const available = await securityService.isBiometricsAvailable();

      expect(typeof available).toBe('boolean');
    });

    it('should get biometrics type', async () => {
      const type = await securityService.getBiometricsType();

      expect(['none', 'fingerprint', 'face', 'iris']).toContain(type);
    });

    it('should enable biometrics', async () => {
      await securityService.setPIN('123456');
      const result = await securityService.enableBiometrics();

      expect(result.success).toBe(true);
    });

    it('should require PIN to enable biometrics', async () => {
      await expect(securityService.enableBiometrics()).rejects.toThrow('PIN must be set first');
    });

    it('should disable biometrics', async () => {
      await securityService.setPIN('123456');
      await securityService.enableBiometrics();

      const result = await securityService.disableBiometrics();

      expect(result.success).toBe(true);
    });

    it('should check if biometrics is enabled', async () => {
      expect(securityService.isBiometricsEnabled()).toBe(false);

      await securityService.setPIN('123456');
      await securityService.enableBiometrics();

      expect(securityService.isBiometricsEnabled()).toBe(true);
    });

    it('should authenticate with biometrics', async () => {
      await securityService.setPIN('123456');
      await securityService.enableBiometrics();

      const result = await securityService.authenticateWithBiometrics();

      expect(result.success).toBe(true);
    });
  });

  describe('Authentication', () => {
    it('should authenticate with PIN', async () => {
      await securityService.setPIN('123456');

      const result = await securityService.authenticate({
        type: 'pin',
        value: '123456',
      });

      expect(result.success).toBe(true);
    });

    it('should fail authentication with wrong PIN', async () => {
      await securityService.setPIN('123456');

      const result = await securityService.authenticate({
        type: 'pin',
        value: '000000',
      });

      expect(result.success).toBe(false);
    });

    it('should track failed attempts', async () => {
      await securityService.setPIN('123456');

      await securityService.authenticate({ type: 'pin', value: '000000' });
      await securityService.authenticate({ type: 'pin', value: '000000' });

      const attempts = securityService.getFailedAttempts();
      expect(attempts).toBe(2);
    });

    it('should reset failed attempts on success', async () => {
      await securityService.setPIN('123456');

      await securityService.authenticate({ type: 'pin', value: '000000' });
      await securityService.authenticate({ type: 'pin', value: '123456' });

      const attempts = securityService.getFailedAttempts();
      expect(attempts).toBe(0);
    });

    it('should lock after max failed attempts', async () => {
      await securityService.setPIN('123456');

      for (let i = 0; i < 5; i++) {
        await securityService.authenticate({ type: 'pin', value: '000000' });
      }

      expect(securityService.isLocked()).toBe(true);
    });

    it('should return lock time remaining', async () => {
      await securityService.setPIN('123456');

      for (let i = 0; i < 5; i++) {
        await securityService.authenticate({ type: 'pin', value: '000000' });
      }

      const remaining = securityService.getLockTimeRemaining();
      expect(remaining).toBeGreaterThan(0);
    });
  });

  describe('Auto-lock', () => {
    it('should set auto-lock timeout', async () => {
      await securityService.setAutoLockTimeout(300000); // 5 minutes

      expect(securityService.getAutoLockTimeout()).toBe(300000);
    });

    it('should get default auto-lock timeout', () => {
      const timeout = securityService.getAutoLockTimeout();

      expect(timeout).toBe(300000); // Default 5 minutes
    });
  });

  describe('Security Level', () => {
    it('should return low security when no PIN', () => {
      const level = securityService.getSecurityLevel();

      expect(level).toBe('low');
    });

    it('should return medium security with PIN only', async () => {
      await securityService.setPIN('123456');

      const level = securityService.getSecurityLevel();

      expect(level).toBe('medium');
    });

    it('should return high security with PIN and biometrics', async () => {
      await securityService.setPIN('123456');
      await securityService.enableBiometrics();

      const level = securityService.getSecurityLevel();

      expect(level).toBe('high');
    });
  });

  describe('Hash', () => {
    it('should hash PIN securely', () => {
      const hash1 = securityService.hashPIN('123456');
      const hash2 = securityService.hashPIN('123456');

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe('123456');
    });

    it('should produce different hashes for different PINs', () => {
      const hash1 = securityService.hashPIN('123456');
      const hash2 = securityService.hashPIN('654321');

      expect(hash1).not.toBe(hash2);
    });
  });
});
