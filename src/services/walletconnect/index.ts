/**
 * WalletConnect Module
 * Exports all WalletConnect-related services
 */

// Core WalletConnect v2 service (production)
export {
  default as WalletConnectCore,
  getWalletConnectCore,
  WCEvent,
  WC_ERROR_CODES,
  DEFAULT_CHAINS,
  DEFAULT_METHODS,
  DEFAULT_EVENTS,
} from './WalletConnectCore';

// Request handler
export {
  default as WalletConnectRequestHandler,
  getWalletConnectRequestHandler,
} from './WalletConnectRequestHandler';
export type {
  RequestHandlerResult,
  SigningCallbacks,
  AddChainParams,
} from './WalletConnectRequestHandler';

// Legacy service (for backward compatibility)
export {
  WalletConnectService,
  WalletConnectServiceError,
  getWalletConnectService,
} from './WalletConnectService';
export type { WalletConnectCallbacks } from './WalletConnectService';

// Error handling
export {
  WalletConnectErrorHandler,
  WalletConnectError,
  WalletConnectErrorCode,
} from './WalletConnectErrorHandler';
