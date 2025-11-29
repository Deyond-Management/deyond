# QRScanner Component

## Overview

A full-screen QR code scanner component built with `expo-camera` for scanning wallet addresses and other QR codes.

## Location

`src/components/QRScanner.tsx`

## Features

- **Camera Permission Handling**: Automatically requests camera permissions
- **Real-time Scanning**: Scans QR codes in real-time using device camera
- **Visual Feedback**: Shows scanning frame and instructions
- **Error Handling**: Gracefully handles permission denial and camera errors
- **One-time Scan**: Prevents duplicate scans with debouncing
- **Close Button**: Easy dismissal with cancel action
- **Cross-platform**: Works on both iOS and Android

## Props

```typescript
interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}
```

### `onScan` (required)

Callback function triggered when a QR code is successfully scanned.

- **Type**: `(data: string) => void`
- **Parameters**:
  - `data`: The scanned QR code data (typically a wallet address)

### `onClose` (required)

Callback function triggered when the user closes the scanner.

- **Type**: `() => void`

## Usage Example

```typescript
import { useState } from 'react';
import { View, Button, Modal } from 'react-native';
import { QRScanner } from '../components/QRScanner';

export const SendScreen = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [address, setAddress] = useState('');

  const handleScan = (data: string) => {
    setAddress(data);
    setShowScanner(false);
  };

  const handleClose = () => {
    setShowScanner(false);
  };

  return (
    <View>
      <TextInput
        value={address}
        onChangeText={setAddress}
        placeholder="Enter wallet address"
      />
      <Button title="Scan QR Code" onPress={() => setShowScanner(true)} />

      <Modal visible={showScanner} animationType="slide">
        <QRScanner onScan={handleScan} onClose={handleClose} />
      </Modal>
    </View>
  );
};
```

## Camera Permissions

The component handles camera permissions automatically:

1. Checks for existing permissions on mount
2. Requests permissions if not granted
3. Shows permission denied message if user denies access
4. Provides guidance to enable permissions in settings

## States

### Permission States

- **null**: Checking permissions
- **true**: Permission granted, camera active
- **false**: Permission denied, shows error message

### Scanning States

- **idle**: Ready to scan
- **scanning**: Currently processing a QR code
- **scanned**: QR code successfully scanned (prevents duplicate scans)

## QR Code Format

The scanner accepts any QR code format but is primarily designed for:

- Ethereum wallet addresses (0x...)
- EIP-681 payment URIs (ethereum:0x...)
- Generic text/data

## Styling

The component uses a full-screen dark overlay with:

- Semi-transparent black background
- White scanning frame (300x300)
- Centered instruction text
- Top-right close button
- Theme-aware colors from `ThemeContext`

## Performance

- Uses `expo-camera` for optimized camera access
- Debounces scan events to prevent duplicates
- Automatically stops camera when unmounted
- Minimal re-renders with proper state management

## Error Handling

### Camera Permission Denied

```
Camera permission is required to scan QR codes.
Please enable camera access in your device settings.
```

### Invalid QR Code

The component passes all scanned data to the parent component. Validation should be handled by the parent.

## Accessibility

- Clear instructions for users
- Large, visible close button
- Permission request with explanation
- Error messages are clearly displayed
- Uses `testID` prop for testing: `qr-scanner`

## Platform-Specific Behavior

### iOS

- Requests camera permission with usage description from `app.json`
- Shows native permission dialog

### Android

- Requests camera permission with system dialog
- May require manual permissions in device settings

## Dependencies

- `expo-camera` - Camera access and QR code scanning
- `expo-barcode-scanner` - QR code detection
- `ThemeContext` - Theme colors and styling

## Testing

See `src/__tests__/components/QRScanner.test.tsx` for test coverage including:

- Permission handling
- QR code scanning
- Close button functionality
- Error states
- Permission denial handling

## Configuration Required

Add to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera to scan QR codes for wallet addresses."
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "This app needs camera access to scan QR codes for wallet addresses."
      }
    },
    "android": {
      "permissions": ["CAMERA"]
    }
  }
}
```

## Security Considerations

- Always validate scanned data before using it
- Check for valid Ethereum address format
- Warn users about scanning unknown QR codes
- Never automatically execute transactions from scanned data
- Consider implementing address checksum validation

## Known Limitations

- Requires physical camera (won't work in simulator/emulator)
- Needs good lighting conditions for optimal scanning
- QR code must be clearly visible and not damaged
- Some older Android devices may have slower scan speeds
