/**
 * Simple EventEmitter implementation
 * Type-safe event handling for the transport layer
 */

type EventHandler = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, Set<EventHandler>> = new Map();

  /**
   * Subscribe to an event
   */
  on(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
  }

  /**
   * Subscribe to an event once
   */
  once(event: string, handler: EventHandler): void {
    const onceHandler = (...args: any[]) => {
      this.off(event, onceHandler);
      handler(...args);
    };
    this.on(event, onceHandler);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Emit an event
   */
  emit(event: string, ...args: any[]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event (or all events)
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.size || 0;
  }

  /**
   * Get all event names with listeners
   */
  eventNames(): string[] {
    return Array.from(this.events.keys());
  }
}

/**
 * Typed EventEmitter for specific event maps
 */
export class TypedEventEmitter<T extends Record<string, (...args: any[]) => void>> {
  private emitter = new EventEmitter();

  on<K extends keyof T>(event: K, handler: T[K]): void {
    this.emitter.on(event as string, handler);
  }

  once<K extends keyof T>(event: K, handler: T[K]): void {
    this.emitter.once(event as string, handler);
  }

  off<K extends keyof T>(event: K, handler: T[K]): void {
    this.emitter.off(event as string, handler);
  }

  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): void {
    this.emitter.emit(event as string, ...args);
  }

  removeAllListeners<K extends keyof T>(event?: K): void {
    this.emitter.removeAllListeners(event as string);
  }
}

export default EventEmitter;
