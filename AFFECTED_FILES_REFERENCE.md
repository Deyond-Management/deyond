# Affected Files Reference

## Quick Lookup by Issue

### 1. HTTP Client Duplication (80 lines)

| File | Lines | Issue | Extract To |
|------|-------|-------|-----------|
| ApiClient.ts | 90-143 | requestWithRetry() method | BaseHttpClient |
| ApiClient.ts | 148-164 | fetchWithTimeout() method | BaseHttpClient |
| ApiClient.ts | 182-184 | delay() utility | BaseHttpClient |
| NetworkService.ts | 154-191 | request() retry logic | BaseHttpClient |
| NetworkService.ts | 196-212 | fetchWithTimeout() method | BaseHttpClient |
| NetworkService.ts | 217-219 | delay() utility | BaseHttpClient |

**Extract**: `src/services/base/BaseHttpClient.ts`

---

### 2. Address Validation Duplication (4 files)

| File | Line | Pattern | Extract To |
|------|------|---------|-----------|
| BalanceService.ts | 32 | `/^0x[a-fA-F0-9]{40}$/` | AddressValidator |
| TransactionService.ts | 241 | `/^0x[a-fA-F0-9]{40}$/` | AddressValidator |
| GasService.ts | 217 | `/^0x[a-fA-F0-9]{40}$/` | AddressValidator |
| ChatService.ts | ~? | `/^0x[a-fA-F0-9]{40}$/` | AddressValidator |

**Create**: `src/utils/validators/AddressValidator.ts`

---

### 3. Magic Numbers Scattered (15+ constants)

| Constant | Current Values | Files | Fix |
|----------|---|-------|-----|
| Cache TTL | 60000, 30000, 15000 | PriceService(60000), BalanceService(30000), GasService(15000) | CryptoConstants.TIMING |
| Gas Min | 21000 | GasService:100, TransactionService:181 | CryptoConstants.GAS.MIN_LIMIT |
| Gas ERC20 | 65000 | GasService:107 | CryptoConstants.GAS.ERC20_TRANSFER |
| Gas Contract | 100000 | GasService:111 | CryptoConstants.GAS.CONTRACT_CALL |
| Gas Max | 15000000 | GasService:152 | CryptoConstants.GAS.MAX_LIMIT |
| Gwei per ETH | 1_000_000_000 | GasService:129,194 CryptoService:35 | CryptoConstants.GAS.GWEI_PER_ETH |
| Decimals ETH | 18 | Config, BalanceService, PriceService | CryptoConstants.DECIMALS.ETH |
| Decimals Stable | 6 | Config, BalanceService | CryptoConstants.DECIMALS.STABLE_COIN |
| Timeout Default | 30000 | ApiClient:38, NetworkService:23, config:104 | CryptoConstants.TIMING.DEFAULT_TIMEOUT |
| ERC20 Selector | '0xa9059cbb' | GasService:105 | CryptoConstants.SELECTORS.ERC20_TRANSFER |

**Create**: `src/config/constants/CryptoConstants.ts`

---

### 4. Cache Pattern Duplication (4 files, ~40 lines each)

| File | Lines | Pattern | Extract To |
|------|-------|---------|-----------|
| PriceService.ts | 41-176 | Map<string, CacheEntry<T>> + get/set methods | CacheManager<T> |
| BalanceService.ts | 25-184 | Map + cache validation | CacheManager<T> |
| GasService.ts | 43-87 | Single cache object | CacheManager<T> |
| ENSService.ts | ~? | Cache pattern | CacheManager<T> |
| NFTService.ts | ~? | Cache pattern | CacheManager<T> |

**Create**: `src/services/base/CacheManager.ts`

**Affected Methods to Refactor**:
- PriceService: `getFromCache()` (155-166), `setCache()` (171-176)
- BalanceService: cache initialization (25-26), validation logic (44-48, 73-76)
- GasService: entire cache block (43-87)

---

### 5. Error Class Inconsistency (5 files)

| File | Class Name | Constructor Pattern | Standardize To |
|------|-----------|-------------------|-----------------|
| ApiClient.ts | ApiError | (message, status, data?) | NetworkError extends AppError |
| TransactionService.ts | TransactionError | (message, type='UNKNOWN') | TransactionError extends AppError |
| BalanceService.ts | BalanceError | (message) | AppError('msg', 'BALANCE_ERROR') |
| GasService.ts | GasError | (message) | AppError('msg', 'GAS_ERROR') |
| ErrorMonitoringService.ts | Uses Sentry enums | Inconsistent level handling | Use AppError with codes |

**Create**: `src/errors/AppError.ts` with hierarchy

---

### 6. RPC Error Parsing Long Chain (1 file)

| File | Lines | Issue |
|------|-------|-------|
| TransactionService.ts | 192-227 | `parseRpcError()` with 5 if-else blocks |

**Specific patterns**:
- Line 195: Check for 'nonce too low'
- Line 202: Check for 'insufficient funds'
- Line 209: Check for 'replacement transaction underpriced'
- Line 216: Check for 'gas limit'
- Line 223: Default UNKNOWN error

**Extract**: `src/services/base/RpcErrorParser.ts`

---

### 7. Crypto Helper Methods Mixed (1 file, lines 133-155)

| File | Lines | Methods | Extract To |
|------|-------|---------|-----------|
| CryptoService.ts | 133-137 | `bytesToHex()` | EncodingConverter.bytesToHex() |
| CryptoService.ts | 139-144 | `hexToBytes()` | EncodingConverter.hexToBytes() |
| CryptoService.ts | 147-149 | `stringToBytes()` | EncodingConverter.stringToBytes() |
| CryptoService.ts | 152-154 | `bytesToString()` | EncodingConverter.bytesToString() |

Also affects:
- GasService.ts: 183-196 (gweiToEth, weiToGwei) → UnitConverter
- CryptoService.ts: 30-38 (PBKDF2 iteration) → crypto constants

**Create**: 
- `src/utils/converters/EncodingConverter.ts`
- `src/utils/converters/UnitConverter.ts`

---

### 8. Storage Keys Hardcoded (1 file)

| File | Method | Hardcoded Key | Extract To |
|------|--------|---------------|-----------|
| SecureStorageService.ts | storePrivateKey() | `pk_${address.toLowerCase()}` | STORAGE_KEYS.PRIVATE_KEY |
| SecureStorageService.ts | getPrivateKey() | `pk_${address.toLowerCase()}` | STORAGE_KEYS.PRIVATE_KEY |
| SecureStorageService.ts | deletePrivateKey() | `pk_${address.toLowerCase()}` | STORAGE_KEYS.PRIVATE_KEY |
| SecureStorageService.ts | storeMnemonic() | `mnemonic_${walletId}` | STORAGE_KEYS.MNEMONIC |
| SecureStorageService.ts | getMnemonic() | `mnemonic_${walletId}` | STORAGE_KEYS.MNEMONIC |
| SecureStorageService.ts | storePINHash() | `pin_hash` | STORAGE_KEYS.PIN_HASH |
| SecureStorageService.ts | getPINHash() | `pin_hash` | STORAGE_KEYS.PIN_HASH |

**Create**: `src/config/constants/StorageKeys.ts`

---

### 9. Service Initialization Patterns (8+ files)

**Common patterns repeated**:

| Pattern | Files Affected | Example |
|---------|---|---------|
| Cache initialization | PriceService, BalanceService, GasService | `private cache: Map...` |
| Constructor config | All services | Repeated timeout/config setup |
| Error handling try-catch | All services | Repeated error wrapping |
| Initialization check | ErrorMonitoringService | `if (this.initialized) return;` |
| Config injection | All services | Repeated constructor parameters |

**Create**: `src/services/base/BaseService.ts` abstract class

**Affected Files**: All in src/services/ (28+ files)

---

### 10. Accessibility Hook Duplication (1 file)

| File | Lines | Hook Function | Pattern |
|------|-------|---------------|---------|
| useAccessibility.ts | 9-24 | useScreenReader() | Identical pattern |
| useAccessibility.ts | 26-43 | useThrottle() | (Not duplication, legitimate) |
| useAccessibility.ts | 43-71 | useHighContrast() | Similar pattern |

**Specific duplications**:
```
useScreenReader (lines 9-24)
├─ useState(false)
├─ useEffect(() => {
│  ├─ AccessibilityInfo.isScreenReaderEnabled().then(setIsEnabled)
│  ├─ AccessibilityInfo.addEventListener('screenReaderChanged', setIsEnabled)
│  └─ cleanup
└─ return isEnabled

useReduceMotion (lines 26-41)
└─ IDENTICAL PATTERN (different method/event name)

useBoldText (lines 43-58)
└─ IDENTICAL PATTERN (different method/event name)
```

**Extract**: Merge into `useAccessibilityFeature()` factory hook

---

## Summary by File

### Files to CREATE (9 new files)

```
src/config/constants/
├── CryptoConstants.ts              All magic numbers centralized
├── StorageKeys.ts                  Storage key prefixes
└── ErrorCodes.ts                   Error code mappings

src/services/base/
├── BaseHttpClient.ts               HTTP retry/timeout logic
├── BaseService.ts                  Service initialization patterns
├── CacheManager.ts                 Generic cache implementation
├── ErrorParser.ts                  RPC error pattern matching
└── Logger.ts                        Centralized logging (recommended)

src/utils/
├── validators/AddressValidator.ts  Ethereum address validation
├── converters/EncodingConverter.ts Byte/hex/string conversion
└── converters/UnitConverter.ts     Wei/gwei/eth conversion
```

### Files to MODIFY (8+ files)

| File | Changes |
|------|---------|
| ApiClient.ts | Extend BaseHttpClient, remove duplicate methods |
| NetworkService.ts | Extend BaseHttpClient, remove duplicate methods |
| PriceService.ts | Use CacheManager, import CryptoConstants |
| BalanceService.ts | Use CacheManager, import AddressValidator |
| GasService.ts | Use CacheManager, extract validators/converters |
| TransactionService.ts | Use AddressValidator, use RpcErrorParser |
| SecureStorageService.ts | Import StorageKeys constants |
| CryptoService.ts | Use EncodingConverter, use UnitConverter |
| useAccessibility.ts | Refactor with hook factory pattern |

---

## Impact Summary

| Category | Before | After | Improvement |
|----------|--------|-------|------------|
| Address validation implementations | 4 | 1 | 4x consolidation |
| Cache implementations | 4 | 1 | 4x consolidation |
| HTTP client logic | 2 | 1 base | 2x consolidation |
| Error classes | 5 separate | 1 base + typed | Hierarchy added |
| Magic number locations | 15+ scattered | 1 constants file | Centralized |
| Storage keys | 7 hardcoded | 1 constants file | Centralized |
| Total duplicated lines | ~400+ | ~100 | 75% reduction |

