// Use real Node.js crypto for testing
const { webcrypto } = require('crypto');

global.crypto = webcrypto;

// Mock TextEncoder and TextDecoder if not available
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(str) {
      return new Uint8Array(Buffer.from(str, 'utf-8'));
    }
  };
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(arr) {
      return Buffer.from(arr).toString('utf-8');
    }
  };
}

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  },
}));

// Mock Appearance
jest.mock('react-native/Libraries/Utilities/Appearance', () => ({
  getColorScheme: jest.fn(() => 'light'),
  addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock expo-haptics
jest.mock(
  'expo-haptics',
  () => ({
    impactAsync: jest.fn(),
    notificationAsync: jest.fn(),
    selectionAsync: jest.fn(),
    ImpactFeedbackStyle: {
      Light: 'light',
      Medium: 'medium',
      Heavy: 'heavy',
    },
    NotificationFeedbackType: {
      Success: 'success',
      Warning: 'warning',
      Error: 'error',
    },
  }),
  { virtual: true }
);

// Mock expo-device
jest.mock(
  'expo-device',
  () => ({
    isDevice: true,
    brand: 'TestBrand',
    modelName: 'TestModel',
    osName: 'iOS',
    osVersion: '16.0',
    DeviceType: {
      UNKNOWN: 0,
      PHONE: 1,
      TABLET: 2,
      DESKTOP: 3,
      TV: 4,
    },
    deviceType: 1,
  }),
  { virtual: true }
);

// Mock expo-notifications
jest.mock(
  'expo-notifications',
  () => ({
    setNotificationHandler: jest.fn(),
    addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    removeNotificationSubscription: jest.fn(),
    getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[xxx]' })),
    getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    scheduleNotificationAsync: jest.fn(() => Promise.resolve('notif-id')),
    cancelScheduledNotificationAsync: jest.fn(),
    cancelAllScheduledNotificationsAsync: jest.fn(),
    getBadgeCountAsync: jest.fn(() => Promise.resolve(0)),
    setBadgeCountAsync: jest.fn(),
    setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
    AndroidImportance: {
      UNKNOWN: 0,
      UNSPECIFIED: 1,
      NONE: 2,
      MIN: 3,
      LOW: 4,
      DEFAULT: 5,
      HIGH: 6,
      MAX: 7,
    },
  }),
  { virtual: true }
);

// Mock expo-clipboard
jest.mock(
  'expo-clipboard',
  () => ({
    setStringAsync: jest.fn(() => Promise.resolve()),
    getStringAsync: jest.fn(() => Promise.resolve('')),
    hasStringAsync: jest.fn(() => Promise.resolve(false)),
  }),
  { virtual: true }
);

// Mock react-native-webview
jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    WebView: jest.fn().mockImplementation(props => {
      return React.createElement(View, { testID: 'webview-mock', ...props });
    }),
  };
});

// Mock expo-camera
jest.mock('expo-camera', () => ({
  CameraView: jest.fn().mockImplementation(props => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'camera-mock', ...props });
  }),
  useCameraPermissions: jest.fn(() => [
    { granted: true, canAskAgain: true },
    jest.fn(() => Promise.resolve({ granted: true })),
  ]),
}));

// Mock @sentry/react-native
jest.mock(
  '@sentry/react-native',
  () => ({
    init: jest.fn(),
    wrap: jest.fn(component => component),
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    setUser: jest.fn(),
    setTag: jest.fn(),
    setTags: jest.fn(),
    setExtra: jest.fn(),
    setExtras: jest.fn(),
    setContext: jest.fn(),
    addBreadcrumb: jest.fn(),
    withScope: jest.fn(callback => callback({ setLevel: jest.fn(), setExtra: jest.fn() })),
    Severity: {
      Fatal: 'fatal',
      Error: 'error',
      Warning: 'warning',
      Info: 'info',
      Debug: 'debug',
    },
    ReactNavigationInstrumentation: jest.fn().mockImplementation(() => ({
      registerNavigationContainer: jest.fn(),
    })),
  }),
  { virtual: true }
);
