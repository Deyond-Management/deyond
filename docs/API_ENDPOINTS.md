# API Endpoints Documentation

## Document Information
- **Version**: 1.0.0
- **Last Updated**: 2025-11-18
- **Status**: Planning Phase
- **Project**: Deyond API Specification

---

## Table of Contents
1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Wallet Service](#wallet-service)
4. [Profile Service](#profile-service)
5. [Messaging Service](#messaging-service)
6. [Contact Service](#contact-service)
7. [Voice Calling Service](#voice-calling-service)
8. [Feed Service](#feed-service)
9. [AI Service](#ai-service)
10. [Game Service](#game-service)
11. [Storage Service](#storage-service)
12. [WebSocket Events](#websocket-events)
13. [Error Codes](#error-codes)

---

## 1. API Overview

### 1.1 Base URLs

```
Production:   https://api.deyond.io
Staging:      https://api-staging.deyond.io
Development:  https://api-dev.deyond.io
```

### 1.2 API Types

| Type | Usage | Port |
|------|-------|------|
| REST | Standard CRUD operations | 443 (HTTPS) |
| GraphQL | Complex queries, batch operations | 443 (HTTPS) |
| WebSocket | Real-time updates (messages, prices) | 443 (WSS) |
| gRPC | Mobile-server high-performance | 50051 |

### 1.3 Versioning

- **URL Versioning**: `/v1/`, `/v2/`
- **Current Version**: v1
- **Deprecation Policy**: 6 months notice before removal

### 1.4 Rate Limiting

| Tier | Requests/minute | Requests/hour |
|------|-----------------|---------------|
| Free | 60 | 1000 |
| Authenticated | 300 | 10000 |
| Premium | 1000 | 50000 |

**Headers**:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 250
X-RateLimit-Reset: 1632150000
```

### 1.5 Common Request Headers

```http
Authorization: Bearer {access_token}
Content-Type: application/json
X-Client-Version: 1.0.0
X-Platform: ios | android
X-Device-Id: {unique_device_id}
```

### 1.6 Common Response Format

**Success Response**:
```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2025-11-18T10:30:00Z",
    "requestId": "uuid-v4"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* additional context */ }
  },
  "meta": {
    "timestamp": "2025-11-18T10:30:00Z",
    "requestId": "uuid-v4"
  }
}
```

---

## 2. Authentication

### 2.1 Register Device

**Endpoint**: `POST /v1/auth/register`

**Description**: Register a new device with wallet public key

**Request**:
```json
{
  "publicKey": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "deviceId": "uuid-v4",
  "platform": "ios",
  "timestamp": 1637150000,
  "signature": "signed_timestamp_with_private_key"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "userId": "uuid-v4",
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresIn": 900
  }
}
```

---

### 2.2 Login (Sign Message)

**Endpoint**: `POST /v1/auth/login`

**Description**: Authenticate with wallet signature

**Request**:
```json
{
  "publicKey": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "message": "Sign this message to login: {nonce}",
  "signature": "signed_message",
  "deviceId": "uuid-v4"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "userId": "uuid-v4",
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresIn": 900
  }
}
```

---

### 2.3 Refresh Token

**Endpoint**: `POST /v1/auth/refresh`

**Request**:
```json
{
  "refreshToken": "refresh_token"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token",
    "refreshToken": "new_refresh_token",
    "expiresIn": 900
  }
}
```

---

### 2.4 Logout

**Endpoint**: `POST /v1/auth/logout`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "deviceId": "uuid-v4"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## 3. Wallet Service

### 3.1 Get Balance

**Endpoint**: `GET /v1/wallet/balance`

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**:
- `chain`: ethereum | solana | bsc | bitcoin
- `address`: wallet address (optional, defaults to user's address)

**Response**:
```json
{
  "success": true,
  "data": {
    "chain": "ethereum",
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "nativeBalance": {
      "symbol": "ETH",
      "balance": "1.5",
      "balanceWei": "1500000000000000000",
      "decimals": 18,
      "usdValue": 3000.00
    },
    "tokens": [
      {
        "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "symbol": "USDC",
        "name": "USD Coin",
        "balance": "1000.0",
        "decimals": 6,
        "usdValue": 1000.00,
        "logo": "https://cdn.deyond.io/tokens/usdc.png"
      }
    ],
    "totalUsdValue": 4000.00
  }
}
```

---

### 3.2 Get Transaction History

**Endpoint**: `GET /v1/wallet/transactions`

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**:
- `chain`: ethereum | solana | bsc | bitcoin
- `address`: wallet address
- `limit`: number (default: 20, max: 100)
- `offset`: number (default: 0)
- `type`: all | sent | received | contract

**Response**:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "hash": "0xabc123...",
        "from": "0x742d35Cc...",
        "to": "0x456def...",
        "value": "0.5",
        "symbol": "ETH",
        "type": "sent",
        "status": "confirmed",
        "timestamp": 1637150000,
        "blockNumber": 13500000,
        "gasUsed": "21000",
        "gasPriceGwei": "50",
        "totalFee": "0.00105",
        "confirmations": 12
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

### 3.3 Estimate Gas

**Endpoint**: `POST /v1/wallet/estimate-gas`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "chain": "ethereum",
  "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "to": "0x456def...",
  "value": "0.5",
  "data": "0x" // optional, for contract calls
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "gasLimit": "21000",
    "gasPrices": {
      "slow": {
        "gwei": "30",
        "eth": "0.00063",
        "usd": 1.26,
        "estimatedTime": "5 min"
      },
      "standard": {
        "gwei": "50",
        "eth": "0.00105",
        "usd": 2.10,
        "estimatedTime": "2 min"
      },
      "fast": {
        "gwei": "80",
        "eth": "0.00168",
        "usd": 3.36,
        "estimatedTime": "30 sec"
      }
    }
  }
}
```

---

### 3.4 Broadcast Transaction

**Endpoint**: `POST /v1/wallet/broadcast`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "chain": "ethereum",
  "signedTransaction": "0xf86c808504a817c800825208...",
  "txHash": "0xabc123..." // client-computed hash for verification
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "txHash": "0xabc123...",
    "status": "pending",
    "timestamp": 1637150000
  }
}
```

---

### 3.5 Get Token List

**Endpoint**: `GET /v1/wallet/tokens`

**Query Parameters**:
- `chain`: ethereum | solana | bsc
- `search`: token name or symbol (optional)
- `verified`: true | false (default: true)

**Response**:
```json
{
  "success": true,
  "data": {
    "tokens": [
      {
        "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "symbol": "USDC",
        "name": "USD Coin",
        "decimals": 6,
        "logo": "https://cdn.deyond.io/tokens/usdc.png",
        "verified": true,
        "coingeckoId": "usd-coin"
      }
    ]
  }
}
```

---

## 4. Profile Service

### 4.1 Get Profile

**Endpoint**: `GET /v1/profile/:userId`

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "data": {
    "userId": "uuid-v4",
    "username": "alice_crypto",
    "displayName": "Alice Johnson",
    "bio": "Blockchain developer | NFT collector",
    "avatar": "https://cdn.deyond.io/avatars/uuid.jpg",
    "banner": "https://cdn.deyond.io/banners/uuid.jpg",
    "publicKey": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "walletAddresses": {
      "ethereum": "0x742d35Cc...",
      "solana": "7xKXtg2C...",
      "bitcoin": "bc1q..."
    },
    "socialLinks": {
      "twitter": "https://twitter.com/alice",
      "linkedin": "https://linkedin.com/in/alice",
      "github": "https://github.com/alice"
    },
    "customFields": [
      {
        "key": "Company",
        "value": "Web3 Startup"
      },
      {
        "key": "Title",
        "value": "Lead Developer"
      }
    ],
    "isVerified": true,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-11-18T10:30:00Z"
  }
}
```

---

### 4.2 Update Profile

**Endpoint**: `PUT /v1/profile`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "displayName": "Alice Johnson",
  "bio": "Blockchain developer | NFT collector",
  "socialLinks": {
    "twitter": "https://twitter.com/alice"
  },
  "customFields": [
    {
      "key": "Company",
      "value": "Web3 Startup"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "userId": "uuid-v4",
    "updatedAt": "2025-11-18T10:30:00Z"
  }
}
```

---

### 4.3 Upload Avatar

**Endpoint**: `POST /v1/profile/avatar`

**Headers**:
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Request**: Form data with `image` field (max 5MB, jpeg/png)

**Response**:
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://cdn.deyond.io/avatars/uuid.jpg",
    "thumbnailUrl": "https://cdn.deyond.io/avatars/uuid_thumb.jpg"
  }
}
```

---

### 4.4 Search Users

**Endpoint**: `GET /v1/profile/search`

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**:
- `q`: search query (username, display name)
- `limit`: number (default: 20, max: 50)
- `offset`: number (default: 0)

**Response**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "userId": "uuid-v4",
        "username": "alice_crypto",
        "displayName": "Alice Johnson",
        "avatar": "https://cdn.deyond.io/avatars/uuid.jpg",
        "bio": "Blockchain developer",
        "isVerified": true
      }
    ],
    "pagination": {
      "total": 5,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

---

## 5. Messaging Service

### 5.1 Send Message

**Endpoint**: `POST /v1/messages/send`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "recipientId": "uuid-v4",
  "type": "text",
  "content": {
    "text": "Hello!",
    "encryptedContent": "base64_encrypted_content"
  },
  "replyToId": "message-uuid", // optional
  "clientMessageId": "client-generated-uuid"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "messageId": "uuid-v4",
    "clientMessageId": "client-generated-uuid",
    "timestamp": "2025-11-18T10:30:00Z",
    "status": "sent"
  }
}
```

---

### 5.2 Get Messages

**Endpoint**: `GET /v1/messages/conversation/:userId`

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**:
- `limit`: number (default: 50, max: 100)
- `before`: message ID (pagination)
- `after`: message ID (pagination)

**Response**:
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "messageId": "uuid-v4",
        "senderId": "uuid-v4",
        "recipientId": "uuid-v4",
        "type": "text",
        "content": {
          "encryptedContent": "base64_encrypted_content"
        },
        "status": "read",
        "timestamp": "2025-11-18T10:30:00Z",
        "replyTo": null,
        "edited": false
      }
    ],
    "pagination": {
      "hasMore": true,
      "oldest": "message-uuid",
      "newest": "message-uuid"
    }
  }
}
```

---

### 5.3 Create Group

**Endpoint**: `POST /v1/messages/groups`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "name": "Web3 Developers",
  "description": "Group for web3 devs",
  "avatar": "data:image/jpeg;base64,...",
  "memberIds": ["uuid-1", "uuid-2", "uuid-3"],
  "settings": {
    "allowMemberInvite": true,
    "allowMemberPost": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "groupId": "uuid-v4",
    "name": "Web3 Developers",
    "ownerId": "current-user-uuid",
    "memberCount": 4,
    "createdAt": "2025-11-18T10:30:00Z"
  }
}
```

---

### 5.4 Send Group Message

**Endpoint**: `POST /v1/messages/groups/:groupId/send`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "type": "text",
  "content": {
    "text": "Hello everyone!",
    "encryptedContent": "base64_encrypted_content"
  },
  "clientMessageId": "client-generated-uuid"
}
```

**Response**: Same as Send Message

---

### 5.5 Update Message Status

**Endpoint**: `PUT /v1/messages/:messageId/status`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "status": "delivered" | "read"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "messageId": "uuid-v4",
    "status": "read",
    "timestamp": "2025-11-18T10:31:00Z"
  }
}
```

---

## 6. Contact Service

### 6.1 Get Contacts

**Endpoint**: `GET /v1/contacts`

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "contactId": "uuid-v4",
        "userId": "uuid-v4",
        "displayName": "Bob Smith",
        "username": "bob_web3",
        "avatar": "https://cdn.deyond.io/avatars/uuid.jpg",
        "note": "Met at ETH Denver 2025",
        "addedAt": "2025-02-15T10:00:00Z",
        "lastInteraction": "2025-11-17T15:00:00Z"
      }
    ]
  }
}
```

---

### 6.2 Send Contact Request

**Endpoint**: `POST /v1/contacts/request`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "userId": "uuid-v4",
  "message": "Hi! I'd like to connect."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "requestId": "uuid-v4",
    "status": "pending",
    "sentAt": "2025-11-18T10:30:00Z"
  }
}
```

---

### 6.3 Accept Contact Request

**Endpoint**: `POST /v1/contacts/request/:requestId/accept`

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "data": {
    "contactId": "uuid-v4",
    "userId": "uuid-v4",
    "acceptedAt": "2025-11-18T10:30:00Z"
  }
}
```

---

### 6.4 Block User

**Endpoint**: `POST /v1/contacts/block`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "userId": "uuid-v4",
  "reason": "spam" // optional
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "blockedAt": "2025-11-18T10:30:00Z"
  }
}
```

---

## 7. Voice Calling Service

### 7.1 Activate Phone Number

**Endpoint**: `POST /v1/calling/activate`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "countryCode": "+82",
  "preferredNumber": "010-1234-5678" // optional, for premium
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "phoneNumber": "a+82-010-1234-5678",
    "isPremium": false,
    "activatedAt": "2025-11-18T10:30:00Z"
  }
}
```

---

### 7.2 Initiate Call

**Endpoint**: `POST /v1/calling/initiate`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "calleeNumber": "a+1-555-1234",
  "callType": "voice" // voice | video (future)
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "callId": "uuid-v4",
    "signalingToken": "jwt_for_webrtc_signaling",
    "stunServers": [
      { "urls": "stun:stun.deyond.io:3478" }
    ],
    "turnServers": [
      {
        "urls": "turn:turn.deyond.io:3478",
        "username": "user",
        "credential": "pass"
      }
    ]
  }
}
```

---

### 7.3 End Call

**Endpoint**: `POST /v1/calling/:callId/end`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "duration": 180, // seconds
  "reason": "user_hangup"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "callId": "uuid-v4",
    "duration": 180,
    "endedAt": "2025-11-18T10:33:00Z"
  }
}
```

---

### 7.4 Get Call History

**Endpoint**: `GET /v1/calling/history`

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**:
- `limit`: number (default: 50)
- `offset`: number (default: 0)

**Response**:
```json
{
  "success": true,
  "data": {
    "calls": [
      {
        "callId": "uuid-v4",
        "type": "outgoing",
        "calleeNumber": "a+1-555-1234",
        "calleeName": "Bob Smith",
        "duration": 180,
        "status": "completed",
        "timestamp": "2025-11-18T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

---

## 8. Feed Service

### 8.1 Create Feed Flag

**Endpoint**: `POST /v1/feed/flags`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "type": "text",
  "content": {
    "text": "Great coffee shop!",
    "media": [] // optional: image/video URLs
  },
  "location": {
    "latitude": 37.5665,
    "longitude": 126.9780,
    "name": "Seoul, South Korea",
    "fuzzing": true // hide exact coordinates
  },
  "visibility": {
    "tier": "free", // free | paid_500 | paid_1k | paid_5k | premium
    "anonymous": false
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "flagId": "uuid-v4",
    "viewCount": 0,
    "maxViews": 100,
    "expiresAt": "2025-11-25T10:30:00Z",
    "createdAt": "2025-11-18T10:30:00Z"
  }
}
```

---

### 8.2 Get Nearby Flags

**Endpoint**: `GET /v1/feed/flags/nearby`

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**:
- `latitude`: number
- `longitude`: number
- `radius`: number (km, default: 5, max: 50)
- `limit`: number (default: 20, max: 50)

**Response**:
```json
{
  "success": true,
  "data": {
    "flags": [
      {
        "flagId": "uuid-v4",
        "userId": "uuid-v4",
        "author": {
          "username": "alice_crypto",
          "displayName": "Alice Johnson",
          "avatar": "https://cdn.deyond.io/avatars/uuid.jpg"
        },
        "type": "text",
        "content": {
          "text": "Great coffee shop!",
          "media": []
        },
        "location": {
          "latitude": 37.5665,
          "longitude": 126.9780,
          "name": "Seoul, South Korea",
          "distance": 1.2 // km from query location
        },
        "stats": {
          "viewCount": 45,
          "maxViews": 100,
          "likeCount": 12,
          "commentCount": 3
        },
        "createdAt": "2025-11-18T10:30:00Z",
        "expiresAt": "2025-11-25T10:30:00Z"
      }
    ]
  }
}
```

---

### 8.3 Like Flag

**Endpoint**: `POST /v1/feed/flags/:flagId/like`

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "data": {
    "flagId": "uuid-v4",
    "likeCount": 13,
    "liked": true
  }
}
```

---

### 8.4 Comment on Flag

**Endpoint**: `POST /v1/feed/flags/:flagId/comments`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "text": "I agree, best coffee in the area!"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "commentId": "uuid-v4",
    "flagId": "uuid-v4",
    "text": "I agree, best coffee in the area!",
    "author": {
      "userId": "uuid-v4",
      "username": "bob_web3",
      "avatar": "https://cdn.deyond.io/avatars/uuid.jpg"
    },
    "createdAt": "2025-11-18T10:31:00Z"
  }
}
```

---

## 9. AI Service

### 9.1 Query AI Assistant

**Endpoint**: `POST /v1/ai/query`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "query": "What are my top 3 tokens by value?",
  "context": {
    "includeWallet": true,
    "includeTransactions": false
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "queryId": "uuid-v4",
    "response": "Based on your wallet, your top 3 tokens by value are:\n1. ETH: $3,000\n2. USDC: $1,000\n3. LINK: $500",
    "timestamp": "2025-11-18T10:30:00Z",
    "tokensUsed": 150
  }
}
```

---

### 9.2 Get Creature Status

**Endpoint**: `GET /v1/ai/creature`

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "data": {
    "creatureId": "uuid-v4",
    "type": "finance",
    "level": 15,
    "xp": 2500,
    "xpToNextLevel": 3000,
    "stats": {
      "intelligence": 75,
      "social": 40,
      "security": 60,
      "gaming": 30
    },
    "abilities": [
      {
        "id": "portfolio_analysis",
        "name": "Portfolio Analysis",
        "level": 3,
        "unlocked": true
      }
    ],
    "personality": {
      "traits": ["analytical", "cautious", "helpful"],
      "mood": "happy"
    },
    "appearance": {
      "species": "dragon",
      "color": "blue",
      "accessories": ["glasses", "scarf"]
    }
  }
}
```

---

### 9.3 Train Creature

**Endpoint**: `POST /v1/ai/creature/train`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "activity": "answer_question",
  "data": {
    "question": "What is DeFi?",
    "answer": "DeFi stands for Decentralized Finance...",
    "correct": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "xpGained": 50,
    "newXp": 2550,
    "levelUp": false,
    "statsImproved": {
      "intelligence": 1
    }
  }
}
```

---

### 9.4 Browse Agent Marketplace

**Endpoint**: `GET /v1/ai/marketplace`

**Query Parameters**:
- `category`: trading | portfolio | social | content | gaming
- `sort`: popular | newest | rating | price
- `pricing`: free | paid | subscription
- `limit`: number (default: 20, max: 50)
- `offset`: number (default: 0)

**Response**:
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "agentId": "uuid-v4",
        "name": "DeFi Portfolio Manager",
        "description": "Automated portfolio rebalancing for DeFi protocols",
        "category": "portfolio",
        "creator": {
          "userId": "uuid-v4",
          "username": "ai_master",
          "avatar": "https://cdn.deyond.io/avatars/uuid.jpg"
        },
        "pricing": {
          "type": "subscription",
          "price": 9.99,
          "currency": "USD",
          "period": "month"
        },
        "stats": {
          "installs": 1250,
          "rating": 4.8,
          "reviews": 89
        },
        "icon": "https://cdn.deyond.io/agents/uuid.png",
        "createdAt": "2025-10-01T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 250,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

### 9.5 Install Agent

**Endpoint**: `POST /v1/ai/marketplace/:agentId/install`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "permissions": {
    "readBalance": true,
    "executeTransactions": false,
    "accessMessages": false
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "installationId": "uuid-v4",
    "agentId": "uuid-v4",
    "status": "active",
    "installedAt": "2025-11-18T10:30:00Z"
  }
}
```

---

## 10. Game Service

### 10.1 Browse Game Marketplace

**Endpoint**: `GET /v1/games/marketplace`

**Query Parameters**:
- `category`: puzzle | strategy | casual | rpg | multiplayer
- `sort`: popular | newest | rating | downloads
- `limit`: number (default: 20, max: 50)
- `offset`: number (default: 0)

**Response**:
```json
{
  "success": true,
  "data": {
    "games": [
      {
        "gameId": "uuid-v4",
        "name": "Crypto Clash",
        "description": "Strategic card game with NFT cards",
        "category": "strategy",
        "developer": {
          "userId": "uuid-v4",
          "username": "game_studio",
          "displayName": "Awesome Games Studio"
        },
        "pricing": {
          "type": "free",
          "iap": true
        },
        "stats": {
          "downloads": 50000,
          "rating": 4.5,
          "reviews": 1250
        },
        "media": {
          "icon": "https://cdn.deyond.io/games/uuid-icon.png",
          "screenshots": [
            "https://cdn.deyond.io/games/uuid-1.jpg",
            "https://cdn.deyond.io/games/uuid-2.jpg"
          ],
          "video": "https://cdn.deyond.io/games/uuid-trailer.mp4"
        },
        "fileSize": 45000000, // bytes
        "version": "1.2.0",
        "lastUpdated": "2025-11-01T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 120,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

### 10.2 Install Game

**Endpoint**: `POST /v1/games/:gameId/install`

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "data": {
    "gameId": "uuid-v4",
    "downloadUrl": "https://cdn.deyond.io/games/uuid/package.zip",
    "version": "1.2.0",
    "fileSize": 45000000,
    "checksum": "sha256_hash",
    "expiresAt": "2025-11-18T11:30:00Z" // URL expires in 1 hour
  }
}
```

---

### 10.3 Get Installed Games

**Endpoint**: `GET /v1/games/installed`

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "data": {
    "games": [
      {
        "gameId": "uuid-v4",
        "name": "Crypto Clash",
        "version": "1.2.0",
        "installedAt": "2025-11-15T10:00:00Z",
        "lastPlayed": "2025-11-18T09:00:00Z",
        "playtime": 7200, // seconds
        "updateAvailable": false
      }
    ]
  }
}
```

---

### 10.4 Submit Game Score

**Endpoint**: `POST /v1/games/:gameId/scores`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "score": 1500,
  "level": 10,
  "metadata": {
    "achievements": ["first_win", "combo_master"],
    "duration": 300
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "scoreId": "uuid-v4",
    "rank": 125,
    "totalPlayers": 50000,
    "percentile": 99.75,
    "rewards": {
      "tokens": 10,
      "xp": 50
    }
  }
}
```

---

## 11. Storage Service

### 11.1 Create Backup

**Endpoint**: `POST /v1/storage/backup`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "type": "full", // full | incremental
  "includes": {
    "wallet": true,
    "messages": true,
    "contacts": true,
    "settings": true,
    "games": false
  },
  "encryption": {
    "algorithm": "AES-256-GCM",
    "encryptedKey": "base64_encrypted_symmetric_key"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "backupId": "uuid-v4",
    "uploadUrl": "https://storage.googleapis.com/...",
    "expiresAt": "2025-11-18T11:30:00Z",
    "estimatedSize": 5000000 // bytes
  }
}
```

---

### 11.2 List Backups

**Endpoint**: `GET /v1/storage/backups`

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "data": {
    "backups": [
      {
        "backupId": "uuid-v4",
        "type": "full",
        "size": 5000000,
        "createdAt": "2025-11-18T10:00:00Z",
        "status": "completed"
      }
    ]
  }
}
```

---

### 11.3 Restore Backup

**Endpoint**: `POST /v1/storage/backup/:backupId/restore`

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "decryptionKey": "base64_user_decryption_key"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "restoreId": "uuid-v4",
    "downloadUrl": "https://storage.googleapis.com/...",
    "expiresAt": "2025-11-18T11:30:00Z",
    "size": 5000000
  }
}
```

---

## 12. WebSocket Events

### 12.1 Connection

**URL**: `wss://api.deyond.io/v1/ws`

**Connection**:
```javascript
const ws = new WebSocket('wss://api.deyond.io/v1/ws');
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'jwt_access_token'
  }));
};
```

### 12.2 Event: New Message

**Server → Client**:
```json
{
  "type": "message.new",
  "data": {
    "messageId": "uuid-v4",
    "senderId": "uuid-v4",
    "recipientId": "uuid-v4",
    "type": "text",
    "content": {
      "encryptedContent": "base64_encrypted_content"
    },
    "timestamp": "2025-11-18T10:30:00Z"
  }
}
```

### 12.3 Event: Message Status Update

**Server → Client**:
```json
{
  "type": "message.status",
  "data": {
    "messageId": "uuid-v4",
    "status": "read",
    "timestamp": "2025-11-18T10:31:00Z"
  }
}
```

### 12.4 Event: Incoming Call

**Server → Client**:
```json
{
  "type": "call.incoming",
  "data": {
    "callId": "uuid-v4",
    "callerId": "uuid-v4",
    "callerName": "Alice Johnson",
    "callerNumber": "a+82-010-1234-5678",
    "callType": "voice",
    "signalingToken": "jwt_token"
  }
}
```

### 12.5 Event: Transaction Confirmed

**Server → Client**:
```json
{
  "type": "transaction.confirmed",
  "data": {
    "txHash": "0xabc123...",
    "chain": "ethereum",
    "confirmations": 12,
    "status": "confirmed"
  }
}
```

### 12.6 Event: Contact Request

**Server → Client**:
```json
{
  "type": "contact.request",
  "data": {
    "requestId": "uuid-v4",
    "fromUserId": "uuid-v4",
    "fromUsername": "bob_web3",
    "message": "Hi! I'd like to connect.",
    "timestamp": "2025-11-18T10:30:00Z"
  }
}
```

### 12.7 Event: Price Update

**Server → Client**:
```json
{
  "type": "price.update",
  "data": {
    "symbol": "ETH",
    "price": 2000.50,
    "change24h": 2.5,
    "timestamp": "2025-11-18T10:30:00Z"
  }
}
```

---

## 13. Error Codes

### 13.1 Authentication Errors (1000-1099)

| Code | HTTP Status | Message | Description |
|------|-------------|---------|-------------|
| 1001 | 401 | INVALID_TOKEN | Access token is invalid or expired |
| 1002 | 401 | INVALID_SIGNATURE | Wallet signature verification failed |
| 1003 | 403 | INSUFFICIENT_PERMISSIONS | User lacks required permissions |
| 1004 | 401 | TOKEN_EXPIRED | Access token has expired, refresh needed |
| 1005 | 403 | DEVICE_NOT_REGISTERED | Device not registered for this account |

---

### 13.2 Wallet Errors (2000-2099)

| Code | HTTP Status | Message | Description |
|------|-------------|---------|-------------|
| 2001 | 400 | INVALID_ADDRESS | Wallet address format invalid |
| 2002 | 400 | INSUFFICIENT_BALANCE | Insufficient balance for transaction |
| 2003 | 400 | INVALID_AMOUNT | Transaction amount invalid |
| 2004 | 500 | BLOCKCHAIN_ERROR | Blockchain RPC error |
| 2005 | 400 | GAS_ESTIMATION_FAILED | Unable to estimate gas |
| 2006 | 400 | TRANSACTION_FAILED | Transaction simulation failed |
| 2007 | 404 | CHAIN_NOT_SUPPORTED | Blockchain not supported |

---

### 13.3 Profile Errors (3000-3099)

| Code | HTTP Status | Message | Description |
|------|-------------|---------|-------------|
| 3001 | 404 | USER_NOT_FOUND | User ID not found |
| 3002 | 400 | USERNAME_TAKEN | Username already in use |
| 3003 | 400 | INVALID_USERNAME | Username format invalid |
| 3004 | 413 | FILE_TOO_LARGE | Avatar/banner file exceeds size limit |
| 3005 | 400 | INVALID_FILE_TYPE | File type not supported |

---

### 13.4 Messaging Errors (4000-4099)

| Code | HTTP Status | Message | Description |
|------|-------------|---------|-------------|
| 4001 | 404 | MESSAGE_NOT_FOUND | Message ID not found |
| 4002 | 403 | NOT_MESSAGE_PARTICIPANT | User not part of conversation |
| 4003 | 400 | MESSAGE_TOO_LARGE | Message exceeds size limit |
| 4004 | 404 | GROUP_NOT_FOUND | Group ID not found |
| 4005 | 403 | NOT_GROUP_MEMBER | User not member of group |
| 4006 | 403 | INSUFFICIENT_GROUP_PERMISSIONS | User lacks group permissions |

---

### 13.5 Voice Calling Errors (5000-5099)

| Code | HTTP Status | Message | Description |
|------|-------------|---------|-------------|
| 5001 | 400 | NUMBER_NOT_ACTIVATED | Phone number not activated |
| 5002 | 409 | NUMBER_ALREADY_TAKEN | Phone number already in use |
| 5003 | 404 | CALL_NOT_FOUND | Call ID not found |
| 5004 | 400 | USER_BUSY | Callee is on another call |
| 5005 | 503 | SIGNALING_SERVER_ERROR | WebRTC signaling error |

---

### 13.6 Feed Errors (6000-6099)

| Code | HTTP Status | Message | Description |
|------|-------------|---------|-------------|
| 6001 | 404 | FLAG_NOT_FOUND | Feed flag ID not found |
| 6002 | 410 | FLAG_EXPIRED | Feed flag has expired |
| 6003 | 400 | INVALID_LOCATION | Location coordinates invalid |
| 6004 | 402 | PAYMENT_REQUIRED | Paid tier requires payment |
| 6005 | 403 | ALREADY_LIKED | User already liked this flag |

---

### 13.7 AI Errors (7000-7099)

| Code | HTTP Status | Message | Description |
|------|-------------|---------|-------------|
| 7001 | 500 | LLM_API_ERROR | LLM service error |
| 7002 | 429 | QUERY_RATE_LIMIT | Too many AI queries |
| 7003 | 404 | CREATURE_NOT_FOUND | Creature not found for user |
| 7004 | 404 | AGENT_NOT_FOUND | AI agent not found |
| 7005 | 402 | PAYMENT_REQUIRED_FOR_AGENT | Agent requires payment |

---

### 13.8 Game Errors (8000-8099)

| Code | HTTP Status | Message | Description |
|------|-------------|---------|-------------|
| 8001 | 404 | GAME_NOT_FOUND | Game ID not found |
| 8002 | 409 | GAME_ALREADY_INSTALLED | Game already installed |
| 8003 | 507 | INSUFFICIENT_STORAGE | Not enough device storage |
| 8004 | 400 | INVALID_SCORE | Score validation failed |

---

### 13.9 General Errors (9000-9099)

| Code | HTTP Status | Message | Description |
|------|-------------|---------|-------------|
| 9001 | 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 9002 | 503 | SERVICE_UNAVAILABLE | Service temporarily unavailable |
| 9003 | 400 | VALIDATION_ERROR | Request validation failed |
| 9004 | 500 | INTERNAL_SERVER_ERROR | Unexpected server error |
| 9005 | 400 | INVALID_REQUEST | Malformed request |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-11-18 | Engineering Team | Initial API documentation |

---

## Related Documents
- [Feature List](./FEATURE_LIST.md)
- [PRD](./PRD.md)
- [Architecture Design](./ARCHITECTURE.md)
- [Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [Security Considerations](./SECURITY.md)
