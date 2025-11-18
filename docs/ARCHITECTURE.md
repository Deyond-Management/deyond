# Deyond Architecture Design

## Document Information
- **Version**: 1.0.0
- **Last Updated**: 2025-11-18
- **Status**: Planning Phase
- **Project**: Deyond Architecture Specification

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [Client Architecture (React Native)](#client-architecture)
4. [Server Architecture (Microservices)](#server-architecture)
5. [Database Design](#database-design)
6. [Blockchain Adapter Pattern](#blockchain-adapter-pattern)
7. [Network Communication](#network-communication)
8. [Security Architecture](#security-architecture)
9. [Scalability & Performance](#scalability--performance)
10. [Deployment Architecture](#deployment-architecture)

---

## 1. System Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           React Native Mobile App (iOS/Android)          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │  │
│  │  │ Wallet UI  │  │ Social UI  │  │  Gaming/AI UI      │ │  │
│  │  └─────┬──────┘  └──────┬─────┘  └──────┬─────────────┘ │  │
│  │        │                 │                │               │  │
│  │  ┌─────▼─────────────────▼────────────────▼──────────┐   │  │
│  │  │         Redux Store (State Management)            │   │  │
│  │  └─────┬──────────────────┬────────────────┬──────────┘   │  │
│  │        │                  │                 │              │  │
│  │  ┌─────▼──────┐  ┌────────▼──────┐  ┌──────▼────────┐   │  │
│  │  │   Wallet   │  │   Messaging   │  │   AI/Gaming   │   │  │
│  │  │ Controllers│  │  Controllers  │  │  Controllers  │   │  │
│  │  └─────┬──────┘  └────────┬──────┘  └──────┬────────┘   │  │
│  │        │                   │                 │            │  │
│  │  ┌─────▼─────────────────▼─────────────────▼─────────┐  │  │
│  │  │         Use Cases (Business Logic)               │  │  │
│  │  └─────┬────────────────────────────────────────────┘  │  │
│  │        │                                                │  │
│  │  ┌─────▼────────────────────────────────────────────┐  │  │
│  │  │         Domain Entities (Models)                 │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬─────────────────────────────────┬─────────────────┘
             │                                 │
             │ REST/GraphQL/gRPC               │ BLE/WebRTC
             │                                 │ (P2P)
             ▼                                 ▼
┌────────────────────────────┐    ┌──────────────────────┐
│    API GATEWAY LAYER       │    │  Other Mobile Devices│
│  (Load Balancer + Auth)    │    │  (Mesh Network)      │
└────────────┬───────────────┘    └──────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MICROSERVICES LAYER                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  Auth    │ │ Profile  │ │ Wallet   │ │ Message  │  ...     │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
│       │            │            │            │                  │
│       └────────────┴────────────┴────────────┘                  │
│                           │                                     │
│                           ▼                                     │
│              ┌──────────────────────────┐                       │
│              │   Message Queue (NATS)   │                       │
│              └──────────────────────────┘                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ PostgreSQL   │  │   MongoDB    │  │    Redis     │         │
│  │ (Relational) │  │  (Document)  │  │   (Cache)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN LAYER                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Ethereum │  │  Solana  │  │   BSC    │  │ Bitcoin  │       │
│  │  (RPC)   │  │  (RPC)   │  │  (RPC)   │  │  (RPC)   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Interaction Flow

```
User Action (Send Transaction)
       │
       ▼
┌──────────────────────┐
│ SendTransactionScreen│  ← Presentation Layer (React Native)
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│TransactionController │  ← Application Layer (State Management)
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│SendTransactionUseCase│  ← Domain Layer (Business Logic)
└──────────┬───────────┘
           │
           ├──────────────────┐
           │                  │
           ▼                  ▼
┌──────────────────┐  ┌──────────────────┐
│  WalletService   │  │ BlockchainAdapter│  ← Domain Services
└──────────────────┘  └──────────┬───────┘
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │ EthereumAdapter      │  ← Infrastructure Layer
                      │ - signTransaction()  │
                      │ - broadcastTx()      │
                      └──────────┬───────────┘
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │ Ethereum RPC Node    │  ← External Service
                      └──────────────────────┘
```

---

## 2. Architecture Principles

### 2.1 SOLID Principles

#### **S - Single Responsibility Principle**
Each class/module has one reason to change.

```typescript
// ❌ BAD: Mixed responsibilities
class WalletManager {
  createWallet() { /* ... */ }
  encryptPrivateKey() { /* ... */ }
  sendTransaction() { /* ... */ }
  updateUI() { /* ... */ }  // UI concern in business logic!
}

// ✅ GOOD: Separated responsibilities
class WalletService {
  constructor(private keyManager: KeyManager, private txService: TransactionService) {}
  createWallet(): Wallet { /* ... */ }
}

class KeyManager {
  encryptPrivateKey(key: string): EncryptedKey { /* ... */ }
}

class TransactionService {
  sendTransaction(tx: Transaction): Promise<TxHash> { /* ... */ }
}
```

#### **O - Open/Closed Principle**
Open for extension, closed for modification.

```typescript
// Base adapter interface
interface IBlockchainAdapter {
  getBalance(address: string): Promise<Balance>;
  signTransaction(tx: UnsignedTransaction): Promise<SignedTransaction>;
  broadcastTransaction(signedTx: SignedTransaction): Promise<TxHash>;
}

// Extend by adding new adapters, not modifying existing ones
class EthereumAdapter implements IBlockchainAdapter { /* ... */ }
class SolanaAdapter implements IBlockchainAdapter { /* ... */ }
class BitcoinAdapter implements IBlockchainAdapter { /* ... */ }
```

#### **L - Liskov Substitution Principle**
Subtypes must be substitutable for base types.

```typescript
// Any IBlockchainAdapter can be used interchangeably
function processTransaction(adapter: IBlockchainAdapter, tx: UnsignedTransaction) {
  const signedTx = await adapter.signTransaction(tx);
  return await adapter.broadcastTransaction(signedTx);
}

// Works with any adapter
processTransaction(new EthereumAdapter(), ethTx);
processTransaction(new SolanaAdapter(), solTx);
```

#### **I - Interface Segregation Principle**
Clients shouldn't depend on interfaces they don't use.

```typescript
// ❌ BAD: Fat interface
interface IWallet {
  getBalance(): Promise<Balance>;
  sendTransaction(tx: Transaction): Promise<TxHash>;
  signMessage(msg: string): Promise<Signature>;  // Not all wallets support
  signTypedData(data: TypedData): Promise<Signature>;  // Ethereum-specific
}

// ✅ GOOD: Segregated interfaces
interface IWallet {
  getBalance(): Promise<Balance>;
  sendTransaction(tx: Transaction): Promise<TxHash>;
}

interface IMessageSigner {
  signMessage(msg: string): Promise<Signature>;
}

interface ITypedDataSigner extends IMessageSigner {
  signTypedData(data: TypedData): Promise<Signature>;
}

class EthereumWallet implements IWallet, ITypedDataSigner { /* ... */ }
class BitcoinWallet implements IWallet { /* ... */ }  // Doesn't need signing
```

#### **D - Dependency Inversion Principle**
Depend on abstractions, not concretions.

```typescript
// ❌ BAD: Depends on concrete implementation
class SendTransactionUseCase {
  private ethereumAdapter = new EthereumAdapter();  // Tight coupling

  async execute(tx: Transaction) {
    return this.ethereumAdapter.sendTransaction(tx);
  }
}

// ✅ GOOD: Depends on abstraction
class SendTransactionUseCase {
  constructor(private blockchainAdapter: IBlockchainAdapter) {}  // Inject dependency

  async execute(tx: Transaction) {
    return this.blockchainAdapter.sendTransaction(tx);
  }
}

// Usage with dependency injection
const ethereumAdapter = new EthereumAdapter();
const useCase = new SendTransactionUseCase(ethereumAdapter);
```

---

### 2.2 Clean Architecture (Layered Architecture)

```
┌────────────────────────────────────────────────────────────┐
│                    FRAMEWORKS & DRIVERS                     │
│  (React Native, Native Modules, External APIs, Databases)  │
│                         ▼ depends on ▼                      │
├────────────────────────────────────────────────────────────┤
│                   INTERFACE ADAPTERS                        │
│       (Controllers, Presenters, Gateways, Repositories)    │
│                         ▼ depends on ▼                      │
├────────────────────────────────────────────────────────────┤
│                      USE CASES                              │
│              (Application Business Rules)                   │
│                         ▼ depends on ▼                      │
├────────────────────────────────────────────────────────────┤
│                       ENTITIES                              │
│               (Enterprise Business Rules)                   │
└────────────────────────────────────────────────────────────┘
```

**Dependency Rule**: Source code dependencies point inward. Inner layers don't know about outer layers.

#### **Layer 1: Entities (Domain Layer)**
Core business logic, independent of any framework.

```typescript
// src/domain/entities/Account.ts
export class Account {
  constructor(
    public readonly id: string,
    public readonly address: string,
    public readonly derivationPath: string,
    private balance: bigint
  ) {}

  updateBalance(newBalance: bigint): void {
    if (newBalance < 0n) {
      throw new InvalidBalanceError('Balance cannot be negative');
    }
    this.balance = newBalance;
  }

  getBalance(): bigint {
    return this.balance;
  }
}

// src/domain/entities/Transaction.ts
export class Transaction {
  constructor(
    public readonly from: string,
    public readonly to: string,
    public readonly value: bigint,
    public readonly data?: string,
    public status: TransactionStatus = 'pending'
  ) {
    this.validate();
  }

  private validate(): void {
    if (!isValidAddress(this.from)) throw new InvalidAddressError('Invalid from address');
    if (!isValidAddress(this.to)) throw new InvalidAddressError('Invalid to address');
    if (this.value < 0n) throw new InvalidAmountError('Value must be positive');
  }

  confirm(): void {
    if (this.status !== 'pending') {
      throw new InvalidStateTransitionError('Can only confirm pending transactions');
    }
    this.status = 'confirmed';
  }
}
```

#### **Layer 2: Use Cases (Application Layer)**
Application-specific business logic.

```typescript
// src/application/usecases/SendTransaction.usecase.ts
import { IWalletRepository } from '../repositories/IWalletRepository';
import { IBlockchainGateway } from '../gateways/IBlockchainGateway';

export class SendTransactionUseCase {
  constructor(
    private walletRepo: IWalletRepository,
    private blockchainGateway: IBlockchainGateway
  ) {}

  async execute(input: SendTransactionInput): Promise<SendTransactionOutput> {
    // 1. Validation
    const wallet = await this.walletRepo.findByAddress(input.from);
    if (!wallet) throw new WalletNotFoundError();

    const balance = await this.blockchainGateway.getBalance(input.from);
    if (balance < input.value + input.gasLimit * input.gasPrice) {
      throw new InsufficientBalanceError();
    }

    // 2. Create domain entity
    const transaction = new Transaction(
      input.from,
      input.to,
      input.value,
      input.data
    );

    // 3. Sign transaction
    const signedTx = await wallet.signTransaction(transaction);

    // 4. Broadcast
    const txHash = await this.blockchainGateway.broadcastTransaction(signedTx);

    // 5. Update state
    transaction.confirm();
    await this.walletRepo.saveTransaction(transaction);

    return {
      txHash,
      status: transaction.status
    };
  }
}
```

#### **Layer 3: Interface Adapters**
Convert data between use cases and external systems.

```typescript
// src/adapters/controllers/TransactionController.ts
export class TransactionController {
  constructor(private sendTransactionUseCase: SendTransactionUseCase) {}

  async sendTransaction(req: Request): Promise<Response> {
    try {
      // Convert HTTP request to use case input
      const input: SendTransactionInput = {
        from: req.body.from,
        to: req.body.to,
        value: BigInt(req.body.value),
        data: req.body.data,
        gasLimit: BigInt(req.body.gasLimit),
        gasPrice: BigInt(req.body.gasPrice)
      };

      // Execute use case
      const output = await this.sendTransactionUseCase.execute(input);

      // Convert use case output to HTTP response
      return {
        status: 200,
        body: {
          success: true,
          data: {
            txHash: output.txHash,
            status: output.status
          }
        }
      };
    } catch (error) {
      return {
        status: 400,
        body: {
          success: false,
          error: error.message
        }
      };
    }
  }
}

// src/adapters/repositories/WalletRepository.ts
export class WalletRepository implements IWalletRepository {
  constructor(private database: Database) {}

  async findByAddress(address: string): Promise<Wallet | null> {
    const row = await this.database.query(
      'SELECT * FROM wallets WHERE address = ?',
      [address]
    );

    if (!row) return null;

    // Convert database row to domain entity
    return new Wallet(
      row.id,
      row.address,
      row.derivation_path,
      BigInt(row.balance)
    );
  }

  async saveTransaction(tx: Transaction): Promise<void> {
    await this.database.query(
      'INSERT INTO transactions (from_address, to_address, value, status) VALUES (?, ?, ?, ?)',
      [tx.from, tx.to, tx.value.toString(), tx.status]
    );
  }
}
```

#### **Layer 4: Frameworks & Drivers**
React Native components, database drivers, external APIs.

```typescript
// src/presentation/screens/SendTransactionScreen.tsx
export const SendTransactionScreen: React.FC = () => {
  const dispatch = useDispatch();
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');

  const handleSend = async () => {
    // Dispatch action to Redux (which calls controller)
    dispatch(sendTransaction({ to, amount: parseEther(amount) }));
  };

  return (
    <View>
      <TextInput value={to} onChangeText={setTo} placeholder="Recipient" />
      <TextInput value={amount} onChangeText={setAmount} placeholder="Amount" />
      <Button title="Send" onPress={handleSend} />
    </View>
  );
};
```

---

### 2.3 Domain-Driven Design (DDD)

#### **Bounded Contexts**

```
┌────────────────────────────────────────────────────────────┐
│                     DEYOND SYSTEM                           │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  Wallet Context │  │ Identity Context│                 │
│  │  - Account      │  │ - Profile       │                 │
│  │  - Transaction  │  │ - Contact       │                 │
│  │  - Token        │  │ - Verification  │                 │
│  └─────────────────┘  └─────────────────┘                 │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │Messaging Context│  │ Calling Context │                 │
│  │  - Message      │  │ - Call          │                 │
│  │  - Conversation │  │ - PhoneNumber   │                 │
│  │  - Group        │  │ - VoIPSession   │                 │
│  └─────────────────┘  └─────────────────┘                 │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  Social Context │  │  Gaming Context │                 │
│  │  - FeedFlag     │  │ - Game          │                 │
│  │  - Location     │  │ - GameSession   │                 │
│  │  - Discovery    │  │ - Leaderboard   │                 │
│  └─────────────────┘  └─────────────────┘                 │
│                                                             │
│  ┌─────────────────┐                                       │
│  │   AI Context    │                                       │
│  │  - Creature     │                                       │
│  │  - AIAgent      │                                       │
│  │  - Training     │                                       │
│  └─────────────────┘                                       │
└────────────────────────────────────────────────────────────┘
```

#### **Aggregates**

An aggregate is a cluster of domain objects treated as a single unit.

```typescript
// Wallet Aggregate Root
export class WalletAggregate {
  constructor(
    private account: Account,  // Root entity
    private transactions: Transaction[],  // Child entities
    private tokens: Token[]  // Child entities
  ) {}

  // All modifications go through the aggregate root
  async sendTransaction(to: string, value: bigint): Promise<Transaction> {
    // Business rules enforced at aggregate level
    const totalValue = value + this.calculateGasFee();
    if (this.account.getBalance() < totalValue) {
      throw new InsufficientBalanceError();
    }

    const tx = new Transaction(this.account.address, to, value);
    this.transactions.push(tx);
    this.account.updateBalance(this.account.getBalance() - totalValue);

    return tx;
  }

  private calculateGasFee(): bigint {
    // Gas calculation logic
    return 21000n * 50n;  // gasLimit * gasPrice
  }
}
```

#### **Domain Events**

```typescript
// Domain Event
export class TransactionSentEvent implements DomainEvent {
  readonly occurredOn: Date;

  constructor(
    public readonly txHash: string,
    public readonly from: string,
    public readonly to: string,
    public readonly value: bigint
  ) {
    this.occurredOn = new Date();
  }
}

// Event Handler
export class SendNotificationOnTransactionSent implements EventHandler<TransactionSentEvent> {
  async handle(event: TransactionSentEvent): Promise<void> {
    await notificationService.send({
      title: 'Transaction Sent',
      message: `Sent ${event.value} to ${event.to}`,
      timestamp: event.occurredOn
    });
  }
}

// Usage in Use Case
export class SendTransactionUseCase {
  async execute(input: SendTransactionInput): Promise<void> {
    const tx = await this.wallet.sendTransaction(input.to, input.value);

    // Publish domain event
    this.eventBus.publish(new TransactionSentEvent(
      tx.hash,
      tx.from,
      tx.to,
      tx.value
    ));
  }
}
```

---

## 3. Client Architecture (React Native)

### 3.1 Project Structure

```
deyond/
├── src/
│   ├── domain/                    # Domain Layer (Entities, Value Objects)
│   │   ├── wallet/
│   │   │   ├── entities/
│   │   │   │   ├── Account.ts
│   │   │   │   ├── Transaction.ts
│   │   │   │   └── Token.ts
│   │   │   ├── valueObjects/
│   │   │   │   ├── Address.ts
│   │   │   │   └── Balance.ts
│   │   │   └── events/
│   │   │       └── TransactionSent.event.ts
│   │   ├── messaging/
│   │   │   ├── entities/
│   │   │   │   ├── Message.ts
│   │   │   │   ├── Conversation.ts
│   │   │   │   └── Group.ts
│   │   │   └── valueObjects/
│   │   │       └── EncryptedContent.ts
│   │   ├── social/
│   │   └── gaming/
│   │
│   ├── application/               # Application Layer (Use Cases)
│   │   ├── wallet/
│   │   │   ├── usecases/
│   │   │   │   ├── CreateWallet.usecase.ts
│   │   │   │   ├── SendTransaction.usecase.ts
│   │   │   │   └── GetBalance.usecase.ts
│   │   │   ├── ports/            # Interfaces for infrastructure
│   │   │   │   ├── IWalletRepository.ts
│   │   │   │   └── IBlockchainGateway.ts
│   │   │   └── dto/
│   │   │       └── SendTransactionInput.dto.ts
│   │   ├── messaging/
│   │   ├── social/
│   │   └── gaming/
│   │
│   ├── infrastructure/            # Infrastructure Layer (Adapters)
│   │   ├── blockchain/
│   │   │   ├── adapters/
│   │   │   │   ├── EthereumAdapter.ts
│   │   │   │   ├── SolanaAdapter.ts
│   │   │   │   └── BitcoinAdapter.ts
│   │   │   └── factory/
│   │   │       └── BlockchainAdapterFactory.ts
│   │   ├── storage/
│   │   │   ├── repositories/
│   │   │   │   ├── WalletRepository.ts
│   │   │   │   └── MessageRepository.ts
│   │   │   └── database/
│   │   │       ├── sqlite/
│   │   │       └── migrations/
│   │   ├── encryption/
│   │   │   ├── AESEncryptor.ts
│   │   │   ├── SignalProtocol.ts
│   │   │   └── KeyManager.ts
│   │   ├── network/
│   │   │   ├── api/
│   │   │   │   ├── ApiClient.ts
│   │   │   │   └── endpoints/
│   │   │   ├── ble/
│   │   │   │   ├── BLEManager.ts
│   │   │   │   └── MeshNetwork.ts
│   │   │   └── webrtc/
│   │   │       └── VoIPManager.ts
│   │   └── native/
│   │       ├── Keychain.ts
│   │       ├── Biometric.ts
│   │       └── NativeModules.ts
│   │
│   ├── presentation/              # Presentation Layer (UI)
│   │   ├── screens/
│   │   │   ├── wallet/
│   │   │   │   ├── WalletScreen.tsx
│   │   │   │   ├── SendTransactionScreen.tsx
│   │   │   │   └── TransactionHistoryScreen.tsx
│   │   │   ├── messaging/
│   │   │   ├── social/
│   │   │   └── gaming/
│   │   ├── components/
│   │   │   ├── wallet/
│   │   │   │   ├── AccountCard.tsx
│   │   │   │   ├── TokenList.tsx
│   │   │   │   └── TransactionItem.tsx
│   │   │   └── shared/
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       └── Modal.tsx
│   │   ├── navigation/
│   │   │   └── AppNavigator.tsx
│   │   └── hooks/
│   │       ├── useWallet.ts
│   │       ├── useTransaction.ts
│   │       └── useBalance.ts
│   │
│   ├── state/                     # State Management
│   │   ├── store.ts               # Redux store configuration
│   │   ├── wallet/
│   │   │   ├── wallet.slice.ts
│   │   │   ├── wallet.selectors.ts
│   │   │   └── wallet.thunks.ts
│   │   ├── messaging/
│   │   ├── social/
│   │   └── middleware/
│   │       └── logger.middleware.ts
│   │
│   ├── shared/                    # Shared utilities
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   └── formatting.ts
│   │   ├── constants/
│   │   │   └── chains.ts
│   │   └── types/
│   │       └── index.ts
│   │
│   └── __tests__/                 # Tests mirror src structure
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       └── presentation/
│
├── android/                       # Android native code
├── ios/                           # iOS native code
├── package.json
├── tsconfig.json
└── jest.config.js
```

### 3.2 State Management (Redux)

```typescript
// src/state/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import MMKVStorage from 'react-native-mmkv-storage';
import walletReducer from './wallet/wallet.slice';
import messagingReducer from './messaging/messaging.slice';

const storage = new MMKVStorage.Loader().initialize();

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['wallet', 'messaging']  // Only persist these slices
};

export const store = configureStore({
  reducer: {
    wallet: persistReducer(persistConfig, walletReducer),
    messaging: persistReducer(persistConfig, messagingReducer),
    // ... other slices
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST']
      }
    })
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

```typescript
// src/state/wallet/wallet.slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { sendTransactionThunk } from './wallet.thunks';

interface WalletState {
  accounts: Account[];
  selectedAccount: string | null;
  balance: string;
  loading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  accounts: [],
  selectedAccount: null,
  balance: '0',
  loading: false,
  error: null
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setSelectedAccount(state, action: PayloadAction<string>) {
      state.selectedAccount = action.payload;
    },
    updateBalance(state, action: PayloadAction<string>) {
      state.balance = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendTransactionThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendTransactionThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendTransactionThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Transaction failed';
      });
  }
});

export const { setSelectedAccount, updateBalance } = walletSlice.actions;
export default walletSlice.reducer;
```

```typescript
// src/state/wallet/wallet.thunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { SendTransactionUseCase } from '@/application/wallet/usecases/SendTransaction.usecase';
import { container } from '@/di/container';  // Dependency injection

export const sendTransactionThunk = createAsyncThunk(
  'wallet/sendTransaction',
  async (params: { to: string; value: string }, { rejectWithValue }) => {
    try {
      const useCase = container.get<SendTransactionUseCase>(SendTransactionUseCase);
      const result = await useCase.execute({
        from: params.from,
        to: params.to,
        value: BigInt(params.value)
      });
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

### 3.3 Dependency Injection

```typescript
// src/di/container.ts
import { Container } from 'inversify';
import { IWalletRepository } from '@/application/wallet/ports/IWalletRepository';
import { WalletRepository } from '@/infrastructure/storage/repositories/WalletRepository';
import { IBlockchainGateway } from '@/application/wallet/ports/IBlockchainGateway';
import { BlockchainGateway } from '@/infrastructure/blockchain/BlockchainGateway';
import { SendTransactionUseCase } from '@/application/wallet/usecases/SendTransaction.usecase';

const container = new Container();

// Bind repositories
container.bind<IWalletRepository>('IWalletRepository').to(WalletRepository).inSingletonScope();

// Bind gateways
container.bind<IBlockchainGateway>('IBlockchainGateway').to(BlockchainGateway).inSingletonScope();

// Bind use cases
container.bind<SendTransactionUseCase>(SendTransactionUseCase).toSelf();

export { container };
```

---

## 4. Server Architecture (Microservices)

### 4.1 Service Breakdown

```
┌──────────────────────────────────────────────────────────┐
│                     API GATEWAY                          │
│  - Request routing                                       │
│  - Authentication (JWT validation)                       │
│  - Rate limiting                                         │
│  - Load balancing                                        │
└────────────┬─────────────────────────────────────────────┘
             │
     ┌───────┴───────┬──────────┬────────────┬─────────┐
     │               │          │            │         │
     ▼               ▼          ▼            ▼         ▼
┌─────────┐   ┌──────────┐ ┌────────┐ ┌─────────┐ ┌────────┐
│  Auth   │   │ Profile  │ │Wallet  │ │Message  │ │Calling │
│ Service │   │ Service  │ │Service │ │Service  │ │Service │
└────┬────┘   └────┬─────┘ └───┬────┘ └────┬────┘ └───┬────┘
     │             │            │           │          │
     └─────────────┴────────────┴───────────┴──────────┘
                           │
                    ┌──────▼──────┐
                    │ Message Bus │
                    │   (NATS)    │
                    └─────────────┘
```

### 4.2 Service Details

#### **Auth Service**
- **Responsibility**: Authentication and authorization
- **Technology**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (users, sessions)
- **Endpoints**:
  - `POST /auth/register`: Register device with wallet signature
  - `POST /auth/login`: Login with wallet signature
  - `POST /auth/refresh`: Refresh access token
  - `POST /auth/logout`: Invalidate tokens

```typescript
// auth-service/src/controllers/AuthController.ts
export class AuthController {
  constructor(
    private authUseCase: AuthenticateUserUseCase,
    private jwtService: JWTService
  ) {}

  async login(req: Request, res: Response): Promise<void> {
    const { publicKey, signature, message } = req.body;

    // Verify signature
    const isValid = await this.authUseCase.verifySignature(publicKey, signature, message);
    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid signature' });
      return;
    }

    // Generate tokens
    const accessToken = this.jwtService.generateAccessToken({ publicKey });
    const refreshToken = this.jwtService.generateRefreshToken({ publicKey });

    res.json({
      success: true,
      data: { accessToken, refreshToken, expiresIn: 900 }
    });
  }
}
```

#### **Profile Service**
- **Responsibility**: User profiles, contacts
- **Technology**: Node.js + Express + TypeScript
- **Database**: MongoDB (profiles, custom fields)
- **Endpoints**:
  - `GET /profile/:userId`
  - `PUT /profile`
  - `POST /profile/avatar`
  - `GET /profile/search?q=username`

#### **Wallet Service**
- **Responsibility**: Balance tracking, transaction history
- **Technology**: Go (for performance)
- **Database**: PostgreSQL (transaction history)
- **Cache**: Redis (balance caching)
- **Endpoints**:
  - `GET /wallet/balance`
  - `GET /wallet/transactions`
  - `POST /wallet/estimate-gas`
  - `POST /wallet/broadcast`

```go
// wallet-service/internal/handlers/balance_handler.go
package handlers

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

type BalanceHandler struct {
    balanceService *services.BalanceService
}

func (h *BalanceHandler) GetBalance(c *gin.Context) {
    chain := c.Query("chain")
    address := c.Query("address")

    balance, err := h.balanceService.GetBalance(chain, address)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data": balance,
    })
}
```

#### **Message Service**
- **Responsibility**: Message relay (for offline users), message storage (optional)
- **Technology**: Node.js + Socket.io
- **Database**: MongoDB (message history, optional)
- **Message Queue**: NATS (for pub/sub)
- **Endpoints** (WebSocket):
  - `message.send`
  - `message.status`
  - `message.list`

```typescript
// message-service/src/websocket/MessageHandler.ts
export class MessageHandler {
  constructor(
    private messageService: MessageService,
    private natsClient: NatsClient
  ) {}

  async handleSendMessage(socket: Socket, data: SendMessagePayload): Promise<void> {
    const { recipientId, encryptedContent } = data;

    // Check if recipient is online
    const recipientSocket = this.getSocketByUserId(recipientId);

    if (recipientSocket) {
      // Send directly via WebSocket
      recipientSocket.emit('message.new', {
        messageId: generateId(),
        senderId: socket.data.userId,
        encryptedContent,
        timestamp: new Date()
      });
    } else {
      // Recipient offline: store for later delivery
      await this.messageService.storeOfflineMessage(recipientId, encryptedContent);

      // Publish to NATS for potential delivery via other channels
      this.natsClient.publish(`message.offline.${recipientId}`, encryptedContent);
    }

    socket.emit('message.sent', { messageId: generateId() });
  }
}
```

#### **Calling Service**
- **Responsibility**: VoIP signaling, STUN/TURN coordination
- **Technology**: Node.js + WebRTC
- **Database**: PostgreSQL (call history)
- **Endpoints**:
  - `POST /calling/initiate`
  - `POST /calling/:callId/end`
  - `GET /calling/history`

#### **Feed Service**
- **Responsibility**: GPS-based feed flags
- **Technology**: Node.js + PostGIS (geospatial queries)
- **Database**: PostgreSQL with PostGIS extension
- **Cache**: Redis (for trending flags)
- **Endpoints**:
  - `POST /feed/flags`
  - `GET /feed/flags/nearby`
  - `POST /feed/flags/:flagId/like`

```typescript
// feed-service/src/repositories/FeedRepository.ts
export class FeedRepository {
  constructor(private db: PostgresDatabase) {}

  async findNearbyFlags(
    latitude: number,
    longitude: number,
    radiusKm: number,
    limit: number
  ): Promise<FeedFlag[]> {
    // PostGIS query for geospatial search
    const query = `
      SELECT *,
        ST_Distance(
          location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) / 1000 AS distance_km
      FROM feed_flags
      WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3 * 1000
      )
      AND view_count < max_views
      AND expires_at > NOW()
      ORDER BY distance_km ASC
      LIMIT $4
    `;

    const result = await this.db.query(query, [longitude, latitude, radiusKm, limit]);
    return result.rows.map(row => this.mapToFeedFlag(row));
  }
}
```

#### **AI Service**
- **Responsibility**: LLM queries, creature training, agent marketplace
- **Technology**: Python + FastAPI (for LLM integration)
- **Database**: PostgreSQL (creatures, agents), Vector DB (embeddings)
- **Endpoints**:
  - `POST /ai/query`
  - `GET /ai/creature`
  - `POST /ai/creature/train`
  - `GET /ai/marketplace`

#### **Game Service**
- **Responsibility**: Game marketplace, leaderboards
- **Technology**: Node.js + Express
- **Database**: MongoDB (games, scores)
- **CDN**: Cloudflare (for game assets)
- **Endpoints**:
  - `GET /games/marketplace`
  - `POST /games/:gameId/install`
  - `POST /games/:gameId/scores`

---

## 5. Database Design

### 5.1 Database Per Service

Each microservice has its own database (database-per-service pattern).

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Auth Service │   │Profile Service│   │Wallet Service│
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ PostgreSQL   │   │  MongoDB     │   │ PostgreSQL   │
│  auth_db     │   │ profile_db   │   │  wallet_db   │
└──────────────┘   └──────────────┘   └──────────────┘
```

### 5.2 Schema Designs

#### **Auth Service (PostgreSQL)**

```sql
-- users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_key VARCHAR(66) UNIQUE NOT NULL,  -- 0x + 64 chars
    username VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_public_key ON users(public_key);
CREATE INDEX idx_users_username ON users(username);

-- devices table
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    platform VARCHAR(20) NOT NULL,  -- 'ios' | 'android'
    last_active TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_device_id ON devices(device_id);

-- sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
```

#### **Wallet Service (PostgreSQL)**

```sql
-- accounts table
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    chain VARCHAR(20) NOT NULL,  -- 'ethereum' | 'solana' | 'bitcoin'
    address VARCHAR(100) NOT NULL,
    derivation_path VARCHAR(100),
    label VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, chain, address)
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_address ON accounts(address);
CREATE INDEX idx_accounts_chain ON accounts(chain);

-- transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    chain VARCHAR(20) NOT NULL,
    tx_hash VARCHAR(100) UNIQUE NOT NULL,
    from_address VARCHAR(100) NOT NULL,
    to_address VARCHAR(100) NOT NULL,
    value NUMERIC(78, 0) NOT NULL,  -- Support up to 256-bit integers
    token_address VARCHAR(100),  -- NULL for native token
    status VARCHAR(20) NOT NULL,  -- 'pending' | 'confirmed' | 'failed'
    block_number BIGINT,
    gas_used BIGINT,
    gas_price NUMERIC(78, 0),
    nonce INTEGER,
    timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_from_address ON transactions(from_address);
CREATE INDEX idx_transactions_to_address ON transactions(to_address);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX idx_transactions_status ON transactions(status);

-- tokens table
CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain VARCHAR(20) NOT NULL,
    address VARCHAR(100) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    decimals INTEGER NOT NULL,
    logo_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    coingecko_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(chain, address)
);

CREATE INDEX idx_tokens_chain ON tokens(chain);
CREATE INDEX idx_tokens_symbol ON tokens(symbol);
CREATE INDEX idx_tokens_verified ON tokens(verified);
```

#### **Profile Service (MongoDB)**

```typescript
// profiles collection
interface ProfileDocument {
  _id: ObjectId;
  userId: string;  // UUID from auth service
  username: string;
  displayName: string;
  bio: string;
  avatar: string;  // URL
  banner: string;  // URL
  walletAddresses: {
    [chain: string]: string;  // e.g., { ethereum: '0x...', solana: '...' }
  };
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    discord?: string;
  };
  customFields: Array<{
    key: string;
    value: string;
  }>;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
db.profiles.createIndex({ userId: 1 }, { unique: true });
db.profiles.createIndex({ username: 1 }, { unique: true });
db.profiles.createIndex({ displayName: 'text', bio: 'text' });  // Text search
```

```typescript
// contacts collection
interface ContactDocument {
  _id: ObjectId;
  userId: string;
  contactUserId: string;
  note: string;  // Private annotation
  addedAt: Date;
  lastInteraction: Date;
}

// Indexes
db.contacts.createIndex({ userId: 1, contactUserId: 1 }, { unique: true });
db.contacts.createIndex({ userId: 1, lastInteraction: -1 });
```

#### **Message Service (MongoDB)**

```typescript
// messages collection
interface MessageDocument {
  _id: ObjectId;
  messageId: string;  // UUID
  senderId: string;
  recipientId: string;
  conversationId: string;  // For 1-on-1: sorted [userId1, userId2].join('-')
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  encryptedContent: string;  // Base64 encrypted
  replyToId?: string;
  status: 'sent' | 'delivered' | 'read';
  timestamp: Date;
  edited: boolean;
  deletedAt?: Date;
}

// Indexes
db.messages.createIndex({ conversationId: 1, timestamp: -1 });
db.messages.createIndex({ messageId: 1 }, { unique: true });
db.messages.createIndex({ senderId: 1, timestamp: -1 });
db.messages.createIndex({ recipientId: 1, status: 1 });
```

```typescript
// groups collection
interface GroupDocument {
  _id: ObjectId;
  groupId: string;  // UUID
  name: string;
  description: string;
  avatar: string;
  ownerId: string;
  members: Array<{
    userId: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: Date;
  }>;
  settings: {
    allowMemberInvite: boolean;
    allowMemberPost: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
db.groups.createIndex({ groupId: 1 }, { unique: true });
db.groups.createIndex({ 'members.userId': 1 });
db.groups.createIndex({ ownerId: 1 });
```

#### **Feed Service (PostgreSQL + PostGIS)**

```sql
-- feed_flags table
CREATE TABLE feed_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL,  -- 'text' | 'image' | 'video' | 'poll'
    content JSONB NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,  -- PostGIS geography type
    location_name VARCHAR(255),
    anonymous BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    max_views INTEGER DEFAULT 100,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    tier VARCHAR(20) DEFAULT 'free',  -- 'free' | 'paid_500' | 'paid_1k' | 'paid_5k' | 'premium'
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feed_flags_user_id ON feed_flags(user_id);
CREATE INDEX idx_feed_flags_location ON feed_flags USING GIST(location);  -- Geospatial index
CREATE INDEX idx_feed_flags_expires_at ON feed_flags(expires_at);
CREATE INDEX idx_feed_flags_view_count ON feed_flags(view_count);
```

---

## 6. Blockchain Adapter Pattern

### 6.1 Interface Definition

```typescript
// src/application/wallet/ports/IBlockchainAdapter.ts
export interface IBlockchainAdapter {
  readonly chainName: string;
  readonly nativeToken: TokenMetadata;

  // Balance
  getBalance(address: string): Promise<Balance>;
  getTokenBalance(address: string, tokenAddress: string): Promise<Balance>;

  // Transactions
  signTransaction(tx: UnsignedTransaction, privateKey: string): Promise<SignedTransaction>;
  broadcastTransaction(signedTx: SignedTransaction): Promise<TxHash>;
  getTransactionStatus(txHash: string): Promise<TransactionStatus>;
  getTransactionHistory(address: string, limit: number): Promise<Transaction[]>;

  // Gas/Fees
  estimateGas(tx: UnsignedTransaction): Promise<GasEstimate>;

  // Tokens
  getTokenList(): Promise<TokenMetadata[]>;
  getTokenMetadata(tokenAddress: string): Promise<TokenMetadata>;
}

export interface UnsignedTransaction {
  from: string;
  to: string;
  value: bigint;
  data?: string;
  nonce?: number;
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;  // EIP-1559
  maxPriorityFeePerGas?: bigint;  // EIP-1559
}

export interface SignedTransaction {
  raw: string;  // Serialized transaction
  hash: string;
}

export interface Balance {
  balance: bigint;
  decimals: number;
  formatted: string;
  usdValue?: number;
}

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  totalFee: bigint;
  usdValue?: number;
}
```

### 6.2 Ethereum Adapter

```typescript
// src/infrastructure/blockchain/adapters/EthereumAdapter.ts
import { ethers } from 'ethers';

export class EthereumAdapter implements IBlockchainAdapter {
  chainName = 'ethereum';
  nativeToken = { symbol: 'ETH', decimals: 18, name: 'Ether' };

  constructor(private provider: ethers.providers.JsonRpcProvider) {}

  async getBalance(address: string): Promise<Balance> {
    const balance = await this.provider.getBalance(address);
    return {
      balance: BigInt(balance.toString()),
      decimals: 18,
      formatted: ethers.utils.formatEther(balance),
      usdValue: await this.getUSDValue('ETH', balance)
    };
  }

  async getTokenBalance(address: string, tokenAddress: string): Promise<Balance> {
    const erc20 = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    const [balance, decimals, symbol] = await Promise.all([
      erc20.balanceOf(address),
      erc20.decimals(),
      erc20.symbol()
    ]);

    return {
      balance: BigInt(balance.toString()),
      decimals,
      formatted: ethers.utils.formatUnits(balance, decimals),
      usdValue: await this.getUSDValue(symbol, balance)
    };
  }

  async signTransaction(
    tx: UnsignedTransaction,
    privateKey: string
  ): Promise<SignedTransaction> {
    const wallet = new ethers.Wallet(privateKey, this.provider);

    const ethTx: ethers.providers.TransactionRequest = {
      from: tx.from,
      to: tx.to,
      value: ethers.BigNumber.from(tx.value.toString()),
      data: tx.data,
      nonce: tx.nonce,
      gasLimit: tx.gasLimit ? ethers.BigNumber.from(tx.gasLimit.toString()) : undefined,
      gasPrice: tx.gasPrice ? ethers.BigNumber.from(tx.gasPrice.toString()) : undefined,
      maxFeePerGas: tx.maxFeePerGas ? ethers.BigNumber.from(tx.maxFeePerGas.toString()) : undefined,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas ? ethers.BigNumber.from(tx.maxPriorityFeePerGas.toString()) : undefined
    };

    const signedTx = await wallet.signTransaction(ethTx);
    const hash = ethers.utils.keccak256(signedTx);

    return {
      raw: signedTx,
      hash
    };
  }

  async broadcastTransaction(signedTx: SignedTransaction): Promise<TxHash> {
    const response = await this.provider.sendTransaction(signedTx.raw);
    return response.hash;
  }

  async estimateGas(tx: UnsignedTransaction): Promise<GasEstimate> {
    const gasLimit = await this.provider.estimateGas({
      from: tx.from,
      to: tx.to,
      value: ethers.BigNumber.from(tx.value.toString()),
      data: tx.data
    });

    const gasPrice = await this.provider.getGasPrice();

    return {
      gasLimit: BigInt(gasLimit.toString()),
      gasPrice: BigInt(gasPrice.toString()),
      totalFee: BigInt(gasLimit.mul(gasPrice).toString()),
      usdValue: await this.getGasUSDValue(gasLimit, gasPrice)
    };
  }
}
```

### 6.3 Solana Adapter

```typescript
// src/infrastructure/blockchain/adapters/SolanaAdapter.ts
import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';

export class SolanaAdapter implements IBlockchainAdapter {
  chainName = 'solana';
  nativeToken = { symbol: 'SOL', decimals: 9, name: 'Solana' };

  constructor(private connection: Connection) {}

  async getBalance(address: string): Promise<Balance> {
    const publicKey = new PublicKey(address);
    const lamports = await this.connection.getBalance(publicKey);

    return {
      balance: BigInt(lamports),
      decimals: 9,
      formatted: (lamports / 1e9).toString(),
      usdValue: await this.getUSDValue('SOL', BigInt(lamports))
    };
  }

  async signTransaction(
    tx: UnsignedTransaction,
    privateKey: string
  ): Promise<SignedTransaction> {
    const fromKeypair = Keypair.fromSecretKey(Buffer.from(privateKey, 'hex'));
    const toPubkey = new PublicKey(tx.to);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey,
        lamports: Number(tx.value)
      })
    );

    const { blockhash } = await this.connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromKeypair.publicKey;

    transaction.sign(fromKeypair);

    const raw = transaction.serialize().toString('base64');
    const hash = bs58.encode(transaction.signature!);

    return { raw, hash };
  }

  async broadcastTransaction(signedTx: SignedTransaction): Promise<TxHash> {
    const buffer = Buffer.from(signedTx.raw, 'base64');
    const signature = await this.connection.sendRawTransaction(buffer);
    return signature;
  }

  async estimateGas(tx: UnsignedTransaction): Promise<GasEstimate> {
    const fromPubkey = new PublicKey(tx.from);
    const toPubkey = new PublicKey(tx.to);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: Number(tx.value)
      })
    );

    const { value: { feeCalculator } } = await this.connection.getRecentBlockhash();
    const fee = feeCalculator.lamportsPerSignature;

    return {
      gasLimit: BigInt(1),  // Solana doesn't use gas limit
      gasPrice: BigInt(fee),
      totalFee: BigInt(fee),
      usdValue: await this.getGasUSDValue(BigInt(fee))
    };
  }
}
```

### 6.4 Adapter Factory

```typescript
// src/infrastructure/blockchain/factory/BlockchainAdapterFactory.ts
export class BlockchainAdapterFactory {
  private adapters = new Map<string, IBlockchainAdapter>();

  constructor() {
    this.registerAdapters();
  }

  private registerAdapters(): void {
    // Ethereum
    const ethProvider = new ethers.providers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_URL
    );
    this.adapters.set('ethereum', new EthereumAdapter(ethProvider));

    // Solana
    const solConnection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );
    this.adapters.set('solana', new SolanaAdapter(solConnection));

    // Binance Smart Chain (reuses Ethereum adapter with different RPC)
    const bscProvider = new ethers.providers.JsonRpcProvider(
      process.env.BSC_RPC_URL
    );
    this.adapters.set('bsc', new EthereumAdapter(bscProvider));

    // Bitcoin (future)
    // this.adapters.set('bitcoin', new BitcoinAdapter());
  }

  getAdapter(chain: string): IBlockchainAdapter {
    const adapter = this.adapters.get(chain);
    if (!adapter) {
      throw new Error(`Blockchain adapter for "${chain}" not found`);
    }
    return adapter;
  }

  getSupportedChains(): string[] {
    return Array.from(this.adapters.keys());
  }
}
```

---

## 7. Network Communication

### 7.1 Communication Types

| Type | Protocol | Usage | Latency | Reliability |
|------|----------|-------|---------|-------------|
| REST API | HTTP/HTTPS | CRUD operations | Medium | High |
| GraphQL | HTTP/HTTPS | Complex queries, batch operations | Medium | High |
| WebSocket | WSS | Real-time updates (messages, prices) | Low | Medium |
| gRPC | HTTP/2 | Mobile-server high-performance | Low | High |
| BLE | Bluetooth Low Energy | Peer-to-peer offline messaging | Very Low | Low |
| WebRTC | UDP/TCP | Voice/video calling | Very Low | Medium |

### 7.2 REST API Client

```typescript
// src/infrastructure/network/api/ApiClient.ts
import axios, { AxiosInstance } from 'axios';

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor: Add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: Handle errors, refresh token
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retried, refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            await this.logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post(url, data);
    return response.data;
  }

  // ... other methods (put, delete, patch)
}
```

### 7.3 WebSocket Client

```typescript
// src/infrastructure/network/websocket/WebSocketClient.ts
import { io, Socket } from 'socket.io-client';

export class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(url: string, token: string): void {
    this.socket = io(url, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, manually reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('reconnect_attempt', () => {
      this.reconnectAttempts++;
      console.log(`Reconnect attempt ${this.reconnectAttempts}`);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      // Fallback to polling or notify user
    });

    // Application events
    this.socket.on('message.new', (data) => this.handleNewMessage(data));
    this.socket.on('message.status', (data) => this.handleMessageStatus(data));
    this.socket.on('transaction.confirmed', (data) => this.handleTransactionConfirmed(data));
  }

  emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }
    this.socket.emit(event, data);
  }

  on(event: string, handler: (data: any) => void): void {
    this.socket?.on(event, handler);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
```

### 7.4 BLE Communication

```typescript
// src/infrastructure/network/ble/BLEManager.ts
import { BleManager as RNBleManager, Device } from 'react-native-ble-plx';

export class BLEManager {
  private manager: RNBleManager;
  private discoveredDevices = new Map<string, Device>();

  constructor() {
    this.manager = new RNBleManager();
  }

  async startScanning(): Promise<void> {
    const granted = await this.requestPermissions();
    if (!granted) throw new Error('BLE permissions not granted');

    this.manager.startDeviceScan(
      [SERVICE_UUID],  // Filter by service UUID
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.error('BLE scan error:', error);
          return;
        }

        if (device && device.serviceUUIDs?.includes(SERVICE_UUID)) {
          this.discoveredDevices.set(device.id, device);
          this.handleDeviceDiscovered(device);
        }
      }
    );
  }

  stopScanning(): void {
    this.manager.stopDeviceScan();
  }

  async connectToDevice(deviceId: string): Promise<void> {
    const device = this.discoveredDevices.get(deviceId);
    if (!device) throw new Error('Device not found');

    await device.connect();
    await device.discoverAllServicesAndCharacteristics();

    // Setup notifications for incoming messages
    device.monitorCharacteristicForService(
      SERVICE_UUID,
      CHARACTERISTIC_UUID,
      (error, characteristic) => {
        if (error) {
          console.error('BLE characteristic monitor error:', error);
          return;
        }

        if (characteristic?.value) {
          const data = Buffer.from(characteristic.value, 'base64');
          this.handleIncomingMessage(deviceId, data);
        }
      }
    );
  }

  async sendMessage(deviceId: string, message: Buffer): Promise<void> {
    const device = this.discoveredDevices.get(deviceId);
    if (!device?.isConnected) throw new Error('Device not connected');

    const base64 = message.toString('base64');
    await device.writeCharacteristicWithResponseForService(
      SERVICE_UUID,
      CHARACTERISTIC_UUID,
      base64
    );
  }

  private handleDeviceDiscovered(device: Device): void {
    // Emit event to UI layer
    EventEmitter.emit('ble:deviceDiscovered', {
      id: device.id,
      name: device.name,
      rssi: device.rssi  // Signal strength for distance estimation
    });
  }

  private handleIncomingMessage(deviceId: string, data: Buffer): void {
    // Decrypt and process message
    const decrypted = this.decryptMessage(data);
    EventEmitter.emit('ble:messageReceived', {
      deviceId,
      message: decrypted
    });
  }
}
```

---

## 8. Security Architecture

### 8.1 Security Layers

```
┌──────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                        │
│  - Input validation                                       │
│  - Business logic security                                │
│  - Authorization checks                                   │
└───────────────────────┬──────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────┐
│                  ENCRYPTION LAYER                         │
│  - AES-256-GCM for data at rest                          │
│  - TLS 1.3 for data in transit                           │
│  - Signal Protocol for messages                           │
│  - SRTP for voice calls                                   │
└───────────────────────┬──────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────┐
│                   KEY MANAGEMENT LAYER                    │
│  - iOS Keychain / Android Keystore                       │
│  - Secure Enclave / StrongBox (hardware)                 │
│  - Session key caching                                    │
└───────────────────────┬──────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────┐
│                    PLATFORM LAYER                         │
│  - Biometric authentication (Face ID, Fingerprint)       │
│  - OS-level security (sandboxing, permissions)           │
│  - Jailbreak/root detection                              │
└──────────────────────────────────────────────────────────┘
```

### 8.2 Key Management

```typescript
// src/infrastructure/encryption/KeyManager.ts
import * as Keychain from 'react-native-keychain';
import { AESEncryptor } from './AESEncryptor';

export class KeyManager {
  private encryptor = new AESEncryptor();
  private sessionKey: string | null = null;

  // Store master key in native keychain
  async storeMasterKey(key: string, pin: string): Promise<void> {
    // Derive encryption key from PIN
    const derivedKey = await this.deriveKeyFromPin(pin);

    // Encrypt master key with derived key
    const encrypted = await this.encryptor.encrypt(key, derivedKey);

    // Store in native keychain
    await Keychain.setGenericPassword('master_key', encrypted, {
      service: 'deyond.wallet',
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE  // Use Secure Enclave/StrongBox
    });
  }

  async retrieveMasterKey(pin: string): Promise<string> {
    // Retrieve from keychain
    const credentials = await Keychain.getGenericPassword({
      service: 'deyond.wallet'
    });

    if (!credentials) throw new Error('Master key not found');

    // Derive decryption key from PIN
    const derivedKey = await this.deriveKeyFromPin(pin);

    // Decrypt master key
    const masterKey = await this.encryptor.decrypt(credentials.password, derivedKey);

    // Cache in memory for session
    this.sessionKey = masterKey;

    return masterKey;
  }

  private async deriveKeyFromPin(pin: string): Promise<string> {
    // PBKDF2 key derivation
    const salt = await this.getSalt();  // Stored separately
    const iterations = 100000;

    return await Crypto.pbkdf2(pin, salt, iterations, 32, 'sha256');
  }

  clearSessionKey(): void {
    this.sessionKey = null;
  }
}
```

### 8.3 Message Encryption (Signal Protocol)

```typescript
// src/infrastructure/encryption/SignalProtocol.ts
import { SignalProtocolAddress, SessionCipher, PreKeyBundle } from '@signalapp/libsignal-client';

export class SignalProtocolManager {
  private store: SignalProtocolStore;

  constructor(store: SignalProtocolStore) {
    this.store = store;
  }

  // Sender encrypts message
  async encryptMessage(recipientAddress: string, plaintext: string): Promise<EncryptedMessage> {
    const address = SignalProtocolAddress.new(recipientAddress, 1);
    const sessionCipher = new SessionCipher(this.store, address);

    const ciphertext = await sessionCipher.encrypt(Buffer.from(plaintext, 'utf-8'));

    return {
      type: ciphertext.type(),
      body: ciphertext.serialize().toString('base64'),
      recipientAddress
    };
  }

  // Recipient decrypts message
  async decryptMessage(senderAddress: string, encryptedMessage: EncryptedMessage): Promise<string> {
    const address = SignalProtocolAddress.new(senderAddress, 1);
    const sessionCipher = new SessionCipher(this.store, address);

    const ciphertext = Buffer.from(encryptedMessage.body, 'base64');
    const plaintext = await sessionCipher.decrypt(ciphertext);

    return plaintext.toString('utf-8');
  }

  // Initialize session with pre-key bundle (first message)
  async processPreKeyBundle(recipientAddress: string, bundle: PreKeyBundle): Promise<void> {
    const address = SignalProtocolAddress.new(recipientAddress, 1);
    await SessionBuilder.processPreKeyBundle(bundle, address, this.store);
  }
}
```

---

## 9. Scalability & Performance

### 9.1 Horizontal Scaling

```
┌──────────────────────────────────────────────────────────┐
│                    LOAD BALANCER                          │
│                  (AWS ALB / Nginx)                        │
└───────────┬──────────────┬──────────────┬────────────────┘
            │              │              │
     ┌──────▼──────┐ ┌─────▼──────┐ ┌────▼───────┐
     │  API GW 1   │ │  API GW 2  │ │  API GW 3  │
     └──────┬──────┘ └─────┬──────┘ └────┬───────┘
            │              │              │
     ┌──────▼──────────────▼──────────────▼────────┐
     │         Microservices (Auto-scaled)         │
     │  Auth │ Profile │ Wallet │ Message │ ...    │
     └──────┬──────────┬──────────┬─────────────────┘
            │          │          │
     ┌──────▼──────────▼──────────▼────────┐
     │       Database Read Replicas         │
     │  Master (Write) → Replica 1, 2, 3   │
     └──────────────────────────────────────┘
```

### 9.2 Caching Strategy

```typescript
// src/infrastructure/cache/RedisCacheManager.ts
import Redis from 'ioredis';

export class RedisCacheManager {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async invalidate(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Usage: Cache balance with 5-minute TTL
await cacheManager.set(`balance:${chain}:${address}`, balance, 300);
```

**Cache Keys**:
- `balance:{chain}:{address}` - Token balances (5 min TTL)
- `tx:{txHash}` - Transaction details (10 min TTL)
- `price:{symbol}` - Token prices (1 min TTL)
- `profile:{userId}` - User profiles (15 min TTL)

---

## 10. Deployment Architecture

### 10.1 AWS Infrastructure

```
┌──────────────────────────────────────────────────────────┐
│                      AWS CLOUD                            │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              CloudFront (CDN)                        │ │
│  └──────────────────┬──────────────────────────────────┘ │
│                     │                                     │
│  ┌──────────────────▼──────────────────────────────────┐ │
│  │        Application Load Balancer (ALB)              │ │
│  └──────────────────┬──────────────────────────────────┘ │
│                     │                                     │
│  ┌──────────────────▼──────────────────────────────────┐ │
│  │         ECS Fargate (Containers)                     │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │ │
│  │  │  Auth    │  │ Wallet   │  │ Message  │  ...    │ │
│  │  │ Service  │  │ Service  │  │ Service  │         │ │
│  │  └──────────┘  └──────────┘  └──────────┘         │ │
│  └──────────────────┬──────────────────────────────────┘ │
│                     │                                     │
│  ┌──────────────────▼──────────────────────────────────┐ │
│  │             RDS PostgreSQL (Multi-AZ)               │ │
│  │  - Master (write) + Read Replica                    │ │
│  │  - Automated backups, point-in-time recovery        │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │            ElastiCache (Redis Cluster)              │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │             S3 (File Storage)                        │ │
│  │  - Avatar images, game assets, backups              │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-11-18 | Architecture Team | Initial architecture documentation |

---

## Related Documents
- [Feature List](./FEATURE_LIST.md)
- [PRD](./PRD.md)
- [API Endpoints](./API_ENDPOINTS.md)
- [Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [Security Considerations](./SECURITY.md)
- [Testing Strategy](./TESTING_STRATEGY.md)
- [Development Timeline](./DEVELOPMENT_TIMELINE.md)
