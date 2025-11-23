# Architecture Document
## Crypto Wallet App - Technical Architecture

**Version**: 2.0
**Last Updated**: 2025-11-18
**Architecture Style**: Clean Architecture + Redux Pattern

---

## Overview

The Crypto Wallet App follows a layered architecture pattern, separating concerns between UI, business logic, and data management. The architecture is designed for:

- **Security**: Sensitive operations isolated
- **Testability**: TDD-friendly structure
- **Scalability**: Easy to add new features
- **Maintainability**: Clear separation of concerns
- **Performance**: Optimized for mobile devices

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Presentation Layer                     │
│  (React Native Components, Screens, Navigation)             │
└──────────────────┬──────────────────────────────────────────┘
                   │ React Hooks, Redux Selectors
┌──────────────────▼──────────────────────────────────────────┐
│                    State Management Layer                    │
│          (Redux Store, Actions, Reducers, Sagas)            │
└──────────────────┬──────────────────────────────────────────┘
                   │ Dispatch Actions, Call Managers
┌──────────────────▼──────────────────────────────────────────┐
│                     Business Logic Layer                     │
│    (WalletManager, TransactionManager, ChatManager, etc.)   │
└──────────────────┬──────────────────────────────────────────┘
                   │ Use Crypto Utils, Call RPC
┌──────────────────▼──────────────────────────────────────────┐
│                      Infrastructure Layer                    │
│   (CryptoUtils, RPC Providers, Storage, BLE, Keychain)      │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer Breakdown

### 1. Presentation Layer

**Responsibility**: User interface and user interaction

**Components**:
- **Screens**: Full-screen views (e.g., `HomeScreen`, `SendScreen`)
- **Components**: Reusable UI components (e.g., `Button`, `TokenCard`)
- **Navigation**: React Navigation setup
- **Hooks**: Custom React hooks for UI logic

**Technologies**:
- React Native
- React Navigation
- Lottie (animations)
- React Hook Form (forms)

**Rules**:
- ❌ NO business logic in components
- ❌ NO direct crypto operations
- ❌ NO direct storage access
- ✅ Only UI state management
- ✅ Call Redux actions
- ✅ Use selectors for data

**Example**:
```typescript
// ✅ Good: Component uses Redux
function HomeScreen() {
  const dispatch = useDispatch();
  const balance = useSelector(selectBalance);

  const handleRefresh = () => {
    dispatch(fetchBalance());
  };

  return <View>{/* UI */}</View>;
}

// ❌ Bad: Component has business logic
function HomeScreen() {
  const [balance, setBalance] = useState('0');

  const fetchBalance = async () => {
    const provider = new JsonRpcProvider(/*...*/);
    const balance = await provider.getBalance(/*...*/);
    setBalance(balance);
  };

  return <View>{/* UI */}</View>;
}
```

---

### 2. State Management Layer

**Responsibility**: Application state and data flow

**Components**:
- **Redux Store**: Centralized state
- **Slices**: Feature-based state modules
  - `walletSlice`: Wallet state
  - `transactionSlice`: Transaction state
  - `chatSlice`: Chat state
  - `networkSlice`: Network state
- **Sagas** (Future): Side effects management
- **Selectors**: Derived state computation
- **Actions**: State mutations

**Technologies**:
- Redux Toolkit
- Redux Persist
- Redux Saga (future)
- Reselect (memoized selectors)

**State Structure**:
```typescript
{
  wallet: {
    currentWallet: Wallet | null,
    accounts: Account[],
    isLocked: boolean,
    isInitialized: boolean
  },
  transaction: {
    transactions: Transaction[],
    pendingTransactions: Transaction[],
    loading: boolean,
    error: string | null
  },
  chat: {
    sessions: BLESession[],
    messages: Record<string, ChatMessage[]>,
    activeSessionId: string | null,
    isScanning: boolean
  },
  network: {
    networks: Network[],
    currentNetwork: Network | null
  }
}
```

**Rules**:
- ✅ All app state goes through Redux
- ✅ Immutable state updates
- ✅ Actions are serializable
- ❌ NO business logic in reducers
- ❌ NO side effects in reducers
- ❌ NO direct manager calls in components

---

### 3. Business Logic Layer

**Responsibility**: Core application logic and orchestration

**Managers**:

#### WalletManager
```typescript
class WalletManager {
  createWallet(password: string): Promise<WalletData>
  importFromMnemonic(mnemonic: string, password: string): Promise<WalletData>
  importFromPrivateKey(privateKey: string, password: string): Promise<WalletData>
  deriveAccount(mnemonic: string, index: number): Promise<Account>
  signMessage(privateKey: string, message: string): Promise<string>
  verifySignature(message: string, signature: string, address: string): Promise<boolean>
}
```

#### TransactionManager
```typescript
class TransactionManager {
  getBalance(address: string): Promise<string>
  createTransaction(from: string, to: string, value: string): Promise<TransactionRequest>
  estimateGas(transaction: TransactionRequest): Promise<bigint>
  sendTransaction(privateKey: string, transaction: TransactionRequest): Promise<TransactionResponse>
  waitForTransaction(txHash: string, confirmations: number): Promise<Transaction>
  getTransaction(txHash: string): Promise<Transaction | null>
}
```

#### BLESessionManager
```typescript
class BLESessionManager {
  initiateSession(deviceId: string, deviceAddress: string, deviceName: string): Promise<BLESession>
  createHandshakeRequest(sessionId: string): Promise<SessionHandshake>
  processHandshakeResponse(sessionId: string, handshake: SessionHandshake): Promise<BLESession>
  deriveSharedSecret(sessionId: string, peerPublicKey: string): Promise<string>
  closeSession(sessionId: string): Promise<void>
  isSessionValid(sessionId: string): boolean
}
```

#### ChatManager
```typescript
class ChatManager {
  sendMessage(sessionId: string, from: string, to: string, content: string): Promise<ChatMessage>
  receiveMessage(encryptedMessage: ChatMessage): Promise<ChatMessage>
  getConversationHistory(sessionId: string): ChatMessage[]
  markMessageAsDelivered(messageId: string): void
  deleteMessage(messageId: string): void
  clearConversation(sessionId: string): void
}
```

**Rules**:
- ✅ Pure business logic only
- ✅ Testable without UI
- ✅ Uses infrastructure layer
- ❌ NO UI dependencies
- ❌ NO direct storage access
- ❌ NO global state mutations

---

### 4. Infrastructure Layer

**Responsibility**: Low-level operations and external integrations

**Components**:

#### CryptoUtils
```typescript
class CryptoUtils {
  static generateRandomBytes(length: number): Uint8Array
  static deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array>
  static encrypt(data: string, password: string): Promise<EncryptedData>
  static decrypt(encryptedData: EncryptedData, password: string): Promise<string>
  static hashData(data: string): string
}
```

#### Storage Layer
- **AsyncStorage**: Persistent key-value storage
- **Redux Persist**: Auto-save Redux state
- **Secure Storage**: React Native Keychain (future)

#### Network Layer
- **RPC Providers**: ethers.js JsonRpcProvider
- **HTTP Client**: fetch API
- **WebSocket**: For real-time updates (future)

#### BLE Layer
- **react-native-ble-plx**: Bluetooth Low Energy
- **Peripheral/Central modes**: Device discovery and connection

**Rules**:
- ✅ Stateless utilities
- ✅ Error handling
- ✅ Logging (no sensitive data)
- ❌ NO business logic
- ❌ NO UI code

---

## Data Flow

### User Action Flow

```
User Action
    ↓
Component Handler
    ↓
Dispatch Redux Action
    ↓
Reducer Updates State
    ↓
Selector Provides Data
    ↓
Component Re-renders
```

### Async Operation Flow

```
User Action
    ↓
Component Handler
    ↓
Dispatch Async Action (Thunk/Saga)
    ↓
Call Business Logic Manager
    ↓
Manager Uses Infrastructure
    ↓
Infrastructure Returns Data
    ↓
Dispatch Success/Failure Action
    ↓
Reducer Updates State
    ↓
Component Re-renders
```

### Example: Send Transaction Flow

```
1. User fills send form in SendScreen
2. User taps "Confirm"
3. Component validates input
4. Component dispatches sendTransaction action
5. Redux Saga intercepts action
6. Saga calls TransactionManager.sendTransaction()
7. TransactionManager creates transaction
8. TransactionManager signs with WalletManager
9. TransactionManager broadcasts via RPC
10. Success/failure dispatched to Redux
11. Redux updates transaction state
12. Component shows success/error message
```

---

## Security Architecture

### Encryption Flow

```
User Password
    ↓
PBKDF2 (100k iterations)
    ↓
Derived Key (256-bit)
    ↓
AES-256-GCM Encrypt
    ↓
Ciphertext + IV + Salt + Tag
    ↓
Store in AsyncStorage
```

### Key Storage Hierarchy

```
Level 1: User Password
    └─> Stored: Nowhere (user's memory)

Level 2: Derived Key
    └─> Derived: PBKDF2 on password + salt
    └─> Stored: Nowhere (derived on demand)

Level 3: Encrypted Private Key
    └─> Encrypted: With derived key
    └─> Stored: AsyncStorage (encrypted)

Level 4: Encrypted Seed Phrase
    └─> Encrypted: With derived key
    └─> Stored: AsyncStorage (encrypted)

Level 5: Ephemeral Session Keys
    └─> Generated: For each BLE session
    └─> Stored: In-memory only
    └─> Lifecycle: Session duration only
```

### BLE Security Flow

```
Alice                          Bob
  │                             │
  ├─ Generate ephemeral key A   │
  │                             ├─ Generate ephemeral key B
  │                             │
  ├─ Sign(publicKey_A, walletKey_Alice)
  │                             │
  ├───── Handshake Request ────>│
  │                             │
  │                             ├─ Verify signature
  │                             ├─ Sign(publicKey_B, walletKey_Bob)
  │                             │
  │<──── Handshake Response ────┤
  │                             │
  ├─ Verify signature           │
  │                             │
  ├─ ECDH(privateKey_A, publicKey_B)
  │                             ├─ ECDH(privateKey_B, publicKey_A)
  │                             │
  ├─ sharedSecret_A             ├─ sharedSecret_B
  │   (should be equal)         │
  │                             │
  ├─ Encrypt message with sharedSecret
  │                             │
  ├────── Encrypted Message ───>│
  │                             │
  │                             ├─ Decrypt with sharedSecret
  │                             ├─ Encrypt response
  │                             │
  │<──── Encrypted Response ────┤
  │                             │
```

---

## Module Dependencies

```
┌────────────────────────────────────────────┐
│              Presentation                  │
│  (Screens, Components, Navigation)         │
└──────────┬─────────────────────────────────┘
           │
           ├─> React Navigation
           ├─> Lottie
           └─> React Hook Form
           │
┌──────────▼─────────────────────────────────┐
│          State Management                  │
│  (Redux Store, Slices, Selectors)          │
└──────────┬─────────────────────────────────┘
           │
           ├─> Redux Toolkit
           ├─> Redux Persist
           └─> Reselect
           │
┌──────────▼─────────────────────────────────┐
│         Business Logic                     │
│  (Managers: Wallet, Transaction, etc.)     │
└──────────┬─────────────────────────────────┘
           │
           ├─> ethers.js
           ├─> bip39
           └─> Infrastructure utilities
           │
┌──────────▼─────────────────────────────────┐
│         Infrastructure                     │
│  (Crypto, Storage, RPC, BLE)               │
└────────────────────────────────────────────┘
           │
           ├─> @noble/curves
           ├─> @noble/hashes
           ├─> AsyncStorage
           └─> react-native-ble-plx
```

---

## Directory Structure

```
crypto-wallet-app/
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── atoms/              # Basic components (Button, Input)
│   │   ├── molecules/          # Composite components (TokenCard)
│   │   └── organisms/          # Complex components (Header, Footer)
│   │
│   ├── screens/                # Screen components
│   │   ├── onboarding/        # Onboarding flow
│   │   ├── home/              # Home and main screens
│   │   ├── transaction/       # Transaction screens
│   │   ├── chat/              # BLE chat screens
│   │   └── settings/          # Settings screens
│   │
│   ├── navigation/            # Navigation configuration
│   │   ├── AppNavigator.tsx   # Root navigator
│   │   ├── MainTabNavigator.tsx
│   │   └── types.ts           # Navigation types
│   │
│   ├── store/                 # Redux state management
│   │   ├── index.ts           # Store configuration
│   │   ├── slices/            # Redux slices
│   │   ├── sagas/             # Redux sagas (future)
│   │   └── selectors/         # Reselect selectors
│   │
│   ├── core/                  # Business logic layer
│   │   ├── wallet/
│   │   │   ├── WalletManager.ts
│   │   │   └── types.ts
│   │   ├── transaction/
│   │   │   ├── TransactionManager.ts
│   │   │   └── types.ts
│   │   ├── ble/
│   │   │   ├── BLESessionManager.ts
│   │   │   └── types.ts
│   │   ├── chat/
│   │   │   ├── ChatManager.ts
│   │   │   └── types.ts
│   │   └── crypto/
│   │       ├── CryptoUtils.ts
│   │       └── types.ts
│   │
│   ├── services/              # External services
│   │   ├── rpc/              # RPC service
│   │   ├── storage/          # Storage service
│   │   ├── ble/              # BLE service
│   │   └── analytics/        # Analytics (future)
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useWallet.ts
│   │   ├── useTransaction.ts
│   │   ├── useChat.ts
│   │   └── useTheme.ts
│   │
│   ├── utils/                 # Utility functions
│   │   ├── format.ts         # Formatters
│   │   ├── validation.ts     # Validators
│   │   └── helpers.ts        # Helper functions
│   │
│   ├── constants/             # Constants
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── networks.ts
│   │
│   ├── types/                 # TypeScript types
│   │   ├── wallet.ts
│   │   ├── transaction.ts
│   │   ├── ble.ts
│   │   └── index.ts
│   │
│   └── __tests__/            # Tests
│       ├── components/
│       ├── screens/
│       ├── core/
│       └── utils/
│
├── App.tsx                    # App entry point
├── index.ts                   # Root index
└── package.json
```

---

## Design Patterns

### 1. Manager Pattern (Core Layer)
- **Purpose**: Encapsulate business logic
- **Example**: `WalletManager`, `TransactionManager`
- **Benefits**: Testable, reusable, framework-agnostic

### 2. Redux Pattern (State Layer)
- **Purpose**: Centralized state management
- **Example**: Slices, actions, reducers
- **Benefits**: Predictable state, time-travel debugging

### 3. Singleton Pattern (Infrastructure)
- **Purpose**: Single instance of managers
- **Example**: RPC Provider, Storage service
- **Benefits**: Resource efficiency, consistent state

### 4. Factory Pattern (Wallet Creation)
- **Purpose**: Create objects without specifying exact class
- **Example**: Creating wallets from different sources
- **Benefits**: Flexibility, extensibility

### 5. Observer Pattern (BLE Sessions)
- **Purpose**: Notify subscribers of state changes
- **Example**: Session status updates
- **Benefits**: Decoupling, real-time updates

---

## Performance Considerations

### Bundle Size Optimization
- **Code Splitting**: Lazy load screens
- **Tree Shaking**: Remove unused code
- **Image Optimization**: WebP format, compressed
- **Target**: < 50MB total app size

### Memory Management
- **Cleanup**: Remove listeners, clear timers
- **Memoization**: Use `React.memo`, `useMemo`, `useCallback`
- **Pagination**: Load data in chunks
- **Target**: < 200MB RAM usage

### Network Optimization
- **RPC Batching**: Combine multiple requests
- **Caching**: Cache balances, prices
- **Retry Logic**: Exponential backoff
- **Target**: < 2s balance refresh

---

## Testing Architecture

### Test Pyramid

```
      /\
     /  \     E2E Tests (10%)
    /────\    Integration Tests (20%)
   /──────\   Unit Tests (70%)
  /────────\
```

### Test Coverage by Layer

| Layer | Coverage Target | Test Type |
|-------|----------------|-----------|
| Presentation | 70% | Component tests |
| State Management | 100% | Unit tests |
| Business Logic | 90% | Unit tests |
| Infrastructure | 90% | Unit tests |

### Testing Tools
- **Unit Tests**: Jest
- **Component Tests**: React Testing Library
- **E2E Tests**: Detox
- **Mocking**: jest.mock()

---

## Error Handling Strategy

### Error Categories

1. **User Errors** (Recoverable)
   - Invalid input
   - Insufficient balance
   - Network not selected
   - **Handling**: Show user-friendly message, allow retry

2. **Network Errors** (Recoverable)
   - RPC timeout
   - Connection lost
   - Rate limiting
   - **Handling**: Retry with exponential backoff, fallback RPC

3. **Validation Errors** (Recoverable)
   - Invalid address
   - Invalid amount
   - **Handling**: Show error message, highlight field

4. **System Errors** (Potentially unrecoverable)
   - Out of memory
   - Crypto operation failed
   - Storage full
   - **Handling**: Log error, show generic message, restart if needed

5. **Security Errors** (Critical)
   - Decryption failed
   - Signature verification failed
   - Session hijack detected
   - **Handling**: Lock wallet, show security warning, log incident

### Error Boundary

```typescript
<ErrorBoundary
  fallback={(error, reset) => (
    <ErrorScreen error={error} onReset={reset} />
  )}
>
  <App />
</ErrorBoundary>
```

---

## Scalability Considerations

### Horizontal Scaling (More Features)
- ✅ Modular architecture allows easy feature addition
- ✅ Clear layer separation
- ✅ Feature flags for gradual rollout

### Vertical Scaling (More Data)
- ✅ Pagination for transaction history
- ✅ Lazy loading for token lists
- ✅ Database indexing (future SQLite)
- ✅ Background sync for large data

### Multi-Platform Support
- ✅ React Native code shared 95%
- ✅ Platform-specific code in separate files
- ✅ Responsive design for tablets
- ✅ Future web version possible (React Native Web)

---

## Security Best Practices

### Code Security
- [ ] No hardcoded secrets
- [ ] No logging sensitive data
- [ ] Input validation everywhere
- [ ] SQL injection prevention (future)
- [ ] XSS prevention

### Crypto Security
- [ ] Use approved libraries only
- [ ] Constant-time comparisons
- [ ] Secure random number generation
- [ ] Key stretching (PBKDF2)
- [ ] Forward secrecy (ECDH)

### Storage Security
- [ ] Encrypt at rest
- [ ] Secure key storage (Keychain)
- [ ] No sensitive data in logs
- [ ] Clear data on logout
- [ ] Screen capture prevention (sensitive screens)

---

## Future Architecture Improvements

### Phase 3+
- [ ] Migrate to Redux Saga for complex async flows
- [ ] Add SQLite for efficient data querying
- [ ] Implement caching layer (Redis-like)
- [ ] Add offline-first architecture
- [ ] Implement event sourcing for auditability

### Phase 4+
- [ ] Microservices architecture (if backend needed)
- [ ] GraphQL for flexible data fetching
- [ ] Real-time updates via WebSocket
- [ ] Push notification infrastructure
- [ ] Analytics pipeline

---

**Last Updated**: 2025-11-18
**Next Review**: End of Phase 2
