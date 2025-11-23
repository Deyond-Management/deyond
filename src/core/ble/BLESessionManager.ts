/**
 * BLE Session Manager
 * Manages BLE session establishment protocol with ECDH key exchange
 */

import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { Wallet, verifyMessage } from 'ethers';
import { BLESession, SessionHandshake, SessionStatus } from '../../types/ble';
import { CryptoUtils } from '../crypto/CryptoUtils';

export class BLESessionManager {
  private sessions: Map<string, BLESession> = new Map();
  private sessionKeys: Map<string, Uint8Array> = new Map(); // Session ID -> Private Key
  private static readonly SESSION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

  constructor(
    private walletAddress: string,
    private walletPrivateKey: string
  ) {}

  /**
   * Initiate a new BLE session
   */
  async initiateSession(
    deviceId: string,
    deviceAddress: string,
    deviceName: string
  ): Promise<BLESession> {
    const sessionId = this.generateSessionId();
    const now = Date.now();

    // Generate ephemeral key pair for this session
    const ephemeralPrivateKey = secp256k1.utils.randomPrivateKey();
    this.sessionKeys.set(sessionId, ephemeralPrivateKey);

    const session: BLESession = {
      id: sessionId,
      deviceId,
      deviceAddress,
      deviceName,
      status: SessionStatus.INITIATING,
      createdAt: now,
      expiresAt: now + BLESessionManager.SESSION_EXPIRY_MS,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Create signed handshake request
   */
  async createHandshakeRequest(sessionId: string): Promise<SessionHandshake> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Get ephemeral private key for this session
    const ephemeralPrivateKey = this.sessionKeys.get(sessionId);
    if (!ephemeralPrivateKey) {
      throw new Error('Session key not found');
    }

    // Derive public key
    const publicKey = secp256k1.getPublicKey(ephemeralPrivateKey, true);
    const publicKeyHex = this.bytesToHex(publicKey);

    const timestamp = Date.now();

    // Create message to sign
    const message = `${sessionId}:${publicKeyHex}:${this.walletAddress}:${timestamp}`;

    // Sign with wallet private key
    const wallet = new Wallet(this.walletPrivateKey);
    const signature = await wallet.signMessage(message);

    // Update session status
    session.status = SessionStatus.HANDSHAKING;

    return {
      sessionId,
      publicKey: publicKeyHex,
      address: this.walletAddress,
      timestamp,
      signature,
    };
  }

  /**
   * Process handshake response from peer
   */
  async processHandshakeResponse(
    sessionId: string,
    handshake: SessionHandshake
  ): Promise<BLESession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Verify signature
    const message = `${handshake.sessionId}:${handshake.publicKey}:${handshake.address}:${handshake.timestamp}`;
    const isValid = await this.verifyHandshakeSignature(message, handshake.signature, handshake.address);

    if (!isValid) {
      session.status = SessionStatus.ERROR;
      throw new Error('Invalid handshake signature');
    }

    // Derive shared secret using ECDH
    const sharedSecret = await this.deriveSharedSecret(sessionId, handshake.publicKey);

    // Update session
    session.status = SessionStatus.ESTABLISHED;
    session.sharedSecret = sharedSecret;

    return session;
  }

  /**
   * Derive shared secret using ECDH
   */
  async deriveSharedSecret(sessionId: string, peerPublicKeyHex: string): Promise<string> {
    const ephemeralPrivateKey = this.sessionKeys.get(sessionId);
    if (!ephemeralPrivateKey) {
      throw new Error('Session key not found');
    }

    try {
      // Convert peer public key from hex
      const peerPublicKey = this.hexToBytes(peerPublicKeyHex);

      // Perform ECDH
      const sharedPoint = secp256k1.getSharedSecret(ephemeralPrivateKey, peerPublicKey);

      // Hash the shared point to get shared secret
      const sharedSecret = sha256(sharedPoint);

      return this.bytesToHex(sharedSecret);
    } catch (error) {
      throw new Error(`Failed to derive shared secret: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Close a session
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.status = SessionStatus.CLOSED;

    // Clean up session key
    this.sessionKeys.delete(sessionId);
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): BLESession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Check if session is valid and not expired
   */
  isSessionValid(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    const now = Date.now();
    const isExpired = now > session.expiresAt;
    const isEstablished = session.status === SessionStatus.ESTABLISHED;
    const hasSharedSecret = !!session.sharedSecret;

    return !isExpired && isEstablished && hasSharedSecret;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): BLESession[] {
    return Array.from(this.sessions.values()).filter(session =>
      session.status === SessionStatus.ESTABLISHED && !this.isSessionExpired(session)
    );
  }

  /**
   * Verify handshake signature
   */
  private async verifyHandshakeSignature(
    message: string,
    signature: string,
    address: string
  ): Promise<boolean> {
    try {
      const recoveredAddress = verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if session is expired
   */
  private isSessionExpired(session: BLESession): boolean {
    return Date.now() > session.expiresAt;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const randomBytes = CryptoUtils.generateRandomBytes(16);
    return this.bytesToHex(randomBytes);
  }

  /**
   * Convert bytes to hex string
   */
  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert hex string to bytes
   */
  private hexToBytes(hex: string): Uint8Array {
    // Remove 0x prefix if present
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
    }
    return bytes;
  }
}
