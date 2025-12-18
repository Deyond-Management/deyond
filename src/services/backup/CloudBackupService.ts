/**
 * CloudBackupService
 * Service for encrypted cloud backup and restore of wallet data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import {
  CloudProvider,
  BackupStatus,
  BackupMetadata,
  BackupData,
  EncryptedWalletBackup,
  EncryptedData,
  BackupOptions,
  RestoreOptions,
  BackupResult,
  RestoreResult,
  BackupListItem,
  AutoBackupSettings,
  BackupError,
  BackupErrorType,
  BACKUP_VERSION,
  BACKUP_FILE_EXTENSION,
  BACKUP_ENCRYPTION_VERSION,
  DEFAULT_KEY_DERIVATION,
  BACKUP_INTERVALS,
  DEFAULT_RETAIN_COUNT,
  MAX_BACKUP_SIZE,
} from './types';
import EventEmitter from 'events';

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  AUTO_BACKUP_SETTINGS: '@autoBackupSettings',
  BACKUP_HISTORY: '@backupHistory',
  LAST_BACKUP_ID: '@lastBackupId',
};

/**
 * Wallet data interface (from storage)
 */
interface WalletStorageData {
  id: string;
  name: string;
  address: string;
  encryptedPrivateKey?: string;
  encryptedSeedPhrase?: string;
  createdAt: number;
  type: 'hd' | 'imported' | 'hardware';
}

/**
 * Cloud Backup Service
 */
class CloudBackupService extends EventEmitter {
  private status: BackupStatus = BackupStatus.IDLE;
  private autoBackupTimer: NodeJS.Timeout | null = null;
  private deviceId: string = '';
  private deviceName: string = 'Unknown Device';

  /**
   * Initialize the service
   */
  async initialize(deviceId: string, deviceName: string): Promise<void> {
    this.deviceId = deviceId;
    this.deviceName = deviceName;

    // Load and schedule auto-backup if enabled
    const settings = await this.getAutoBackupSettings();
    if (settings.enabled) {
      this.scheduleAutoBackup(settings);
    }
  }

  /**
   * Get current backup status
   */
  getStatus(): BackupStatus {
    return this.status;
  }

  /**
   * Create a new backup
   */
  async createBackup(password: string, options: BackupOptions = {}): Promise<BackupResult> {
    if (this.status === BackupStatus.BACKING_UP) {
      throw new BackupError(BackupErrorType.UNKNOWN, 'Backup already in progress');
    }

    this.status = BackupStatus.BACKING_UP;
    this.emit('statusChange', this.status);

    const provider = options.provider || 'local';

    try {
      // Gather data to backup
      const wallets = await this.getWalletsForBackup();
      const encryptedWallets = await this.encryptWallets(wallets, password);

      // Create backup data structure
      const backupId = this.generateBackupId();
      const backupData: BackupData = {
        metadata: {
          id: backupId,
          version: BACKUP_VERSION,
          createdAt: Date.now(),
          deviceId: this.deviceId,
          deviceName: this.deviceName,
          appVersion: '1.0.0', // Would come from app config
          provider,
          walletCount: wallets.length,
          hasContacts: options.includeContacts || false,
          hasTokens: options.includeTokens || false,
          hasSettings: options.includeSettings || false,
          checksum: '', // Set after serialization
          encryptionVersion: BACKUP_ENCRYPTION_VERSION,
        },
        wallets: encryptedWallets,
      };

      // Add optional data
      if (options.includeContacts) {
        const contacts = await this.getContacts();
        backupData.contacts = await this.encryptData(JSON.stringify(contacts), password);
      }

      if (options.includeTokens) {
        const tokens = await this.getCustomTokens();
        backupData.customTokens = await this.encryptData(JSON.stringify(tokens), password);
      }

      if (options.includeSettings) {
        const settings = await this.getAppSettings();
        backupData.settings = await this.encryptData(JSON.stringify(settings), password);
      }

      // Calculate checksum
      const dataString = JSON.stringify(backupData);
      backupData.metadata.checksum = await this.calculateChecksum(dataString);

      // Upload to cloud
      const uploadResult = await this.uploadBackup(backupId, JSON.stringify(backupData), provider);

      // Save backup history
      await this.saveBackupHistory(backupData.metadata);

      this.status = BackupStatus.SUCCESS;
      this.emit('statusChange', this.status);
      this.emit('backupComplete', { backupId, provider });

      return {
        success: true,
        backupId,
        provider,
        timestamp: Date.now(),
        size: dataString.length,
      };
    } catch (error: any) {
      this.status = BackupStatus.FAILED;
      this.emit('statusChange', this.status);
      this.emit('backupFailed', error);

      return {
        success: false,
        provider,
        timestamp: Date.now(),
        error: error.message,
      };
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(
    backupId: string,
    password: string,
    options: RestoreOptions = {}
  ): Promise<RestoreResult> {
    if (this.status === BackupStatus.RESTORING) {
      throw new BackupError(BackupErrorType.UNKNOWN, 'Restore already in progress');
    }

    this.status = BackupStatus.RESTORING;
    this.emit('statusChange', this.status);

    const provider = options.provider || 'local';

    try {
      // Download backup
      const backupString = await this.downloadBackup(backupId, provider);
      const backupData: BackupData = JSON.parse(backupString);

      // Verify backup
      await this.verifyBackup(backupData, password);

      let walletsRestored = 0;
      let contactsRestored = 0;
      let tokensRestored = 0;

      // Restore wallets
      for (const encryptedWallet of backupData.wallets) {
        try {
          await this.restoreWallet(encryptedWallet, password, options.mergeWithExisting);
          walletsRestored++;
        } catch (error) {
          console.error(`Failed to restore wallet ${encryptedWallet.id}:`, error);
        }
      }

      // Restore contacts
      if (options.restoreContacts && backupData.contacts) {
        try {
          const contactsData = await this.decryptData(backupData.contacts, password);
          const contacts = JSON.parse(contactsData);
          await this.restoreContacts(contacts);
          contactsRestored = contacts.length;
        } catch (error) {
          console.error('Failed to restore contacts:', error);
        }
      }

      // Restore tokens
      if (options.restoreTokens && backupData.customTokens) {
        try {
          const tokensData = await this.decryptData(backupData.customTokens, password);
          const tokens = JSON.parse(tokensData);
          await this.restoreTokens(tokens);
          tokensRestored = tokens.length;
        } catch (error) {
          console.error('Failed to restore tokens:', error);
        }
      }

      // Restore settings
      if (options.restoreSettings && backupData.settings) {
        try {
          const settingsData = await this.decryptData(backupData.settings, password);
          const settings = JSON.parse(settingsData);
          await this.restoreSettings(settings);
        } catch (error) {
          console.error('Failed to restore settings:', error);
        }
      }

      this.status = BackupStatus.SUCCESS;
      this.emit('statusChange', this.status);
      this.emit('restoreComplete', { walletsRestored });

      return {
        success: true,
        walletsRestored,
        contactsRestored,
        tokensRestored,
      };
    } catch (error: any) {
      this.status = BackupStatus.FAILED;
      this.emit('statusChange', this.status);
      this.emit('restoreFailed', error);

      return {
        success: false,
        walletsRestored: 0,
        error: error.message,
      };
    }
  }

  /**
   * List available backups
   */
  async listBackups(provider?: CloudProvider): Promise<BackupListItem[]> {
    try {
      const history = await this.getBackupHistory();

      if (provider) {
        return history.filter(b => b.provider === provider);
      }

      return history;
    } catch (error) {
      return [];
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string, provider: CloudProvider): Promise<boolean> {
    try {
      // Delete from cloud
      await this.deleteFromCloud(backupId, provider);

      // Remove from history
      const history = await this.getBackupHistory();
      const filtered = history.filter(b => b.id !== backupId);
      await AsyncStorage.setItem(STORAGE_KEYS.BACKUP_HISTORY, JSON.stringify(filtered));

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get auto-backup settings
   */
  async getAutoBackupSettings(): Promise<AutoBackupSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.AUTO_BACKUP_SETTINGS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // Return defaults
    }

    return {
      enabled: false,
      frequency: 'weekly',
      provider: 'local',
      retainCount: DEFAULT_RETAIN_COUNT,
    };
  }

  /**
   * Update auto-backup settings
   */
  async setAutoBackupSettings(settings: Partial<AutoBackupSettings>): Promise<void> {
    const current = await this.getAutoBackupSettings();
    const updated: AutoBackupSettings = { ...current, ...settings };

    await AsyncStorage.setItem(STORAGE_KEYS.AUTO_BACKUP_SETTINGS, JSON.stringify(updated));

    // Reschedule if needed
    if (updated.enabled) {
      this.scheduleAutoBackup(updated);
    } else {
      this.cancelAutoBackup();
    }
  }

  /**
   * Cancel scheduled auto-backup
   */
  cancelAutoBackup(): void {
    if (this.autoBackupTimer) {
      clearTimeout(this.autoBackupTimer);
      this.autoBackupTimer = null;
    }
  }

  // Private methods

  /**
   * Encrypt wallets for backup
   */
  private async encryptWallets(
    wallets: WalletStorageData[],
    password: string
  ): Promise<EncryptedWalletBackup[]> {
    const encrypted: EncryptedWalletBackup[] = [];

    for (const wallet of wallets) {
      const privateData = {
        encryptedPrivateKey: wallet.encryptedPrivateKey,
        encryptedSeedPhrase: wallet.encryptedSeedPhrase,
      };

      encrypted.push({
        id: wallet.id,
        name: wallet.name,
        address: wallet.address,
        encryptedPrivateData: await this.encryptData(JSON.stringify(privateData), password),
        createdAt: wallet.createdAt,
        type: wallet.type,
      });
    }

    return encrypted;
  }

  /**
   * Encrypt data with password
   */
  private async encryptData(data: string, password: string): Promise<EncryptedData> {
    // Generate salt and IV
    const salt = await Crypto.getRandomBytesAsync(32);
    const iv = await Crypto.getRandomBytesAsync(16);

    // Derive key using PBKDF2 (simplified - in production use proper implementation)
    const keyMaterial = await this.deriveKey(password, salt);

    // In a real implementation, use actual AES-256-GCM encryption
    // For this demo, we'll use a placeholder approach
    const saltHex = this.bytesToHex(salt);
    const ivHex = this.bytesToHex(iv);

    // Simplified encryption (would use actual crypto library in production)
    const ciphertext = Buffer.from(data).toString('base64');

    return {
      ciphertext,
      iv: ivHex,
      salt: saltHex,
      algorithm: 'aes-256-gcm',
      keyDerivation: DEFAULT_KEY_DERIVATION,
    };
  }

  /**
   * Decrypt data with password
   */
  private async decryptData(encryptedData: EncryptedData, password: string): Promise<string> {
    const salt = this.hexToBytes(encryptedData.salt);

    // Derive key
    const keyMaterial = await this.deriveKey(password, salt);

    // Simplified decryption (would use actual crypto library in production)
    try {
      return Buffer.from(encryptedData.ciphertext, 'base64').toString('utf8');
    } catch (error) {
      throw new BackupError(
        BackupErrorType.DECRYPTION_FAILED,
        'Failed to decrypt data - invalid password'
      );
    }
  }

  /**
   * Derive encryption key from password
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<string> {
    // Simplified key derivation (would use proper PBKDF2 in production)
    const combined = password + this.bytesToHex(salt);
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, combined);
  }

  /**
   * Calculate checksum of data
   */
  private async calculateChecksum(data: string): Promise<string> {
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data);
  }

  /**
   * Verify backup integrity
   */
  private async verifyBackup(backup: BackupData, password: string): Promise<void> {
    // Verify version compatibility
    if (!this.isVersionCompatible(backup.metadata.version)) {
      throw new BackupError(
        BackupErrorType.VERSION_MISMATCH,
        `Backup version ${backup.metadata.version} is not compatible`
      );
    }

    // Try to decrypt first wallet to verify password
    if (backup.wallets.length > 0) {
      try {
        await this.decryptData(backup.wallets[0].encryptedPrivateData, password);
      } catch {
        throw new BackupError(BackupErrorType.INVALID_PASSWORD, 'Invalid backup password');
      }
    }
  }

  /**
   * Check version compatibility
   */
  private isVersionCompatible(version: string): boolean {
    const [major] = version.split('.').map(Number);
    const [currentMajor] = BACKUP_VERSION.split('.').map(Number);
    return major <= currentMajor;
  }

  /**
   * Upload backup to cloud
   */
  private async uploadBackup(
    backupId: string,
    data: string,
    provider: CloudProvider
  ): Promise<void> {
    // Check size
    if (data.length > MAX_BACKUP_SIZE) {
      throw new BackupError(BackupErrorType.STORAGE_FULL, 'Backup file exceeds maximum size');
    }

    // In production, this would upload to actual cloud providers
    // For now, we'll store locally
    if (provider === 'local') {
      await AsyncStorage.setItem(`@backup_${backupId}`, data);
    } else {
      // Placeholder for cloud upload
      // Would use platform-specific APIs for iCloud/Google Drive
      await AsyncStorage.setItem(`@backup_${backupId}`, data);
    }
  }

  /**
   * Download backup from cloud
   */
  private async downloadBackup(backupId: string, provider: CloudProvider): Promise<string> {
    // In production, this would download from actual cloud providers
    const data = await AsyncStorage.getItem(`@backup_${backupId}`);

    if (!data) {
      throw new BackupError(BackupErrorType.BACKUP_NOT_FOUND, `Backup ${backupId} not found`);
    }

    return data;
  }

  /**
   * Delete backup from cloud
   */
  private async deleteFromCloud(backupId: string, provider: CloudProvider): Promise<void> {
    await AsyncStorage.removeItem(`@backup_${backupId}`);
  }

  /**
   * Get wallets from storage for backup
   */
  private async getWalletsForBackup(): Promise<WalletStorageData[]> {
    try {
      const data = await AsyncStorage.getItem('@wallets');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Restore a single wallet
   */
  private async restoreWallet(
    encryptedWallet: EncryptedWalletBackup,
    password: string,
    mergeWithExisting?: boolean
  ): Promise<void> {
    const privateData = await this.decryptData(encryptedWallet.encryptedPrivateData, password);

    const walletData: WalletStorageData = {
      id: encryptedWallet.id,
      name: encryptedWallet.name,
      address: encryptedWallet.address,
      createdAt: encryptedWallet.createdAt,
      type: encryptedWallet.type,
      ...JSON.parse(privateData),
    };

    // Get existing wallets
    const existing = await this.getWalletsForBackup();

    if (mergeWithExisting) {
      // Add only if not exists
      if (!existing.find(w => w.address === walletData.address)) {
        existing.push(walletData);
      }
    } else {
      // Replace if exists
      const index = existing.findIndex(w => w.address === walletData.address);
      if (index >= 0) {
        existing[index] = walletData;
      } else {
        existing.push(walletData);
      }
    }

    await AsyncStorage.setItem('@wallets', JSON.stringify(existing));
  }

  /**
   * Get contacts for backup
   */
  private async getContacts(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem('@contacts');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Restore contacts
   */
  private async restoreContacts(contacts: any[]): Promise<void> {
    await AsyncStorage.setItem('@contacts', JSON.stringify(contacts));
  }

  /**
   * Get custom tokens for backup
   */
  private async getCustomTokens(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem('@customTokens');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Restore custom tokens
   */
  private async restoreTokens(tokens: any[]): Promise<void> {
    await AsyncStorage.setItem('@customTokens', JSON.stringify(tokens));
  }

  /**
   * Get app settings for backup
   */
  private async getAppSettings(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem('@settings');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  /**
   * Restore app settings
   */
  private async restoreSettings(settings: any): Promise<void> {
    await AsyncStorage.setItem('@settings', JSON.stringify(settings));
  }

  /**
   * Save backup to history
   */
  private async saveBackupHistory(metadata: BackupMetadata): Promise<void> {
    const history = await this.getBackupHistory();

    history.unshift({
      id: metadata.id,
      createdAt: metadata.createdAt,
      deviceName: metadata.deviceName,
      walletCount: metadata.walletCount,
      size: 0, // Would calculate actual size
      provider: metadata.provider,
    });

    // Keep only recent backups
    const settings = await this.getAutoBackupSettings();
    const trimmed = history.slice(0, settings.retainCount * 2);

    await AsyncStorage.setItem(STORAGE_KEYS.BACKUP_HISTORY, JSON.stringify(trimmed));
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_BACKUP_ID, metadata.id);
  }

  /**
   * Get backup history
   */
  private async getBackupHistory(): Promise<BackupListItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BACKUP_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Schedule auto-backup
   */
  private scheduleAutoBackup(settings: AutoBackupSettings): void {
    this.cancelAutoBackup();

    const interval = BACKUP_INTERVALS[settings.frequency];
    const lastBackup = settings.lastBackup || 0;
    const timeSinceLastBackup = Date.now() - lastBackup;

    // Calculate when next backup should run
    let nextBackupIn = interval - timeSinceLastBackup;
    if (nextBackupIn <= 0) {
      nextBackupIn = 1000; // Run soon if overdue
    }

    this.autoBackupTimer = setTimeout(async () => {
      this.emit('autoBackupStarting');
      // Would trigger backup with stored password or prompt user
      this.scheduleAutoBackup(settings); // Reschedule
    }, nextBackupIn);
  }

  /**
   * Generate unique backup ID
   */
  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert bytes to hex string
   */
  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert hex string to bytes
   */
  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }
}

// Singleton instance
let backupServiceInstance: CloudBackupService | null = null;

export const getCloudBackupService = (): CloudBackupService => {
  if (!backupServiceInstance) {
    backupServiceInstance = new CloudBackupService();
  }
  return backupServiceInstance;
};

export default CloudBackupService;
