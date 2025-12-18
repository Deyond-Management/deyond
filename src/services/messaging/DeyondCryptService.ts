/**
 * DeyondCrypt Service
 * High-level service for end-to-end encrypted messaging
 */

import {
  initializeDeyondCrypt,
  CryptoPrimitiveRegistry,
  X3DH,
  SessionManager,
  GroupSessionManager,
  MessageEnvelopeBuilder,
  MessageEnvelopeParser,
  encodePlainMessage,
  decodePlainMessage,
  createTextMessage,
  createImageMessage,
  createFileMessage,
  IdentityKeyPair,
  PreKeyBundle,
  DeyondCryptEnvelope,
  GroupMessage,
  SenderKeyDistributionMessage,
  PlainMessage,
  ChainType,
  DeyondCryptError,
  DeyondCryptErrorCode,
} from '../../crypto/deyondcrypt';
import { SecureStorageService } from '../wallet/SecureStorageService';
import {
  DeyondCryptPreKeyStore,
  DeyondCryptSessionStore,
  DeyondCryptGroupSessionStore,
} from './DeyondCryptKeyStore';
import { logger } from '../../utils';

// =============================================================================
// Types
// =============================================================================

export interface Contact {
  address: string;
  chainType: ChainType;
  name: string;
  preKeyBundle?: PreKeyBundle;
  lastSeen?: number;
  addedAt: number;
  /** Whether contact has been verified (e.g., via QR code) */
  verified?: boolean;
  /** Whether an active encryption session exists */
  hasSession?: boolean;
}

export interface DecryptedMessage {
  content: string;
  contentType: 'text' | 'image' | 'file' | 'transaction';
  metadata?: Record<string, unknown>;
  senderAddress: string;
  senderChainType: ChainType;
  timestamp: number;
  messageId: string;
}

export interface EncryptedMessageResult {
  envelope: DeyondCryptEnvelope;
  messageId: string;
}

export interface GroupInfo {
  groupId: string;
  groupName: string;
  memberCount: number;
  createdAt: number;
}

// =============================================================================
// DeyondCrypt Service
// =============================================================================

export class DeyondCryptService {
  private log = logger.child({ service: 'DeyondCryptService' });

  // Stores
  private secureStorage: SecureStorageService;
  private preKeyStore: DeyondCryptPreKeyStore;
  private sessionStore: DeyondCryptSessionStore;
  private groupSessionStore: DeyondCryptGroupSessionStore;

  // Protocol components
  private x3dh: X3DH | null = null;
  private sessionManager: SessionManager | null = null;
  private groupSessionManager: GroupSessionManager | null = null;

  // State
  private initialized = false;
  private identityKey: IdentityKeyPair | null = null;

  // Contacts cache
  private contacts: Map<string, Contact> = new Map();

  constructor() {
    this.secureStorage = new SecureStorageService();
    this.preKeyStore = new DeyondCryptPreKeyStore(this.secureStorage);
    this.sessionStore = new DeyondCryptSessionStore(this.secureStorage);
    this.groupSessionStore = new DeyondCryptGroupSessionStore(this.secureStorage);
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  /**
   * Initialize the DeyondCrypt service
   * Must be called before using any other methods
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.log.debug('Already initialized');
      return;
    }

    try {
      this.log.info('Initializing DeyondCrypt service...');

      // Initialize crypto primitives
      initializeDeyondCrypt();

      // Initialize stores
      await this.preKeyStore.initialize();
      await this.sessionStore.initialize();
      await this.groupSessionStore.initialize();

      // Load identity key if exists
      this.identityKey = await this.preKeyStore.getIdentityKeyPair();

      if (this.identityKey) {
        await this.initializeProtocolComponents();
      }

      // Load contacts
      await this.loadContacts();

      this.initialized = true;
      this.log.info('DeyondCrypt service initialized', {
        hasIdentityKey: !!this.identityKey,
        contactCount: this.contacts.size,
      });
    } catch (error) {
      this.log.error('Failed to initialize DeyondCrypt service', error as Error);
      throw error;
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if user has set up messaging keys
   */
  hasIdentityKey(): boolean {
    return this.identityKey !== null;
  }

  // ---------------------------------------------------------------------------
  // Identity Management
  // ---------------------------------------------------------------------------

  /**
   * Generate new identity and pre-keys for messaging
   * Call this when user first sets up encrypted messaging
   */
  async setupMessaging(
    walletPrivateKey: Uint8Array,
    chainType: ChainType = 'evm'
  ): Promise<PreKeyBundle> {
    this.ensureInitialized();

    try {
      this.log.info('Setting up messaging keys...');

      const crypto = CryptoPrimitiveRegistry.get(chainType);
      const x3dh = new X3DH(crypto);

      // Generate identity key from wallet
      const identityKey = await x3dh.generateIdentityKeyPair(
        walletPrivateKey,
        1, // chainId
        chainType
      );

      // Store identity key
      await this.preKeyStore.storeIdentityKeyPair(identityKey);
      this.identityKey = identityKey;

      // Generate signed pre-key
      const signedPreKey = await x3dh.generateSignedPreKey(identityKey, 1);
      await this.preKeyStore.storeSignedPreKey(signedPreKey);

      // Generate one-time pre-keys
      const oneTimePreKeys = await x3dh.generateOneTimePreKeys(0, 100);
      await this.preKeyStore.storeOneTimePreKeys(oneTimePreKeys);

      // Initialize protocol components
      await this.initializeProtocolComponents();

      // Create and return pre-key bundle (to share with others)
      const preKeyBundle = x3dh.createPreKeyBundle(identityKey, signedPreKey, oneTimePreKeys[0]);

      this.log.info('Messaging keys set up successfully', {
        address: identityKey.address,
      });

      return preKeyBundle;
    } catch (error) {
      this.log.error('Failed to setup messaging', error as Error);
      throw error;
    }
  }

  /**
   * Get our pre-key bundle to share with contacts
   */
  async getMyPreKeyBundle(): Promise<PreKeyBundle | null> {
    this.ensureInitialized();

    if (!this.identityKey || !this.x3dh) {
      return null;
    }

    const signedPreKey = await this.preKeyStore.getCurrentSignedPreKey();
    if (!signedPreKey) {
      return null;
    }

    // Get a one-time pre-key if available
    const oneTimePreKeyCount = await this.preKeyStore.getOneTimePreKeyCount();
    let oneTimePreKey = undefined;
    if (oneTimePreKeyCount > 0) {
      // Note: In production, you'd want a proper way to get the next available key
      oneTimePreKey = await this.preKeyStore.getOneTimePreKey(0);
    }

    return this.x3dh.createPreKeyBundle(this.identityKey, signedPreKey, oneTimePreKey || undefined);
  }

  /**
   * Get current identity address
   */
  getMyAddress(): string | null {
    return this.identityKey?.address || null;
  }

  /**
   * Get current chain type
   */
  getMyChainType(): ChainType | null {
    return this.identityKey?.chainType || null;
  }

  // ---------------------------------------------------------------------------
  // 1:1 Messaging
  // ---------------------------------------------------------------------------

  /**
   * Send an encrypted message to a contact
   */
  async sendMessage(
    recipientAddress: string,
    recipientChainType: ChainType,
    content: string,
    contentType: 'text' | 'image' | 'file' = 'text'
  ): Promise<EncryptedMessageResult> {
    this.ensureInitialized();
    this.ensureHasIdentityKey();

    try {
      // Get or create session
      let session = this.sessionManager!.getSessionByAddress(recipientAddress, recipientChainType);

      if (!session) {
        // Need pre-key bundle to create session
        const contact = this.contacts.get(recipientAddress.toLowerCase());
        if (!contact?.preKeyBundle) {
          throw new DeyondCryptError(
            'No pre-key bundle available for recipient. Request their public keys first.',
            DeyondCryptErrorCode.INVALID_PREKEY_BUNDLE
          );
        }

        const { session: newSession } = await this.sessionManager!.createSession(
          contact.preKeyBundle
        );
        session = newSession;
      }

      // Create message
      let plainMessage: PlainMessage;
      switch (contentType) {
        case 'image':
          plainMessage = createImageMessage(content, 'image/jpeg');
          break;
        case 'file':
          plainMessage = createFileMessage(content, 'file', 'application/octet-stream');
          break;
        default:
          plainMessage = createTextMessage(content);
      }

      // Encrypt message
      const plaintext = encodePlainMessage(plainMessage);
      const { ciphertext, header } = await this.sessionManager!.encryptMessage(
        session.id,
        plaintext
      );

      // Build envelope
      const envelope = await new MessageEnvelopeBuilder()
        .setSender(
          this.identityKey!.address,
          this.identityKey!.chainType,
          this.identityKey!.publicKey
        )
        .setRecipient(recipientAddress, recipientChainType)
        .setEncryptedData(header, ciphertext)
        .setPrivateKey(this.identityKey!.privateKey)
        .build();

      this.log.info('Message sent', {
        recipientAddress,
        messageId: envelope.messageId,
      });

      return {
        envelope,
        messageId: envelope.messageId,
      };
    } catch (error) {
      this.log.error('Failed to send message', error as Error);
      throw error;
    }
  }

  /**
   * Receive and decrypt a message
   */
  async receiveMessage(envelope: DeyondCryptEnvelope): Promise<DecryptedMessage> {
    this.ensureInitialized();
    this.ensureHasIdentityKey();

    try {
      // Validate envelope
      MessageEnvelopeParser.validate(envelope);

      // Verify signature
      const isValid = await MessageEnvelopeParser.verifySignature(envelope);
      if (!isValid) {
        throw new DeyondCryptError(
          'Invalid message signature',
          DeyondCryptErrorCode.INVALID_SIGNATURE
        );
      }

      // Get or create session
      let session = this.sessionManager!.getSessionByAddress(
        envelope.sender.address,
        envelope.sender.chainType
      );

      if (!session) {
        // This is a new session - we need to handle the initial message
        // In a real implementation, we'd parse the X3DH initial message
        throw new DeyondCryptError(
          'Session not found. Need to establish session first.',
          DeyondCryptErrorCode.SESSION_NOT_FOUND
        );
      }

      // Extract header and ciphertext
      const header = MessageEnvelopeParser.extractHeader(envelope);
      const ciphertext = MessageEnvelopeParser.extractCiphertext(envelope);

      // Decrypt message
      const plaintext = await this.sessionManager!.decryptMessage(session.id, ciphertext, header);

      // Decode message content
      const plainMessage = decodePlainMessage(plaintext);

      this.log.info('Message received', {
        senderAddress: envelope.sender.address,
        messageId: envelope.messageId,
      });

      return {
        content: plainMessage.content,
        contentType: plainMessage.contentType,
        metadata: plainMessage.metadata,
        senderAddress: envelope.sender.address,
        senderChainType: envelope.sender.chainType,
        timestamp: envelope.timestamp,
        messageId: envelope.messageId,
      };
    } catch (error) {
      this.log.error('Failed to receive message', error as Error);
      throw error;
    }
  }

  /**
   * Establish a session with a contact using their pre-key bundle
   */
  async establishSession(preKeyBundle: PreKeyBundle): Promise<{ sessionId: string }> {
    this.ensureInitialized();
    this.ensureHasIdentityKey();

    const { session } = await this.sessionManager!.createSession(preKeyBundle);

    // Update contact with pre-key bundle
    await this.addOrUpdateContact({
      address: preKeyBundle.address,
      chainType: preKeyBundle.chainType,
      name: preKeyBundle.address.slice(0, 8) + '...',
      preKeyBundle,
      addedAt: Date.now(),
    });

    return { sessionId: session.id };
  }

  // ---------------------------------------------------------------------------
  // Group Messaging
  // ---------------------------------------------------------------------------

  /**
   * Create a new encrypted group chat
   */
  async createGroup(
    groupName: string,
    memberAddresses: string[] = []
  ): Promise<{
    groupId: string;
    distributions: SenderKeyDistributionMessage[];
  }> {
    this.ensureInitialized();
    this.ensureHasIdentityKey();

    const members = memberAddresses.map(addr => ({
      address: addr,
      chainType: 'evm' as ChainType,
      role: 'member' as const,
      joinedAt: Date.now(),
    }));

    const { session, distributions } = await this.groupSessionManager!.createGroup(
      groupName,
      members
    );

    this.log.info('Group created', {
      groupId: session.groupId,
      groupName,
      memberCount: members.length + 1,
    });

    return {
      groupId: session.groupId,
      distributions,
    };
  }

  /**
   * Join a group using a distribution message
   */
  async joinGroup(
    groupId: string,
    groupName: string,
    distribution: SenderKeyDistributionMessage
  ): Promise<SenderKeyDistributionMessage> {
    this.ensureInitialized();
    this.ensureHasIdentityKey();

    const { myDistribution } = await this.groupSessionManager!.joinGroup(
      groupId,
      groupName,
      distribution
    );

    this.log.info('Joined group', { groupId, groupName });

    return myDistribution;
  }

  /**
   * Send a message to a group
   */
  async sendGroupMessage(groupId: string, content: string): Promise<GroupMessage> {
    this.ensureInitialized();
    this.ensureHasIdentityKey();

    const plaintext = new TextEncoder().encode(content);
    const message = await this.groupSessionManager!.sendMessage(groupId, plaintext);

    this.log.info('Group message sent', {
      groupId,
      messageId: message.messageId,
    });

    return message;
  }

  /**
   * Receive and decrypt a group message
   */
  async receiveGroupMessage(message: GroupMessage): Promise<{
    content: string;
    senderAddress: string;
    timestamp: number;
    messageId: string;
  }> {
    this.ensureInitialized();
    this.ensureHasIdentityKey();

    const plaintext = await this.groupSessionManager!.receiveMessage(message);
    const content = new TextDecoder().decode(plaintext);

    this.log.info('Group message received', {
      groupId: message.groupId,
      messageId: message.messageId,
    });

    return {
      content,
      senderAddress: message.senderAddress,
      timestamp: message.timestamp,
      messageId: message.messageId,
    };
  }

  /**
   * Process a sender key distribution from a group member
   */
  async processGroupDistribution(distribution: SenderKeyDistributionMessage): Promise<void> {
    this.ensureInitialized();
    this.ensureHasIdentityKey();

    await this.groupSessionManager!.processDistribution(distribution);

    this.log.info('Processed group distribution', {
      groupId: distribution.groupId,
      senderAddress: distribution.senderAddress,
    });
  }

  /**
   * List all groups
   */
  async listGroups(): Promise<GroupInfo[]> {
    this.ensureInitialized();

    if (!this.groupSessionManager) {
      return [];
    }

    const sessions = await this.groupSessionManager.listSessions();
    return sessions.map(s => ({
      groupId: s.groupId,
      groupName: s.groupName,
      memberCount: s.memberCount,
      createdAt: s.createdAt,
    }));
  }

  // ---------------------------------------------------------------------------
  // Contact Management
  // ---------------------------------------------------------------------------

  /**
   * Add or update a contact
   */
  async addOrUpdateContact(contact: Contact): Promise<void> {
    this.contacts.set(contact.address.toLowerCase(), contact);
    await this.persistContacts();

    this.log.info('Contact added/updated', { address: contact.address });
  }

  /**
   * Get a contact by address
   */
  getContact(address: string): Contact | undefined {
    return this.contacts.get(address.toLowerCase());
  }

  /**
   * Get all contacts
   */
  getAllContacts(): Contact[] {
    return Array.from(this.contacts.values());
  }

  /**
   * Remove a contact
   */
  async removeContact(address: string): Promise<void> {
    this.contacts.delete(address.toLowerCase());
    await this.persistContacts();

    this.log.info('Contact removed', { address });
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  /**
   * Clear all data (for wallet reset)
   */
  async clearAllData(): Promise<void> {
    await this.preKeyStore.clearAll();
    await this.sessionStore.clearAll();
    await this.groupSessionStore.clearAll();

    this.contacts.clear();
    await this.secureStorage.deleteItem('deyondcrypt_contacts');

    this.identityKey = null;
    this.sessionManager = null;
    this.groupSessionManager = null;
    this.x3dh = null;
    this.initialized = false;

    this.log.info('All DeyondCrypt data cleared');
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('DeyondCryptService not initialized. Call initialize() first.');
    }
  }

  private ensureHasIdentityKey(): void {
    if (!this.identityKey) {
      throw new Error('No identity key. Call setupMessaging() first.');
    }
  }

  private async initializeProtocolComponents(): Promise<void> {
    if (!this.identityKey) return;

    const crypto = CryptoPrimitiveRegistry.get(this.identityKey.chainType);

    this.x3dh = new X3DH(crypto);
    this.sessionManager = new SessionManager(this.identityKey, this.preKeyStore, this.sessionStore);
    this.groupSessionManager = new GroupSessionManager(this.identityKey, this.groupSessionStore);

    // Load existing sessions
    await this.sessionManager.loadAllSessions();
    await this.groupSessionManager.loadAllSessions();
  }

  private async loadContacts(): Promise<void> {
    try {
      const contactsData = await this.secureStorage.getObject<Contact[]>('deyondcrypt_contacts');
      if (contactsData) {
        for (const contact of contactsData) {
          this.contacts.set(contact.address.toLowerCase(), contact);
        }
      }
    } catch (error) {
      this.log.warn('Failed to load contacts', { error });
    }
  }

  private async persistContacts(): Promise<void> {
    const contactsData = Array.from(this.contacts.values());
    await this.secureStorage.setObject('deyondcrypt_contacts', contactsData);
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let deyondCryptServiceInstance: DeyondCryptService | null = null;

export function getDeyondCryptService(): DeyondCryptService {
  if (!deyondCryptServiceInstance) {
    deyondCryptServiceInstance = new DeyondCryptService();
  }
  return deyondCryptServiceInstance;
}

export default DeyondCryptService;
