# Security Audit Checklist

## 1. Key Management Security

### Private Key Storage
- [ ] Private keys never stored in plain text
- [ ] Keys encrypted with AES-256-GCM
- [ ] Keys stored in secure enclave (iOS Keychain / Android Keystore)
- [ ] No key material in logs or error reports
- [ ] Key derivation uses PBKDF2 with 100,000+ iterations

### Mnemonic Security
- [ ] Mnemonic displayed only once during creation
- [ ] User verification before showing mnemonic
- [ ] Clipboard cleared after copying
- [ ] No mnemonic in screenshots (FLAG_SECURE on Android)

### Session Management
- [ ] Auto-lock after configurable timeout
- [ ] Biometric authentication support
- [ ] PIN attempts limited (lockout after 5 failures)
- [ ] Session invalidation on suspicious activity

## 2. Network Security

### API Communication
- [ ] All API calls over HTTPS
- [ ] Certificate pinning implemented
- [ ] API keys not hardcoded in source
- [ ] Request signing for sensitive operations

### RPC Provider Security
- [ ] Multiple RPC endpoints for failover
- [ ] Response validation for all RPC calls
- [ ] Rate limiting to prevent abuse
- [ ] Timeout handling for all network requests

## 3. Transaction Security

### Transaction Signing
- [ ] User confirmation for all transactions
- [ ] Clear display of recipient and amount
- [ ] Gas estimation before signing
- [ ] Simulation of transaction outcome
- [ ] Warning for unusual transactions

### Smart Contract Interactions
- [ ] Contract address verification
- [ ] Function signature validation
- [ ] Token approval limits
- [ ] Phishing detection for known scam contracts

## 4. Data Protection

### Local Storage
- [ ] Sensitive data in SecureStore only
- [ ] No sensitive data in AsyncStorage
- [ ] Database encryption if used
- [ ] Secure deletion of old data

### Memory Security
- [ ] Sensitive data cleared from memory after use
- [ ] No sensitive data in global state
- [ ] Proper cleanup on app background

## 5. Code Security

### Input Validation
- [ ] Address format validation
- [ ] Amount range validation
- [ ] Hex data validation
- [ ] ENS name validation

### Error Handling
- [ ] No sensitive data in error messages
- [ ] Graceful degradation on failures
- [ ] User-friendly error messages
- [ ] Detailed logging (without sensitive data)

## 6. Third-Party Dependencies

### Dependency Audit
- [ ] No known vulnerabilities (npm audit)
- [ ] Minimal dependency footprint
- [ ] Regular dependency updates
- [ ] License compliance check

### Supply Chain Security
- [ ] Lock file integrity
- [ ] Dependency source verification
- [ ] No unnecessary permissions

## 7. Platform-Specific Security

### iOS
- [ ] Keychain access configured correctly
- [ ] App Transport Security enabled
- [ ] No jailbreak detection bypass
- [ ] Proper entitlements

### Android
- [ ] ProGuard/R8 obfuscation
- [ ] Network security config
- [ ] No backup of sensitive data
- [ ] Proper permissions

## 8. Penetration Testing Scope

### Authentication Bypass
- [ ] PIN bypass attempts
- [ ] Biometric bypass attempts
- [ ] Session hijacking
- [ ] Token manipulation

### Data Extraction
- [ ] Memory dump analysis
- [ ] File system analysis
- [ ] Network traffic interception
- [ ] Backup extraction

### Injection Attacks
- [ ] Deep link injection
- [ ] QR code injection
- [ ] Clipboard injection

## Sign-Off

| Auditor | Date | Status |
|---------|------|--------|
| Internal Review | | ☐ Pending |
| External Audit | | ☐ Pending |
| Penetration Test | | ☐ Pending |

## Notes

_Add audit findings and remediation notes here_
