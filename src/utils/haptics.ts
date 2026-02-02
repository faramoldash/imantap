// src/utils/haptics.ts
import { getTelegramWebApp } from './telegram';

export const haptics = {
  /**
   * Легкая вибрация (checkbox, toggle)
   */
  light: () => {
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
  },

  /**
   * Средняя вибрация (кнопки, navigation)
   */
  medium: () => {
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('medium');
    }
  },

  /**
   * Сильная вибрация (важные действия)
   */
  heavy: () => {
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('heavy');
    }
  },

  /**
   * Успех (завершение задачи)
   */
  success: () => {
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('success');
    }
  },

  /**
   * Ошибка (failed action)
   */
  error: () => {
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('error');
    }
  },

  /**
   * Предупреждение
   */
  warning: () => {
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('warning');
    }
  },

  /**
   * Выбор (selection changed)
   */
  selection: () => {
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.selectionChanged();
    }
  }
};