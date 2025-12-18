/**
 * Deyond P2P Transport Layer - Multiaddr Implementation
 *
 * Multiaddress-like addressing for different transports
 */

import { Multiaddr as IMultiaddr, TransportProtocol } from './types';

/**
 * Multiaddr implementation
 * Format: /<protocol>/<address>[/<options>]
 */
export class Multiaddr implements IMultiaddr {
  public readonly protocol: TransportProtocol;
  public readonly address: string;
  public readonly options?: Record<string, unknown>;

  constructor(protocol: TransportProtocol, address: string, options?: Record<string, unknown>) {
    this.protocol = protocol;
    this.address = address;
    this.options = options;
  }

  /**
   * Create Multiaddr from string
   * @param str Address string (e.g., "/ble/AA:BB:CC:DD:EE:FF")
   */
  static fromString(str: string): Multiaddr {
    const parts = str.split('/').filter(Boolean);

    if (parts.length < 2) {
      throw new Error(`Invalid multiaddr format: ${str}`);
    }

    const protocol = parts[0] as TransportProtocol;
    const address = parts[1];
    const options: Record<string, unknown> = {};

    // Parse additional key=value options
    for (let i = 2; i < parts.length; i++) {
      const [key, value] = parts[i].split('=');
      if (key && value) {
        options[key] = value;
      }
    }

    return new Multiaddr(protocol, address, Object.keys(options).length > 0 ? options : undefined);
  }

  /**
   * Create BLE Multiaddr
   */
  static ble(deviceId: string, options?: { name?: string; rssi?: number }): Multiaddr {
    return new Multiaddr('ble', deviceId, options);
  }

  /**
   * Create WebRTC Multiaddr
   */
  static webrtc(peerId: string, options?: { signaling?: string }): Multiaddr {
    return new Multiaddr('webrtc', peerId, options);
  }

  /**
   * Create TCP Multiaddr
   */
  static tcp(host: string, port: number): Multiaddr {
    return new Multiaddr('tcp', `${host}:${port}`);
  }

  /**
   * Create WebSocket Multiaddr
   */
  static websocket(url: string): Multiaddr {
    return new Multiaddr('websocket', url);
  }

  /**
   * Create custom protocol Multiaddr
   */
  static custom(address: string, options?: Record<string, unknown>): Multiaddr {
    return new Multiaddr('custom', address, options);
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    let str = `/${this.protocol}/${this.address}`;

    if (this.options) {
      for (const [key, value] of Object.entries(this.options)) {
        str += `/${key}=${value}`;
      }
    }

    return str;
  }

  /**
   * Check if this address matches a protocol
   */
  isProtocol(protocol: TransportProtocol): boolean {
    return this.protocol === protocol;
  }

  /**
   * Get BLE-specific information
   */
  getBLEInfo(): { deviceId: string; name?: string; rssi?: number } | null {
    if (this.protocol !== 'ble') return null;

    return {
      deviceId: this.address,
      name: this.options?.name as string | undefined,
      rssi: this.options?.rssi as number | undefined,
    };
  }

  /**
   * Clone with modifications
   */
  clone(
    overrides?: Partial<{
      protocol: TransportProtocol;
      address: string;
      options: Record<string, unknown>;
    }>
  ): Multiaddr {
    return new Multiaddr(
      overrides?.protocol ?? this.protocol,
      overrides?.address ?? this.address,
      overrides?.options ?? this.options
    );
  }

  /**
   * Check equality
   */
  equals(other: IMultiaddr): boolean {
    return this.protocol === other.protocol && this.address === other.address;
  }
}

/**
 * Utility functions for working with multiaddrs
 */
export const MultiaddrUtils = {
  /**
   * Filter addresses by protocol
   */
  filterByProtocol(addrs: IMultiaddr[], protocol: TransportProtocol): IMultiaddr[] {
    return addrs.filter(addr => addr.protocol === protocol);
  },

  /**
   * Get first address of a protocol
   */
  getFirstByProtocol(addrs: IMultiaddr[], protocol: TransportProtocol): IMultiaddr | undefined {
    return addrs.find(addr => addr.protocol === protocol);
  },

  /**
   * Sort addresses by preference (BLE first for proximity)
   */
  sortByPreference(addrs: IMultiaddr[]): IMultiaddr[] {
    const priority: Record<TransportProtocol, number> = {
      ble: 1, // Highest priority (proximity)
      webrtc: 2, // Second (direct P2P)
      websocket: 3, // Third (relay possible)
      tcp: 4, // Fourth (direct TCP)
      custom: 5, // Lowest
    };

    return [...addrs].sort((a, b) => {
      return (priority[a.protocol] || 99) - (priority[b.protocol] || 99);
    });
  },
};

export default Multiaddr;
