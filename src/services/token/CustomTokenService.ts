/**
 * CustomTokenService
 * Service for managing custom ERC20 tokens
 */

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CustomToken,
  TokenValidationResult,
  TokenWithBalance,
  TokenListStorage,
  TokenImportOptions,
  TokenSearchResult,
  ExternalTokenList,
  TokenListItem,
  TokenError,
  TokenErrorType,
  ERC20_VALIDATION_ABI,
  DEFAULT_TOKENS,
  POPULAR_TOKEN_LISTS,
} from './types';

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  CUSTOM_TOKENS: '@customTokens',
  TOKEN_LISTS: '@tokenLists',
};

/**
 * Custom Token Service
 */
class CustomTokenService {
  private provider: ethers.Provider | null = null;
  private cachedTokens: Map<string, CustomToken> = new Map();
  private externalLists: Map<string, ExternalTokenList> = new Map();

  /**
   * Set provider for token validation
   */
  setProvider(provider: ethers.Provider): void {
    this.provider = provider;
  }

  /**
   * Validate and get token info from contract
   */
  async validateToken(contractAddress: string, chainId: number): Promise<TokenValidationResult> {
    if (!this.provider) {
      return {
        valid: false,
        error: 'Provider not initialized',
      };
    }

    // Validate address format
    if (!ethers.isAddress(contractAddress)) {
      return {
        valid: false,
        error: 'Invalid contract address',
      };
    }

    const normalizedAddress = ethers.getAddress(contractAddress);

    try {
      const contract = new ethers.Contract(normalizedAddress, ERC20_VALIDATION_ABI, this.provider);

      // Try to fetch basic token info
      const [name, symbol, decimals] = await Promise.all([
        contract.name().catch(() => null),
        contract.symbol().catch(() => null),
        contract.decimals().catch(() => null),
      ]);

      // Must have at least symbol and decimals
      if (symbol === null || decimals === null) {
        return {
          valid: false,
          error: 'Contract is not a valid ERC20 token',
        };
      }

      const token: CustomToken = {
        address: normalizedAddress,
        symbol: symbol,
        name: name || symbol,
        decimals: Number(decimals),
        chainId,
        isCustom: true,
        addedAt: Date.now(),
        verified: false,
      };

      return {
        valid: true,
        token,
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Failed to validate token',
      };
    }
  }

  /**
   * Import a custom token
   */
  async importToken(options: TokenImportOptions): Promise<CustomToken> {
    const { contractAddress, chainId, skipValidation } = options;

    // Check if already exists
    const existing = await this.getToken(contractAddress, chainId);
    if (existing) {
      throw new TokenError(
        TokenErrorType.ALREADY_EXISTS,
        `Token ${contractAddress} already exists`
      );
    }

    let token: CustomToken;

    if (skipValidation) {
      // Use provided custom info
      if (!options.customSymbol || options.customDecimals === undefined) {
        throw new TokenError(
          TokenErrorType.VALIDATION_FAILED,
          'Symbol and decimals are required when skipping validation'
        );
      }

      token = {
        address: ethers.getAddress(contractAddress),
        symbol: options.customSymbol,
        name: options.customName || options.customSymbol,
        decimals: options.customDecimals,
        chainId,
        logoUrl: options.customLogoUrl,
        isCustom: true,
        addedAt: Date.now(),
        verified: false,
      };
    } else {
      // Validate on chain
      const validation = await this.validateToken(contractAddress, chainId);

      if (!validation.valid || !validation.token) {
        throw new TokenError(
          TokenErrorType.NOT_ERC20,
          validation.error || 'Token validation failed'
        );
      }

      token = {
        ...validation.token,
        logoUrl: options.customLogoUrl,
      };
    }

    // Save to storage
    await this.saveToken(token);

    return token;
  }

  /**
   * Remove a custom token
   */
  async removeToken(address: string, chainId: number): Promise<void> {
    const tokens = await this.getCustomTokens(chainId);
    const normalizedAddress = ethers.getAddress(address);

    const filtered = tokens.filter(
      t => t.address.toLowerCase() !== normalizedAddress.toLowerCase()
    );

    if (filtered.length === tokens.length) {
      throw new TokenError(TokenErrorType.NOT_FOUND, `Token ${address} not found`);
    }

    await this.saveTokenList(chainId, filtered);
    this.cachedTokens.delete(`${chainId}-${normalizedAddress.toLowerCase()}`);
  }

  /**
   * Get custom tokens for a chain
   */
  async getCustomTokens(chainId: number): Promise<CustomToken[]> {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEYS.CUSTOM_TOKENS}_${chainId}`);

      if (!data) {
        return [];
      }

      const storage: TokenListStorage = JSON.parse(data);
      return storage.tokens;
    } catch {
      return [];
    }
  }

  /**
   * Get all tokens (default + custom) for a chain
   */
  async getAllTokens(chainId: number): Promise<CustomToken[]> {
    const defaultTokens = DEFAULT_TOKENS[chainId] || [];
    const customTokens = await this.getCustomTokens(chainId);

    // Merge, custom tokens override defaults
    const tokenMap = new Map<string, CustomToken>();

    defaultTokens.forEach(t => {
      tokenMap.set(t.address.toLowerCase(), t);
    });

    customTokens.forEach(t => {
      tokenMap.set(t.address.toLowerCase(), t);
    });

    return Array.from(tokenMap.values());
  }

  /**
   * Get a specific token
   */
  async getToken(address: string, chainId: number): Promise<CustomToken | null> {
    const cacheKey = `${chainId}-${address.toLowerCase()}`;

    // Check cache first
    if (this.cachedTokens.has(cacheKey)) {
      return this.cachedTokens.get(cacheKey)!;
    }

    // Check defaults
    const defaults = DEFAULT_TOKENS[chainId] || [];
    const defaultToken = defaults.find(t => t.address.toLowerCase() === address.toLowerCase());

    if (defaultToken) {
      this.cachedTokens.set(cacheKey, defaultToken);
      return defaultToken;
    }

    // Check custom
    const customTokens = await this.getCustomTokens(chainId);
    const customToken = customTokens.find(t => t.address.toLowerCase() === address.toLowerCase());

    if (customToken) {
      this.cachedTokens.set(cacheKey, customToken);
      return customToken;
    }

    return null;
  }

  /**
   * Get token balance
   */
  async getTokenBalance(tokenAddress: string, ownerAddress: string): Promise<string> {
    if (!this.provider) {
      throw new TokenError(TokenErrorType.NETWORK_ERROR, 'Provider not initialized');
    }

    const contract = new ethers.Contract(
      tokenAddress,
      ['function balanceOf(address) view returns (uint256)'],
      this.provider
    );

    const balance = await contract.balanceOf(ownerAddress);
    return balance.toString();
  }

  /**
   * Get multiple token balances
   */
  async getTokenBalances(ownerAddress: string, chainId: number): Promise<TokenWithBalance[]> {
    const tokens = await this.getAllTokens(chainId);
    const results: TokenWithBalance[] = [];

    for (const token of tokens) {
      try {
        const balance = await this.getTokenBalance(token.address, ownerAddress);
        results.push({
          ...token,
          balance,
        });
      } catch {
        results.push({
          ...token,
          balance: '0',
        });
      }
    }

    return results;
  }

  /**
   * Search tokens in external lists
   */
  async searchTokens(query: string, chainId: number): Promise<TokenSearchResult> {
    const results: CustomToken[] = [];
    const queryLower = query.toLowerCase();

    // Search local tokens first
    const localTokens = await this.getAllTokens(chainId);
    const localMatches = localTokens.filter(
      t =>
        t.symbol.toLowerCase().includes(queryLower) ||
        t.name.toLowerCase().includes(queryLower) ||
        t.address.toLowerCase() === queryLower
    );

    if (localMatches.length > 0) {
      return {
        tokens: localMatches,
        source: 'local',
      };
    }

    // Search external token lists
    for (const listInfo of POPULAR_TOKEN_LISTS) {
      try {
        const list = await this.fetchTokenList(listInfo.url);
        const matches = list.tokens.filter(
          t =>
            t.chainId === chainId &&
            (t.symbol.toLowerCase().includes(queryLower) ||
              t.name.toLowerCase().includes(queryLower) ||
              t.address.toLowerCase() === queryLower)
        );

        matches.forEach(m => {
          if (!results.find(r => r.address.toLowerCase() === m.address.toLowerCase())) {
            results.push(this.tokenListItemToCustomToken(m));
          }
        });
      } catch {
        // Skip failed lists
      }
    }

    return {
      tokens: results.slice(0, 50), // Limit results
      source: 'tokenList',
    };
  }

  /**
   * Fetch external token list
   */
  async fetchTokenList(url: string): Promise<ExternalTokenList> {
    // Check cache
    if (this.externalLists.has(url)) {
      return this.externalLists.get(url)!;
    }

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch token list: ${response.status}`);
      }

      const data: ExternalTokenList = await response.json();
      this.externalLists.set(url, data);

      return data;
    } catch (error: any) {
      throw new TokenError(
        TokenErrorType.NETWORK_ERROR,
        `Failed to fetch token list: ${error.message}`,
        error
      );
    }
  }

  /**
   * Import tokens from external list
   */
  async importFromTokenList(
    url: string,
    chainId: number,
    addresses?: string[]
  ): Promise<CustomToken[]> {
    const list = await this.fetchTokenList(url);
    const imported: CustomToken[] = [];

    const tokensToImport = list.tokens.filter(t => {
      if (t.chainId !== chainId) return false;
      if (addresses && !addresses.includes(t.address.toLowerCase())) {
        return false;
      }
      return true;
    });

    for (const item of tokensToImport) {
      try {
        const token = this.tokenListItemToCustomToken(item);
        await this.saveToken(token);
        imported.push(token);
      } catch {
        // Skip failed imports
      }
    }

    return imported;
  }

  /**
   * Clear custom tokens for a chain
   */
  async clearCustomTokens(chainId: number): Promise<void> {
    await AsyncStorage.removeItem(`${STORAGE_KEYS.CUSTOM_TOKENS}_${chainId}`);

    // Clear cache for this chain
    for (const key of this.cachedTokens.keys()) {
      if (key.startsWith(`${chainId}-`)) {
        this.cachedTokens.delete(key);
      }
    }
  }

  /**
   * Export custom tokens for backup
   */
  async exportTokens(chainId?: number): Promise<TokenListStorage[]> {
    const exports: TokenListStorage[] = [];

    if (chainId !== undefined) {
      const tokens = await this.getCustomTokens(chainId);
      exports.push({
        version: '1.0.0',
        tokens,
        lastUpdated: Date.now(),
      });
    } else {
      // Export all chains
      const chains = Object.keys(DEFAULT_TOKENS).map(Number);
      for (const chain of chains) {
        const tokens = await this.getCustomTokens(chain);
        if (tokens.length > 0) {
          exports.push({
            version: '1.0.0',
            tokens,
            lastUpdated: Date.now(),
          });
        }
      }
    }

    return exports;
  }

  /**
   * Import tokens from backup
   */
  async importFromBackup(data: TokenListStorage[]): Promise<number> {
    let imported = 0;

    for (const storage of data) {
      for (const token of storage.tokens) {
        try {
          const existing = await this.getToken(token.address, token.chainId);
          if (!existing) {
            await this.saveToken(token);
            imported++;
          }
        } catch {
          // Skip failed imports
        }
      }
    }

    return imported;
  }

  /**
   * Save a token to storage
   */
  private async saveToken(token: CustomToken): Promise<void> {
    const tokens = await this.getCustomTokens(token.chainId);
    const normalizedAddress = token.address.toLowerCase();

    // Remove existing if present
    const filtered = tokens.filter(t => t.address.toLowerCase() !== normalizedAddress);

    filtered.push(token);
    await this.saveTokenList(token.chainId, filtered);

    // Update cache
    this.cachedTokens.set(`${token.chainId}-${normalizedAddress}`, token);
  }

  /**
   * Save token list to storage
   */
  private async saveTokenList(chainId: number, tokens: CustomToken[]): Promise<void> {
    const storage: TokenListStorage = {
      version: '1.0.0',
      tokens,
      lastUpdated: Date.now(),
    };

    await AsyncStorage.setItem(`${STORAGE_KEYS.CUSTOM_TOKENS}_${chainId}`, JSON.stringify(storage));
  }

  /**
   * Convert token list item to custom token
   */
  private tokenListItemToCustomToken(item: TokenListItem): CustomToken {
    return {
      address: ethers.getAddress(item.address),
      symbol: item.symbol,
      name: item.name,
      decimals: item.decimals,
      chainId: item.chainId,
      logoUrl: item.logoURI,
      isCustom: true,
      addedAt: Date.now(),
      verified: true, // From official lists
    };
  }
}

// Singleton instance
let customTokenServiceInstance: CustomTokenService | null = null;

export const getCustomTokenService = (): CustomTokenService => {
  if (!customTokenServiceInstance) {
    customTokenServiceInstance = new CustomTokenService();
  }
  return customTokenServiceInstance;
};

export default CustomTokenService;
