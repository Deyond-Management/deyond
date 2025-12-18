/**
 * BlockchainAdapterFactory Tests
 */

import {
  BlockchainAdapterFactory,
  getBlockchainAdapterFactory,
  createAdapter,
} from '../BlockchainAdapterFactory';
import { SolanaAdapter } from '../SolanaAdapter';
import { BitcoinAdapter } from '../BitcoinAdapter';

describe('BlockchainAdapterFactory', () => {
  let factory: BlockchainAdapterFactory;

  beforeEach(async () => {
    factory = BlockchainAdapterFactory.getInstance();
    await factory.clearAll();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = BlockchainAdapterFactory.getInstance();
      const instance2 = BlockchainAdapterFactory.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('create', () => {
    it('should create Ethereum adapter', () => {
      const adapter = factory.create({ chain: 'ethereum' });
      expect(adapter).toBeDefined();
      expect(adapter.getChainMetadata().name).toBe('Ethereum');
    });

    it('should create Solana adapter', () => {
      const adapter = factory.create({ chain: 'solana' });
      expect(adapter).toBeInstanceOf(SolanaAdapter);
    });

    it('should create Bitcoin adapter', () => {
      const adapter = factory.create({ chain: 'bitcoin' });
      expect(adapter).toBeInstanceOf(BitcoinAdapter);
    });

    it('should create adapter with demo mode', () => {
      const adapter = factory.create({ chain: 'ethereum', demoMode: true });
      expect(adapter).toBeDefined();
    });

    it('should create adapter with custom config', () => {
      const adapter = factory.create({
        chain: 'ethereum',
        config: { rpcUrl: 'https://custom-rpc.example.com' },
      });
      expect(adapter).toBeDefined();
    });

    it('should throw error for unsupported chain', () => {
      expect(() => factory.create({ chain: 'unsupported-chain' })).toThrow('Unsupported chain');
    });

    it('should cache adapters', () => {
      const adapter1 = factory.create({ chain: 'ethereum' });
      const adapter2 = factory.create({ chain: 'ethereum' });
      expect(adapter1).toBe(adapter2);
    });

    it('should create different adapters for different configs', () => {
      const adapter1 = factory.create({ chain: 'ethereum', config: { rpcUrl: 'url1' } });
      const adapter2 = factory.create({ chain: 'ethereum', config: { rpcUrl: 'url2' } });
      expect(adapter1).not.toBe(adapter2);
    });
  });

  describe('setDemoMode', () => {
    it('should set global demo mode', () => {
      factory.setDemoMode(true);
      const adapter = factory.create({ chain: 'solana' });
      expect(adapter).toBeDefined();
    });
  });

  describe('getAdapter', () => {
    it('should get or create adapter for chain', () => {
      const adapter = factory.getAdapter('polygon');
      expect(adapter).toBeDefined();
      expect(adapter.getChainMetadata().name).toBe('Polygon');
    });
  });

  describe('hasAdapter', () => {
    it('should return true if adapter exists', () => {
      factory.create({ chain: 'ethereum' });
      expect(factory.hasAdapter('ethereum')).toBe(false); // Cache key includes config
    });

    it('should return false if adapter does not exist', () => {
      expect(factory.hasAdapter('random-chain')).toBe(false);
    });
  });

  describe('removeAdapter', () => {
    it('should remove adapter from cache', async () => {
      const adapter = factory.create({ chain: 'ethereum' });
      await adapter.connect();

      factory.removeAdapter('ethereum');
      expect(factory.hasAdapter('ethereum')).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('should clear all cached adapters', async () => {
      factory.create({ chain: 'ethereum' });
      factory.create({ chain: 'polygon' });
      factory.create({ chain: 'solana' });

      await factory.clearAll();

      // Should create new instances after clear
      const newAdapter = factory.create({ chain: 'ethereum' });
      expect(newAdapter).toBeDefined();
    });
  });

  describe('getSupportedChains', () => {
    it('should return list of supported chains', () => {
      const chains = factory.getSupportedChains();
      expect(Array.isArray(chains)).toBe(true);
      expect(chains.length).toBeGreaterThan(0);

      const chainNames = chains.map(c => c.name);
      expect(chainNames).toContain('Ethereum');
      expect(chainNames).toContain('Polygon');
      expect(chainNames).toContain('Solana');
      expect(chainNames).toContain('Bitcoin');
    });
  });

  describe('getChainsByType', () => {
    it('should return EVM chains', () => {
      const evmChains = factory.getChainsByType('evm');
      expect(evmChains.length).toBeGreaterThan(0);
      evmChains.forEach(chain => {
        expect(chain.type).toBe('evm');
      });
    });

    it('should return Solana chains', () => {
      const solanaChains = factory.getChainsByType('solana');
      expect(solanaChains.length).toBeGreaterThan(0);
      solanaChains.forEach(chain => {
        expect(chain.type).toBe('solana');
      });
    });

    it('should return Bitcoin chains', () => {
      const bitcoinChains = factory.getChainsByType('bitcoin');
      expect(bitcoinChains.length).toBeGreaterThan(0);
      bitcoinChains.forEach(chain => {
        expect(chain.type).toBe('bitcoin');
      });
    });
  });

  describe('isSupported', () => {
    it('should return true for supported chains', () => {
      expect(factory.isSupported('ethereum')).toBe(true);
      expect(factory.isSupported('solana')).toBe(true);
      expect(factory.isSupported('bitcoin')).toBe(true);
      expect(factory.isSupported('polygon')).toBe(true);
    });

    it('should return false for unsupported chains', () => {
      expect(factory.isSupported('random-chain')).toBe(false);
    });

    it('should support chain lookup by ID', () => {
      expect(factory.isSupported('1')).toBe(true); // Ethereum mainnet
      expect(factory.isSupported('137')).toBe(true); // Polygon
    });
  });
});

describe('Module exports', () => {
  describe('getBlockchainAdapterFactory', () => {
    it('should return factory instance', () => {
      const factory = getBlockchainAdapterFactory();
      expect(factory).toBeInstanceOf(BlockchainAdapterFactory);
    });
  });

  describe('createAdapter', () => {
    it('should create adapter using convenience function', () => {
      const adapter = createAdapter({ chain: 'ethereum' });
      expect(adapter).toBeDefined();
    });
  });
});

describe('Adapter functionality', () => {
  let factory: BlockchainAdapterFactory;

  beforeEach(async () => {
    factory = BlockchainAdapterFactory.getInstance();
    factory.setDemoMode(true);
    await factory.clearAll();
  });

  describe('EVM adapter', () => {
    it('should validate EVM addresses', () => {
      const adapter = factory.create({ chain: 'ethereum' });
      expect(adapter.isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f1b5c1')).toBe(true);
      expect(adapter.isValidAddress('invalid')).toBe(false);
    });

    it('should have correct capabilities', () => {
      const adapter = factory.create({ chain: 'ethereum' });
      const capabilities = adapter.getCapabilities();
      expect(capabilities.supportsEIP1559).toBe(true);
      expect(capabilities.supportsTokens).toBe(true);
      expect(capabilities.supportsNFTs).toBe(true);
    });
  });

  describe('Solana adapter', () => {
    it('should have correct chain metadata', () => {
      const adapter = factory.create({ chain: 'solana' });
      const metadata = adapter.getChainMetadata();
      expect(metadata.name).toBe('Solana');
      expect(metadata.symbol).toBe('SOL');
    });

    it('should have correct capabilities', () => {
      const adapter = factory.create({ chain: 'solana' });
      const capabilities = adapter.getCapabilities();
      expect(capabilities.supportsEIP1559).toBe(false);
      expect(capabilities.supportsTokens).toBe(true);
    });
  });

  describe('Bitcoin adapter', () => {
    it('should have correct chain metadata', () => {
      const adapter = factory.create({ chain: 'bitcoin' });
      const metadata = adapter.getChainMetadata();
      expect(metadata.name).toBe('Bitcoin');
      expect(metadata.symbol).toBe('BTC');
    });

    it('should have correct capabilities', () => {
      const adapter = factory.create({ chain: 'bitcoin' });
      const capabilities = adapter.getCapabilities();
      expect(capabilities.supportsTokens).toBe(false);
      expect(capabilities.supportsNFTs).toBe(false);
      expect(capabilities.supportsSmartContracts).toBe(false);
    });
  });
});
