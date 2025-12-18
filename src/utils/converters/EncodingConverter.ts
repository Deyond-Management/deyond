/**
 * EncodingConverter
 * Centralized encoding/decoding utilities for byte, hex, and string conversions
 */

/**
 * EncodingConverter class
 * Provides static methods for encoding conversions
 */
export class EncodingConverter {
  /**
   * Convert Uint8Array to hexadecimal string
   * @param bytes - Uint8Array to convert
   * @param prefix - Whether to include '0x' prefix (default: false)
   * @returns Hexadecimal string
   */
  static bytesToHex(bytes: Uint8Array, prefix: boolean = false): string {
    const hex = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return prefix ? `0x${hex}` : hex;
  }

  /**
   * Convert hexadecimal string to Uint8Array
   * @param hex - Hexadecimal string (with or without '0x' prefix)
   * @returns Uint8Array
   */
  static hexToBytes(hex: string): Uint8Array {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;

    if (cleanHex.length % 2 !== 0) {
      throw new Error('Invalid hex string: odd length');
    }

    if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
      throw new Error('Invalid hex string: contains non-hex characters');
    }

    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
    }
    return bytes;
  }

  /**
   * Convert string to Uint8Array using UTF-8 encoding
   * @param str - String to convert
   * @returns Uint8Array
   */
  static stringToBytes(str: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  }

  /**
   * Convert Uint8Array to string using UTF-8 decoding
   * @param bytes - Uint8Array to convert
   * @returns Decoded string
   */
  static bytesToString(bytes: Uint8Array): string {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  }

  /**
   * Convert string to hexadecimal
   * @param str - String to convert
   * @param prefix - Whether to include '0x' prefix (default: false)
   * @returns Hexadecimal string
   */
  static stringToHex(str: string, prefix: boolean = false): string {
    const bytes = this.stringToBytes(str);
    return this.bytesToHex(bytes, prefix);
  }

  /**
   * Convert hexadecimal to string
   * @param hex - Hexadecimal string
   * @returns Decoded string
   */
  static hexToString(hex: string): string {
    const bytes = this.hexToBytes(hex);
    return this.bytesToString(bytes);
  }

  /**
   * Convert base64 string to Uint8Array
   * @param base64 - Base64 encoded string
   * @returns Uint8Array
   */
  static base64ToBytes(base64: string): Uint8Array {
    // Handle URL-safe base64
    const normalizedBase64 = base64.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding if needed
    const paddedBase64 = normalizedBase64.padEnd(
      normalizedBase64.length + ((4 - (normalizedBase64.length % 4)) % 4),
      '='
    );

    const binaryString = atob(paddedBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Convert Uint8Array to base64 string
   * @param bytes - Uint8Array to convert
   * @param urlSafe - Whether to use URL-safe base64 (default: false)
   * @returns Base64 encoded string
   */
  static bytesToBase64(bytes: Uint8Array, urlSafe: boolean = false): string {
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i]);
    }

    let base64 = btoa(binaryString);

    if (urlSafe) {
      base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    return base64;
  }

  /**
   * Convert string to base64
   * @param str - String to convert
   * @param urlSafe - Whether to use URL-safe base64 (default: false)
   * @returns Base64 encoded string
   */
  static stringToBase64(str: string, urlSafe: boolean = false): string {
    const bytes = this.stringToBytes(str);
    return this.bytesToBase64(bytes, urlSafe);
  }

  /**
   * Convert base64 to string
   * @param base64 - Base64 encoded string
   * @returns Decoded string
   */
  static base64ToString(base64: string): string {
    const bytes = this.base64ToBytes(base64);
    return this.bytesToString(bytes);
  }

  /**
   * Convert hex to base64
   * @param hex - Hexadecimal string
   * @param urlSafe - Whether to use URL-safe base64 (default: false)
   * @returns Base64 encoded string
   */
  static hexToBase64(hex: string, urlSafe: boolean = false): string {
    const bytes = this.hexToBytes(hex);
    return this.bytesToBase64(bytes, urlSafe);
  }

  /**
   * Convert base64 to hex
   * @param base64 - Base64 encoded string
   * @param prefix - Whether to include '0x' prefix (default: false)
   * @returns Hexadecimal string
   */
  static base64ToHex(base64: string, prefix: boolean = false): string {
    const bytes = this.base64ToBytes(base64);
    return this.bytesToHex(bytes, prefix);
  }

  /**
   * Validate hex string
   * @param hex - String to validate
   * @returns Whether the string is valid hex
   */
  static isValidHex(hex: string): boolean {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    return /^[0-9a-fA-F]*$/.test(cleanHex) && cleanHex.length % 2 === 0;
  }

  /**
   * Validate base64 string
   * @param base64 - String to validate
   * @returns Whether the string is valid base64
   */
  static isValidBase64(base64: string): boolean {
    // Handle URL-safe base64
    const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');

    return /^[A-Za-z0-9+/]*={0,2}$/.test(normalized);
  }

  /**
   * Pad hex string to specified byte length
   * @param hex - Hexadecimal string
   * @param byteLength - Target byte length
   * @param padLeft - Whether to pad on left (default: true)
   * @returns Padded hexadecimal string
   */
  static padHex(hex: string, byteLength: number, padLeft: boolean = true): string {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const targetLength = byteLength * 2;

    if (cleanHex.length >= targetLength) {
      return cleanHex;
    }

    const padding = '0'.repeat(targetLength - cleanHex.length);
    return padLeft ? padding + cleanHex : cleanHex + padding;
  }

  /**
   * Concatenate multiple Uint8Arrays
   * @param arrays - Arrays to concatenate
   * @returns Concatenated Uint8Array
   */
  static concatBytes(...arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);

    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }

    return result;
  }

  /**
   * Compare two Uint8Arrays for equality
   * @param a - First array
   * @param b - Second array
   * @returns Whether arrays are equal
   */
  static bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Slice Uint8Array
   * @param bytes - Array to slice
   * @param start - Start index
   * @param end - End index (optional)
   * @returns Sliced Uint8Array
   */
  static sliceBytes(bytes: Uint8Array, start: number, end?: number): Uint8Array {
    return bytes.slice(start, end);
  }
}

// Export convenience functions
export const bytesToHex = EncodingConverter.bytesToHex;
export const hexToBytes = EncodingConverter.hexToBytes;
export const stringToBytes = EncodingConverter.stringToBytes;
export const bytesToString = EncodingConverter.bytesToString;
export const stringToHex = EncodingConverter.stringToHex;
export const hexToString = EncodingConverter.hexToString;
export const base64ToBytes = EncodingConverter.base64ToBytes;
export const bytesToBase64 = EncodingConverter.bytesToBase64;
export const isValidHex = EncodingConverter.isValidHex;
export const isValidBase64 = EncodingConverter.isValidBase64;
export const concatBytes = EncodingConverter.concatBytes;
export const bytesEqual = EncodingConverter.bytesEqual;

export default EncodingConverter;
