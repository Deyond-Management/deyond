/**
 * DeyondCrypt - Group Session Manager
 *
 * High-level API for managing group messaging sessions using Sender Keys.
 * Handles creation, storage, and lifecycle of group sessions.
 */

import {
  ChainType,
  GroupMember,
  SenderKeyState,
  SenderKeyDistributionMessage,
  GroupMessage,
  GroupSessionState,
  GroupSessionInfo,
  IdentityKeyPair,
  DeyondCryptError,
  DeyondCryptErrorCode,
} from '../types';
import { SenderKeyRatchet, SenderKeyDistributionBuilder, GroupMessageBuilder } from './SenderKeys';
import { randomBytes } from '@noble/hashes/utils';

// =============================================================================
// Group Session Store Interface
// =============================================================================

/**
 * Interface for persisting group sessions
 */
export interface IGroupSessionStore {
  saveGroupSession(session: GroupSessionState): Promise<void>;
  loadGroupSession(groupId: string): Promise<GroupSessionState | null>;
  deleteGroupSession(groupId: string): Promise<void>;
  listGroupSessions(): Promise<GroupSessionInfo[]>;
}

// =============================================================================
// In-Memory Group Session Store
// =============================================================================

/**
 * Simple in-memory implementation for testing and development
 */
export class InMemoryGroupSessionStore implements IGroupSessionStore {
  private sessions = new Map<string, GroupSessionState>();

  async saveGroupSession(session: GroupSessionState): Promise<void> {
    // Deep clone to prevent external modifications
    this.sessions.set(session.groupId, this.cloneSession(session));
  }

  async loadGroupSession(groupId: string): Promise<GroupSessionState | null> {
    const session = this.sessions.get(groupId);
    return session ? this.cloneSession(session) : null;
  }

  async deleteGroupSession(groupId: string): Promise<void> {
    this.sessions.delete(groupId);
  }

  async listGroupSessions(): Promise<GroupSessionInfo[]> {
    const infos: GroupSessionInfo[] = [];
    for (const session of this.sessions.values()) {
      infos.push({
        groupId: session.groupId,
        groupName: session.groupName,
        memberCount: session.members.length,
        createdAt: session.createdAt,
        lastActivityAt: session.lastActivityAt,
      });
    }
    return infos;
  }

  private cloneSession(session: GroupSessionState): GroupSessionState {
    return {
      ...session,
      mySenderKey: this.cloneSenderKeyState(session.mySenderKey),
      memberSenderKeys: new Map(
        Array.from(session.memberSenderKeys.entries()).map(([k, v]) => [
          k,
          this.cloneSenderKeyState(v),
        ])
      ),
      members: [...session.members],
    };
  }

  private cloneSenderKeyState(state: SenderKeyState): SenderKeyState {
    return {
      ...state,
      chainKey: new Uint8Array(state.chainKey),
      publicSigningKey: new Uint8Array(state.publicSigningKey),
      privateSigningKey: state.privateSigningKey
        ? new Uint8Array(state.privateSigningKey)
        : undefined,
      messageKeys: new Map(state.messageKeys),
    };
  }
}

// =============================================================================
// Group Session Manager
// =============================================================================

/**
 * Manages group messaging sessions
 */
export class GroupSessionManager {
  private ratchet = new SenderKeyRatchet();
  private distributionBuilder = new SenderKeyDistributionBuilder();
  private messageBuilder = new GroupMessageBuilder();

  // Active sessions in memory
  private sessions = new Map<string, GroupSessionState>();

  constructor(
    private identityKey: IdentityKeyPair,
    private store: IGroupSessionStore
  ) {}

  // ---------------------------------------------------------------------------
  // Group Creation and Joining
  // ---------------------------------------------------------------------------

  /**
   * Create a new group
   */
  async createGroup(
    groupName: string,
    initialMembers: GroupMember[] = []
  ): Promise<{
    session: GroupSessionState;
    distributions: SenderKeyDistributionMessage[];
  }> {
    const groupId = this.generateGroupId();
    const now = Date.now();

    // Create our sender key for this group
    const mySenderKey = await this.ratchet.createSenderKeyState(
      this.identityKey.address,
      this.identityKey.chainType
    );

    // Add ourselves as admin
    const members: GroupMember[] = [
      {
        address: this.identityKey.address,
        chainType: this.identityKey.chainType,
        role: 'admin',
        joinedAt: now,
      },
      ...initialMembers,
    ];

    // Create session state
    const session: GroupSessionState = {
      groupId,
      groupName,
      mySenderKey,
      memberSenderKeys: new Map(),
      members,
      createdAt: now,
      lastActivityAt: now,
    };

    // Store in memory and persist
    this.sessions.set(groupId, session);
    await this.store.saveGroupSession(session);

    // Create distribution messages for each member
    const distributions: SenderKeyDistributionMessage[] = [];
    for (const member of initialMembers) {
      const distribution = await this.distributionBuilder.createDistribution(groupId, mySenderKey);
      distributions.push(distribution);
    }

    return { session, distributions };
  }

  /**
   * Join an existing group by processing a distribution message
   */
  async joinGroup(
    groupId: string,
    groupName: string,
    distribution: SenderKeyDistributionMessage
  ): Promise<{
    session: GroupSessionState;
    myDistribution: SenderKeyDistributionMessage;
  }> {
    // Verify the distribution message
    const isValid = await this.distributionBuilder.verifyDistribution(distribution);
    if (!isValid) {
      throw new DeyondCryptError(
        'Invalid sender key distribution message',
        DeyondCryptErrorCode.INVALID_SIGNATURE
      );
    }

    const now = Date.now();

    // Create our sender key for this group
    const mySenderKey = await this.ratchet.createSenderKeyState(
      this.identityKey.address,
      this.identityKey.chainType
    );

    // Create sender key state from distribution
    const senderState = this.ratchet.createSenderKeyStateFromDistribution(distribution);

    // Create session state
    const session: GroupSessionState = {
      groupId,
      groupName,
      mySenderKey,
      memberSenderKeys: new Map([[distribution.senderAddress, senderState]]),
      members: [
        {
          address: this.identityKey.address,
          chainType: this.identityKey.chainType,
          role: 'member',
          joinedAt: now,
        },
        {
          address: distribution.senderAddress,
          chainType: distribution.senderChainType,
          role: 'member', // Will be updated when we get more info
          joinedAt: distribution.timestamp,
        },
      ],
      createdAt: now,
      lastActivityAt: now,
    };

    // Store in memory and persist
    this.sessions.set(groupId, session);
    await this.store.saveGroupSession(session);

    // Create our distribution message to send back
    const myDistribution = await this.distributionBuilder.createDistribution(groupId, mySenderKey);

    return { session, myDistribution };
  }

  /**
   * Process a sender key distribution from another member
   */
  async processDistribution(distribution: SenderKeyDistributionMessage): Promise<void> {
    // Verify the distribution
    const isValid = await this.distributionBuilder.verifyDistribution(distribution);
    if (!isValid) {
      throw new DeyondCryptError(
        'Invalid sender key distribution message',
        DeyondCryptErrorCode.INVALID_SIGNATURE
      );
    }

    // Get or create session
    let session = this.sessions.get(distribution.groupId);
    if (!session) {
      session = await this.store.loadGroupSession(distribution.groupId);
      if (!session) {
        throw new DeyondCryptError(
          `Group not found: ${distribution.groupId}`,
          DeyondCryptErrorCode.GROUP_NOT_FOUND
        );
      }
      this.sessions.set(distribution.groupId, session);
    }

    // Create sender key state from distribution
    const senderState = this.ratchet.createSenderKeyStateFromDistribution(distribution);

    // Store the sender key
    session.memberSenderKeys.set(distribution.senderAddress, senderState);

    // Add member if not exists
    if (!session.members.find(m => m.address === distribution.senderAddress)) {
      session.members.push({
        address: distribution.senderAddress,
        chainType: distribution.senderChainType,
        role: 'member',
        joinedAt: distribution.timestamp,
      });
    }

    session.lastActivityAt = Date.now();
    await this.store.saveGroupSession(session);
  }

  // ---------------------------------------------------------------------------
  // Messaging
  // ---------------------------------------------------------------------------

  /**
   * Send an encrypted message to the group
   */
  async sendMessage(groupId: string, plaintext: Uint8Array): Promise<GroupMessage> {
    const session = await this.getSession(groupId);

    // Build encrypted message
    const message = await this.messageBuilder.buildMessage(groupId, plaintext, session.mySenderKey);

    // Update session
    session.lastActivityAt = Date.now();
    await this.store.saveGroupSession(session);

    return message;
  }

  /**
   * Decrypt a received group message
   */
  async receiveMessage(message: GroupMessage): Promise<Uint8Array> {
    const session = await this.getSession(message.groupId);

    // Get sender's key state
    const senderState = session.memberSenderKeys.get(message.senderAddress);
    if (!senderState) {
      throw new DeyondCryptError(
        `Sender key not found for ${message.senderAddress}`,
        DeyondCryptErrorCode.SENDER_KEY_NOT_FOUND
      );
    }

    // Verify key ID matches
    if (message.keyId !== senderState.keyId) {
      throw new DeyondCryptError(
        `Sender key ID mismatch. May need new distribution message.`,
        DeyondCryptErrorCode.SENDER_KEY_NOT_FOUND
      );
    }

    // Decrypt the message
    const plaintext = await this.messageBuilder.decryptMessage(message, senderState);

    // Update session
    session.lastActivityAt = Date.now();
    await this.store.saveGroupSession(session);

    return plaintext;
  }

  // ---------------------------------------------------------------------------
  // Session Management
  // ---------------------------------------------------------------------------

  /**
   * Get session by group ID
   */
  async getSession(groupId: string): Promise<GroupSessionState> {
    let session = this.sessions.get(groupId);
    if (!session) {
      session = await this.store.loadGroupSession(groupId);
      if (!session) {
        throw new DeyondCryptError(
          `Group not found: ${groupId}`,
          DeyondCryptErrorCode.GROUP_NOT_FOUND
        );
      }
      this.sessions.set(groupId, session);
    }
    return session;
  }

  /**
   * Check if we have a session for a group
   */
  hasSession(groupId: string): boolean {
    return this.sessions.has(groupId);
  }

  /**
   * Get session info
   */
  async getSessionInfo(groupId: string): Promise<GroupSessionInfo | null> {
    try {
      const session = await this.getSession(groupId);
      return {
        groupId: session.groupId,
        groupName: session.groupName,
        memberCount: session.members.length,
        createdAt: session.createdAt,
        lastActivityAt: session.lastActivityAt,
      };
    } catch {
      return null;
    }
  }

  /**
   * List all group sessions
   */
  async listSessions(): Promise<GroupSessionInfo[]> {
    return this.store.listGroupSessions();
  }

  /**
   * Delete a group session
   */
  async deleteSession(groupId: string): Promise<void> {
    this.sessions.delete(groupId);
    await this.store.deleteGroupSession(groupId);
  }

  /**
   * Rotate our sender key (for forward secrecy)
   */
  async rotateSenderKey(groupId: string): Promise<SenderKeyDistributionMessage> {
    const session = await this.getSession(groupId);

    // Create new sender key
    const newSenderKey = await this.ratchet.createSenderKeyState(
      this.identityKey.address,
      this.identityKey.chainType
    );

    // Update session
    session.mySenderKey = newSenderKey;
    session.lastActivityAt = Date.now();
    await this.store.saveGroupSession(session);

    // Create distribution for the new key
    return this.distributionBuilder.createDistribution(groupId, newSenderKey);
  }

  /**
   * Load all sessions from store
   */
  async loadAllSessions(): Promise<void> {
    const infos = await this.store.listGroupSessions();
    for (const info of infos) {
      const session = await this.store.loadGroupSession(info.groupId);
      if (session) {
        this.sessions.set(info.groupId, session);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Member Management
  // ---------------------------------------------------------------------------

  /**
   * Add a member to the group
   */
  async addMember(groupId: string, member: GroupMember): Promise<SenderKeyDistributionMessage> {
    const session = await this.getSession(groupId);

    // Check if already a member
    if (session.members.find(m => m.address === member.address)) {
      throw new Error(`${member.address} is already a member`);
    }

    // Add member
    session.members.push(member);
    session.lastActivityAt = Date.now();
    await this.store.saveGroupSession(session);

    // Create distribution for the new member
    return this.distributionBuilder.createDistribution(groupId, session.mySenderKey);
  }

  /**
   * Remove a member from the group
   * Note: After removing, you should rotate sender keys for forward secrecy
   */
  async removeMember(groupId: string, memberAddress: string): Promise<void> {
    const session = await this.getSession(groupId);

    // Remove member
    session.members = session.members.filter(m => m.address !== memberAddress);
    session.memberSenderKeys.delete(memberAddress);
    session.lastActivityAt = Date.now();
    await this.store.saveGroupSession(session);
  }

  /**
   * Get group members
   */
  async getMembers(groupId: string): Promise<GroupMember[]> {
    const session = await this.getSession(groupId);
    return [...session.members];
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private generateGroupId(): string {
    const bytes = randomBytes(16);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

// =============================================================================
// Exports
// =============================================================================

export { SenderKeyRatchet, SenderKeyDistributionBuilder, GroupMessageBuilder };
