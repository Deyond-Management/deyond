/**
 * WalletConnectService Tests
 */

import { WalletConnectService } from '../../services/WalletConnectService';

describe('WalletConnectService', () => {
  let wcService: WalletConnectService;

  beforeEach(() => {
    wcService = new WalletConnectService();
  });

  describe('session management', () => {
    it('should initialize client', async () => {
      await wcService.initialize({
        projectId: 'test-project-id',
        metadata: {
          name: 'Deyond Wallet',
          description: 'Crypto Wallet',
          url: 'https://deyond.io',
          icons: ['https://deyond.io/icon.png'],
        },
      });

      expect(wcService.isInitialized()).toBe(true);
    });

    it('should pair with URI', async () => {
      await wcService.initialize({ projectId: 'test' });
      const result = await wcService.pair('wc:abc123@2?relay-protocol=irn');

      expect(result).toBeDefined();
    });

    it('should approve session', async () => {
      const mockProposal = {
        id: 1,
        params: {
          requiredNamespaces: {
            eip155: {
              chains: ['eip155:1'],
              methods: ['eth_sendTransaction'],
              events: ['accountsChanged'],
            },
          },
        },
      };

      await wcService.initialize({ projectId: 'test' });
      const session = await wcService.approveSession(mockProposal, {
        accounts: ['eip155:1:0x123'],
      });

      expect(session).toBeDefined();
    });

    it('should reject session', async () => {
      await wcService.initialize({ projectId: 'test' });
      await wcService.rejectSession(1, 'User rejected');
    });

    it('should disconnect session', async () => {
      await wcService.initialize({ projectId: 'test' });
      await wcService.disconnect('session-topic');
    });

    it('should get active sessions', () => {
      const sessions = wcService.getActiveSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });
  });

  describe('request handling', () => {
    it('should respond to request', async () => {
      await wcService.initialize({ projectId: 'test' });
      await wcService.respondRequest('topic', 1, { result: '0xhash' });
    });

    it('should reject request', async () => {
      await wcService.initialize({ projectId: 'test' });
      await wcService.rejectRequest('topic', 1, 'User rejected');
    });
  });

  describe('event listeners', () => {
    it('should register session proposal listener', () => {
      const handler = jest.fn();
      wcService.onSessionProposal(handler);
    });

    it('should register session request listener', () => {
      const handler = jest.fn();
      wcService.onSessionRequest(handler);
    });

    it('should register session delete listener', () => {
      const handler = jest.fn();
      wcService.onSessionDelete(handler);
    });
  });
});
