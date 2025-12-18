/**
 * CloudBackupService Tests
 */

import CloudBackupService, { getCloudBackupService } from '../CloudBackupService';
import {
  BackupStatus,
  BackupError,
  BackupErrorType,
  BACKUP_VERSION,
  BACKUP_INTERVALS,
  DEFAULT_RETAIN_COUNT,
} from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest
    .fn()
    .mockImplementation(size => Promise.resolve(new Uint8Array(size).fill(0x42))),
  digestStringAsync: jest
    .fn()
    .mockImplementation((algorithm, data) => Promise.resolve('mock_hash_' + data.slice(0, 10))),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256',
  },
}));

describe('CloudBackupService', () => {
  let service: CloudBackupService;
  const mockGetItem = AsyncStorage.getItem as jest.Mock;
  const mockSetItem = AsyncStorage.setItem as jest.Mock;
  const mockRemoveItem = AsyncStorage.removeItem as jest.Mock;

  const mockWallets = [
    {
      id: 'wallet-1',
      name: 'My Wallet',
      address: '0x1234567890123456789012345678901234567890',
      encryptedPrivateKey: 'encrypted_key_data',
      createdAt: Date.now(),
      type: 'hd',
    },
  ];

  beforeEach(() => {
    service = new CloudBackupService();
    mockGetItem.mockClear();
    mockSetItem.mockClear();
    mockRemoveItem.mockClear();
    mockSetItem.mockResolvedValue(undefined);
  });

  describe('Singleton', () => {
    it('should return singleton instance', () => {
      const instance1 = getCloudBackupService();
      const instance2 = getCloudBackupService();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialize', () => {
    it('should initialize with device info', async () => {
      mockGetItem.mockResolvedValue(null);

      await service.initialize('device-123', 'Test Device');

      expect(service.getStatus()).toBe(BackupStatus.IDLE);
    });

    it('should schedule auto-backup if enabled', async () => {
      mockGetItem.mockResolvedValue(
        JSON.stringify({
          enabled: true,
          frequency: 'daily',
          provider: 'local',
          retainCount: 5,
        })
      );

      await service.initialize('device-123', 'Test Device');

      // Auto-backup should be scheduled
      expect(service.getStatus()).toBe(BackupStatus.IDLE);
    });
  });

  describe('createBackup', () => {
    beforeEach(async () => {
      mockGetItem.mockImplementation(key => {
        if (key === '@wallets') {
          return Promise.resolve(JSON.stringify(mockWallets));
        }
        if (key === '@autoBackupSettings') {
          return Promise.resolve(null);
        }
        if (key === STORAGE_KEYS.BACKUP_HISTORY) {
          return Promise.resolve('[]');
        }
        return Promise.resolve(null);
      });

      await service.initialize('device-123', 'Test Device');
    });

    const STORAGE_KEYS = {
      BACKUP_HISTORY: '@backupHistory',
    };

    it('should create backup successfully', async () => {
      const result = await service.createBackup('test-password');

      expect(result.success).toBe(true);
      expect(result.backupId).toBeDefined();
      expect(result.provider).toBe('local');
      expect(mockSetItem).toHaveBeenCalled();
    });

    it('should include optional data when requested', async () => {
      mockGetItem.mockImplementation(key => {
        if (key === '@wallets') {
          return Promise.resolve(JSON.stringify(mockWallets));
        }
        if (key === '@contacts') {
          return Promise.resolve(JSON.stringify([{ name: 'Contact 1' }]));
        }
        if (key === '@customTokens') {
          return Promise.resolve(JSON.stringify([{ symbol: 'TEST' }]));
        }
        if (key === '@settings') {
          return Promise.resolve(JSON.stringify({ theme: 'dark' }));
        }
        return Promise.resolve(null);
      });

      const result = await service.createBackup('test-password', {
        includeContacts: true,
        includeTokens: true,
        includeSettings: true,
      });

      expect(result.success).toBe(true);
    });

    it('should emit status changes', async () => {
      const statusChanges: BackupStatus[] = [];
      service.on('statusChange', status => statusChanges.push(status));

      await service.createBackup('test-password');

      expect(statusChanges).toContain(BackupStatus.BACKING_UP);
      expect(statusChanges).toContain(BackupStatus.SUCCESS);
    });

    it('should emit backup complete event', done => {
      service.on('backupComplete', data => {
        expect(data.backupId).toBeDefined();
        expect(data.provider).toBe('local');
        done();
      });

      service.createBackup('test-password');
    });
  });

  describe('restoreBackup', () => {
    const mockBackupData = {
      metadata: {
        id: 'backup-123',
        version: '1.0.0',
        createdAt: Date.now(),
        deviceId: 'device-123',
        deviceName: 'Test Device',
        appVersion: '1.0.0',
        provider: 'local',
        walletCount: 1,
        hasContacts: true,
        hasTokens: true,
        hasSettings: true,
        checksum: 'abc123',
        encryptionVersion: 'aes-256-gcm-v1',
      },
      wallets: [
        {
          id: 'wallet-1',
          name: 'My Wallet',
          address: '0x1234',
          encryptedPrivateData: {
            ciphertext: Buffer.from(JSON.stringify({ encryptedPrivateKey: 'key' })).toString(
              'base64'
            ),
            iv: '42424242',
            salt: '42424242',
            algorithm: 'aes-256-gcm',
            keyDerivation: { algorithm: 'pbkdf2', iterations: 100000 },
          },
          createdAt: Date.now(),
          type: 'hd',
        },
      ],
      contacts: {
        ciphertext: Buffer.from(JSON.stringify([])).toString('base64'),
        iv: '42424242',
        salt: '42424242',
        algorithm: 'aes-256-gcm',
        keyDerivation: { algorithm: 'pbkdf2', iterations: 100000 },
      },
    };

    beforeEach(async () => {
      mockGetItem.mockImplementation(key => {
        if (key === '@backup_backup-123') {
          return Promise.resolve(JSON.stringify(mockBackupData));
        }
        if (key === '@wallets') {
          return Promise.resolve('[]');
        }
        return Promise.resolve(null);
      });

      await service.initialize('device-123', 'Test Device');
    });

    it('should restore backup successfully', async () => {
      const result = await service.restoreBackup('backup-123', 'test-password');

      expect(result.success).toBe(true);
      expect(result.walletsRestored).toBe(1);
    });

    it('should restore contacts when requested', async () => {
      const result = await service.restoreBackup('backup-123', 'test-password', {
        restoreContacts: true,
      });

      expect(result.success).toBe(true);
      expect(result.contactsRestored).toBe(0); // Empty array restored
    });

    it('should throw error for non-existent backup', async () => {
      mockGetItem.mockImplementation(key => {
        if (key === '@backup_nonexistent') {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });

      const result = await service.restoreBackup('nonexistent', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should emit restore complete event', done => {
      service.on('restoreComplete', data => {
        expect(data.walletsRestored).toBeDefined();
        done();
      });

      service.restoreBackup('backup-123', 'test-password');
    });
  });

  describe('listBackups', () => {
    it('should list all backups', async () => {
      const mockHistory = [
        {
          id: 'backup-1',
          createdAt: Date.now(),
          deviceName: 'Device 1',
          walletCount: 1,
          size: 1000,
          provider: 'local',
        },
        {
          id: 'backup-2',
          createdAt: Date.now() - 86400000,
          deviceName: 'Device 1',
          walletCount: 2,
          size: 2000,
          provider: 'icloud',
        },
      ];

      mockGetItem.mockResolvedValue(JSON.stringify(mockHistory));

      const backups = await service.listBackups();

      expect(backups).toHaveLength(2);
    });

    it('should filter by provider', async () => {
      const mockHistory = [
        { id: 'backup-1', provider: 'local' },
        { id: 'backup-2', provider: 'icloud' },
      ];

      mockGetItem.mockResolvedValue(JSON.stringify(mockHistory));

      const backups = await service.listBackups('local');

      expect(backups).toHaveLength(1);
      expect(backups[0].id).toBe('backup-1');
    });

    it('should return empty array on error', async () => {
      mockGetItem.mockRejectedValue(new Error('Storage error'));

      const backups = await service.listBackups();

      expect(backups).toEqual([]);
    });
  });

  describe('deleteBackup', () => {
    beforeEach(() => {
      mockGetItem.mockResolvedValue(
        JSON.stringify([
          { id: 'backup-1', provider: 'local' },
          { id: 'backup-2', provider: 'local' },
        ])
      );
    });

    it('should delete backup successfully', async () => {
      const result = await service.deleteBackup('backup-1', 'local');

      expect(result).toBe(true);
      expect(mockRemoveItem).toHaveBeenCalled();
    });
  });

  describe('Auto Backup Settings', () => {
    it('should get default settings when none saved', async () => {
      mockGetItem.mockResolvedValue(null);

      const settings = await service.getAutoBackupSettings();

      expect(settings.enabled).toBe(false);
      expect(settings.frequency).toBe('weekly');
      expect(settings.retainCount).toBe(DEFAULT_RETAIN_COUNT);
    });

    it('should save auto backup settings', async () => {
      mockGetItem.mockResolvedValue(null);

      await service.setAutoBackupSettings({
        enabled: true,
        frequency: 'daily',
        provider: 'icloud',
      });

      expect(mockSetItem).toHaveBeenCalled();
    });

    it('should cancel auto backup when disabled', async () => {
      mockGetItem.mockResolvedValue(
        JSON.stringify({
          enabled: false,
          frequency: 'weekly',
          provider: 'local',
          retainCount: 5,
        })
      );

      await service.setAutoBackupSettings({ enabled: false });

      // Should not throw
    });
  });

  describe('Constants', () => {
    it('should have correct backup version', () => {
      expect(BACKUP_VERSION).toBe('1.0.0');
    });

    it('should have correct backup intervals', () => {
      expect(BACKUP_INTERVALS.daily).toBe(24 * 60 * 60 * 1000);
      expect(BACKUP_INTERVALS.weekly).toBe(7 * 24 * 60 * 60 * 1000);
      expect(BACKUP_INTERVALS.monthly).toBe(30 * 24 * 60 * 60 * 1000);
    });

    it('should have correct default retain count', () => {
      expect(DEFAULT_RETAIN_COUNT).toBe(5);
    });
  });
});
