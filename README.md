# Deyond - Crypto Wallet App

MetaMask과 유사한 기능을 갖춘 암호화폐 지갑 앱으로, 혁신적인 P2P 암호화 메시징 기능을 제공합니다.

## Features

### Wallet

- **Multi-Chain Support**: Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche, Fantom, Base (8개 네트워크)
- **Account Management**: 다중 계정 생성, 가져오기, 관리
- **Transaction Management**: EIP-1559 지원 송금, 수신, 트랜잭션 추적
- **Token Support**: ERC-20, ERC-721, ERC-1155 토큰 지원
- **NFT Gallery**: NFT 컬렉션 브라우징 및 관리
- **HD Wallet**: BIP39/BIP44 준수 계층적 결정 지갑

### P2P Encrypted Messaging

- **End-to-End Encryption**: Signal Protocol 기반의 완전한 종단간 암호화
- **Multiple Connection Options**: Bluetooth, Wi-Fi, 인터넷을 통한 유연한 연결
- **Offline Messaging**: 인터넷 없이 근거리 블루투스로 메시지 전송
- **Group Chat**: 보안 그룹 채팅 지원
- **Wallet-Based Identity**: 지갑 주소를 ID로 사용

### User Experience

- **QR Code**: 지갑 주소 스캔 및 생성
- **Address Book**: 자주 사용하는 주소 저장
- **Transaction Filters**: 날짜, 상태, 토큰별 고급 필터링
- **Gas Tracker**: 실시간 가스 가격 모니터링 (느림/보통/빠름)
- **Biometric Auth**: Face ID/Touch ID 지원
- **Multi-language**: 한국어, 영어 지원

---

## Security

### Encryption

- **AES-256-GCM**: 민감한 데이터 암호화
- **PBKDF2**: 100,000 반복의 키 파생
- **secp256k1**: 서명 및 키 교환
- **Secure Storage**: iOS Keychain / Android Keystore

### Messaging Protocol (DeyondCrypt)

Signal Protocol을 기반으로 한 보안 메시징:

- **Forward Secrecy**: 키가 노출되어도 과거 메시지 보호
- **Post-Compromise Security**: 키 노출 후에도 향후 메시지 보호
- **Double Ratchet**: 매 메시지마다 키 갱신

---

## Supported Networks

| Network   | Chain ID | Native Token |
| --------- | -------- | ------------ |
| Ethereum  | 1        | ETH          |
| Polygon   | 137      | MATIC        |
| BSC       | 56       | BNB          |
| Arbitrum  | 42161    | ETH          |
| Optimism  | 10       | ETH          |
| Avalanche | 43114    | AVAX         |
| Fantom    | 250      | FTM          |
| Base      | 8453     | ETH          |

---

## Documentation

자세한 문서는 `/docs` 폴더에서 확인할 수 있습니다:

- [Feature List](docs/FEATURE_LIST.md) - 전체 기능 목록
- [Development Guide](docs/DEVELOPMENT.md) - 개발자 가이드
- [Architecture](docs/ARCHITECTURE.md) - 시스템 아키텍처
- [Security](docs/SECURITY.md) - 보안 아키텍처
- [DeyondCrypt Protocol](docs/DEYOND_CRYPT_PROTOCOL.md) - 메시징 프로토콜
- [P2P Transport](docs/P2P_TRANSPORT_ARCHITECTURE.md) - P2P 전송 계층
- [Privacy Policy](docs/legal/PRIVACY_POLICY.md) - 개인정보처리방침
- [Terms of Service](docs/legal/TERMS_OF_SERVICE.md) - 이용약관

---

## License

GPL-3.0 License - [LICENSE](LICENSE) 파일을 참조하세요.

---

## Support

문의 및 이슈는 GitHub Issue를 통해 제출해 주세요:
https://github.com/Deyond-Management/deyond/issues

---

**Security Note**: 이 프로젝트는 데모용입니다. 실제 자금을 사용하기 전에 적절한 보안 감사를 수행하세요.
