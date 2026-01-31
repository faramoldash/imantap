// src/utils/haptics.ts

export const haptics = {
  /**
   * Легкая вибрация (checkbox, toggle)
   */
  light: () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
  },

  /**
   * Средняя вибрация (кнопки, navigation)
   */
  medium: () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('medium');
    }
  },

  /**
   * Сильная вибрация (важные действия)
   */
  heavy: () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('heavy');
    }
  },

  /**
   * Успех (завершение задачи)
   */
  success: () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('success');
    }
  },

  /**
   * Ошибка (failed action)
   */
  error: () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('error');
    }
  },

  /**
   * Предупреждение
   */
  warning: () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('warning');
    }
  },

  /**
   * Выбор (selection changed)
   */
  selection: () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.selectionChanged();
    }
  }
};