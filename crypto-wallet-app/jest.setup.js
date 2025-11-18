// Mock crypto.subtle for testing
global.crypto = {
  subtle: {
    importKey: jest.fn().mockResolvedValue({}),
    encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
  },
  getRandomValues: (arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
};

// Mock TextEncoder and TextDecoder
global.TextEncoder = class TextEncoder {
  encode(str) {
    return new Uint8Array(Buffer.from(str, 'utf-8'));
  }
};

global.TextDecoder = class TextDecoder {
  decode(arr) {
    return Buffer.from(arr).toString('utf-8');
  }
};
