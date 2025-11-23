/**
 * NetworkSelectorModal Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { NetworkSelectorModal } from '../../components/organisms/NetworkSelectorModal';
import { renderWithProviders } from '../utils/testUtils';

// Mock networks
const mockNetworks = [
  {
    id: 'ethereum-mainnet',
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/',
    symbol: 'ETH',
    blockExplorer: 'https://etherscan.io',
    isTestnet: false,
  },
  {
    id: 'goerli',
    name: 'Goerli Testnet',
    chainId: 5,
    rpcUrl: 'https://goerli.infura.io/v3/',
    symbol: 'ETH',
    blockExplorer: 'https://goerli.etherscan.io',
    isTestnet: true,
  },
  {
    id: 'polygon-mainnet',
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    symbol: 'MATIC',
    blockExplorer: 'https://polygonscan.com',
    isTestnet: false,
  },
];

// Mock callbacks
const mockOnSelect = jest.fn();
const mockOnClose = jest.fn();

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
          onSelect={mockOnSelect}
          onClose={mockOnClose}
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
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      expect(queryByText('Select Network')).toBeNull();
    });

    it('should render all network options', () => {
      const { getByText } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      expect(getByText('Ethereum Mainnet')).toBeDefined();
      expect(getByText('Goerli Testnet')).toBeDefined();
      expect(getByText('Polygon')).toBeDefined();
    });

    it('should show selected network indicator', () => {
      const { getByTestId } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      expect(getByTestId('network-selected-ethereum-mainnet')).toBeDefined();
    });

    it('should display network symbols', () => {
      const { getAllByText, getByText } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      // ETH appears twice (Ethereum Mainnet and Goerli)
      expect(getAllByText('ETH').length).toBe(2);
      expect(getByText('MATIC')).toBeDefined();
    });
  });

  describe('Interactions', () => {
    it('should call onSelect when network is pressed', () => {
      const { getByText } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
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
          onSelect={mockOnSelect}
          onClose={mockOnClose}
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
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      fireEvent.press(getByTestId('modal-backdrop'));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Testnet Indicator', () => {
    it('should show testnet badge for test networks', () => {
      const { getByText } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      expect(getByText('Testnet')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible network options', () => {
      const { getByLabelText } = renderWithTheme(
        <NetworkSelectorModal
          visible={true}
          networks={mockNetworks}
          selectedNetworkId="ethereum-mainnet"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      expect(getByLabelText('Ethereum Mainnet')).toBeDefined();
    });
  });
});
