# Deyond Feature List

## Document Information
- **Version**: 1.0.0
- **Last Updated**: 2025-11-18
- **Status**: Planning Phase
- **Project**: Deyond - Decentralized Social Crypto Wallet Platform

## Table of Contents
1. [Core Features](#core-features)
2. [Feature Categories](#feature-categories)
3. [Feature Priority Matrix](#feature-priority-matrix)
4. [Phase Rollout Plan](#phase-rollout-plan)

---

## Core Features

### 1. Cryptocurrency Wallet (Reference: MetaMask Mobile)

#### 1.1 Account Management
- **Multi-account support** with HD wallet derivation
- **Account import** via private key, mnemonic phrase (12/24 words)
- **Account export** with security warnings and confirmations
- **Account naming and customization** with color coding
- **Account switching** with quick-access UI
- **Hardware wallet support** (Ledger, Trezor via adapter pattern)

#### 1.2 Key Management & Security
- **Biometric authentication** (Face ID, Touch ID, Fingerprint)
- **PIN code protection** with configurable length
- **Encrypted vault storage** using native keychain (iOS Keychain, Android Keystore)
- **Multi-layer encryption**: Native keychain + app-level AES-256
- **Session-based key caching** with configurable timeout
- **Automatic lock** on app background with configurable timeout
- **Backup and recovery** with encrypted cloud backup (Google Drive)
- **Secret recovery phrase backup** with verification flow

#### 1.3 Multi-Blockchain Support (Adapter Pattern)
- **Primary Support**: Ethereum (EVM), Solana
- **Secondary Support**: Bitcoin, Binance Smart Chain, Polygon, Avalanche
- **Adapter Architecture**: Pluggable blockchain adapters
  - BaseChainAdapter (abstract)
  - EVMChainAdapter (Ethereum-compatible chains)
  - SolanaChainAdapter
  - BitcoinChainAdapter
- **Chain-specific features**:
  - Transaction signing per chain protocol
  - Gas/fee estimation per chain
  - Chain-specific metadata (decimals, symbols, icons)
- **Network management**: Mainnet, testnet switching per chain
- **Custom RPC endpoint** configuration

#### 1.4 Transaction Management
- **Send tokens** with address validation and QR code scanning
- **Receive tokens** with QR code generation and address sharing
- **Transaction history** with filtering and search
- **Transaction details** with block explorer links
- **Pending transaction tracking** with real-time status updates
- **Transaction cancellation** (replace-by-fee for applicable chains)
- **Transaction speed control** (gas price adjustment)
- **Batch transactions** for efficiency
- **Transaction simulation** before broadcasting
- **Smart contract interaction** with ABI parsing

#### 1.5 Token & Asset Management
- **Native token support** (ETH, SOL, BTC, etc.)
- **ERC-20/SPL token support** with auto-discovery
- **Custom token import** via contract address
- **Token hiding** to declutter interface
- **NFT display** with metadata and images
- **NFT collections** organized by contract
- **Token swap integration** (DEX aggregators)
- **Token price tracking** with real-time updates
- **Portfolio value calculation** in multiple fiat currencies
- **Asset watchlist** for quick access

---

### 2. Chat & Messaging (Reference: Berty)

#### 2.1 Direct Messaging
- **End-to-end encrypted messaging** using Signal Protocol
- **Offline-first architecture** with message queuing
- **Message delivery status** (sent, delivered, read)
- **Message types**: Text, images, videos, audio, files
- **Message editing** with edit history
- **Message deletion** (local and remote)
- **Reply and quote** functionality
- **Mentions** in group chats
- **Message search** with full-text indexing
- **Message backup** to encrypted cloud storage

#### 2.2 Group Messaging
- **Group creation** with up to 256 members
- **Group roles**: Owner, Admin, Member
- **Group permissions**: Who can add members, post, etc.
- **Group invitations** via QR code or link
- **Group metadata**: Name, description, avatar
- **Member management**: Add, remove, promote, demote
- **Group encryption** with group keys
- **Group message history sync** for new members (optional)

#### 2.3 BLE Peer-to-Peer Messaging (Reference: Berty)
- **BLE-based discovery** for nearby devices (10-100m range)
- **Mesh network propagation** for extended range
- **Offline messaging** via BLE when internet unavailable
- **Message relay** through mesh nodes
- **Automatic fallback** from internet to BLE
- **BLE security**: Per-session encryption keys
- **Proximity chat mode** for events/conferences

---

### 3. Social & Networking Features

#### 3.1 Profile Management (Business Card)
- **Digital business card** with customizable fields:
  - Name, title, company
  - Contact info (email, phone, social handles)
  - Wallet addresses (public)
  - Bio and interests
  - Profile picture and banner
  - Custom fields (key-value pairs)
- **Multiple profiles** (personal, business, etc.)
- **Profile visibility settings**: Public, friends-only, private
- **Profile sharing** via QR code, NFC, or link
- **Profile import** from contacts or social networks
- **Profile backup** to encrypted storage

#### 3.2 Contact Management
- **Contact discovery** via BLE, QR code, username search
- **Contact requests** with accept/decline
- **Contact list** with search and filtering
- **Contact groups** for organization
- **Contact notes** (private annotations)
- **Contact sync** across devices
- **Block and report** functionality
- **Contact import** from phone contacts (permission-based)

#### 3.3 Social Account Integration
- **OAuth integration** for:
  - Twitter/X
  - LinkedIn
  - Facebook
  - Instagram
  - GitHub
  - Discord
- **Profile linking** to social accounts
- **Social sharing** of wallet activities (optional)
- **Social login** (optional, non-custodial)
- **Activity feed** from connected accounts

#### 3.4 BLE-Based Proximity Discovery (Reference: Weshnet)
- **Real-time nearby user scanning** using BLE advertising
- **Discovery radius**: 10-100 meters
- **Mesh network graph** showing connection paths
- **RSSI-based distance estimation** (close, near, far)
- **Profile preview** before connecting
- **Discovery filters**: Interests, roles, industry
- **Connection request** workflow
- **Discovery mode**: Active (broadcasting), passive (scanning only), off
- **Event mode**: Optimized for conferences/networking events
- **Battery optimization** with periodic scanning

#### 3.5 Location-Based Social (GPS Feed Flags)
- **Feed flag posting** at current location
- **Feed content types**: Text, image, video, audio, poll
- **Feed visibility**:
  - Default: Visible until 100 unique views
  - Paid tiers: Extended visibility (500, 1000, 5000 views)
  - Premium: Permanent flags
- **Feed discovery**:
  - Map view of nearby flags
  - List view sorted by distance
  - Trending flags in area
- **Feed interactions**: Like, comment, share, report
- **Feed notifications**: When someone interacts near your flag
- **Geofencing**: Auto-discover flags when entering area
- **Privacy controls**: Anonymous posting, location fuzzing
- **Monetization**:
  - Pay-per-view extension (100 views = $0.99, 1000 views = $4.99)
  - Sponsored flags for businesses
  - Ad revenue sharing

---

### 4. Voice Calling (IP-Based)

#### 4.1 Phone Number System
- **Virtual phone number** with prefix 'a' + international format
  - Example: a+82-010-1234-5678 (Korea)
  - Example: a+1-555-123-4567 (USA)
- **Number generation**:
  - Derived from account public key (deterministic)
  - Alternative: Purchase specific number (premium)
- **Number portability**: Link to real phone number (optional)
- **Number discovery**: Searchable in user directory (opt-in)
- **No number by default**: Optional feature activation

#### 4.2 Voice Call Features
- **Peer-to-peer VoIP** using WebRTC
- **Call types**: Voice only, video call (future)
- **Call quality indicators**: Network strength, latency, packet loss
- **Call recording** (with consent notification)
- **Call history** with duration and timestamps
- **Missed call notifications**
- **Voicemail** with transcription (AI-powered)
- **Call blocking** and spam detection
- **Conference calling** (up to 8 participants)
- **Call encryption**: End-to-end encrypted via SRTP

#### 4.3 Call Integration
- **Dialer UI**: Similar to native phone app
- **Contact integration**: Call contacts directly
- **Recent calls** with call-back button
- **Favorites** for quick dialing
- **Emergency calling**: Route to local emergency services (via gateway)
- **Background calling**: Continue call while using other apps
- **CallKit integration** (iOS): Native call screen
- **ConnectionService integration** (Android): Native call experience

---

### 5. LLM Integration & AI Features

#### 5.1 Information Search
- **Conversational AI assistant** powered by LLM
- **Context-aware search**: Understands wallet context, transaction history
- **Multi-modal queries**: Text, voice, image input
- **Search categories**:
  - Transaction explanations
  - Token information lookup
  - DeFi protocol guidance
  - Security threat analysis
  - Market insights
- **Personalized recommendations** based on activity
- **Search history** with privacy controls

#### 5.2 Creature - LLM Training Game
- **Default mini-game** featuring virtual pet ("Creature")
- **Training mechanics**:
  - Feed creature with data/knowledge
  - Answer questions to train intelligence
  - Complete tasks to earn experience
  - Level up with skill points
- **Creature types**: Multiple species with different specializations
  - Finance Creature: DeFi expert
  - Social Creature: Networking assistant
  - Security Creature: Safety advisor
  - Gaming Creature: Game strategist
- **Creature abilities**: Unlock AI-powered utilities
  - Portfolio analysis
  - Transaction automation
  - Social recommendations
  - Market predictions
- **Creature evolution**: Visual changes as it learns
- **Creature personality**: Develops unique traits based on training
- **PvP creature battles**: Test training quality against others
- **Breeding system**: Combine creatures for new traits

#### 5.3 AI Agent Marketplace
- **Agent discovery**: Browse public AI agents
- **Agent categories**:
  - Trading bots
  - Portfolio managers
  - Social assistants
  - Content creators
  - Game assistants
- **Agent deployment**: Install agents to your account
- **Agent permissions**: Granular control over agent capabilities
- **Agent pricing models**:
  - Free tier: Basic functionality
  - Subscription: Monthly/yearly plans
  - Usage-based: Pay per execution
  - Revenue share: Earn from others using your agent
- **Agent ratings and reviews**: Community feedback
- **Agent testing**: Sandbox mode before full deployment

#### 5.4 Train & Monetize Your Creature
- **Export trained creature** as AI agent
- **Agent marketplace listing**: Set pricing and terms
- **Rental options**:
  - Free trial: Limited usage
  - Time-based rental: Daily/weekly/monthly
  - Usage-based rental: Pay per query/action
  - License purchase: Permanent access
- **Revenue sharing**: Platform takes 15% commission
- **Agent analytics**: Track usage, earnings, ratings
- **Agent updates**: Push improvements to renters
- **Agent versioning**: Maintain multiple versions

---

### 6. Mini-Game Platform

#### 6.1 Game Marketplace
- **Game discovery**: Browse, search, filter games
- **Game categories**: Puzzle, strategy, casual, RPG, multiplayer
- **Game details**: Screenshots, description, ratings, downloads
- **Game installation**: Download and install from marketplace
- **Game updates**: Auto-update or manual
- **Game management**: Uninstall, backup saves
- **Game reviews**: Rate and review games
- **Developer profiles**: Follow favorite developers

#### 6.2 Game Integration
- **SDK for developers**: Build games with Deyond integration
- **Wallet integration**: In-game token transactions
- **Social integration**: Multiplayer, leaderboards, friend invites
- **Achievement system**: Cross-game achievements
- **Cloud save**: Sync game progress across devices
- **In-game purchases**: Buy with crypto or fiat
- **Game tournaments**: Compete for prizes
- **Reward system**: Earn tokens by playing games

#### 6.3 Game Developer Tools
- **Game submission**: Upload game to marketplace
- **Monetization options**:
  - Free with ads
  - Paid download
  - In-app purchases
  - Subscription
- **Analytics dashboard**: Downloads, revenue, user engagement
- **Version control**: Manage game updates
- **Beta testing**: Release to limited audience

---

### 7. Cloud Storage (Google Drive Integration)

#### 7.1 Storage Features
- **Encrypted backup**: All data encrypted before upload
- **Zero-knowledge encryption**: Only user has decryption key
- **Auto-backup**: Scheduled backups (daily, weekly)
- **Manual backup**: On-demand backup trigger
- **Backup content**:
  - Wallet vault (encrypted)
  - Chat history (encrypted)
  - Profile data
  - App settings
  - Game saves
  - Media files (optional)
- **Backup restoration**: Restore from cloud on new device
- **Backup versioning**: Keep multiple backup versions
- **Backup integrity check**: Verify backup completeness

#### 7.2 Storage Management
- **Storage quota**: Monitor usage against Google Drive quota
- **Selective backup**: Choose what to backup
- **Backup schedule**: Configure frequency and time
- **Backup notifications**: Success/failure alerts
- **Backup history**: View past backups
- **Delete old backups**: Clean up storage

---

### 8. Security Features

#### 8.1 Transaction Security
- **Transaction simulation**: Preview outcome before signing
- **Phishing detection**: Warn about suspicious dApps
- **Contract security scanning**: Analyze smart contracts
- **Token approval warnings**: Alert on unlimited approvals
- **Address verification**: Checksum validation, ENS/SNS support
- **Whitelist addresses**: Trusted address book
- **Transaction limits**: Set daily/transaction limits
- **Multi-signature support**: Require multiple approvals

#### 8.2 App Security
- **App lock**: Biometric or PIN on app open
- **Auto-lock timer**: Configurable timeout
- **Screen capture protection**: Prevent screenshots on sensitive screens
- **Jailbreak/root detection**: Warn or disable on compromised devices
- **Secure keyboard**: Custom keyboard to prevent keylogging
- **Clipboard clearing**: Auto-clear sensitive data
- **Network security**: Certificate pinning, TLS 1.3
- **Audit logging**: Track security events

#### 8.3 Privacy Features
- **Anonymous mode**: Hide wallet balances and activity
- **Private browsing**: No activity logging
- **VPN integration**: Route traffic through VPN
- **Tor support**: Optional Tor routing
- **Metadata minimization**: Minimize data collection
- **Data retention controls**: Auto-delete old data
- **Privacy dashboard**: View and manage data

---

### 9. Network & Communication

#### 9.1 Server Communication
- **REST API**: Standard HTTP API for web services
- **GraphQL API**: Efficient data querying
- **WebSocket**: Real-time updates (prices, notifications)
- **gRPC**: High-performance RPC for mobile-server communication
- **Server endpoints**:
  - Authentication server
  - Profile sync server
  - Message relay server (for offline users)
  - Voice calling signaling server
  - Game marketplace server
  - AI agent marketplace server
  - Feed flag server
  - Analytics server

#### 9.2 Peer-to-Peer Communication
- **Direct P2P**: Connect directly when possible
- **Relay fallback**: Use relay servers when P2P fails
- **NAT traversal**: STUN/TURN for firewall penetration
- **Connection quality**: Auto-adjust based on network
- **Bandwidth optimization**: Compression, adaptive quality

#### 9.3 Offline Support
- **Offline mode**: Core features work without internet
- **Message queue**: Store messages until online
- **Transaction queue**: Queue transactions for broadcasting
- **Data sync**: Auto-sync when connection restored
- **Conflict resolution**: Merge changes from multiple devices

---

### 10. User Experience & Accessibility

#### 10.1 Onboarding
- **Welcome tour**: Interactive feature introduction
- **Setup wizard**: Step-by-step account creation
- **Import flow**: Restore existing wallet
- **Feature opt-in**: Choose which features to enable
- **Tutorial videos**: In-app video guides
- **Help center**: Searchable documentation

#### 10.2 UI/UX
- **Dark mode**: Light/dark/auto theme
- **Customizable theme**: Color schemes
- **Font size adjustment**: Accessibility
- **Language support**: 30+ languages
- **Right-to-left (RTL) support**: Arabic, Hebrew, etc.
- **Responsive design**: Adapt to different screen sizes
- **Tablet optimization**: Multi-column layouts
- **Gesture controls**: Swipe, pinch, long-press
- **Haptic feedback**: Touch response

#### 10.3 Notifications
- **Push notifications**: Remote notifications via FCM/APNs
- **In-app notifications**: Activity feed
- **Notification categories**:
  - Transaction confirmations
  - Messages received
  - Call missed
  - Contact requests
  - Game invites
  - Price alerts
  - Security warnings
- **Notification preferences**: Granular control per category
- **Do Not Disturb**: Quiet hours
- **Notification badges**: Unread count

---

## Feature Categories

### Category 1: Core Infrastructure (P0 - Must Have)
- Account creation and management
- Key management and encryption
- Basic transaction sending/receiving
- Single blockchain support (Ethereum)
- PIN/biometric authentication
- Local data persistence

### Category 2: Enhanced Wallet (P1 - High Priority)
- Multi-blockchain support (adapter pattern)
- Token and NFT management
- Transaction history
- Gas optimization
- Hardware wallet support
- Backup and recovery

### Category 3: Social Foundation (P1 - High Priority)
- Direct messaging (encrypted)
- Profile creation (business card)
- Contact management
- BLE proximity discovery (basic)
- QR code sharing

### Category 4: Communication (P2 - Medium Priority)
- Group messaging
- BLE mesh networking
- Voice calling (basic)
- Virtual phone numbers
- Social account integration

### Category 5: Location & Discovery (P2 - Medium Priority)
- GPS-based feed flags
- Location-based discovery
- Map view of content
- Feed monetization

### Category 6: AI & Gaming (P3 - Nice to Have)
- LLM search assistant
- Creature training game
- AI agent marketplace
- Mini-game platform
- Game developer tools

### Category 7: Advanced Features (P3 - Nice to Have)
- Video calling
- Multi-signature wallets
- DeFi integrations
- NFT marketplace
- DAO participation

---

## Feature Priority Matrix

| Feature | Priority | Complexity | Dependencies | Phase |
|---------|----------|------------|--------------|-------|
| Wallet core (single chain) | P0 | High | None | 1 |
| Account management | P0 | Medium | Wallet core | 1 |
| Transaction send/receive | P0 | High | Wallet core | 1 |
| Biometric auth | P0 | Medium | Account mgmt | 1 |
| Multi-blockchain (adapter) | P1 | High | Wallet core | 2 |
| Direct messaging | P1 | High | Account mgmt | 2 |
| Profile management | P1 | Medium | Account mgmt | 2 |
| BLE discovery (basic) | P1 | High | Profile | 2 |
| Contact management | P1 | Medium | Profile | 2 |
| Token/NFT management | P1 | Medium | Multi-chain | 2 |
| Group messaging | P2 | High | Direct messaging | 3 |
| BLE mesh networking | P2 | Very High | BLE discovery | 3 |
| Voice calling | P2 | High | Contact mgmt | 3 |
| GPS feed flags | P2 | Medium | Profile | 3 |
| Social integration | P2 | Medium | Profile | 3 |
| Cloud backup | P2 | Medium | None | 3 |
| LLM assistant | P3 | High | None | 4 |
| Creature game | P3 | High | LLM | 4 |
| Agent marketplace | P3 | Very High | Creature | 4 |
| Mini-game platform | P3 | Very High | None | 4 |
| Video calling | P3 | High | Voice calling | 5 |

---

## Phase Rollout Plan

### Phase 1: MVP - Core Wallet (3-4 months)
**Goal**: Functional cryptocurrency wallet with basic security

**Features**:
- Wallet creation and import
- Ethereum support
- Send/receive ETH and ERC-20 tokens
- Transaction history
- Biometric authentication
- PIN protection
- Local encrypted storage
- Basic UI/UX

**Success Criteria**:
- Can create/import wallet
- Can send/receive transactions
- Secure key storage
- Passes security audit

---

### Phase 2: Social Wallet (3-4 months)
**Goal**: Add social and multi-chain features

**Features**:
- Multi-blockchain support (Solana, BSC)
- Adapter pattern implementation
- Direct encrypted messaging
- Profile creation (business card)
- Contact management
- BLE proximity discovery
- QR code profile sharing
- Token and NFT display

**Success Criteria**:
- Support 3+ blockchains
- P2P messaging works
- Can discover nearby users via BLE
- Can share profiles offline

---

### Phase 3: Communication Hub (3-4 months)
**Goal**: Full communication platform

**Features**:
- Group messaging
- BLE mesh networking (extended range)
- Voice calling (IP-based)
- Virtual phone number system
- Social account integration
- GPS-based feed flags
- Cloud backup (Google Drive)
- Notification system

**Success Criteria**:
- Stable group chats
- Voice calls with good quality
- Mesh network extends to 100m
- Feed flags visible on map

---

### Phase 4: AI & Gaming Platform (4-5 months)
**Goal**: AI-powered features and gaming

**Features**:
- LLM integration for search
- Creature training game
- AI agent marketplace
- Train and monetize creatures
- Mini-game marketplace
- Game SDK
- Advanced analytics

**Success Criteria**:
- AI assistant provides useful insights
- Users can train creatures
- Agent marketplace has 50+ agents
- Game marketplace has 20+ games

---

### Phase 5: Enterprise & Advanced (Ongoing)
**Goal**: Enterprise features and optimization

**Features**:
- Video calling
- Multi-signature wallets
- DAO governance integration
- Advanced DeFi features
- Enterprise security controls
- White-label solutions
- Custom blockchain support

**Success Criteria**:
- Enterprise clients onboarded
- Advanced security certifications
- Scalable to millions of users

---

## Extension Architecture (Future Features)

### Web-Based Feature Extensions
To maintain agility for future features, the architecture supports web-based extensions:

- **WebView framework**: Embedded browser for web-based features
- **JavaScript bridge**: Native ↔ Web communication
- **Shared session**: Web extensions can access wallet APIs (with permissions)
- **Hot reload**: Update web features without app store submission
- **Plugin marketplace**: Third-party extensions
- **Permission model**: Granular access control

**Potential Web Extensions**:
- DeFi protocol interfaces
- NFT marketplace
- Governance voting
- Analytics dashboards
- Custom mini-games
- Third-party integrations

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-11-18 | Claude | Initial feature list creation |

---

## Related Documents
- [PRD - Product Requirements Document](./PRD.md)
- [Architecture Design](./ARCHITECTURE.md)
- [API Documentation](./API_ENDPOINTS.md)
- [Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [Development Timeline](./DEVELOPMENT_TIMELINE.md)
- [Security Considerations](./SECURITY.md)
- [Testing Strategy](./TESTING_STRATEGY.md)
