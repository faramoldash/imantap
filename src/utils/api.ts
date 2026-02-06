// utils/api.ts
import { UserData } from '../types/types';
import { getTelegramUserId } from './telegram';


const BOT_API_URL = 'https://imantap-bot-production.up.railway.app';

/**
 * Загрузить полные данные пользователя из MongoDB
 */
export async function loadUserDataFromServer(): Promise<Partial<UserData> | null> {
  try {
    const userId = getTelegramUserId();
    
    if (!userId) {
      console.log('⚠️ Telegram user ID не найден');
      return null;
    }

    console.log('🔍 Загрузка данных с сервера для user ID:', userId);

    const response = await fetch(`${BOT_API_URL}/api/user/${userId}/full`);

    if (!response.ok) {
      console.error('❌ Ошибка API:', response.status);
      return null;
    }

    const result = await response.json();

    if (result.success && result.data) {
      console.log('✅ Данные загружены с сервера:', result.data);
      return result.data;
    }

    return null;
  } catch (error) {
    console.error('❌ Ошибка загрузки данных:', error);
    return null;
  }
}

/**
 * Синхронизировать данные пользователя с сервером
 */
export async function syncUserDataToServer(userData: UserData): Promise<boolean> {
  try {
    const userId = getTelegramUserId();
    
    if (!userId) {
      console.log('Telegram user ID не найден - пропускаем синхронизацию');
      return false;
    }

    console.log('Синхронизация данных...');

    const response = await fetch(`${BOT_API_URL}/api/user/${userId}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userData.name,
        username: userData.username,
        photoUrl: userData.photoUrl,
        startDate: userData.startDate,
        registrationDate: userData.registrationDate,
        progress: userData.progress,
        preparationProgress: userData.preparationProgress,
        basicProgress: userData.basicProgress,
        memorizedNames: userData.memorizedNames,
        completedJuzs: userData.completedJuzs,
        quranKhatams: userData.quranKhatams,
        completedTasks: userData.completedTasks,
        deletedPredefinedTasks: userData.deletedPredefinedTasks,
        customTasks: userData.customTasks,
        quranGoal: userData.quranGoal,
        dailyQuranGoal: userData.dailyQuranGoal,
        dailyCharityGoal: userData.dailyCharityGoal,
        language: userData.language,
        xp: userData.xp,
        hasRedeemedReferral: userData.hasRedeemedReferral,
        unlockedBadges: userData.unlockedBadges,
        currentStreak: userData.currentStreak,
        longestStreak: userData.longestStreak,
        lastActiveDate: userData.lastActiveDate
      }),
    });

    if (!response.ok) {
      console.error('Ошибка синхронизации:', response.status);
      return false;
    }

    const result = await response.json();
    if (result.success) {
      console.log('✅ Данные успешно синхронизированы');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Ошибка синхронизации:', error);
    return false;
  }
}

/**
 * Автосинхронизация с debounce (задержка перед отправкой)
 */
let syncTimeout: NodeJS.Timeout | null = null;

export function autoSyncUserData(userData: UserData, delay: number = 2000) {
  // Отменяем предыдущую отложенную синхронизацию
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  // Создаём новую отложенную синхронизацию
  syncTimeout = setTimeout(() => {
    syncUserDataToServer(userData);
  }, delay);
}

/**
 * Проверить доступ пользователя (оплата/демо/pending)
 */
export interface AccessData {
  hasAccess: boolean;
  paymentStatus: 'paid' | 'unpaid' | 'pending' | 'demo';
  reason?: string;
  demoExpires?: string;
}

export async function checkUserAccess(userId: number): Promise<AccessData> {
  try {
    const response = await fetch(`${BOT_API_URL}/api/user/${userId}/access`);
    
    if (!response.ok) {
      console.error('❌ Ошибка проверки доступа:', response.status);
      return {
        hasAccess: false,
        paymentStatus: 'unpaid',
        reason: 'connection_error'
      };
    }
    
    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('✅ Данные доступа:', result.data);
      return result.data;
    }
    
    return {
      hasAccess: false,
      paymentStatus: 'unpaid',
      reason: 'unknown_error'
    };
  } catch (error) {
    console.error('❌ Ошибка проверки доступа:', error);
    return {
      hasAccess: false,
      paymentStatus: 'unpaid',
      reason: 'network_error'
    };
  }
}