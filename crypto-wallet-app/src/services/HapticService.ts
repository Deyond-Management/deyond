/**
 * HapticService
 * Haptic feedback for user interactions
 */

import * as Haptics from 'expo-haptics';

type ImpactStyle = 'light' | 'medium' | 'heavy';
type NotificationType = 'success' | 'warning' | 'error';

export class HapticService {
  private enabled: boolean = true;

  /**
   * Check if haptics are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable or disable haptic feedback
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Trigger impact feedback
   */
  async impact(style: ImpactStyle): Promise<void> {
    if (!this.enabled) return;

    const styleMap = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };

    await Haptics.impactAsync(styleMap[style]);
  }

  /**
   * Trigger notification feedback
   */
  async notification(type: NotificationType): Promise<void> {
    if (!this.enabled) return;

    const typeMap = {
      success: Haptics.NotificationFeedbackType.Success,
      warning: Haptics.NotificationFeedbackType.Warning,
      error: Haptics.NotificationFeedbackType.Error,
    };

    await Haptics.notificationAsync(typeMap[type]);
  }

  /**
   * Trigger selection feedback
   */
  async selection(): Promise<void> {
    if (!this.enabled) return;
    await Haptics.selectionAsync();
  }

  // Convenience methods
  async buttonPress(): Promise<void> {
    await this.impact('light');
  }

  async success(): Promise<void> {
    await this.notification('success');
  }

  async error(): Promise<void> {
    await this.notification('error');
  }

  async warning(): Promise<void> {
    await this.notification('warning');
  }
}

export const haptics = new HapticService();
export default HapticService;
