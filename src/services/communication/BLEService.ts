/**
 * BLEService
 * Handles Bluetooth Low Energy communication
 */

export interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
  address: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'failed';

export type SignalStrength = 'strong' | 'medium' | 'weak';

interface ScanOptions {
  serviceUUIDs?: string[];
  timeout?: number;
}

interface ConnectionResult {
  success: boolean;
  error?: string;
}

interface SendResult {
  success: boolean;
  error?: string;
}

type NotificationCallback = (data: string) => void;

export class BLEService {
  private scanning: boolean = false;
  private discoveredDevices: BLEDevice[] = [];
  private connectionStatus: Map<string, ConnectionStatus> = new Map();
  private subscriptions: Map<string, NotificationCallback> = new Map();
  private currentPairingCode: string = '';
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Check if Bluetooth is enabled
   */
  async isBluetoothEnabled(): Promise<boolean> {
    // Mock implementation - in real app, check platform API
    return true;
  }

  /**
   * Request to enable Bluetooth
   */
  async requestBluetoothEnable(): Promise<boolean> {
    // Mock implementation - in real app, prompt user
    return true;
  }

  /**
   * Start scanning for BLE devices
   */
  async startScanning(options?: ScanOptions): Promise<void> {
    this.scanning = true;

    // Clear any existing timeout
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }

    // Mock: simulate finding devices
    if (options?.timeout) {
      this.scanTimeout = setTimeout(() => {
        this.scanning = false;
        this.scanTimeout = null;
      }, options.timeout);
    }
  }

  /**
   * Stop scanning for devices
   */
  async stopScanning(): Promise<void> {
    this.scanning = false;

    // Clear scan timeout if exists
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
  }

  /**
   * Check if currently scanning
   */
  isScanning(): boolean {
    return this.scanning;
  }

  /**
   * Get list of discovered devices
   */
  getDiscoveredDevices(): BLEDevice[] {
    return [...this.discoveredDevices];
  }

  /**
   * Clear discovered devices list
   */
  clearDiscoveredDevices(): void {
    this.discoveredDevices = [];
  }

  /**
   * Add a discovered device (internal use)
   */
  addDiscoveredDevice(device: BLEDevice): void {
    const existing = this.discoveredDevices.find(d => d.id === device.id);
    if (!existing) {
      this.discoveredDevices.push(device);
    } else {
      // Update RSSI
      existing.rssi = device.rssi;
    }
  }

  /**
   * Connect to a device
   */
  async connect(device: BLEDevice): Promise<ConnectionResult> {
    this.connectionStatus.set(device.id, 'connecting');

    // Mock: simulate successful connection
    await this.simulateDelay(100);
    this.connectionStatus.set(device.id, 'connected');

    return { success: true };
  }

  /**
   * Disconnect from a device
   */
  async disconnect(deviceId: string): Promise<void> {
    this.connectionStatus.set(deviceId, 'disconnected');
    this.subscriptions.delete(deviceId);
  }

  /**
   * Get connection status for a device
   */
  getConnectionStatus(deviceId: string): ConnectionStatus {
    return this.connectionStatus.get(deviceId) || 'disconnected';
  }

  /**
   * Send data to a connected device
   */
  async sendData(deviceId: string, data: string): Promise<SendResult> {
    const status = this.getConnectionStatus(deviceId);
    if (status !== 'connected') {
      throw new Error('Device not connected');
    }

    // Mock: simulate sending data
    await this.simulateDelay(50);

    return { success: true };
  }

  /**
   * Subscribe to data notifications from a device
   */
  async subscribeToNotifications(deviceId: string, callback: NotificationCallback): Promise<void> {
    const status = this.getConnectionStatus(deviceId);
    if (status !== 'connected') {
      throw new Error('Device not connected');
    }

    this.subscriptions.set(deviceId, callback);
  }

  /**
   * Unsubscribe from notifications
   */
  async unsubscribeFromNotifications(deviceId: string): Promise<void> {
    this.subscriptions.delete(deviceId);
  }

  /**
   * Check if device has active subscription
   */
  hasSubscription(deviceId: string): boolean {
    return this.subscriptions.has(deviceId);
  }

  /**
   * Generate a 6-digit pairing code
   */
  generatePairingCode(): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.currentPairingCode = code;
    return code;
  }

  /**
   * Verify pairing code
   */
  async verifyPairingCode(deviceId: string, code: string): Promise<boolean> {
    // Mock: verify against current code
    return code === this.currentPairingCode;
  }

  /**
   * Classify signal strength based on RSSI
   */
  classifySignalStrength(rssi: number): SignalStrength {
    if (rssi >= -50) return 'strong';
    if (rssi >= -70) return 'medium';
    return 'weak';
  }

  /**
   * Cleanup all connections and stop scanning
   */
  async cleanup(): Promise<void> {
    // Stop scanning and clear timeout
    this.scanning = false;
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }

    // Disconnect all devices
    for (const [deviceId] of this.connectionStatus) {
      await this.disconnect(deviceId);
    }

    // Clear all state
    this.discoveredDevices = [];
    this.subscriptions.clear();
  }

  /**
   * Simulate async delay
   */
  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default BLEService;
