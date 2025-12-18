# Remaining Work List - Deyond Crypto Wallet

## Document Information

- **Generated**: 2025-12-17
- **Based on**: IMPLEMENTATION_PLAN.md, CLEAN_CODE_QUICK_REFERENCE.md, CODE_STRUCTURE_IMPROVEMENTS.md, PRD.md
- **Current Status**: Phase 1 Core Wallet + partial Phase 2 features implemented

---

## Summary

### Current Implementation Status

| Category      | Implemented | Total | Status                 |
| ------------- | ----------- | ----- | ---------------------- |
| Services      | 28 domains  | -     | Well-structured        |
| Screens       | 35 screens  | -     | Comprehensive UI       |
| Redux Slices  | 15 slices   | -     | State management ready |
| Test Coverage | 80.71%      | 80%+  | Target met             |
| Tests Passing | 1,509       | -     | All passing            |

### Completion by Phase

| Phase                      | Status      | Completion |
| -------------------------- | ----------- | ---------- |
| Phase 1: MVP Core Wallet   | Complete    | 95%        |
| Phase 2: Social Wallet     | Partial     | 40%        |
| Phase 3: Communication Hub | Not Started | 0%         |
| Phase 4: AI & Gaming       | Not Started | 0%         |

---

## 1. Clean Code Improvements (CLEAN_CODE_QUICK_REFERENCE.md)

### Implemented

- [x] `AddressValidator.ts` - src/utils/validators/AddressValidator.ts
- [x] `BaseHttpClient.ts` - src/services/base/BaseHttpClient.ts
- [x] `CacheManager.ts` - src/services/base/CacheManager.ts
- [x] `AppError.ts` - src/services/base/AppError.ts
- [x] `CryptoConstants.ts` - src/config/constants/CryptoConstants.ts
- [x] `StorageKeys.ts` - src/config/constants/StorageKeys.ts
- [x] `ErrorCodes.ts` - src/config/constants/ErrorCodes.ts
- [x] `useAccessibility.ts` - src/hooks/useAccessibility.ts

### Remaining

| Task                             | Priority | Effort | Description                                       |
| -------------------------------- | -------- | ------ | ------------------------------------------------- |
| `RpcErrorParser.ts`              | Medium   | 3 SP   | Extract RPC error parsing from TransactionService |
| `EncodingConverter.ts`           | Low      | 2 SP   | Extract byte/hex conversion from CryptoService    |
| `UnitConverter.ts`               | Low      | 2 SP   | Extract wei/gwei/eth conversion utilities         |
| `BaseService.ts`                 | Medium   | 5 SP   | Abstract base class for service patterns          |
| `useAccessibilityFeature()`      | Low      | 2 SP   | Hook factory to reduce duplication                |
| Update services to use utilities | Medium   | 8 SP   | Refactor services to use new base classes         |

**Total Remaining: ~22 Story Points**

---

## 2. Phase 1: MVP Core Wallet (Remaining 5%)

### Implemented Features

- [x] Wallet creation with 12/24-word mnemonic
- [x] Wallet import from mnemonic/private key
- [x] Secure key storage (native keychain)
- [x] Biometric authentication
- [x] PIN authentication
- [x] Ethereum mainnet/testnet support
- [x] Send/Receive ETH transactions
- [x] ERC-20 token support
- [x] Transaction history
- [x] Gas estimation (slow, standard, fast)
- [x] Real-time token prices
- [x] Portfolio USD value
- [x] Transaction speedup/cancel
- [x] Cloud backup system

### Remaining Tasks

| Task                     | Priority | Effort | Description                   |
| ------------------------ | -------- | ------ | ----------------------------- |
| Security audit           | High     | 13 SP  | External security firm review |
| Penetration testing      | High     | 8 SP   | Simulate attacks              |
| Performance optimization | Medium   | 5 SP   | Reduce load times             |
| Memory leak fixes        | Medium   | 5 SP   | Profile and fix leaks         |

**Total Remaining: ~31 Story Points**

---

## 3. Phase 2: Social Wallet (Remaining 60%)

### Implemented Features

- [x] BLE Service (basic)
- [x] Chat Service (basic messaging)
- [x] Address Book / Contact management
- [x] WalletConnect v2 integration
- [x] DEX swap integration (0x/1inch)
- [x] NFT API integration (Alchemy/Moralis)
- [x] Custom token import
- [x] DApp browser with Web3 injection

### Multi-Chain Support

| Task                                   | Priority | Effort | Dependencies  |
| -------------------------------------- | -------- | ------ | ------------- |
| Chain metadata registry                | High     | 3 SP   | None          |
| EVMChainAdapter base class             | High     | 8 SP   | Metadata      |
| SolanaAdapter implementation           | High     | 8 SP   | Interface     |
| BitcoinAdapter (read-only)             | Medium   | 5 SP   | Interface     |
| BlockchainAdapterFactory               | High     | 3 SP   | Adapters      |
| Multi-chain account derivation (BIP44) | High     | 5 SP   | Adapters      |
| Chain switcher UI                      | High     | 3 SP   | Factory       |
| Per-chain balance display              | High     | 3 SP   | Adapters      |
| SPL token support (Solana)             | High     | 5 SP   | SolanaAdapter |
| BEP-20 token support (BSC)             | Medium   | 3 SP   | EVMAdapter    |

**Subtotal: ~46 Story Points**

### Signal Protocol Messaging

| Task                               | Priority | Effort | Dependencies |
| ---------------------------------- | -------- | ------ | ------------ |
| @signalapp/libsignal-client setup  | Critical | 5 SP   | None         |
| SignalProtocolStore implementation | Critical | 5 SP   | Library      |
| X3DH key exchange protocol         | Critical | 8 SP   | Store        |
| Double Ratchet implementation      | Critical | 8 SP   | X3DH         |
| Pre-key generation/rotation        | High     | 5 SP   | Protocol     |
| Message encryption service         | Critical | 5 SP   | Ratchet      |

**Subtotal: ~36 Story Points**

### Enhanced Messaging Services

| Task                               | Priority | Effort | Dependencies |
| ---------------------------------- | -------- | ------ | ------------ |
| Message entity (Signal-compatible) | High     | 2 SP   | None         |
| Conversation entity                | High     | 2 SP   | Message      |
| SendMessageUseCase (encrypted)     | High     | 5 SP   | Signal       |
| ReceiveMessageUseCase (decryption) | High     | 5 SP   | Signal       |
| MessageRepository (SQLite)         | High     | 5 SP   | Entities     |
| WebSocket client                   | High     | 5 SP   | API          |
| Offline message queue              | Medium   | 5 SP   | Repository   |
| Message sync service               | Medium   | 5 SP   | Queue        |
| Delivery receipts                  | Medium   | 3 SP   | WebSocket    |

**Subtotal: ~37 Story Points**

### Profile & Contact Enhancement

| Task                             | Priority | Effort | Dependencies |
| -------------------------------- | -------- | ------ | ------------ |
| Profile entity with social links | Medium   | 2 SP   | None         |
| CreateProfileUseCase             | Medium   | 3 SP   | Entity       |
| UpdateProfileUseCase             | Medium   | 3 SP   | Entity       |
| ProfileRepository (API sync)     | Medium   | 5 SP   | Entity       |
| QR code profile generation       | Medium   | 2 SP   | Library      |
| Avatar upload                    | Medium   | 3 SP   | API          |
| Social link OAuth integration    | Low      | 5 SP   | API          |
| Contact groups                   | Low      | 3 SP   | Repository   |

**Subtotal: ~26 Story Points**

### BLE Proximity Discovery (Enhancement)

| Task                                 | Priority | Effort | Dependencies |
| ------------------------------------ | -------- | ------ | ------------ |
| BLE permissions (iOS/Android)        | High     | 2 SP   | None         |
| Profile encoding/decoding for BLE    | High     | 3 SP   | Profile      |
| RSSI distance estimation             | High     | 3 SP   | BLE          |
| Discovery modes (active/passive/off) | High     | 3 SP   | BLE          |
| Battery-optimized scanning           | High     | 5 SP   | BLE          |
| BLE per-session encryption           | High     | 5 SP   | Security     |
| Discovery UI enhancement             | Medium   | 5 SP   | BLE          |
| Connection request flow              | Medium   | 3 SP   | Contact      |
| Event mode (enhanced discovery)      | Low      | 3 SP   | BLE          |

**Subtotal: ~32 Story Points**

**Phase 2 Total Remaining: ~177 Story Points**

---

## 4. Phase 3: Communication Hub (0% Complete)

### Group Messaging (Sender Keys Protocol)

| Task                       | Priority | Effort | Dependencies |
| -------------------------- | -------- | ------ | ------------ |
| Group entity               | High     | 2 SP   | None         |
| CreateGroupUseCase         | High     | 5 SP   | Entity       |
| AddMemberUseCase           | High     | 3 SP   | Group        |
| RemoveMemberUseCase        | High     | 3 SP   | Group        |
| UpdateGroupSettingsUseCase | Medium   | 2 SP   | Group        |
| GroupRepository            | High     | 5 SP   | Entity       |
| Sender Keys Protocol       | Critical | 8 SP   | Signal       |
| Group key distribution     | Critical | 5 SP   | Sender Keys  |
| GroupController            | High     | 5 SP   | Use cases    |
| CreateGroupScreen          | High     | 5 SP   | Controller   |
| Group member selector      | High     | 3 SP   | Contacts     |
| GroupChatScreen            | High     | 5 SP   | Chat         |
| Group info screen          | Medium   | 3 SP   | Group        |
| Group admin controls       | Medium   | 3 SP   | Permissions  |
| Group invite link          | Medium   | 3 SP   | API          |
| Group QR code              | Medium   | 2 SP   | QR           |
| Group notifications        | Medium   | 2 SP   | Push         |

**Subtotal: ~64 Story Points**

### Voice Calling (WebRTC)

| Task                         | Priority | Effort | Dependencies |
| ---------------------------- | -------- | ------ | ------------ |
| react-native-webrtc setup    | High     | 3 SP   | None         |
| WebRTCService implementation | Critical | 8 SP   | Library      |
| Signaling server (WebSocket) | Critical | 8 SP   | WebRTC       |
| STUN/TURN server setup       | Critical | 5 SP   | DevOps       |
| Call entity                  | High     | 2 SP   | None         |
| InitiateCallUseCase          | High     | 5 SP   | WebRTC       |
| AnswerCallUseCase            | High     | 5 SP   | WebRTC       |
| EndCallUseCase               | High     | 3 SP   | WebRTC       |
| CallController               | High     | 5 SP   | Use cases    |
| Phone number generation      | Medium   | 3 SP   | Crypto       |
| CallScreen UI                | High     | 5 SP   | WebRTC       |
| DialerScreen                 | High     | 3 SP   | Contacts     |
| Incoming call screen         | High     | 3 SP   | CallKit      |
| CallKit integration (iOS)    | High     | 5 SP   | CallScreen   |
| ConnectionService (Android)  | High     | 5 SP   | CallScreen   |
| Call quality indicators      | Medium   | 3 SP   | WebRTC       |
| Call history screen          | Medium   | 2 SP   | Repository   |
| Voicemail (basic)            | Low      | 5 SP   | API          |

**Subtotal: ~78 Story Points**

### BLE Mesh Networking

| Task                          | Priority | Effort | Dependencies  |
| ----------------------------- | -------- | ------ | ------------- |
| Mesh node entity              | High     | 2 SP   | BLE           |
| Routing table                 | Critical | 5 SP   | Node          |
| Mesh packet protocol          | High     | 3 SP   | None          |
| Multi-hop routing algorithm   | Critical | 8 SP   | Routing       |
| Packet forwarding             | High     | 5 SP   | Routing       |
| TTL (Time To Live)            | High     | 2 SP   | Packet        |
| Mesh encryption (E2E)         | Critical | 5 SP   | Signal        |
| MeshNetworkService            | Critical | 8 SP   | All above     |
| Connection quality monitoring | Medium   | 3 SP   | BLE           |
| Route optimization            | Medium   | 5 SP   | Routing       |
| Mesh resilience               | Medium   | 5 SP   | Routing       |
| Bandwidth optimization        | Medium   | 3 SP   | Packet        |
| Battery optimization          | High     | 5 SP   | BLE           |
| Mesh event mode               | Low      | 3 SP   | Mesh          |
| Mesh visualization UI         | Medium   | 5 SP   | Service       |
| Mesh UI indicators            | Medium   | 3 SP   | Visualization |

**Subtotal: ~70 Story Points**

### GPS Feed Flags

| Task                              | Priority | Effort | Dependencies |
| --------------------------------- | -------- | ------ | ------------ |
| FeedFlag entity                   | High     | 2 SP   | None         |
| CreateFeedFlagUseCase             | High     | 5 SP   | Entity       |
| GetNearbyFlagsUseCase             | High     | 5 SP   | Entity       |
| FeedRepository                    | High     | 5 SP   | Entity       |
| Geolocation service               | High     | 3 SP   | Permissions  |
| Reverse geocoding                 | Medium   | 3 SP   | API          |
| Location fuzzing                  | High     | 2 SP   | Privacy      |
| View tracking                     | Medium   | 3 SP   | Repository   |
| Feed expiration service           | Medium   | 3 SP   | Repository   |
| Feed monetization API             | Medium   | 5 SP   | API          |
| Map view (react-native-maps)      | High     | 5 SP   | Library      |
| CreateFeedFlagScreen              | High     | 5 SP   | Use case     |
| Feed flag markers                 | High     | 3 SP   | Map          |
| Feed flag detail modal            | High     | 3 SP   | Entity       |
| Feed list view                    | Medium   | 3 SP   | Repository   |
| Feed interactions (like, comment) | Medium   | 5 SP   | API          |
| Trending algorithm                | Medium   | 5 SP   | Stats        |
| Feed notifications                | Medium   | 3 SP   | Push         |
| Geofencing                        | Low      | 5 SP   | Location     |
| Paid tier UI                      | Low      | 3 SP   | Payments     |

**Subtotal: ~76 Story Points**

**Phase 3 Total: ~288 Story Points**

---

## 5. Phase 4: AI & Gaming Platform (0% Complete)

### LLM Integration

| Task                                | Priority | Effort | Dependencies |
| ----------------------------------- | -------- | ------ | ------------ |
| LLM API integration (Claude/OpenAI) | High     | 5 SP   | None         |
| LLMService implementation           | High     | 5 SP   | API          |
| Context builder from wallet         | High     | 5 SP   | Wallet       |
| QueryAIUseCase                      | High     | 3 SP   | Service      |
| AI response formatting              | Medium   | 3 SP   | LLM          |
| AI cost tracking                    | Medium   | 2 SP   | LLM          |
| Privacy protection                  | Critical | 5 SP   | Security     |
| AIController                        | High     | 3 SP   | Use case     |
| AIAssistantScreen                   | High     | 5 SP   | Controller   |
| Voice input (speech-to-text)        | Medium   | 5 SP   | API          |
| Query history                       | Low      | 2 SP   | Repository   |
| Context controls                    | Medium   | 3 SP   | Privacy      |
| AI suggestions                      | Medium   | 3 SP   | AI           |
| AI rate limiting UI                 | Medium   | 2 SP   | API          |

**Subtotal: ~51 Story Points**

### Creature Training Game

| Task                      | Priority | Effort | Dependencies |
| ------------------------- | -------- | ------ | ------------ |
| Creature entity           | High     | 3 SP   | None         |
| CreateCreatureUseCase     | High     | 3 SP   | Entity       |
| TrainCreatureUseCase      | High     | 5 SP   | Entity       |
| Creature type definitions | High     | 2 SP   | Entity       |
| XP system                 | High     | 3 SP   | Creature     |
| Stats system              | High     | 3 SP   | Creature     |
| Ability system            | High     | 5 SP   | Stats        |
| Personality system        | Medium   | 3 SP   | Training     |
| CreatureRepository        | High     | 3 SP   | Entity       |
| Training activity types   | High     | 2 SP   | Creature     |
| Q&A training (LLM)        | High     | 5 SP   | LLM          |
| Task training             | Medium   | 5 SP   | Activities   |
| Daily challenges          | Medium   | 3 SP   | Activities   |
| XP rewards                | Medium   | 2 SP   | XP           |
| Evolution system          | Medium   | 5 SP   | Level        |
| Breeding system (basic)   | Low      | 5 SP   | Creature     |
| CreatureController        | High     | 5 SP   | Use cases    |
| Creature art generation   | Medium   | 8 SP   | AI           |
| CreatureScreen            | High     | 5 SP   | Entity       |
| Training UI               | High     | 5 SP   | Activities   |
| Stats display             | High     | 2 SP   | Stats        |
| Ability tree              | Medium   | 3 SP   | Abilities    |
| Evolution animation       | Medium   | 3 SP   | Evolution    |
| Breeding UI               | Low      | 3 SP   | Breeding     |
| PvP battles (basic)       | Low      | 5 SP   | Creature     |

**Subtotal: ~97 Story Points**

### AI Agent Marketplace

| Task                     | Priority | Effort | Dependencies |
| ------------------------ | -------- | ------ | ------------ |
| AIAgent entity           | High     | 3 SP   | None         |
| Agent permissions system | Critical | 5 SP   | Security     |
| CreateAgentUseCase       | High     | 5 SP   | Entity       |
| PublishAgentUseCase      | High     | 5 SP   | Entity       |
| InstallAgentUseCase      | High     | 5 SP   | Entity       |
| AgentRepository          | High     | 5 SP   | Entity       |
| Agent marketplace API    | High     | 8 SP   | API          |
| Agent pricing/payment    | Medium   | 5 SP   | API          |
| Agent sandbox execution  | Critical | 8 SP   | Security     |
| AgentMarketplaceScreen   | High     | 5 SP   | API          |
| AgentDetailScreen        | High     | 3 SP   | Entity       |
| InstalledAgentsScreen    | Medium   | 3 SP   | Repository   |
| Agent settings UI        | Medium   | 3 SP   | Permissions  |
| Agent usage analytics    | Low      | 3 SP   | Service      |

**Subtotal: ~66 Story Points**

### Game Marketplace

| Task                   | Priority | Effort | Dependencies |
| ---------------------- | -------- | ------ | ------------ |
| MiniGame entity        | High     | 3 SP   | None         |
| GameSession entity     | High     | 2 SP   | Game         |
| LoadGameUseCase        | High     | 5 SP   | Entity       |
| GameScoreUseCase       | High     | 3 SP   | Session      |
| GameRepository         | High     | 5 SP   | Entity       |
| Game marketplace API   | High     | 8 SP   | API          |
| Game WebView container | High     | 5 SP   | Library      |
| Game sandbox           | Critical | 8 SP   | Security     |
| In-game currency       | Medium   | 5 SP   | Crypto       |
| GameMarketplaceScreen  | High     | 5 SP   | API          |
| GameDetailScreen       | High     | 3 SP   | Entity       |
| GamePlayScreen         | High     | 5 SP   | WebView      |
| Leaderboard            | Medium   | 3 SP   | Scores       |
| Achievements           | Low      | 5 SP   | Stats        |

**Subtotal: ~65 Story Points**

**Phase 4 Total: ~279 Story Points**

---

## 6. Backend Services (Cross-Phase)

Based on PRD and IMPLEMENTATION_PLAN, backend services need to be developed:

| Service                   | Priority | Effort | Dependencies |
| ------------------------- | -------- | ------ | ------------ |
| User authentication API   | Critical | 13 SP  | None         |
| Profile management API    | High     | 8 SP   | Auth         |
| Messaging relay server    | Critical | 13 SP  | WebSocket    |
| Key exchange server       | Critical | 8 SP   | Signal       |
| WebRTC signaling server   | High     | 8 SP   | WebSocket    |
| Feed/Flag API             | Medium   | 8 SP   | Geo          |
| Agent marketplace backend | Medium   | 13 SP  | API          |
| Game marketplace backend  | Medium   | 13 SP  | API          |
| Push notification service | High     | 5 SP   | FCM/APNs     |
| Analytics service         | Medium   | 5 SP   | None         |

**Backend Total: ~94 Story Points**

---

## 7. Priority Summary

### P0 - Critical (Must Have)

1. Security audit & penetration testing (Phase 1 completion)
2. Signal Protocol implementation (E2E encryption)
3. Multi-chain support (Solana, BSC)

### P1 - High Priority

1. Group messaging with Sender Keys
2. WebRTC voice calling
3. BLE mesh networking
4. GPS feed flags
5. Backend authentication & messaging APIs

### P2 - Medium Priority

1. Clean code improvements (RpcErrorParser, BaseService)
2. AI assistant integration
3. Creature training game
4. Agent/Game marketplaces

### P3 - Low Priority

1. Encoding/Unit converters
2. Accessibility hook refactoring
3. Advanced game features (breeding, PvP)

---

## 8. Estimated Timeline

| Phase                | Story Points | Sprints (40 SP/sprint) | Months |
| -------------------- | ------------ | ---------------------- | ------ |
| Clean Code Remaining | 22           | 1                      | 0.5    |
| Phase 1 Remaining    | 31           | 1                      | 0.5    |
| Phase 2 Remaining    | 177          | 5                      | 2.5    |
| Phase 3              | 288          | 8                      | 4      |
| Phase 4              | 279          | 7                      | 3.5    |
| Backend Services     | 94           | 3                      | 1.5    |

**Total Estimated: 891 Story Points / 25 Sprints / ~12.5 months**

---

## 9. Quick Start Recommendations

### Immediate Actions (Next Sprint)

1. Complete security audit for Phase 1 release
2. Start multi-chain adapter architecture
3. Begin Signal Protocol integration research

### Short-term (Next Month)

1. Implement EVMChainAdapter and SolanaAdapter
2. Set up @signalapp/libsignal-client
3. Design backend authentication system

### Medium-term (Next Quarter)

1. Complete Phase 2 (Social Wallet)
2. Begin Phase 3 (Communication Hub)
3. Set up STUN/TURN servers for WebRTC

---

## Appendix: File References

### Key Files to Modify

- `src/services/blockchain/ChainManager.ts` - Multi-chain support
- `src/services/communication/ChatService.ts` - Signal Protocol
- `src/services/communication/BLEService.ts` - Mesh networking
- `src/navigation/types.ts` - New screens navigation

### New Files to Create

- `src/core/adapters/SolanaAdapter.ts`
- `src/core/adapters/BitcoinAdapter.ts`
- `src/core/crypto/signal/SignalProtocolService.ts`
- `src/core/ble/mesh/MeshNetworkService.ts`
- `src/core/calling/WebRTCService.ts`
- `src/core/ai/LLMService.ts`
- `src/domain/entities/Creature.ts`
- `src/domain/entities/AIAgent.ts`
- `src/domain/entities/FeedFlag.ts`
