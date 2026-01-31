// src/hooks/useTelegramUser.js
import { useState, useEffect } from 'react';
import { getUserData } from '../services/api';

export function useTelegramUser() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function initTelegram() {
      try {
        // Проверяем доступность Telegram WebApp
        if (typeof window.Telegram === 'undefined' || !window.Telegram.WebApp) {
          throw new Error('Telegram WebApp SDK not available');
        }

        const tg = window.Telegram.WebApp;
        
        // Расширяем WebApp на весь экран
        tg.expand();
        
        // Получаем данные пользователя из Telegram
        const telegramUser = tg.initDataUnsafe?.user;
        
        if (!telegramUser) {
          // Для локальной разработки используем тестовые данные
          console.warn('Telegram user not found, using test data');
          const testUser = {
            id: 62872218,
            first_name: 'Test',
            username: 'testuser'
          };
          setUser(testUser);
          
          // Получаем данные с бэкенда
          const data = await getUserData(testUser.id);
          setUserData(data);
        } else {
          setUser(telegramUser);
          
          // Получаем данные с бэкенда
          const data = await getUserData(telegramUser.id);
          setUserData(data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error initializing Telegram:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    initTelegram();
  }, []);

  return { user, userData, loading, error };
}
