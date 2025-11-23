/**
 * PushNotificationService
 * Push notification management
 */

import * as Notifications from 'expo-notifications';

interface NotificationContent {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  trigger?: { seconds: number } | null;
}

interface TransactionReceivedData {
  amount: string;
  token: string;
  from: string;
}

interface TransactionConfirmedData {
  hash: string;
  status: 'success' | 'failed';
}

export class PushNotificationService {
  private receivedListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    this.receivedListener = Notifications.addNotificationReceivedListener(
      this.handleNotificationReceived
    );

    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse
    );
  }

  /**
   * Check notification permissions
   */
  async checkPermissions(): Promise<string> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<string> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status;
  }

  /**
   * Get Expo push token
   */
  async getPushToken(): Promise<string> {
    const { data } = await Notifications.getExpoPushTokenAsync();
    return data;
  }

  /**
   * Schedule local notification
   */
  async scheduleNotification(content: NotificationContent): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        data: content.data,
      },
      trigger: content.trigger || null,
    });
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(id: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(id);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Notify transaction received
   */
  async notifyTransactionReceived(data: TransactionReceivedData): Promise<string> {
    return this.scheduleNotification({
      title: `Received ${data.amount} ${data.token}`,
      body: `From ${data.from.slice(0, 6)}...${data.from.slice(-4)}`,
      data: { type: 'transaction_received', ...data },
    });
  }

  /**
   * Notify transaction confirmed
   */
  async notifyTransactionConfirmed(data: TransactionConfirmedData): Promise<string> {
    const title = data.status === 'success'
      ? 'Transaction Confirmed'
      : 'Transaction Failed';

    return this.scheduleNotification({
      title,
      body: `Hash: ${data.hash.slice(0, 10)}...`,
      data: { type: 'transaction_confirmed', ...data },
    });
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    if (this.receivedListener) {
      this.receivedListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }

  private handleNotificationReceived = (notification: Notifications.Notification) => {
    // Handle notification received
    console.log('Notification received:', notification);
  };

  private handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    // Handle notification tap
    console.log('Notification response:', response);
  };
}

export const pushNotifications = new PushNotificationService();
export default PushNotificationService;
