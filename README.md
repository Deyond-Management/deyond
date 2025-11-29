# Deyond - Crypto Wallet App

A feature-rich cryptocurrency wallet application built with React Native, similar to MetaMask, with an innovative BLE-based P2P chat feature.

## Features

### Core Wallet Features (MetaMask Clone)

- **Multi-Chain Support**: Ethereum, Polygon, BSC, Arbitrum, Optimism, and more
- **Account Management**: Create, import, and manage multiple accounts
- **Transaction Management**: Send, receive, and track transactions with EIP-1559 support
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

### Production Features

- **E2E Testing**: Comprehensive Detox test suite
- **CI/CD Pipeline**: GitHub Actions workflows for testing and deployment
- **Internationalization**: Multi-language support (English, Korean)
- **Error Monitoring**: Integrated error tracking and analytics
- **Feature Flags**: Gradual rollout capabilities
- **Performance Monitoring**: Real-time performance analytics
- **Security Services**: Contract validation, privacy compliance, hardware wallet support

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
- **Testing**: Jest with React Native Testing Library, Detox for E2E
- **Development**: TDD (Test-Driven Development) approach

### Project Structure

```
deyond/
├── src/                        # Source code
│   ├── core/                   # Core business logic
│   │   ├── wallet/            # Wallet management
│   │   ├── crypto/            # Cryptography utilities
│   │   ├── transaction/       # Transaction handling
│   │   ├── ble/               # BLE session management
│   │   └── chat/              # P2P chat functionality
│   ├── store/                 # Redux state management
│   │   ├── index.ts
│   │   └── slices/
│   ├── screens/               # UI screens
│   ├── components/            # Reusable components
│   │   ├── atoms/            # Basic UI components
│   │   ├── molecules/        # Composite components
│   │   └── organisms/        # Complex components
│   ├── services/              # Business services
│   │   └── base/             # Base classes
│   ├── hooks/                 # Custom React hooks
│   ├── navigation/            # Navigation configuration
│   ├── i18n/                  # Internationalization
│   ├── config/                # App configuration
│   ├── utils/                 # Utility functions
│   └── types/                 # TypeScript definitions
├── e2e/                       # End-to-end tests
├── docs/                      # Documentation
│   ├── legal/                # Legal documents
│   ├── qa/                   # QA documentation
│   └── security/             # Security documentation
├── scripts/                   # Build and utility scripts
├── .github/                   # GitHub Actions workflows
└── assets/                    # Static assets
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
git clone https://github.com/Deyond-Management/deyond.git
cd deyond

# Install dependencies
npm install --legacy-peer-deps

# Copy environment variables
cp .env.example .env

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

# Run E2E tests
npm run test:e2e
```

### Test Statistics

- **1,472 tests passing**
- **86 test suites**
- **80%+ code coverage** (Lines: 80.49%, Statements: 79.77%, Functions: 75.47%)
- **TDD methodology** throughout development
- **E2E test coverage** for critical user flows
- **Comprehensive unit and integration tests** for all core features

## Usage Examples

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
  '0.1' // Amount in ETH
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
const session = await sessionManager.initiateSession(deviceId, deviceAddress, deviceName);

// Send encrypted message
await chatManager.sendMessage(session.id, fromAddress, toAddress, 'Hello via BLE!');
```

## Development Status

### ✅ Phase 1: Core Features

- Wallet creation and management
- Encryption and security
- BLE session protocol
- P2P chat functionality
- Redux state management
- Transaction management

### ✅ Phase 2: UI/UX

- Complete onboarding flow
- Wallet screens (Home, Send, Receive)
- Transaction screens (Preview, Status, History)
- Chat interface (Home, Discovery, Conversation)
- Settings and configuration
- Biometric authentication
- Error handling and user feedback

### ✅ Phase 3: Production Infrastructure

- E2E testing with Detox
- CI/CD pipeline
- Internationalization (i18n)
- Performance monitoring
- Error tracking
- Feature flags
- Security enhancements

### ✅ Phase 4: Advanced Features

- Token management (ERC-20)
- Gas estimation (EIP-1559)
- Multi-network support
- Security services
- Deep linking
- Push notifications
- Backend sync

## Documentation

Comprehensive documentation is available in the `/docs` folder:

- **Architecture**: System design and technical architecture
- **PRD**: Product requirements and specifications
- **Feature List**: Complete list of implemented features
- **Implementation Plan**: Development roadmap and timeline
- **Testing Strategy**: Testing approaches and guidelines
- **Security**: Security architecture and best practices
- **Legal**: Privacy policy and terms of service
- **QA**: Testing guides and device matrix

## Contributing

This project follows TDD principles and clean code standards. When contributing:

1. Write tests first
2. Implement functionality
3. Ensure all tests pass
4. Follow TypeScript strict mode
5. Update documentation
6. Follow commit message format: `type(scope): description`

## License

GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by MetaMask Mobile architecture
- Built with React Native and Expo
- Uses industry-standard cryptographic libraries

## Support

For issues and questions, please open a GitHub issue at:
https://github.com/Deyond-Management/deyond/issues

---

**Security Note**: This is a demonstration project. Do not use with real funds without proper security audits and additional hardening.
