/**
 * DeyondCrypt - Message Envelope Tests
 */

import {
  MessageEnvelopeBuilder,
  MessageEnvelopeParser,
  encodePlainMessage,
  decodePlainMessage,
  createTextMessage,
  createImageMessage,
  createFileMessage,
  createTransactionMessage,
  serializeEnvelope,
  deserializeEnvelope,
  serializeEnvelopeToBytes,
  deserializeEnvelopeFromBytes,
} from '../messages/MessageEnvelope';
import { EVMCrypto } from '../primitives/EVMCrypto';
import { SolanaCrypto } from '../primitives/SolanaCrypto';
import { CryptoPrimitiveRegistry } from '../primitives';
import { DeyondCryptEnvelope, MessageHeader, PlainMessage } from '../types';

describe('MessageEnvelope', () => {
  let crypto: EVMCrypto;
  let aliceKeyPair: { publicKey: Uint8Array; privateKey: Uint8Array };
  let bobKeyPair: { publicKey: Uint8Array; privateKey: Uint8Array };
  let aliceAddress: string;
  let bobAddress: string;

  beforeAll(async () => {
    crypto = new EVMCrypto();
    CryptoPrimitiveRegistry.clear();
    CryptoPrimitiveRegistry.register(crypto);

    aliceKeyPair = await crypto.generateKeyPair();
    bobKeyPair = await crypto.generateKeyPair();
    aliceAddress = crypto.publicKeyToAddress(aliceKeyPair.publicKey);
    bobAddress = crypto.publicKeyToAddress(bobKeyPair.publicKey);
  });

  describe('MessageEnvelopeBuilder', () => {
    it('should build a valid envelope', async () => {
      const header: MessageHeader = {
        ephemeralKey: new Uint8Array(33).fill(0x02),
        previousChainLength: 0,
        messageNumber: 0,
      };
      const ciphertext = new Uint8Array([1, 2, 3, 4, 5]);

      const envelope = await new MessageEnvelopeBuilder()
        .setSender(aliceAddress, 'evm', aliceKeyPair.publicKey)
        .setRecipient(bobAddress, 'evm')
        .setEncryptedData(header, ciphertext)
        .setPrivateKey(aliceKeyPair.privateKey)
        .build();

      expect(envelope.version).toBe(1);
      expect(envelope.sender.address).toBe(aliceAddress);
      expect(envelope.sender.chainType).toBe('evm');
      expect(envelope.recipient.address).toBe(bobAddress);
      expect(envelope.recipient.chainType).toBe('evm');
      expect(envelope.header.messageNumber).toBe(0);
      expect(envelope.ciphertext).toBeDefined();
      expect(envelope.signature).toBeDefined();
      expect(envelope.timestamp).toBeGreaterThan(0);
      expect(envelope.messageId).toBeDefined();
    });

    it('should throw error without header', async () => {
      const builder = new MessageEnvelopeBuilder()
        .setSender(aliceAddress, 'evm', aliceKeyPair.publicKey)
        .setRecipient(bobAddress, 'evm')
        .setPrivateKey(aliceKeyPair.privateKey);

      await expect(builder.build()).rejects.toThrow('Message header is required');
    });

    it('should generate unique message IDs', async () => {
      const header: MessageHeader = {
        ephemeralKey: new Uint8Array(33).fill(0x02),
        previousChainLength: 0,
        messageNumber: 0,
      };
      const ciphertext = new Uint8Array([1, 2, 3]);

      const envelope1 = await new MessageEnvelopeBuilder()
        .setSender(aliceAddress, 'evm', aliceKeyPair.publicKey)
        .setRecipient(bobAddress, 'evm')
        .setEncryptedData(header, ciphertext)
        .setPrivateKey(aliceKeyPair.privateKey)
        .build();

      const envelope2 = await new MessageEnvelopeBuilder()
        .setSender(aliceAddress, 'evm', aliceKeyPair.publicKey)
        .setRecipient(bobAddress, 'evm')
        .setEncryptedData(header, ciphertext)
        .setPrivateKey(aliceKeyPair.privateKey)
        .build();

      expect(envelope1.messageId).not.toBe(envelope2.messageId);
    });
  });

  describe('MessageEnvelopeParser', () => {
    let validEnvelope: DeyondCryptEnvelope;

    beforeEach(async () => {
      const header: MessageHeader = {
        ephemeralKey: new Uint8Array(33).fill(0x02),
        previousChainLength: 0,
        messageNumber: 5,
      };
      const ciphertext = new Uint8Array([1, 2, 3, 4, 5]);

      validEnvelope = await new MessageEnvelopeBuilder()
        .setSender(aliceAddress, 'evm', aliceKeyPair.publicKey)
        .setRecipient(bobAddress, 'evm')
        .setEncryptedData(header, ciphertext)
        .setPrivateKey(aliceKeyPair.privateKey)
        .build();
    });

    it('should parse a valid envelope JSON', () => {
      const json = JSON.stringify(validEnvelope);
      const parsed = MessageEnvelopeParser.parse(json);

      expect(parsed.version).toBe(validEnvelope.version);
      expect(parsed.sender.address).toBe(validEnvelope.sender.address);
      expect(parsed.messageId).toBe(validEnvelope.messageId);
    });

    it('should validate envelope structure', () => {
      expect(() => MessageEnvelopeParser.validate(validEnvelope)).not.toThrow();
    });

    it('should reject invalid version', () => {
      const invalid = { ...validEnvelope, version: 999 };

      expect(() => MessageEnvelopeParser.validate(invalid)).toThrow('Unsupported version');
    });

    it('should reject missing sender', () => {
      const invalid = { ...validEnvelope, sender: undefined } as any;

      expect(() => MessageEnvelopeParser.validate(invalid)).toThrow('Invalid sender information');
    });

    it('should reject missing recipient', () => {
      const invalid = { ...validEnvelope, recipient: undefined } as any;

      expect(() => MessageEnvelopeParser.validate(invalid)).toThrow(
        'Invalid recipient information'
      );
    });

    it('should reject missing ciphertext', () => {
      const invalid = { ...validEnvelope, ciphertext: '' };

      expect(() => MessageEnvelopeParser.validate(invalid)).toThrow('Missing ciphertext');
    });

    it('should reject missing signature', () => {
      const invalid = { ...validEnvelope, signature: '' };

      expect(() => MessageEnvelopeParser.validate(invalid)).toThrow('Missing signature');
    });

    it('should verify valid signature', async () => {
      const isValid = await MessageEnvelopeParser.verifySignature(validEnvelope);
      expect(isValid).toBe(true);
    });

    it('should reject tampered signature', async () => {
      const tampered = {
        ...validEnvelope,
        signature: btoa(String.fromCharCode(...new Uint8Array(64).fill(0xff))),
      };

      const isValid = await MessageEnvelopeParser.verifySignature(tampered);
      expect(isValid).toBe(false);
    });

    it('should reject tampered message', async () => {
      const tampered = {
        ...validEnvelope,
        ciphertext: btoa('tampered'),
      };

      const isValid = await MessageEnvelopeParser.verifySignature(tampered);
      expect(isValid).toBe(false);
    });

    it('should extract header', () => {
      const header = MessageEnvelopeParser.extractHeader(validEnvelope);

      expect(header.ephemeralKey).toBeInstanceOf(Uint8Array);
      expect(header.previousChainLength).toBe(0);
      expect(header.messageNumber).toBe(5);
    });

    it('should extract ciphertext', () => {
      const ciphertext = MessageEnvelopeParser.extractCiphertext(validEnvelope);

      expect(ciphertext).toBeInstanceOf(Uint8Array);
      expect(ciphertext).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
    });

    it('should check message expiration', () => {
      // Not expired (1 hour max age)
      expect(MessageEnvelopeParser.isExpired(validEnvelope, 60 * 60 * 1000)).toBe(false);

      // Create an old envelope
      const oldEnvelope = {
        ...validEnvelope,
        timestamp: Date.now() - 10000, // 10 seconds ago
      };

      // Expired (1ms max age for old message)
      expect(MessageEnvelopeParser.isExpired(oldEnvelope, 1)).toBe(true);
    });
  });

  describe('Plain Message helpers', () => {
    describe('createTextMessage', () => {
      it('should create a text message', () => {
        const message = createTextMessage('Hello, World!');

        expect(message.content).toBe('Hello, World!');
        expect(message.contentType).toBe('text');
        expect(message.metadata).toBeUndefined();
      });
    });

    describe('createImageMessage', () => {
      it('should create an image message', () => {
        const base64Image = 'iVBORw0KGgo...';
        const message = createImageMessage(base64Image, 'image/png');

        expect(message.content).toBe(base64Image);
        expect(message.contentType).toBe('image');
        expect(message.metadata?.mimeType).toBe('image/png');
      });
    });

    describe('createFileMessage', () => {
      it('should create a file message', () => {
        const message = createFileMessage('base64content', 'document.pdf', 'application/pdf');

        expect(message.content).toBe('base64content');
        expect(message.contentType).toBe('file');
        expect(message.metadata?.fileName).toBe('document.pdf');
        expect(message.metadata?.mimeType).toBe('application/pdf');
      });
    });

    describe('createTransactionMessage', () => {
      it('should create a transaction message', () => {
        const message = createTransactionMessage('0x1234567890abcdef...', 'evm', '1.5', 'ETH');

        expect(message.content).toBe('0x1234567890abcdef...');
        expect(message.contentType).toBe('transaction');
        expect(message.metadata?.chainType).toBe('evm');
        expect(message.metadata?.amount).toBe('1.5');
        expect(message.metadata?.token).toBe('ETH');
      });
    });

    describe('encodePlainMessage / decodePlainMessage', () => {
      it('should encode and decode text message', () => {
        const original = createTextMessage('Hello!');
        const encoded = encodePlainMessage(original);
        const decoded = decodePlainMessage(encoded);

        expect(decoded.content).toBe(original.content);
        expect(decoded.contentType).toBe(original.contentType);
      });

      it('should encode and decode message with metadata', () => {
        const original = createFileMessage('content', 'file.txt', 'text/plain');
        const encoded = encodePlainMessage(original);
        const decoded = decodePlainMessage(encoded);

        expect(decoded.content).toBe(original.content);
        expect(decoded.contentType).toBe(original.contentType);
        expect(decoded.metadata).toEqual(original.metadata);
      });

      it('should produce valid UTF-8 bytes', () => {
        const message = createTextMessage('안녕하세요! 🚀');
        const encoded = encodePlainMessage(message);

        expect(encoded).toBeInstanceOf(Uint8Array);

        const decoded = decodePlainMessage(encoded);
        expect(decoded.content).toBe('안녕하세요! 🚀');
      });
    });
  });

  describe('Serialization helpers', () => {
    let envelope: DeyondCryptEnvelope;

    beforeEach(async () => {
      const header: MessageHeader = {
        ephemeralKey: new Uint8Array(33).fill(0x02),
        previousChainLength: 0,
        messageNumber: 0,
      };

      envelope = await new MessageEnvelopeBuilder()
        .setSender(aliceAddress, 'evm', aliceKeyPair.publicKey)
        .setRecipient(bobAddress, 'evm')
        .setEncryptedData(header, new Uint8Array([1, 2, 3]))
        .setPrivateKey(aliceKeyPair.privateKey)
        .build();
    });

    describe('serializeEnvelope / deserializeEnvelope', () => {
      it('should serialize and deserialize envelope', () => {
        const json = serializeEnvelope(envelope);
        const deserialized = deserializeEnvelope(json);

        expect(deserialized.messageId).toBe(envelope.messageId);
        expect(deserialized.sender.address).toBe(envelope.sender.address);
        expect(deserialized.ciphertext).toBe(envelope.ciphertext);
      });

      it('should produce valid JSON', () => {
        const json = serializeEnvelope(envelope);

        expect(() => JSON.parse(json)).not.toThrow();
      });
    });

    describe('serializeEnvelopeToBytes / deserializeEnvelopeFromBytes', () => {
      it('should serialize and deserialize to bytes', () => {
        const bytes = serializeEnvelopeToBytes(envelope);
        const deserialized = deserializeEnvelopeFromBytes(bytes);

        expect(deserialized.messageId).toBe(envelope.messageId);
        expect(deserialized.sender.address).toBe(envelope.sender.address);
      });

      it('should produce Uint8Array', () => {
        const bytes = serializeEnvelopeToBytes(envelope);
        expect(bytes).toBeInstanceOf(Uint8Array);
      });
    });
  });

  describe('Cross-chain messaging', () => {
    it('should support EVM to Solana envelope', async () => {
      const solanaCrypto = new SolanaCrypto();
      CryptoPrimitiveRegistry.register(solanaCrypto);

      const solanaKeyPair = await solanaCrypto.generateKeyPair();
      const solanaAddress = solanaCrypto.publicKeyToAddress(solanaKeyPair.publicKey);

      const header: MessageHeader = {
        ephemeralKey: new Uint8Array(33).fill(0x02),
        previousChainLength: 0,
        messageNumber: 0,
      };

      const envelope = await new MessageEnvelopeBuilder()
        .setSender(aliceAddress, 'evm', aliceKeyPair.publicKey)
        .setRecipient(solanaAddress, 'solana')
        .setEncryptedData(header, new Uint8Array([1, 2, 3]))
        .setPrivateKey(aliceKeyPair.privateKey)
        .build();

      expect(envelope.sender.chainType).toBe('evm');
      expect(envelope.recipient.chainType).toBe('solana');

      // Verify signature with EVM crypto
      const isValid = await MessageEnvelopeParser.verifySignature(envelope);
      expect(isValid).toBe(true);
    });
  });
});
