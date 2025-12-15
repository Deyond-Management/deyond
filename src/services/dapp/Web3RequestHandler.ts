/**
 * Web3RequestHandler
 * Handles Web3 requests from DApp WebView
 */

import { ethers } from 'ethers';
import { Web3Request, Web3Response, TransactionRequest } from '../../types/dapp';
import { getChainManager } from '../blockchain/ChainManager';
import { getProviderManager } from '../blockchain/ProviderManager';

export class Web3RequestHandlerError extends Error {
  code: number;

  constructor(message: string, code: number = 4001) {
    super(message);
    this.name = 'Web3RequestHandlerError';
    this.code = code;
  }
}

export interface Web3RequestHandlerCallbacks {
  onTransactionRequest: (tx: TransactionRequest) => Promise<string>;
  onSignRequest: (message: string, address: string) => Promise<string>;
  onSignTypedDataRequest: (typedData: any, address: string) => Promise<string>;
  onChainSwitchRequest: (chainId: number) => Promise<void>;
}

export class Web3RequestHandler {
  private chainManager = getChainManager();
  private providerManager = getProviderManager();
  private callbacks: Web3RequestHandlerCallbacks;
  private currentAddress?: string;

  constructor(callbacks: Web3RequestHandlerCallbacks, address?: string) {
    this.callbacks = callbacks;
    this.currentAddress = address;
  }

  /**
   * Set current wallet address
   */
  setAddress(address: string): void {
    this.currentAddress = address;
  }

  /**
   * Handle Web3 request
   */
  async handleRequest(request: Web3Request): Promise<Web3Response> {
    try {
      const result = await this.processRequest(request);
      return {
        id: request.id,
        result,
      };
    } catch (error: any) {
      console.error('Web3 request error:', error);
      return {
        id: request.id,
        error: {
          code: error.code || 4001,
          message: error.message || 'Request failed',
        },
      };
    }
  }

  /**
   * Process Web3 request based on method
   */
  private async processRequest(request: Web3Request): Promise<any> {
    const { method, params = [] } = request;

    switch (method) {
      case 'eth_requestAccounts':
        return this.handleRequestAccounts();

      case 'eth_accounts':
        return this.handleAccounts();

      case 'eth_chainId':
        return this.handleChainId();

      case 'eth_sendTransaction':
        return this.handleSendTransaction(params[0]);

      case 'eth_signTransaction':
        return this.handleSignTransaction(params[0]);

      case 'eth_sign':
        return this.handleSign(params[0], params[1]);

      case 'personal_sign':
        return this.handlePersonalSign(params[0], params[1]);

      case 'eth_signTypedData':
      case 'eth_signTypedData_v4':
        return this.handleSignTypedData(params[0], params[1]);

      case 'wallet_switchEthereumChain':
        return this.handleSwitchChain(params[0]);

      case 'wallet_addEthereumChain':
        return this.handleAddChain(params[0]);

      default:
        // Forward other requests to provider
        return this.forwardToProvider(method, params);
    }
  }

  /**
   * Handle eth_requestAccounts
   */
  private async handleRequestAccounts(): Promise<string[]> {
    if (!this.currentAddress) {
      throw new Web3RequestHandlerError('No account available', 4100);
    }
    return [this.currentAddress];
  }

  /**
   * Handle eth_accounts
   */
  private async handleAccounts(): Promise<string[]> {
    return this.currentAddress ? [this.currentAddress] : [];
  }

  /**
   * Handle eth_chainId
   */
  private async handleChainId(): Promise<string> {
    const chainId = this.chainManager.getChainId();
    return '0x' + chainId.toString(16);
  }

  /**
   * Handle eth_sendTransaction
   */
  private async handleSendTransaction(txParams: TransactionRequest): Promise<string> {
    if (!this.currentAddress) {
      throw new Web3RequestHandlerError('No account selected', 4100);
    }

    // Ensure from address matches current address
    if (txParams.from && txParams.from.toLowerCase() !== this.currentAddress.toLowerCase()) {
      throw new Web3RequestHandlerError('Transaction from address mismatch', 4100);
    }

    // Request user approval and send transaction
    const txHash = await this.callbacks.onTransactionRequest({
      ...txParams,
      from: this.currentAddress,
    });

    return txHash;
  }

  /**
   * Handle eth_signTransaction
   */
  private async handleSignTransaction(txParams: TransactionRequest): Promise<string> {
    if (!this.currentAddress) {
      throw new Web3RequestHandlerError('No account selected', 4100);
    }

    const txHash = await this.callbacks.onTransactionRequest({
      ...txParams,
      from: this.currentAddress,
    });

    return txHash;
  }

  /**
   * Handle eth_sign
   */
  private async handleSign(address: string, message: string): Promise<string> {
    if (!this.currentAddress || address.toLowerCase() !== this.currentAddress.toLowerCase()) {
      throw new Web3RequestHandlerError('Address mismatch', 4100);
    }

    return this.callbacks.onSignRequest(message, address);
  }

  /**
   * Handle personal_sign
   */
  private async handlePersonalSign(message: string, address: string): Promise<string> {
    if (!this.currentAddress || address.toLowerCase() !== this.currentAddress.toLowerCase()) {
      throw new Web3RequestHandlerError('Address mismatch', 4100);
    }

    return this.callbacks.onSignRequest(message, address);
  }

  /**
   * Handle eth_signTypedData
   */
  private async handleSignTypedData(address: string, typedData: any): Promise<string> {
    if (!this.currentAddress || address.toLowerCase() !== this.currentAddress.toLowerCase()) {
      throw new Web3RequestHandlerError('Address mismatch', 4100);
    }

    return this.callbacks.onSignTypedDataRequest(typedData, address);
  }

  /**
   * Handle wallet_switchEthereumChain
   */
  private async handleSwitchChain(params: { chainId: string }): Promise<null> {
    const chainId = parseInt(params.chainId, 16);

    if (!this.chainManager.isChainSupported(chainId)) {
      throw new Web3RequestHandlerError('Chain not supported', 4902);
    }

    await this.callbacks.onChainSwitchRequest(chainId);
    return null;
  }

  /**
   * Handle wallet_addEthereumChain
   */
  private async handleAddChain(params: any): Promise<null> {
    // For now, reject adding custom chains
    throw new Web3RequestHandlerError('Adding custom chains not supported', 4902);
  }

  /**
   * Forward request to provider
   */
  private async forwardToProvider(method: string, params: any[]): Promise<any> {
    const provider = this.providerManager.getCurrentProvider();

    // Forward the request using the provider's call method
    return provider.call(method, params);
  }
}

export default Web3RequestHandler;
