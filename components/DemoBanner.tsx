import React, { useEffect, useState } from 'react';
import { Language } from '../src/types/types';
import { getTelegramWebApp } from '../src/utils/telegram';

interface DemoBannerProps {
  demoExpires: string;
  language: Language;
  userId?: string;
}

const DemoBanner: React.FC<DemoBannerProps> = ({ demoExpires, language, userId }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(demoExpires).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft(language === 'kk' ? 'Аяқталды' : 'Истёк');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(
        language === 'kk'
          ? `${hours} сағат ${minutes} минут`
          : `${hours} часов ${minutes} минут`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [demoExpires, language]);

  const handleUpgrade = async () => {
    const tg = getTelegramWebApp();
    if (!tg) return;

    try {
      // ✅ Используем userId из props (уже загружен из API)
      if (!userId) {
        tg.showAlert(
          language === 'kk' 
            ? 'Қате: пайдаланушы анықталмады' 
            : 'Ошибка: не удалось определить пользователя'
        );
        return;
      }

      // Уведомляем бот о желании купить
      const botUrl = import.meta.env.VITE_BOT_URL || 'https://imantap-bot-production.up.railway.app';
      
      const response = await fetch(`${botUrl}/api/notify-purchase/${userId}`);
      
      if (response.ok) {
        // Успешно отправили - показываем сообщение
        tg.showAlert(
          language === 'kk'
            ? 'Төлем туралы ақпарат ботқа жіберілді ✅\n\nБотты ашып, төлем жасаңыз.'
            : 'Информация отправлена в бот ✅\n\nОткройте бот и оплатите.',
          () => {
            tg.close();
          }
        );
      } else {
        // Ошибка API - показываем обычное сообщение
        tg.showAlert(
          language === 'kk' 
            ? 'Толық нұсқаға өту үшін ботқа оралыңыз және төлем жасаңыз.' 
            : 'Для получения полной версии вернитесь в бот и оплатите.',
          () => {
            tg.close();
          }
        );
      }
    } catch (error) {
      console.error('Error notifying bot:', error);
      // При ошибке сети - показываем обычное сообщение
      tg.showAlert(
        language === 'kk' 
          ? 'Толық нұсқаға өту үшін ботқа оралыңыз және төлем жасаңыз.' 
          : 'Для получения полной версии вернитесь в бот и оплатите.',
        () => {
          tg.close();
        }
      );
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-white">
      <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <span className="text-xl">🎁</span>
          <div>
            <p className="text-xs font-bold leading-tight">
              {language === 'kk' ? 'Демо-режим' : 'Демо-режим'}
            </p>
            <p className="text-[10px] opacity-90">
              {language === 'kk' ? 'Қалған' : 'Осталось'}: <span className="font-semibold">{timeLeft}</span>
            </p>
          </div>
        </div>
        <button 
          onClick={handleUpgrade}
          className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold transition-all active:scale-95"
        >
          {language === 'kk' ? 'Толық нұсқа' : 'Полная версия'}
        </button>
      </div>
    </div>
  );
};

export default DemoBanner;