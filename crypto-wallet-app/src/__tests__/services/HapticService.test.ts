/**
 * HapticService Tests
 */

import { HapticService } from '../../services/HapticService';
import * as Haptics from 'expo-haptics';

describe('HapticService', () => {
  let hapticService: HapticService;

  beforeEach(() => {
    hapticService = new HapticService();
    jest.clearAllMocks();
  });

  describe('impact feedback', () => {
    it('should trigger light impact', async () => {
      await hapticService.impact('light');
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('should trigger medium impact', async () => {
      await hapticService.impact('medium');
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });

    it('should trigger heavy impact', async () => {
      await hapticService.impact('heavy');
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
    });
  });

  describe('notification feedback', () => {
    it('should trigger success notification', async () => {
      await hapticService.notification('success');
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
    });

    it('should trigger warning notification', async () => {
      await hapticService.notification('warning');
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Warning);
    });

    it('should trigger error notification', async () => {
      await hapticService.notification('error');
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
    });
  });

  describe('selection feedback', () => {
    it('should trigger selection feedback', async () => {
      await hapticService.selection();
      expect(Haptics.selectionAsync).toHaveBeenCalled();
    });
  });

  describe('enabled state', () => {
    it('should be enabled by default', () => {
      expect(hapticService.isEnabled()).toBe(true);
    });

    it('should not trigger when disabled', async () => {
      hapticService.setEnabled(false);
      await hapticService.impact('light');
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });

    it('should trigger when re-enabled', async () => {
      hapticService.setEnabled(false);
      hapticService.setEnabled(true);
      await hapticService.impact('light');
      expect(Haptics.impactAsync).toHaveBeenCalled();
    });
  });

  describe('convenience methods', () => {
    it('should trigger button press haptic', async () => {
      await hapticService.buttonPress();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('should trigger success haptic', async () => {
      await hapticService.success();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
    });

    it('should trigger error haptic', async () => {
      await hapticService.error();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
    });
  });
});
