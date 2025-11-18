# Testing Strategy - Deyond Crypto Wallet Application

## Document Information
- **Project**: Deyond
- **Version**: 1.0.0
- **Date**: 2025-11-19
- **Status**: Active
- **Owner**: Engineering Team

---

## Table of Contents
1. [Testing Overview](#1-testing-overview)
2. [Unit Testing](#2-unit-testing)
3. [Integration Testing](#3-integration-testing)
4. [End-to-End Testing](#4-end-to-end-testing)
5. [Component Testing](#5-component-testing)
6. [Security Testing](#6-security-testing)
7. [Performance Testing](#7-performance-testing)
8. [BLE Testing](#8-ble-testing)
9. [Blockchain Testing](#9-blockchain-testing)
10. [Test Data Management](#10-test-data-management)
11. [CI/CD Testing](#11-cicd-testing)
12. [Test Quality Standards](#12-test-quality-standards)

---

## 1. Testing Overview

### 1.1 Testing Philosophy

Deyond follows **Test-Driven Development (TDD)** principles strictly:

1. **Write failing tests first** - Define expected behavior before implementation
2. **Implement to make tests pass** - Write minimal code to satisfy tests
3. **Refactor with confidence** - Tests provide safety net for changes
4. **No test.skip() for bugs** - Fix bugs immediately, don't defer them
5. **Test error paths, not just happy paths** - Validate all edge cases

### 1.2 Testing Pyramid

We follow the testing pyramid to ensure optimal test coverage:

```
          /\
         /  \
        / E2E \          10% - End-to-End Tests (User flows)
       /--------\
      /          \
     / Integration \     20% - Integration Tests (API, DB, Services)
    /--------------\
   /                \
  /   Unit Tests     \   70% - Unit Tests (Functions, Classes, Modules)
 /--------------------\
```

**Distribution:**
- **70% Unit Tests**: Fast, isolated, test individual units
- **20% Integration Tests**: Test component interactions
- **10% E2E Tests**: Test complete user journeys

### 1.3 Test Coverage Requirements

**Minimum Coverage Targets:**
- **Overall Code Coverage**: 80%+
- **Critical Paths** (wallet, crypto, auth): 95%+
- **Business Logic**: 90%+
- **UI Components**: 70%+
- **Utilities**: 85%+

**Coverage Types:**
- **Line Coverage**: Percentage of code lines executed
- **Branch Coverage**: Percentage of decision branches taken
- **Function Coverage**: Percentage of functions called
- **Statement Coverage**: Percentage of statements executed

### 1.4 Testing Tools & Frameworks

```json
{
  "unit": "Jest",
  "e2e": "Detox",
  "component": "React Native Testing Library",
  "integration": "Jest + Supertest",
  "mocking": "Jest Mocks + MSW",
  "coverage": "Jest Coverage",
  "snapshot": "Jest Snapshots",
  "property-based": "fast-check"
}
```

---

## 2. Unit Testing

### 2.1 Jest Configuration

**Location**: `package.json` (jest preset: "jest-expo")

```json
{
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*)"
    ],
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts",
      "!src/**/__tests__/**"
    ],
    "coverageThresholds": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      },
      "src/core/wallet/**": {
        "branches": 95,
        "functions": 95,
        "lines": 95,
        "statements": 95
      },
      "src/core/crypto/**": {
        "branches": 95,
        "functions": 95,
        "lines": 95,
        "statements": 95
      }
    }
  }
}
```

### 2.2 Test Structure (AAA Pattern)

All unit tests follow the **Arrange-Act-Assert** pattern:

```typescript
describe('FeatureName', () => {
  let dependency: Dependency;
  let systemUnderTest: SystemUnderTest;

  beforeEach(() => {
    // Arrange: Setup test dependencies
    dependency = createMockDependency();
    systemUnderTest = new SystemUnderTest(dependency);
  });

  afterEach(() => {
    // Cleanup: Release resources
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do expected behavior when given valid input', () => {
      // Arrange
      const input = 'valid-input';
      const expectedOutput = 'expected-result';

      // Act
      const result = systemUnderTest.methodName(input);

      // Assert
      expect(result).toEqual(expectedOutput);
      expect(dependency.method).toHaveBeenCalledWith(input);
    });

    it('should throw error when given invalid input', () => {
      // Arrange
      const invalidInput = null;

      // Act & Assert
      expect(() => systemUnderTest.methodName(invalidInput)).toThrow(ValidationError);
    });
  });
});
```

### 2.3 Mocking Strategies

#### 2.3.1 Manual Mocks

Create manual mocks in `__mocks__` directory:

```typescript
// src/core/wallet/__mocks__/WalletManager.ts
export class WalletManager {
  createWallet = jest.fn().mockResolvedValue({
    address: '0x1234567890123456789012345678901234567890',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    mnemonic: 'test test test test test test test test test test test junk',
  });

  importFromMnemonic = jest.fn();
  signMessage = jest.fn();
  unlockWallet = jest.fn();
}
```

#### 2.3.2 Jest Mock Functions

```typescript
// Mock external dependencies
jest.mock('ethers', () => ({
  Wallet: {
    createRandom: jest.fn().mockReturnValue({
      address: '0x1234...',
      privateKey: '0xabcd...',
      mnemonic: { phrase: 'test test test...' },
    }),
    fromMnemonic: jest.fn(),
  },
  utils: {
    parseEther: jest.fn(),
    formatEther: jest.fn(),
  },
}));
```

#### 2.3.3 Dependency Injection Mocks

```typescript
// Use dependency injection for testability
class TransactionService {
  constructor(
    private walletManager: WalletManager,
    private blockchainAdapter: IBlockchainAdapter
  ) {}

  async sendTransaction(to: string, amount: string): Promise<Transaction> {
    // Implementation
  }
}

// Test with mocked dependencies
describe('TransactionService', () => {
  let mockWalletManager: jest.Mocked<WalletManager>;
  let mockAdapter: jest.Mocked<IBlockchainAdapter>;
  let service: TransactionService;

  beforeEach(() => {
    mockWalletManager = createMockWalletManager();
    mockAdapter = createMockBlockchainAdapter();
    service = new TransactionService(mockWalletManager, mockAdapter);
  });

  it('should send transaction successfully', async () => {
    // Test implementation
  });
});
```

### 2.4 Coverage Requirements

**Coverage Reports**: Run `npm run test:coverage` to generate reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

**Coverage Files to Check:**
```
coverage/
├── lcov-report/
│   └── index.html         # Interactive HTML report
├── coverage-summary.json  # JSON summary
└── lcov.info              # LCOV format for CI tools
```

### 2.5 Example Unit Tests

#### 2.5.1 Wallet Manager Tests

**File**: `src/__tests__/core/WalletManager.test.ts`

```typescript
/**
 * Wallet Manager Tests
 * TDD: Testing wallet creation, import, recovery functionality
 */

import { WalletManager } from '../../core/wallet/WalletManager';

describe('WalletManager', () => {
  let walletManager: WalletManager;

  beforeEach(() => {
    walletManager = new WalletManager();
  });

  describe('createWallet', () => {
    it('should create a new wallet with mnemonic', async () => {
      // Arrange
      const password = 'secure-password-123';

      // Act
      const wallet = await walletManager.createWallet(password);

      // Assert
      expect(wallet).toBeDefined();
      expect(wallet.address).toBeDefined();
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(wallet.mnemonic).toBeDefined();
      expect(wallet.mnemonic.split(' ')).toHaveLength(12);
    });

    it('should create different wallets each time', async () => {
      // Arrange
      const password = 'password';

      // Act
      const wallet1 = await walletManager.createWallet(password);
      const wallet2 = await walletManager.createWallet(password);

      // Assert
      expect(wallet1.address).not.toEqual(wallet2.address);
      expect(wallet1.mnemonic).not.toEqual(wallet2.mnemonic);
    });

    it('should throw error with weak password', async () => {
      // Arrange
      const weakPassword = '123';

      // Act & Assert
      await expect(
        walletManager.createWallet(weakPassword)
      ).rejects.toThrow('Password must be at least 8 characters');
    });
  });

  describe('importFromMnemonic', () => {
    it('should import wallet from valid mnemonic', async () => {
      // Arrange
      const password = 'password';
      const originalWallet = await walletManager.createWallet(password);
      const mnemonic = originalWallet.mnemonic;

      // Act
      const importedWallet = await walletManager.importFromMnemonic(mnemonic, password);

      // Assert
      expect(importedWallet.address).toEqual(originalWallet.address);
    });

    it('should fail with invalid mnemonic', async () => {
      // Arrange
      const password = 'password';
      const invalidMnemonic = 'invalid mnemonic phrase that is not valid';

      // Act & Assert
      await expect(
        walletManager.importFromMnemonic(invalidMnemonic, password)
      ).rejects.toThrow('Invalid mnemonic');
    });
  });

  describe('signMessage', () => {
    it('should sign message with private key', async () => {
      // Arrange
      const password = 'password';
      const wallet = await walletManager.createWallet(password);
      const message = 'Hello, blockchain!';

      // Act
      const signature = await walletManager.signMessage(wallet.privateKey, message);

      // Assert
      expect(signature).toBeDefined();
      expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
    });

    it('should produce different signatures for different messages', async () => {
      // Arrange
      const password = 'password';
      const wallet = await walletManager.createWallet(password);

      // Act
      const sig1 = await walletManager.signMessage(wallet.privateKey, 'message1');
      const sig2 = await walletManager.signMessage(wallet.privateKey, 'message2');

      // Assert
      expect(sig1).not.toEqual(sig2);
    });
  });
});
```

#### 2.5.2 Messaging Tests

**File**: `src/__tests__/core/ChatManager.test.ts`

```typescript
/**
 * Chat Manager Tests
 * TDD: Testing encrypted P2P chat functionality
 */

import { ChatManager } from '../../core/chat/ChatManager';
import { BLESessionManager } from '../../core/ble/BLESessionManager';
import { SessionStatus, MessageStatus } from '../../types/ble';

describe('ChatManager', () => {
  let chatManager: ChatManager;
  let sessionManager: BLESessionManager;
  const mockWalletAddress = '0x1234567890123456789012345678901234567890';
  const mockPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

  beforeEach(() => {
    sessionManager = new BLESessionManager(mockWalletAddress, mockPrivateKey);
    chatManager = new ChatManager(sessionManager);
  });

  describe('sendMessage', () => {
    it('should send encrypted message in established session', async () => {
      // Arrange
      const session = await sessionManager.initiateSession('dev1', 'addr1', 'Test Device');
      const testSession = sessionManager.getSession(session.id);
      if (testSession) {
        testSession.status = SessionStatus.ESTABLISHED;
        testSession.sharedSecret = 'test-shared-secret-for-encryption';
      }

      // Act
      const message = await chatManager.sendMessage(
        session.id,
        mockWalletAddress,
        '0x0987654321098765432109876543210987654321',
        'Hello, this is a test message!'
      );

      // Assert
      expect(message).toBeDefined();
      expect(message.id).toBeDefined();
      expect(message.sessionId).toEqual(session.id);
      expect(message.from).toEqual(mockWalletAddress);
      expect(message.encrypted).toBe(true);
      expect(message.status).toEqual(MessageStatus.SENT);
    });

    it('should fail to send message in non-established session', async () => {
      // Arrange
      const session = await sessionManager.initiateSession('dev1', 'addr1', 'Test Device');

      // Act & Assert
      await expect(
        chatManager.sendMessage(
          session.id,
          mockWalletAddress,
          '0x0987654321098765432109876543210987654321',
          'Test message'
        )
      ).rejects.toThrow('Session not established');
    });
  });

  describe('receiveMessage', () => {
    it('should decrypt received encrypted message', async () => {
      // Arrange
      const session = await sessionManager.initiateSession('dev1', 'addr1', 'Test Device');
      const testSession = sessionManager.getSession(session.id);
      if (testSession) {
        testSession.status = SessionStatus.ESTABLISHED;
        testSession.sharedSecret = 'test-shared-secret-for-encryption';
      }
      const originalContent = 'Secret message content';

      // Act
      const sentMessage = await chatManager.sendMessage(
        session.id,
        mockWalletAddress,
        '0x0987654321098765432109876543210987654321',
        originalContent
      );
      const receivedMessage = await chatManager.receiveMessage(sentMessage);

      // Assert
      expect(receivedMessage.content).toEqual(originalContent);
      expect(receivedMessage.encrypted).toBe(true);
    });
  });
});
```

#### 2.5.3 Crypto Utilities Tests

**File**: `src/__tests__/core/crypto.test.ts`

```typescript
/**
 * Crypto Utility Tests
 * TDD: Write tests first, then implement functionality
 */

import { CryptoUtils } from '../../core/crypto/CryptoUtils';

describe('CryptoUtils', () => {
  describe('encrypt/decrypt', () => {
    it('should decrypt encrypted data with correct password', async () => {
      // Arrange
      const originalData = 'sensitive information';
      const password = 'secure-password';

      // Act
      const encrypted = await CryptoUtils.encrypt(originalData, password);
      const decrypted = await CryptoUtils.decrypt(encrypted, password);

      // Assert
      expect(decrypted).toEqual(originalData);
    });

    it('should fail to decrypt with wrong password', async () => {
      // Arrange
      const originalData = 'sensitive information';
      const password = 'correct-password';
      const wrongPassword = 'wrong-password';

      // Act
      const encrypted = await CryptoUtils.encrypt(originalData, password);

      // Assert
      await expect(CryptoUtils.decrypt(encrypted, wrongPassword)).rejects.toThrow();
    });

    it('should produce different ciphertext for same data', async () => {
      // Arrange
      const data = 'sensitive data';
      const password = 'password';

      // Act
      const encrypted1 = await CryptoUtils.encrypt(data, password);
      const encrypted2 = await CryptoUtils.encrypt(data, password);

      // Assert
      expect(encrypted1.ciphertext).not.toEqual(encrypted2.ciphertext);
      expect(encrypted1.iv).not.toEqual(encrypted2.iv);
    });
  });

  describe('deriveKey', () => {
    it('should derive same key from same password and salt', async () => {
      // Arrange
      const password = 'test-password-123';
      const salt = CryptoUtils.generateRandomBytes(32);

      // Act
      const key1 = await CryptoUtils.deriveKey(password, salt);
      const key2 = await CryptoUtils.deriveKey(password, salt);

      // Assert
      expect(key1).toEqual(key2);
    });

    it('should derive different keys from different passwords', async () => {
      // Arrange
      const salt = CryptoUtils.generateRandomBytes(32);

      // Act
      const key1 = await CryptoUtils.deriveKey('password1', salt);
      const key2 = await CryptoUtils.deriveKey('password2', salt);

      // Assert
      expect(key1).not.toEqual(key2);
    });
  });
});
```

---

## 3. Integration Testing

### 3.1 API Integration Tests

Test API endpoints with real HTTP requests (mocked backend):

```typescript
/**
 * API Integration Tests
 * Testing REST API endpoints with mocked backend
 */

import { apiClient } from '../../services/api/ApiClient';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock Service Worker - intercepts HTTP requests
const server = setupServer(
  rest.get('/api/wallet/:address/balance', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        address: req.params.address,
        balance: '1.234567890123456789',
        tokens: [
          { symbol: 'USDC', balance: '1000.0', address: '0xA0b...' },
          { symbol: 'DAI', balance: '500.0', address: '0xB1c...' },
        ],
      })
    );
  }),

  rest.post('/api/transactions/send', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        hash: '0x1234567890abcdef...',
        status: 'pending',
        blockNumber: null,
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('API Integration Tests', () => {
  describe('GET /wallet/:address/balance', () => {
    it('should fetch wallet balance successfully', async () => {
      // Arrange
      const address = '0x1234567890123456789012345678901234567890';

      // Act
      const response = await apiClient.getBalance(address);

      // Assert
      expect(response.balance).toBe('1.234567890123456789');
      expect(response.tokens).toHaveLength(2);
      expect(response.tokens[0].symbol).toBe('USDC');
    });
  });

  describe('POST /transactions/send', () => {
    it('should send transaction successfully', async () => {
      // Arrange
      const txData = {
        to: '0x9876543210987654321098765432109876543210',
        value: '0.1',
        gasLimit: 21000,
      };

      // Act
      const response = await apiClient.sendTransaction(txData);

      // Assert
      expect(response.hash).toBeDefined();
      expect(response.status).toBe('pending');
    });

    it('should handle insufficient balance error', async () => {
      // Arrange
      server.use(
        rest.post('/api/transactions/send', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({ error: 'Insufficient balance' })
          );
        })
      );

      const txData = {
        to: '0x9876543210987654321098765432109876543210',
        value: '1000000',
        gasLimit: 21000,
      };

      // Act & Assert
      await expect(apiClient.sendTransaction(txData)).rejects.toThrow('Insufficient balance');
    });
  });
});
```

### 3.2 Database Integration Tests

Test database operations with in-memory or test database:

```typescript
/**
 * Database Integration Tests
 * Testing database operations with SQLite in-memory
 */

import { Database } from '../../core/database/Database';
import { WalletRepository } from '../../repositories/WalletRepository';

describe('Database Integration Tests', () => {
  let db: Database;
  let walletRepo: WalletRepository;

  beforeAll(async () => {
    // Use in-memory database for testing
    db = new Database(':memory:');
    await db.initialize();
    walletRepo = new WalletRepository(db);
  });

  afterAll(async () => {
    await db.close();
  });

  beforeEach(async () => {
    // Clear tables before each test
    await db.query('DELETE FROM wallets');
    await db.query('DELETE FROM transactions');
  });

  describe('WalletRepository', () => {
    it('should save and retrieve wallet', async () => {
      // Arrange
      const wallet = {
        address: '0x1234567890123456789012345678901234567890',
        encryptedPrivateKey: 'encrypted-key-data',
        createdAt: Date.now(),
      };

      // Act
      await walletRepo.save(wallet);
      const retrieved = await walletRepo.findByAddress(wallet.address);

      // Assert
      expect(retrieved).toBeDefined();
      expect(retrieved?.address).toBe(wallet.address);
      expect(retrieved?.encryptedPrivateKey).toBe(wallet.encryptedPrivateKey);
    });

    it('should update wallet balance', async () => {
      // Arrange
      const wallet = {
        address: '0x1234567890123456789012345678901234567890',
        encryptedPrivateKey: 'encrypted-key-data',
        balance: '0',
        createdAt: Date.now(),
      };
      await walletRepo.save(wallet);

      // Act
      await walletRepo.updateBalance(wallet.address, '1.5');
      const updated = await walletRepo.findByAddress(wallet.address);

      // Assert
      expect(updated?.balance).toBe('1.5');
    });

    it('should delete wallet', async () => {
      // Arrange
      const wallet = {
        address: '0x1234567890123456789012345678901234567890',
        encryptedPrivateKey: 'encrypted-key-data',
        createdAt: Date.now(),
      };
      await walletRepo.save(wallet);

      // Act
      await walletRepo.delete(wallet.address);
      const deleted = await walletRepo.findByAddress(wallet.address);

      // Assert
      expect(deleted).toBeNull();
    });
  });
});
```

### 3.3 External Service Mocking

Mock external blockchain services:

```typescript
/**
 * Blockchain Service Integration Tests
 * Testing blockchain adapter with mocked RPC responses
 */

import { EthereumAdapter } from '../../adapters/EthereumAdapter';
import nock from 'nock';

describe('EthereumAdapter Integration Tests', () => {
  let adapter: EthereumAdapter;
  const rpcUrl = 'https://eth-mainnet.example.com';

  beforeEach(() => {
    adapter = new EthereumAdapter(rpcUrl);
    nock.cleanAll();
  });

  afterEach(() => {
    nock.isDone();
  });

  describe('getBalance', () => {
    it('should fetch balance from RPC', async () => {
      // Arrange
      const address = '0x1234567890123456789012345678901234567890';
      nock(rpcUrl)
        .post('/', {
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1,
        })
        .reply(200, {
          jsonrpc: '2.0',
          id: 1,
          result: '0x1bc16d674ec80000', // 2 ETH in hex
        });

      // Act
      const balance = await adapter.getBalance(address);

      // Assert
      expect(balance).toBe('2.0');
    });

    it('should handle RPC errors gracefully', async () => {
      // Arrange
      const address = '0x1234567890123456789012345678901234567890';
      nock(rpcUrl)
        .post('/')
        .reply(500, { error: 'Internal Server Error' });

      // Act & Assert
      await expect(adapter.getBalance(address)).rejects.toThrow('RPC error');
    });
  });
});
```

### 3.4 Test Containers (Docker)

Use Docker containers for integration tests with real services:

```typescript
/**
 * Redis Integration Tests with TestContainers
 * Testing cache operations with real Redis instance
 */

import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { RedisCache } from '../../services/cache/RedisCache';
import Redis from 'ioredis';

describe('Redis Integration Tests', () => {
  let container: StartedTestContainer;
  let redis: Redis;
  let cache: RedisCache;

  beforeAll(async () => {
    // Start Redis container
    container = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .start();

    const host = container.getHost();
    const port = container.getMappedPort(6379);

    redis = new Redis({ host, port });
    cache = new RedisCache(redis);
  }, 60000); // 60s timeout for container startup

  afterAll(async () => {
    await redis.quit();
    await container.stop();
  });

  beforeEach(async () => {
    await redis.flushdb();
  });

  describe('set and get', () => {
    it('should store and retrieve value', async () => {
      // Arrange
      const key = 'test-key';
      const value = { data: 'test-value' };

      // Act
      await cache.set(key, value, 60);
      const retrieved = await cache.get(key);

      // Assert
      expect(retrieved).toEqual(value);
    });

    it('should return null for expired key', async () => {
      // Arrange
      const key = 'expiring-key';
      const value = 'test-value';

      // Act
      await cache.set(key, value, 1); // 1 second TTL
      await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5s
      const retrieved = await cache.get(key);

      // Assert
      expect(retrieved).toBeNull();
    });
  });
});
```

---

## 4. End-to-End Testing

### 4.1 Detox for React Native

**Installation:**

```bash
npm install --save-dev detox jest-circus
```

**Detox Configuration** (`package.json`):

```json
{
  "detox": {
    "test-runner": "jest",
    "runner-config": "e2e/config.json",
    "configurations": {
      "ios.sim.debug": {
        "device": {
          "type": "iPhone 14 Pro"
        },
        "app": "ios.debug"
      },
      "android.emu.debug": {
        "device": {
          "avdName": "Pixel_5_API_31"
        },
        "app": "android.debug"
      }
    },
    "apps": {
      "ios.debug": {
        "type": "ios.app",
        "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/DeyondApp.app",
        "build": "xcodebuild -workspace ios/DeyondApp.xcworkspace -scheme DeyondApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build"
      },
      "android.debug": {
        "type": "android.apk",
        "binaryPath": "android/app/build/outputs/apk/debug/app-debug.apk",
        "build": "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug"
      }
    }
  }
}
```

### 4.2 User Flow Testing

**Critical User Flows:**

1. **Wallet Creation Flow**
2. **Transaction Send Flow**
3. **Message Send Flow**
4. **BLE Discovery Flow**
5. **Voice Call Flow**

#### 4.2.1 Wallet Creation Flow

**File**: `e2e/walletCreation.e2e.ts`

```typescript
/**
 * E2E Test: Wallet Creation Flow
 * Tests complete user journey of creating a new wallet
 */

import { device, element, by, expect as detoxExpect } from 'detox';

describe('Wallet Creation Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete wallet creation successfully', async () => {
    // Step 1: Welcome screen - Tap "Create New Wallet"
    await detoxExpect(element(by.id('welcome-screen'))).toBeVisible();
    await element(by.id('create-wallet-button')).tap();

    // Step 2: Generate recovery phrase
    await detoxExpect(element(by.id('recovery-phrase-screen'))).toBeVisible();
    await element(by.id('generate-phrase-button')).tap();

    // Step 3: View and copy recovery phrase
    await detoxExpect(element(by.id('recovery-phrase-display'))).toBeVisible();
    await element(by.id('copy-phrase-button')).tap();
    await element(by.id('confirm-copied-button')).tap();

    // Step 4: Verify recovery phrase
    await detoxExpect(element(by.id('verify-phrase-screen'))).toBeVisible();

    // Select correct words in order (simplified - actual implementation more complex)
    await element(by.id('word-option-1')).tap();
    await element(by.id('word-option-2')).tap();
    await element(by.id('word-option-3')).tap();

    await element(by.id('verify-phrase-button')).tap();

    // Step 5: Set PIN
    await detoxExpect(element(by.id('set-pin-screen'))).toBeVisible();
    await element(by.id('pin-input')).typeText('123456');
    await element(by.id('confirm-pin-button')).tap();

    // Step 6: Confirm PIN
    await element(by.id('pin-input')).typeText('123456');
    await element(by.id('confirm-pin-button')).tap();

    // Step 7: Wallet created - Verify home screen
    await detoxExpect(element(by.id('wallet-home-screen'))).toBeVisible();
    await detoxExpect(element(by.id('wallet-address'))).toBeVisible();
    await detoxExpect(element(by.id('balance-display'))).toHaveText('0 ETH');
  });

  it('should reject weak PIN during wallet creation', async () => {
    // Navigate to PIN setup
    await element(by.id('create-wallet-button')).tap();
    await element(by.id('generate-phrase-button')).tap();
    await element(by.id('confirm-copied-button')).tap();
    // ... verify phrase steps ...

    // Try weak PIN
    await element(by.id('pin-input')).typeText('1111');
    await element(by.id('confirm-pin-button')).tap();

    // Expect error message
    await detoxExpect(element(by.id('pin-error-message'))).toBeVisible();
    await detoxExpect(element(by.id('pin-error-message'))).toHaveText(
      'PIN must not be sequential or repeated digits'
    );
  });
});
```

#### 4.2.2 Transaction Send Flow

**File**: `e2e/transactionSend.e2e.ts`

```typescript
/**
 * E2E Test: Transaction Send Flow
 * Tests sending ETH transaction
 */

import { device, element, by, expect as detoxExpect } from 'detox';

describe('Transaction Send Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      launchArgs: {
        detoxTestWallet: 'true', // Use pre-funded test wallet
      },
    });
  });

  it('should send ETH transaction successfully', async () => {
    // Step 1: Unlock wallet
    await element(by.id('pin-input')).typeText('123456');
    await element(by.id('unlock-button')).tap();

    // Step 2: Navigate to Send screen
    await detoxExpect(element(by.id('wallet-home-screen'))).toBeVisible();
    await element(by.id('send-button')).tap();

    // Step 3: Enter recipient address
    await detoxExpect(element(by.id('send-screen'))).toBeVisible();
    await element(by.id('recipient-input')).typeText('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Step 4: Enter amount
    await element(by.id('amount-input')).typeText('0.01');

    // Step 5: Review transaction
    await element(by.id('review-transaction-button')).tap();
    await detoxExpect(element(by.id('transaction-review-screen'))).toBeVisible();

    // Verify transaction details
    await detoxExpect(element(by.id('recipient-address'))).toHaveText(
      '0x742d...f0bEb'
    );
    await detoxExpect(element(by.id('amount-display'))).toHaveText('0.01 ETH');

    // Step 6: Confirm with biometric/PIN
    await element(by.id('confirm-transaction-button')).tap();
    await element(by.id('pin-input')).typeText('123456');
    await element(by.id('confirm-pin-button')).tap();

    // Step 7: Transaction sent - verify confirmation
    await detoxExpect(element(by.id('transaction-success-screen'))).toBeVisible();
    await detoxExpect(element(by.id('transaction-hash'))).toBeVisible();

    // Step 8: Return to home - verify balance updated
    await element(by.id('done-button')).tap();
    await detoxExpect(element(by.id('wallet-home-screen'))).toBeVisible();

    // Balance should be reduced (approximately)
    // Note: Exact balance check difficult due to gas fees
  });

  it('should reject transaction with insufficient balance', async () => {
    // Unlock and navigate to send
    await element(by.id('pin-input')).typeText('123456');
    await element(by.id('unlock-button')).tap();
    await element(by.id('send-button')).tap();

    // Try to send more than balance
    await element(by.id('recipient-input')).typeText('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    await element(by.id('amount-input')).typeText('1000'); // More than available

    await element(by.id('review-transaction-button')).tap();

    // Expect error
    await detoxExpect(element(by.id('error-message'))).toBeVisible();
    await detoxExpect(element(by.id('error-message'))).toHaveText(
      'Insufficient balance. You need at least 1000 ETH plus gas fees.'
    );
  });
});
```

### 4.3 Critical Path Testing

**Critical Paths** (must always work):

1. Wallet creation
2. Wallet import
3. Send transaction
4. Receive transaction
5. View balance
6. Send message
7. BLE device discovery

**Test Priority**: P0 (blocking release if failing)

### 4.4 Test Scenarios for Each Feature

#### Wallet Feature Scenarios

- ✅ Create new wallet with 12-word mnemonic
- ✅ Create new wallet with 24-word mnemonic
- ✅ Import wallet from mnemonic
- ✅ Import wallet from private key
- ✅ Unlock wallet with PIN
- ✅ Unlock wallet with biometric
- ✅ Lock wallet after timeout
- ✅ Export private key (with warning)
- ✅ Backup wallet to cloud

#### Messaging Feature Scenarios

- ✅ Send text message to contact
- ✅ Send image message
- ✅ Receive message notification
- ✅ View conversation history
- ✅ Search messages
- ✅ Delete message
- ✅ Create group chat
- ✅ Add member to group
- ✅ Leave group

#### BLE Discovery Scenarios

- ✅ Enable BLE discovery mode
- ✅ Discover nearby users
- ✅ Send connection request
- ✅ Accept connection request
- ✅ View user profile before connecting
- ✅ Filter discovered users by distance
- ✅ Disable BLE discovery

---

## 5. Component Testing

### 5.1 React Component Testing

Use **React Native Testing Library** for component tests:

```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native
```

**Setup** (`jest-setup.js`):

```javascript
import '@testing-library/jest-native/extend-expect';
```

### 5.2 Component Test Examples

#### 5.2.1 WalletCard Component

**File**: `src/components/__tests__/WalletCard.test.tsx`

```typescript
/**
 * WalletCard Component Tests
 * Testing wallet display component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WalletCard } from '../WalletCard';

describe('WalletCard Component', () => {
  const mockWallet = {
    address: '0x1234567890123456789012345678901234567890',
    balance: '1.234567890123456789',
    symbol: 'ETH',
  };

  it('should render wallet address and balance', () => {
    // Arrange & Act
    const { getByText } = render(<WalletCard wallet={mockWallet} />);

    // Assert
    expect(getByText('0x1234...7890')).toBeTruthy();
    expect(getByText('1.23456789 ETH')).toBeTruthy();
  });

  it('should call onPress when tapped', () => {
    // Arrange
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <WalletCard wallet={mockWallet} onPress={onPressMock} />
    );

    // Act
    fireEvent.press(getByTestId('wallet-card'));

    // Assert
    expect(onPressMock).toHaveBeenCalledWith(mockWallet);
  });

  it('should display loading state', () => {
    // Arrange & Act
    const { getByTestId } = render(
      <WalletCard wallet={mockWallet} loading={true} />
    );

    // Assert
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('should display error state', () => {
    // Arrange
    const error = 'Failed to load balance';

    // Act
    const { getByText } = render(
      <WalletCard wallet={mockWallet} error={error} />
    );

    // Assert
    expect(getByText(error)).toBeTruthy();
  });
});
```

#### 5.2.2 SendTransactionForm Component

```typescript
/**
 * SendTransactionForm Component Tests
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SendTransactionForm } from '../SendTransactionForm';

describe('SendTransactionForm Component', () => {
  it('should validate recipient address format', async () => {
    // Arrange
    const { getByTestId, getByText } = render(<SendTransactionForm />);

    // Act
    fireEvent.changeText(getByTestId('recipient-input'), 'invalid-address');
    fireEvent.press(getByTestId('submit-button'));

    // Assert
    await waitFor(() => {
      expect(getByText('Invalid Ethereum address')).toBeTruthy();
    });
  });

  it('should validate amount is positive', async () => {
    // Arrange
    const { getByTestId, getByText } = render(<SendTransactionForm />);

    // Act
    fireEvent.changeText(getByTestId('recipient-input'), '0x1234567890123456789012345678901234567890');
    fireEvent.changeText(getByTestId('amount-input'), '-1');
    fireEvent.press(getByTestId('submit-button'));

    // Assert
    await waitFor(() => {
      expect(getByText('Amount must be positive')).toBeTruthy();
    });
  });

  it('should call onSubmit with valid data', async () => {
    // Arrange
    const onSubmitMock = jest.fn();
    const { getByTestId } = render(<SendTransactionForm onSubmit={onSubmitMock} />);

    // Act
    fireEvent.changeText(getByTestId('recipient-input'), '0x1234567890123456789012345678901234567890');
    fireEvent.changeText(getByTestId('amount-input'), '0.5');
    fireEvent.press(getByTestId('submit-button'));

    // Assert
    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith({
        to: '0x1234567890123456789012345678901234567890',
        amount: '0.5',
      });
    });
  });
});
```

### 5.3 Snapshot Testing

Create snapshots to detect unintended UI changes:

```typescript
/**
 * Snapshot Tests
 */

import React from 'react';
import renderer from 'react-test-renderer';
import { WalletCard } from '../WalletCard';

describe('WalletCard Snapshots', () => {
  it('should match snapshot with default props', () => {
    const wallet = {
      address: '0x1234567890123456789012345678901234567890',
      balance: '1.23',
      symbol: 'ETH',
    };

    const tree = renderer.create(<WalletCard wallet={wallet} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should match snapshot in loading state', () => {
    const wallet = {
      address: '0x1234567890123456789012345678901234567890',
      balance: '0',
      symbol: 'ETH',
    };

    const tree = renderer.create(<WalletCard wallet={wallet} loading={true} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
```

**Updating Snapshots:**

```bash
# Update all snapshots
npm test -- -u

# Update specific snapshot
npm test -- -u WalletCard.test.tsx
```

### 5.4 Accessibility Testing

Test components for accessibility compliance:

```typescript
/**
 * Accessibility Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { WalletCard } from '../WalletCard';

describe('WalletCard Accessibility', () => {
  it('should have accessible label', () => {
    const wallet = {
      address: '0x1234567890123456789012345678901234567890',
      balance: '1.23',
      symbol: 'ETH',
    };

    const { getByLabelText } = render(<WalletCard wallet={wallet} />);

    expect(getByLabelText('Wallet balance: 1.23 ETH')).toBeTruthy();
  });

  it('should have accessible button role', () => {
    const wallet = {
      address: '0x1234567890123456789012345678901234567890',
      balance: '1.23',
      symbol: 'ETH',
    };

    const { getByRole } = render(<WalletCard wallet={wallet} />);

    expect(getByRole('button')).toBeTruthy();
  });

  it('should support screen reader navigation', () => {
    const wallet = {
      address: '0x1234567890123456789012345678901234567890',
      balance: '1.23',
      symbol: 'ETH',
    };

    const { getByTestId } = render(<WalletCard wallet={wallet} />);
    const card = getByTestId('wallet-card');

    expect(card.props.accessible).toBe(true);
    expect(card.props.accessibilityRole).toBe('button');
  });
});
```

---

## 6. Security Testing

### 6.1 Penetration Testing

**Manual Penetration Testing Checklist:**

- ✅ Private key extraction attempts
- ✅ Man-in-the-middle attack simulation
- ✅ Keychain/Keystore bypass attempts
- ✅ Root/jailbreak detection bypass
- ✅ Screenshot capture attempts on sensitive screens
- ✅ Clipboard data interception
- ✅ Network traffic inspection
- ✅ Local storage encryption verification
- ✅ Backup file security analysis

**Automated Pen Testing:**

```bash
# Use OWASP ZAP for API security testing
docker run -t owasp/zap2docker-stable zap-api-scan.py \
  -t https://api.deyond.app/openapi.json \
  -f openapi \
  -r security-report.html
```

### 6.2 Vulnerability Scanning

**Dependency Scanning:**

```bash
# NPM audit
npm audit --audit-level=high

# Snyk scanning
npx snyk test

# Yarn audit
yarn audit --level high
```

**Automated Scanning in CI:**

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### 6.3 Fuzzing

**Property-Based Testing with fast-check:**

```typescript
/**
 * Fuzzing Tests
 * Property-based testing for crypto operations
 */

import fc from 'fast-check';
import { CryptoUtils } from '../../core/crypto/CryptoUtils';

describe('Crypto Fuzzing Tests', () => {
  it('should always decrypt encrypted data with correct password', () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 1000 }), // Data
        fc.string({ minLength: 8, maxLength: 128 }),  // Password
        async (data, password) => {
          // Encrypt and decrypt
          const encrypted = await CryptoUtils.encrypt(data, password);
          const decrypted = await CryptoUtils.decrypt(encrypted, password);

          // Property: Decrypted data should match original
          expect(decrypted).toBe(data);
        }
      ),
      { numRuns: 100 } // Run 100 random test cases
    );
  });

  it('should always produce different ciphertexts for same plaintext', () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 8 }),
        async (data, password) => {
          const encrypted1 = await CryptoUtils.encrypt(data, password);
          const encrypted2 = await CryptoUtils.encrypt(data, password);

          // Property: Ciphertexts should be different (due to random IV)
          expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
        }
      )
    );
  });

  it('should never decrypt with wrong password', () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 8 }),
        fc.string({ minLength: 8 }),
        async (data, password1, password2) => {
          fc.pre(password1 !== password2); // Only test different passwords

          const encrypted = await CryptoUtils.encrypt(data, password1);

          // Property: Wrong password should fail
          await expect(
            CryptoUtils.decrypt(encrypted, password2)
          ).rejects.toThrow();
        }
      )
    );
  });
});
```

### 6.4 Static Analysis

**ESLint Security Plugin:**

```bash
npm install --save-dev eslint-plugin-security
```

**ESLint Config** (`.eslintrc.js`):

```javascript
module.exports = {
  extends: [
    '@react-native-community',
    'plugin:security/recommended',
  ],
  plugins: ['security'],
  rules: {
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-possible-timing-attacks': 'warn',
  },
};
```

**TypeScript Strict Mode** (`tsconfig.json`):

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

---

## 7. Performance Testing

### 7.1 Load Testing

Test API performance under load:

```typescript
/**
 * Load Testing with Artillery
 * File: load-tests/api-load-test.yml
 */

config:
  target: "https://api.deyond.app"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 120
      arrivalRate: 100
      name: "Spike test"
  variables:
    testWalletAddress: "0x1234567890123456789012345678901234567890"

scenarios:
  - name: "Get wallet balance"
    flow:
      - get:
          url: "/wallet/{{ testWalletAddress }}/balance"
          expect:
            - statusCode: 200
            - contentType: json
            - hasProperty: "balance"

  - name: "Get transaction history"
    flow:
      - get:
          url: "/wallet/{{ testWalletAddress }}/transactions"
          qs:
            limit: 20
            offset: 0
          expect:
            - statusCode: 200
```

**Run Load Test:**

```bash
npm install -g artillery
artillery run load-tests/api-load-test.yml
```

### 7.2 Stress Testing

Test app limits:

```typescript
/**
 * Stress Test: Message Throughput
 */

import { ChatManager } from '../../core/chat/ChatManager';

describe('ChatManager Stress Tests', () => {
  it('should handle 1000 messages without memory leak', async () => {
    // Arrange
    const chatManager = new ChatManager(mockSessionManager);
    const sessionId = 'test-session';
    const initialMemory = process.memoryUsage().heapUsed;

    // Act
    for (let i = 0; i < 1000; i++) {
      await chatManager.sendMessage(
        sessionId,
        'sender',
        'recipient',
        `Message ${i}`
      );
    }

    // Assert
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

    // Memory should not increase more than 50MB for 1000 messages
    expect(memoryIncrease).toBeLessThan(50);
  });

  it('should maintain performance with 10000 contacts', async () => {
    // Arrange
    const contactManager = new ContactManager();

    // Add 10000 contacts
    for (let i = 0; i < 10000; i++) {
      await contactManager.addContact({
        address: `0x${i.toString(16).padStart(40, '0')}`,
        name: `Contact ${i}`,
      });
    }

    // Act
    const startTime = Date.now();
    const results = await contactManager.searchContacts('Contact 5000');
    const duration = Date.now() - startTime;

    // Assert
    expect(duration).toBeLessThan(100); // Should complete in < 100ms
    expect(results).toHaveLength(1);
  });
});
```

### 7.3 App Profiling

**React Native Performance Monitor:**

```typescript
/**
 * Performance Monitoring
 */

import { PerformanceObserver, performance } from 'perf_hooks';

// Measure component render time
export function measureComponentRender(componentName: string, renderFn: () => void) {
  performance.mark(`${componentName}-start`);
  renderFn();
  performance.mark(`${componentName}-end`);
  performance.measure(componentName, `${componentName}-start`, `${componentName}-end`);

  const measure = performance.getEntriesByName(componentName)[0];
  console.log(`${componentName} render time: ${measure.duration}ms`);
}

// Performance observer for automated monitoring
const obs = new PerformanceObserver((items) => {
  items.getEntries().forEach((entry) => {
    if (entry.duration > 16.67) { // 60 FPS threshold
      console.warn(`Slow render: ${entry.name} took ${entry.duration}ms`);
    }
  });
});

obs.observe({ entryTypes: ['measure'] });
```

**Flipper for Profiling:**

```bash
# Install Flipper
# https://fbflipper.com/

# Launch app in debug mode
npm run ios
# or
npm run android

# Open Flipper and connect to app
# Use React DevTools plugin for component profiling
# Use Network plugin for API call analysis
# Use Database plugin for SQLite inspection
```

### 7.4 Memory Leak Detection

```typescript
/**
 * Memory Leak Detection Tests
 */

describe('Memory Leak Tests', () => {
  it('should not leak memory when creating/destroying components', async () => {
    // Arrange
    const iterations = 100;
    const memoryReadings: number[] = [];

    // Act
    for (let i = 0; i < iterations; i++) {
      const component = render(<WalletCard wallet={mockWallet} />);
      component.unmount();

      if (i % 10 === 0) {
        // Force garbage collection (requires --expose-gc flag)
        if (global.gc) {
          global.gc();
        }
        memoryReadings.push(process.memoryUsage().heapUsed);
      }
    }

    // Assert
    // Memory should stabilize after initial allocations
    const firstHalf = memoryReadings.slice(0, memoryReadings.length / 2);
    const secondHalf = memoryReadings.slice(memoryReadings.length / 2);

    const firstAvg = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b) / secondHalf.length;

    // Second half should not be significantly larger (< 20% increase)
    expect(secondAvg).toBeLessThan(firstAvg * 1.2);
  });
});
```

**Run with garbage collection:**

```bash
node --expose-gc ./node_modules/.bin/jest --testNamePattern="Memory Leak"
```

---

## 8. BLE Testing

### 8.1 Device Discovery Testing

```typescript
/**
 * BLE Device Discovery Tests
 */

import { BLEManager } from '../../core/ble/BLEManager';
import { BleManager as ReactNativeBLE } from 'react-native-ble-plx';

jest.mock('react-native-ble-plx');

describe('BLE Device Discovery', () => {
  let bleManager: BLEManager;
  let mockBLE: jest.Mocked<ReactNativeBLE>;

  beforeEach(() => {
    mockBLE = new ReactNativeBLE() as jest.Mocked<ReactNativeBLE>;
    bleManager = new BLEManager(mockBLE);
  });

  afterEach(async () => {
    await bleManager.stopDiscovery();
  });

  it('should discover nearby devices', async () => {
    // Arrange
    const mockDevices = [
      {
        id: 'device-1',
        name: 'User 1',
        rssi: -50,
        serviceUUIDs: ['deyond-service'],
      },
      {
        id: 'device-2',
        name: 'User 2',
        rssi: -70,
        serviceUUIDs: ['deyond-service'],
      },
    ];

    mockBLE.startDeviceScan.mockImplementation((uuids, options, callback) => {
      mockDevices.forEach(device => callback(null, device));
    });

    // Act
    const discoveredDevices: any[] = [];
    await bleManager.startDiscovery((device) => {
      discoveredDevices.push(device);
    });

    // Wait for discovery
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Assert
    expect(discoveredDevices).toHaveLength(2);
    expect(discoveredDevices[0].name).toBe('User 1');
  });

  it('should filter devices by RSSI threshold', async () => {
    // Arrange
    const closeDevice = { id: 'close', name: 'Close User', rssi: -40 };
    const farDevice = { id: 'far', name: 'Far User', rssi: -90 };

    mockBLE.startDeviceScan.mockImplementation((uuids, options, callback) => {
      callback(null, closeDevice);
      callback(null, farDevice);
    });

    // Act
    const discoveredDevices: any[] = [];
    await bleManager.startDiscovery(
      (device) => discoveredDevices.push(device),
      { rssiThreshold: -60 } // Only devices with RSSI > -60
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Assert
    expect(discoveredDevices).toHaveLength(1);
    expect(discoveredDevices[0].id).toBe('close');
  });
});
```

### 8.2 Mesh Network Testing

```typescript
/**
 * BLE Mesh Network Tests
 */

describe('BLE Mesh Network', () => {
  it('should relay messages through intermediate nodes', async () => {
    // Arrange
    // Node A <-> Node B <-> Node C
    // A wants to send to C, but can only reach B
    const nodeA = new BLENode('A');
    const nodeB = new BLENode('B');
    const nodeC = new BLENode('C');

    // Connect nodes
    await nodeA.connect(nodeB);
    await nodeB.connect(nodeC);

    // Act
    const message = { to: 'C', from: 'A', content: 'Hello C from A' };
    await nodeA.sendMessage(message);

    // Wait for relay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Assert
    const receivedMessages = nodeC.getReceivedMessages();
    expect(receivedMessages).toHaveLength(1);
    expect(receivedMessages[0].content).toBe('Hello C from A');
    expect(receivedMessages[0].hops).toBe(2); // A -> B -> C
  });

  it('should prevent message loops in mesh', async () => {
    // Arrange
    // Circular network: A <-> B <-> C <-> A
    const nodeA = new BLENode('A');
    const nodeB = new BLENode('B');
    const nodeC = new BLENode('C');

    await nodeA.connect(nodeB);
    await nodeB.connect(nodeC);
    await nodeC.connect(nodeA);

    // Act
    const message = { to: 'B', from: 'A', content: 'Test', id: 'msg-1' };
    await nodeA.sendMessage(message);

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Assert
    // Each node should see message only once (no loops)
    expect(nodeB.getMessageCount('msg-1')).toBe(1);
    expect(nodeC.getMessageCount('msg-1')).toBe(0); // Shouldn't reach C
  });
});
```

### 8.3 Range Testing

```typescript
/**
 * BLE Range Testing
 * Note: Requires physical devices for accurate testing
 */

describe('BLE Range Tests', () => {
  it('should detect devices within 10 meters', async () => {
    // This test requires physical setup
    // Document expected behavior

    const bleManager = new BLEManager();
    const devicesAt5m: any[] = [];
    const devicesAt20m: any[] = [];

    await bleManager.startDiscovery((device) => {
      if (device.rssi > -60) {
        devicesAt5m.push(device); // Approximate < 10m
      } else if (device.rssi < -80) {
        devicesAt20m.push(device); // Approximate > 15m
      }
    });

    // Manual verification required
    // Expected: More devices in devicesAt5m than devicesAt20m
  });
});
```

---

## 9. Blockchain Testing

### 9.1 Test Networks

**Supported Test Networks:**

1. **Ethereum:**
   - Goerli (deprecated, use Sepolia)
   - Sepolia (recommended)
   - Local Hardhat network

2. **Solana:**
   - Devnet
   - Testnet
   - Local validator

3. **BSC:**
   - BSC Testnet

**Configuration** (`src/config/networks.ts`):

```typescript
export const TEST_NETWORKS = {
  ethereum: {
    sepolia: {
      name: 'Sepolia',
      chainId: 11155111,
      rpcUrl: 'https://sepolia.infura.io/v3/YOUR_KEY',
      explorerUrl: 'https://sepolia.etherscan.io',
      faucet: 'https://sepoliafaucet.com',
    },
    local: {
      name: 'Hardhat',
      chainId: 31337,
      rpcUrl: 'http://localhost:8545',
    },
  },
  solana: {
    devnet: {
      name: 'Devnet',
      cluster: 'devnet',
      rpcUrl: 'https://api.devnet.solana.com',
      explorerUrl: 'https://explorer.solana.com/?cluster=devnet',
      faucet: 'https://solfaucet.com',
    },
  },
};
```

### 9.2 Transaction Simulation

```typescript
/**
 * Transaction Simulation Tests
 */

import { EthereumAdapter } from '../../adapters/EthereumAdapter';
import { Tenderly } from '../../services/simulation/Tenderly';

describe('Transaction Simulation', () => {
  let adapter: EthereumAdapter;
  let simulator: Tenderly;

  beforeEach(() => {
    adapter = new EthereumAdapter(TEST_NETWORKS.ethereum.sepolia.rpcUrl);
    simulator = new Tenderly(process.env.TENDERLY_API_KEY);
  });

  it('should simulate successful transaction', async () => {
    // Arrange
    const tx = {
      from: '0x1234567890123456789012345678901234567890',
      to: '0x0987654321098765432109876543210987654321',
      value: '0.1',
      gasLimit: 21000,
    };

    // Act
    const simulation = await simulator.simulateTransaction(tx);

    // Assert
    expect(simulation.success).toBe(true);
    expect(simulation.gasUsed).toBeLessThanOrEqual(21000);
    expect(simulation.events).toHaveLength(0); // Simple transfer has no events
  });

  it('should detect transaction failure in simulation', async () => {
    // Arrange
    const tx = {
      from: '0x0000000000000000000000000000000000000000', // Zero address (invalid)
      to: '0x0987654321098765432109876543210987654321',
      value: '0.1',
      gasLimit: 21000,
    };

    // Act
    const simulation = await simulator.simulateTransaction(tx);

    // Assert
    expect(simulation.success).toBe(false);
    expect(simulation.error).toContain('Invalid sender');
  });

  it('should simulate contract interaction', async () => {
    // Arrange
    const erc20Transfer = {
      from: '0x1234567890123456789012345678901234567890',
      to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC contract
      data: '0xa9059cbb...', // transfer() function call
      gasLimit: 100000,
    };

    // Act
    const simulation = await simulator.simulateTransaction(erc20Transfer);

    // Assert
    expect(simulation.success).toBe(true);
    expect(simulation.events).toContainEqual(
      expect.objectContaining({
        name: 'Transfer',
        args: expect.objectContaining({
          from: expect.any(String),
          to: expect.any(String),
          value: expect.any(String),
        }),
      })
    );
  });
});
```

### 9.3 Multi-Chain Testing

```typescript
/**
 * Multi-Chain Adapter Tests
 */

import { BlockchainAdapterFactory } from '../../adapters/BlockchainAdapterFactory';
import { ChainType } from '../../types/blockchain';

describe('Multi-Chain Adapter Tests', () => {
  describe('Ethereum Adapter', () => {
    let adapter: IBlockchainAdapter;

    beforeEach(() => {
      adapter = BlockchainAdapterFactory.create(ChainType.ETHEREUM, {
        network: TEST_NETWORKS.ethereum.sepolia,
      });
    });

    it('should get balance on Ethereum', async () => {
      // Arrange
      const address = '0x1234567890123456789012345678901234567890';

      // Act
      const balance = await adapter.getBalance(address);

      // Assert
      expect(balance).toBeDefined();
      expect(typeof balance).toBe('string');
      expect(parseFloat(balance)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Solana Adapter', () => {
    let adapter: IBlockchainAdapter;

    beforeEach(() => {
      adapter = BlockchainAdapterFactory.create(ChainType.SOLANA, {
        network: TEST_NETWORKS.solana.devnet,
      });
    });

    it('should get balance on Solana', async () => {
      // Arrange
      const address = 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK';

      // Act
      const balance = await adapter.getBalance(address);

      // Assert
      expect(balance).toBeDefined();
      expect(typeof balance).toBe('string');
    });
  });

  describe('Adapter Consistency', () => {
    it('should have consistent interface across chains', async () => {
      // Arrange
      const ethAdapter = BlockchainAdapterFactory.create(ChainType.ETHEREUM);
      const solAdapter = BlockchainAdapterFactory.create(ChainType.SOLANA);

      // Assert - All adapters should have same methods
      expect(typeof ethAdapter.getBalance).toBe('function');
      expect(typeof ethAdapter.signTransaction).toBe('function');
      expect(typeof ethAdapter.broadcastTransaction).toBe('function');

      expect(typeof solAdapter.getBalance).toBe('function');
      expect(typeof solAdapter.signTransaction).toBe('function');
      expect(typeof solAdapter.broadcastTransaction).toBe('function');
    });
  });
});
```

---

## 10. Test Data Management

### 10.1 Test Fixtures

Create reusable test data fixtures:

```typescript
/**
 * Test Fixtures
 * Centralized test data for consistent testing
 */

// src/__tests__/fixtures/wallets.ts
export const walletFixtures = {
  validWallet: {
    address: '0x1234567890123456789012345678901234567890',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    mnemonic: 'test test test test test test test test test test test junk',
    balance: '1.234567890123456789',
  },
  emptyWallet: {
    address: '0x0987654321098765432109876543210987654321',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    balance: '0',
  },
};

// src/__tests__/fixtures/transactions.ts
export const transactionFixtures = {
  validTransaction: {
    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    from: '0x1234567890123456789012345678901234567890',
    to: '0x0987654321098765432109876543210987654321',
    value: '0.1',
    gasLimit: 21000,
    gasPrice: '20',
    nonce: 5,
    status: 'confirmed',
    blockNumber: 12345678,
  },
  pendingTransaction: {
    hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
    from: '0x1234567890123456789012345678901234567890',
    to: '0x0987654321098765432109876543210987654321',
    value: '0.5',
    gasLimit: 21000,
    gasPrice: '25',
    nonce: 6,
    status: 'pending',
    blockNumber: null,
  },
};

// src/__tests__/fixtures/messages.ts
export const messageFixtures = {
  textMessage: {
    id: 'msg-1',
    sessionId: 'session-1',
    from: '0x1234567890123456789012345678901234567890',
    to: '0x0987654321098765432109876543210987654321',
    content: 'Hello, this is a test message',
    timestamp: Date.now(),
    encrypted: true,
    status: 'sent',
  },
  imageMessage: {
    id: 'msg-2',
    sessionId: 'session-1',
    from: '0x1234567890123456789012345678901234567890',
    to: '0x0987654321098765432109876543210987654321',
    content: 'Check out this image!',
    mediaUrl: 'https://example.com/image.jpg',
    mediaType: 'image',
    timestamp: Date.now(),
    encrypted: true,
    status: 'delivered',
  },
};
```

**Usage:**

```typescript
import { walletFixtures } from '../fixtures/wallets';

describe('WalletService', () => {
  it('should process valid wallet', () => {
    const wallet = walletFixtures.validWallet;
    const result = walletService.validate(wallet);
    expect(result.valid).toBe(true);
  });
});
```

### 10.2 Factory Pattern for Test Data

Create factories for dynamic test data generation:

```typescript
/**
 * Test Data Factories
 */

// src/__tests__/factories/WalletFactory.ts
export class WalletFactory {
  static create(overrides: Partial<Wallet> = {}): Wallet {
    return {
      address: this.randomAddress(),
      privateKey: this.randomPrivateKey(),
      mnemonic: this.randomMnemonic(),
      balance: '0',
      createdAt: Date.now(),
      ...overrides,
    };
  }

  static createMany(count: number, overrides: Partial<Wallet> = {}): Wallet[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  private static randomAddress(): string {
    const hex = '0x' + Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return hex;
  }

  private static randomPrivateKey(): string {
    const hex = '0x' + Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return hex;
  }

  private static randomMnemonic(): string {
    const words = ['test', 'word', 'mnemonic', 'phrase', 'random', 'crypto'];
    return Array.from({ length: 12 }, () =>
      words[Math.floor(Math.random() * words.length)]
    ).join(' ');
  }
}

// Usage
const wallet = WalletFactory.create({ balance: '10.5' });
const wallets = WalletFactory.createMany(100);
```

### 10.3 Test Database Seeding

```typescript
/**
 * Test Database Seeding
 */

// src/__tests__/helpers/seedDatabase.ts
export async function seedDatabase(db: Database) {
  // Clear existing data
  await db.query('DELETE FROM wallets');
  await db.query('DELETE FROM transactions');
  await db.query('DELETE FROM messages');
  await db.query('DELETE FROM contacts');

  // Seed wallets
  const wallets = WalletFactory.createMany(10);
  for (const wallet of wallets) {
    await db.query(
      'INSERT INTO wallets (address, encrypted_private_key, balance) VALUES (?, ?, ?)',
      [wallet.address, wallet.privateKey, wallet.balance]
    );
  }

  // Seed transactions
  const transactions = TransactionFactory.createMany(50);
  for (const tx of transactions) {
    await db.query(
      'INSERT INTO transactions (hash, from_address, to_address, value, status) VALUES (?, ?, ?, ?, ?)',
      [tx.hash, tx.from, tx.to, tx.value, tx.status]
    );
  }

  // Seed messages
  const messages = MessageFactory.createMany(200);
  for (const msg of messages) {
    await db.query(
      'INSERT INTO messages (id, session_id, from_address, to_address, content, encrypted) VALUES (?, ?, ?, ?, ?, ?)',
      [msg.id, msg.sessionId, msg.from, msg.to, msg.content, msg.encrypted]
    );
  }

  console.log('Database seeded with test data');
}

// Usage in tests
describe('Transaction Query Tests', () => {
  beforeAll(async () => {
    await seedDatabase(db);
  });

  it('should query recent transactions', async () => {
    const recent = await db.query(
      'SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 10'
    );
    expect(recent).toHaveLength(10);
  });
});
```

---

## 11. CI/CD Testing

### 11.1 GitHub Actions Workflow

**File**: `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test -- --coverage --maxWorkers=2

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest

    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: deyond_test
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run integration tests
        run: npm run test:integration
        env:
          REDIS_URL: redis://localhost:6379
          DATABASE_URL: postgresql://postgres:testpassword@localhost:5432/deyond_test

  e2e-tests-ios:
    name: E2E Tests (iOS)
    runs-on: macos-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup iOS Simulator
        run: |
          xcrun simctl create "iPhone 14 Pro" "iPhone 14 Pro"

      - name: Build iOS app for testing
        run: npm run build:ios:e2e

      - name: Run Detox E2E tests
        run: npm run test:e2e:ios

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-test-artifacts
          path: |
            e2e/artifacts/
            e2e/screenshots/

  e2e-tests-android:
    name: E2E Tests (Android)
    runs-on: macos-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup Android Emulator
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 31
          target: google_apis
          arch: x86_64
          profile: pixel_5
          script: npm run test:e2e:android

  lint:
    name: Linting
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript type check
        run: npm run type-check

  security-scan:
    name: Security Scanning
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### 11.2 Automated Test Runs

**Test Scripts** (`package.json`):

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=__tests__/",
    "test:integration": "jest --testPathPattern=integration/",
    "test:e2e:ios": "detox test --configuration ios.sim.debug",
    "test:e2e:android": "detox test --configuration android.emu.debug",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
    "type-check": "tsc --noEmit"
  }
}
```

### 11.3 Test Reporting

**Jest HTML Reporter:**

```bash
npm install --save-dev jest-html-reporter
```

**Configuration** (`jest.config.js`):

```javascript
module.exports = {
  preset: 'jest-expo',
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'Deyond Test Report',
        outputPath: 'test-report/index.html',
        includeFailureMsg: true,
        includeSuiteFailure: true,
        includeConsoleLog: true,
      },
    ],
  ],
};
```

**Coverage Visualization:**

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

---

## 12. Test Quality Standards

### 12.1 Code Quality Requirements (from system_prompt_additions.md)

**NEVER write tests that:**

1. Use `test.skip()` for bugs - **FIX BUGS IMMEDIATELY**
2. Only test happy paths - **TEST ERROR PATHS TOO**
3. Have no assertions - **EVERY TEST MUST ASSERT**
4. Depend on external state - **TESTS MUST BE ISOLATED**
5. Are flaky or non-deterministic - **TESTS MUST BE RELIABLE**
6. Ignore resource cleanup - **CLEAN UP IN afterEach()**

**ALWAYS:**

1. **Write comprehensive tests BEFORE implementing features (TDD)**
2. **Include schema validation for all external data (Zod)**
3. **Use proper type guards for runtime type checking**
4. **Document known bugs immediately and fix them before continuing**
5. **Implement proper separation of concerns**
6. **Use static analysis tools (ESLint, TypeScript strict mode)**
7. **Properly type all async operations with explicit Promise types**
8. **Close all resources in finally blocks or use try-with-resources pattern**

### 12.2 Testing Requirements

**From system_prompt_additions.md:**

- ✅ Write failing tests first (TDD), then implement to make them pass
- ✅ Never commit code with `test.skip()` for bugs - fix the bugs
- ✅ Include property-based testing for data structures (fast-check)
- ✅ Test error handling paths, not just happy paths
- ✅ Validate all edge cases and boundary conditions
- ✅ Test timeout scenarios for async operations
- ✅ Test cleanup/teardown in all cases

### 12.3 Test Review Checklist

Before merging tests, verify:

- ✅ **No TypeScript errors** (`npm run type-check` passes)
- ✅ **No ESLint warnings** (`npm run lint` passes)
- ✅ **All tests pass** (including integration and E2E)
- ✅ **No unhandled promise rejections**
- ✅ **All resources properly cleaned up** (connections, timers, event listeners)
- ✅ **Error handling is comprehensive and consistent**
- ✅ **Tests are modular and follow Single Responsibility Principle**
- ✅ **Documentation matches implementation**
- ✅ **No memory leaks** (event listeners removed, streams closed)
- ✅ **Schema validation for all external inputs**
- ✅ **Coverage meets minimum thresholds** (80%+ overall, 95%+ critical)

### 12.4 TDD Workflow

**Strict TDD Process:**

1. **Write a failing test** that defines expected behavior
   ```typescript
   it('should create wallet with valid mnemonic', async () => {
     const wallet = await walletManager.createWallet('password');
     expect(wallet.mnemonic.split(' ')).toHaveLength(12);
   });
   ```

2. **Run the test** - it should fail (RED)
   ```bash
   npm test
   # FAIL: walletManager.createWallet is not defined
   ```

3. **Implement minimum code** to make test pass
   ```typescript
   class WalletManager {
     async createWallet(password: string): Promise<Wallet> {
       const mnemonic = generateMnemonic();
       return { mnemonic, address: '', privateKey: '' };
     }
   }
   ```

4. **Run the test** - it should pass (GREEN)
   ```bash
   npm test
   # PASS: should create wallet with valid mnemonic
   ```

5. **Refactor** while keeping tests green
   ```typescript
   class WalletManager {
     async createWallet(password: string): Promise<Wallet> {
       this.validatePassword(password);
       const mnemonic = this.cryptoService.generateMnemonic();
       const wallet = await this.deriveWalletFromMnemonic(mnemonic);
       return this.encryptWallet(wallet, password);
     }
   }
   ```

6. **Repeat** for next requirement

### 12.5 Example: Complete TDD Cycle

```typescript
/**
 * Complete TDD Example: Password Validation
 */

// STEP 1: Write failing test
describe('PasswordValidator', () => {
  it('should reject password shorter than 8 characters', () => {
    const validator = new PasswordValidator();
    const result = validator.validate('short');

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });
});

// Run test -> FAIL (PasswordValidator doesn't exist)

// STEP 2: Implement to pass
class PasswordValidator {
  validate(password: string): ValidationResult {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Run test -> PASS

// STEP 3: Add more test cases
it('should require at least one uppercase letter', () => {
  const validator = new PasswordValidator();
  const result = validator.validate('lowercase123');

  expect(result.valid).toBe(false);
  expect(result.errors).toContain('Password must contain at least one uppercase letter');
});

// Run test -> FAIL

// STEP 4: Implement
class PasswordValidator {
  validate(password: string): ValidationResult {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Run test -> PASS

// STEP 5: Refactor
class PasswordValidator {
  private readonly MIN_LENGTH = 8;
  private readonly UPPERCASE_REGEX = /[A-Z]/;
  private readonly LOWERCASE_REGEX = /[a-z]/;
  private readonly NUMBER_REGEX = /[0-9]/;

  validate(password: string): ValidationResult {
    const errors: string[] = [];

    this.checkLength(password, errors);
    this.checkUppercase(password, errors);
    this.checkLowercase(password, errors);
    this.checkNumbers(password, errors);

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private checkLength(password: string, errors: string[]): void {
    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters`);
    }
  }

  private checkUppercase(password: string, errors: string[]): void {
    if (!this.UPPERCASE_REGEX.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
  }

  // ... other methods
}

// Run tests -> ALL PASS
```

---

## Summary

This Testing Strategy ensures:

1. **TDD Compliance**: All code written test-first
2. **High Coverage**: 80%+ overall, 95%+ for critical paths
3. **Comprehensive Testing**: Unit, integration, E2E, security, performance
4. **Automated CI/CD**: Tests run on every commit
5. **Quality Standards**: Follows strict code quality requirements
6. **No Skipped Tests**: Bugs fixed immediately, never deferred
7. **Property-Based Testing**: Edge cases validated with fast-check
8. **Multi-Platform**: Tests for iOS, Android, blockchain networks
9. **Security First**: Penetration testing, fuzzing, static analysis
10. **Performance Validated**: Load testing, profiling, leak detection

**Test Coverage Targets:**

| Category | Minimum Coverage | Target Coverage |
|----------|------------------|-----------------|
| Overall | 80% | 90% |
| Wallet/Crypto | 95% | 100% |
| Security/Auth | 95% | 100% |
| Business Logic | 90% | 95% |
| UI Components | 70% | 80% |
| Utilities | 85% | 90% |

**Test Execution:**

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e:ios
npm run test:e2e:android

# Coverage report
npm run test:coverage

# Watch mode (TDD)
npm run test:watch

# CI mode
npm run test:ci
```

---

## References

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Detox Documentation](https://wix.github.io/Detox/)
- [fast-check Documentation](https://fast-check.dev/)
- [OWASP Mobile Security Testing Guide](https://owasp.org/www-project-mobile-security-testing-guide/)
- [System Prompt Additions](./.claude/system_prompt_additions.md)

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-19
**Next Review**: 2025-12-19
