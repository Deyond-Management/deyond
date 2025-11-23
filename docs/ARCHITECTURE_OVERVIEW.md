# MetaMask Mobile - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Wallet    │  │ Transactions │  │   Tokens     │          │
│  │   Screen    │  │   View       │  │   Manager    │          │
│  └─────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Browser    │  │   Settings   │  │   Approval   │          │
│  │  (Web3)     │  │   Screen     │  │   Modals     │          │
│  └─────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   REDUX STATE MANAGEMENT LAYER                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Redux Store (Persisted)                                       │
│  ├── Accounts Reducer                                          │
│  ├── Transactions Reducer                                      │
│  ├── Networks Reducer                                          │
│  ├── Tokens Reducer                                            │
│  ├── DApp Sessions Reducer                                     │
│  └── UI State Reducer                                          │
│                                                                 │
│  Redux-Saga Middleware (Side Effects)                          │
│  ├── Transaction Sagas                                         │
│  ├── Network Sagas                                             │
│  ├── Gas Polling Sagas                                         │
│  └── Authentication Sagas                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CORE BUSINESS LOGIC LAYER                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              Engine (Central Service Hub)               │ │
│  │  Manages and Initializes All Controllers               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                          ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Controller Messenger Bus                   │  │
│  │  Restricted Communication Between Services             │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          ▼                                     │
│  ┌──────────┐ ┌────────────┐ ┌─────────────┐ ┌────────────┐   │
│  │ Accounts │ │Transaction │ │  Networks   │ │   Gas      │   │
│  │Controller│ │ Controller │ │ Controller  │ │ Controller │   │
│  └──────────┘ └────────────┘ └─────────────┘ └────────────┘   │
│                                                                 │
│  ┌──────────┐ ┌────────────┐ ┌─────────────┐ ┌────────────┐   │
│  │ Tokens   │ │Permissions │ │  WalletConn │ │   Snaps    │   │
│  │Controller│ │ Controller │ │ Controller  │ │ Controller │   │
│  └──────────┘ └────────────┘ └─────────────┘ └────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 SECURITY & ENCRYPTION LAYER                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐    │
│  │  Vault (Secure) │  │ Encryptor    │  │  React Native  │    │
│  │  Data Storage   │  │ (AES-256-GCM)│  │  Keychain      │    │
│  └─────────────────┘  └──────────────┘  └────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  PBKDF2 Key Derivation | Biometric Auth | Session Mgmt  │  │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              BLOCKCHAIN & EXTERNAL SERVICES LAYER               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  RPC Methods │  │ WalletConnect│  │  Deep Linking│         │
│  │  (JSON-RPC)  │  │ (V1 & V2)    │  │             │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         ▼                  ▼                   ▼               │
│  ┌──────────────────────────────────────────────────────┐     │
│  │         Ethereum/Polygon/Bitcoin/TRON Nodes         │     │
│  │         DApp Services (WalletConnect Hub)           │     │
│  │         Firebase Cloud Messaging                     │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow - Transaction Example

```
User Interface (Confirmation Modal)
         ▼
Redux Action: submitTransaction()
         ▼
Redux-Saga Middleware
         ▼
Engine -> Transaction Controller
         ▼
Transaction Validation:
  ├─ Check address format
  ├─ Verify gas limit
  ├─ Spam detection
  └─ Origin verification
         ▼
Private Key Retrieval:
  ├─ Vault decryption
  └─ Encryptor (PBKDF2 + AES-256-GCM)
         ▼
Transaction Signing:
  ├─ secp256k1 ECDSA
  └─ @metamask/eth-sig-util
         ▼
RPC Send:
  ├─ JSON-RPC: eth_sendRawTransaction
  └─ Broadcast to Network Node
         ▼
Transaction Tracking:
  ├─ Store in Redux (transaction reducer)
  └─ Update UI (TransactionView component)
         ▼
Persistence:
  ├─ Redux-Persist writes to device storage
  └─ State hydration on app restart
```

## Module Dependency Graph

```
Frontend Components
    │
    ├─→ Redux Store (selectors)
    │
    ├─→ Redux Actions/Sagas
    │
    └─→ Redux-Saga Middleware
            │
            ├─→ Engine Service
            │
            ├─→ Controllers
            │
            ├─→ Utilities (/app/util)
            │
            └─→ Crypto Libraries
                    │
                    ├─→ Encryptor/Vault (local storage)
                    │
                    ├─→ Keychain (device secrets)
                    │
                    ├─→ secp256k1 (signing)
                    │
                    └─→ ethers/viem (blockchain)


External Connectivity
    │
    ├─→ WalletConnect Bridge
    │      │
    │      └─→ DApp Sessions
    │
    ├─→ RPC Providers
    │      │
    │      └─→ Ethereum/Polygon/etc Nodes
    │
    ├─→ Deep Links
    │      │
    │      └─→ External Apps
    │
    └─→ Firebase Cloud Messaging
           │
           └─→ Push Notifications
```

## Security Layers

```
1. TRANSPORT SECURITY
   ├─ HTTPS for all API calls
   ├─ TLS for blockchain connections
   └─ Signed/verified WalletConnect messages

2. DATA SECURITY
   ├─ AES-256-GCM encryption at rest
   ├─ PBKDF2 key derivation
   ├─ Vault encryption for sensitive data
   └─ React Native Keychain for OS-level storage

3. APPLICATION SECURITY
   ├─ Permission scope management
   ├─ Transaction spam detection
   ├─ URL/phishing detection
   ├─ Origin throttling
   └─ Input validation & sanitization

4. CRYPTOGRAPHIC SECURITY
   ├─ secp256k1 for ECDSA signing
   ├─ BIP39 for seed phrase handling
   ├─ Constant-time comparisons
   └─ LavaMoat runtime lockdown

5. AUTHENTICATION SECURITY
   ├─ Biometric unlock (Face ID/Touch ID)
   ├─ Password-based encryption
   ├─ Session management
   └─ Screen lock timeout
```

## Feature Module Dependencies

```
CORE WALLET
├─ Accounts Controller
├─ Encryptor + Vault
├─ React Native Keychain
└─ secp256k1

TRANSACTION MANAGEMENT
├─ Transaction Controller
├─ Gas Polling Service
├─ RPC Methods
├─ Spam Detection
└─ ethers/viem libraries

TOKEN MANAGEMENT
├─ Assets/Tokens Controller
├─ Token Detection Service
├─ Price Feed Integration
└─ ethers library

NETWORK SWITCHING
├─ Networks Controller
├─ RPC Provider Management
├─ Gas Estimation Service
└─ Multi-RPC Support

WALLETCONNECT
├─ WalletConnect Core
├─ Session Management
├─ Session Persistence
└─ Redux Store for sessions

IN-APP BROWSER
├─ React Native WebView
├─ Web3 Provider Injection
├─ RPC Method Interception
└─ Permission System

SNAPS SUPPORT
├─ Snap Bridge
├─ SnapKeyring
├─ Snaps Middleware
├─ Permission Framework
└─ Location Capabilities
```

## Testing Architecture

```
UNIT TESTS
├─ Jest Framework
├─ Controller tests
├─ Utility function tests
├─ Redux reducer tests
└─ Hook tests (useFeatureFlagStats, etc.)

E2E TESTS
├─ Detox Framework
├─ User flow tests
├─ Navigation tests
├─ Transaction flow tests
└─ DApp interaction tests

INTEGRATION TESTS
├─ BrowserStack (cloud)
├─ Multiple device/OS combinations
├─ Real blockchain interaction
└─ Performance testing

CI/CD PIPELINE
├─ Pre-commit: ESLint + Prettier + Type checking
├─ PR validation: Title, labels, complexity
├─ Build: Android + iOS for E2E
├─ Test: Smoke, Regression, Performance
├─ Security: Code scanning, Dependency audit
└─ Release: Automated PR, changelog, tags
```

## State Management Flow

```
Redux Store Structure:

Root State:
├── accounts
│   ├── accountsByChain
│   ├── selectedAccount
│   └── accountNicknames
│
├── transactions
│   ├── submittedTransactions
│   ├── confirmedTransactions
│   └── transactionsByAccount
│
├── networks
│   ├── selectedNetwork
│   ├── customRpcUrls
│   └── networkConfigs
│
├── tokens
│   ├── tokensByNetwork
│   ├── tokenDetectionEnabled
│   └── userAddedTokens
│
├── walletConnect
│   ├── sessions
│   ├── pendingApprovals
│   └── sessionMetadata
│
├── snaps
│   ├── installedSnaps
│   ├── snapPermissions
│   └── snapStates
│
└── ui
    ├── theme
    ├── navigationState
    └── modalsVisible
```

## Development Workflow

```
CODE CHANGES
    ↓
GIT COMMIT (Husky Pre-commit Hook)
    ├─ ESLint (code style)
    ├─ Prettier (formatting)
    ├─ TypeScript (type checking)
    └─ Commit message validation
    ↓
PUSH TO BRANCH
    ↓
GITHUB ACTIONS WORKFLOW
    ├─ Code Quality
    │  ├─ ESLint
    │  ├─ Security scan
    │  └─ Attribution check
    │
    ├─ Build
    │  ├─ Android APK
    │  └─ iOS IPA
    │
    ├─ Tests
    │  ├─ Unit tests (Jest)
    │  ├─ E2E tests (Detox)
    │  ├─ Performance tests
    │  └─ BrowserStack tests
    │
    └─ Approval → Merge
         ↓
    MAIN BRANCH
         ↓
    RELEASE (Automated)
         ├─ Create release PR
         ├─ Update changelog
         ├─ Build artifacts
         └─ Deploy to stores
```

---

## Key File Locations for Quick Reference

```
App Entry Point:
  index.js (root)
  App.tsx or index.tsx (main component)

Redux Setup:
  /app/store/index.ts
  /app/store/persistConfig/
  /app/store/sagas/

Core Engine:
  /app/core/Engine/Engine.ts
  /app/core/Engine/EngineService.ts

Controllers:
  /app/core/[ControllerName]/

Security:
  /app/core/Vault/
  /app/core/Encryptor/
  /app/core/SecureKeychain/

UI Screens:
  /app/components/Views/

Transaction Logic:
  /app/core/Transaction/
  /app/core/RPCMethods/
  /app/util/transactions/

Utilities:
  /app/util/conversions.js
  /app/util/validators/
  /app/util/transactions/

Tests:
  __tests__/ (alongside source files)
  /e2e/ (E2E tests)
  /appwright/ (test utilities)
```

