// src/hooks/useAppInitialization.ts
import { useState, useEffect } from 'react';
import { UserData } from '../types/types';
import { checkUserAccess, AccessData } from '../utils/api';
import { getTelegramUserId, getTelegramUser } from '../utils/telegram';

const STORAGE_KEY = 'ramadan_tracker_data_v3';
const BOT_API_URL = 'https://imantap-bot-production.up.railway.app';

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
        setState({
          isLoading: false,
          hasAccess: false,
          accessData: {
            hasAccess: false,
            paymentStatus: 'unpaid',
            reason: 'no_user_id'
          },
          userData: null,
          error: 'Telegram user not found'
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
            localData = JSON.parse(savedData);
            console.log('📦 Локальные данные загружены');
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

                // Мерджим локальные и серверные данные
                finalUserData = {
                  ...(localData || getDefaultUserData()),
                  ...serverData,
                  // Telegram данные всегда актуальные
                  name: telegramUser?.first_name 
                    ? `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim() 
                    : serverData.name || 'User',
                  username: telegramUser?.username ? `@${telegramUser.username}` : serverData.username,
                  photoUrl: telegramUser?.photo_url || serverData.photoUrl,
                  language: 'kk' as const // Всегда казахский
                };

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

        setState({
          isLoading: false,
          hasAccess: hasDataAccess,
          accessData: access,
          userData: finalUserData,
          error: null
        });

      } catch (error: any) {
        console.error('❌ Ошибка инициализации:', error);
        setState({
          isLoading: false,
          hasAccess: false,
          accessData: {
            hasAccess: false,
            paymentStatus: 'unpaid',
            reason: 'init_error'
          },
          userData: null,
          error: error.message
        });
      }
    };

    initialize();
  }, [getDefaultUserData]);

  return state;
}