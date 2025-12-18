# Deyond Development Guide

개발자를 위한 설정, 아키텍처, 테스트 가이드입니다.

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Installation](#installation)
4. [Development](#development)
5. [Testing](#testing)
6. [Build and Clean](#build-and-clean)
7. [Usage Examples](#usage-examples)
8. [Contributing](#contributing)

---

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript (strict mode)
- **State Management**: Redux Toolkit with Redux Persist
- **Crypto Libraries**:
  - `ethers.js` - Ethereum interactions
  - `@noble/curves` - Elliptic curve cryptography
  - `@noble/hashes` - Cryptographic hashing
  - `bip39` - Mnemonic generation and validation
- **UI/UX**:
  - `expo-camera` - QR code scanning
  - `react-native-qrcode-svg` - QR code generation
  - `expo-local-authentication` - Biometric authentication (Face ID/Touch ID)
- **Testing**: Jest with React Native Testing Library, Detox for E2E
- **Development**: TDD (Test-Driven Development) approach

---

## Project Structure

```
deyond/
├── src/                        # Source code
│   ├── core/                   # Core business logic
│   │   ├── wallet/            # Wallet management
│   │   ├── crypto/            # Cryptography utilities
│   │   ├── transaction/       # Transaction handling
│   │   ├── ble/               # BLE session management
│   │   └── chat/              # P2P chat functionality
│   ├── crypto/                # DeyondCrypt Protocol
│   │   └── deyondcrypt/       # Signal Protocol implementation
│   │       ├── core/          # DoubleRatchet, KeyExchange, SessionManager
│   │       ├── primitives/    # EVMCrypto, SolanaCrypto (secp256k1, ed25519)
│   │       ├── keys/          # KeyDerivation, PreKeyBundle, KeyStore
│   │       ├── messages/      # MessageEncoder/Decoder, Envelope
│   │       └── group/         # GroupKeyManager, SenderKeys
│   ├── transport/             # P2P Transport Layer (libp2p-style)
│   │   ├── ble/              # BLE Transport (proximity P2P)
│   │   ├── webrtc/           # WebRTC Transport (real-time)
│   │   ├── tcp/              # TCP Transport (LAN)
│   │   └── relay/            # Relay Transport (store-and-forward)
│   ├── store/                 # Redux state management
│   │   ├── index.ts
│   │   └── slices/
│   ├── screens/               # UI screens
│   ├── components/            # Reusable components
│   │   ├── atoms/            # Basic UI components
│   │   ├── molecules/        # Composite components
│   │   └── organisms/        # Complex components
│   ├── services/              # Business services
│   │   ├── error/            # Error reporting and tracking
│   │   ├── analytics/        # Analytics and event tracking
│   │   ├── security/         # Security auditing and validation
│   │   ├── monitoring/       # Error monitoring (Sentry)
│   │   ├── blockchain/       # Blockchain services
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

---

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

---

## Development

### Development Server

```bash
# Start Expo development server
npm start

# Start with cache cleared
npm start -- --clear
```

### Code Style

- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Husky for pre-commit hooks

### Commit Message Format

```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
```

---

## Testing

프로젝트는 TDD 원칙을 따르며 포괄적인 테스트 커버리지를 유지합니다.

### Test Commands

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

- **2,031 tests passing** (100% success rate)
- **100+ test suites** (100% passing)
- **TypeScript Strict Mode**: Zero compilation errors
- **TDD methodology** throughout development
- **E2E test coverage** for critical user flows

### Test Coverage Areas

- Wallet management and transaction handling
- DeyondCrypt Protocol (Double Ratchet, X3DH, Sender Keys)
- P2P Transport Layer (BLE, WebRTC, TCP, Relay)
- NFT gallery and collections
- Error reporting and performance monitoring
- Security auditing and analytics tracking

---

## Build and Clean

프로젝트 크기와 빌드 아티팩트 관리를 위한 스크립트입니다.

### Clean Commands

```bash
# Clean all build artifacts (recommended weekly)
npm run clean

# Clean specific platforms
npm run clean:ios        # Clean iOS build artifacts
npm run clean:android    # Clean Android build artifacts
npm run clean:cache      # Clean coverage, .expo, dist

# Complete cleanup
npm run clean:all        # Clean everything including node_modules
npm run reinstall        # Clean all and reinstall dependencies
npm run reset            # Reset Metro bundler cache

# Check project size
du -sh .                 # Total project size
```

### Project Size

- Normal: ~5-6GB (with node_modules)
- After builds: ~13GB (with build artifacts)
- After `npm run clean`: ~5GB (7-8GB saved)

See [Build and Clean Guide](./BUILD_AND_CLEAN_GUIDE.md) for detailed information.

---

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

### Using DeyondCrypt Protocol

```typescript
import { DeyondCryptEngine } from './src/crypto/deyondcrypt';
import { EVMCrypto } from './src/crypto/deyondcrypt/primitives';

// Initialize engine with wallet-derived identity
const crypto = new EVMCrypto();
const engine = new DeyondCryptEngine(crypto, walletPrivateKey);

// Generate PreKey bundle for others to contact you
const preKeyBundle = await engine.generatePreKeyBundle();

// Establish session with remote peer using their PreKey bundle
await engine.establishSession(remotePeerId, remotePreKeyBundle);

// Send encrypted message
const encrypted = await engine.encryptMessage(remotePeerId, 'Hello, secure world!');

// Decrypt received message
const decrypted = await engine.decryptMessage(senderPeerId, encryptedMessage);
```

### Using P2P Transport Layer

```typescript
import {
  DefaultTransportManager,
  BLETransport,
  WebRTCTransport,
  TCPTransport,
  Multiaddr,
} from './src/transport';

// Create transport manager
const manager = new DefaultTransportManager({
  peerId: { id: walletAddress },
  transports: [],
  enableDiscovery: true,
  reconnection: { enabled: true, maxAttempts: 5, baseDelay: 1000, maxDelay: 30000 },
});

// Register multiple transports
manager.registerTransport(new BLETransport({ enabled: true }));
manager.registerTransport(new WebRTCTransport({ enabled: true }));
manager.registerTransport(new TCPTransport({ enabled: true, enableMdns: true }));

await manager.init();
await manager.start();

// Listen for discovered peers
manager.on('peer:discovered', peer => {
  console.log(`Found peer: ${peer.peer.id}`);
});

// Connect and send message
const connection = await manager.connect(peerId);
await manager.send(peerId, 'deyondcrypt/v1', messageBytes);
```

### Using the Gas Tracker

```typescript
import { GasService } from './src/services/GasService';

const gasService = new GasService();

// Get current gas prices
const gasPrices = await gasService.getGasPrices();

console.log('Slow:', gasPrices.slow.maxFeePerGas, 'Gwei');
console.log('Standard:', gasPrices.standard.maxFeePerGas, 'Gwei');
console.log('Fast:', gasPrices.fast.maxFeePerGas, 'Gwei');
```

### Managing Address Book

```typescript
import { useAppDispatch } from './src/store/hooks';
import { addContact } from './src/store/slices/addressBookSlice';

const dispatch = useAppDispatch();

// Add a contact
dispatch(
  addContact({
    name: 'Alice',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    label: 'Friend',
  })
);
```

### Using Biometric Authentication

```typescript
import SecurityService from './src/services/SecurityService';

const securityService = new SecurityService();

// Check if biometrics is available
const available = await securityService.isBiometricsAvailable();

// Get biometric type
const type = await securityService.getBiometricsType(); // 'face', 'fingerprint', or 'iris'

// Authenticate with biometrics
const result = await securityService.authenticateWithBiometrics();
if (result.success) {
  console.log('Authentication successful!');
}
```

### Browsing NFT Collections

```typescript
import { NFTService } from './src/services/NFTService';

const nftService = new NFTService(alchemyApiKey);

// Get NFTs for a wallet
const nfts = await nftService.getNFTs(walletAddress, chainId);

console.log(`Found ${nfts.length} NFTs`);

// Get NFT details
nfts.forEach(nft => {
  console.log('NFT:', nft.name);
  console.log('Collection:', nft.collectionName);
  console.log('Token Standard:', nft.tokenType); // ERC721 or ERC1155
  console.log('Image:', nft.imageUrl);
  console.log('Attributes:', nft.attributes);
});
```

### Error Reporting and Monitoring

```typescript
import { getErrorReporter } from './src/services/error/ErrorReporter';
import { ErrorSeverity, ErrorCategory } from './src/types/error';

const errorReporter = getErrorReporter();

// Report an error with context
errorReporter.report(
  new Error('Transaction failed'),
  ErrorSeverity.HIGH,
  ErrorCategory.BLOCKCHAIN,
  { txHash: '0x123...', amount: '1.5 ETH' }
);

// Capture exception with auto-categorization
errorReporter.captureException(error, {
  screen: 'SendScreen',
  action: 'submitTransaction',
});

// Get error reports
const reports = errorReporter.getReports();
console.log(`Total errors: ${reports.length}`);
```

### Performance Monitoring

```typescript
import { usePerformanceMonitor } from './src/hooks/usePerformanceMonitor';

function MyScreen() {
  // Monitor screen render performance
  usePerformanceMonitor('MyScreen');

  // Slow renders (>500ms) are automatically reported
  return <View>...</View>;
}
```

### Security Auditing

```typescript
import { getSecurityAuditor } from './src/services/security/SecurityAuditor';

const auditor = getSecurityAuditor();

// Validate password strength
const { isValid, issues } = auditor.validatePasswordStrength('MyPassword123!');
if (!isValid) {
  console.log('Password issues:', issues);
}

// Validate Ethereum address
const isValidAddress = auditor.validateAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

// Check transaction security
const { isSafe, warnings } = auditor.checkTransactionSecurity({
  to: '0x123...',
  value: '10000000000000000000', // 10 ETH
});

// Validate DApp domain
const { isTrusted, warnings } = auditor.validateDAppDomain('https://example.com');
```

---

## Contributing

이 프로젝트는 TDD 원칙과 클린 코드 표준을 따릅니다.

### Contribution Guidelines

1. Write tests first (TDD)
2. Implement functionality
3. Ensure all tests pass
4. Follow TypeScript strict mode
5. Update documentation
6. Follow commit message format: `type(scope): description`

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Related Documentation

- [Architecture Design](./ARCHITECTURE.md)
- [Feature List](./FEATURE_LIST.md)
- [DeyondCrypt Protocol](./DEYOND_CRYPT_PROTOCOL.md)
- [P2P Transport Architecture](./P2P_TRANSPORT_ARCHITECTURE.md)
- [Testing Strategy](./TESTING_STRATEGY.md)
- [Security Considerations](./SECURITY.md)
- [Build and Clean Guide](./BUILD_AND_CLEAN_GUIDE.md)
