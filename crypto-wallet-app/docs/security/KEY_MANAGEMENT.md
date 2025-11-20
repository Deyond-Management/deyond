# Key Management System

## Overview

Deyond Wallet implements a multi-layer key management system to ensure the highest level of security for user assets.

## Architecture

```
┌─────────────────────────────────────────┐
│           User Interface                 │
├─────────────────────────────────────────┤
│         PIN / Biometric Auth             │
├─────────────────────────────────────────┤
│      Key Derivation (PBKDF2)             │
├─────────────────────────────────────────┤
│    Encryption Layer (AES-256-GCM)        │
├─────────────────────────────────────────┤
│   Secure Storage (Keychain/Keystore)     │
└─────────────────────────────────────────┘
```

## Key Types

### 1. Master Seed
- Generated from BIP-39 mnemonic
- 256-bit entropy
- Never stored directly

### 2. Encryption Key
- Derived from user PIN using PBKDF2
- 100,000 iterations
- Random 256-bit salt

### 3. Wallet Keys
- Derived using BIP-32/BIP-44
- Separate keys per account
- Path: m/44'/60'/0'/0/x

## Storage Implementation

### iOS (Keychain Services)
```swift
kSecAttrAccessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
kSecAttrSynchronizable: false
kSecUseDataProtectionKeychain: true
```

### Android (Keystore)
```kotlin
KeyGenParameterSpec.Builder()
    .setUserAuthenticationRequired(true)
    .setInvalidatedByBiometricEnrollment(true)
    .setEncryptionPaddings(ENCRYPTION_PADDING_PKCS7)
```

## Encryption Process

### Storing Private Key
1. User enters PIN
2. Derive encryption key: `PBKDF2(PIN, salt, 100000)`
3. Generate random IV (16 bytes)
4. Encrypt: `AES-256-GCM(key, iv, privateKey)`
5. Store: `{iv, ciphertext, authTag}` in SecureStore

### Retrieving Private Key
1. User authenticates (PIN/Biometric)
2. Retrieve encrypted data from SecureStore
3. Derive decryption key from PIN
4. Decrypt and verify auth tag
5. Use key, then clear from memory

## Security Measures

### Anti-Tampering
- Jailbreak/root detection
- Debugger detection
- Code integrity verification

### Memory Protection
- Keys zeroed after use
- No key material in logs
- Secure memory allocation

### Access Control
- Maximum 5 PIN attempts
- Progressive lockout delays
- Complete wipe after 10 failures (optional)

## Backup & Recovery

### Mnemonic Backup
- User must write down 12/24 words
- Verification required during setup
- No cloud backup of mnemonic

### Recovery Process
1. User enters mnemonic
2. Verify checksum
3. Generate master seed
4. Derive all wallets
5. Re-encrypt with new PIN

## Audit Trail

| Event | Logged | Contains |
|-------|--------|----------|
| Key Generation | Yes | Timestamp, method |
| Key Access | Yes | Timestamp, purpose |
| Failed Auth | Yes | Timestamp, attempt count |
| Key Deletion | Yes | Timestamp, reason |

## Compliance

- FIPS 140-2 compliant algorithms
- NIST SP 800-132 key derivation
- Common Criteria considerations

## Emergency Procedures

### Compromised Device
1. User marks wallet as compromised in app
2. Generate new wallet on secure device
3. Transfer all assets to new wallet
4. Securely wipe old device

### Lost PIN
1. Cannot recover without mnemonic
2. User must restore from mnemonic
3. Set new PIN during restoration
