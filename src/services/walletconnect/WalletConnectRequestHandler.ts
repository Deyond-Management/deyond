/**
 * WalletConnectRequestHandler
 * Handles WalletConnect session requests and produces responses
 */

import { ethers } from 'ethers';
import { WalletConnectRequest } from '../../types/walletconnect';
import { getWalletConnectCore, WC_ERROR_CODES } from './WalletConnectCore';

/**
 * Request handler result
 */
export interface RequestHandlerResult {
  success: boolean;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Signing callbacks that the app must provide
 */
export interface SigningCallbacks {
  signTransaction: (tx: ethers.TransactionRequest) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  signTypedData: (domain: any, types: any, value: any) => Promise<string>;
  sendTransaction: (tx: ethers.TransactionRequest) => Promise<string>;
  getCurrentAddress: () => string;
  getCurrentChainId: () => number;
  switchChain: (chainId: number) => Promise<boolean>;
  addChain: (chainParams: AddChainParams) => Promise<boolean>;
}

/**
 * Add chain parameters
 */
export interface AddChainParams {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[];
}

/**
 * Request handler class
 */
class WalletConnectRequestHandler {
  private callbacks: SigningCallbacks | null = null;

  /**
   * Set signing callbacks
   */
  setCallbacks(callbacks: SigningCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Handle incoming request
   */
  async handleRequest(request: WalletConnectRequest): Promise<RequestHandlerResult> {
    if (!this.callbacks) {
      return {
        success: false,
        error: {
          code: WC_ERROR_CODES.INTERNAL_ERROR,
          message: 'Request handler not configured',
        },
      };
    }

    const { method, params } = request;

    try {
      switch (method) {
        case 'eth_sendTransaction':
          return await this.handleSendTransaction(params);

        case 'eth_signTransaction':
          return await this.handleSignTransaction(params);

        case 'eth_sign':
          return await this.handleEthSign(params);

        case 'personal_sign':
          return await this.handlePersonalSign(params);

        case 'eth_signTypedData':
        case 'eth_signTypedData_v3':
        case 'eth_signTypedData_v4':
          return await this.handleSignTypedData(params, method);

        case 'wallet_switchEthereumChain':
          return await this.handleSwitchChain(params);

        case 'wallet_addEthereumChain':
          return await this.handleAddChain(params);

        case 'eth_accounts':
          return this.handleGetAccounts();

        case 'eth_chainId':
          return this.handleGetChainId();

        case 'eth_requestAccounts':
          return this.handleGetAccounts();

        case 'wallet_getPermissions':
          return this.handleGetPermissions();

        case 'wallet_requestPermissions':
          return this.handleRequestPermissions(params);

        default:
          return {
            success: false,
            error: {
              code: WC_ERROR_CODES.UNSUPPORTED_METHOD,
              message: `Method ${method} is not supported`,
            },
          };
      }
    } catch (error: any) {
      console.error(`[WCRequestHandler] Error handling ${method}:`, error);
      return {
        success: false,
        error: {
          code: WC_ERROR_CODES.INTERNAL_ERROR,
          message: error.message || 'Internal error',
        },
      };
    }
  }

  /**
   * Handle eth_sendTransaction
   */
  private async handleSendTransaction(params: any[]): Promise<RequestHandlerResult> {
    const txParams = params[0];

    // Validate transaction
    const validation = this.validateTransaction(txParams);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: WC_ERROR_CODES.INVALID_PARAMS,
          message: validation.message,
        },
      };
    }

    // Build transaction request
    const tx: ethers.TransactionRequest = {
      from: txParams.from,
      to: txParams.to,
      value: txParams.value ? BigInt(txParams.value) : undefined,
      data: txParams.data,
      gasLimit: txParams.gas ? BigInt(txParams.gas) : undefined,
      gasPrice: txParams.gasPrice ? BigInt(txParams.gasPrice) : undefined,
      maxFeePerGas: txParams.maxFeePerGas ? BigInt(txParams.maxFeePerGas) : undefined,
      maxPriorityFeePerGas: txParams.maxPriorityFeePerGas
        ? BigInt(txParams.maxPriorityFeePerGas)
        : undefined,
      nonce: txParams.nonce ? Number(txParams.nonce) : undefined,
    };

    const txHash = await this.callbacks!.sendTransaction(tx);

    return {
      success: true,
      result: txHash,
    };
  }

  /**
   * Handle eth_signTransaction
   */
  private async handleSignTransaction(params: any[]): Promise<RequestHandlerResult> {
    const txParams = params[0];

    const validation = this.validateTransaction(txParams);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: WC_ERROR_CODES.INVALID_PARAMS,
          message: validation.message,
        },
      };
    }

    const tx: ethers.TransactionRequest = {
      from: txParams.from,
      to: txParams.to,
      value: txParams.value ? BigInt(txParams.value) : undefined,
      data: txParams.data,
      gasLimit: txParams.gas ? BigInt(txParams.gas) : undefined,
      gasPrice: txParams.gasPrice ? BigInt(txParams.gasPrice) : undefined,
      nonce: txParams.nonce ? Number(txParams.nonce) : undefined,
    };

    const signedTx = await this.callbacks!.signTransaction(tx);

    return {
      success: true,
      result: signedTx,
    };
  }

  /**
   * Handle eth_sign (deprecated but still used)
   */
  private async handleEthSign(params: any[]): Promise<RequestHandlerResult> {
    const [address, message] = params;

    // Validate address matches current wallet
    const currentAddress = this.callbacks!.getCurrentAddress();
    if (address.toLowerCase() !== currentAddress.toLowerCase()) {
      return {
        success: false,
        error: {
          code: WC_ERROR_CODES.UNAUTHORIZED,
          message: 'Address does not match connected wallet',
        },
      };
    }

    // eth_sign expects raw data (dangerous!)
    const signature = await this.callbacks!.signMessage(message);

    return {
      success: true,
      result: signature,
    };
  }

  /**
   * Handle personal_sign
   */
  private async handlePersonalSign(params: any[]): Promise<RequestHandlerResult> {
    // personal_sign params: [message, address]
    const [message, address] = params;

    // Validate address
    const currentAddress = this.callbacks!.getCurrentAddress();
    if (address.toLowerCase() !== currentAddress.toLowerCase()) {
      return {
        success: false,
        error: {
          code: WC_ERROR_CODES.UNAUTHORIZED,
          message: 'Address does not match connected wallet',
        },
      };
    }

    // Decode hex message if needed
    let messageToSign = message;
    if (message.startsWith('0x')) {
      try {
        messageToSign = ethers.toUtf8String(message);
      } catch {
        // Keep as hex if not valid UTF-8
        messageToSign = message;
      }
    }

    const signature = await this.callbacks!.signMessage(messageToSign);

    return {
      success: true,
      result: signature,
    };
  }

  /**
   * Handle eth_signTypedData variants
   */
  private async handleSignTypedData(params: any[], method: string): Promise<RequestHandlerResult> {
    let address: string;
    let typedData: any;

    // Parameter order differs between versions
    if (method === 'eth_signTypedData') {
      // Legacy: [typedData, address]
      [typedData, address] = params;
    } else {
      // V3/V4: [address, typedData]
      [address, typedData] = params;
    }

    // Parse typed data if string
    if (typeof typedData === 'string') {
      try {
        typedData = JSON.parse(typedData);
      } catch {
        return {
          success: false,
          error: {
            code: WC_ERROR_CODES.INVALID_PARAMS,
            message: 'Invalid typed data format',
          },
        };
      }
    }

    // Validate address
    const currentAddress = this.callbacks!.getCurrentAddress();
    if (address.toLowerCase() !== currentAddress.toLowerCase()) {
      return {
        success: false,
        error: {
          code: WC_ERROR_CODES.UNAUTHORIZED,
          message: 'Address does not match connected wallet',
        },
      };
    }

    // Extract domain, types, and value
    const { domain, types, message, primaryType } = typedData;

    // Remove EIP712Domain from types (ethers handles this)
    const filteredTypes = { ...types };
    delete filteredTypes.EIP712Domain;

    const signature = await this.callbacks!.signTypedData(domain, filteredTypes, message);

    return {
      success: true,
      result: signature,
    };
  }

  /**
   * Handle wallet_switchEthereumChain
   */
  private async handleSwitchChain(params: any[]): Promise<RequestHandlerResult> {
    const { chainId } = params[0];
    const chainIdNumber = parseInt(chainId, 16);

    const success = await this.callbacks!.switchChain(chainIdNumber);

    if (success) {
      return { success: true, result: null };
    } else {
      return {
        success: false,
        error: {
          code: WC_ERROR_CODES.CHAIN_NOT_SUPPORTED,
          message: `Chain ${chainId} is not supported`,
        },
      };
    }
  }

  /**
   * Handle wallet_addEthereumChain
   */
  private async handleAddChain(params: any[]): Promise<RequestHandlerResult> {
    const chainParams = params[0] as AddChainParams;

    const success = await this.callbacks!.addChain(chainParams);

    if (success) {
      return { success: true, result: null };
    } else {
      return {
        success: false,
        error: {
          code: WC_ERROR_CODES.USER_REJECTED,
          message: 'User rejected adding the chain',
        },
      };
    }
  }

  /**
   * Handle eth_accounts / eth_requestAccounts
   */
  private handleGetAccounts(): RequestHandlerResult {
    const address = this.callbacks!.getCurrentAddress();
    return {
      success: true,
      result: address ? [address] : [],
    };
  }

  /**
   * Handle eth_chainId
   */
  private handleGetChainId(): RequestHandlerResult {
    const chainId = this.callbacks!.getCurrentChainId();
    return {
      success: true,
      result: `0x${chainId.toString(16)}`,
    };
  }

  /**
   * Handle wallet_getPermissions
   */
  private handleGetPermissions(): RequestHandlerResult {
    return {
      success: true,
      result: [
        {
          parentCapability: 'eth_accounts',
          date: Date.now(),
        },
      ],
    };
  }

  /**
   * Handle wallet_requestPermissions
   */
  private handleRequestPermissions(params: any[]): RequestHandlerResult {
    // Grant all requested permissions
    const permissions = params[0];
    const grantedPermissions = Object.keys(permissions).map(key => ({
      parentCapability: key,
      date: Date.now(),
    }));

    return {
      success: true,
      result: grantedPermissions,
    };
  }

  /**
   * Validate transaction parameters
   */
  private validateTransaction(tx: any): { valid: boolean; message: string } {
    if (!tx) {
      return { valid: false, message: 'Transaction is required' };
    }

    if (!tx.from) {
      return { valid: false, message: 'From address is required' };
    }

    if (!ethers.isAddress(tx.from)) {
      return { valid: false, message: 'Invalid from address' };
    }

    if (tx.to && !ethers.isAddress(tx.to)) {
      return { valid: false, message: 'Invalid to address' };
    }

    // Validate from address matches current wallet
    const currentAddress = this.callbacks!.getCurrentAddress();
    if (tx.from.toLowerCase() !== currentAddress.toLowerCase()) {
      return { valid: false, message: 'From address does not match wallet' };
    }

    return { valid: true, message: '' };
  }

  /**
   * Process and auto-respond to a request
   */
  async processRequest(request: WalletConnectRequest): Promise<void> {
    const wcCore = getWalletConnectCore();
    const result = await this.handleRequest(request);

    if (result.success) {
      await wcCore.respondSuccess(request.topic, request.id, result.result);
    } else {
      await wcCore.respondError(
        request.topic,
        request.id,
        result.error!.code,
        result.error!.message
      );
    }
  }
}

// Singleton instance
let requestHandlerInstance: WalletConnectRequestHandler | null = null;

export const getWalletConnectRequestHandler = (): WalletConnectRequestHandler => {
  if (!requestHandlerInstance) {
    requestHandlerInstance = new WalletConnectRequestHandler();
  }
  return requestHandlerInstance;
};

export default WalletConnectRequestHandler;
