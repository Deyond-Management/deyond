# Demo Mode Guide

## Overview

Demo Mode allows you to test the UI and user experience without requiring a backend server or blockchain connection. This is perfect for:

- UI/UX testing and development
- Demonstrations and presentations
- Testing without API keys or network access

## Enabling Demo Mode

### Option 1: Environment Variable (Recommended)

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and set:

   ```
   EXPO_PUBLIC_DEMO_MODE=true
   ```

3. Restart the development server:
   ```bash
   npm start
   ```

### Option 2: Direct Edit

The app automatically enables demo mode in development (`__DEV__` is true).

## What's Included in Demo Mode

When demo mode is enabled, the app uses mock data for:

### 1. **Wallet Balances**

- Mock ETH, USDC, USDT, and MATIC balances
- Realistic USD values and price changes
- Located in: `src/mocks/mockData.ts`

### 2. **Transaction History**

- Sample send, receive, and pending transactions
- Realistic timestamps and gas fees
- Multiple transaction states (completed, pending, failed)

### 3. **Gas Prices**

- Mock slow, standard, and fast gas prices
- Estimated confirmation times
- Base fee simulation

### 4. **NFT Collection**

- Sample NFTs with placeholder images
- Mock metadata and collection info

### 5. **Contacts**

- Pre-populated contact list
- Sample ENS names and avatars

### 6. **Price Data**

- Mock cryptocurrency prices
- 24-hour price changes
- Market cap data

## Customizing Mock Data

You can customize the mock data by editing `/Users/kevin/work/github/onlyhyde/deyond/src/mocks/mockData.ts`:

```typescript
// Example: Change mock ETH balance
export const MOCK_TOKEN_BALANCES: TokenBalance[] = [
  {
    id: '1',
    symbol: 'ETH',
    name: 'Ethereum',
    balance: '10.0', // Change this value
    balanceUSD: 20000.0, // And this
    // ... rest of the properties
  },
  // ... other tokens
];
```

## Configuration

Demo mode configuration is located in `src/config/app.config.ts`:

```typescript
export const AppConfig = {
  demoMode: DEMO_MODE, // Controlled by EXPO_PUBLIC_DEMO_MODE

  features: {
    enableAnalytics: !DEMO_MODE, // Disabled in demo mode
    enableErrorMonitoring: !DEMO_MODE, // Disabled in demo mode
    // ... other features
  },
};
```

## Disabling Demo Mode

To disable demo mode and use real backend services:

1. Edit `.env.local`:

   ```
   EXPO_PUBLIC_DEMO_MODE=false
   ```

2. Add your API keys and RPC URLs:

   ```
   EXPO_PUBLIC_API_BASE_URL=https://your-api.com
   EXPO_PUBLIC_ETHEREUM_RPC_URL=https://your-rpc-url
   # ... other configuration
   ```

3. Restart the development server

## Testing

Demo mode works with all testing environments:

- Development server (Expo Go)
- iOS Simulator
- Android Emulator
- Physical devices

## Notes

- Analytics and error monitoring are automatically disabled in demo mode
- No real transactions can be made in demo mode
- All blockchain interactions use mock responses
- Demo mode is automatically enabled in `__DEV__` builds

## Troubleshooting

### Demo mode not working?

1. Ensure `.env.local` exists and has `EXPO_PUBLIC_DEMO_MODE=true`
2. Restart the development server completely
3. Clear the Metro bundler cache:
   ```bash
   npm start -- --clear
   ```

### Want to test with real data?

Set `EXPO_PUBLIC_DEMO_MODE=false` and provide real API credentials in `.env.local`.

## Development

When adding new features that require backend data:

1. Check if `AppConfig.demoMode` is true
2. Return mock data from `src/mocks/mockData.ts`
3. Add your mock data to the appropriate section

Example:

```typescript
import { AppConfig } from '../config/app.config';
import { MOCK_TOKEN_BALANCES } from '../mocks/mockData';

async function getBalances(address: string) {
  if (AppConfig.demoMode) {
    return MOCK_TOKEN_BALANCES;
  }

  // Real API call
  return await api.getBalances(address);
}
```
