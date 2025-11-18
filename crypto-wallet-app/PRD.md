# Product Requirements Document (PRD)
## Crypto Wallet App with BLE P2P Chat

**Version**: 2.0
**Last Updated**: 2025-11-18
**Status**: Phase 2 - UI/UX Implementation
**Product Owner**: Development Team

---

## Executive Summary

A cryptocurrency wallet application inspired by MetaMask, built with React Native, featuring an innovative BLE (Bluetooth Low Energy) based peer-to-peer chat system. The app enables users to manage digital assets across multiple blockchain networks while communicating securely with other users via Bluetooth without requiring internet connectivity.

## Product Vision

To create a secure, user-friendly cryptocurrency wallet that combines traditional DeFi functionality with innovative offline communication capabilities, setting a new standard for decentralized applications.

## Target Users

### Primary Users
- **Crypto Enthusiasts**: Users who actively trade and manage cryptocurrencies
- **DeFi Users**: Users interacting with decentralized applications
- **Privacy-Conscious Users**: Users seeking secure, offline communication

### Secondary Users
- **Crypto Beginners**: New users entering the crypto space
- **Developers**: Building and testing dApps
- **Traders**: Managing portfolios and executing transactions

## Core Features

### Phase 1: Completed ✅
Backend infrastructure and core functionality implemented.

#### 1.1 Wallet Management ✅
- **Create Wallet**: Generate new HD wallet with 12-word mnemonic
- **Import Wallet**: Import via mnemonic phrase or private key
- **Multi-Account Support**: Derive multiple accounts from single seed
- **Account Management**: Create, rename, delete accounts
- **Security**: AES-256-GCM encryption, PBKDF2 key derivation

#### 1.2 Transaction Management ✅
- **Send Transactions**: Create and broadcast transactions
- **Gas Estimation**: Automatic gas price and limit estimation
- **EIP-1559 Support**: Modern fee structure
- **Transaction History**: Track all transactions
- **Transaction Status**: Real-time status updates

#### 1.3 Multi-Chain Support ✅
- **Ethereum Mainnet**: Full support
- **Ethereum Testnets**: Sepolia
- **Layer 2 Networks**: Polygon, Optimism, Arbitrum
- **BSC**: Binance Smart Chain
- **Custom Networks**: Add custom RPC networks

#### 1.4 BLE P2P Chat ✅
- **Session Protocol**: Secure ECDH key exchange
- **End-to-End Encryption**: AES-256-GCM with session keys
- **Offline Communication**: No internet required
- **Address-Based Identity**: Wallet address as user identifier
- **Message History**: Persistent chat storage

#### 1.5 State Management ✅
- **Redux Store**: Centralized state management
- **Persistent Storage**: Redux Persist with AsyncStorage
- **Type-Safe Actions**: TypeScript throughout

### Phase 2: In Progress 🚧
User interface and experience implementation.

#### 2.1 Onboarding Flow (Priority: High)
**User Story**: As a new user, I want to easily create or import a wallet.

**Requirements**:
- [ ] Welcome screen with app introduction
- [ ] Create new wallet flow:
  - [ ] Password creation (minimum 8 characters)
  - [ ] Mnemonic generation and display
  - [ ] Mnemonic backup verification (select words)
  - [ ] Success confirmation
- [ ] Import wallet flow:
  - [ ] Import method selection (mnemonic/private key)
  - [ ] Input validation
  - [ ] Password setup
  - [ ] Import confirmation
- [ ] Biometric setup (optional)
- [ ] Terms of service and privacy policy

**Acceptance Criteria**:
- User can complete wallet creation in < 2 minutes
- Mnemonic is displayed only once
- Backup verification requires correct word selection
- Clear error messages for invalid inputs
- Works offline

#### 2.2 Home Screen (Priority: High)
**User Story**: As a user, I want to see my wallet balance and recent activity.

**Requirements**:
- [ ] Account selector dropdown
- [ ] Total balance display (in native currency + USD)
- [ ] Token list with balances:
  - [ ] Native token (ETH, BNB, etc.)
  - [ ] Custom tokens (ERC-20)
  - [ ] Token icons
  - [ ] 24h price change
- [ ] Quick actions:
  - [ ] Send
  - [ ] Receive
  - [ ] Buy (external link)
  - [ ] Swap (future)
- [ ] Recent transactions (last 10)
- [ ] Pull-to-refresh functionality
- [ ] Network selector
- [ ] Settings button

**Acceptance Criteria**:
- Balance updates within 2 seconds
- Token list scrollable and performant (100+ tokens)
- Accurate USD conversion
- Smooth animations
- Handles loading and error states

#### 2.3 Send Transaction Screen (Priority: High)
**User Story**: As a user, I want to send cryptocurrency to another address.

**Requirements**:
- [ ] Recipient address input:
  - [ ] Manual entry with validation
  - [ ] QR code scanner
  - [ ] Address book selection
  - [ ] ENS name resolution (future)
- [ ] Amount input:
  - [ ] Native token amount
  - [ ] USD equivalent
  - [ ] Max button (send all)
  - [ ] Decimals handling
- [ ] Token selector (native + ERC-20)
- [ ] Gas fee display:
  - [ ] Slow/Standard/Fast presets
  - [ ] Custom gas option
  - [ ] Total fee in native + USD
- [ ] Transaction preview:
  - [ ] From/To addresses
  - [ ] Amount
  - [ ] Gas fee
  - [ ] Total (amount + fee)
- [ ] Confirmation modal
- [ ] Transaction status tracking
- [ ] Success/failure feedback

**Acceptance Criteria**:
- Address validation prevents invalid sends
- Gas estimation accurate within 10%
- Transaction submits within 1 second of confirmation
- Clear error messages for failures
- Transaction hash shown on success
- Link to block explorer

#### 2.4 Receive Screen (Priority: Medium)
**User Story**: As a user, I want to receive cryptocurrency from others.

**Requirements**:
- [ ] QR code display of wallet address
- [ ] Address display with copy button
- [ ] Network indicator
- [ ] Share button (address as text)
- [ ] Request amount feature (generate QR with amount)

**Acceptance Criteria**:
- QR code scannable by other wallets
- Copy to clipboard works reliably
- Clear network indication
- Share works on iOS and Android

#### 2.5 Transaction History (Priority: Medium)
**User Story**: As a user, I want to view all my past transactions.

**Requirements**:
- [ ] Chronological list of transactions
- [ ] Transaction details:
  - [ ] Type (send/receive/contract interaction)
  - [ ] Amount and token
  - [ ] Status (pending/confirmed/failed)
  - [ ] Timestamp
  - [ ] Gas fee
  - [ ] Block number and confirmations
- [ ] Filter options:
  - [ ] By status
  - [ ] By token
  - [ ] By date range
- [ ] Search functionality
- [ ] Transaction detail view
- [ ] Block explorer link
- [ ] Export transaction history (CSV)

**Acceptance Criteria**:
- Loads 20 transactions initially
- Infinite scroll for older transactions
- Updates pending transactions in real-time
- Performance with 1000+ transactions
- Accurate status display

#### 2.6 BLE Chat Interface (Priority: Medium)
**User Story**: As a user, I want to chat with nearby wallet users via Bluetooth.

**Requirements**:
- [ ] Chat home screen:
  - [ ] List of active sessions
  - [ ] New chat button
  - [ ] Session status indicators
- [ ] Device discovery screen:
  - [ ] Scan for nearby devices
  - [ ] Device list with signal strength
  - [ ] Connection status
  - [ ] Bluetooth permission handling
- [ ] Session establishment flow:
  - [ ] Handshake progress indicator
  - [ ] Peer identity verification (address display)
  - [ ] Accept/reject incoming sessions
- [ ] Chat conversation screen:
  - [ ] Message bubbles (sent/received)
  - [ ] Timestamp for each message
  - [ ] Message status (sending/sent/delivered)
  - [ ] Text input
  - [ ] Send button
  - [ ] Encryption indicator
- [ ] Session management:
  - [ ] Close session
  - [ ] Clear conversation
  - [ ] Session expiry warning

**Acceptance Criteria**:
- Device discovery works within 10 meters
- Session establishment < 5 seconds
- Messages encrypted end-to-end
- Offline functionality (no internet needed)
- Clear security indicators
- Graceful handling of connection loss

#### 2.7 Settings Screen (Priority: Medium)
**User Story**: As a user, I want to configure app settings and manage security.

**Requirements**:
- [ ] **Security**:
  - [ ] Change password
  - [ ] Biometric authentication toggle
  - [ ] Auto-lock timeout
  - [ ] Show/hide balance
  - [ ] Reveal seed phrase (with password)
  - [ ] Clear wallet data
- [ ] **Networks**:
  - [ ] Network list
  - [ ] Add custom network
  - [ ] Edit network
  - [ ] Delete network
  - [ ] Default network selection
- [ ] **Display**:
  - [ ] Theme (light/dark/auto)
  - [ ] Language selection
  - [ ] Currency (USD, EUR, etc.)
  - [ ] Date format
- [ ] **Advanced**:
  - [ ] Show hex data in transactions
  - [ ] Custom nonce
  - [ ] Developer mode
  - [ ] Debug logs export
- [ ] **About**:
  - [ ] Version number
  - [ ] Terms of service
  - [ ] Privacy policy
  - [ ] Open source licenses
  - [ ] Support/feedback

**Acceptance Criteria**:
- All settings persist after app restart
- Seed phrase requires password to view
- Network changes reflect immediately
- Theme changes without app restart
- Clear confirmation for destructive actions

#### 2.8 Account Management (Priority: Low)
**User Story**: As a user, I want to manage multiple accounts.

**Requirements**:
- [ ] Account list view
- [ ] Create new account (derive from HD wallet)
- [ ] Import account (private key only)
- [ ] Account details:
  - [ ] Name (editable)
  - [ ] Address
  - [ ] Balance
  - [ ] QR code
- [ ] Export private key (with password)
- [ ] Remove account (with confirmation)
- [ ] Account reordering

**Acceptance Criteria**:
- Instant account switching
- Private key export requires password
- Cannot delete account with balance (warning)
- Clear indication of imported vs. derived accounts

### Phase 3: Future Features 🔮

#### 3.1 Token Management
- Add custom ERC-20 tokens
- Token search and discovery
- NFT support (view, send)
- Token price charts
- Portfolio tracking

#### 3.2 DApp Integration
- WalletConnect v2
- In-app browser
- dApp permission management
- Transaction signing for dApps
- Multi-sig support

#### 3.3 Advanced Features
- Hardware wallet support (Ledger)
- Swap integration (DEX aggregator)
- Staking interface
- Address book
- Transaction scheduling
- Batch transactions

## Technical Requirements

### Performance
- **App Launch**: Cold start < 3 seconds
- **Screen Transitions**: < 300ms
- **Transaction Signing**: < 500ms
- **Balance Refresh**: < 2 seconds
- **Memory Usage**: < 200MB active

### Security
- **Encryption**: AES-256-GCM for all sensitive data
- **Key Storage**: OS-level secure storage (Keychain/Keystore)
- **Biometric Auth**: Face ID / Touch ID / Fingerprint
- **No Data Leaks**: No sensitive data in logs or screenshots
- **Secure Communication**: HTTPS only, certificate pinning

### Compatibility
- **iOS**: iOS 13.0+
- **Android**: Android 8.0+ (API 26+)
- **React Native**: 0.81+
- **TypeScript**: 5.9+

### Accessibility
- **Screen Reader**: Full VoiceOver/TalkBack support
- **Minimum Touch Targets**: 44x44 points
- **Contrast Ratio**: WCAG AA (4.5:1)
- **Font Scaling**: Support system font sizes

## User Flows

### Critical Paths

#### 1. Create New Wallet
```
1. Open app (first time)
2. Tap "Create New Wallet"
3. Read terms, tap "Accept"
4. Create password (8+ chars)
5. Confirm password
6. View 12-word mnemonic
7. Tap "I've saved it"
8. Verify mnemonic (select 3 random words)
9. Success! Enter app
```

#### 2. Send Transaction
```
1. From home, tap "Send"
2. Select token (or use default)
3. Enter recipient address or scan QR
4. Enter amount
5. Review gas fee
6. Tap "Next"
7. Review transaction details
8. Tap "Confirm"
9. Sign with password/biometric
10. View transaction status
11. Done (with tx hash)
```

#### 3. Start BLE Chat
```
1. Tap "Chat" tab
2. Tap "New Chat"
3. Enable Bluetooth if needed
4. Tap "Scan for Devices"
5. Select device from list
6. View peer wallet address
7. Tap "Connect"
8. Wait for session establishment
9. See "Secure session established"
10. Start chatting
```

## Success Metrics

### User Engagement
- **Daily Active Users (DAU)**: Target 10k in first 3 months
- **Retention**: 40% day-7, 20% day-30
- **Session Length**: Average 3-5 minutes
- **Feature Usage**:
  - Wallet creation: 100% of new users
  - Transactions: 60% of active users
  - BLE Chat: 10% of active users (early adopter feature)

### Performance Metrics
- **Crash Rate**: < 0.5%
- **API Success Rate**: > 99%
- **App Rating**: > 4.0 stars
- **Load Time**: 95th percentile < 5 seconds

### Business Metrics
- **User Acquisition**: Organic growth from GitHub/social
- **Support Tickets**: < 5% of active users
- **Feature Requests**: Track top 10 requested features

## Risks & Mitigation

### Technical Risks
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Security vulnerability | Critical | Medium | Regular audits, bug bounty |
| BLE compatibility issues | High | Medium | Extensive device testing |
| Blockchain RPC failures | High | High | Fallback RPC endpoints |
| Key loss by users | Critical | High | Clear backup instructions, recovery options |

### Business Risks
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Regulatory changes | High | Medium | Legal compliance monitoring |
| Competition | Medium | High | Unique BLE feature, superior UX |
| Low adoption | High | Medium | Community building, tutorials |

## Open Questions

1. Should we support Bitcoin and other UTXO-based chains?
2. What DEX should we integrate for swaps?
3. Should we implement a browser extension alongside mobile?
4. How to monetize without compromising user privacy?
5. Should chat messages be stored on-chain (future)?

## Dependencies

### External Services
- **RPC Providers**: Infura, Alchemy (fallbacks needed)
- **Price Feeds**: CoinGecko API
- **Push Notifications**: Firebase Cloud Messaging
- **Analytics**: Privacy-focused solution (e.g., Plausible)

### Third-Party Libraries
- **Blockchain**: ethers.js, viem
- **Crypto**: @noble/curves, @noble/hashes
- **State**: Redux Toolkit
- **UI**: React Native, React Navigation
- **Testing**: Jest, Detox

## Compliance

- **Privacy**: GDPR compliant, no tracking without consent
- **Security**: Regular penetration testing
- **Accessibility**: WCAG 2.1 AA standard
- **Legal**: Terms of service, privacy policy, disclaimers

## Success Criteria for Phase 2

- [ ] All Priority: High features implemented
- [ ] All tests passing (>80% coverage)
- [ ] No critical bugs
- [ ] Performance benchmarks met
- [ ] Accessible to screen reader users
- [ ] Positive feedback from beta testers
- [ ] Ready for app store submission

---

**Approval Required From**:
- [ ] Product Owner
- [ ] Engineering Lead
- [ ] Security Team
- [ ] Design Team

**Next Review Date**: End of Phase 2
