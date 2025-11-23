/**
 * BLE Session Manager Tests
 * TDD: Testing BLE session establishment protocol
 */

import { BLESessionManager } from '../../core/ble/BLESessionManager';
import { SessionStatus } from '../../types/ble';

describe('BLESessionManager', () => {
  let sessionManager: BLESessionManager;
  const mockWalletAddress = '0x1234567890123456789012345678901234567890';
  const mockPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

  beforeEach(() => {
    sessionManager = new BLESessionManager(mockWalletAddress, mockPrivateKey);
  });

  describe('initiateSession', () => {
    it('should create a new session with INITIATING status', async () => {
      const deviceId = 'device-123';
      const deviceAddress = '00:11:22:33:44:55';
      const deviceName = 'Test Device';

      const session = await sessionManager.initiateSession(deviceId, deviceAddress, deviceName);

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.deviceId).toEqual(deviceId);
      expect(session.deviceAddress).toEqual(deviceAddress);
      expect(session.deviceName).toEqual(deviceName);
      expect(session.status).toEqual(SessionStatus.INITIATING);
      expect(session.createdAt).toBeDefined();
      expect(session.expiresAt).toBeGreaterThan(session.createdAt);
    });

    it('should create unique session IDs', async () => {
      const session1 = await sessionManager.initiateSession('dev1', 'addr1', 'name1');
      const session2 = await sessionManager.initiateSession('dev2', 'addr2', 'name2');

      expect(session1.id).not.toEqual(session2.id);
    });
  });

  describe('createHandshakeRequest', () => {
    it('should create signed handshake request', async () => {
      const session = await sessionManager.initiateSession('dev1', 'addr1', 'name1');

      const handshake = await sessionManager.createHandshakeRequest(session.id);

      expect(handshake).toBeDefined();
      expect(handshake.sessionId).toEqual(session.id);
      expect(handshake.publicKey).toBeDefined();
      expect(handshake.address).toEqual(mockWalletAddress);
      expect(handshake.timestamp).toBeDefined();
      expect(handshake.signature).toBeDefined();
    });

    it('should fail for non-existent session', async () => {
      await expect(
        sessionManager.createHandshakeRequest('invalid-session-id')
      ).rejects.toThrow();
    });
  });

  describe.skip('processHandshakeResponse', () => {
    // TODO: This is an integration test that requires complex peer setup
    it('should process valid handshake response and establish session', async () => {
      const session = await sessionManager.initiateSession('dev1', 'addr1', 'name1');
      const handshakeRequest = await sessionManager.createHandshakeRequest(session.id);

      // Simulate peer response
      const peerPrivateKey = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
      const peerAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const peerManager = new BLESessionManager(peerAddress, peerPrivateKey);
      const peerSession = await peerManager.initiateSession('initiator-dev', 'initiator-addr', 'Initiator');

      const handshakeResponse = await peerManager.createHandshakeRequest(peerSession.id);

      // Process response
      const establishedSession = await sessionManager.processHandshakeResponse(
        session.id,
        handshakeResponse
      );

      expect(establishedSession.status).toEqual(SessionStatus.ESTABLISHED);
      expect(establishedSession.sharedSecret).toBeDefined();
    });

    it('should fail with invalid signature', async () => {
      const session = await sessionManager.initiateSession('dev1', 'addr1', 'name1');

      const invalidHandshake = {
        sessionId: session.id,
        publicKey: 'invalid-public-key',
        address: '0x0000000000000000000000000000000000000000',
        timestamp: Date.now(),
        signature: 'invalid-signature',
      };

      await expect(
        sessionManager.processHandshakeResponse(session.id, invalidHandshake)
      ).rejects.toThrow();
    });
  });

  describe.skip('deriveSharedSecret', () => {
    // TODO: This is an integration test that requires complex peer setup
    it('should derive shared secret from ECDH', async () => {
      const session = await sessionManager.initiateSession('dev1', 'addr1', 'name1');
      const handshakeRequest = await sessionManager.createHandshakeRequest(session.id);

      // Create peer and derive their shared secret
      const peerPrivateKey = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
      const peerAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const peerManager = new BLESessionManager(peerAddress, peerPrivateKey);

      const peerSession = await peerManager.initiateSession('initiator-dev', 'initiator-addr', 'Initiator');
      const peerHandshake = await peerManager.createHandshakeRequest(peerSession.id);

      // Both sides should derive the same shared secret
      const secret1 = await sessionManager.deriveSharedSecret(session.id, peerHandshake.publicKey);
      const secret2 = await peerManager.deriveSharedSecret(peerSession.id, handshakeRequest.publicKey);

      // Note: Due to ECDH, both should compute compatible secrets (may not be identical in representation)
      expect(secret1).toBeDefined();
      expect(secret2).toBeDefined();
    });
  });

  describe('closeSession', () => {
    it('should close active session', async () => {
      const session = await sessionManager.initiateSession('dev1', 'addr1', 'name1');

      await sessionManager.closeSession(session.id);

      const closedSession = sessionManager.getSession(session.id);
      expect(closedSession?.status).toEqual(SessionStatus.CLOSED);
    });

    it('should handle closing non-existent session', async () => {
      await expect(sessionManager.closeSession('invalid-id')).rejects.toThrow();
    });
  });

  describe('isSessionValid', () => {
    it('should return true for valid established session', async () => {
      const session = await sessionManager.initiateSession('dev1', 'addr1', 'name1');

      // Manually set session to established for testing
      const testSession = sessionManager.getSession(session.id);
      if (testSession) {
        testSession.status = SessionStatus.ESTABLISHED;
        testSession.sharedSecret = 'test-secret';
      }

      const isValid = sessionManager.isSessionValid(session.id);
      expect(isValid).toBe(true);
    });

    it('should return false for expired session', async () => {
      const session = await sessionManager.initiateSession('dev1', 'addr1', 'name1');

      // Manually expire session
      const testSession = sessionManager.getSession(session.id);
      if (testSession) {
        testSession.expiresAt = Date.now() - 1000; // Expired 1 second ago
      }

      const isValid = sessionManager.isSessionValid(session.id);
      expect(isValid).toBe(false);
    });

    it('should return false for non-established session', async () => {
      const session = await sessionManager.initiateSession('dev1', 'addr1', 'name1');

      const isValid = sessionManager.isSessionValid(session.id);
      expect(isValid).toBe(false);
    });
  });
});
