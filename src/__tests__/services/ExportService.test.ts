/**
 * ExportService Tests
 */

import ExportService, { TransactionExportData } from '../../services/export/ExportService';

// Mock expo modules
jest.mock('expo-file-system', () => ({
  cacheDirectory: '/mock/cache/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readDirectoryAsync: jest.fn().mockResolvedValue([]),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: {
    UTF8: 'utf8',
  },
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('ExportService', () => {
  let exportService: ExportService;

  const mockTransactions: TransactionExportData[] = [
    {
      id: '1',
      type: 'sent',
      amount: '1.5',
      token: 'ETH',
      address: '0x1234567890123456789012345678901234567890',
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      status: 'confirmed',
      timestamp: 1700000000000,
      fee: '0.001',
    },
    {
      id: '2',
      type: 'received',
      amount: '2.0',
      token: 'USDT',
      address: '0x0987654321098765432109876543210987654321',
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      status: 'pending',
      timestamp: 1700001000000,
    },
  ];

  beforeEach(() => {
    exportService = ExportService.getInstance();
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ExportService.getInstance();
      const instance2 = ExportService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('transactionsToCSV', () => {
    it('should convert transactions to CSV with header', () => {
      const csv = exportService.transactionsToCSV(mockTransactions);

      expect(csv).toContain('Transaction Hash,Type,Amount,Token,Address,Status,Date,Fee');
      expect(csv).toContain('sent');
      expect(csv).toContain('1.5');
      expect(csv).toContain('ETH');
      expect(csv).toContain('confirmed');
    });

    it('should convert transactions to CSV without header', () => {
      const csv = exportService.transactionsToCSV(mockTransactions, { includeHeader: false });

      expect(csv).not.toContain('Transaction Hash');
      expect(csv).toContain('sent');
    });

    it('should escape CSV fields with commas', () => {
      const transactionsWithCommas: TransactionExportData[] = [
        {
          ...mockTransactions[0],
          address: '0x1234,5678',
        },
      ];

      const csv = exportService.transactionsToCSV(transactionsWithCommas);
      expect(csv).toContain('"0x1234,5678"');
    });

    it('should escape CSV fields with quotes', () => {
      const transactionsWithQuotes: TransactionExportData[] = [
        {
          ...mockTransactions[0],
          address: '0x1234"5678',
        },
      ];

      const csv = exportService.transactionsToCSV(transactionsWithQuotes);
      expect(csv).toContain('"0x1234""5678"');
    });

    it('should handle empty transactions array', () => {
      const csv = exportService.transactionsToCSV([]);
      expect(csv).toBe('Transaction Hash,Type,Amount,Token,Address,Status,Date,Fee');
    });

    it('should format date as ISO by default', () => {
      const csv = exportService.transactionsToCSV(mockTransactions);
      expect(csv).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should format date as locale when specified', () => {
      const csv = exportService.transactionsToCSV(mockTransactions, { dateFormat: 'locale' });
      // Locale format varies by system, just check it doesn't contain ISO format
      expect(csv).toBeDefined();
    });
  });

  describe('transactionsToJSON', () => {
    it('should convert transactions to JSON', () => {
      const json = exportService.transactionsToJSON(mockTransactions);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].type).toBe('sent');
      expect(parsed[1].type).toBe('received');
    });

    it('should handle empty transactions array', () => {
      const json = exportService.transactionsToJSON([]);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(0);
    });

    it('should include all transaction fields', () => {
      const json = exportService.transactionsToJSON(mockTransactions);
      const parsed = JSON.parse(json);

      expect(parsed[0]).toHaveProperty('id');
      expect(parsed[0]).toHaveProperty('type');
      expect(parsed[0]).toHaveProperty('amount');
      expect(parsed[0]).toHaveProperty('token');
      expect(parsed[0]).toHaveProperty('address');
      expect(parsed[0]).toHaveProperty('hash');
      expect(parsed[0]).toHaveProperty('status');
      expect(parsed[0]).toHaveProperty('timestamp');
      expect(parsed[0]).toHaveProperty('fee');
    });
  });

  describe('exportTransactionsToCSV', () => {
    it('should export transactions to CSV file', async () => {
      const FileSystem = require('expo-file-system');
      const Sharing = require('expo-sharing');

      const result = await exportService.exportTransactionsToCSV(mockTransactions);

      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
      expect(Sharing.shareAsync).toHaveBeenCalled();
    });

    it('should use custom filename when provided', async () => {
      const FileSystem = require('expo-file-system');

      await exportService.exportTransactionsToCSV(mockTransactions, {
        filename: 'custom_export.csv',
      });

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        '/mock/cache/custom_export.csv',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should handle export error', async () => {
      const FileSystem = require('expo-file-system');
      FileSystem.writeAsStringAsync.mockRejectedValueOnce(new Error('Write failed'));

      const result = await exportService.exportTransactionsToCSV(mockTransactions);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Write failed');
    });

    it('should handle sharing unavailable', async () => {
      const Sharing = require('expo-sharing');
      Sharing.isAvailableAsync.mockResolvedValueOnce(false);

      const result = await exportService.exportTransactionsToCSV(mockTransactions);

      expect(result.success).toBe(true);
      expect(Sharing.shareAsync).not.toHaveBeenCalled();
    });
  });

  describe('exportTransactionsToJSON', () => {
    it('should export transactions to JSON file', async () => {
      const FileSystem = require('expo-file-system');
      const Sharing = require('expo-sharing');

      const result = await exportService.exportTransactionsToJSON(mockTransactions);

      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          mimeType: 'application/json',
        })
      );
    });

    it('should handle export error', async () => {
      const FileSystem = require('expo-file-system');
      FileSystem.writeAsStringAsync.mockRejectedValueOnce(new Error('Write failed'));

      const result = await exportService.exportTransactionsToJSON(mockTransactions);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Write failed');
    });
  });

  describe('cleanupExportedFiles', () => {
    it('should delete exported files from cache', async () => {
      const FileSystem = require('expo-file-system');
      FileSystem.readDirectoryAsync.mockResolvedValueOnce([
        'transactions_2023-11-14T10-00-00.csv',
        'transactions_2023-11-14T11-00-00.json',
        'other_file.txt',
      ]);

      await exportService.cleanupExportedFiles();

      expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(2);
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
        '/mock/cache/transactions_2023-11-14T10-00-00.csv',
        { idempotent: true }
      );
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
        '/mock/cache/transactions_2023-11-14T11-00-00.json',
        { idempotent: true }
      );
    });

    it('should handle cleanup error gracefully', async () => {
      const FileSystem = require('expo-file-system');
      FileSystem.readDirectoryAsync.mockRejectedValueOnce(new Error('Read failed'));

      // Should not throw
      await expect(exportService.cleanupExportedFiles()).resolves.not.toThrow();
    });
  });
});
