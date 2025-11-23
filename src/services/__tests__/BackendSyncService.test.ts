import AsyncStorage from '@react-native-async-storage/async-storage';
import BackendSyncService from '../BackendSyncService';

// Mock fetch
global.fetch = jest.fn();

describe('BackendSyncService', () => {
  let service: BackendSyncService;
  const mockConfig = {
    baseUrl: 'https://api.deyond.io',
    apiKey: 'test-api-key',
    syncInterval: 60000,
  };

  beforeEach(() => {
    service = new BackendSyncService(mockConfig);
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  describe('constructor', () => {
    it('should create service with config', () => {
      expect(service).toBeDefined();
    });
  });

  describe('getSyncState', () => {
    it('should return default state when no data', async () => {
      const state = await service.getSyncState();
      expect(state).toEqual({
        lastSync: 0,
        pendingChanges: 0,
        syncInProgress: false,
      });
    });

    it('should return stored state', async () => {
      const storedState = {
        lastSync: 1000,
        pendingChanges: 5,
        syncInProgress: false,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(storedState)
      );

      const state = await service.getSyncState();
      expect(state).toEqual(storedState);
    });
  });

  describe('saveUserSettings', () => {
    it('should save settings to AsyncStorage', async () => {
      const settings = {
        theme: 'dark',
        currency: 'USD',
        language: 'en',
        notifications: true,
        biometrics: true,
        autoLock: 5,
      };

      await service.saveUserSettings(settings);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@user_settings',
        JSON.stringify(settings)
      );
    });
  });

  describe('getUserSettings', () => {
    it('should return null when no settings', async () => {
      const settings = await service.getUserSettings();
      expect(settings).toBeNull();
    });

    it('should return stored settings', async () => {
      const storedSettings = {
        theme: 'light',
        currency: 'EUR',
        language: 'ko',
        notifications: false,
        biometrics: false,
        autoLock: 10,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(storedSettings)
      );

      const settings = await service.getUserSettings();
      expect(settings).toEqual(storedSettings);
    });
  });

  describe('syncToCloud', () => {
    it('should return early if sync in progress', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({ syncInProgress: true, lastSync: 0, pendingChanges: 0 })
      );

      const result = await service.syncToCloud();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Sync already in progress');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should return success when no pending changes', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify({ syncInProgress: false, lastSync: 0, pendingChanges: 0 }))
        .mockResolvedValueOnce(JSON.stringify([]));

      const result = await service.syncToCloud();

      expect(result.success).toBe(true);
      expect(result.itemsSynced).toBe(0);
    });

    it('should sync pending items to cloud', async () => {
      const pendingItems = [
        { type: 'settings', data: { theme: 'dark' }, timestamp: 1000, id: 'settings_1000' },
      ];

      const syncState = { syncInProgress: false, lastSync: 0, pendingChanges: 1 };

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(syncState)) // getSyncState (initial check)
        .mockResolvedValueOnce(JSON.stringify(syncState)) // getSyncState in updateSyncState
        .mockResolvedValueOnce(JSON.stringify(pendingItems)) // getPendingSync
        .mockResolvedValueOnce(JSON.stringify({ ...syncState, syncInProgress: true })); // getSyncState in final updateSyncState

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await service.syncToCloud();

      expect(fetch).toHaveBeenCalledWith(
        'https://api.deyond.io/api/sync',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
          }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.itemsSynced).toBe(1);
    });

    it('should handle sync failure', async () => {
      const pendingItems = [
        { type: 'settings', data: {}, timestamp: 1000, id: 'settings_1000' },
      ];

      const syncState = { syncInProgress: false, lastSync: 0, pendingChanges: 1 };

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(syncState)) // getSyncState (initial check)
        .mockResolvedValueOnce(JSON.stringify(syncState)) // getSyncState in updateSyncState
        .mockResolvedValueOnce(JSON.stringify(pendingItems)) // getPendingSync
        .mockResolvedValueOnce(JSON.stringify({ ...syncState, syncInProgress: true })); // getSyncState in error updateSyncState

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      const result = await service.syncToCloud();

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('syncFromCloud', () => {
    it('should restore settings from cloud', async () => {
      const cloudData = {
        settings: { theme: 'dark', currency: 'USD' },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(cloudData),
      });

      const result = await service.syncFromCloud();

      expect(fetch).toHaveBeenCalledWith(
        'https://api.deyond.io/api/sync/restore',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result.success).toBe(true);
      // Check that setItem was called with settings (may be called multiple times)
      const setItemCalls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const settingsCall = setItemCalls.find(
        (call: [string, string]) => call[0] === '@user_settings'
      );
      expect(settingsCall).toBeDefined();
      expect(settingsCall[1]).toBe(JSON.stringify(cloudData.settings));
    });

    it('should handle restore failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      const result = await service.syncFromCloud();

      expect(result.success).toBe(false);
    });
  });

  describe('backupWalletAddresses', () => {
    it('should backup addresses to cloud', async () => {
      const addresses = ['0x123', '0x456'];
      const encryptionKey = 'encrypted-key';

      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      const result = await service.backupWalletAddresses(addresses, encryptionKey);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.deyond.io/api/backup/addresses',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"addresses":["0x123","0x456"]'),
        })
      );
      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

      const result = await service.backupWalletAddresses(['0x123'], 'key');
      expect(result).toBe(false);
    });
  });

  describe('checkHealth', () => {
    it('should return healthy when synced recently', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          lastSync: Date.now() - 30000, // 30 seconds ago
          pendingChanges: 0,
          syncInProgress: false,
        })
      );

      const health = await service.checkHealth();

      expect(health.healthy).toBe(true);
    });

    it('should return unhealthy when not synced recently', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          lastSync: Date.now() - 300000, // 5 minutes ago
          pendingChanges: 5,
          syncInProgress: false,
        })
      );

      const health = await service.checkHealth();

      expect(health.healthy).toBe(false);
      expect(health.pendingChanges).toBe(5);
    });
  });

  describe('clearSyncData', () => {
    it('should clear all sync-related data', async () => {
      await service.clearSyncData();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@sync_state',
        '@user_settings',
        '@pending_sync',
      ]);
    });
  });

  describe('periodic sync', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
      service.stopPeriodicSync();
    });

    it('should start periodic sync', () => {
      service.startPeriodicSync();
      // Timer should be set
      expect(jest.getTimerCount()).toBe(1);
    });

    it('should stop periodic sync', () => {
      service.startPeriodicSync();
      service.stopPeriodicSync();
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});
