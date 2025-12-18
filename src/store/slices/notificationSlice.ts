/**
 * Notification Redux Slice
 * State management for push notifications
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  NotificationCategory,
  NotificationType,
  NotificationSettings,
  NotificationHistoryItem,
} from '../../services/notification/PushNotificationService';

// State interface
export interface NotificationState {
  settings: NotificationSettings;
  history: NotificationHistoryItem[];
  unreadCount: number;
  pushToken: string | null;
  permissionGranted: boolean;
}

// Initial state
const initialState: NotificationState = {
  settings: {
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
  },
  history: [],
  unreadCount: 0,
  pushToken: null,
  permissionGranted: false,
};

// Slice
const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // Set push token
    setPushToken: (state, action: PayloadAction<string | null>) => {
      state.pushToken = action.payload;
    },

    // Set permission granted
    setPermissionGranted: (state, action: PayloadAction<boolean>) => {
      state.permissionGranted = action.payload;
    },

    // Toggle notifications enabled
    toggleEnabled: (state, action: PayloadAction<boolean>) => {
      state.settings.enabled = action.payload;
    },

    // Toggle category
    toggleCategory: (
      state,
      action: PayloadAction<{ category: NotificationCategory; enabled: boolean }>
    ) => {
      state.settings.categories[action.payload.category] = action.payload.enabled;
    },

    // Update quiet hours
    updateQuietHours: (
      state,
      action: PayloadAction<{ enabled: boolean; startHour?: number; endHour?: number }>
    ) => {
      state.settings.quietHours.enabled = action.payload.enabled;
      if (action.payload.startHour !== undefined) {
        state.settings.quietHours.startHour = action.payload.startHour;
      }
      if (action.payload.endHour !== undefined) {
        state.settings.quietHours.endHour = action.payload.endHour;
      }
    },

    // Toggle sound
    toggleSound: (state, action: PayloadAction<boolean>) => {
      state.settings.sound = action.payload;
    },

    // Toggle vibration
    toggleVibration: (state, action: PayloadAction<boolean>) => {
      state.settings.vibration = action.payload;
    },

    // Update full settings
    updateSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },

    // Add notification to history
    addNotification: (state, action: PayloadAction<NotificationHistoryItem>) => {
      // Add to beginning of array (most recent first)
      state.history.unshift(action.payload);

      // Limit history to 100 items
      if (state.history.length > 100) {
        state.history = state.history.slice(0, 100);
      }

      // Increment unread count
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },

    // Mark notification as read
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.history.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    // Mark all as read
    markAllAsRead: state => {
      state.history.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },

    // Remove notification
    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.history.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        if (!state.history[index].read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.history.splice(index, 1);
      }
    },

    // Clear all notifications
    clearHistory: state => {
      state.history = [];
      state.unreadCount = 0;
    },

    // Clear notifications by category
    clearByCategory: (state, action: PayloadAction<NotificationCategory>) => {
      const removedUnread = state.history.filter(
        n => n.category === action.payload && !n.read
      ).length;
      state.history = state.history.filter(n => n.category !== action.payload);
      state.unreadCount = Math.max(0, state.unreadCount - removedUnread);
    },
  },
});

// Export actions
export const {
  setPushToken,
  setPermissionGranted,
  toggleEnabled,
  toggleCategory,
  updateQuietHours,
  toggleSound,
  toggleVibration,
  updateSettings,
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearHistory,
  clearByCategory,
} = notificationSlice.actions;

// Selectors
export const selectNotificationSettings = (state: { notification: NotificationState }) =>
  state.notification.settings;

export const selectNotificationHistory = (state: { notification: NotificationState }) =>
  state.notification.history;

export const selectUnreadCount = (state: { notification: NotificationState }) =>
  state.notification.unreadCount;

export const selectPushToken = (state: { notification: NotificationState }) =>
  state.notification.pushToken;

export const selectPermissionGranted = (state: { notification: NotificationState }) =>
  state.notification.permissionGranted;

export const selectNotificationsEnabled = (state: { notification: NotificationState }) =>
  state.notification.settings.enabled;

export const selectCategoryEnabled =
  (category: NotificationCategory) => (state: { notification: NotificationState }) =>
    state.notification.settings.categories[category];

export const selectUnreadByCategory =
  (category: NotificationCategory) => (state: { notification: NotificationState }) =>
    state.notification.history.filter(n => n.category === category && !n.read).length;

export const selectRecentNotifications =
  (limit: number = 10) =>
  (state: { notification: NotificationState }) =>
    state.notification.history.slice(0, limit);

export default notificationSlice.reducer;
