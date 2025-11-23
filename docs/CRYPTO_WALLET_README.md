# Crypto Wallet App

A feature-rich cryptocurrency wallet application built with React Native, similar to MetaMask, with an innovative BLE-based P2P chat feature.

## Features

### Core Wallet Features (MetaMask Clone)

- **Multi-Chain Support**: Ethereum, Polygon, BSC, and more
- **Account Management**: Create, import, and manage multiple accounts
- **Transaction Management**: Send, receive, and track transactions
- **Token Support**: ERC-20, ERC-721, ERC-1155 tokens
- **Security**: AES-256-GCM encryption, PBKDF2 key derivation, secure storage
- **HD Wallet**: BIP39/BIP44 compliant hierarchical deterministic wallets
- **Gas Management**: Automatic gas estimation and optimization

### Unique Feature: BLE P2P Chat

- **Bluetooth Low Energy**: Direct device-to-device communication
- **Session Protocol**: Secure ECDH key exchange for session establishment
- **End-to-End Encryption**: All messages encrypted with session-specific keys
- **No Internet Required**: Works offline using BLE
- **Address-Based**: Chat with wallet addresses directly

## Architecture

### Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript (strict mode)
- **State Management**: Redux Toolkit with Redux Persist
- **Crypto Libraries**:
  - `ethers.js` - Ethereum interactions
  - `@noble/curves` - Elliptic curve cryptography
  - `@noble/hashes` - Cryptographic hashing
  - `bip39` - Mnemonic generation and validation
- **Testing**: Jest with React Native Testing Library
- **Development**: TDD (Test-Driven Development) approach

### Project Structure

```
src/
├── core/                    # Core business logic
│   ├── wallet/             # Wallet management
│   │   └── WalletManager.ts
│   ├── crypto/             # Cryptography utilities
│   │   └── CryptoUtils.ts
│   ├── transaction/        # Transaction handling
│   │   └── TransactionManager.ts
│   ├── ble/                # BLE session management
│   │   └── BLESessionManager.ts
│   └── chat/               # P2P chat functionality
│       └── ChatManager.ts
├── store/                  # Redux state management
│   ├── index.ts
│   └── slices/
│       ├── walletSlice.ts
│       ├── transactionSlice.ts
│       ├── chatSlice.ts
│       └── networkSlice.ts
├── screens/                # UI screens
├── components/             # Reusable components
├── types/                  # TypeScript type definitions
│   ├── wallet.ts
│   └── ble.ts
└── __tests__/             # Test files
    └── core/
```

## Security Architecture

### Multi-Layer Encryption

1. **Transport Security**: BLE encryption + ECDH key exchange
2. **Data Security**: AES-256-GCM encryption for sensitive data
3. **Key Derivation**: PBKDF2 with 100,000 iterations
4. **Secure Storage**: React Native Keychain for key storage
5. **Cryptographic Security**: secp256k1 for signing and ECDH

### BLE Session Protocol

The app implements a secure session establishment protocol:

1. **Session Initiation**: Generate ephemeral key pair
2. **Handshake Request**: Send signed public key + wallet address
3. **Handshake Response**: Verify signature, exchange keys
4. **Shared Secret Derivation**: ECDH key agreement
5. **Session Established**: Encrypt all messages with shared secret

## Installation

### Prerequisites

- Node.js 20+
- npm or yarn
- Expo CLI
- iOS Simulator (macOS) or Android Emulator

### Setup

```bash
# Clone repository
git clone <repository-url>
cd crypto-wallet-app

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Testing

The project follows TDD principles with comprehensive test coverage.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage

- ✅ Crypto utilities (encryption, decryption, hashing)
- ✅ Wallet management (create, import, derive accounts)
- ✅ BLE session protocol (handshake, key exchange)
- ✅ Chat manager (send, receive, encrypt messages)
- ✅ Transaction management (create, sign, send)

## Usage

### Creating a Wallet

```typescript
import { WalletManager } from './src/core/wallet/WalletManager';

const walletManager = new WalletManager();
const wallet = await walletManager.createWallet('secure-password');

console.log('Address:', wallet.address);
console.log('Mnemonic:', wallet.mnemonic);
```

### Sending a Transaction

```typescript
import { TransactionManager } from './src/core/transaction/TransactionManager';

const txManager = new TransactionManager(network);
const transaction = await txManager.createTransaction(
  fromAddress,
  toAddress,
  '0.1', // Amount in ETH
);

const response = await txManager.sendTransaction(privateKey, transaction);
console.log('Transaction hash:', response.hash);
```

### Starting a BLE Chat Session

```typescript
import { BLESessionManager } from './src/core/ble/BLESessionManager';
import { ChatManager } from './src/core/chat/ChatManager';

const sessionManager = new BLESessionManager(walletAddress, privateKey);
const chatManager = new ChatManager(sessionManager);

// Initiate session
const session = await sessionManager.initiateSession(
  deviceId,
  deviceAddress,
  deviceName
);

// Create handshake
const handshake = await sessionManager.createHandshakeRequest(session.id);

// After receiving peer handshake response
await sessionManager.processHandshakeResponse(session.id, peerHandshake);

// Send encrypted message
await chatManager.sendMessage(
  session.id,
  fromAddress,
  toAddress,
  'Hello via BLE!'
);
```

## Development Roadmap

### Phase 1: Core Features ✅
- [x] Wallet creation and management
- [x] Encryption and security
- [x] BLE session protocol
- [x] P2P chat functionality
- [x] Redux state management
- [x] Transaction management

### Phase 2: UI/UX ✅
- [x] Wallet screens (Home, Send, Receive)
- [x] Transaction screens (Preview, Status, History)
- [x] Chat interface (Home, Discovery, Conversation)
- [x] Settings and configuration
- [x] Biometric authentication
- [x] Error handling (ErrorBoundary, Toast)
- [x] Network status indicators

### Phase 3: Advanced Features ✅
- [x] Token management (ERC-20)
- [x] Gas estimation (EIP-1559)
- [x] Multi-network support (Ethereum, Polygon, Arbitrum, Optimism)
- [x] Security service (PIN, biometrics, lockout)
- [x] App navigation with React Navigation

### Phase 4: Final Polish ✅
- [x] App configuration (app.json)
- [x] Module exports (components, screens, services)
- [x] Type definitions
- [x] Constants and config files
- [x] Comprehensive test coverage

## Test Statistics

- **926 tests passing**
- **54 test suites**
- **TDD methodology** throughout development

### Test Categories

| Category | Tests |
|----------|-------|
| Components | 200+ |
| Screens | 300+ |
| Services | 200+ |
| Navigation | 9 |
| Core/Utils | 200+ |

## Contributing

This project follows TDD principles. When contributing:

1. Write tests first
2. Implement functionality
3. Ensure all tests pass
4. Update documentation

## License

MIT License

## Acknowledgments

- Inspired by MetaMask Mobile architecture
- Built with React Native and Expo
- Uses industry-standard cryptographic libraries

## Support

For issues and questions, please open a GitHub issue.

---

**Note**: This is a demonstration project. Do not use with real funds without proper security audits.
