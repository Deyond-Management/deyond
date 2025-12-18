/**
 * Cloud Backup Types
 * Type definitions for cloud backup functionality
 */

/**
 * Supported cloud providers
 */
export type CloudProvider = 'icloud' | 'google_drive' | 'local';

/**
 * Backup status
 */
export enum BackupStatus {
  IDLE = 'idle',
  BACKING_UP = 'backing_up',
  RESTORING = 'restoring',
  SUCCESS = 'success',
  FAILED = 'failed',
}

/**
 * Backup metadata
 */
export interface BackupMetadata {
  id: string;
  version: string;
  createdAt: number;
  deviceId: string;
  deviceName: string;
  appVersion: string;
  provider: CloudProvider;
  walletCount: number;
  hasContacts: boolean;
  hasTokens: boolean;
  hasSettings: boolean;
  checksum: string;
  encryptionVersion: string;
}

/**
 * Backup file structure
 */
export interface BackupData {
  metadata: BackupMetadata;
  wallets: EncryptedWalletBackup[];
  contacts?: EncryptedData;
  customTokens?: EncryptedData;
  settings?: EncryptedData;
  transactionHistory?: EncryptedData;
}

/**
 * Encrypted wallet backup
 */
export interface EncryptedWalletBackup {
  id: string;
  name: string;
  address: string;
  encryptedPrivateData: EncryptedData;
  createdAt: number;
  type: 'hd' | 'imported' | 'hardware';
}

/**
 * Generic encrypted data structure
 */
export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
  algorithm: string;
  keyDerivation: KeyDerivationParams;
}

/**
 * Key derivation parameters
 */
export interface KeyDerivationParams {
  algorithm: 'pbkdf2' | 'argon2';
  iterations?: number;
  memory?: number;
  parallelism?: number;
}

/**
 * Backup options
 */
export interface BackupOptions {
  includeContacts?: boolean;
  includeTokens?: boolean;
  includeSettings?: boolean;
  includeTransactionHistory?: boolean;
  provider?: CloudProvider;
}

/**
 * Restore options
 */
export interface RestoreOptions {
  backupId?: string;
  provider?: CloudProvider;
  mergeWithExisting?: boolean;
  restoreContacts?: boolean;
  restoreTokens?: boolean;
  restoreSettings?: boolean;
}

/**
 * Backup result
 */
export interface BackupResult {
  success: boolean;
  backupId?: string;
  provider: CloudProvider;
  timestamp: number;
  size?: number;
  error?: string;
}

/**
 * Restore result
 */
export interface RestoreResult {
  success: boolean;
  walletsRestored: number;
  contactsRestored?: number;
  tokensRestored?: number;
  error?: string;
}

/**
 * Backup file list item
 */
export interface BackupListItem {
  id: string;
  createdAt: number;
  deviceName: string;
  walletCount: number;
  size: number;
  provider: CloudProvider;
}

/**
 * Auto-backup settings
 */
export interface AutoBackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  provider: CloudProvider;
  lastBackup?: number;
  nextBackup?: number;
  retainCount: number;
}

/**
 * Backup error types
 */
export enum BackupErrorType {
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  CLOUD_AUTH_FAILED = 'CLOUD_AUTH_FAILED',
  CLOUD_UPLOAD_FAILED = 'CLOUD_UPLOAD_FAILED',
  CLOUD_DOWNLOAD_FAILED = 'CLOUD_DOWNLOAD_FAILED',
  INVALID_BACKUP = 'INVALID_BACKUP',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  BACKUP_NOT_FOUND = 'BACKUP_NOT_FOUND',
  VERSION_MISMATCH = 'VERSION_MISMATCH',
  STORAGE_FULL = 'STORAGE_FULL',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Backup error class
 */
export class BackupError extends Error {
  type: BackupErrorType;
  details?: any;

  constructor(type: BackupErrorType, message: string, details?: any) {
    super(message);
    this.name = 'BackupError';
    this.type = type;
    this.details = details;
  }
}

/**
 * Backup constants
 */
export const BACKUP_VERSION = '1.0.0';
export const BACKUP_FILE_EXTENSION = '.deyond-backup';
export const BACKUP_ENCRYPTION_VERSION = 'aes-256-gcm-v1';

/**
 * Default key derivation settings (secure but reasonable performance)
 */
export const DEFAULT_KEY_DERIVATION: KeyDerivationParams = {
  algorithm: 'pbkdf2',
  iterations: 100000,
};

/**
 * Backup frequency intervals in milliseconds
 */
export const BACKUP_INTERVALS = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

/**
 * Maximum backup file size (100MB)
 */
export const MAX_BACKUP_SIZE = 100 * 1024 * 1024;

/**
 * Default number of backups to retain
 */
export const DEFAULT_RETAIN_COUNT = 5;
