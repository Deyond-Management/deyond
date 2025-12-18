/**
 * Deyond P2P Transport Layer - PeerId Implementation
 *
 * Peer identification and verification
 */

import { PeerId as IPeerId } from './types';
import * as Crypto from 'expo-crypto';

/**
 * PeerId implementation
 */
export class PeerId implements IPeerId {
  public readonly id: string;
  public readonly name?: string;
  public readonly publicKey?: Uint8Array;

  private constructor(id: string, name?: string, publicKey?: Uint8Array) {
    this.id = id;
    this.name = name;
    this.publicKey = publicKey;
  }

  /**
   * Create PeerId from public key
   */
  static async fromPublicKey(publicKey: Uint8Array, name?: string): Promise<PeerId> {
    // Hash the public key to create ID
    const keyHex = Array.from(publicKey)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const hashHex = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, keyHex);

    // Use first 32 chars of hash as ID (16 bytes)
    const id = `12D3KooW${hashHex.slice(0, 32)}`;

    return new PeerId(id, name, publicKey);
  }

  /**
   * Create PeerId from wallet address
   */
  static fromAddress(address: string, chainType: 'evm' | 'cosmos' = 'evm', name?: string): PeerId {
    // Normalize address
    const normalizedAddress = address.toLowerCase();

    // Create ID from address
    const id = `${chainType}:${normalizedAddress}`;

    return new PeerId(id, name);
  }

  /**
   * Create PeerId from string (for deserialization)
   */
  static fromString(idString: string, name?: string): PeerId {
    return new PeerId(idString, name);
  }

  /**
   * Generate random PeerId (for testing)
   */
  static async random(name?: string): Promise<PeerId> {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return PeerId.fromPublicKey(randomBytes, name);
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.id;
  }

  /**
   * Get short ID for display
   */
  toShortString(): string {
    if (this.id.length <= 16) return this.id;
    return `${this.id.slice(0, 8)}...${this.id.slice(-6)}`;
  }

  /**
   * Get display name (name or short ID)
   */
  getDisplayName(): string {
    return this.name || this.toShortString();
  }

  /**
   * Check equality
   */
  equals(other: IPeerId): boolean {
    return this.id === other.id;
  }

  /**
   * Serialize to JSON
   */
  toJSON(): { id: string; name?: string; publicKey?: string } {
    return {
      id: this.id,
      name: this.name,
      publicKey: this.publicKey
        ? Array.from(this.publicKey)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
        : undefined,
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(json: { id: string; name?: string; publicKey?: string }): PeerId {
    const publicKey = json.publicKey
      ? new Uint8Array(json.publicKey.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [])
      : undefined;

    return new PeerId(json.id, json.name, publicKey);
  }

  /**
   * Check if this is a wallet address-based ID
   */
  isWalletBased(): boolean {
    return this.id.startsWith('evm:') || this.id.startsWith('cosmos:');
  }

  /**
   * Extract wallet address if wallet-based
   */
  getWalletAddress(): string | null {
    if (!this.isWalletBased()) return null;
    return this.id.split(':')[1];
  }

  /**
   * Extract chain type if wallet-based
   */
  getChainType(): 'evm' | 'cosmos' | null {
    if (this.id.startsWith('evm:')) return 'evm';
    if (this.id.startsWith('cosmos:')) return 'cosmos';
    return null;
  }
}

/**
 * Peer store for managing known peers
 */
export class PeerStore {
  private peers: Map<string, PeerId> = new Map();

  /**
   * Add or update a peer
   */
  add(peer: PeerId): void {
    this.peers.set(peer.id, peer);
  }

  /**
   * Get peer by ID
   */
  get(id: string): PeerId | undefined {
    return this.peers.get(id);
  }

  /**
   * Check if peer exists
   */
  has(id: string): boolean {
    return this.peers.has(id);
  }

  /**
   * Remove peer
   */
  remove(id: string): boolean {
    return this.peers.delete(id);
  }

  /**
   * Get all peers
   */
  getAll(): PeerId[] {
    return Array.from(this.peers.values());
  }

  /**
   * Get peer count
   */
  get size(): number {
    return this.peers.size;
  }

  /**
   * Clear all peers
   */
  clear(): void {
    this.peers.clear();
  }

  /**
   * Find peers by name (partial match)
   */
  findByName(name: string): PeerId[] {
    const lowerName = name.toLowerCase();
    return this.getAll().filter(peer => peer.name?.toLowerCase().includes(lowerName));
  }

  /**
   * Serialize to JSON
   */
  toJSON(): Array<{ id: string; name?: string; publicKey?: string }> {
    return this.getAll().map(peer => peer.toJSON());
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(json: Array<{ id: string; name?: string; publicKey?: string }>): PeerStore {
    const store = new PeerStore();
    json.forEach(data => {
      store.add(PeerId.fromJSON(data));
    });
    return store;
  }
}

export default PeerId;
