/**
 * PushNotificationService
 * Service for managing push notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEY_PUSH_TOKEN = 'push_notification_token';
const STORAGE_KEY_NOTIFICATION_SETTINGS = 'notification_settings';

// Notification categories
export enum NotificationCategory {
  TRANSACTION = 'transaction',
  PRICE_ALERT = 'price_alert',
  SECURITY = 'security',
  SYSTEM = 'system',
}

// Notification types
export enum NotificationType {
  // Transaction notifications
  TRANSACTION_SENT = 'transaction_sent',
  TRANSACTION_RECEIVED = 'transaction_received',
  TRANSACTION_CONFIRMED = 'transaction_confirmed',
  TRANSACTION_FAILED = 'transaction_failed',
  TRANSACTION_PENDING = 'transaction_pending',

  // Price alerts
  PRICE_THRESHOLD = 'price_threshold',
  PRICE_CHANGE_24H = 'price_change_24h',
  PORTFOLIO_VALUE_CHANGE = 'portfolio_value_change',

  // Security notifications
  NEW_DEVICE_LOGIN = 'new_device_login',
  LARGE_TRANSACTION = 'large_transaction',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',

  // System notifications
  APP_UPDATE = 'app_update',
  MAINTENANCE = 'maintenance',
}

export interface NotificationSettings {
  enabled: boolean;
  categories: {
    [NotificationCategory.TRANSACTION]: boolean;
    [NotificationCategory.PRICE_ALERT]: boolean;
    [NotificationCategory.SECURITY]: boolean;
    [NotificationCategory.SYSTEM]: boolean;
  };
  quietHours: {
    enabled: boolean;
    startHour: number;
    endHour: number;
  };
  sound: boolean;
  vibration: boolean;
}

export interface NotificationData {
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface NotificationHistoryItem {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: number;
  read: boolean;
}

// Default notification settings
const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  categories: {
    [NotificationCategory.TRANSACTION]: true,
    [NotificationCategory.PRICE_ALERT]: true,
    [NotificationCategory.SECURITY]: true,
    [NotificationCategory.SYSTEM]: true,
  },
  quietHours: {
    enabled: false,
    startHour: 22,
    endHour: 7,
  },
  sound: true,
  vibration: true,
};

class PushNotificationService {
  private expoPushToken: string | null = null;
  private settings: NotificationSettings = DEFAULT_SETTINGS;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private onNotificationReceived: ((notification: Notifications.Notification) => void) | null =
    null;
  private onNotificationResponse: ((response: Notifications.NotificationResponse) => void) | null =
    null;

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<void> {
    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: this.settings.sound,
        shouldSetBadge: true,
      }),
    });

    // Load settings from storage
    await this.loadSettings();

    // Register for push notifications
    await this.registerForPushNotifications();

    // Set up notification listeners
    this.setupListeners();
  }

  /**
   * Register for push notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return null;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with actual Expo project ID
      });
      this.expoPushToken = tokenData.data;

      // Save token
      await AsyncStorage.setItem(STORAGE_KEY_PUSH_TOKEN, this.expoPushToken);

      // Configure Android channel
      if (Platform.OS === 'android') {
        await this.configureAndroidChannels();
      }

      console.log('Push token registered:', this.expoPushToken);
      return this.expoPushToken;
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      return null;
    }
  }

  /**
   * Configure Android notification channels
   */
  private async configureAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('transactions', {
      name: 'Transactions',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
    });

    await Notifications.setNotificationChannelAsync('price-alerts', {
      name: 'Price Alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#10B981',
    });

    await Notifications.setNotificationChannelAsync('security', {
      name: 'Security',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#EF4444',
    });

    await Notifications.setNotificationChannelAsync('system', {
      name: 'System',
      importance: Notifications.AndroidImportance.LOW,
    });
  }

  /**
   * Set up notification listeners
   */
  private setupListeners(): void {
    // Remove existing listeners
    this.removeListeners();

    // Listener for notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      if (this.onNotificationReceived) {
        this.onNotificationReceived(notification);
      }
    });

    // Listener for notification responses (user tapped notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      if (this.onNotificationResponse) {
        this.onNotificationResponse(response);
      }
    });
  }

  /**
   * Remove notification listeners
   */
  removeListeners(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  /**
   * Set notification received callback
   */
  setOnNotificationReceived(callback: (notification: Notifications.Notification) => void): void {
    this.onNotificationReceived = callback;
  }

  /**
   * Set notification response callback
   */
  setOnNotificationResponse(
    callback: (response: Notifications.NotificationResponse) => void
  ): void {
    this.onNotificationResponse = callback;
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(notification: NotificationData): Promise<string | null> {
    // Check if notifications are enabled
    if (!this.settings.enabled) return null;

    // Check if category is enabled
    if (!this.settings.categories[notification.category]) return null;

    // Check quiet hours
    if (this.isQuietHours()) return null;

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: {
            type: notification.type,
            category: notification.category,
            ...notification.data,
          },
          sound: this.settings.sound ? 'default' : undefined,
        },
        trigger: null, // Send immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to send local notification:', error);
      return null;
    }
  }

  /**
   * Schedule a notification
   */
  async scheduleNotification(
    notification: NotificationData,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string | null> {
    if (!this.settings.enabled) return null;
    if (!this.settings.categories[notification.category]) return null;

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: {
            type: notification.type,
            category: notification.category,
            ...notification.data,
          },
          sound: this.settings.sound ? 'default' : undefined,
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
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
   * Check if currently in quiet hours
   */
  private isQuietHours(): boolean {
    if (!this.settings.quietHours.enabled) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const { startHour, endHour } = this.settings.quietHours;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (startHour > endHour) {
      return currentHour >= startHour || currentHour < endHour;
    }

    return currentHour >= startHour && currentHour < endHour;
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_NOTIFICATION_SETTINGS);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }

  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_NOTIFICATION_SETTINGS, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  /**
   * Get current settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.saveSettings();
  }

  /**
   * Toggle notifications enabled
   */
  async toggleEnabled(enabled: boolean): Promise<void> {
    this.settings.enabled = enabled;
    await this.saveSettings();
  }

  /**
   * Toggle category
   */
  async toggleCategory(category: NotificationCategory, enabled: boolean): Promise<void> {
    this.settings.categories[category] = enabled;
    await this.saveSettings();
  }

  /**
   * Set quiet hours
   */
  async setQuietHours(enabled: boolean, startHour?: number, endHour?: number): Promise<void> {
    this.settings.quietHours.enabled = enabled;
    if (startHour !== undefined) this.settings.quietHours.startHour = startHour;
    if (endHour !== undefined) this.settings.quietHours.endHour = endHour;
    await this.saveSettings();
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  // Convenience methods for sending specific notification types

  /**
   * Send transaction sent notification
   */
  async notifyTransactionSent(amount: string, symbol: string, toAddress: string): Promise<void> {
    await this.sendLocalNotification({
      type: NotificationType.TRANSACTION_SENT,
      category: NotificationCategory.TRANSACTION,
      title: 'Transaction Sent',
      body: `You sent ${amount} ${symbol} to ${toAddress.slice(0, 8)}...${toAddress.slice(-6)}`,
      data: { amount, symbol, toAddress },
    });
  }

  /**
   * Send transaction received notification
   */
  async notifyTransactionReceived(
    amount: string,
    symbol: string,
    fromAddress: string
  ): Promise<void> {
    await this.sendLocalNotification({
      type: NotificationType.TRANSACTION_RECEIVED,
      category: NotificationCategory.TRANSACTION,
      title: 'Transaction Received',
      body: `You received ${amount} ${symbol} from ${fromAddress.slice(0, 8)}...${fromAddress.slice(-6)}`,
      data: { amount, symbol, fromAddress },
    });
  }

  /**
   * Send transaction confirmed notification
   */
  async notifyTransactionConfirmed(txHash: string): Promise<void> {
    await this.sendLocalNotification({
      type: NotificationType.TRANSACTION_CONFIRMED,
      category: NotificationCategory.TRANSACTION,
      title: 'Transaction Confirmed',
      body: 'Your transaction has been confirmed on the blockchain',
      data: { txHash },
    });
  }

  /**
   * Send transaction failed notification
   */
  async notifyTransactionFailed(txHash: string, reason?: string): Promise<void> {
    await this.sendLocalNotification({
      type: NotificationType.TRANSACTION_FAILED,
      category: NotificationCategory.TRANSACTION,
      title: 'Transaction Failed',
      body: reason || 'Your transaction has failed',
      data: { txHash, reason },
    });
  }

  /**
   * Send price threshold alert
   */
  async notifyPriceThreshold(
    symbol: string,
    price: string,
    direction: 'above' | 'below'
  ): Promise<void> {
    await this.sendLocalNotification({
      type: NotificationType.PRICE_THRESHOLD,
      category: NotificationCategory.PRICE_ALERT,
      title: 'Price Alert',
      body: `${symbol} is now ${direction} $${price}`,
      data: { symbol, price, direction },
    });
  }

  /**
   * Send security alert
   */
  async notifySecurityAlert(message: string, severity: 'low' | 'medium' | 'high'): Promise<void> {
    await this.sendLocalNotification({
      type: NotificationType.SUSPICIOUS_ACTIVITY,
      category: NotificationCategory.SECURITY,
      title: 'Security Alert',
      body: message,
      data: { severity },
    });
  }

  /**
   * Send large transaction warning
   */
  async notifyLargeTransaction(amount: string, symbol: string): Promise<void> {
    await this.sendLocalNotification({
      type: NotificationType.LARGE_TRANSACTION,
      category: NotificationCategory.SECURITY,
      title: 'Large Transaction Detected',
      body: `A large transaction of ${amount} ${symbol} was initiated`,
      data: { amount, symbol },
    });
  }
}

// Singleton instance
let instance: PushNotificationService | null = null;

export const getPushNotificationService = (): PushNotificationService => {
  if (!instance) {
    instance = new PushNotificationService();
  }
  return instance;
};

export default PushNotificationService;
