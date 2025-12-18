# DeyondCrypt Protocol 설계 문서

## 1. Signal Protocol 분석

### 1.1 Signal Protocol 구성 요소

Signal Protocol은 두 가지 핵심 알고리즘으로 구성됩니다:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Signal Protocol 구조                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐      ┌─────────────────────────────────┐  │
│  │      X3DH       │      │       Double Ratchet            │  │
│  │ (키 교환 프로토콜)│ ──▶ │    (메시지 암호화 프로토콜)       │  │
│  └─────────────────┘      └─────────────────────────────────┘  │
│                                                                 │
│  • 초기 세션 수립          • 지속적인 키 갱신                   │
│  • 오프라인 메시지 지원     • Forward Secrecy 제공              │
│  • 상호 인증               • Post-Compromise Security          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 X3DH (Extended Triple Diffie-Hellman)

초기 키 교환을 위한 프로토콜입니다.

```
Alice (발신자)                              Bob (수신자)
     │                                           │
     │  Bob의 사전 등록된 키들:                   │
     │  • IK_B: Identity Key (장기 키)           │
     │  • SPK_B: Signed PreKey (중기 키)         │
     │  • OPK_B: One-time PreKey (일회용 키)     │
     │                                           │
     │  Alice가 계산:                            │
     │  DH1 = DH(IK_A, SPK_B)                    │
     │  DH2 = DH(EK_A, IK_B)                     │
     │  DH3 = DH(EK_A, SPK_B)                    │
     │  DH4 = DH(EK_A, OPK_B)  ← 있을 경우       │
     │                                           │
     │  SK = KDF(DH1 || DH2 || DH3 || DH4)       │
     │       ↑ 초기 공유 비밀                     │
```

**키 종류 설명:**
| 키 | 수명 | 목적 |
|----|------|------|
| Identity Key (IK) | 영구 | 사용자 신원 증명 |
| Signed PreKey (SPK) | 1주~1달 | 중기 키 교환 |
| One-time PreKey (OPK) | 1회 | 각 세션마다 고유성 보장 |
| Ephemeral Key (EK) | 1회 | 발신자 측 일회용 키 |

### 1.3 Double Ratchet Algorithm

```
┌─────────────────────────────────────────────────────────────────┐
│                  Double Ratchet 구조                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              DH Ratchet (비대칭 래칫)                    │   │
│   │   • 매 라운드트립마다 새 DH 키쌍 생성                    │   │
│   │   • 새로운 Root Key 파생                                │   │
│   │   • Post-Compromise Security 제공                       │   │
│   └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │           Symmetric Ratchet (대칭 래칫)                  │   │
│   │   • 매 메시지마다 Chain Key에서 Message Key 파생         │   │
│   │   • 단방향 해시 함수 사용 (역산 불가)                    │   │
│   │   • Forward Secrecy 제공                                │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**키 파생 과정:**

```
Root Key (RK)
    │
    ├──▶ DH Ratchet ──▶ 새 Root Key + Chain Key
    │
Chain Key (CK)
    │
    ├──▶ CK_1 ──▶ Message Key 1 (사용 후 삭제)
    │
    ├──▶ CK_2 ──▶ Message Key 2 (사용 후 삭제)
    │
    └──▶ CK_n ──▶ Message Key n (사용 후 삭제)
```

### 1.4 키 충돌(Collision) 보안 분석

**우려 사항:** "키를 계속 교체하면 언젠가 중복되지 않을까?"

**분석 결과: 실질적으로 안전함**

```
┌─────────────────────────────────────────────────────────────────┐
│                    키 충돌 확률 분석                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  키 크기: 256비트 (secp256k1, AES-256)                          │
│  가능한 키 수: 2^256 ≈ 1.16 × 10^77                             │
│                                                                 │
│  Birthday Paradox 적용:                                         │
│  • 50% 충돌 확률에 필요한 키 수: √(2^256) = 2^128개             │
│  • 2^128 ≈ 3.4 × 10^38 개의 키                                  │
│                                                                 │
│  현실적 시나리오:                                                │
│  • 1초에 10억(10^9)개 키 생성                                   │
│  • 1년 = 3.15 × 10^7 초                                         │
│  • 1년에 3.15 × 10^16 개 키 생성 가능                           │
│  • 50% 충돌까지: 10^22년 소요 (우주 나이의 10^12배)              │
│                                                                 │
│  결론: 키 충돌은 실질적으로 불가능                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**추가 보안 메커니즘:**

1. **KDF 사용**: 키는 직접 생성되지 않고 KDF(HKDF)를 통해 파생
   - 입력: 이전 키 + DH 결과 + salt
   - 같은 출력이 나오려면 모든 입력이 동일해야 함

2. **Context Binding**: 각 키 파생에 고유 컨텍스트 포함
   - 세션 ID, 메시지 번호, 타임스탬프 등

3. **즉시 삭제**: Message Key는 사용 후 즉시 삭제
   - 같은 키가 두 번 사용될 수 없음

---

## 2. DeyondCrypt Protocol 설계

### 2.1 Signal vs DeyondCrypt 비교

| 항목         | Signal Protocol | DeyondCrypt Protocol           |
| ------------ | --------------- | ------------------------------ |
| Identity Key | 별도 생성       | 지갑 키에서 파생               |
| 키 배포      | 중앙 서버       | P2P / 온체인                   |
| 사용자 ID    | 전화번호        | 지갑 주소                      |
| 키 교환      | X3DH            | Blockchain-X3DH                |
| 지원 곡선    | Curve25519      | secp256k1, ed25519 (확장 가능) |
| PreKey 저장  | Signal 서버     | IPFS / DHT / 온체인            |

### 2.2 아키텍처 설계

```
┌─────────────────────────────────────────────────────────────────┐
│                   DeyondCrypt Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Application Layer                       │  │
│  │  ChatManager, MessageStore, SessionManager                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Protocol Layer                          │  │
│  │  DeyondCryptEngine, DoubleRatchet, KeyExchange            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Crypto Layer (확장 가능)                │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │  │
│  │  │ EVMCrypto   │ │ SolanaCrypto│ │ Future...   │         │  │
│  │  │ (secp256k1) │ │ (ed25519)   │ │             │         │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Transport Layer                         │  │
│  │  P2P (Bluetooth/WebRTC), IPFS, LibP2P                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 모듈 구조

```
src/
└── crypto/
    └── deyondcrypt/
        ├── index.ts                 # 메인 export
        ├── types.ts                 # 타입 정의
        │
        ├── core/
        │   ├── DeyondCryptEngine.ts # 메인 엔진
        │   ├── DoubleRatchet.ts     # Double Ratchet 구현
        │   ├── KeyExchange.ts       # 키 교환 (X3DH 변형)
        │   └── SessionManager.ts    # 세션 관리
        │
        ├── primitives/
        │   ├── ICryptoPrimitive.ts  # 추상 인터페이스
        │   ├── EVMCrypto.ts         # secp256k1 구현
        │   ├── SolanaCrypto.ts      # ed25519 구현
        │   └── CryptoFactory.ts     # 체인별 팩토리
        │
        ├── keys/
        │   ├── KeyDerivation.ts     # 지갑 → 메시징 키 파생
        │   ├── PreKeyBundle.ts      # PreKey 관리
        │   └── KeyStore.ts          # 키 저장소
        │
        ├── messages/
        │   ├── MessageEncoder.ts    # 메시지 직렬화
        │   ├── MessageDecoder.ts    # 메시지 역직렬화
        │   └── Envelope.ts          # 메시지 봉투
        │
        ├── group/
        │   ├── GroupKeyManager.ts   # 그룹 키 관리
        │   ├── SenderKeys.ts        # Sender Keys 프로토콜
        │   └── GroupSession.ts      # 그룹 세션
        │
        └── transport/
            ├── P2PTransport.ts      # P2P 전송
            └── IPFSTransport.ts     # IPFS 전송 (옵션)
```

### 2.4 핵심 인터페이스 설계

```typescript
/**
 * 체인별 암호화 프리미티브 인터페이스
 * 새로운 체인 추가 시 이 인터페이스만 구현하면 됨
 */
interface ICryptoPrimitive {
  // 체인 정보
  readonly chainType: ChainType;
  readonly curveType: 'secp256k1' | 'ed25519' | 'curve25519';

  // 키 생성
  generateKeyPair(): KeyPair;
  derivePublicKey(privateKey: Uint8Array): Uint8Array;

  // ECDH (공유 비밀 생성)
  ecdh(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array;

  // 서명
  sign(privateKey: Uint8Array, message: Uint8Array): Uint8Array;
  verify(publicKey: Uint8Array, message: Uint8Array, signature: Uint8Array): boolean;

  // 키 검증
  isValidPublicKey(publicKey: Uint8Array): boolean;
  isValidPrivateKey(privateKey: Uint8Array): boolean;
}

/**
 * 메시지 봉투 구조
 */
interface DeyondCryptEnvelope {
  version: number;

  // 발신자 정보
  sender: {
    address: string;
    chainType: ChainType;
    identityKey: string; // Base64
  };

  // 수신자 정보
  recipient: {
    address: string;
    chainType: ChainType;
  };

  // 암호화 데이터
  header: {
    ephemeralKey: string; // DH Ratchet 공개키
    previousChainLength: number;
    messageNumber: number;
  };

  ciphertext: string; // 암호화된 메시지

  // 인증
  signature: string; // 발신자 서명
  timestamp: number;
  messageId: string;
}

/**
 * 세션 상태
 */
interface SessionState {
  // DH Ratchet 상태
  dhRatchetKeyPair: KeyPair;
  remoteDhRatchetKey: Uint8Array | null;
  rootKey: Uint8Array;

  // Sending Chain
  sendingChainKey: Uint8Array | null;
  sendingMessageNumber: number;

  // Receiving Chain
  receivingChainKey: Uint8Array | null;
  receivingMessageNumber: number;

  // 이전 체인 키들 (out-of-order 메시지 처리용)
  skippedMessageKeys: Map<string, Uint8Array>;

  // 메타데이터
  createdAt: number;
  lastActivityAt: number;
}
```

### 2.5 키 파생 체계

```
┌─────────────────────────────────────────────────────────────────┐
│              지갑 키 → 메시징 키 파생 체계                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Wallet Seed (BIP39 Mnemonic)                                   │
│       │                                                         │
│       ▼                                                         │
│  Master Key (BIP32)                                             │
│       │                                                         │
│       ├──▶ m/44'/60'/0'/0/0  → EVM Account (기존)              │
│       │                                                         │
│       └──▶ m/44'/60'/0'/1/0  → Messaging Identity Key          │
│                 │                                               │
│                 ├──▶ + "signed_prekey" → Signed PreKey         │
│                 │                                               │
│                 └──▶ + "prekey_N" → One-time PreKey N          │
│                                                                 │
│  파생 함수:                                                     │
│  SignedPreKey = HKDF(IdentityKey, "deyondcrypt_spk", salt)     │
│  OneTimePreKey = HKDF(IdentityKey, "deyondcrypt_opk_" + N)     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.6 P2P 메시지 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                    P2P 메시지 전송 흐름                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 세션 초기화 (최초 1회)                                       │
│     ┌─────────┐                           ┌─────────┐          │
│     │  Alice  │                           │   Bob   │          │
│     └────┬────┘                           └────┬────┘          │
│          │                                     │               │
│          │  ① PreKey 요청 (P2P Discovery)      │               │
│          │ ──────────────────────────────────▶ │               │
│          │                                     │               │
│          │  ② PreKey Bundle 전송               │               │
│          │ ◀────────────────────────────────── │               │
│          │     {IK_B, SPK_B, OPK_B, Sig}       │               │
│          │                                     │               │
│          │  ③ X3DH 수행 → 공유 비밀 생성        │               │
│          │                                     │               │
│                                                                 │
│  2. 메시지 전송                                                  │
│     ┌─────────┐                           ┌─────────┐          │
│     │  Alice  │                           │   Bob   │          │
│     └────┬────┘                           └────┬────┘          │
│          │                                     │               │
│          │  ① 메시지 암호화 (Double Ratchet)    │               │
│          │  ② 서명 생성                         │               │
│          │  ③ P2P 전송                         │               │
│          │ ──────────────────────────────────▶ │               │
│          │     Envelope { header, cipher, sig }│               │
│          │                                     │               │
│          │                    ④ 서명 검증       │               │
│          │                    ⑤ 복호화         │               │
│          │                    ⑥ Ratchet 진행   │               │
│          │                                     │               │
│          │  ⑦ 응답 메시지 (새 DH 키 포함)       │               │
│          │ ◀────────────────────────────────── │               │
│          │                                     │               │
│          │  ⑧ DH Ratchet 진행                  │               │
│          │                                     │               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.7 그룹 메시징 설계

```
┌─────────────────────────────────────────────────────────────────┐
│              Sender Keys 프로토콜 (그룹 메시징)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Signal의 그룹 메시징 방식: Sender Keys                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  각 멤버가 자신만의 Sender Key 생성                       │   │
│  │  → 다른 모든 멤버에게 1:1로 암호화하여 배포               │   │
│  │  → 메시지는 자신의 Sender Key로 암호화                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  예시: Alice, Bob, Charlie 그룹                                 │
│                                                                 │
│  Alice:                                                         │
│    SenderKey_A 생성                                             │
│    → Bob에게 전달: encrypt(Bob.pubKey, SenderKey_A)             │
│    → Charlie에게 전달: encrypt(Charlie.pubKey, SenderKey_A)     │
│                                                                 │
│  Alice가 메시지 전송:                                            │
│    encrypted = encrypt(SenderKey_A, "Hello group!")             │
│    broadcast(encrypted) → Bob, Charlie 모두 복호화 가능         │
│                                                                 │
│  장점:                                                          │
│    • 메시지 크기가 멤버 수와 무관 (O(1))                         │
│    • 개별 암호화 대비 효율적                                     │
│                                                                 │
│  Forward Secrecy:                                               │
│    • Sender Key도 주기적으로 ratchet                            │
│    • 새 멤버 추가 시 새 Sender Key 배포                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 보안 고려사항

### 3.1 위협 모델

| 위협            | 대응 방안                            |
| --------------- | ------------------------------------ |
| 메시지 가로채기 | E2E 암호화 (AES-256-GCM)             |
| 발신자 위장     | 디지털 서명 (ECDSA/EdDSA)            |
| 재전송 공격     | 메시지 ID + 타임스탬프 + 시퀀스 번호 |
| 키 탈취 (현재)  | Forward Secrecy (Double Ratchet)     |
| 키 탈취 (과거)  | Post-Compromise Security             |
| 중간자 공격     | 키 검증 (Safety Number)              |

### 3.2 키 수명 주기

```
┌─────────────────────────────────────────────────────────────────┐
│                      키 수명 주기                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Identity Key       ────────────────────────────────────────▶   │
│  (영구, 지갑 키 기반)     변경 불가 (지갑 변경 = 신원 변경)        │
│                                                                 │
│  Signed PreKey      ──────────▶ ──────────▶ ──────────▶         │
│  (1주~1달)               교체       교체       교체              │
│                                                                 │
│  One-time PreKey    ─▶                                          │
│  (1회 사용)          삭제                                        │
│                                                                 │
│  Session Root Key   ──▶ ──▶ ──▶ ──▶ ──▶ ──▶                    │
│  (매 라운드트립)     DH   DH   DH   DH   DH   (Ratchet)         │
│                                                                 │
│  Message Key        ▶ ▶ ▶ ▶ ▶                                  │
│  (1회 사용)         즉시 삭제                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. 구현 로드맵

### Phase 1: 기반 구축 (1-2주)

- [ ] ICryptoPrimitive 인터페이스 정의
- [ ] EVMCrypto 구현 (secp256k1)
- [ ] 기본 KDF 및 AEAD 구현
- [ ] 키 파생 모듈

### Phase 2: 핵심 프로토콜 (2-3주)

- [ ] Double Ratchet 구현
- [ ] X3DH 키 교환 (블록체인 변형)
- [ ] 세션 관리
- [ ] 메시지 인코딩/디코딩

### Phase 3: P2P 통합 (1-2주)

- [ ] P2P Transport 추상화
- [ ] Bluetooth 통합
- [ ] PreKey 배포 메커니즘

### Phase 4: 그룹 메시징 (2주)

- [ ] Sender Keys 구현
- [ ] 그룹 세션 관리
- [ ] 멤버 추가/제거 처리

### Phase 5: Solana 확장 (1주)

- [ ] SolanaCrypto 구현 (ed25519)
- [ ] 크로스체인 세션 지원

---

## 5. 참고 자료

- Signal Protocol Specification: https://signal.org/docs/
- Double Ratchet Algorithm: https://signal.org/docs/specifications/doubleratchet/
- X3DH Key Agreement: https://signal.org/docs/specifications/x3dh/
- libsignal: https://github.com/signalapp/libsignal
