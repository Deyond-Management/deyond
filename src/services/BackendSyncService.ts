/**
 * BackendSyncService
 * Handles user settings sync, backup, and cloud operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface SyncConfig {
  baseUrl: string;
  apiKey: string;
  syncInterval: number;
}

interface SyncState {
  lastSync: number;
  pendingChanges: number;
  syncInProgress: boolean;
}

interface UserSettings {
  theme: string;
  currency: string;
  language: string;
  notifications: boolean;
  biometrics: boolean;
  autoLock: number;
}

interface SyncResult {
  success: boolean;
  timestamp: number;
  itemsSynced: number;
  errors?: string[];
}

const SYNC_STATE_KEY = '@sync_state';
const USER_SETTINGS_KEY = '@user_settings';
const PENDING_SYNC_KEY = '@pending_sync';

export class BackendSyncService {
  private config: SyncConfig;
  private syncTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: SyncConfig) {
    this.config = config;
  }

  /**
   * Initialize sync service and start periodic sync
   */
  async initialize(): Promise<void> {
    // Load sync state
    const state = await this.getSyncState();

    // Check for pending changes
    if (state.pendingChanges > 0) {
      await this.syncToCloud();
    }

    // Start periodic sync
    this.startPeriodicSync();
  }

  /**
   * Start periodic sync interval
   */
  startPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.syncToCloud().catch(console.error);
    }, this.config.syncInterval);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Get current sync state
   */
  async getSyncState(): Promise<SyncState> {
    const data = await AsyncStorage.getItem(SYNC_STATE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return {
      lastSync: 0,
      pendingChanges: 0,
      syncInProgress: false,
    };
  }

  /**
   * Update sync state
   */
  private async updateSyncState(state: Partial<SyncState>): Promise<void> {
    const current = await this.getSyncState();
    await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify({ ...current, ...state }));
  }

  /**
   * Save user settings locally and queue for sync
   */
  async saveUserSettings(settings: UserSettings): Promise<void> {
    // Save locally
    await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));

    // Queue for sync
    await this.queueForSync('settings', settings);
  }

  /**
   * Get user settings
   */
  async getUserSettings(): Promise<UserSettings | null> {
    const data = await AsyncStorage.getItem(USER_SETTINGS_KEY);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Queue data for sync
   */
  private async queueForSync(type: string, data: unknown): Promise<void> {
    const pending = await this.getPendingSync();
    pending.push({
      type,
      data,
      timestamp: Date.now(),
      id: `${type}_${Date.now()}`,
    });

    await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));

    const state = await this.getSyncState();
    await this.updateSyncState({ pendingChanges: state.pendingChanges + 1 });
  }

  /**
   * Get pending sync items
   */
  private async getPendingSync(): Promise<
    Array<{
      type: string;
      data: unknown;
      timestamp: number;
      id: string;
    }>
  > {
    const data = await AsyncStorage.getItem(PENDING_SYNC_KEY);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Sync data to cloud
   */
  async syncToCloud(): Promise<SyncResult> {
    const state = await this.getSyncState();

    if (state.syncInProgress) {
      return {
        success: false,
        timestamp: Date.now(),
        itemsSynced: 0,
        errors: ['Sync already in progress'],
      };
    }

    await this.updateSyncState({ syncInProgress: true });

    try {
      const pending = await this.getPendingSync();

      if (pending.length === 0) {
        await this.updateSyncState({
          syncInProgress: false,
          lastSync: Date.now(),
        });
        return {
          success: true,
          timestamp: Date.now(),
          itemsSynced: 0,
        };
      }

      // Send to backend
      const response = await fetch(`${this.config.baseUrl}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({ items: pending }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      // Clear pending items
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify([]));

      await this.updateSyncState({
        syncInProgress: false,
        lastSync: Date.now(),
        pendingChanges: 0,
      });

      return {
        success: true,
        timestamp: Date.now(),
        itemsSynced: pending.length,
      };
    } catch (error) {
      await this.updateSyncState({ syncInProgress: false });

      return {
        success: false,
        timestamp: Date.now(),
        itemsSynced: 0,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Sync from cloud (restore)
   */
  async syncFromCloud(): Promise<SyncResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/sync/restore`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Restore failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Restore settings
      if (data.settings) {
        await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(data.settings));
      }

      await this.updateSyncState({
        lastSync: Date.now(),
      });

      return {
        success: true,
        timestamp: Date.now(),
        itemsSynced: Object.keys(data).length,
      };
    } catch (error) {
      return {
        success: false,
        timestamp: Date.now(),
        itemsSynced: 0,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Backup wallet addresses (encrypted)
   */
  async backupWalletAddresses(addresses: string[], encryptionKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/backup/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          addresses,
          encryptionKey, // Client-side encrypted
          timestamp: Date.now(),
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Check sync health
   */
  async checkHealth(): Promise<{
    healthy: boolean;
    lastSync: number;
    pendingChanges: number;
  }> {
    const state = await this.getSyncState();
    const timeSinceLastSync = Date.now() - state.lastSync;
    const isHealthy = timeSinceLastSync < this.config.syncInterval * 3;

    return {
      healthy: isHealthy,
      lastSync: state.lastSync,
      pendingChanges: state.pendingChanges,
    };
  }

  /**
   * Force sync now
   */
  async forceSync(): Promise<SyncResult> {
    return this.syncToCloud();
  }

  /**
   * Clear all synced data
   */
  async clearSyncData(): Promise<void> {
    await AsyncStorage.multiRemove([SYNC_STATE_KEY, USER_SETTINGS_KEY, PENDING_SYNC_KEY]);
  }
}

export default BackendSyncService;
