/**
 * DeepLinkService Tests
 */

import { DeepLinkService } from '../../services/support/DeepLinkService';

describe('DeepLinkService', () => {
  let deepLinkService: DeepLinkService;

  beforeEach(() => {
    deepLinkService = new DeepLinkService();
  });

  describe('URL parsing', () => {
    it('should parse send link', () => {
      const url = 'deyond://send?address=0x123&amount=1.5&token=ETH';
      const result = deepLinkService.parse(url);

      expect(result.action).toBe('send');
      expect(result.params.address).toBe('0x123');
      expect(result.params.amount).toBe('1.5');
      expect(result.params.token).toBe('ETH');
    });

    it('should parse receive link', () => {
      const url = 'deyond://receive';
      const result = deepLinkService.parse(url);

      expect(result.action).toBe('receive');
    });

    it('should parse wallet connect link', () => {
      const url = 'deyond://wc?uri=wc:abc123';
      const result = deepLinkService.parse(url);

      expect(result.action).toBe('wc');
      expect(result.params.uri).toBe('wc:abc123');
    });

    it('should parse transaction link', () => {
      const url = 'deyond://tx?hash=0xabc';
      const result = deepLinkService.parse(url);

      expect(result.action).toBe('tx');
      expect(result.params.hash).toBe('0xabc');
    });

    it('should handle unknown action', () => {
      const url = 'deyond://unknown';
      const result = deepLinkService.parse(url);

      expect(result.action).toBe('unknown');
    });

    it('should handle invalid URL', () => {
      const url = 'invalid-url';
      const result = deepLinkService.parse(url);

      expect(result.action).toBe('invalid');
    });
  });

  describe('URL generation', () => {
    it('should generate send link', () => {
      const url = deepLinkService.generateSendLink({
        address: '0x123',
        amount: '1.5',
        token: 'ETH',
      });

      expect(url).toContain('deyond://send');
      expect(url).toContain('address=0x123');
      expect(url).toContain('amount=1.5');
      expect(url).toContain('token=ETH');
    });

    it('should generate receive link', () => {
      const url = deepLinkService.generateReceiveLink('0x456');

      expect(url).toBe('deyond://receive?address=0x456');
    });

    it('should generate WalletConnect link', () => {
      const url = deepLinkService.generateWCLink('wc:xyz');

      expect(url).toContain('deyond://wc');
      expect(url).toContain('uri=wc%3Axyz');
    });
  });

  describe('handler registration', () => {
    it('should register and call handler for action', () => {
      const handler = jest.fn();
      deepLinkService.registerHandler('send', handler);

      deepLinkService.handle('deyond://send?address=0x123');

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'send',
          params: expect.objectContaining({ address: '0x123' }),
        })
      );
    });

    it('should unregister handler', () => {
      const handler = jest.fn();
      deepLinkService.registerHandler('send', handler);
      deepLinkService.unregisterHandler('send');

      deepLinkService.handle('deyond://send');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should call default handler for unknown action', () => {
      const defaultHandler = jest.fn();
      deepLinkService.setDefaultHandler(defaultHandler);

      deepLinkService.handle('deyond://unknown');

      expect(defaultHandler).toHaveBeenCalled();
    });
  });

  describe('EIP-681 support', () => {
    it('should parse ethereum payment link', () => {
      const url = 'ethereum:0x123?value=1e18&gas=21000';
      const result = deepLinkService.parseEIP681(url);

      expect(result.address).toBe('0x123');
      expect(result.value).toBe('1e18');
      expect(result.gas).toBe('21000');
    });

    it('should parse token transfer link', () => {
      const url = 'ethereum:0xtoken/transfer?address=0x123&uint256=1000';
      const result = deepLinkService.parseEIP681(url);

      expect(result.contractAddress).toBe('0xtoken');
      expect(result.function).toBe('transfer');
      expect(result.params.address).toBe('0x123');
    });
  });
});
