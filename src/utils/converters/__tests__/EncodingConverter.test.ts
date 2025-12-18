/**
 * EncodingConverter Tests
 */

import { EncodingConverter } from '../EncodingConverter';

describe('EncodingConverter', () => {
  describe('Hex conversions', () => {
    describe('bytesToHex', () => {
      it('should convert bytes to hex string', () => {
        const bytes = new Uint8Array([0, 255, 16, 32]);
        expect(EncodingConverter.bytesToHex(bytes)).toBe('00ff1020');
      });

      it('should add prefix when requested', () => {
        const bytes = new Uint8Array([0, 255]);
        expect(EncodingConverter.bytesToHex(bytes, true)).toBe('0x00ff');
      });

      it('should handle empty array', () => {
        const bytes = new Uint8Array([]);
        expect(EncodingConverter.bytesToHex(bytes)).toBe('');
      });
    });

    describe('hexToBytes', () => {
      it('should convert hex string to bytes', () => {
        const result = EncodingConverter.hexToBytes('00ff1020');
        expect(Array.from(result)).toEqual([0, 255, 16, 32]);
      });

      it('should handle 0x prefix', () => {
        const result = EncodingConverter.hexToBytes('0x00ff');
        expect(Array.from(result)).toEqual([0, 255]);
      });

      it('should handle empty string', () => {
        const result = EncodingConverter.hexToBytes('');
        expect(result.length).toBe(0);
      });

      it('should throw on invalid hex', () => {
        expect(() => EncodingConverter.hexToBytes('0xgg')).toThrow();
        expect(() => EncodingConverter.hexToBytes('abc')).toThrow(); // odd length
      });
    });
  });

  describe('String conversions', () => {
    describe('stringToBytes', () => {
      it('should convert string to bytes', () => {
        const result = EncodingConverter.stringToBytes('hello');
        expect(Array.from(result)).toEqual([104, 101, 108, 108, 111]);
      });

      it('should handle empty string', () => {
        const result = EncodingConverter.stringToBytes('');
        expect(result.length).toBe(0);
      });

      it('should handle unicode characters', () => {
        const result = EncodingConverter.stringToBytes('✓');
        expect(result.length).toBeGreaterThan(1);
      });
    });

    describe('bytesToString', () => {
      it('should convert bytes to string', () => {
        const bytes = new Uint8Array([104, 101, 108, 108, 111]);
        expect(EncodingConverter.bytesToString(bytes)).toBe('hello');
      });

      it('should handle empty array', () => {
        const bytes = new Uint8Array([]);
        expect(EncodingConverter.bytesToString(bytes)).toBe('');
      });
    });
  });

  describe('Base64 conversions', () => {
    describe('bytesToBase64', () => {
      it('should convert bytes to base64', () => {
        const bytes = new Uint8Array([104, 101, 108, 108, 111]);
        expect(EncodingConverter.bytesToBase64(bytes)).toBe('aGVsbG8=');
      });

      it('should handle empty array', () => {
        const bytes = new Uint8Array([]);
        expect(EncodingConverter.bytesToBase64(bytes)).toBe('');
      });
    });

    describe('base64ToBytes', () => {
      it('should convert base64 to bytes', () => {
        const result = EncodingConverter.base64ToBytes('aGVsbG8=');
        expect(Array.from(result)).toEqual([104, 101, 108, 108, 111]);
      });

      it('should handle empty string', () => {
        const result = EncodingConverter.base64ToBytes('');
        expect(result.length).toBe(0);
      });
    });
  });

  describe('Convenience methods', () => {
    describe('stringToHex', () => {
      it('should convert string to hex', () => {
        expect(EncodingConverter.stringToHex('hi')).toBe('6869');
      });

      it('should add prefix when requested', () => {
        expect(EncodingConverter.stringToHex('hi', true)).toBe('0x6869');
      });
    });

    describe('hexToString', () => {
      it('should convert hex to string', () => {
        expect(EncodingConverter.hexToString('6869')).toBe('hi');
        expect(EncodingConverter.hexToString('0x6869')).toBe('hi');
      });
    });

    describe('stringToBase64', () => {
      it('should convert string to base64', () => {
        expect(EncodingConverter.stringToBase64('hello')).toBe('aGVsbG8=');
      });
    });

    describe('base64ToString', () => {
      it('should convert base64 to string', () => {
        expect(EncodingConverter.base64ToString('aGVsbG8=')).toBe('hello');
      });
    });
  });

  describe('Validation', () => {
    describe('isValidHex', () => {
      it('should validate hex strings', () => {
        expect(EncodingConverter.isValidHex('0x00ff')).toBe(true);
        expect(EncodingConverter.isValidHex('00ff')).toBe(true);
        expect(EncodingConverter.isValidHex('0xgg')).toBe(false);
        expect(EncodingConverter.isValidHex('abc')).toBe(false); // odd length
        expect(EncodingConverter.isValidHex('')).toBe(true);
      });
    });

    describe('isValidBase64', () => {
      it('should validate base64 strings', () => {
        expect(EncodingConverter.isValidBase64('aGVsbG8=')).toBe(true);
        expect(EncodingConverter.isValidBase64('abc123')).toBe(true);
        expect(EncodingConverter.isValidBase64('!@#$')).toBe(false);
        expect(EncodingConverter.isValidBase64('')).toBe(true);
      });
    });
  });

  describe('Utility methods', () => {
    describe('concatBytes', () => {
      it('should concatenate byte arrays', () => {
        const a = new Uint8Array([1, 2]);
        const b = new Uint8Array([3, 4]);
        const result = EncodingConverter.concatBytes(a, b);
        expect(Array.from(result)).toEqual([1, 2, 3, 4]);
      });

      it('should handle multiple arrays', () => {
        const a = new Uint8Array([1]);
        const b = new Uint8Array([2]);
        const c = new Uint8Array([3]);
        const result = EncodingConverter.concatBytes(a, b, c);
        expect(Array.from(result)).toEqual([1, 2, 3]);
      });

      it('should handle empty arrays', () => {
        const result = EncodingConverter.concatBytes();
        expect(result.length).toBe(0);
      });
    });

    describe('bytesEqual', () => {
      it('should compare equal arrays', () => {
        const a = new Uint8Array([1, 2, 3]);
        const b = new Uint8Array([1, 2, 3]);
        expect(EncodingConverter.bytesEqual(a, b)).toBe(true);
      });

      it('should compare different arrays', () => {
        const a = new Uint8Array([1, 2, 3]);
        const b = new Uint8Array([1, 2, 4]);
        expect(EncodingConverter.bytesEqual(a, b)).toBe(false);
      });

      it('should compare arrays of different lengths', () => {
        const a = new Uint8Array([1, 2]);
        const b = new Uint8Array([1, 2, 3]);
        expect(EncodingConverter.bytesEqual(a, b)).toBe(false);
      });
    });
  });
});
