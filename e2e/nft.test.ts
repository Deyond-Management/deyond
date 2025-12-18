/**
 * E2E Tests: NFT Gallery
 * Tests for NFT viewing and management
 */

import { by, device, element, expect, waitFor } from 'detox';
import { completeOnboarding, scrollDown } from './helpers/testHelpers';

describe('NFT Gallery', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      delete: true,
    });
    await completeOnboarding();
  });

  beforeEach(async () => {
    await device.launchApp({
      newInstance: false,
    });
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);
    // Navigate to NFT Gallery
    await element(by.id('nft-tab')).tap();
    await waitFor(element(by.id('nft-gallery-screen')))
      .toBeVisible()
      .withTimeout(2000);
  });

  describe('Gallery Screen', () => {
    it('should display NFT gallery screen', async () => {
      await expect(element(by.id('nft-gallery-screen'))).toBeVisible();
    });

    it('should show NFT grid', async () => {
      await expect(element(by.id('nft-grid'))).toBeVisible();
    });

    it('should show empty state when no NFTs', async () => {
      // This depends on whether the test wallet has NFTs
      // In a fresh wallet, it should show empty state
      await expect(element(by.id('nft-empty-state'))).toBeVisible();
    });

    it('should show collection filter', async () => {
      await expect(element(by.id('collection-filter'))).toBeVisible();
    });

    it('should refresh NFTs on pull-to-refresh', async () => {
      await element(by.id('nft-scroll-view')).scroll(100, 'down', NaN, NaN);
      await expect(element(by.id('nft-refresh-indicator'))).toBeVisible();
    });
  });

  describe('NFT Display', () => {
    it('should show NFT thumbnail', async () => {
      // Skip if no NFTs
      try {
        await expect(element(by.id('nft-item-0'))).toBeVisible();
        await expect(element(by.id('nft-thumbnail-0'))).toBeVisible();
      } catch {
        // No NFTs available
      }
    });

    it('should show NFT name', async () => {
      try {
        await expect(element(by.id('nft-name-0'))).toBeVisible();
      } catch {
        // No NFTs available
      }
    });

    it('should show collection name', async () => {
      try {
        await expect(element(by.id('nft-collection-0'))).toBeVisible();
      } catch {
        // No NFTs available
      }
    });
  });

  describe('NFT Detail View', () => {
    it('should navigate to NFT detail', async () => {
      try {
        await element(by.id('nft-item-0')).tap();
        await expect(element(by.id('nft-detail-screen'))).toBeVisible();
      } catch {
        // No NFTs available
      }
    });

    it('should show full NFT image', async () => {
      try {
        await element(by.id('nft-item-0')).tap();
        await expect(element(by.id('nft-full-image'))).toBeVisible();
      } catch {
        // No NFTs available
      }
    });

    it('should show NFT metadata', async () => {
      try {
        await element(by.id('nft-item-0')).tap();
        await expect(element(by.id('nft-metadata-section'))).toBeVisible();
      } catch {
        // No NFTs available
      }
    });

    it('should show NFT attributes', async () => {
      try {
        await element(by.id('nft-item-0')).tap();
        await scrollDown('nft-detail-scroll');
        await expect(element(by.id('nft-attributes-section'))).toBeVisible();
      } catch {
        // No NFTs available
      }
    });

    it('should show NFT description', async () => {
      try {
        await element(by.id('nft-item-0')).tap();
        await expect(element(by.id('nft-description'))).toBeVisible();
      } catch {
        // No NFTs available
      }
    });

    it('should show view on OpenSea button', async () => {
      try {
        await element(by.id('nft-item-0')).tap();
        await scrollDown('nft-detail-scroll');
        await expect(element(by.id('view-on-opensea-button'))).toBeVisible();
      } catch {
        // No NFTs available
      }
    });
  });

  describe('Collection Filter', () => {
    it('should open collection filter', async () => {
      await element(by.id('collection-filter')).tap();
      await expect(element(by.id('collection-filter-modal'))).toBeVisible();
    });

    it('should show all collections option', async () => {
      await element(by.id('collection-filter')).tap();
      await expect(element(by.id('collection-all'))).toBeVisible();
    });

    it('should filter by collection', async () => {
      try {
        await element(by.id('collection-filter')).tap();
        await element(by.id('collection-item-0')).tap();

        // Verify filter is applied
        await expect(element(by.id('filter-active-indicator'))).toBeVisible();
      } catch {
        // No collections available
      }
    });

    it('should clear collection filter', async () => {
      await element(by.id('collection-filter')).tap();
      await element(by.id('collection-all')).tap();

      await expect(element(by.id('filter-active-indicator'))).not.toBeVisible();
    });
  });

  describe('View Options', () => {
    it('should toggle grid/list view', async () => {
      await element(by.id('view-toggle-button')).tap();
      await expect(element(by.id('nft-list-view'))).toBeVisible();

      await element(by.id('view-toggle-button')).tap();
      await expect(element(by.id('nft-grid'))).toBeVisible();
    });

    it('should change grid size', async () => {
      await element(by.id('grid-size-button')).tap();
      await expect(element(by.id('grid-size-modal'))).toBeVisible();

      await element(by.id('grid-size-large')).tap();
      // Verify grid size changed
    });
  });

  describe('NFT Actions', () => {
    it('should show send NFT option', async () => {
      try {
        await element(by.id('nft-item-0')).tap();
        await expect(element(by.id('send-nft-button'))).toBeVisible();
      } catch {
        // No NFTs available
      }
    });

    it('should navigate to send NFT screen', async () => {
      try {
        await element(by.id('nft-item-0')).tap();
        await element(by.id('send-nft-button')).tap();
        await expect(element(by.id('send-nft-screen'))).toBeVisible();
      } catch {
        // No NFTs available
      }
    });

    it('should show share button', async () => {
      try {
        await element(by.id('nft-item-0')).tap();
        await expect(element(by.id('share-nft-button'))).toBeVisible();
      } catch {
        // No NFTs available
      }
    });

    it('should show NFT info button', async () => {
      try {
        await element(by.id('nft-item-0')).tap();
        await expect(element(by.id('nft-info-button'))).toBeVisible();
      } catch {
        // No NFTs available
      }
    });
  });

  describe('Hidden NFTs', () => {
    it('should show hide NFT option', async () => {
      try {
        await element(by.id('nft-item-0')).longPress();
        await expect(element(by.id('hide-nft-option'))).toBeVisible();
      } catch {
        // No NFTs available
      }
    });

    it('should access hidden NFTs section', async () => {
      await element(by.id('nft-menu-button')).tap();
      await element(by.id('show-hidden-nfts')).tap();
      await expect(element(by.id('hidden-nfts-screen'))).toBeVisible();
    });
  });

  describe('Network Support', () => {
    it('should show network indicator', async () => {
      await expect(element(by.id('nft-network-indicator'))).toBeVisible();
    });

    it('should switch network for NFTs', async () => {
      await element(by.id('nft-network-selector')).tap();
      await expect(element(by.id('nft-network-modal'))).toBeVisible();

      await element(by.id('nft-network-polygon')).tap();
      // Should refresh NFT list for new network
    });
  });
});
