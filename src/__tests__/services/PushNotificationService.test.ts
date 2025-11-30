/**
 * PushNotificationService Tests
 */

import { PushNotificationService } from '../../services/ui/PushNotificationService';
import * as Notifications from 'expo-notifications';

describe('PushNotificationService', () => {
  let pushService: PushNotificationService;

  beforeEach(() => {
    pushService = new PushNotificationService();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize notification handler', async () => {
      await pushService.initialize();
      expect(Notifications.setNotificationHandler).toHaveBeenCalled();
    });

    it('should register listeners', async () => {
      await pushService.initialize();
      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
    });
  });

  describe('permissions', () => {
    it('should check permissions', async () => {
      const status = await pushService.checkPermissions();
      expect(status).toBe('granted');
    });

    it('should request permissions', async () => {
      const status = await pushService.requestPermissions();
      expect(status).toBe('granted');
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });
  });

  describe('push token', () => {
    it('should get push token', async () => {
      const token = await pushService.getPushToken();
      expect(token).toBe('ExponentPushToken[xxx]');
    });
  });

  describe('local notifications', () => {
    it('should schedule notification', async () => {
      const id = await pushService.scheduleNotification({
        title: 'Test',
        body: 'Test body',
        data: { type: 'test' },
      });

      expect(id).toBe('notif-id');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it('should schedule delayed notification', async () => {
      await pushService.scheduleNotification({
        title: 'Delayed',
        body: 'Body',
        trigger: { seconds: 60 } as any,
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: { seconds: 60 },
        })
      );
    });

    it('should cancel notification', async () => {
      await pushService.cancelNotification('notif-id');
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif-id');
    });

    it('should cancel all notifications', async () => {
      await pushService.cancelAllNotifications();
      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('badge management', () => {
    it('should get badge count', async () => {
      const count = await pushService.getBadgeCount();
      expect(count).toBe(0);
    });

    it('should set badge count', async () => {
      await pushService.setBadgeCount(5);
      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(5);
    });

    it('should clear badge', async () => {
      await pushService.clearBadge();
      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
    });
  });

  describe('transaction notifications', () => {
    it('should send transaction received notification', async () => {
      await pushService.notifyTransactionReceived({
        amount: '1.5',
        token: 'ETH',
        from: '0x123',
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: expect.stringContaining('Received'),
          }),
        })
      );
    });

    it('should send transaction confirmed notification', async () => {
      await pushService.notifyTransactionConfirmed({
        hash: '0xabc',
        status: 'success',
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should remove listeners on cleanup', async () => {
      await pushService.initialize();
      pushService.cleanup();
      // Listeners should be removed
    });
  });
});
