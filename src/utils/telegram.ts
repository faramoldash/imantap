// src/utils/telegram.ts
import { TelegramWebApp, TelegramUser } from '../types/telegram';

/**
 * Получить экземпляр Telegram WebApp
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

/**
 * Получить ID текущего пользователя
 */
export function getTelegramUserId(): number | null {
  const tg = getTelegramWebApp();
  
  // Сначала пробуем получить из initDataUnsafe
  if (tg?.initDataUnsafe?.user?.id) {
    return tg.initDataUnsafe.user.id;
  }
  
  // Fallback: пробуем получить из URL параметра (для кнопок клавиатуры)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const startParam = urlParams.get('tgWebAppStartParam');
    if (startParam) {
      const userId = parseInt(startParam, 10);
      if (!isNaN(userId)) {
        console.log('✅ User ID получен из startParam:', userId);
        return userId;
      }
    }
  }
  
  return null;
}

/**
 * Получить данные текущего пользователя
 */
export function getTelegramUser(): TelegramUser | null {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user || null;
}

/**
 * Инициализировать Telegram WebApp
 */
export function initTelegramApp(): void {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.ready();
    tg.expand();
    console.log('✅ Telegram WebApp инициализирован');
    console.log('📱 Platform:', tg.platform);
    console.log('🎨 Color scheme:', tg.colorScheme);
    console.log('👤 User ID:', tg.initDataUnsafe?.user?.id);
  } else {
    console.warn('⚠️ Telegram WebApp недоступен');
  }
}

/**
 * Проверить доступность Telegram WebApp
 */
export function isTelegramWebAppAvailable(): boolean {
  return getTelegramWebApp() !== null;
}