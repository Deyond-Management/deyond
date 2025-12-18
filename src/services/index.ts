/**
 * Services Index
 * Export all services organized by category
 */

// Base Services
export { BaseService, ServiceStatus } from './base/BaseService';
export { AppError as BaseAppError } from './base/AppError';
export { CacheManager } from './base/CacheManager';
export { BaseHttpClient } from './base/BaseHttpClient';

// Blockchain Services
export { BalanceService, balanceService } from './blockchain/BalanceService';
export { default as GasService } from './blockchain/GasService';
export { default as TransactionService } from './blockchain/TransactionService';
export { default as EthereumProvider } from './blockchain/EthereumProvider';
export { default as ContractSecurityService } from './blockchain/ContractSecurityService';
export { default as ENSService } from './blockchain/ENSService';
export { default as NFTService } from './blockchain/NFTService';

// Wallet Services
export { SecureStorageService } from './wallet/SecureStorageService';
export { default as CryptoService } from './wallet/CryptoService';
export { default as WalletService } from './wallet/WalletService';
export { default as HardwareWalletService } from './wallet/HardwareWalletService';

// WalletConnect Services
export {
  default as WalletConnectService,
  getWalletConnectService,
} from './walletconnect/WalletConnectService';

// Swap Services
export { default as SwapService, getSwapService } from './swap/SwapService';

// DApp Services
export { getWeb3ProviderScript } from './dapp/Web3ProviderInjection';
export { default as Web3RequestHandler } from './dapp/Web3RequestHandler';

// NFT Services
export { default as NFTServiceFromNFT } from './nft/NFTService';

// Multi-chain Support
export { getChainManager } from './blockchain/ChainManager';
export { getProviderManager } from './blockchain/ProviderManager';

// Error Handling
export { getErrorReporter } from './error/ErrorReporter';

// Monitoring Services
export { default as AnalyticsService } from './monitoring/AnalyticsService';
export { default as ErrorMonitoringService } from './monitoring/ErrorMonitoringService';
export { default as FeatureFlagService } from './monitoring/FeatureFlagService';

// External Services
export { default as ApiClient } from './external/ApiClient';
export { BackendSyncService } from './external/BackendSyncService';
export { default as NetworkService } from './external/NetworkService';
export { default as PriceService } from './external/PriceService';

// UI Services
export { default as AlertService } from './ui/AlertService';
export { default as HapticService } from './ui/HapticService';
export { default as PushNotificationService } from './ui/PushNotificationService';

// Communication Services
export { ChatService } from './communication/ChatService';
export { BLEService } from './communication/BLEService';

// Encrypted Messaging Services (DeyondCrypt)
export {
  DeyondCryptService,
  getDeyondCryptService,
  DeyondCryptPreKeyStore,
  DeyondCryptSessionStore,
  DeyondCryptGroupSessionStore,
  MessageStore,
  getMessageStore,
} from './messaging';
export type {
  Contact as DeyondCryptContact,
  DecryptedMessage,
  EncryptedMessageResult,
  GroupInfo as DeyondCryptGroupInfo,
  StoredMessage,
  StoredSession,
} from './messaging';

// Security Services
export { default as SecurityService } from './security/SecurityService';
export { default as PrivacyComplianceService } from './security/PrivacyComplianceService';
export { ErrorService, AppError, ErrorType } from './security/ErrorService';

// Support Services
export { default as SupportService } from './support/SupportService';
export { default as QATestService } from './support/QATestService';
export { default as DeepLinkService } from './support/DeepLinkService';

// Types
export type { ChatSession, ChatMessage } from './communication/ChatService';
export type { BLEDevice, ConnectionStatus, SignalStrength } from './communication/BLEService';
