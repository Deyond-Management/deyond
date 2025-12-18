/**
 * NetworkSelectorModal Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { NetworkSelectorModal } from '../../components/organisms/NetworkSelectorModal';
import { renderWithProviders } from '../utils/testUtils';
import { Network } from '../../types/wallet';

// Mock networks with new multi-chain format
const mockNetworks: Network[] = [
  {
    id: 'ethereum-mainnet',
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/',
    currencySymbol: 'ETH',
    blockExplorerUrl: 'https://etherscan.io',
    isTestnet: false,
    networkType: 'evm',
    decimals: 18,
    coinType: 60,
  },
  {
    id: 'sepolia',
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: 'https://rpc.sepolia.org',
    currencySymbol: 'ETH',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
    networkType: 'evm',
    decimals: 18,
    coinType: 60,
  },
  {
    id: 'polygon-mainnet',
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    currencySymbol: 'MATIC',
    blockExplorerUrl: 'https://polygonscan.com',
    isTestnet: false,
    networkType: 'evm',
    decimals: 18,
    coinType: 60,
  },
  {
    id: 'solana-mainnet',
    name: 'Solana',
    chainId: 'mainnet-beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    currencySymbol: 'SOL',
    blockExplorerUrl: 'https://solscan.io',
    isTestnet: false,
    networkType: 'solana',
    decimals: 9,
    coinType: 501,
  },
  {
    id: 'bitcoin-mainnet',
    name: 'Bitcoin',
    chainId: 'mainnet',
    rpcUrl: 'https://blockstream.info/api',
    currencySymbol: 'BTC',
    blockExplorerUrl: 'https://blockstream.info',
    isTestnet: false,
    networkType: 'bitcoin',
    decimals: 8,
    coinType: 0,
  },
];

// Mock callbacks
const mockOnSelect = jest.fn();
const mockOnClose = jest.fn();
const mockOnToggleTestnets = jest.fn();

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return renderWithProviders(component);
};

describe('NetworkSelectorModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when visible', () => {
      const { getByText } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          showTestnets={false}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onToggleTestnets={mockOnToggleTestnets}
        />
      );

      expect(getByText('Select Network')).toBeDefined();
    });

    it('should not render content when not visible', () => {
      const { queryByText } = renderWithTheme(
        <NetworkSelectorModal
          visible={false}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          showTestnets={false}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onToggleTestnets={mockOnToggleTestnets}
        />
      );

      expect(queryByText('Select Network')).toBeNull();
    });

    it('should render mainnet network options when showTestnets is false', () => {
      const { getByText, getAllByText, queryByText } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          showTestnets={false}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onToggleTestnets={mockOnToggleTestnets}
        />
      );

      expect(getByText('Ethereum Mainnet')).toBeDefined();
      expect(getByText('Polygon')).toBeDefined();
      // Solana/Bitcoin appear in both group header and network name
      expect(getAllByText('Solana').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('Bitcoin').length).toBeGreaterThanOrEqual(1);
      expect(queryByText('Sepolia Testnet')).toBeNull();
    });

    it('should render all networks including testnets when showTestnets is true', () => {
      const { getByText } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          showTestnets={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onToggleTestnets={mockOnToggleTestnets}
        />
      );

      expect(getByText('Ethereum Mainnet')).toBeDefined();
      expect(getByText('Sepolia Testnet')).toBeDefined();
      expect(getByText('Polygon')).toBeDefined();
    });

    it('should show selected network indicator', () => {
      const { getByTestId } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          showTestnets={false}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onToggleTestnets={mockOnToggleTestnets}
        />
      );

      expect(getByTestId('network-selected-ethereum-mainnet')).toBeDefined();
    });

    it('should display network symbols', () => {
      const { getByText, getAllByText } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          showTestnets={false}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onToggleTestnets={mockOnToggleTestnets}
        />
      );

      expect(getByText('ETH')).toBeDefined();
      expect(getByText('MATIC')).toBeDefined();
      // SOL and BTC appear in both type badge and currencySymbol
      expect(getAllByText('SOL').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('BTC').length).toBeGreaterThanOrEqual(1);
    });

    it('should render network type badges', () => {
      const { getAllByText } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          showTestnets={false}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onToggleTestnets={mockOnToggleTestnets}
        />
      );

      // EVM badge appears twice (Ethereum and Polygon)
      expect(getAllByText('EVM').length).toBeGreaterThanOrEqual(2);
      // SOL and BTC appear in both type badge and currencySymbol
      expect(getAllByText('SOL').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('BTC').length).toBeGreaterThanOrEqual(1);
    });

    it('should render network group headers', () => {
      const { getByText, getAllByText } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          showTestnets={false}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onToggleTestnets={mockOnToggleTestnets}
        />
      );

      // Group headers use textTransform: uppercase, but getByText uses raw text
      expect(getByText('EVM Networks')).toBeDefined();
      // Solana and Bitcoin appear in both header and network name
      expect(getAllByText('Solana').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('Bitcoin').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Interactions', () => {
    it('should call onSelect when network is pressed', () => {
      const { getByText } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          showTestnets={false}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onToggleTestnets={mockOnToggleTestnets}
        />
      );

      fireEvent.press(getByText('Polygon'));

      expect(mockOnSelect).toHaveBeenCalledWith(mockNetworks[2]);
    });

    it('should call onClose when close button is pressed', () => {
      const { getByTestId } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          showTestnets={false}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onToggleTestnets={mockOnToggleTestnets}
        />
      );

      fireEvent.press(getByTestId('close-button'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is pressed', () => {
      const { getByTestId } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          showTestnets={false}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onToggleTestnets={mockOnToggleTestnets}
        />
      );

      fireEvent.press(getByTestId('modal-backdrop'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onToggleTestnets when toggle is pressed', () => {
      const { getByTestId } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          showTestnets={false}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onToggleTestnets={mockOnToggleTestnets}
        />
      );

      fireEvent(getByTestId('testnet-toggle'), 'valueChange', true);

      expect(mockOnToggleTestnets).toHaveBeenCalled();
    });
  });

  describe('Testnet Indicator', () => {
    it('should show testnet badge for test networks when showTestnets is true', () => {
      const { getByText } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          showTestnets={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onToggleTestnets={mockOnToggleTestnets}
        />
      );

      expect(getByText('Testnet')).toBeDefined();
    });

    it('should render testnet toggle switch', () => {
      const { getByText, getByTestId } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          showTestnets={false}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onToggleTestnets={mockOnToggleTestnets}
        />
      );

      expect(getByText('Show Testnets')).toBeDefined();
      expect(getByTestId('testnet-toggle')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible network options', () => {
      const { getByLabelText } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          showTestnets={false}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onToggleTestnets={mockOnToggleTestnets}
        />
      );

      expect(getByLabelText('Ethereum Mainnet network')).toBeDefined();
    });
  });

  describe('Multi-chain support', () => {
    it('should support Solana network selection', () => {
      const { getByLabelText } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          showTestnets={false}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onToggleTestnets={mockOnToggleTestnets}
        />
      );

      // Use accessibility label to target the network item, not the group header
      fireEvent.press(getByLabelText('Solana network'));

      expect(mockOnSelect).toHaveBeenCalledWith(mockNetworks[3]);
    });

    it('should support Bitcoin network selection', () => {
      const { getByLabelText } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          showTestnets={false}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onToggleTestnets={mockOnToggleTestnets}
        />
      );

      // Use accessibility label to target the network item, not the group header
      fireEvent.press(getByLabelText('Bitcoin network'));

      expect(mockOnSelect).toHaveBeenCalledWith(mockNetworks[4]);
    });
  });
});
