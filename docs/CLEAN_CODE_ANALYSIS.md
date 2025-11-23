# Crypto Wallet App - Clean Code Analysis

## Executive Summary
The codebase demonstrates good architectural patterns but suffers from significant code duplication, inconsistent naming conventions, and scattered magic numbers. The following analysis identifies 10 high-impact improvements that would significantly reduce technical debt.

---

## TOP 10 MOST IMPACTFUL CLEAN CODE IMPROVEMENTS

### 1. Extract Unified HTTP Client Base Class
**Impact: HIGH** | **Files Affected: 2** | **Duplicated Lines: ~80**

**Problem:**
- `ApiClient.ts` and `NetworkService.ts` contain nearly identical retry logic, timeout handling, and delay utilities
- Both implement the same exponential backoff pattern: `Math.pow(2, attempt) * 1000`
- Both have `fetchWithTimeout()`, `delay()` methods

**Files:**
- `/home/user/deyond/crypto-wallet-app/src/services/ApiClient.ts` (lines 90-143)
- `/home/user/deyond/crypto-wallet-app/src/services/NetworkService.ts` (lines 154-219)

**Code Patterns:**
```typescript
// Both implement identical retry logic
for (let attempt = 0; attempt <= retries; attempt++) {
  try {
    // request logic
    await this.delay(Math.pow(2, attempt) * 1000); // DUPLICATED
  }
}

// Both have fetchWithTimeout
private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), this.timeout);
  // DUPLICATED
}

// Both have delay utility
private delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms)); // DUPLICATED
}
```

**Recommended Solution:**
```typescript
// Create: src/services/base/BaseHttpClient.ts
export abstract class BaseHttpClient {
  protected timeout: number;
  protected defaultHeaders: Record<string, string>;

  protected async fetchWithTimeout(url: string, opts: RequestInit): Promise<Response>
  protected delay(ms: number): Promise<void>
  protected calculateBackoffDelay(attempt: number, baseDelay: number): number
  protected async requestWithRetry<T>(
    method: string,
    url: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T>
}
```

---

### 2. Create Address Validation Constants Module
**Impact: HIGH** | **Files Affected: 4** | **Duplicated Regex: 4 instances**

**Problem:**
- Ethereum address validation regex appears in 4 different files
- No validation for other address types (ENS, contract addresses)
- Magic regex string: `/^0x[a-fA-F0-9]{40}$/` repeated

**Files:**
- `/home/user/deyond/crypto-wallet-app/src/services/BalanceService.ts` (line 32)
- `/home/user/deyond/crypto-wallet-app/src/services/TransactionService.ts` (line 241)
- `/home/user/deyond/crypto-wallet-app/src/services/GasService.ts` (line 217)
- `/home/user/deyond/crypto-wallet-app/src/services/ChatService.ts` (implied)

**Recommended Solution:**
```typescript
// Create: src/utils/validators/AddressValidator.ts
export class AddressValidator {
  static readonly ETH_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
  static readonly ETH_ADDRESS_CHECKSUM_PATTERN = /^0x[0-9a-fA-F]{40}$/;
  static readonly MIN_ADDRESS_LENGTH = 42; // 0x + 40 chars
  
  static isValidEthereumAddress(address: string): boolean {
    return this.ETH_ADDRESS_PATTERN.test(address);
  }
  
  static normalizeAddress(address: string): string {
    return address.toLowerCase();
  }
  
  static truncateAddress(address: string, chars: number = 6): string {
    return `${address.slice(0, chars)}...${address.slice(-4)}`;
  }
}
```

---

### 3. Centralize Magic Numbers and Constants
**Impact: HIGH** | **Categories: 15+** | **Affected Files: 8+**

**Problem:**
Multiple uncentralized magic numbers across codebase:

| Category | Values | Files | Issue |
|----------|--------|-------|-------|
| **Cache TTL** | 60000, 30000, 15000 | PriceService, BalanceService, GasService | Inconsistent naming + values |
| **Gas Limits** | 21000, 65000, 100000, 15000000 | GasService, TransactionService | No constants |
| **Decimals** | 18, 6 | Config, BalanceService, PriceService | Hardcoded |
| **Timeouts** | 30000, 60000 | ApiClient, NetworkService, config | Inconsistent |
| **Retry Count** | 0, 3, 5 | Config, Services | No defaults |
| **ERC-20 Signature** | '0xa9059cbb' | GasService | Magic number |
| **Wei Conversion** | 1_000_000_000 | GasService, CryptoService | Duplicated |
| **Base Fee** | '25' | GasService | Hardcoded |

**Recommended Solution:**
```typescript
// Create: src/config/constants/CryptoConstants.ts
export const CRYPTO_CONSTANTS = {
  // Addresses
  ADDRESSES: {
    ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
    DEAD_ADDRESS: '0x0000000000000000000000000000000000000001',
  },
  
  // Decimals
  DECIMALS: {
    ETH: 18,
    STABLE_COIN: 6, // USDC, USDT
    DEFAULT: 18,
  },
  
  // Gas
  GAS: {
    MIN_LIMIT: 21000,
    ERC20_TRANSFER: 65000,
    CONTRACT_CALL: 100000,
    MAX_LIMIT: 15000000,
    GWEI_PER_ETH: 1_000_000_000,
  },
  
  // ERC-20 & Contract
  SELECTORS: {
    ERC20_TRANSFER: '0xa9059cbb',
    ERC721_TRANSFER: '0x42842e0e',
  },
  
  // Timeouts & Polling
  TIMING: {
    DEFAULT_TIMEOUT: 30000,
    DEFAULT_CACHE_TTL: 60000,
    PRICE_CACHE_TTL: 60000,
    BALANCE_CACHE_TTL: 30000,
    GAS_CACHE_TTL: 15000,
    POLLING_INTERVAL: 1000,
    TX_CONFIRMATION_TIMEOUT: 60000,
  },
  
  // Retry
  RETRY: {
    DEFAULT_ATTEMPTS: 3,
    BACKOFF_BASE: 1000,
  },
} as const;
```

---

### 4. Extract Cache Management Pattern
**Impact: HIGH** | **Files Affected: 4** | **Duplicated Lines: ~40**

**Problem:**
- Four services implement nearly identical cache pattern
- Cache invalidation logic duplicated
- No shared interface or abstraction
- Inconsistent cache key naming

**Files:**
- `PriceService.ts` (lines 41-176)
- `BalanceService.ts` (lines 25-184)
- `GasService.ts` (lines 43-87)
- `ENSService.ts`, `NFTService.ts` (similar patterns)

**Cache Implementation Differences:**
```typescript
// PriceService
private cache: Map<string, CacheEntry<unknown>> = new Map();
private cacheTTL: number = 60000;
private getFromCache<T>(key: string): T | null { ... }
private setCache<T>(key: string, data: T): void { ... }

// BalanceService
private cache: Map<string, { data: TokenBalance[]; timestamp: number }> = new Map();
private cacheTimeout = 30000; // Different name!
// No abstraction - cache logic mixed in method

// GasService
private cache: { data: GasPrices; timestamp: number } | null = null;
private cacheTimeout = 15000; // Different structure
```

**Recommended Solution:**
```typescript
// Create: src/services/base/CacheManager.ts
export interface CacheConfig {
  ttl: number;
  maxSize?: number;
  strategy?: 'LRU' | 'FIFO';
}

export class CacheManager<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
```

---

### 5. Standardize Error Handling Classes
**Impact: MEDIUM** | **Files Affected: 5** | **Inconsistency Pattern: Type handling**

**Problem:**
Multiple custom error classes with different patterns - no inheritance hierarchy

**Files:**
- `ApiClient.ts` (line 6-16)
- `TransactionService.ts` (line 6-14)
- `BalanceService.ts` (line 17-22)
- `GasService.ts` (line 6-11)
- `ErrorMonitoringService.ts` (lines 8-20)

**Current Implementation Issues:**
```typescript
// ApiClient
export class ApiError extends Error {
  public status: number;
  public data: unknown;
  constructor(message: string, status: number, data?: unknown) { ... }
}

// TransactionService
export class TransactionError extends Error {
  type: string; // Different field name
  constructor(message: string, type: string = 'UNKNOWN') { ... }
}

// BalanceService - minimal
export class BalanceError extends Error {
  constructor(message: string) { ... } // No context
}
```

**Recommended Solution:**
```typescript
// Create: src/errors/AppError.ts
export interface ErrorContext {
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly statusCode?: number;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: string,
    context: ErrorContext = {},
    statusCode?: number,
    originalError?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

// Specific error classes
export class NetworkError extends AppError {
  constructor(message: string, context: ErrorContext, statusCode?: number) {
    super(message, 'NETWORK_ERROR', context, statusCode);
  }
}

export class TransactionError extends AppError {
  constructor(message: string, context: ErrorContext) {
    super(message, 'TRANSACTION_ERROR', context);
  }
}
```

---

### 6. Extract RPC Error Parsing Logic
**Impact: MEDIUM** | **File: TransactionService** | **Lines: 192-227**

**Problem:**
- `parseRpcError()` has multiple if-else chains (36 lines)
- Error type mapping is hardcoded
- Pattern appears in other services but not extracted
- No localization support

**Current Code (TransactionService lines 192-227):**
```typescript
parseRpcError(error: RpcError): ParsedError {
  const message = error.message.toLowerCase();

  if (message.includes('nonce too low')) {
    return { type: 'NONCE_TOO_LOW', message: 'Transaction nonce is too low...' };
  }
  if (message.includes('insufficient funds')) {
    return { type: 'INSUFFICIENT_FUNDS', message: 'Insufficient funds...' };
  }
  if (message.includes('replacement transaction underpriced')) {
    return { type: 'REPLACEMENT_UNDERPRICED', message: '...' };
  }
  if (message.includes('gas limit')) {
    return { type: 'GAS_LIMIT_ERROR', message: '...' };
  }
  return { type: 'UNKNOWN', message: error.message };
}
```

**Recommended Solution:**
```typescript
// Create: src/services/base/ErrorParser.ts
export class RpcErrorParser {
  private static readonly ERROR_PATTERNS = {
    NONCE_TOO_LOW: {
      patterns: ['nonce too low', 'nonce is too low'],
      type: 'NONCE_TOO_LOW',
      messageKey: 'errors.nonceTooLow',
    },
    INSUFFICIENT_FUNDS: {
      patterns: ['insufficient funds', 'not enough balance'],
      type: 'INSUFFICIENT_FUNDS',
      messageKey: 'errors.insufficientFunds',
    },
    // ... more patterns
  };

  static parse(error: RpcError): ParsedError {
    const message = error.message.toLowerCase();
    
    for (const [, config] of Object.entries(this.ERROR_PATTERNS)) {
      if (config.patterns.some(p => message.includes(p))) {
        return {
          type: config.type,
          messageKey: config.messageKey,
          rawMessage: error.message,
        };
      }
    }

    return {
      type: 'UNKNOWN',
      messageKey: 'errors.unknown',
      rawMessage: error.message,
    };
  }
}
```

---

### 7. Create Encryption/Decryption Utility Module
**Impact: MEDIUM** | **File: CryptoService** | **Lines: 59-104**

**Problem:**
- Helper methods mixed with business logic (`stringToBytes`, `bytesToHex`, etc.)
- Same helper functions likely repeated across codebase
- No clear separation of concerns
- Conversion logic (gwei, wei) also scattered

**Files:**
- `CryptoService.ts` (lines 133-155)
- `GasService.ts` (lines 183-196)
- `PriceService.ts` (lines 84-86)

**Recommended Solution:**
```typescript
// Create: src/utils/converters/EncodingConverter.ts
export class EncodingConverter {
  static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  static hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  static stringToBytes(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  static bytesToString(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
  }
}

// Create: src/utils/converters/UnitConverter.ts
export class UnitConverter {
  static gweiToEth(gwei: string): string {
    return (parseFloat(gwei) / CRYPTO_CONSTANTS.GAS.GWEI_PER_ETH).toString();
  }

  static ethToGwei(eth: string): string {
    return (parseFloat(eth) * CRYPTO_CONSTANTS.GAS.GWEI_PER_ETH).toString();
  }

  static weiToGwei(wei: string): string {
    return (parseFloat(wei) / CRYPTO_CONSTANTS.GAS.GWEI_PER_ETH).toString();
  }

  static gweiToWei(gwei: string): string {
    return (parseFloat(gwei) * CRYPTO_CONSTANTS.GAS.GWEI_PER_ETH).toString();
  }
}
```

---

### 8. Create Secure Storage Keys Constants
**Impact: MEDIUM** | **File: SecureStorageService** | **Lines: 97-146**

**Problem:**
- Storage key prefixes hardcoded throughout service
- No centralized key management
- Inconsistent key naming: `pk_`, `mnemonic_`, `pin_hash`

**Current Code Issues:**
```typescript
async storePrivateKey(address: string, encryptedKey: string): Promise<void> {
  const key = `pk_${address.toLowerCase()}`; // Magic string
  await this.setItem(key, encryptedKey);
}

async storeMnemonic(walletId: string, encryptedMnemonic: string): Promise<void> {
  const key = `mnemonic_${walletId}`; // Inconsistent naming
  await this.setItem(key, encryptedMnemonic);
}

async storePINHash(hash: string): Promise<void> {
  await this.setItem('pin_hash', hash); // Hardcoded
}
```

**Recommended Solution:**
```typescript
// Create: src/config/constants/StorageKeys.ts
export const STORAGE_KEYS = {
  PRIVATE_KEY: (address: string) => `pk_${address.toLowerCase()}`,
  MNEMONIC: (walletId: string) => `mnemonic_${walletId}`,
  PIN_HASH: 'pin_hash',
  PIN_ATTEMPTS: 'pin_attempts',
  BACKUP_PHRASE: (walletId: string) => `backup_${walletId}`,
  ENCRYPTED_SEED: (walletId: string) => `seed_${walletId}`,
  WALLET_METADATA: 'wallets_metadata',
  BIOMETRIC_ENABLED: 'biometric_enabled',
} as const;

// In SecureStorageService
async storePrivateKey(address: string, encryptedKey: string): Promise<void> {
  const key = STORAGE_KEYS.PRIVATE_KEY(address);
  await this.setItem(key, encryptedKey);
}
```

---

### 9. Extract Common Service Patterns into Base Classes
**Impact: MEDIUM** | **Files Affected: 8+** | **Pattern Count: 5**

**Problem:**
Services repeat similar initialization, configuration, and logging patterns

**Patterns Identified:**
1. Initialization checks
2. Configuration injection
3. Cache management
4. Error handling
5. Logging/monitoring

**Recommended Solution:**
```typescript
// Create: src/services/base/BaseService.ts
export interface ServiceConfig {
  name: string;
  timeout?: number;
  retryAttempts?: number;
  cacheTTL?: number;
}

export abstract class BaseService {
  protected config: ServiceConfig;
  protected cache?: CacheManager<unknown>;
  protected logger: Logger;

  constructor(config: ServiceConfig) {
    this.config = config;
    this.logger = new Logger(config.name);
  }

  protected async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.logger.error(`${this.config.name} error`, error, context);
      throw new AppError(`${this.config.name} failed`, 'SERVICE_ERROR', context);
    }
  }

  protected initializeCache(): CacheManager<unknown> {
    return new CacheManager({
      ttl: this.config.cacheTTL || 60000,
    });
  }
}
```

---

### 10. Break Down useAccessibility Hook - Reduce Duplication
**Impact: LOW-MEDIUM** | **File: useAccessibility.ts** | **Lines: 9-57**

**Problem:**
- Four similar hooks follow identical pattern
- Duplicated effect and subscription logic
- No abstraction for AccessibilityInfo pattern

**Current Code Issues (useAccessibility.ts):**
```typescript
// Repeated 4 times (useScreenReader, useReduceMotion, useBoldText, useHighContrast)
export function useScreenReader() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setIsEnabled);

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsEnabled
    );

    return () => subscription.remove();
  }, []);

  return isEnabled;
}
```

**Recommended Solution:**
```typescript
// Refactored: src/hooks/useAccessibility.ts
function useAccessibilityFeature<T>(
  checkFn: () => Promise<T>,
  eventName: 'screenReaderChanged' | 'reduceMotionChanged' | 'boldTextChanged',
  defaultValue: T
): T {
  const [isEnabled, setIsEnabled] = useState<T>(defaultValue);

  useEffect(() => {
    checkFn().then(setIsEnabled);
    const subscription = AccessibilityInfo.addEventListener(eventName, setIsEnabled);
    return () => subscription.remove();
  }, []);

  return isEnabled;
}

export const useScreenReader = () =>
  useAccessibilityFeature(
    () => AccessibilityInfo.isScreenReaderEnabled(),
    'screenReaderChanged',
    false
  );

export const useReduceMotion = () =>
  useAccessibilityFeature(
    () => AccessibilityInfo.isReduceMotionEnabled(),
    'reduceMotionChanged',
    false
  );
```

---

## SUMMARY TABLE

| # | Issue | Type | Impact | Effort | Files | Lines |
|---|-------|------|--------|--------|-------|-------|
| 1 | Duplicate HTTP Client Logic | Refactoring | HIGH | Medium | 2 | ~80 |
| 2 | Address Validation Pattern | Constants | HIGH | Low | 4 | ~4 |
| 3 | Magic Numbers Scattered | Constants | HIGH | Medium | 8+ | 50+ |
| 4 | Duplicated Cache Pattern | Abstraction | HIGH | Medium | 4 | ~40 |
| 5 | Inconsistent Error Classes | Standardization | MEDIUM | Low | 5 | ~20 |
| 6 | RPC Error Parsing If-Chain | Refactoring | MEDIUM | Low | 1 | 36 |
| 7 | Helper Functions Mixed | Extraction | MEDIUM | Low | 3 | ~30 |
| 8 | Storage Keys Hardcoded | Constants | MEDIUM | Low | 1 | ~15 |
| 9 | Service Patterns Repeated | Abstraction | MEDIUM | Medium | 8+ | ~50 |
| 10 | Accessibility Hook Duplication | Refactoring | LOW-MEDIUM | Low | 1 | ~49 |

---

## RECOMMENDED UTILITIES TO CREATE

```
src/
├── utils/
│   ├── validators/
│   │   ├── AddressValidator.ts (new)
│   │   └── GasValidator.ts (extract from GasService)
│   ├── converters/
│   │   ├── EncodingConverter.ts (new)
│   │   └── UnitConverter.ts (new)
│   └── formatters/
│       ├── BalanceFormatter.ts (extract from BalanceService)
│       └── GasFormatter.ts (extract from GasService)
├── services/
│   ├── base/
│   │   ├── BaseHttpClient.ts (new)
│   │   ├── BaseService.ts (new)
│   │   ├── CacheManager.ts (new)
│   │   ├── ErrorParser.ts (new)
│   │   └── Logger.ts (new)
└── config/
    ├── constants/
    │   ├── CryptoConstants.ts (new)
    │   ├── StorageKeys.ts (new)
    │   └── ErrorCodes.ts (new)
```

---

## NEXT STEPS

1. **Priority 1**: Create CryptoConstants.ts (enables fixes 2, 3)
2. **Priority 2**: Extract BaseHttpClient.ts (fixes 1)
3. **Priority 3**: Create CacheManager.ts (fixes 4)
4. **Priority 4**: Create error standardization (fixes 5)
5. **Priority 5**: Extract validator/converter utilities (fixes 2, 7, 8)
