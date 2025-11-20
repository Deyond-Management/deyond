# Implementation Plan - Deyond Crypto Wallet Application

## Document Information
- **Project**: Deyond - Decentralized Social Crypto Wallet Platform
- **Version**: 1.0.0
- **Date**: 2025-11-19
- **Status**: Active Development Plan
- **Owner**: Engineering Team
- **Estimated Timeline**: 13-16 months (4 phases)

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Development Methodology](#2-development-methodology)
3. [Phase 1: MVP - Core Wallet (3-4 months)](#3-phase-1-mvp---core-wallet-3-4-months)
4. [Phase 2: Social Wallet (3-4 months)](#4-phase-2-social-wallet-3-4-months)
5. [Phase 3: Communication Hub (3-4 months)](#5-phase-3-communication-hub-3-4-months)
6. [Phase 4: AI & Gaming Platform (4-5 months)](#6-phase-4-ai--gaming-platform-4-5-months)
7. [Cross-Phase Considerations](#7-cross-phase-considerations)
8. [Risk Management](#8-risk-management)
9. [Team Structure](#9-team-structure)
10. [Success Metrics](#10-success-metrics)

---

## 1. Executive Summary

### 1.1 Project Scope

Deyond is a next-generation decentralized social crypto wallet platform combining:
- Multi-chain cryptocurrency wallet functionality
- End-to-end encrypted messaging
- BLE proximity discovery and mesh networking
- IP-based voice calling
- GPS-based social feeds
- AI-powered assistant and creature training
- Mini-game marketplace

### 1.2 Architecture Foundation

**Technology Stack:**
- **Frontend**: React Native 0.73+ with TypeScript 5.3+
- **State Management**: Redux Toolkit + Redux Persist
- **Architecture Pattern**: Clean Architecture with SOLID principles
- **Design Pattern**: Adapter pattern for blockchain support
- **Testing**: TDD approach with Jest + Detox
- **Security**: Multi-layer encryption, native keychain integration

**Project Structure (Monorepo):**
```
deyond/
├── packages/
│   ├── mobile/                    # React Native app
│   │   ├── src/
│   │   │   ├── domain/           # Entities & Use Cases (Business Logic)
│   │   │   ├── application/      # Application Services
│   │   │   ├── infrastructure/   # Framework & Drivers
│   │   │   └── presentation/     # UI Components & Screens
│   │   └── tests/
│   ├── core/                      # Shared core logic
│   │   ├── crypto/               # Cryptographic operations
│   │   ├── adapters/             # Blockchain adapters
│   │   └── utils/                # Shared utilities
│   ├── backend/                   # Backend services (optional)
│   └── shared/                    # Shared types & constants
└── docs/                          # Documentation
```

### 1.3 Development Principles

1. **Test-Driven Development (TDD)**: Write tests first, implement to pass
2. **Clean Architecture**: Separate concerns, dependency inversion
3. **Incremental Delivery**: Ship working features every sprint
4. **Security First**: Security review for all crypto operations
5. **Documentation**: Code is self-documenting with JSDoc

---

## 2. Development Methodology

### 2.1 Sprint Structure

- **Sprint Duration**: 2 weeks
- **Sprints per Phase**: 6-8 sprints
- **Sprint Ceremonies**:
  - Sprint Planning (Monday, 2 hours)
  - Daily Standup (15 minutes)
  - Sprint Review (Friday, 1 hour)
  - Sprint Retrospective (Friday, 1 hour)

### 2.2 Story Point Estimation

**Fibonacci Scale**: 1, 2, 3, 5, 8, 13, 21

- **1 point**: < 2 hours (simple utility function)
- **2 points**: 2-4 hours (basic component)
- **3 points**: 4-8 hours (feature component)
- **5 points**: 1-2 days (complex feature)
- **8 points**: 2-3 days (major feature)
- **13 points**: 3-5 days (epic-level feature, should be broken down)
- **21+ points**: Too large, must break down

**Velocity Target**: 40-60 story points per 2-week sprint (team of 5)

### 2.3 Definition of Done

A task is "Done" when:
- [ ] Code written following TypeScript strict mode
- [ ] Unit tests written (TDD) with 80%+ coverage
- [ ] Integration tests for API/service interactions
- [ ] Code reviewed and approved by 2+ engineers
- [ ] No TypeScript errors or ESLint warnings
- [ ] Documentation updated (JSDoc for public APIs)
- [ ] Security review for crypto/auth code
- [ ] Manual testing completed
- [ ] Merged to main branch

---

## 3. Phase 1: MVP - Core Wallet (3-4 months)

### 3.1 Phase Goals

**Objective**: Build a functional, secure cryptocurrency wallet for Ethereum

**Success Criteria**:
- Users can create/import wallets
- Users can send/receive ETH and ERC-20 tokens
- Private keys securely stored
- Biometric authentication working
- Passes security audit

### 3.2 Sprint Breakdown (6-8 sprints)

#### **Sprint 1-2: Project Setup & Infrastructure (Weeks 1-4)**

**Sprint 1: Foundation Setup**

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| Setup monorepo | Initialize pnpm workspace, configure paths | 3 | DevOps | None |
| React Native project | Create Expo app with TypeScript | 3 | Frontend | Monorepo |
| Configure ESLint/Prettier | Strict TypeScript, code standards | 2 | All | Project |
| Setup Jest | Unit test framework with coverage | 2 | QA | Project |
| Setup Detox | E2E test framework | 3 | QA | Project |
| CI/CD pipeline | GitHub Actions for tests/builds | 5 | DevOps | All above |
| Redux store setup | Redux Toolkit, persist config | 3 | Frontend | Project |
| **Total** | | **21** | | |

**Sprint 2: Security Infrastructure**

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| Native keychain integration | iOS Keychain, Android Keystore | 5 | Security | Project |
| Encryption service | AES-256-GCM implementation | 5 | Security | Keychain |
| Biometric auth module | Face ID, Touch ID, Fingerprint | 5 | Security | Keychain |
| PIN authentication | 6-digit PIN with lockout | 3 | Security | Keychain |
| Secure storage abstraction | Unified API for secure storage | 3 | Security | All above |
| Memory protection utils | Clear sensitive data helpers | 2 | Security | None |
| Security test suite | Unit tests for crypto ops | 3 | QA | All above |
| **Total** | | **26** | | |

---

#### **Sprint 3-4: Wallet Core (Weeks 5-8)**

**Sprint 3: Key Management (TDD)**

**Entities (Domain Models)**:
```typescript
// packages/mobile/src/domain/entities/Account.ts
export interface Account {
  id: string;
  address: string;
  name: string;
  derivationPath: string;
  publicKey: string;
  // private key never stored here
}

// packages/mobile/src/domain/entities/Wallet.ts
export interface Wallet {
  id: string;
  accounts: Account[];
  metadata: WalletMetadata;
}
```

**Use Cases (Business Logic)**:
```typescript
// packages/mobile/src/domain/useCases/CreateWalletUseCase.ts
export class CreateWalletUseCase {
  constructor(
    private mnemonicService: IMnemonicService,
    private keyringController: IKeyringController,
    private storageService: IStorageService
  ) {}

  async execute(params: {
    mnemonicLength: 12 | 24;
    password: string;
  }): Promise<Result<Wallet, WalletError>> {
    // Implementation
  }
}
```

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| BIP39 mnemonic generation | Generate 12/24-word phrases | 5 | Crypto | Security |
| BIP32 HD derivation | Hierarchical deterministic keys | 5 | Crypto | Mnemonic |
| Account entity | Domain model for accounts | 2 | Backend | None |
| Wallet entity | Domain model for wallets | 2 | Backend | Account |
| CreateWalletUseCase | Business logic for wallet creation | 5 | Backend | Entities |
| ImportWalletUseCase | Import from mnemonic/private key | 5 | Backend | Entities |
| KeyringController | Manage multiple accounts | 8 | Backend | Use cases |
| Vault encryption/decryption | Encrypt wallet with password | 5 | Security | Keyring |
| Unit tests (TDD) | Tests for all wallet logic | 8 | QA | All above |
| **Total** | | **45** | | |

**Sprint 4: Ethereum Integration**

**Blockchain Adapter Interface**:
```typescript
// packages/core/adapters/IBlockchainAdapter.ts
export interface IBlockchainAdapter {
  getBalance(address: string): Promise<Balance>;
  signTransaction(tx: Transaction, privateKey: string): Promise<SignedTransaction>;
  broadcastTransaction(signedTx: SignedTransaction): Promise<TxHash>;
  getTransactionHistory(address: string): Promise<Transaction[]>;
  estimateGas(tx: Transaction): Promise<GasEstimate>;
}
```

**Ethereum Adapter Implementation**:
```typescript
// packages/core/adapters/ethereum/EthereumAdapter.ts
export class EthereumAdapter implements IBlockchainAdapter {
  constructor(private rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  async getBalance(address: string): Promise<Balance> {
    const balance = await this.provider.getBalance(address);
    return {
      native: ethers.formatEther(balance),
      tokens: await this.getTokenBalances(address)
    };
  }

  // ... other methods
}
```

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| IBlockchainAdapter interface | Define adapter contract | 2 | Backend | None |
| EthereumAdapter impl | Implement Ethereum adapter | 8 | Blockchain | Interface |
| ethers.js integration | Configure provider, signer | 3 | Blockchain | Adapter |
| GetBalanceUseCase | Fetch ETH balance | 3 | Backend | Adapter |
| GetTokenBalanceUseCase | Fetch ERC-20 balances | 5 | Backend | Adapter |
| Transaction entity | Domain model for transactions | 2 | Backend | None |
| SignTransactionUseCase | Sign ETH transactions | 5 | Backend | Adapter |
| BroadcastTransactionUseCase | Broadcast to network | 3 | Backend | Adapter |
| Gas estimation service | Estimate gas with 3 speeds | 5 | Blockchain | Adapter |
| Unit tests | TDD for all Ethereum logic | 8 | QA | All above |
| **Total** | | **44** | | |

---

#### **Sprint 5-6: UI Components & Flows (Weeks 9-12)**

**Sprint 5: Onboarding & Wallet Setup**

**File Structure**:
```
packages/mobile/src/
├── presentation/
│   ├── screens/
│   │   ├── onboarding/
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── CreateWalletScreen.tsx
│   │   │   ├── ImportWalletScreen.tsx
│   │   │   ├── MnemonicDisplayScreen.tsx
│   │   │   ├── MnemonicVerifyScreen.tsx
│   │   │   └── SetupSecurityScreen.tsx
│   │   └── wallet/
│   │       ├── WalletHomeScreen.tsx
│   │       ├── SendScreen.tsx
│   │       ├── ReceiveScreen.tsx
│   │       └── TransactionHistoryScreen.tsx
│   ├── components/
│   │   ├── atoms/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Typography.tsx
│   │   ├── molecules/
│   │   │   ├── MnemonicWord.tsx
│   │   │   ├── AccountCard.tsx
│   │   │   ├── TransactionItem.tsx
│   │   │   └── TokenBalance.tsx
│   │   └── organisms/
│   │       ├── WalletHeader.tsx
│   │       ├── TransactionList.tsx
│   │       └── SendTransactionForm.tsx
│   └── navigation/
│       ├── AppNavigator.tsx
│       ├── AuthNavigator.tsx
│       └── MainTabNavigator.tsx
```

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| Design system setup | Colors, typography, spacing | 3 | Design | None |
| Atomic components | Button, Input, Card, etc. | 5 | Frontend | Design |
| Navigation structure | Stack, tab, modal navigators | 3 | Frontend | Project |
| WelcomeScreen | App intro with CTA | 2 | Frontend | Navigation |
| CreateWalletScreen | Wallet creation flow | 3 | Frontend | Use cases |
| MnemonicDisplayScreen | Show recovery phrase | 3 | Frontend | Wallet |
| MnemonicVerifyScreen | Verify user wrote down phrase | 5 | Frontend | Wallet |
| ImportWalletScreen | Import existing wallet | 3 | Frontend | Use cases |
| SetupSecurityScreen | PIN/biometric setup | 5 | Frontend | Security |
| Component tests | React Native Testing Library | 8 | QA | All above |
| **Total** | | **40** | | |

**Sprint 6: Transaction Flows**

**Redux Slices**:
```typescript
// packages/mobile/src/application/store/slices/walletSlice.ts
const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    currentAccount: null,
    accounts: [],
    balances: {},
    loading: false,
    error: null
  },
  reducers: {
    setCurrentAccount: (state, action) => {
      state.currentAccount = action.payload;
    },
    updateBalance: (state, action) => {
      state.balances[action.payload.address] = action.payload.balance;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBalance.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.balances[action.payload.address] = action.payload.balance;
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});
```

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| WalletHomeScreen | Display balance, accounts | 5 | Frontend | Components |
| Account switcher | Switch between accounts | 3 | Frontend | Redux |
| QR code generator | Generate receive QR code | 2 | Frontend | Library |
| ReceiveScreen | Show address and QR code | 2 | Frontend | QR |
| QR code scanner | Scan address for send | 3 | Frontend | Camera |
| SendScreen | Transaction form | 5 | Frontend | QR |
| Gas fee selector | Choose slow/standard/fast | 3 | Frontend | Gas service |
| Transaction confirmation | Review before sending | 5 | Frontend | Biometric |
| TransactionHistoryScreen | List past transactions | 3 | Frontend | Redux |
| TransactionItem component | Display tx details | 2 | Frontend | None |
| E2E tests | Complete user flows | 8 | QA | All above |
| **Total** | | **41** | | |

---

#### **Sprint 7-8: Polish & Security Audit (Weeks 13-16)**

**Sprint 7: Token Support & Error Handling**

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| ERC-20 token detection | Auto-discover tokens | 5 | Blockchain | Adapter |
| Custom token import | Add token by address | 3 | Frontend | Detection |
| Token list integration | CoinGecko/Uniswap list | 3 | Backend | API |
| Token price fetching | Real-time USD prices | 3 | Backend | API |
| Portfolio calculation | Total USD value | 2 | Backend | Prices |
| Error handling framework | Custom error classes | 3 | Backend | None |
| Retry logic | Network failure retries | 3 | Backend | Errors |
| User-friendly errors | Translate tech errors | 3 | Frontend | Errors |
| Loading states | Skeleton screens | 2 | Frontend | None |
| Empty states | No transactions, etc. | 2 | Frontend | None |
| Network status indicator | Online/offline banner | 2 | Frontend | None |
| Unit + Integration tests | Error scenarios | 5 | QA | All above |
| **Total** | | **36** | | |

**Sprint 8: Security Audit & Bug Fixes**

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| Internal code review | Security team review | 8 | Security | Phase 1 |
| Third-party audit | External security firm | 13 | Security | Phase 1 |
| Vulnerability fixes | Address audit findings | 13 | All | Audit |
| Penetration testing | Simulate attacks | 8 | Security | Fixes |
| Bug bash | Team-wide testing | 5 | All | Fixes |
| Performance optimization | Reduce load times | 5 | Frontend | None |
| Memory leak fixes | Profiling and fixes | 5 | Frontend | None |
| Documentation | User guide, dev docs | 5 | All | None |
| **Total** | | **62** | | |

---

### 3.3 Phase 1 Deliverables

**Features**:
- ✅ Create wallet with 12/24-word mnemonic
- ✅ Import wallet from mnemonic or private key
- ✅ Secure key storage with native keychain
- ✅ Biometric authentication (Face ID, Touch ID, Fingerprint)
- ✅ PIN authentication with lockout
- ✅ Ethereum support (mainnet, testnet)
- ✅ Send ETH transactions
- ✅ Receive ETH (QR code, address copy)
- ✅ ERC-20 token support
- ✅ Transaction history
- ✅ Gas estimation (slow, standard, fast)
- ✅ Real-time token prices
- ✅ Portfolio USD value

**Code Artifacts**:
```
packages/
├── mobile/
│   ├── src/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── Account.ts
│   │   │   │   ├── Wallet.ts
│   │   │   │   ├── Transaction.ts
│   │   │   │   └── Token.ts
│   │   │   └── useCases/
│   │   │       ├── CreateWalletUseCase.ts
│   │   │       ├── ImportWalletUseCase.ts
│   │   │       ├── SignTransactionUseCase.ts
│   │   │       ├── BroadcastTransactionUseCase.ts
│   │   │       ├── GetBalanceUseCase.ts
│   │   │       └── GetTransactionHistoryUseCase.ts
│   │   ├── application/
│   │   │   ├── services/
│   │   │   │   ├── KeyringController.ts
│   │   │   │   ├── TransactionController.ts
│   │   │   │   ├── EncryptionService.ts
│   │   │   │   └── BiometricService.ts
│   │   │   └── store/
│   │   │       ├── slices/
│   │   │       │   ├── walletSlice.ts
│   │   │       │   ├── transactionSlice.ts
│   │   │       │   └── authSlice.ts
│   │   │       └── store.ts
│   │   ├── infrastructure/
│   │   │   ├── adapters/
│   │   │   │   └── ethereum/
│   │   │   │       └── EthereumAdapter.ts
│   │   │   ├── storage/
│   │   │   │   ├── SecureStorageService.ts
│   │   │   │   └── KeychainService.ts
│   │   │   └── api/
│   │   │       └── PriceApi.ts
│   │   └── presentation/
│   │       ├── screens/
│   │       ├── components/
│   │       └── navigation/
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── e2e/
└── core/
    ├── crypto/
    │   ├── bip39/
    │   ├── bip32/
    │   └── encryption/
    └── adapters/
        └── IBlockchainAdapter.ts
```

**Testing**:
- 500+ unit tests (80%+ coverage)
- 50+ integration tests
- 20+ E2E tests
- Security audit passed

**Documentation**:
- API documentation (JSDoc)
- User guide (onboarding)
- Developer setup guide
- Security audit report

---

### 3.4 Phase 1 Dependencies & Risks

**External Dependencies**:
- React Native 0.73+
- ethers.js v6
- expo-secure-store
- react-native-biometrics
- Ethereum RPC provider (Infura, Alchemy)

**Technical Risks**:

| Risk | Impact | Mitigation | Owner |
|------|--------|------------|-------|
| React Native performance issues | Medium | Profile early, use native modules if needed | Frontend |
| Secure storage vulnerabilities | Critical | Multi-layer encryption, security audit | Security |
| Ethereum RPC rate limits | Medium | Implement caching, backup providers | Backend |
| Gas estimation inaccuracy | Low | Use multiple sources, add buffer | Blockchain |
| Biometric auth platform inconsistencies | Medium | Fallback to PIN, extensive testing | Security |

**Schedule Risks**:
- Security audit delays: Add 2-week buffer
- Platform-specific bugs: Budget 1 week per platform for fixes

---

## 4. Phase 2: Social Wallet (3-4 months)

### 4.1 Phase Goals

**Objective**: Add multi-chain support and social features

**Success Criteria**:
- Support 3+ blockchains (Ethereum, Solana, BSC)
- P2P encrypted messaging works
- BLE proximity discovery functional
- Can share profiles offline

### 4.2 Sprint Breakdown (6-8 sprints)

#### **Sprint 9-10: Multi-Chain Architecture (Weeks 17-20)**

**Sprint 9: Adapter Pattern Expansion**

**Chain Metadata**:
```typescript
// packages/core/adapters/ChainMetadata.ts
export interface ChainMetadata {
  chainId: string;
  name: string;
  symbol: string;
  decimals: number;
  logo: string;
  rpcUrls: string[];
  explorerUrls: string[];
  testnet: boolean;
}

export const CHAIN_METADATA: Record<string, ChainMetadata> = {
  ethereum: {
    chainId: '1',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    logo: 'https://cdn.deyond.io/chains/ethereum.png',
    rpcUrls: ['https://eth-mainnet.g.alchemy.com/v2/'],
    explorerUrls: ['https://etherscan.io'],
    testnet: false
  },
  solana: {
    chainId: 'mainnet-beta',
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    logo: 'https://cdn.deyond.io/chains/solana.png',
    rpcUrls: ['https://api.mainnet-beta.solana.com'],
    explorerUrls: ['https://solscan.io'],
    testnet: false
  }
};
```

**Adapter Factory**:
```typescript
// packages/core/adapters/BlockchainAdapterFactory.ts
export class BlockchainAdapterFactory {
  static create(chain: string, rpcUrl?: string): IBlockchainAdapter {
    switch (chain) {
      case 'ethereum':
      case 'bsc':
      case 'polygon':
        return new EVMChainAdapter(chain, rpcUrl);
      case 'solana':
        return new SolanaAdapter(rpcUrl);
      case 'bitcoin':
        return new BitcoinAdapter(rpcUrl);
      default:
        throw new Error(`Unsupported chain: ${chain}`);
    }
  }
}
```

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| Chain metadata registry | Define all chain configs | 3 | Backend | None |
| EVMChainAdapter base | Generic EVM adapter | 8 | Blockchain | Metadata |
| SolanaAdapter | Solana implementation | 8 | Blockchain | Interface |
| BitcoinAdapter (basic) | Bitcoin read-only | 5 | Blockchain | Interface |
| BlockchainAdapterFactory | Create adapters dynamically | 3 | Backend | Adapters |
| Multi-chain account derivation | BIP44 paths per chain | 5 | Crypto | Adapters |
| Chain switcher UI | Select active chain | 3 | Frontend | Factory |
| Per-chain balance display | Show all chain balances | 3 | Frontend | Adapters |
| Unit tests | TDD for all adapters | 8 | QA | All above |
| **Total** | | **46** | | |

**Sprint 10: Token Standards**

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| SPL token support | Solana token standard | 5 | Blockchain | Solana |
| BEP-20 token support | BSC token standard | 3 | Blockchain | EVM |
| Token metadata caching | Cache token info locally | 3 | Backend | Tokens |
| Token discovery service | Auto-detect all tokens | 5 | Backend | Adapters |
| Token import by address | Add custom tokens | 3 | Frontend | Service |
| Token hide/unhide | Declutter UI | 2 | Frontend | None |
| Token list UI | Display all tokens | 3 | Frontend | Service |
| Multi-chain send | Send tokens on any chain | 5 | Frontend | Adapters |
| NFT basic display | Show NFT images | 5 | Frontend | API |
| Integration tests | Multi-chain flows | 8 | QA | All above |
| **Total** | | **42** | | |

---

#### **Sprint 11-12: Messaging Infrastructure (Weeks 21-24)**

**Sprint 11: Signal Protocol Integration**

**Signal Protocol Setup**:
```typescript
// packages/core/crypto/signal/SignalProtocolService.ts
import { SignalProtocolStore, SessionBuilder, SessionCipher } from '@signalapp/libsignal-client';

export class SignalProtocolService {
  private store: SignalProtocolStore;

  async initializeSession(
    recipientAddress: string,
    preKeyBundle: PreKeyBundle
  ): Promise<void> {
    const sessionBuilder = new SessionBuilder(this.store, recipientAddress);
    await sessionBuilder.processPreKeyBundle(preKeyBundle);
  }

  async encryptMessage(
    recipientAddress: string,
    plaintext: string
  ): Promise<EncryptedMessage> {
    const sessionCipher = new SessionCipher(this.store, recipientAddress);
    const ciphertext = await sessionCipher.encrypt(Buffer.from(plaintext));
    return {
      type: ciphertext.type,
      body: ciphertext.body.toString('base64'),
      registrationId: await this.store.getLocalRegistrationId()
    };
  }

  async decryptMessage(
    senderAddress: string,
    ciphertext: EncryptedMessage
  ): Promise<string> {
    const sessionCipher = new SessionCipher(this.store, senderAddress);
    const plaintext = await sessionCipher.decrypt(
      ciphertext.type,
      Buffer.from(ciphertext.body, 'base64')
    );
    return plaintext.toString('utf-8');
  }
}
```

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| @signalapp/libsignal-client setup | Integrate Signal library | 5 | Security | None |
| SignalProtocolStore impl | Implement storage interface | 5 | Security | Library |
| Key exchange protocol (X3DH) | Establish sessions | 8 | Security | Store |
| Double Ratchet impl | Forward secrecy | 8 | Security | X3DH |
| Pre-key generation/rotation | Maintain key bundles | 5 | Security | Protocol |
| Message encryption service | Encrypt/decrypt messages | 5 | Security | Ratchet |
| SignalProtocolService tests | TDD for encryption | 8 | QA | All above |
| **Total** | | **44** | | |

**Sprint 12: Messaging Services**

**Message Entity**:
```typescript
// packages/mobile/src/domain/entities/Message.ts
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  type: 'text' | 'image' | 'video' | 'file';
  content: {
    text?: string;
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
  };
  encryptedContent: string; // Signal-encrypted payload
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: string;
  editedAt?: Date;
  createdAt: Date;
}
```

**Message Use Cases**:
```typescript
// packages/mobile/src/domain/useCases/SendMessageUseCase.ts
export class SendMessageUseCase {
  constructor(
    private signalService: SignalProtocolService,
    private messageRepository: IMessageRepository,
    private messagingApi: IMessagingApi
  ) {}

  async execute(params: {
    recipientId: string;
    text: string;
  }): Promise<Result<Message, MessageError>> {
    // 1. Encrypt with Signal Protocol
    const encrypted = await this.signalService.encryptMessage(
      params.recipientId,
      params.text
    );

    // 2. Create message entity
    const message = Message.create({
      recipientId: params.recipientId,
      content: { text: params.text },
      encryptedContent: encrypted.body,
      status: 'sending'
    });

    // 3. Save locally
    await this.messageRepository.save(message);

    // 4. Send to server
    try {
      await this.messagingApi.sendMessage(message);
      message.status = 'sent';
      await this.messageRepository.update(message);
      return Result.ok(message);
    } catch (error) {
      message.status = 'failed';
      await this.messageRepository.update(message);
      return Result.fail(new MessageError('Send failed', error));
    }
  }
}
```

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| Message entity | Domain model for messages | 2 | Backend | None |
| Conversation entity | Domain model for chats | 2 | Backend | Message |
| SendMessageUseCase | Business logic for sending | 5 | Backend | Entities |
| ReceiveMessageUseCase | Handle incoming messages | 5 | Backend | Entities |
| MessageRepository (SQLite) | Local message storage | 5 | Backend | Entities |
| WebSocket client | Real-time message delivery | 5 | Backend | API |
| Message queue | Offline message handling | 5 | Backend | Repository |
| Message sync service | Sync messages across devices | 5 | Backend | Queue |
| Delivery receipts | Track message status | 3 | Backend | WebSocket |
| Unit + Integration tests | TDD for messaging | 8 | QA | All above |
| **Total** | | **45** | | |

---

#### **Sprint 13-14: Profile & Contact Management (Weeks 25-28)**

**Sprint 13: Profile Service**

**Profile Entity**:
```typescript
// packages/mobile/src/domain/entities/Profile.ts
export interface Profile {
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  avatar?: string;
  banner?: string;
  walletAddresses: Record<string, string>; // { ethereum: '0x...', solana: '...' }
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    discord?: string;
  };
  customFields: Array<{ key: string; value: string }>;
  visibility: 'public' | 'contacts' | 'private';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| Profile entity | Domain model | 2 | Backend | None |
| CreateProfileUseCase | Create digital business card | 3 | Backend | Entity |
| UpdateProfileUseCase | Update profile data | 3 | Backend | Entity |
| ProfileRepository | Local + API storage | 5 | Backend | Entity |
| Profile API client | REST API for profiles | 3 | Backend | API |
| QR code generation | Generate profile QR code | 2 | Frontend | Library |
| QR code scanner | Scan profile QR code | 3 | Frontend | Camera |
| ProfileScreen UI | View/edit profile | 5 | Frontend | Use cases |
| Avatar upload | Image picker + upload | 3 | Frontend | API |
| Social link integration | OAuth for social accounts | 5 | Backend | API |
| Profile tests | TDD for profile logic | 5 | QA | All above |
| **Total** | | **39** | | |

**Sprint 14: Contact Management**

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| Contact entity | Domain model | 2 | Backend | Profile |
| AddContactUseCase | Send contact request | 3 | Backend | Entity |
| AcceptContactUseCase | Accept request | 3 | Backend | Entity |
| BlockContactUseCase | Block user | 2 | Backend | Entity |
| ContactRepository | Local storage | 3 | Backend | Entity |
| Contact request API | Backend endpoints | 3 | Backend | API |
| ContactsScreen UI | List contacts | 3 | Frontend | Repository |
| Contact request notifications | Push notifications | 3 | Frontend | FCM |
| Contact notes | Private annotations | 2 | Frontend | None |
| Contact search | Filter contacts | 2 | Frontend | Repository |
| Contact groups | Organize contacts | 3 | Frontend | Repository |
| Contact sync | Sync across devices | 3 | Backend | API |
| Contact tests | TDD for contacts | 5 | QA | All above |
| **Total** | | **37** | | |

---

#### **Sprint 15-16: BLE Proximity Discovery (Weeks 29-32)**

**Sprint 15: BLE Infrastructure (Critical Path)**

**BLE Architecture (Reference: Berty/Weshnet)**:
```typescript
// packages/core/ble/BLEService.ts
import BleManager from 'react-native-ble-plx';

export class BLEService {
  private manager: BleManager;
  private serviceUUID = 'DEYOND-SERVICE-UUID';
  private characteristicUUID = 'DEYOND-CHAR-UUID';

  async startAdvertising(profile: Profile): Promise<void> {
    // Advertise profile ID for discovery
    const payload = this.encodeProfile(profile);
    await this.manager.startAdvertising(this.serviceUUID, payload);
  }

  async startScanning(
    onDeviceFound: (device: BLEDevice) => void
  ): Promise<void> {
    this.manager.startDeviceScan(
      [this.serviceUUID],
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.error('BLE scan error:', error);
          return;
        }
        if (device) {
          onDeviceFound(this.parseDevice(device));
        }
      }
    );
  }

  async connectToDevice(deviceId: string): Promise<BLEConnection> {
    const device = await this.manager.connectToDevice(deviceId);
    await device.discoverAllServicesAndCharacteristics();
    return new BLEConnection(device, this);
  }
}
```

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| react-native-ble-plx setup | BLE library integration | 3 | Mobile | None |
| BLE permissions | Request Bluetooth permissions | 2 | Mobile | Library |
| BLEService implementation | Advertising + scanning | 8 | Mobile | Permissions |
| BLE device entity | Domain model for devices | 2 | Backend | None |
| Profile encoding/decoding | Serialize profile for BLE | 3 | Backend | Profile |
| RSSI distance estimation | Calculate distance from signal | 3 | Backend | BLE |
| Discovery modes | Active, passive, off | 3 | Backend | BLE |
| Battery optimization | Periodic scanning (12s on/off) | 5 | Mobile | BLE |
| BLE security | Per-session encryption | 5 | Security | BLE |
| Unit tests | TDD for BLE logic | 5 | QA | All above |
| **Total** | | **39** | | |

**Sprint 16: Discovery UI & Mesh Networking**

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| DiscoveryScreen UI | Show nearby devices | 5 | Frontend | BLE |
| Device list component | Display discovered devices | 3 | Frontend | BLE |
| Distance indicator | Show close/near/far | 2 | Frontend | RSSI |
| Profile preview modal | Preview before connecting | 3 | Frontend | Profile |
| Connection request flow | Send connection request | 3 | Frontend | Contact |
| Mesh network visualization | Graph of connections | 5 | Frontend | BLE |
| Event mode | Enhanced discovery | 3 | Backend | BLE |
| Discovery filters | Filter by interests | 3 | Frontend | Profile |
| Mesh relay (basic) | Forward messages via mesh | 8 | Backend | BLE |
| BLE E2E tests | Real device testing | 8 | QA | All above |
| **Total** | | **43** | | |

---

### 4.3 Phase 2 Deliverables

**Features**:
- ✅ Multi-chain support (Ethereum, Solana, BSC)
- ✅ EVMChainAdapter for EVM-compatible chains
- ✅ SolanaAdapter for Solana
- ✅ SPL token support
- ✅ Chain switcher UI
- ✅ End-to-end encrypted messaging (Signal Protocol)
- ✅ Direct messaging (1-on-1)
- ✅ Message delivery status
- ✅ Offline message queue
- ✅ Digital business card (profile)
- ✅ Profile sharing via QR code
- ✅ Contact management
- ✅ Contact requests
- ✅ BLE proximity discovery
- ✅ RSSI-based distance estimation
- ✅ Discovery modes (active, passive, off)
- ✅ Connection request workflow
- ✅ Basic mesh networking

**Code Artifacts**:
```
packages/
├── core/
│   ├── adapters/
│   │   ├── IBlockchainAdapter.ts
│   │   ├── BlockchainAdapterFactory.ts
│   │   ├── EVMChainAdapter.ts
│   │   ├── SolanaAdapter.ts
│   │   └── BitcoinAdapter.ts
│   ├── crypto/
│   │   └── signal/
│   │       ├── SignalProtocolService.ts
│   │       └── SignalProtocolStore.ts
│   └── ble/
│       ├── BLEService.ts
│       ├── BLEDevice.ts
│       └── BLEConnection.ts
├── mobile/
│   ├── src/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── Message.ts
│   │   │   │   ├── Conversation.ts
│   │   │   │   ├── Profile.ts
│   │   │   │   ├── Contact.ts
│   │   │   │   └── BLEDevice.ts
│   │   │   └── useCases/
│   │   │       ├── SendMessageUseCase.ts
│   │   │       ├── ReceiveMessageUseCase.ts
│   │   │       ├── CreateProfileUseCase.ts
│   │   │       ├── UpdateProfileUseCase.ts
│   │   │       ├── AddContactUseCase.ts
│   │   │       └── DiscoverNearbyDevicesUseCase.ts
│   │   ├── application/
│   │   │   ├── services/
│   │   │   │   ├── MessagingController.ts
│   │   │   │   ├── ProfileController.ts
│   │   │   │   ├── ContactController.ts
│   │   │   │   └── BLEController.ts
│   │   │   └── store/
│   │   │       └── slices/
│   │   │           ├── messagingSlice.ts
│   │   │           ├── profileSlice.ts
│   │   │           ├── contactSlice.ts
│   │   │           └── discoverySlice.ts
│   │   ├── infrastructure/
│   │   │   ├── repositories/
│   │   │   │   ├── MessageRepository.ts
│   │   │   │   ├── ConversationRepository.ts
│   │   │   │   ├── ProfileRepository.ts
│   │   │   │   └── ContactRepository.ts
│   │   │   └── api/
│   │   │       ├── MessagingApi.ts
│   │   │       ├── ProfileApi.ts
│   │   │       └── ContactApi.ts
│   │   └── presentation/
│   │       └── screens/
│   │           ├── messaging/
│   │           │   ├── ConversationListScreen.tsx
│   │           │   ├── ChatScreen.tsx
│   │           │   └── GroupChatScreen.tsx
│   │           ├── profile/
│   │           │   ├── ProfileScreen.tsx
│   │           │   ├── EditProfileScreen.tsx
│   │           │   └── QRCodeScreen.tsx
│   │           ├── contacts/
│   │           │   ├── ContactsScreen.tsx
│   │           │   └── ContactRequestsScreen.tsx
│   │           └── discovery/
│   │               └── DiscoveryScreen.tsx
```

**Testing**:
- 800+ unit tests
- 100+ integration tests
- 40+ E2E tests
- BLE real device testing

---

### 4.4 Phase 2 Dependencies & Risks

**External Dependencies**:
- @solana/web3.js
- @signalapp/libsignal-client
- react-native-ble-plx
- react-native-qrcode-svg
- react-native-camera (QR scanner)

**Technical Risks**:

| Risk | Impact | Mitigation | Owner |
|------|--------|------------|-------|
| Signal Protocol complexity | High | Hire consultant, allocate extra time | Security |
| BLE range limitations | High | Implement mesh networking, test at events | Mobile |
| BLE battery drain | Medium | Optimize scan intervals, background throttling | Mobile |
| Multi-chain account management | Medium | Comprehensive testing, clear UX | Blockchain |
| Message sync conflicts | Medium | Implement CRDT or last-write-wins | Backend |

---

## 5. Phase 3: Communication Hub (3-4 months)

### 5.1 Phase Goals

**Objective**: Build full communication platform with group messaging, voice calling, and social feeds

**Success Criteria**:
- Stable group chats (up to 256 members)
- Voice calls with good quality (MOS > 3.5)
- BLE mesh extends range to 100m+
- GPS feed flags visible on map

### 5.2 Sprint Breakdown (6-8 sprints)

#### **Sprint 17-18: Group Messaging (Weeks 33-36)**

**Sprint 17: Group Infrastructure**

**Group Entity**:
```typescript
// packages/mobile/src/domain/entities/Group.ts
export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  ownerId: string;
  members: GroupMember[];
  admins: string[];
  settings: GroupSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  userId: string;
  joinedAt: Date;
  role: 'owner' | 'admin' | 'member';
  permissions: GroupPermissions;
}

export interface GroupSettings {
  allowMemberInvite: boolean;
  allowMemberPost: boolean;
  requireApproval: boolean;
  maxMembers: number; // max 256
}
```

**Group Encryption (Sender Keys Protocol)**:
```typescript
// packages/core/crypto/signal/SenderKeysService.ts
export class SenderKeysService {
  async createGroupSession(
    groupId: string,
    members: string[]
  ): Promise<GroupSession> {
    // Each member generates sender key
    const senderKey = await this.generateSenderKey();

    // Distribute sender key to all members via pairwise encryption
    await Promise.all(
      members.map(memberId =>
        this.distributeSenderKey(memberId, senderKey)
      )
    );

    return new GroupSession(groupId, senderKey);
  }

  async encryptGroupMessage(
    session: GroupSession,
    plaintext: string
  ): Promise<EncryptedGroupMessage> {
    // Encrypt with sender key
    const ciphertext = await session.encrypt(plaintext);
    return {
      senderId: session.senderId,
      ciphertext,
      chainIndex: session.chainIndex
    };
  }
}
```

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| Group entity | Domain model | 2 | Backend | None |
| CreateGroupUseCase | Create group chat | 5 | Backend | Entity |
| AddMemberUseCase | Add members | 3 | Backend | Group |
| RemoveMemberUseCase | Remove members | 3 | Backend | Group |
| UpdateGroupSettingsUseCase | Change settings | 2 | Backend | Group |
| GroupRepository | Local + API storage | 5 | Backend | Entity |
| Sender Keys Protocol | Group encryption | 8 | Security | Signal |
| Group key distribution | Distribute keys to members | 5 | Security | Sender Keys |
| GroupController | Manage groups | 5 | Backend | Use cases |
| Unit tests | TDD for groups | 8 | QA | All above |
| **Total** | | **46** | | |

**Sprint 18: Group Messaging UI**

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| CreateGroupScreen | Group creation flow | 5 | Frontend | Controller |
| Group member selector | Add members | 3 | Frontend | Contacts |
| GroupChatScreen | Group chat UI | 5 | Frontend | Chat |
| Group info screen | View members, settings | 3 | Frontend | Group |
| Group admin controls | Kick, ban, promote | 3 | Frontend | Permissions |
| Group invite link | Generate shareable link | 3 | Frontend | API |
| Group QR code | Invite via QR code | 2 | Frontend | QR |
| Member list component | Display members | 2 | Frontend | None |
| Group notifications | Mute/unmute groups | 2 | Frontend | None |
| Group message delivery | Track delivery to all members | 5 | Backend | Messaging |
| Group E2E tests | Test group flows | 8 | QA | All above |
| **Total** | | **41** | | |

---

#### **Sprint 19-20: Voice Calling (Weeks 37-40)**

**Sprint 19: WebRTC Infrastructure**

**WebRTC Architecture**:
```typescript
// packages/core/calling/WebRTCService.ts
import { mediaDevices, RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;

  async initializePeerConnection(config: RTCConfiguration): Promise<void> {
    this.peerConnection = new RTCPeerConnection({
      iceServers: config.iceServers,
      iceCandidatePoolSize: 10
    });

    // Set up event handlers
    this.peerConnection.onicecandidate = this.handleICECandidate;
    this.peerConnection.ontrack = this.handleRemoteTrack;
    this.peerConnection.onconnectionstatechange = this.handleConnectionStateChange;
  }

  async startCall(recipientId: string): Promise<CallSession> {
    // Get local media stream
    this.localStream = await mediaDevices.getUserMedia({
      audio: true,
      video: false
    });

    // Add tracks to peer connection
    this.localStream.getTracks().forEach(track => {
      this.peerConnection!.addTrack(track, this.localStream!);
    });

    // Create offer
    const offer = await this.peerConnection!.createOffer();
    await this.peerConnection!.setLocalDescription(offer);

    // Send offer to signaling server
    const session = await this.signalingClient.sendOffer(recipientId, offer);

    return session;
  }

  async answerCall(offer: RTCSessionDescription): Promise<void> {
    // Set remote description
    await this.peerConnection!.setRemoteDescription(offer);

    // Get local media stream
    this.localStream = await mediaDevices.getUserMedia({
      audio: true,
      video: false
    });

    // Add tracks
    this.localStream.getTracks().forEach(track => {
      this.peerConnection!.addTrack(track, this.localStream!);
    });

    // Create answer
    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);

    // Send answer to signaling server
    await this.signalingClient.sendAnswer(answer);
  }

  async endCall(): Promise<void> {
    this.localStream?.getTracks().forEach(track => track.stop());
    this.peerConnection?.close();
    this.localStream = null;
    this.peerConnection = null;
  }
}
```

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| react-native-webrtc setup | WebRTC library | 3 | Mobile | None |
| WebRTCService implementation | Peer connection management | 8 | Backend | Library |
| Signaling server (WebSocket) | Call setup/teardown | 8 | Backend | WebRTC |
| STUN/TURN server setup | NAT traversal | 5 | DevOps | None |
| Call entity | Domain model for calls | 2 | Backend | None |
| InitiateCallUseCase | Start call | 5 | Backend | WebRTC |
| AnswerCallUseCase | Accept call | 5 | Backend | WebRTC |
| EndCallUseCase | End call | 3 | Backend | WebRTC |
| CallController | Manage call state | 5 | Backend | Use cases |
| Unit tests | TDD for calling | 8 | QA | All above |
| **Total** | | **52** | | |

**Sprint 20: Calling UI & Phone Numbers**

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| Phone number generation | Derive from public key | 3 | Backend | Crypto |
| ActivatePhoneNumberUseCase | Activate number | 3 | Backend | Number |
| Phone number API | Backend endpoints | 3 | Backend | API |
| CallScreen UI | In-call UI | 5 | Frontend | WebRTC |
| DialerScreen | Make calls | 3 | Frontend | Contacts |
| Incoming call screen | Accept/decline | 3 | Frontend | CallKit |
| CallKit integration (iOS) | Native call UI | 5 | Mobile | CallScreen |
| ConnectionService (Android) | Native call UI | 5 | Mobile | CallScreen |
| Call quality indicators | Network, latency | 3 | Frontend | WebRTC |
| Call history screen | View past calls | 2 | Frontend | Repository |
| Voicemail (basic) | Record message | 5 | Backend | API |
| Call E2E tests | Test calling flows | 8 | QA | All above |
| **Total** | | **48** | | |

---

#### **Sprint 21-22: BLE Mesh Networking (Weeks 41-44)**

**Sprint 21: Mesh Protocol**

**Mesh Networking Architecture**:
```typescript
// packages/core/ble/mesh/MeshNetworkService.ts
export class MeshNetworkService {
  private nodes: Map<string, MeshNode> = new Map();
  private routingTable: RoutingTable = new RoutingTable();

  async joinMesh(profile: Profile): Promise<MeshNode> {
    // Start advertising as mesh node
    await this.bleService.startAdvertising(profile);

    // Discover nearby nodes
    const nearbyNodes = await this.discoverNearbyNodes();

    // Build routing table
    nearbyNodes.forEach(node => {
      this.routingTable.addRoute(node.id, node.distance, [node.id]);
    });

    return this.localNode;
  }

  async sendMessageViaMesh(
    recipientId: string,
    message: Message
  ): Promise<void> {
    // Find route to recipient
    const route = this.routingTable.findRoute(recipientId);

    if (!route) {
      throw new Error('No route to recipient');
    }

    // Encrypt message with end-to-end encryption
    const encrypted = await this.signalService.encryptMessage(
      recipientId,
      message.content
    );

    // Create mesh packet
    const packet = MeshPacket.create({
      destinationId: recipientId,
      sourceId: this.localNode.id,
      payload: encrypted,
      ttl: 10, // max 10 hops
      route: route.path
    });

    // Forward to next hop
    const nextHop = route.path[0];
    await this.forwardPacket(nextHop, packet);
  }

  async handleIncomingPacket(packet: MeshPacket): Promise<void> {
    // Check if packet is for us
    if (packet.destinationId === this.localNode.id) {
      // Decrypt and deliver
      const message = await this.signalService.decryptMessage(
        packet.sourceId,
        packet.payload
      );
      await this.messageRepository.save(message);
      return;
    }

    // Forward packet
    if (packet.ttl > 0) {
      packet.ttl--;
      const nextHop = this.routingTable.getNextHop(packet.destinationId);
      if (nextHop) {
        await this.forwardPacket(nextHop, packet);
      }
    }
  }
}
```

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| Mesh node entity | Domain model for nodes | 2 | Backend | BLE |
| Routing table | Store mesh routes | 5 | Backend | Node |
| Mesh packet protocol | Define packet format | 3 | Backend | None |
| Multi-hop routing algorithm | Find paths through mesh | 8 | Backend | Routing |
| Packet forwarding | Relay packets | 5 | Backend | Routing |
| TTL (Time To Live) | Prevent loops | 2 | Backend | Packet |
| Mesh encryption | E2E encryption over mesh | 5 | Security | Signal |
| MeshNetworkService | Manage mesh | 8 | Backend | All above |
| Mesh visualization | Graph of network | 5 | Frontend | Service |
| Unit tests | TDD for mesh | 8 | QA | All above |
| **Total** | | **51** | | |

**Sprint 22: Mesh Optimization & Testing**

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| Connection quality monitoring | RSSI tracking | 3 | Backend | BLE |
| Route optimization | Choose best paths | 5 | Backend | Routing |
| Mesh resilience | Handle node failures | 5 | Backend | Routing |
| Bandwidth optimization | Compress packets | 3 | Backend | Packet |
| Battery optimization | Reduce mesh overhead | 5 | Mobile | BLE |
| Mesh event mode | Optimized for events | 3 | Backend | Mesh |
| Mesh analytics | Track network health | 3 | Backend | Service |
| Mesh UI indicators | Show connection path | 3 | Frontend | Visualization |
| Real-world testing | Test at events/conferences | 13 | QA | All above |
| Performance optimization | Reduce latency | 5 | All | Testing |
| **Total** | | **48** | | |

---

#### **Sprint 23-24: GPS Feed Flags (Weeks 45-48)**

**Sprint 23: Feed Infrastructure**

**Feed Entity**:
```typescript
// packages/mobile/src/domain/entities/FeedFlag.ts
export interface FeedFlag {
  id: string;
  userId: string;
  type: 'text' | 'image' | 'video' | 'poll';
  content: FeedContent;
  location: GeoLocation;
  visibility: FeedVisibility;
  stats: FeedStats;
  createdAt: Date;
  expiresAt: Date;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  name: string; // reverse geocoded
  fuzzing: boolean; // hide exact coordinates
}

export interface FeedVisibility {
  tier: 'free' | 'paid_500' | 'paid_1k' | 'paid_5k' | 'premium';
  anonymous: boolean;
  maxViews: number;
  currentViews: number;
}

export interface FeedStats {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
}
```

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| FeedFlag entity | Domain model | 2 | Backend | None |
| CreateFeedFlagUseCase | Post feed flag | 5 | Backend | Entity |
| GetNearbyFlagsUseCase | Fetch nearby flags | 5 | Backend | Entity |
| FeedRepository | Local + API storage | 5 | Backend | Entity |
| Geolocation service | Get GPS coordinates | 3 | Mobile | Permissions |
| Reverse geocoding | Address from coordinates | 3 | Backend | API |
| Location fuzzing | Hide exact location | 2 | Backend | Location |
| View tracking | Count unique views | 3 | Backend | Repository |
| Feed expiration service | Auto-delete expired | 3 | Backend | Repository |
| Feed monetization API | Paid tiers | 5 | Backend | API |
| Unit tests | TDD for feed logic | 5 | QA | All above |
| **Total** | | **41** | | |

**Sprint 24: Feed UI**

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| Map view (React Native Maps) | Display flags on map | 5 | Frontend | Library |
| CreateFeedFlagScreen | Post flag | 5 | Frontend | Use case |
| Feed flag markers | Custom map markers | 3 | Frontend | Map |
| Feed flag detail modal | View flag details | 3 | Frontend | Entity |
| List view | Sort by distance | 3 | Frontend | Repository |
| Feed interactions | Like, comment, share | 5 | Frontend | API |
| Trending algorithm | Rank by engagement | 5 | Backend | Stats |
| Feed notifications | New flags nearby | 3 | Frontend | Push |
| Geofencing | Auto-discover flags | 5 | Mobile | Location |
| Paid tier UI | Purchase visibility | 3 | Frontend | Payments |
| Feed E2E tests | Test feed flows | 8 | QA | All above |
| **Total** | | **48** | | |

---

### 5.3 Phase 3 Deliverables

**Features**:
- ✅ Group messaging (up to 256 members)
- ✅ Group encryption (Sender Keys Protocol)
- ✅ Group admin controls
- ✅ Group invite links and QR codes
- ✅ IP-based voice calling (WebRTC)
- ✅ Virtual phone numbers (a+country-number format)
- ✅ CallKit/ConnectionService integration
- ✅ Call history and voicemail
- ✅ BLE mesh networking (multi-hop)
- ✅ Mesh routing algorithm
- ✅ Mesh visualization
- ✅ GPS feed flags
- ✅ Map view of flags
- ✅ Feed visibility tiers (free, paid, premium)
- ✅ Feed interactions (like, comment, share)
- ✅ Trending feed algorithm
- ✅ Cloud backup (Google Drive integration)

**Testing**:
- 1200+ unit tests
- 150+ integration tests
- 60+ E2E tests
- Real-world mesh testing

---

## 6. Phase 4: AI & Gaming Platform (4-5 months)

### 6.1 Phase Goals

**Objective**: Integrate AI features and gaming marketplace

**Success Criteria**:
- AI assistant provides useful insights
- Users can train creatures
- Agent marketplace has 50+ agents
- Game marketplace has 20+ games

### 6.2 Sprint Breakdown (8-10 sprints)

#### **Sprint 25-27: LLM Integration (Weeks 49-54)**

**Sprint 25: AI Infrastructure**

**AI Service Architecture**:
```typescript
// packages/core/ai/LLMService.ts
import Anthropic from '@anthropic-ai/sdk';

export class LLMService {
  private client: Anthropic;

  async query(params: {
    prompt: string;
    context: UserContext;
  }): Promise<LLMResponse> {
    // Build context from wallet data
    const systemPrompt = this.buildSystemPrompt(params.context);

    // Call LLM API
    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: params.prompt }
      ]
    });

    return {
      text: response.content[0].text,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens
    };
  }

  private buildSystemPrompt(context: UserContext): string {
    return `You are a crypto wallet assistant. User context:
    - Total balance: ${context.totalBalance} USD
    - Top tokens: ${context.topTokens.join(', ')}
    - Recent transactions: ${context.recentTransactions.length}

    Provide helpful insights about their portfolio and transactions.`;
  }
}
```

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| LLM API integration | Anthropic Claude / OpenAI | 5 | AI | None |
| LLMService implementation | Query LLM with context | 5 | AI | API |
| Context builder | Build context from wallet | 5 | AI | Wallet |
| QueryAIUseCase | Business logic for queries | 3 | Backend | Service |
| AI response formatting | Parse and format responses | 3 | Backend | LLM |
| AI cost tracking | Track token usage | 2 | Backend | LLM |
| Privacy protection | Don't leak sensitive data | 5 | Security | LLM |
| AIController | Manage AI queries | 3 | Backend | Use case |
| Unit tests | TDD for AI logic | 5 | QA | All above |
| **Total** | | **36** | | |

**Sprint 26: AI Assistant UI**

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| AIAssistantScreen | Chat with AI | 5 | Frontend | Controller |
| Voice input | Speech-to-text | 5 | Frontend | API |
| Query history | View past queries | 2 | Frontend | Repository |
| Context controls | Choose context to share | 3 | Frontend | Privacy |
| AI suggestions | Proactive insights | 3 | Frontend | AI |
| AI rate limiting UI | Usage limits | 2 | Frontend | API |
| AI testing | Test various queries | 5 | QA | All above |
| **Total** | | **25** | | |

**Sprint 27: Creature Training Game (Part 1)**

**Creature Entity**:
```typescript
// packages/mobile/src/domain/entities/Creature.ts
export interface Creature {
  id: string;
  userId: string;
  type: 'finance' | 'social' | 'security' | 'gaming';
  level: number;
  xp: number;
  xpToNextLevel: number;
  stats: CreatureStats;
  abilities: Ability[];
  personality: Personality;
  appearance: Appearance;
  createdAt: Date;
  lastTrainedAt: Date;
}

export interface CreatureStats {
  intelligence: number;
  social: number;
  security: number;
  gaming: number;
}

export interface Ability {
  id: string;
  name: string;
  description: string;
  level: number;
  unlocked: boolean;
  requirements: AbilityRequirements;
}

export interface Personality {
  traits: string[];
  mood: 'happy' | 'neutral' | 'sad' | 'excited';
  favoriteActivities: string[];
}
```

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| Creature entity | Domain model | 3 | Backend | None |
| CreateCreatureUseCase | Create new creature | 3 | Backend | Entity |
| TrainCreatureUseCase | Train with activities | 5 | Backend | Entity |
| Creature type definitions | Finance, social, security, gaming | 2 | Backend | Entity |
| XP system | Leveling mechanics | 3 | Backend | Creature |
| Stats system | Track intelligence, etc. | 3 | Backend | Creature |
| Ability system | Unlock abilities | 5 | Backend | Stats |
| Personality system | Develop traits | 3 | Backend | Training |
| CreatureRepository | Local storage | 3 | Backend | Entity |
| Unit tests | TDD for creature | 5 | QA | All above |
| **Total** | | **35** | | |

---

#### **Sprint 28-30: Creature Game (Weeks 55-60)**

**Sprint 28: Creature Training Activities**

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| Training activity types | Define activity types | 2 | Backend | Creature |
| Q&A training | Answer questions | 5 | Backend | LLM |
| Task training | Complete tasks | 5 | Backend | Activities |
| Daily challenges | Generate challenges | 3 | Backend | Activities |
| XP rewards | Calculate rewards | 2 | Backend | XP |
| Evolution system | Visual changes | 5 | Frontend | Level |
| Breeding system (basic) | Combine creatures | 5 | Backend | Creature |
| CreatureController | Manage creatures | 5 | Backend | Use cases |
| Unit tests | TDD for training | 5 | QA | All above |
| **Total** | | **37** | | |

**Sprint 29: Creature UI**

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| Creature art generation | Use Stable Diffusion | 8 | AI | None |
| CreatureScreen | View creature | 5 | Frontend | Entity |
| Training UI | Train creature | 5 | Frontend | Activities |
| Stats display | Show stats | 2 | Frontend | Stats |
| Ability tree | View abilities | 3 | Frontend | Abilities |
| Evolution animation | Show evolution | 3 | Frontend | Evolution |
| Breeding UI | Combine creatures | 3 | Frontend | Breeding |
| PvP battles (basic) | Test creatures | 5 | Frontend | Creature |
| Creature tests | E2E for game | 5 | QA | All above |
| **Total** | | **39** | | |

**Sprint 30: AI Agent Marketplace (Part 1)**

**Agent Entity**:
```typescript
// packages/mobile/src/domain/entities/AIAgent.ts
export interface AIAgent {
  id: string;
  name: string;
  description: string;
  category: 'trading' | 'portfolio' | 'social' | 'content' | 'gaming';
  creatorId: string;
  pricing: AgentPricing;
  permissions: AgentPermissions;
  stats: AgentStats;
  icon: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentPricing {
  type: 'free' | 'subscription' | 'usage' | 'license';
  price?: number;
  currency: string;
  period?: 'day' | 'week' | 'month' | 'year';
}

export interface AgentPermissions {
  readBalance: boolean;
  executeTransactions: boolean;
  accessMessages: boolean;
  accessContacts: boolean;
  accessLocation: boolean;
}

export interface AgentStats {
  installs: number;
  rating: number;
  reviews: number;
  revenue: number;
}
```

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| AIAgent entity | Domain model | 2 | Backend | None |
| ExportCreatureAsAgentUseCase | Export to marketplace | 5 | Backend | Creature |
| InstallAgentUseCase | Install agent | 3 | Backend | Entity |
| AgentPermissionSystem | Granular permissions | 5 | Security | Agent |
| AgentRepository | Local + API storage | 3 | Backend | Entity |
| Agent marketplace API | Backend endpoints | 5 | Backend | API |
| AgentController | Manage agents | 5 | Backend | Use cases |
| Agent sandbox | Test agents safely | 8 | Security | Agent |
| Unit tests | TDD for agents | 5 | QA | All above |
| **Total** | | **41** | | |

---

#### **Sprint 31-33: Game Marketplace (Weeks 61-66)**

**Sprint 31: Game Infrastructure**

**Game Entity**:
```typescript
// packages/mobile/src/domain/entities/Game.ts
export interface Game {
  id: string;
  name: string;
  description: string;
  category: 'puzzle' | 'strategy' | 'casual' | 'rpg' | 'multiplayer';
  developerId: string;
  pricing: GamePricing;
  stats: GameStats;
  media: GameMedia;
  fileSize: number;
  version: string;
  lastUpdated: Date;
}

export interface GamePricing {
  type: 'free' | 'paid' | 'freemium';
  price?: number;
  iap: boolean; // in-app purchases
}

export interface GameStats {
  downloads: number;
  rating: number;
  reviews: number;
  dau: number; // daily active users
  revenue: number;
}

export interface GameMedia {
  icon: string;
  screenshots: string[];
  video?: string;
}
```

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| Game entity | Domain model | 2 | Backend | None |
| InstallGameUseCase | Download and install | 5 | Backend | Entity |
| UninstallGameUseCase | Remove game | 2 | Backend | Entity |
| GameRepository | Local storage | 3 | Backend | Entity |
| Game package format | Define package structure | 3 | Backend | None |
| Game SDK design | API for developers | 8 | Backend | Wallet |
| Wallet integration API | Games access wallet | 5 | Security | SDK |
| Game sandbox | Isolate games | 5 | Security | Game |
| GameController | Manage games | 5 | Backend | Use cases |
| Unit tests | TDD for games | 5 | QA | All above |
| **Total** | | **43** | | |

**Sprint 32: Game Marketplace UI**

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| GameMarketplaceScreen | Browse games | 5 | Frontend | Controller |
| Game details screen | View details | 3 | Frontend | Entity |
| Game installation UI | Download progress | 3 | Frontend | Install |
| InstalledGamesScreen | View installed | 2 | Frontend | Repository |
| Game launcher | Launch game | 3 | Frontend | WebView |
| Game reviews | Rate and review | 3 | Frontend | API |
| Game leaderboards | View scores | 3 | Frontend | API |
| In-game purchases | Buy with crypto | 5 | Frontend | Wallet |
| Game cloud save | Sync progress | 5 | Backend | API |
| Game E2E tests | Test game flows | 8 | QA | All above |
| **Total** | | **40** | | |

**Sprint 33: Agent Marketplace UI**

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| AgentMarketplaceScreen | Browse agents | 5 | Frontend | Controller |
| Agent details screen | View details | 3 | Frontend | Entity |
| Install agent UI | Install flow | 3 | Frontend | Install |
| Agent permissions UI | Configure permissions | 3 | Frontend | Permissions |
| InstalledAgentsScreen | View installed | 2 | Frontend | Repository |
| Agent analytics UI | View usage, earnings | 3 | Frontend | API |
| Agent reviews | Rate and review | 3 | Frontend | API |
| Export creature UI | Publish to marketplace | 3 | Frontend | Export |
| Agent pricing UI | Set pricing | 2 | Frontend | API |
| Agent E2E tests | Test agent flows | 8 | QA | All above |
| **Total** | | **35** | | |

---

#### **Sprint 34: Polish & Launch Prep (Weeks 67-68)**

| Task | Description | Story Points | Owner | Dependencies |
|------|-------------|--------------|-------|--------------|
| Performance optimization | All phases | 8 | All | Phase 4 |
| Bug bash | Team-wide testing | 8 | All | Phase 4 |
| Security audit (final) | Third-party audit | 13 | Security | Phase 4 |
| Vulnerability fixes | Address findings | 8 | All | Audit |
| Documentation update | User + dev docs | 5 | All | Phase 4 |
| App store assets | Screenshots, videos | 5 | Design | None |
| Marketing materials | Website, social | 5 | Marketing | None |
| Beta testing program | External testers | 8 | QA | Phase 4 |
| Launch preparation | App store submission | 5 | DevOps | Beta |
| **Total** | | **65** | | |

---

### 6.3 Phase 4 Deliverables

**Features**:
- ✅ LLM integration (Claude/GPT-4)
- ✅ AI assistant with wallet context
- ✅ Voice input for queries
- ✅ Creature training game
- ✅ Multiple creature types
- ✅ XP and leveling system
- ✅ Ability unlocks
- ✅ Creature evolution
- ✅ Creature breeding
- ✅ PvP battles
- ✅ AI agent marketplace
- ✅ Export creature as agent
- ✅ Agent permissions system
- ✅ Agent sandbox
- ✅ Mini-game marketplace
- ✅ Game SDK
- ✅ Wallet integration for games
- ✅ Cloud save sync
- ✅ Leaderboards
- ✅ In-game purchases

**Testing**:
- 1600+ unit tests
- 200+ integration tests
- 80+ E2E tests

---

## 7. Cross-Phase Considerations

### 7.1 Backend Services

While Deyond is primarily mobile-first with non-custodial architecture, some backend services are required:

**Backend Service Architecture**:
```
backend/
├── services/
│   ├── auth/                 # Authentication & authorization
│   ├── profile/              # Profile sync
│   ├── messaging/            # Message relay (offline users)
│   ├── calling/              # WebRTC signaling
│   ├── feed/                 # Feed flags & discovery
│   ├── ai/                   # LLM API proxy
│   ├── agent-marketplace/    # AI agent marketplace
│   ├── game-marketplace/     # Game marketplace
│   └── storage/              # Cloud backup
├── infrastructure/
│   ├── database/             # PostgreSQL, MongoDB
│   ├── cache/                # Redis
│   ├── queue/                # NATS/RabbitMQ
│   └── cdn/                  # Cloudflare
└── api-gateway/              # API Gateway (Kong/AWS API Gateway)
```

**Backend Technology Stack**:
- **Language**: TypeScript (Node.js) or Go
- **Framework**: Express/Fastify (Node.js) or Gin (Go)
- **API**: REST + GraphQL + WebSocket + gRPC
- **Database**: PostgreSQL (relational), MongoDB (documents)
- **Cache**: Redis
- **Queue**: NATS or RabbitMQ
- **Storage**: S3-compatible (AWS S3, Cloudflare R2)
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston/Pino (Node.js) or Zap (Go)

**Backend Implementation Timing**:
- **Phase 1**: Minimal (price API, RPC proxy)
- **Phase 2**: Profile sync, message relay
- **Phase 3**: Signaling server, feed service
- **Phase 4**: AI proxy, marketplaces

### 7.2 Continuous Integration/Continuous Deployment (CI/CD)

**GitHub Actions Workflow**:
```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run linter
        run: pnpm lint

      - name: Run type check
        run: pnpm type-check

      - name: Run unit tests
        run: pnpm test:unit --coverage

      - name: Run integration tests
        run: pnpm test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: pnpm install

      - name: Build iOS app
        run: pnpm ios:build

      - name: Run E2E tests
        run: pnpm test:e2e:ios

  build:
    runs-on: ubuntu-latest
    needs: [test, e2e]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Build Android
        run: pnpm android:build

      - name: Build iOS
        run: pnpm ios:build

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
```

**Deployment Strategy**:
- **Development**: Auto-deploy to TestFlight/Google Play Internal
- **Staging**: Manual approval, deploy to TestFlight/Google Play Beta
- **Production**: Manual approval, phased rollout (10% → 50% → 100%)

### 7.3 Security Across All Phases

**Security Checklist (Every Sprint)**:
- [ ] Security code review for crypto operations
- [ ] Dependency audit (npm audit, Snyk)
- [ ] SAST (Static Application Security Testing)
- [ ] Secret scanning (no hardcoded keys)
- [ ] Penetration testing (every phase)
- [ ] Third-party security audit (every phase)

**Security Tools**:
- **SAST**: ESLint security plugins, Semgrep
- **Dependency Scanning**: npm audit, Snyk, Dependabot
- **Secret Scanning**: GitGuardian, TruffleHog
- **Runtime Protection**: Jailbreak detection, SSL pinning

### 7.4 Documentation Strategy

**Documentation Deliverables (Every Phase)**:
- **API Documentation**: JSDoc → TypeDoc
- **User Guides**: In-app tutorials, help center
- **Developer Docs**: Setup guide, architecture docs
- **Security Docs**: Security audit reports
- **ADRs**: Architecture Decision Records

**Documentation Tools**:
- **Code Docs**: TypeDoc
- **User Docs**: Markdown + Docusaurus
- **API Docs**: Swagger/OpenAPI
- **Diagrams**: Mermaid, Excalidraw

---

## 8. Risk Management

### 8.1 Technical Risks

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| React Native performance | Medium | Medium | Profile early, native modules | Frontend |
| Signal Protocol complexity | High | High | Hire consultant, extra time | Security |
| BLE range limitations | High | High | Mesh networking, real-world testing | Mobile |
| WebRTC quality issues | Medium | High | Test on various networks, TURN servers | Backend |
| LLM API costs | Medium | Medium | Cache responses, rate limiting | AI |
| Blockchain RPC rate limits | Medium | Medium | Multiple providers, caching | Backend |
| Security vulnerabilities | Low | Critical | Multiple audits, bug bounty | Security |

### 8.2 Schedule Risks

| Risk | Probability | Impact | Mitigation | Buffer |
|------|-------------|--------|------------|--------|
| Security audit delays | Medium | High | Book early, allow 2-week buffer | 2 weeks |
| Platform-specific bugs | High | Medium | Budget 1 week per platform | 1 week |
| Third-party API changes | Low | Medium | Version pinning, fallbacks | None |
| Team member turnover | Low | High | Documentation, pair programming | None |
| Scope creep | Medium | High | Strict prioritization, say no | None |

### 8.3 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low user adoption | Medium | Critical | User research, MVP testing, marketing |
| Regulatory changes | Medium | High | Non-custodial architecture, legal counsel |
| Competitive pressure | High | Medium | Unique features, faster iteration |
| Funding runway | Low | Critical | Milestone-based funding, revenue streams |

---

## 9. Team Structure

### 9.1 Recommended Team Composition

**Core Team (Phase 1-2)**:
- **1x Tech Lead**: Architecture, code reviews
- **2x Frontend Engineers**: React Native, UI/UX
- **2x Backend Engineers**: Node.js/Go, crypto, blockchain
- **1x Security Engineer**: Cryptography, security audits
- **1x QA Engineer**: Testing, automation
- **1x DevOps Engineer**: CI/CD, infrastructure
- **1x Product Manager**: Requirements, prioritization
- **1x Designer**: UI/UX, visual design

**Expanded Team (Phase 3-4)**:
- **+1 Mobile Engineer**: BLE, native modules
- **+1 Backend Engineer**: Signaling, mesh networking
- **+1 AI Engineer**: LLM integration, creature game
- **+1 QA Engineer**: E2E testing, real-world testing

**Total Team Size**:
- **Phase 1-2**: 9 people
- **Phase 3-4**: 13 people

### 9.2 Role Responsibilities

**Tech Lead**:
- Define architecture
- Code reviews (all critical code)
- Technical decisions (ADRs)
- Mentor engineers
- Unblock team

**Frontend Engineers**:
- React Native development
- UI component library
- State management (Redux)
- E2E testing (Detox)

**Backend Engineers**:
- API development (REST, GraphQL, WebSocket)
- Blockchain integration
- Cryptography (BIP39, BIP32, Signal Protocol)
- Database design

**Security Engineer**:
- Security architecture
- Crypto operations review
- Penetration testing
- Security audits
- Incident response

**QA Engineer**:
- Test planning
- Unit tests (TDD)
- Integration tests
- E2E tests
- Bug triage

**DevOps Engineer**:
- CI/CD pipelines
- Infrastructure (AWS, GCP, Azure)
- Monitoring (Prometheus, Grafana)
- Incident response

**Product Manager**:
- Requirements gathering
- Prioritization
- Sprint planning
- Stakeholder communication
- User research

**Designer**:
- UI/UX design
- Design system
- Prototyping (Figma)
- User testing
- Visual assets

---

## 10. Success Metrics

### 10.1 Development Metrics (Internal)

**Per Sprint**:
- **Velocity**: 40-60 story points per 2-week sprint
- **Code Coverage**: 80%+ unit tests, 70%+ integration tests
- **Code Quality**: 0 TypeScript errors, 0 ESLint warnings
- **Bug Count**: < 5 critical bugs per sprint
- **Code Review Time**: < 24 hours to first review

**Per Phase**:
- **On-Time Delivery**: Ship within 3-4 months per phase
- **Security**: Pass security audit with 0 critical vulnerabilities
- **Performance**: Meet non-functional requirements (app launch < 3s, API < 500ms)
- **Crash Rate**: < 0.1% crash-free sessions

### 10.2 Product Metrics (External)

**Phase 1 (MVP)**:
- 10K+ users
- 2K+ DAU (Daily Active Users)
- 40% Day 1 retention
- 20% Day 7 retention
- 4.5+ app store rating

**Phase 2 (Social Wallet)**:
- 100K+ users
- 30K+ DAU
- 50% Day 1 retention
- 30% Day 7 retention
- 5K+ messages sent per day

**Phase 3 (Communication)**:
- 500K+ users
- 150K+ DAU
- 55% Day 1 retention
- 35% Day 7 retention
- 1K+ voice calls per day

**Phase 4 (AI & Gaming)**:
- 1M+ users
- 400K+ DAU
- 60% Day 1 retention
- 40% Day 7 retention
- 10K+ creatures trained
- 50+ agents in marketplace
- 20+ games in marketplace

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-11-19 | Engineering Team | Initial implementation plan |

---

## Related Documents

- [Feature List](./FEATURE_LIST.md)
- [PRD (Product Requirements Document)](./PRD.md)
- [API Endpoints](./API_ENDPOINTS.md)
- [Security Considerations](./SECURITY.md)
- [Testing Strategy](./TESTING_STRATEGY.md)
- [Architecture Design](./ARCHITECTURE.md)

---

## Appendix A: Glossary

**Terms**:
- **TDD**: Test-Driven Development - Write tests first, then implement
- **BIP39**: Bitcoin Improvement Proposal 39 - Mnemonic code for generating deterministic keys
- **BIP32**: Bitcoin Improvement Proposal 32 - Hierarchical Deterministic wallets
- **BIP44**: Bitcoin Improvement Proposal 44 - Multi-account hierarchy for deterministic wallets
- **HD Wallet**: Hierarchical Deterministic wallet - Generate multiple accounts from one seed
- **Signal Protocol**: End-to-end encryption protocol used by Signal, WhatsApp
- **X3DH**: Extended Triple Diffie-Hellman - Key agreement protocol for asynchronous messaging
- **Double Ratchet**: Encryption protocol providing forward secrecy and break-in recovery
- **BLE**: Bluetooth Low Energy - Low-power wireless protocol
- **RSSI**: Received Signal Strength Indicator - Measure of signal power
- **Mesh Network**: Network where nodes relay data for each other
- **WebRTC**: Web Real-Time Communication - P2P audio/video/data communication
- **STUN/TURN**: NAT traversal protocols for WebRTC
- **LLM**: Large Language Model - AI model like GPT-4, Claude
- **Clean Architecture**: Software architecture pattern separating concerns by layers

---

## Appendix B: File Structure Reference

**Complete Project Structure**:
```
deyond/
├── packages/
│   ├── mobile/                           # React Native app
│   │   ├── src/
│   │   │   ├── domain/                   # Business logic (Clean Architecture)
│   │   │   │   ├── entities/
│   │   │   │   │   ├── Account.ts
│   │   │   │   │   ├── Wallet.ts
│   │   │   │   │   ├── Transaction.ts
│   │   │   │   │   ├── Token.ts
│   │   │   │   │   ├── Message.ts
│   │   │   │   │   ├── Conversation.ts
│   │   │   │   │   ├── Profile.ts
│   │   │   │   │   ├── Contact.ts
│   │   │   │   │   ├── Group.ts
│   │   │   │   │   ├── FeedFlag.ts
│   │   │   │   │   ├── Creature.ts
│   │   │   │   │   ├── AIAgent.ts
│   │   │   │   │   ├── Game.ts
│   │   │   │   │   └── BLEDevice.ts
│   │   │   │   └── useCases/
│   │   │   │       ├── wallet/
│   │   │   │       │   ├── CreateWalletUseCase.ts
│   │   │   │       │   ├── ImportWalletUseCase.ts
│   │   │   │       │   ├── SignTransactionUseCase.ts
│   │   │   │       │   ├── BroadcastTransactionUseCase.ts
│   │   │   │       │   └── GetBalanceUseCase.ts
│   │   │   │       ├── messaging/
│   │   │   │       │   ├── SendMessageUseCase.ts
│   │   │   │       │   ├── ReceiveMessageUseCase.ts
│   │   │   │       │   ├── CreateGroupUseCase.ts
│   │   │   │       │   └── SendGroupMessageUseCase.ts
│   │   │   │       ├── profile/
│   │   │   │       │   ├── CreateProfileUseCase.ts
│   │   │   │       │   └── UpdateProfileUseCase.ts
│   │   │   │       ├── calling/
│   │   │   │       │   ├── InitiateCallUseCase.ts
│   │   │   │       │   ├── AnswerCallUseCase.ts
│   │   │   │       │   └── EndCallUseCase.ts
│   │   │   │       ├── feed/
│   │   │   │       │   ├── CreateFeedFlagUseCase.ts
│   │   │   │       │   └── GetNearbyFlagsUseCase.ts
│   │   │   │       ├── ai/
│   │   │   │       │   ├── QueryAIUseCase.ts
│   │   │   │       │   ├── CreateCreatureUseCase.ts
│   │   │   │       │   └── TrainCreatureUseCase.ts
│   │   │   │       └── games/
│   │   │   │           ├── InstallGameUseCase.ts
│   │   │   │           └── InstallAgentUseCase.ts
│   │   │   ├── application/              # Application services
│   │   │   │   ├── services/
│   │   │   │   │   ├── KeyringController.ts
│   │   │   │   │   ├── TransactionController.ts
│   │   │   │   │   ├── MessagingController.ts
│   │   │   │   │   ├── ProfileController.ts
│   │   │   │   │   ├── ContactController.ts
│   │   │   │   │   ├── BLEController.ts
│   │   │   │   │   ├── CallingController.ts
│   │   │   │   │   ├── FeedController.ts
│   │   │   │   │   ├── AIController.ts
│   │   │   │   │   ├── CreatureController.ts
│   │   │   │   │   ├── AgentController.ts
│   │   │   │   │   ├── GameController.ts
│   │   │   │   │   ├── EncryptionService.ts
│   │   │   │   │   └── BiometricService.ts
│   │   │   │   └── store/
│   │   │   │       ├── slices/
│   │   │   │       │   ├── authSlice.ts
│   │   │   │       │   ├── walletSlice.ts
│   │   │   │       │   ├── transactionSlice.ts
│   │   │   │       │   ├── messagingSlice.ts
│   │   │   │       │   ├── profileSlice.ts
│   │   │   │       │   ├── contactSlice.ts
│   │   │   │       │   ├── discoverySlice.ts
│   │   │   │       │   ├── callingSlice.ts
│   │   │   │       │   ├── feedSlice.ts
│   │   │   │       │   ├── aiSlice.ts
│   │   │   │       │   ├── creatureSlice.ts
│   │   │   │       │   ├── agentSlice.ts
│   │   │   │       │   └── gameSlice.ts
│   │   │   │       └── store.ts
│   │   │   ├── infrastructure/           # External interfaces
│   │   │   │   ├── adapters/
│   │   │   │   │   └── ethereum/
│   │   │   │   │       └── EthereumAdapter.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   ├── WalletRepository.ts
│   │   │   │   │   ├── MessageRepository.ts
│   │   │   │   │   ├── ConversationRepository.ts
│   │   │   │   │   ├── ProfileRepository.ts
│   │   │   │   │   ├── ContactRepository.ts
│   │   │   │   │   ├── FeedRepository.ts
│   │   │   │   │   ├── CreatureRepository.ts
│   │   │   │   │   ├── AgentRepository.ts
│   │   │   │   │   └── GameRepository.ts
│   │   │   │   ├── storage/
│   │   │   │   │   ├── SecureStorageService.ts
│   │   │   │   │   ├── KeychainService.ts
│   │   │   │   │   └── SQLiteService.ts
│   │   │   │   └── api/
│   │   │   │       ├── AuthApi.ts
│   │   │   │       ├── WalletApi.ts
│   │   │   │       ├── PriceApi.ts
│   │   │   │       ├── MessagingApi.ts
│   │   │   │       ├── ProfileApi.ts
│   │   │   │       ├── ContactApi.ts
│   │   │   │       ├── CallingApi.ts
│   │   │   │       ├── FeedApi.ts
│   │   │   │       ├── AIApi.ts
│   │   │   │       ├── AgentMarketplaceApi.ts
│   │   │   │       └── GameMarketplaceApi.ts
│   │   │   └── presentation/             # UI layer
│   │   │       ├── screens/
│   │   │       │   ├── onboarding/
│   │   │       │   │   ├── WelcomeScreen.tsx
│   │   │       │   │   ├── CreateWalletScreen.tsx
│   │   │       │   │   ├── ImportWalletScreen.tsx
│   │   │       │   │   ├── MnemonicDisplayScreen.tsx
│   │   │       │   │   ├── MnemonicVerifyScreen.tsx
│   │   │       │   │   └── SetupSecurityScreen.tsx
│   │   │       │   ├── wallet/
│   │   │       │   │   ├── WalletHomeScreen.tsx
│   │   │       │   │   ├── SendScreen.tsx
│   │   │       │   │   ├── ReceiveScreen.tsx
│   │   │       │   │   └── TransactionHistoryScreen.tsx
│   │   │       │   ├── messaging/
│   │   │       │   │   ├── ConversationListScreen.tsx
│   │   │       │   │   ├── ChatScreen.tsx
│   │   │       │   │   ├── CreateGroupScreen.tsx
│   │   │       │   │   └── GroupChatScreen.tsx
│   │   │       │   ├── profile/
│   │   │       │   │   ├── ProfileScreen.tsx
│   │   │       │   │   ├── EditProfileScreen.tsx
│   │   │       │   │   └── QRCodeScreen.tsx
│   │   │       │   ├── contacts/
│   │   │       │   │   ├── ContactsScreen.tsx
│   │   │       │   │   └── ContactRequestsScreen.tsx
│   │   │       │   ├── discovery/
│   │   │       │   │   └── DiscoveryScreen.tsx
│   │   │       │   ├── calling/
│   │   │       │   │   ├── CallScreen.tsx
│   │   │       │   │   ├── DialerScreen.tsx
│   │   │       │   │   ├── IncomingCallScreen.tsx
│   │   │       │   │   └── CallHistoryScreen.tsx
│   │   │       │   ├── feed/
│   │   │       │   │   ├── FeedMapScreen.tsx
│   │   │       │   │   └── CreateFeedFlagScreen.tsx
│   │   │       │   ├── ai/
│   │   │       │   │   ├── AIAssistantScreen.tsx
│   │   │       │   │   └── CreatureScreen.tsx
│   │   │       │   ├── agents/
│   │   │       │   │   ├── AgentMarketplaceScreen.tsx
│   │   │       │   │   └── InstalledAgentsScreen.tsx
│   │   │       │   └── games/
│   │   │       │       ├── GameMarketplaceScreen.tsx
│   │   │       │       └── InstalledGamesScreen.tsx
│   │   │       ├── components/
│   │   │       │   ├── atoms/
│   │   │       │   │   ├── Button.tsx
│   │   │       │   │   ├── Input.tsx
│   │   │       │   │   ├── Card.tsx
│   │   │       │   │   └── Typography.tsx
│   │   │       │   ├── molecules/
│   │   │       │   │   ├── MnemonicWord.tsx
│   │   │       │   │   ├── AccountCard.tsx
│   │   │       │   │   ├── TransactionItem.tsx
│   │   │       │   │   ├── TokenBalance.tsx
│   │   │       │   │   └── MessageBubble.tsx
│   │   │       │   └── organisms/
│   │   │       │       ├── WalletHeader.tsx
│   │   │       │       ├── TransactionList.tsx
│   │   │       │       ├── SendTransactionForm.tsx
│   │   │       │       ├── ConversationList.tsx
│   │   │       │       └── ChatInput.tsx
│   │   │       └── navigation/
│   │   │           ├── AppNavigator.tsx
│   │   │           ├── AuthNavigator.tsx
│   │   │           └── MainTabNavigator.tsx
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── e2e/
│   │   ├── app.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── core/                             # Shared core logic
│   │   ├── crypto/
│   │   │   ├── bip39/
│   │   │   │   └── MnemonicService.ts
│   │   │   ├── bip32/
│   │   │   │   └── HDKeyService.ts
│   │   │   ├── encryption/
│   │   │   │   └── AESService.ts
│   │   │   └── signal/
│   │   │       ├── SignalProtocolService.ts
│   │   │       ├── SignalProtocolStore.ts
│   │   │       └── SenderKeysService.ts
│   │   ├── adapters/
│   │   │   ├── IBlockchainAdapter.ts
│   │   │   ├── BlockchainAdapterFactory.ts
│   │   │   ├── EVMChainAdapter.ts
│   │   │   ├── SolanaAdapter.ts
│   │   │   └── BitcoinAdapter.ts
│   │   ├── ble/
│   │   │   ├── BLEService.ts
│   │   │   ├── BLEDevice.ts
│   │   │   ├── BLEConnection.ts
│   │   │   └── mesh/
│   │   │       ├── MeshNetworkService.ts
│   │   │       ├── MeshNode.ts
│   │   │       ├── RoutingTable.ts
│   │   │       └── MeshPacket.ts
│   │   ├── calling/
│   │   │   ├── WebRTCService.ts
│   │   │   ├── SignalingClient.ts
│   │   │   └── CallSession.ts
│   │   ├── ai/
│   │   │   └── LLMService.ts
│   │   └── utils/
│   │       ├── errors/
│   │       ├── result/
│   │       └── validation/
│   ├── backend/                          # Backend services (optional)
│   │   ├── services/
│   │   │   ├── auth/
│   │   │   ├── profile/
│   │   │   ├── messaging/
│   │   │   ├── calling/
│   │   │   ├── feed/
│   │   │   ├── ai/
│   │   │   ├── agent-marketplace/
│   │   │   ├── game-marketplace/
│   │   │   └── storage/
│   │   └── infrastructure/
│   │       ├── database/
│   │       ├── cache/
│   │       └── queue/
│   └── shared/                           # Shared types & constants
│       ├── types/
│       └── constants/
├── docs/
│   ├── FEATURE_LIST.md
│   ├── PRD.md
│   ├── API_ENDPOINTS.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── SECURITY.md
│   ├── TESTING_STRATEGY.md
│   └── ARCHITECTURE.md
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── e2e.yml
│       └── deploy.yml
├── pnpm-workspace.yaml
└── README.md
```

---

**End of Implementation Plan**
