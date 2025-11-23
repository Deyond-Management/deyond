/**
 * FeatureFlagService
 * Feature flag management for gradual rollouts and A/B testing
 */

type FlagValue = boolean;
type FlagMap = Record<string, FlagValue>;
type RemoteConfigFetcher = () => Promise<FlagMap>;
type EvaluationTracker = (flag: string, value: boolean) => void;

export class FeatureFlagService {
  private flags: FlagMap = {};
  private userFlags: Map<string, FlagMap> = new Map();
  private percentageRollouts: Map<string, number> = new Map();
  private tracker: EvaluationTracker | null = null;

  /**
   * Set a feature flag
   */
  setFlag(flag: string, value: boolean): void {
    this.flags[flag] = value;
  }

  /**
   * Set multiple flags
   */
  setFlags(flags: FlagMap): void {
    this.flags = { ...this.flags, ...flags };
  }

  /**
   * Check if flag is enabled
   */
  isEnabled(flag: string, defaultValue: boolean = false): boolean {
    const value = this.flags[flag] ?? defaultValue;

    if (this.tracker) {
      this.tracker(flag, value);
    }

    return value;
  }

  /**
   * Get all flags
   */
  getAllFlags(): FlagMap {
    return { ...this.flags };
  }

  /**
   * Load flags from remote config
   */
  async loadRemoteConfig(fetcher: RemoteConfigFetcher): Promise<void> {
    const remoteFlags = await fetcher();
    this.setFlags(remoteFlags);
  }

  /**
   * Set flag for specific user
   */
  setUserFlag(userId: string, flag: string, value: boolean): void {
    const userFlagMap = this.userFlags.get(userId) || {};
    userFlagMap[flag] = value;
    this.userFlags.set(userId, userFlagMap);
  }

  /**
   * Check if flag is enabled for user
   */
  isEnabledForUser(userId: string, flag: string): boolean {
    // Check user-specific flag first
    const userFlagMap = this.userFlags.get(userId);
    if (userFlagMap && flag in userFlagMap) {
      return userFlagMap[flag];
    }

    // Check percentage rollout
    const percentage = this.percentageRollouts.get(flag);
    if (percentage !== undefined) {
      return this.isInRollout(userId, flag, percentage);
    }

    // Fall back to global flag
    return this.isEnabled(flag);
  }

  /**
   * Set percentage rollout for flag
   */
  setPercentageRollout(flag: string, percentage: number): void {
    this.percentageRollouts.set(flag, Math.max(0, Math.min(100, percentage)));
  }

  /**
   * Check if user is in percentage rollout
   */
  private isInRollout(userId: string, flag: string, percentage: number): boolean {
    // Generate deterministic hash from userId and flag
    const hash = this.hashString(`${userId}:${flag}`);
    const bucket = hash % 100;
    return bucket < percentage;
  }

  /**
   * Simple hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Set evaluation tracker
   */
  setTracker(tracker: EvaluationTracker): void {
    this.tracker = tracker;
  }

  /**
   * Reset all flags
   */
  reset(): void {
    this.flags = {};
    this.userFlags.clear();
    this.percentageRollouts.clear();
  }
}

export const featureFlags = new FeatureFlagService();
export default FeatureFlagService;
