// src/hooks/useAppInitialization.ts
import { useState, useEffect } from 'react';
import { UserData } from '../types/types';
import { checkUserAccess, AccessData } from '../utils/api';
import { getTelegramUserId, getTelegramUser } from '../utils/telegram';

const STORAGE_KEY = 'ramadan_tracker_data_v4';
const BOT_API_URL = import.meta.env.VITE_API_URL || 'https://imantap-bot-production.up.railway.app';

interface InitializationState {
  isLoading: boolean;
  hasAccess: boolean;
  accessData: AccessData | null;
  userData: UserData | null;
  error: string | null;
}

export function useAppInitialization(getDefaultUserData: () => UserData) {
  const [state, setState] = useState<InitializationState>({
    isLoading: true,
    hasAccess: false,
    accessData: null,
    userData: null,
    error: null
  });

  useEffect(() => {
    const initialize = async () => {
      // Задержка для инициализации Telegram
      await new Promise(resolve => setTimeout(resolve, 1000));

      const userId = getTelegramUserId();
      const telegramUser = getTelegramUser();

      if (!userId) {
        console.error('❌ User ID не найден');
        setState(prev => {
          const newState = {
            isLoading: false,
            hasAccess: false,
            accessData: {
              hasAccess: false,
              paymentStatus: 'unpaid' as const,
              reason: 'no_user_id'
            },
            userData: null,
            error: 'Telegram user not found'
          };
          // ✅ Дедупликация
          if (JSON.stringify(prev) === JSON.stringify(newState)) return prev;
          return newState;
        });
        return;
      }

      try {
        // 1. Проверяем доступ
        console.log('📡 Проверка доступа для user:', userId);
        const access = await checkUserAccess(userId);
        console.log('✅ Доступ:', access);

        // 2. Загружаем локальные данные для быстрого старта
        let localData: UserData | null = null;
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            
            // Проверяем что локальные данные принадлежат текущему пользователю
            // Если сохранены данные другого пользователя - игнорируем их
            const savedUserId = parsed.userId || null;
            if (savedUserId && savedUserId !== userId) {
              console.warn('⚠️ Локальные данные от другого пользователя - очищаем');
              localStorage.removeItem(STORAGE_KEY);
              localData = null;
            } else {
              localData = parsed;
              console.log('📦 Локальные данные загружены');
            }
          } catch (err) {
            console.error('❌ Ошибка парсинга localStorage:', err);
          }
        }

        // 3. Если есть доступ (или демо), загружаем данные с сервера
        let finalUserData: UserData;

        // Проверяем: есть полный доступ ИЛИ активный демо-режим
        const hasDataAccess = access.hasAccess || access.paymentStatus === 'demo';

        if (hasDataAccess) {
          try {
            const response = await fetch(`${BOT_API_URL}/api/user/${userId}/full`);
            
            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data) {
                const serverData = result.data;
                console.log('✅ Данные загружены с сервера');

                // Мерджим данные: defaults → server. Каждое поле явное,
                // чтобы null/undefined с сервера не затёр локальные данные.
                finalUserData = {
                  ...getDefaultUserData(), // Базовые дефолты для полей, которых нет на сервере
                  ...serverData,           // Все поля с сервера поверх дефолтов
                  // Явные overrides — гарантируем корректный тип и fallback
                  // для каждого поля, которое сервер может вернуть null/undefined

                  // Идентификация (всегда свежие данные из Telegram)
                  userId: userId,
                  name: telegramUser?.first_name
                    ? `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim()
                    : serverData.name || 'User',
                  username: telegramUser?.username ? `@${telegramUser.username}` : serverData.username,
                  photoUrl: telegramUser?.photo_url || serverData.photoUrl,
                  language: 'kk' as const,
                  registrationDate: serverData.registrationDate,

                  // Числовые поля — сервер авторитетен, fallback к 0
                  xp: serverData.xp ?? 0,
                  currentStreak: serverData.currentStreak ?? 0,
                  longestStreak: serverData.longestStreak ?? 0,
                  quranKhatams: serverData.quranKhatams ?? 0,
                  referralCount: serverData.referralCount ?? 0,
                  quranGoal: serverData.quranGoal ?? 30,
                  dailyQuranGoal: serverData.dailyQuranGoal ?? 5,
                  dailyCharityGoal: serverData.dailyCharityGoal ?? 1000,
                  shawwalFasts: serverData.shawwalFasts ?? 0,

                  // Строки
                  lastActiveDate: serverData.lastActiveDate || '',

                  // Boolean
                  hasRedeemedReferral: serverData.hasRedeemedReferral ?? false,

                  // Объекты прогресса — null с сервера не должен стирать данные
                  progress: serverData.progress || {},
                  preparationProgress: serverData.preparationProgress || {},
                  basicProgress: serverData.basicProgress || {},

                  // Массивы — null с сервера заменяем на []
                  memorizedNames: serverData.memorizedNames || [],
                  completedJuzs: serverData.completedJuzs || [],
                  earnedJuzXpIds: serverData.earnedJuzXpIds || [],
                  completedTasks: serverData.completedTasks || [],
                  deletedPredefinedTasks: serverData.deletedPredefinedTasks || [],
                  customTasks: serverData.customTasks || [],
                  unlockedBadges: serverData.unlockedBadges || [],
                  shawwalDates: serverData.shawwalDates || [],

                  // Системы целей v2 и тасбих — null с сервера заменяем на {}
                  dailyGoalRecords: serverData.dailyGoalRecords || {},
                  goalCustomItems: serverData.goalCustomItems || {},
                  goalStreaks: serverData.goalStreaks || {},
                  tasbeehRecords: serverData.tasbeehRecords || {},
                  tasbeehTotals: serverData.tasbeehTotals || {},
                };

                console.log('📥 Данные загружены с сервера:', {
                  progressDays: Object.keys(finalUserData.progress).length,
                  preparationDays: Object.keys(finalUserData.preparationProgress).length,
                  basicDays: Object.keys(finalUserData.basicProgress).length,
                  currentStreak: finalUserData.currentStreak,
                  xp: finalUserData.xp,
                  registrationDate: finalUserData.registrationDate
                });

                // Сохраняем в localStorage
                localStorage.setItem(STORAGE_KEY, JSON.stringify(finalUserData));
              } else {
                finalUserData = localData || getDefaultUserData();
                console.log('⚠️ Используем локальные данные (нет данных на сервере)');
              }
            } else {
              finalUserData = localData || getDefaultUserData();
              console.log('⚠️ Используем локальные данные (сервер недоступен)');
            }
          } catch (error) {
            console.error('❌ Ошибка загрузки с сервера:', error);
            finalUserData = localData || getDefaultUserData();
          }
        } else {
          // Нет доступа - используем локальные или дефолтные данные
          finalUserData = localData || getDefaultUserData();
        }

        // ✅ КРИТИЧНО: Дедупликация setState
        setState(prev => {
          const newState = {
            isLoading: false,
            hasAccess: hasDataAccess,
            accessData: access,
            userData: finalUserData,
            error: null
          };
          // Сравниваем по ключевым полям
          if (
            prev.isLoading === newState.isLoading &&
            prev.hasAccess === newState.hasAccess &&
            JSON.stringify(prev.accessData) === JSON.stringify(newState.accessData) &&
            JSON.stringify(prev.userData) === JSON.stringify(newState.userData) &&
            prev.error === newState.error
          ) {
            return prev; // Возвращаем старый объект → не триггерим рендер
          }
          return newState;
        });

      } catch (error: any) {
        console.error('❌ Ошибка инициализации:', error);
        setState(prev => {
          const newState = {
            isLoading: false,
            hasAccess: false,
            accessData: {
              hasAccess: false,
              paymentStatus: 'unpaid' as const,
              reason: 'init_error'
            },
            userData: null,
            error: error.message
          };
          // ✅ Дедупликация
          if (JSON.stringify(prev) === JSON.stringify(newState)) return prev;
          return newState;
        });
      }
    };

    initialize();
  }, []); // ✅ УБРАЛИ getDefaultUserData из зависимостей!

  return state;
}
