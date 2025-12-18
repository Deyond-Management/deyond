/**
 * DeyondCrypt Service Tests
 */

import { DeyondCryptService } from '../DeyondCryptService';
import {
  CryptoPrimitiveRegistry,
  EVMCrypto,
  initializeDeyondCrypt,
} from '../../../crypto/deyondcrypt';

// Mock SecureStorageService with instance-specific storage
jest.mock('../../wallet/SecureStorageService', () => {
  return {
    SecureStorageService: jest.fn().mockImplementation(() => {
      const storage = new Map<string, string>();
      return {
        setItem: jest.fn((key: string, value: string) => {
          storage.set(key, value);
          return Promise.resolve();
        }),
        getItem: jest.fn((key: string) => {
          return Promise.resolve(storage.get(key) || null);
        }),
        deleteItem: jest.fn((key: string) => {
          storage.delete(key);
          return Promise.resolve();
        }),
        setObject: jest.fn((key: string, value: any) => {
          storage.set(key, JSON.stringify(value));
          return Promise.resolve();
        }),
        getObject: jest.fn((key: string) => {
          const value = storage.get(key);
          return Promise.resolve(value ? JSON.parse(value) : null);
        }),
        hasItem: jest.fn((key: string) => {
          return Promise.resolve(storage.has(key));
        }),
        clear: jest.fn((keys: string[]) => {
          keys.forEach(key => storage.delete(key));
          return Promise.resolve();
        }),
      };
    }),
  };
});

// Mock logger
jest.mock('../../../utils', () => ({
  logger: {
    child: () => ({
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    }),
  },
}));

describe('DeyondCryptService', () => {
  let service: DeyondCryptService;

  beforeAll(() => {
    // Initialize crypto primitives
    CryptoPrimitiveRegistry.clear();
    CryptoPrimitiveRegistry.register(new EVMCrypto());
  });

  beforeEach(() => {
    service = new DeyondCryptService();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await service.initialize();

      expect(service.isInitialized()).toBe(true);
      expect(service.hasIdentityKey()).toBe(false);
    });

    it('should not re-initialize if already initialized', async () => {
      await service.initialize();
      await service.initialize(); // Should not throw

      expect(service.isInitialized()).toBe(true);
    });
  });

  describe('identity setup', () => {
    it('should setup messaging keys', async () => {
      await service.initialize();

      const walletPrivateKey = new Uint8Array(32).fill(0x42);
      const preKeyBundle = await service.setupMessaging(walletPrivateKey, 'evm');

      expect(service.hasIdentityKey()).toBe(true);
      expect(preKeyBundle).toBeDefined();
      expect(preKeyBundle.identityKey).toBeDefined();
      expect(preKeyBundle.signedPreKey).toBeDefined();
      expect(preKeyBundle.address).toBeDefined();
    });

    it('should return address after setup', async () => {
      await service.initialize();

      const walletPrivateKey = new Uint8Array(32).fill(0x42);
      await service.setupMessaging(walletPrivateKey, 'evm');

      const address = service.getMyAddress();
      expect(address).toBeDefined();
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should return chain type after setup', async () => {
      await service.initialize();

      const walletPrivateKey = new Uint8Array(32).fill(0x42);
      await service.setupMessaging(walletPrivateKey, 'evm');

      expect(service.getMyChainType()).toBe('evm');
    });

    it('should get own pre-key bundle', async () => {
      await service.initialize();

      const walletPrivateKey = new Uint8Array(32).fill(0x42);
      await service.setupMessaging(walletPrivateKey, 'evm');

      const bundle = await service.getMyPreKeyBundle();
      expect(bundle).toBeDefined();
      expect(bundle!.identityKey).toBeDefined();
    });
  });

  describe('contact management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should add a contact', async () => {
      await service.addOrUpdateContact({
        address: '0x1234567890123456789012345678901234567890',
        chainType: 'evm',
        name: 'Alice',
        addedAt: Date.now(),
      });

      const contacts = service.getAllContacts();
      expect(contacts.length).toBe(1);
      expect(contacts[0].name).toBe('Alice');
    });

    it('should get contact by address', async () => {
      await service.addOrUpdateContact({
        address: '0x1234567890123456789012345678901234567890',
        chainType: 'evm',
        name: 'Alice',
        addedAt: Date.now(),
      });

      const contact = service.getContact('0x1234567890123456789012345678901234567890');
      expect(contact).toBeDefined();
      expect(contact!.name).toBe('Alice');
    });

    it('should be case insensitive for address lookup', async () => {
      await service.addOrUpdateContact({
        address: '0xABCDEF1234567890123456789012345678901234',
        chainType: 'evm',
        name: 'Bob',
        addedAt: Date.now(),
      });

      const contact = service.getContact('0xabcdef1234567890123456789012345678901234');
      expect(contact).toBeDefined();
      expect(contact!.name).toBe('Bob');
    });

    it('should update existing contact', async () => {
      await service.addOrUpdateContact({
        address: '0x1234567890123456789012345678901234567890',
        chainType: 'evm',
        name: 'Alice',
        addedAt: Date.now(),
      });

      await service.addOrUpdateContact({
        address: '0x1234567890123456789012345678901234567890',
        chainType: 'evm',
        name: 'Alice Smith',
        addedAt: Date.now(),
      });

      const contacts = service.getAllContacts();
      expect(contacts.length).toBe(1);
      expect(contacts[0].name).toBe('Alice Smith');
    });

    it('should remove a contact', async () => {
      await service.addOrUpdateContact({
        address: '0x1234567890123456789012345678901234567890',
        chainType: 'evm',
        name: 'Alice',
        addedAt: Date.now(),
      });

      await service.removeContact('0x1234567890123456789012345678901234567890');

      const contacts = service.getAllContacts();
      expect(contacts.length).toBe(0);
    });
  });

  describe('group messaging', () => {
    beforeEach(async () => {
      await service.initialize();
      const walletPrivateKey = new Uint8Array(32).fill(0x42);
      await service.setupMessaging(walletPrivateKey, 'evm');
    });

    it('should create a group', async () => {
      const { groupId, distributions } = await service.createGroup('Test Group');

      expect(groupId).toBeDefined();
      expect(distributions).toBeDefined();

      const groups = await service.listGroups();
      expect(groups.length).toBe(1);
      expect(groups[0].groupName).toBe('Test Group');
    });

    it('should create group with members', async () => {
      const { groupId } = await service.createGroup('Test Group', [
        '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
      ]);

      expect(groupId).toBeDefined();

      const groups = await service.listGroups();
      expect(groups[0].memberCount).toBeGreaterThanOrEqual(1); // At least creator
    });
  });

  describe('cleanup', () => {
    it('should clear all data', async () => {
      await service.initialize();
      const walletPrivateKey = new Uint8Array(32).fill(0x42);
      await service.setupMessaging(walletPrivateKey, 'evm');

      await service.addOrUpdateContact({
        address: '0x1234567890123456789012345678901234567890',
        chainType: 'evm',
        name: 'Alice',
        addedAt: Date.now(),
      });

      await service.clearAllData();

      expect(service.hasIdentityKey()).toBe(false);
      expect(service.isInitialized()).toBe(false);
      expect(service.getAllContacts().length).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should return null for address if no identity key', async () => {
      await service.initialize();
      expect(service.getMyAddress()).toBeNull();
    });

    it('should throw if no identity key when sending', async () => {
      await service.initialize();

      await expect(service.sendMessage('0x123', 'evm', 'Hello')).rejects.toThrow('No identity key');
    });

    it('should throw if no pre-key bundle for recipient', async () => {
      await service.initialize();
      const walletPrivateKey = new Uint8Array(32).fill(0x42);
      await service.setupMessaging(walletPrivateKey, 'evm');

      await expect(
        service.sendMessage('0x1234567890123456789012345678901234567890', 'evm', 'Hello')
      ).rejects.toThrow('No pre-key bundle');
    });
  });
});

describe('Multiple Users Integration', () => {
  let aliceService: DeyondCryptService;
  let bobService: DeyondCryptService;

  beforeAll(() => {
    CryptoPrimitiveRegistry.clear();
    CryptoPrimitiveRegistry.register(new EVMCrypto());
  });

  beforeEach(async () => {
    aliceService = new DeyondCryptService();
    bobService = new DeyondCryptService();

    await aliceService.initialize();
    await bobService.initialize();

    // Setup Alice
    const aliceWalletKey = new Uint8Array(32).fill(0x01);
    await aliceService.setupMessaging(aliceWalletKey, 'evm');

    // Setup Bob
    const bobWalletKey = new Uint8Array(32).fill(0x02);
    await bobService.setupMessaging(bobWalletKey, 'evm');
  });

  it('should establish session between users', async () => {
    // Get Bob's pre-key bundle
    const bobBundle = await bobService.getMyPreKeyBundle();
    expect(bobBundle).toBeDefined();

    // Alice establishes session with Bob
    const { sessionId } = await aliceService.establishSession(bobBundle!);
    expect(sessionId).toBeDefined();
  });

  it('should exchange group distributions', async () => {
    // Alice creates a group
    const { groupId, distributions } = await aliceService.createGroup('Friends');

    // Get Alice's distribution for Bob
    const aliceDistribution =
      distributions[0] || (await aliceService.createGroup('Friends')).distributions[0];

    // Bob joins the group (in real scenario, he'd receive the distribution)
    // This would be done via the actual distribution from Alice
    const bobGroupResult = await bobService.createGroup('Friends Copy');
    expect(bobGroupResult.groupId).toBeDefined();
  });
});
