# Clean Code Improvements - Quick Reference

## Patterns Identified Across Codebase

### 1. Repeated Address Validation (4 files)
```
BalanceService.ts:32         /^0x[a-fA-F0-9]{40}$/
TransactionService.ts:241    /^0x[a-fA-F0-9]{40}$/
GasService.ts:217            /^0x[a-fA-F0-9]{40}$/
ChatService.ts:?             /^0x[a-fA-F0-9]{40}$/
```
**Solution**: Create `AddressValidator.ts` utility class

---

### 2. Duplicate HTTP Client Logic (2 files)
```
ApiClient.ts:90-143          requestWithRetry() + fetchWithTimeout() + delay()
NetworkService.ts:154-219    identical retry/timeout/delay logic
```
**Solution**: Create `BaseHttpClient.ts` abstract class

---

### 3. Cache Pattern Duplication (4 files)
```
PriceService.ts:41-176       Map<string, CacheEntry<unknown>> + getFromCache/setCache
BalanceService.ts:25-184     Map<string, {data, timestamp}> + cache validation
GasService.ts:43-87          Single {data, timestamp} cache
ENSService.ts, NFTService.ts Similar patterns
```
**Solution**: Create `CacheManager<T>` generic class

---

### 4. Magic Numbers & Constants

| Constant | Values | Files | Fix |
|----------|--------|-------|-----|
| Cache TTL | 60000, 30000, 15000 | 3+ | CryptoConstants.TIMING |
| Gas Limits | 21000, 65000, 100000, 15000000 | 2+ | CryptoConstants.GAS |
| Decimals | 18, 6 | 3+ | CryptoConstants.DECIMALS |
| Wei Conversion | 1_000_000_000 | 2+ | CryptoConstants.GAS.GWEI_PER_ETH |
| Timeouts | 30000, 60000 | 3+ | CryptoConstants.TIMING |
| ERC-20 Sig | '0xa9059cbb' | GasService | CryptoConstants.SELECTORS |

**Solution**: Create `CryptoConstants.ts` config file

---

### 5. Inconsistent Error Classes (5 files)
```
ApiClient:             ApiError(message, status, data?)
TransactionService:    TransactionError(message, type)
BalanceService:        BalanceError(message)
GasService:            GasError(message)
```
**No hierarchy, inconsistent properties**

**Solution**: Create `AppError.ts` base class with hierarchy

---

### 6. RPC Error Parsing If-Chain (1 file)
```
TransactionService.ts:192-227
- 5+ if-else checks for error patterns
- Hardcoded error messages
- No localization support
```
**Solution**: Create `RpcErrorParser.ts` with pattern mapping

---

### 7. Encryption Helper Methods Mixed (1 file)
```
CryptoService.ts:133-155
- bytesToHex()
- hexToBytes()
- stringToBytes()
- bytesToString()
```
**Solution**: Extract to `EncodingConverter.ts` + `UnitConverter.ts`

---

### 8. Storage Keys Hardcoded (1 file)
```
SecureStorageService.ts:97-146
- `pk_${address.toLowerCase()}`
- `mnemonic_${walletId}`
- 'pin_hash'
- 'wallets_metadata'
```
**Solution**: Create `StorageKeys.ts` constants

---

### 9. Accessibility Hook Duplication (1 file)
```
useAccessibility.ts
- useScreenReader(): 11 lines
- useReduceMotion(): 11 lines (identical pattern)
- useBoldText(): 11 lines (identical pattern)
- useHighContrast(): 11 lines (similar pattern)
```
**Solution**: Extract to `useAccessibilityFeature()` hook factory

---

### 10. Service Initialization Patterns (8+ files)
- All services repeat: constructor + init checks + cache setup
- No shared base class for common patterns
- Logging/monitoring scattered

**Solution**: Create `BaseService.ts` abstract class

---

## File Structure After Improvements

```
src/
├── config/
│   └── constants/
│       ├── CryptoConstants.ts      [NEW] Magic numbers
│       ├── StorageKeys.ts          [NEW] Storage prefixes
│       └── ErrorCodes.ts           [NEW] Error type mapping
│
├── services/
│   ├── base/
│   │   ├── BaseHttpClient.ts       [NEW] HTTP retry/timeout
│   │   ├── BaseService.ts          [NEW] Service patterns
│   │   ├── CacheManager.ts         [NEW] Generic cache
│   │   ├── ErrorParser.ts          [NEW] Error parsing
│   │   └── Logger.ts               [NEW] Logging
│   │
│   ├── ApiClient.ts                [MODIFY] Extend BaseHttpClient
│   ├── NetworkService.ts           [MODIFY] Extend BaseHttpClient
│   ├── PriceService.ts             [MODIFY] Use CacheManager
│   ├── BalanceService.ts           [MODIFY] Use CacheManager
│   ├── GasService.ts               [MODIFY] Use CacheManager
│   ├── TransactionService.ts       [MODIFY] Use RpcErrorParser
│   ├── SecureStorageService.ts     [MODIFY] Use StorageKeys
│   └── CryptoService.ts            [MODIFY] Use EncodingConverter
│
└── utils/
    ├── validators/
    │   ├── AddressValidator.ts     [NEW] Address validation
    │   └── GasValidator.ts         [EXTRACT] From GasService
    │
    ├── converters/
    │   ├── EncodingConverter.ts    [NEW] Byte/hex conversion
    │   ├── UnitConverter.ts        [NEW] Wei/gwei/eth conversion
    │   └── BalanceFormatter.ts     [EXTRACT] From BalanceService
    │
    └── formatters/
        └── GasFormatter.ts         [EXTRACT] From GasService
```

---

## Recommended Implementation Priority

### Phase 1: Foundation (Week 1)
1. Create `CryptoConstants.ts` - enables 3 other improvements
2. Create `AddressValidator.ts` - high impact, low effort
3. Create `CacheManager.ts` - affects 4 services

### Phase 2: HTTP & Errors (Week 2)
4. Create `BaseHttpClient.ts` - deduplicates 80 lines
5. Create `AppError.ts` hierarchy - standardizes error handling
6. Create `RpcErrorParser.ts` - breaks down long function

### Phase 3: Utilities (Week 3)
7. Create `EncodingConverter.ts` + `UnitConverter.ts`
8. Create `StorageKeys.ts` - reduces magic strings
9. Create `BaseService.ts` - establishes service pattern

### Phase 4: Refactoring (Week 4)
10. Update services to use new utilities
11. Refactor hooks to reduce duplication
12. Testing and validation

---

## Type Safety Improvements

### Before
```typescript
async fetch<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(response.statusText); // No type info
  }
  return response.json(); // Implicit typing
}
```

### After
```typescript
interface FetchOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

async fetch<T>(
  url: string,
  options?: FetchOptions
): Promise<T> {
  try {
    const response = await this.fetchWithTimeout(url, {
      headers: this.defaultHeaders,
      ...options,
    });

    if (!response.ok) {
      const error = await this.parseErrorResponse(response);
      throw new NetworkError(error.message, {
        url,
        status: response.status,
      }, response.status);
    }

    return await response.json() as T;
  } catch (error) {
    throw this.normalizeError(error, { url, attempt: ... });
  }
}
```

---

## Consistency Improvements

### Error Handling
```typescript
// Before: Inconsistent
throw new ApiError(msg, status, data);
throw new TransactionError(msg, type);
throw new BalanceError(msg);

// After: Consistent
throw new NetworkError(msg, { status, data });
throw new TransactionError(msg, { type });
throw new BalanceError(msg, { });
```

### Naming
```typescript
// Before: Inconsistent
cacheTTL, cacheTimeout, cache timeout

// After: Consistent
CRYPTO_CONSTANTS.TIMING.PRICE_CACHE_TTL
CRYPTO_CONSTANTS.TIMING.BALANCE_CACHE_TTL
CRYPTO_CONSTANTS.TIMING.GAS_CACHE_TTL
```

### Validation
```typescript
// Before: Scattered
if (!/^0x[a-fA-F0-9]{40}$/.test(address)) throw new Error('...');

// After: Centralized
if (!AddressValidator.isValidEthereumAddress(address)) {
  throw new ValidationError('Invalid address');
}
```

---

## Metrics

### Code Duplication Reduction
- Address validation: 1 regex × 4 files = **4x reduction**
- Cache pattern: ~40 lines × 4 files = **160 lines → 1 CacheManager**
- HTTP client: ~80 lines × 2 files = **160 lines → BaseHttpClient**
- Accessibility hooks: ~49 lines → **~20 lines + factory**

**Total estimated reduction: 400+ lines of duplicated code**

### Type Safety Improvements
- Services using `unknown` type: 8+ → 0
- Services without error hierarchy: 5 → 1 base
- Magic numbers scattered: 15+ → 1 constants file

### Maintainability
- Constants to maintain: 30+ → 1 constants file
- Cache implementations: 4 → 1
- HTTP client implementations: 2 → 1
- Error class definitions: 5 → 1 base + typed hierarchy
