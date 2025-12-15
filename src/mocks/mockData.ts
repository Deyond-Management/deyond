/**
 * Mock Data for Demo Mode
 * Provides sample data when backend is unavailable
 */

export interface TokenBalance {
  id: string;
  symbol: string;
  name: string;
  balance: string;
  balanceUSD: number;
  price: number;
  priceChange24h: number;
  logo: string;
  network: string;
}

export interface Transaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  valueUSD: number;
  symbol: string;
  type: 'send' | 'receive' | 'swap';
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  network: string;
  gasUsed: string;
  gasFee: string;
  gasFeeUSD: number;
}

// Mock Wallet Address
export const MOCK_WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

// Mock Token Balances
export const MOCK_TOKEN_BALANCES: TokenBalance[] = [
  {
    id: '1',
    symbol: 'ETH',
    name: 'Ethereum',
    balance: '2.5',
    balanceUSD: 5000.0,
    price: 2000.0,
    priceChange24h: 2.5,
    logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    network: 'ethereum',
  },
  {
    id: '2',
    symbol: 'USDC',
    name: 'USD Coin',
    balance: '1000.0',
    balanceUSD: 1000.0,
    price: 1.0,
    priceChange24h: 0.01,
    logo: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
    network: 'ethereum',
  },
  {
    id: '3',
    symbol: 'USDT',
    name: 'Tether',
    balance: '500.0',
    balanceUSD: 500.0,
    price: 1.0,
    priceChange24h: -0.02,
    logo: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    network: 'ethereum',
  },
  {
    id: '4',
    symbol: 'MATIC',
    name: 'Polygon',
    balance: '1500.0',
    balanceUSD: 1200.0,
    price: 0.8,
    priceChange24h: 5.2,
    logo: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
    network: 'polygon',
  },
];

// Mock Transactions
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '0x1234...5678',
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    from: MOCK_WALLET_ADDRESS,
    to: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    value: '0.5',
    valueUSD: 1000.0,
    symbol: 'ETH',
    type: 'send',
    status: 'completed',
    timestamp: Date.now() - 3600000, // 1 hour ago
    network: 'ethereum',
    gasUsed: '21000',
    gasFee: '0.001',
    gasFeeUSD: 2.0,
  },
  {
    id: '0x2345...6789',
    hash: '0x2345678901bcdef1234567890abcdef1234567890abcdef1234567890abcdef1',
    from: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    to: MOCK_WALLET_ADDRESS,
    value: '100',
    valueUSD: 100.0,
    symbol: 'USDC',
    type: 'receive',
    status: 'completed',
    timestamp: Date.now() - 7200000, // 2 hours ago
    network: 'ethereum',
    gasUsed: '65000',
    gasFee: '0.0015',
    gasFeeUSD: 3.0,
  },
  {
    id: '0x3456...7890',
    hash: '0x3456789012cdef1234567890abcdef1234567890abcdef1234567890abcdef12',
    from: MOCK_WALLET_ADDRESS,
    to: '0x1234567890abcdef1234567890abcdef12345678',
    value: '0.1',
    valueUSD: 200.0,
    symbol: 'ETH',
    type: 'send',
    status: 'pending',
    timestamp: Date.now() - 300000, // 5 minutes ago
    network: 'ethereum',
    gasUsed: '21000',
    gasFee: '0.0008',
    gasFeeUSD: 1.6,
  },
];

// Mock NFTs
export const MOCK_NFTS = [
  {
    id: '1',
    name: 'Bored Ape #1234',
    collection: 'Bored Ape Yacht Club',
    image: 'https://via.placeholder.com/300x300/FF6B35/FFFFFF?text=BAYC',
    description: 'A rare Bored Ape from the Yacht Club',
    tokenId: '1234',
    contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
    network: 'ethereum',
  },
  {
    id: '2',
    name: 'CryptoPunk #5678',
    collection: 'CryptoPunks',
    image: 'https://via.placeholder.com/300x300/4ECDC4/FFFFFF?text=PUNK',
    description: 'An original CryptoPunk',
    tokenId: '5678',
    contractAddress: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
    network: 'ethereum',
  },
];

// Mock Gas Prices
export const MOCK_GAS_PRICES = {
  baseFee: 25,
  slow: {
    maxFeePerGas: 30,
    maxPriorityFeePerGas: 1,
    estimatedTime: 180, // 3 minutes
  },
  standard: {
    maxFeePerGas: 35,
    maxPriorityFeePerGas: 2,
    estimatedTime: 60, // 1 minute
  },
  fast: {
    maxFeePerGas: 45,
    maxPriorityFeePerGas: 3,
    estimatedTime: 15, // 15 seconds
  },
};

// Mock Price Data
export const MOCK_PRICE_DATA = {
  ethereum: {
    usd: 2000.0,
    usd_24h_change: 2.5,
    usd_market_cap: 240000000000,
  },
  polygon: {
    usd: 0.8,
    usd_24h_change: 5.2,
    usd_market_cap: 7200000000,
  },
};

// Mock Contacts
export const MOCK_CONTACTS = [
  {
    id: '1',
    name: 'Alice',
    address: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    ens: 'alice.eth',
    avatar: 'https://via.placeholder.com/100/FF6B35',
  },
  {
    id: '2',
    name: 'Bob',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    ens: 'bob.eth',
    avatar: 'https://via.placeholder.com/100/4ECDC4',
  },
  {
    id: '3',
    name: 'Charlie',
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    ens: null,
    avatar: 'https://via.placeholder.com/100/44AF69',
  },
];

export default {
  MOCK_WALLET_ADDRESS,
  MOCK_TOKEN_BALANCES,
  MOCK_TRANSACTIONS,
  MOCK_NFTS,
  MOCK_GAS_PRICES,
  MOCK_PRICE_DATA,
  MOCK_CONTACTS,
};
