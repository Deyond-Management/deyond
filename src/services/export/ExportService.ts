/**
 * ExportService
 * Handles data export functionality (CSV, JSON)
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface TransactionExportData {
  id: string;
  type: 'sent' | 'received';
  amount: string;
  token: string;
  address: string;
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  fee?: string;
}

export interface ExportOptions {
  filename?: string;
  includeHeader?: boolean;
  dateFormat?: 'iso' | 'locale';
}

class ExportService {
  private static instance: ExportService;

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * Format timestamp based on option
   */
  private formatDate(timestamp: number, format: 'iso' | 'locale' = 'iso'): string {
    const date = new Date(timestamp);
    if (format === 'iso') {
      return date.toISOString();
    }
    return date.toLocaleString();
  }

  /**
   * Escape CSV field value
   */
  private escapeCSVField(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Convert transactions to CSV format
   */
  public transactionsToCSV(
    transactions: TransactionExportData[],
    options: ExportOptions = {}
  ): string {
    const { includeHeader = true, dateFormat = 'iso' } = options;

    const headers = [
      'Transaction Hash',
      'Type',
      'Amount',
      'Token',
      'Address',
      'Status',
      'Date',
      'Fee',
    ];

    const rows = transactions.map(tx => [
      this.escapeCSVField(tx.hash),
      tx.type,
      tx.amount,
      tx.token,
      this.escapeCSVField(tx.address),
      tx.status,
      this.formatDate(tx.timestamp, dateFormat),
      tx.fee || '',
    ]);

    const csvContent = includeHeader
      ? [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
      : rows.map(row => row.join(',')).join('\n');

    return csvContent;
  }

  /**
   * Convert transactions to JSON format
   */
  public transactionsToJSON(transactions: TransactionExportData[]): string {
    return JSON.stringify(transactions, null, 2);
  }

  /**
   * Generate filename with timestamp
   */
  private generateFilename(prefix: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `${prefix}_${timestamp}.${extension}`;
  }

  /**
   * Export transactions to CSV file and share
   */
  public async exportTransactionsToCSV(
    transactions: TransactionExportData[],
    options: ExportOptions = {}
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const filename = options.filename || this.generateFilename('transactions', 'csv');
      const csvContent = this.transactionsToCSV(transactions, options);

      const filePath = `${FileSystem.cacheDirectory}${filename}`;

      // Write file
      await FileSystem.writeAsStringAsync(filePath, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Transactions',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        // On some platforms, sharing might not be available
        console.log('Sharing is not available on this platform');
      }

      return { success: true, filePath };
    } catch (error) {
      console.error('Failed to export CSV:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Export transactions to JSON file and share
   */
  public async exportTransactionsToJSON(
    transactions: TransactionExportData[],
    options: ExportOptions = {}
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const filename = options.filename || this.generateFilename('transactions', 'json');
      const jsonContent = this.transactionsToJSON(transactions);

      const filePath = `${FileSystem.cacheDirectory}${filename}`;

      // Write file
      await FileSystem.writeAsStringAsync(filePath, jsonContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Export Transactions',
          UTI: 'public.json',
        });
      }

      return { success: true, filePath };
    } catch (error) {
      console.error('Failed to export JSON:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Clean up exported files from cache
   */
  public async cleanupExportedFiles(): Promise<void> {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) return;

      const files = await FileSystem.readDirectoryAsync(cacheDir);
      const exportFiles = files.filter(
        file =>
          file.startsWith('transactions_') && (file.endsWith('.csv') || file.endsWith('.json'))
      );

      for (const file of exportFiles) {
        await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
      }
    } catch (error) {
      console.error('Failed to cleanup exported files:', error);
    }
  }
}

export default ExportService;
