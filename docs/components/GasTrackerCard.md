# GasTrackerCard Component

## Overview

A reusable React Native component for displaying real-time gas prices with automatic refresh and optional speed selection.

## Location

`src/components/GasTrackerCard.tsx`

## Features

- **Real-time Updates**: Automatically fetches gas prices every 15 seconds
- **Two Display Modes**: Display-only or interactive selector mode
- **Three Speed Options**: Slow, Standard, Fast gas prices
- **Time Estimates**: Shows estimated confirmation time for each speed
- **Error Handling**: Displays error states with retry functionality
- **Loading States**: Shows loading indicator during fetches
- **Localized**: Supports English and Korean

## Props

```typescript
interface GasTrackerCardProps {
  onSelectGasPrice?: (speed: 'slow' | 'standard' | 'fast', preset: GasPreset) => void;
  selectedSpeed?: 'slow' | 'standard' | 'fast';
  showSelector?: boolean;
}
```

### `onSelectGasPrice` (optional)

Callback function triggered when user selects a gas speed option.

- **Type**: `(speed: 'slow' | 'standard' | 'fast', preset: GasPreset) => void`
- **Parameters**:
  - `speed`: Selected gas speed ('slow', 'standard', or 'fast')
  - `preset`: Complete gas preset object with pricing details

### `selectedSpeed` (optional)

The currently selected gas speed option.

- **Type**: `'slow' | 'standard' | 'fast'`
- **Default**: `'standard'`

### `showSelector` (optional)

Whether to show the component in selector mode (interactive) or display-only mode.

- **Type**: `boolean`
- **Default**: `false`

## Usage Examples

### Display-Only Mode

```typescript
import { GasTrackerCard } from '../components/GasTrackerCard';

export const HomeScreen = () => {
  return (
    <View>
      <GasTrackerCard />
    </View>
  );
};
```

### Selector Mode (for Transaction Screens)

```typescript
import { GasTrackerCard } from '../components/GasTrackerCard';
import type { GasPreset } from '../services/GasService';

export const SendScreen = () => {
  const [selectedGasSpeed, setSelectedGasSpeed] = useState<'slow' | 'standard' | 'fast'>('standard');
  const [selectedGasPreset, setSelectedGasPreset] = useState<GasPreset | null>(null);

  const handleSelectGasPrice = useCallback(
    (speed: 'slow' | 'standard' | 'fast', preset: GasPreset) => {
      setSelectedGasSpeed(speed);
      setSelectedGasPreset(preset);
    },
    []
  );

  // Calculate network fee based on selected gas preset
  const networkFee = useMemo(() => {
    if (!selectedGasPreset) return '0.0021';
    const gasLimit = 21000;
    const feeInEth = (selectedGasPreset.maxFeePerGas * gasLimit) / 1e9;
    return feeInEth.toFixed(6);
  }, [selectedGasPreset]);

  return (
    <View>
      <GasTrackerCard
        onSelectGasPrice={handleSelectGasPrice}
        selectedSpeed={selectedGasSpeed}
        showSelector={true}
      />
      <Text>Network Fee: {networkFee} ETH</Text>
    </View>
  );
};
```

## Gas Preset Interface

```typescript
interface GasPreset {
  maxFeePerGas: number; // in Gwei
  maxPriorityFeePerGas: number; // in Gwei
  estimatedTime: number; // in seconds
}
```

## State Management

The component internally manages:

- Gas prices fetching and caching
- Auto-refresh timer (15 seconds)
- Loading and error states
- Manual refresh capability

## Styling

The component uses theme colors from `ThemeContext`:

- Primary color for selected items
- Surface color for card background
- Text colors for primary and secondary text
- Success/warning/error colors for speed indicators

## Performance

- Uses `useCallback` for event handlers to prevent unnecessary re-renders
- Uses `useMemo` for gas price calculations
- Automatically cleans up interval timer on unmount
- Debounces refresh requests to prevent API spam

## Error Handling

- Displays user-friendly error messages
- Provides manual retry button on errors
- Falls back to cached prices if refresh fails
- Logs errors to console for debugging

## Accessibility

- Uses `testID` props for testing: `gas-tracker-card`
- Provides clear visual feedback for selected items
- Touch targets are properly sized (48x48dp minimum)

## Dependencies

- `GasService` from `src/services/GasService`
- `ThemeContext` for styling
- `i18n` for localization

## Localization Keys

```typescript
gasTracker: {
  title: 'Gas Tracker',
  currentPrices: 'Current Gas Prices',
  slow: 'Slow',
  standard: 'Standard',
  fast: 'Fast',
  gwei: 'Gwei',
  seconds: '{count}s',
  minutes: '{count}m',
  estimatedTime: 'Est. {time}',
  refresh: 'Refresh',
  error: 'Failed to load gas prices',
  retry: 'Retry',
}
```

## Testing

See `src/__tests__/components/GasTrackerCard.test.tsx` for comprehensive test coverage including:

- Display mode rendering
- Selector mode interaction
- Gas price selection
- Auto-refresh functionality
- Error handling
- Loading states
