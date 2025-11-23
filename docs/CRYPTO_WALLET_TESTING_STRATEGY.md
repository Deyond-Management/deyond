# Testing Strategy
## Crypto Wallet App - Comprehensive Testing Plan

**Version**: 2.0
**Last Updated**: 2025-11-18
**Philosophy**: Test-Driven Development (TDD)

---

## Testing Philosophy

### Core Principles

1. **Write Tests First** (TDD)
   - Write failing test
   - Write minimal code to pass
   - Refactor and repeat

2. **Test What Matters**
   - Critical security functions: 100% coverage
   - Business logic: 90% coverage
   - UI components: 70% coverage
   - Happy path + edge cases + error cases

3. **Fast Feedback Loop**
   - Unit tests: < 5 seconds total
   - Integration tests: < 30 seconds total
   - E2E tests: < 5 minutes total

4. **Maintainable Tests**
   - Clear test names
   - Minimal mocking
   - DRY principles
   - Independent tests

---

## Test Pyramid

```
      /\
     /  \     10% - E2E Tests (Critical Flows)
    /────\
   /──────\   20% - Integration Tests (Module Interactions)
  /────────\
 /──────────\ 70% - Unit Tests (Functions, Components)
/────────────\
```

**Target Distribution**:
- **Unit Tests**: 70% of total tests
- **Integration Tests**: 20% of total tests
- **E2E Tests**: 10% of total tests

---

## Testing Levels

### 1. Unit Tests

**Purpose**: Test individual functions and components in isolation

**Coverage Target**: 90%

**Tools**:
- Jest
- React Testing Library
- jest.mock()

**What to Test**:
- ✅ Pure functions
- ✅ Utility functions
- ✅ Redux reducers
- ✅ Redux selectors
- ✅ Component rendering
- ✅ Component props
- ✅ Event handlers
- ✅ Validation logic
- ✅ Formatting functions

**Example Test Structure**:
```typescript
describe('CryptoUtils', () => {
  describe('encrypt', () => {
    it('should encrypt data with password', async () => {
      const data = 'secret';
      const password = 'pass123';

      const encrypted = await CryptoUtils.encrypt(data, password);

      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.salt).toBeDefined();
    });

    it('should produce different ciphertext each time', async () => {
      const data = 'secret';
      const password = 'pass123';

      const encrypted1 = await CryptoUtils.encrypt(data, password);
      const encrypted2 = await CryptoUtils.encrypt(data, password);

      expect(encrypted1.ciphertext).not.toEqual(encrypted2.ciphertext);
    });

    it('should fail with empty password', async () => {
      const data = 'secret';
      const password = '';

      await expect(CryptoUtils.encrypt(data, password)).rejects.toThrow();
    });
  });
});
```

---

### 2. Integration Tests

**Purpose**: Test interaction between modules

**Coverage Target**: 80%

**Tools**:
- Jest
- React Testing Library
- Mock API responses

**What to Test**:
- ✅ Redux store + reducers + sagas
- ✅ Manager + infrastructure layer
- ✅ Component + Redux integration
- ✅ Navigation flows
- ✅ Form validation + submission
- ✅ API integration
- ✅ Storage integration

**Example Test Structure**:
```typescript
describe('Send Transaction Flow (Integration)', () => {
  it('should create and send transaction successfully', async () => {
    // Arrange
    const mockProvider = createMockProvider();
    const transactionManager = new TransactionManager(mockNetwork);
    const walletManager = new WalletManager();

    const wallet = await walletManager.createWallet('password');

    // Act
    const transaction = await transactionManager.createTransaction(
      wallet.address,
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      '0.1'
    );

    const response = await transactionManager.sendTransaction(
      wallet.privateKey,
      transaction
    );

    // Assert
    expect(response.hash).toBeDefined();
    expect(response.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });

  it('should fail with insufficient balance', async () => {
    // Arrange
    const mockProvider = createMockProvider({ balance: '0' });
    const transactionManager = new TransactionManager(mockNetwork);

    // Act & Assert
    await expect(
      transactionManager.createTransaction(/*...*/)
    ).rejects.toThrow('Insufficient balance');
  });
});
```

---

### 3. End-to-End Tests

**Purpose**: Test complete user workflows

**Coverage Target**: Critical paths only

**Tools**:
- Detox
- Appium (alternative)
- Real devices + emulators

**What to Test**:
- ✅ Complete wallet creation flow
- ✅ Complete send transaction flow
- ✅ Complete BLE chat session flow
- ✅ Settings and configuration flows
- ❌ NOT every single UI interaction
- ❌ NOT minor edge cases

**Critical Paths**:
1. Create wallet → View balance
2. Send transaction → Confirm completion
3. Receive funds → View in history
4. Start BLE chat → Send message
5. Import wallet → Access funds

**Example E2E Test**:
```typescript
describe('Wallet Creation E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should create new wallet successfully', async () => {
    // Welcome screen
    await expect(element(by.id('welcome-screen'))).toBeVisible();
    await element(by.id('create-wallet-button')).tap();

    // Password screen
    await element(by.id('password-input')).typeText('SecurePass123!');
    await element(by.id('password-confirm-input')).typeText('SecurePass123!');
    await element(by.id('continue-button')).tap();

    // Mnemonic screen
    await expect(element(by.id('mnemonic-display'))).toBeVisible();
    const mnemonic = await element(by.id('mnemonic-text')).getText();
    await element(by.id('saved-button')).tap();

    // Verification screen
    // ... verification logic ...
    await element(by.id('confirm-button')).tap();

    // Success - should see home screen
    await expect(element(by.id('home-screen'))).toBeVisible();
    await expect(element(by.id('balance-display'))).toBeVisible();
  });
});
```

---

## Test Coverage Requirements

### By Component Type

| Component Type | Coverage | Critical | Priority |
|----------------|----------|----------|----------|
| **Crypto Functions** | 100% | ✅ Yes | P0 |
| **Wallet Management** | 100% | ✅ Yes | P0 |
| **Transaction Management** | 95% | ✅ Yes | P0 |
| **BLE Session Protocol** | 90% | ⚠️ Medium | P1 |
| **Chat Encryption** | 100% | ✅ Yes | P1 |
| **Redux Reducers** | 100% | ✅ Yes | P0 |
| **Redux Selectors** | 90% | ⚠️ Medium | P1 |
| **Utility Functions** | 90% | ⚠️ Medium | P1 |
| **UI Components** | 70% | ❌ No | P2 |
| **Screens** | 60% | ❌ No | P2 |

### Coverage Enforcement

```json
// jest.config.js
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    },
    "./src/core/": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    },
    "./src/core/crypto/": {
      "branches": 100,
      "functions": 100,
      "lines": 100,
      "statements": 100
    }
  }
}
```

---

## Testing Workflows

### Pre-Commit (Local)
```bash
# 1. Run unit tests
npm test

# 2. Run linter
npm run lint

# 3. Type check
npm run type-check

# If all pass, commit is allowed
```

### Pre-Push (CI/CD)
```bash
# 1. Run all unit tests
npm test

# 2. Run integration tests
npm run test:integration

# 3. Check coverage threshold
npm run test:coverage

# 4. Run linter
npm run lint

# 5. Build app
npm run build

# If all pass, push is allowed
```

### Pre-Release
```bash
# 1. All above checks

# 2. Run E2E tests
npm run test:e2e

# 3. Performance tests
npm run test:perf

# 4. Security audit
npm audit

# 5. Manual QA on real devices

# If all pass, ready for release
```

---

## Test Organization

### Directory Structure

```
src/
└── __tests__/
    ├── unit/
    │   ├── core/
    │   │   ├── crypto.test.ts
    │   │   ├── WalletManager.test.ts
    │   │   ├── TransactionManager.test.ts
    │   │   ├── BLESessionManager.test.ts
    │   │   └── ChatManager.test.ts
    │   ├── utils/
    │   │   ├── format.test.ts
    │   │   └── validation.test.ts
    │   └── components/
    │       ├── Button.test.tsx
    │       └── TokenCard.test.tsx
    │
    ├── integration/
    │   ├── wallet-flow.test.ts
    │   ├── transaction-flow.test.ts
    │   ├── chat-flow.test.ts
    │   └── redux-store.test.ts
    │
    ├── e2e/
    │   ├── create-wallet.e2e.ts
    │   ├── send-transaction.e2e.ts
    │   ├── ble-chat.e2e.ts
    │   └── settings.e2e.ts
    │
    └── helpers/
        ├── mockData.ts
        ├── mockProviders.ts
        └── testUtils.tsx
```

### Naming Conventions

- **Unit Tests**: `{ComponentName}.test.tsx` or `{FunctionName}.test.ts`
- **Integration Tests**: `{feature}-flow.test.ts`
- **E2E Tests**: `{feature}.e2e.ts`

---

## Mocking Strategy

### What to Mock

✅ **Always Mock**:
- External API calls (RPC providers)
- Storage operations (AsyncStorage)
- Native modules (Camera, Bluetooth)
- Time-dependent functions (Date.now())
- Random functions (Math.random())

❌ **Never Mock**:
- Crypto operations (test real implementation)
- Business logic (WalletManager, TransactionManager)
- Redux reducers
- Utility functions

### Mock Examples

```typescript
// Mock RPC Provider
jest.mock('ethers', () => ({
  JsonRpcProvider: jest.fn().mockImplementation(() => ({
    getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
    getTransactionCount: jest.fn().mockResolvedValue(0),
    estimateGas: jest.fn().mockResolvedValue(BigInt('21000')),
    // ...
  })),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-ble-plx
jest.mock('react-native-ble-plx', () => ({
  BleManager: jest.fn().mockImplementation(() => ({
    startDeviceScan: jest.fn(),
    connectToDevice: jest.fn(),
    // ...
  })),
}));
```

---

## Test Data Management

### Test Wallets

```typescript
export const TEST_WALLETS = {
  wallet1: {
    mnemonic: 'test test test test test test test test test test test junk',
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  },
  wallet2: {
    mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    privateKey: '0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63',
  },
};
```

### Test Networks

```typescript
export const TEST_NETWORKS = {
  localhost: {
    id: 'localhost',
    name: 'Localhost',
    chainId: 1337,
    rpcUrl: 'http://localhost:8545',
    currencySymbol: 'ETH',
    isTestnet: true,
  },
  sepolia: {
    id: 'sepolia',
    name: 'Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://rpc.sepolia.org',
    currencySymbol: 'SepoliaETH',
    isTestnet: true,
  },
};
```

---

## Security Testing

### Crypto Testing Checklist

- [x] **Encryption/Decryption**
  - [x] Test with various data sizes
  - [x] Test with special characters
  - [x] Test wrong password fails
  - [x] Test tampering detection

- [x] **Key Derivation**
  - [x] Test deterministic output
  - [x] Test different salts produce different keys
  - [x] Test performance (should be slow)

- [ ] **Signing**
  - [x] Test signature generation
  - [ ] Test signature verification ⚠️
  - [x] Test different messages produce different signatures
  - [ ] Test signature forgery detection

- [x] **BLE Session**
  - [x] Test ECDH key exchange
  - [x] Test handshake signature verification
  - [x] Test session expiry
  - [ ] Test man-in-the-middle protection

### Vulnerability Testing

```typescript
describe('Security Vulnerabilities', () => {
  it('should not expose private key in error messages', async () => {
    const manager = new WalletManager();

    try {
      await manager.importFromPrivateKey('invalid', 'password');
    } catch (error) {
      expect(error.message).not.toContain('invalid');
    }
  });

  it('should not log sensitive data', async () => {
    const consoleSpy = jest.spyOn(console, 'log');

    const manager = new WalletManager();
    await manager.createWallet('password');

    const calls = consoleSpy.mock.calls.flat().join(' ');
    expect(calls).not.toMatch(/0x[a-fA-F0-9]{64}/); // No private keys
  });

  it('should clear memory after encryption', async () => {
    const data = 'sensitive';
    const password = 'password';

    const encrypted = await CryptoUtils.encrypt(data, password);

    // Original data should not be in memory anymore
    // (This is hard to test, but document the expectation)
  });
});
```

---

## Performance Testing

### Benchmarks

```typescript
describe('Performance Benchmarks', () => {
  it('should derive key in reasonable time', async () => {
    const start = Date.now();

    await CryptoUtils.deriveKey('password', new Uint8Array(32));

    const duration = Date.now() - start;

    // Should take at least 100ms (PBKDF2 is intentionally slow)
    expect(duration).toBeGreaterThan(100);

    // But not too slow (< 2 seconds on mobile)
    expect(duration).toBeLessThan(2000);
  });

  it('should render token list efficiently', () => {
    const { getAllByTestId } = render(
      <TokenList tokens={generateMockTokens(100)} />
    );

    const start = performance.now();
    getAllByTestId('token-item');
    const duration = performance.now() - start;

    // Rendering 100 items should be fast
    expect(duration).toBeLessThan(100); // 100ms
  });
});
```

### Memory Leak Testing

```typescript
describe('Memory Leaks', () => {
  it('should cleanup BLE listeners on unmount', () => {
    const { unmount } = render(<ChatScreen />);

    const listenerCount = BleManager.listeners.length;

    unmount();

    expect(BleManager.listeners.length).toBeLessThan(listenerCount);
  });
});
```

---

## Accessibility Testing

### A11y Checklist

- [ ] Screen reader support
  - [ ] All interactive elements have labels
  - [ ] Images have alt text
  - [ ] Proper heading hierarchy

- [ ] Touch targets
  - [ ] Minimum 44x44 points
  - [ ] Adequate spacing between targets

- [ ] Color contrast
  - [ ] Text meets WCAG AA (4.5:1)
  - [ ] Icons meet WCAG AA (3:1)

- [ ] Keyboard navigation
  - [ ] Tab order logical
  - [ ] Focus indicators visible

### A11y Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('should have no a11y violations on home screen', async () => {
    const { container } = render(<HomeScreen />);

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
```

---

## Continuous Testing

### GitHub Actions CI/CD

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run unit tests
        run: npm test -- --coverage

      - name: Run integration tests
        run: npm run test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          files: ./coverage/coverage-final.json

      - name: Check coverage threshold
        run: npm run test:coverage
```

---

## Test Maintenance

### When to Update Tests

✅ **Always update tests when**:
- Adding new features
- Fixing bugs
- Refactoring code
- Changing API contracts

❌ **Don't update tests when**:
- Only changing UI styling (if logic unchanged)
- Renaming variables (if behavior unchanged)
- Adding comments

### Flaky Tests

**Rule**: Fix or delete flaky tests immediately.

**Common causes**:
- Timing issues (use `waitFor`)
- Test interdependence (ensure isolation)
- External dependencies (mock them)
- Random data (use seeds)

---

## Test Reporting

### Coverage Reports

```bash
# Generate HTML coverage report
npm run test:coverage

# Open report
open coverage/lcov-report/index.html
```

### Test Results

```bash
# Run tests with detailed output
npm test -- --verbose

# Run tests with watch mode
npm test -- --watch

# Run specific test file
npm test -- WalletManager.test.ts
```

---

## Testing Checklist (Per Feature)

Before marking a feature as "done":

- [ ] Unit tests written and passing
- [ ] Integration tests written (if applicable)
- [ ] E2E tests written (for critical paths)
- [ ] Edge cases covered
- [ ] Error cases covered
- [ ] Security implications tested
- [ ] Performance acceptable
- [ ] Accessibility verified
- [ ] Coverage threshold met
- [ ] No flaky tests
- [ ] Tests documented
- [ ] Manual testing on real device

---

## Phase 2 Testing Plan

### Week 1: Design System
- [ ] Test all base components
- [ ] Test form validation
- [ ] Test responsive layout

### Week 2: Onboarding
- [ ] Test password validation
- [ ] Test mnemonic generation
- [ ] Test verification logic
- [ ] E2E onboarding flow

### Week 3: Home Screen
- [ ] Test balance fetching
- [ ] Test account switching
- [ ] Test network switching
- [ ] Integration with Redux

### Week 4: Send Transaction
- [ ] Test input validation
- [ ] Test gas estimation
- [ ] Test transaction signing
- [ ] E2E send flow

### Week 5: Receive & History
- [ ] Test QR code generation
- [ ] Test transaction list
- [ ] Test filtering

### Week 6: BLE Chat
- [ ] Test device discovery
- [ ] Test session protocol
- [ ] Test message encryption
- [ ] E2E chat flow

### Week 7: Settings
- [ ] Test password change
- [ ] Test network management
- [ ] Test theme switching

### Week 8: Final Testing
- [ ] All E2E tests passing
- [ ] Coverage > 80%
- [ ] No flaky tests
- [ ] Performance benchmarks met
- [ ] Security audit checklist complete

---

**Last Updated**: 2025-11-18
**Next Review**: End of Week 4
