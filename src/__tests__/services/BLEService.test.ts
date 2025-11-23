/**
 * BLEService Tests
 * TDD: Write tests first, then implement
 */

import { BLEService, BLEDevice, ConnectionStatus } from '../../services/BLEService';

describe('BLEService', () => {
  let bleService: BLEService;

  beforeEach(() => {
    bleService = new BLEService();
  });

  describe('Bluetooth State', () => {
    it('should check if bluetooth is enabled', async () => {
      const enabled = await bleService.isBluetoothEnabled();

      expect(typeof enabled).toBe('boolean');
    });

    it('should request bluetooth enable', async () => {
      const result = await bleService.requestBluetoothEnable();

      expect(typeof result).toBe('boolean');
    });
  });

  describe('Scanning', () => {
    it('should start scanning for devices', async () => {
      await bleService.startScanning();

      expect(bleService.isScanning()).toBe(true);
    });

    it('should stop scanning', async () => {
      await bleService.startScanning();
      await bleService.stopScanning();

      expect(bleService.isScanning()).toBe(false);
    });

    it('should return discovered devices', async () => {
      await bleService.startScanning();

      const devices = bleService.getDiscoveredDevices();

      expect(Array.isArray(devices)).toBe(true);
    });

    it('should clear discovered devices', async () => {
      await bleService.startScanning();
      bleService.clearDiscoveredDevices();

      const devices = bleService.getDiscoveredDevices();

      expect(devices.length).toBe(0);
    });

    it('should filter devices by service UUID', async () => {
      await bleService.startScanning({
        serviceUUIDs: ['1234-5678-9012-3456'],
      });

      expect(bleService.isScanning()).toBe(true);
    });

    it('should set scan timeout', async () => {
      await bleService.startScanning({
        timeout: 10000,
      });

      expect(bleService.isScanning()).toBe(true);
    });
  });

  describe('Connection', () => {
    const mockDevice: BLEDevice = {
      id: 'device-1',
      name: 'Test Device',
      rssi: -50,
      address: '0x1234567890123456789012345678901234567890',
    };

    it('should connect to a device', async () => {
      const result = await bleService.connect(mockDevice);

      expect(result.success).toBe(true);
    });

    it('should get connection status', async () => {
      await bleService.connect(mockDevice);

      const status = bleService.getConnectionStatus(mockDevice.id);

      expect(status).toBeDefined();
    });

    it('should return connected status after successful connection', async () => {
      await bleService.connect(mockDevice);

      const status = bleService.getConnectionStatus(mockDevice.id);

      expect(status).toBe('connected');
    });

    it('should disconnect from a device', async () => {
      await bleService.connect(mockDevice);
      await bleService.disconnect(mockDevice.id);

      const status = bleService.getConnectionStatus(mockDevice.id);

      expect(status).toBe('disconnected');
    });

    it('should track multiple device connections', async () => {
      const device2: BLEDevice = {
        id: 'device-2',
        name: 'Device 2',
        rssi: -60,
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
      };

      await bleService.connect(mockDevice);
      await bleService.connect(device2);

      expect(bleService.getConnectionStatus(mockDevice.id)).toBe('connected');
      expect(bleService.getConnectionStatus(device2.id)).toBe('connected');
    });

    it('should return disconnected for unknown device', () => {
      const status = bleService.getConnectionStatus('unknown');

      expect(status).toBe('disconnected');
    });
  });

  describe('Data Transfer', () => {
    const mockDevice: BLEDevice = {
      id: 'device-1',
      name: 'Test Device',
      rssi: -50,
      address: '0x1234567890123456789012345678901234567890',
    };

    beforeEach(async () => {
      await bleService.connect(mockDevice);
    });

    it('should send data to device', async () => {
      const result = await bleService.sendData(mockDevice.id, 'Hello');

      expect(result.success).toBe(true);
    });

    it('should throw error when sending to disconnected device', async () => {
      await bleService.disconnect(mockDevice.id);

      await expect(bleService.sendData(mockDevice.id, 'Hello')).rejects.toThrow(
        'Device not connected'
      );
    });

    it('should subscribe to data notifications', async () => {
      const callback = jest.fn();

      await bleService.subscribeToNotifications(mockDevice.id, callback);

      expect(bleService.hasSubscription(mockDevice.id)).toBe(true);
    });

    it('should unsubscribe from notifications', async () => {
      const callback = jest.fn();

      await bleService.subscribeToNotifications(mockDevice.id, callback);
      await bleService.unsubscribeFromNotifications(mockDevice.id);

      expect(bleService.hasSubscription(mockDevice.id)).toBe(false);
    });
  });

  describe('Pairing', () => {
    const mockDevice: BLEDevice = {
      id: 'device-1',
      name: 'Test Device',
      rssi: -50,
      address: '0x1234567890123456789012345678901234567890',
    };

    it('should generate pairing code', () => {
      const code = bleService.generatePairingCode();

      expect(code).toMatch(/^\d{6}$/);
    });

    it('should verify pairing code', async () => {
      const code = bleService.generatePairingCode();
      const result = await bleService.verifyPairingCode(mockDevice.id, code);

      expect(result).toBe(true);
    });

    it('should reject invalid pairing code', async () => {
      const result = await bleService.verifyPairingCode(mockDevice.id, '000000');

      expect(result).toBe(false);
    });
  });

  describe('Signal Strength', () => {
    it('should classify strong signal', () => {
      const strength = bleService.classifySignalStrength(-40);

      expect(strength).toBe('strong');
    });

    it('should classify medium signal', () => {
      const strength = bleService.classifySignalStrength(-60);

      expect(strength).toBe('medium');
    });

    it('should classify weak signal', () => {
      const strength = bleService.classifySignalStrength(-80);

      expect(strength).toBe('weak');
    });
  });

  describe('Cleanup', () => {
    it('should disconnect all devices on cleanup', async () => {
      const device1: BLEDevice = {
        id: 'device-1',
        name: 'Device 1',
        rssi: -50,
        address: '0x1234567890123456789012345678901234567890',
      };
      const device2: BLEDevice = {
        id: 'device-2',
        name: 'Device 2',
        rssi: -60,
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
      };

      await bleService.connect(device1);
      await bleService.connect(device2);

      await bleService.cleanup();

      expect(bleService.getConnectionStatus(device1.id)).toBe('disconnected');
      expect(bleService.getConnectionStatus(device2.id)).toBe('disconnected');
    });

    it('should stop scanning on cleanup', async () => {
      await bleService.startScanning();
      await bleService.cleanup();

      expect(bleService.isScanning()).toBe(false);
    });
  });
});
