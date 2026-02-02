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
  return tg?.initDataUnsafe?.user?.id || null;
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