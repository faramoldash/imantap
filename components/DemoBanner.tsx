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
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(demoExpires).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft(language === 'kk' ? 'Аяқталды' : 'Истёк');
        setUrgent(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setUrgent(hours < 2);

      setTimeLeft(
        language === 'kk'
          ? `${hours} сағ ${minutes} мин`
          : `${hours} ч ${minutes} мин`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [demoExpires, language]);

  const handleUpgrade = () => {
    const tg = getTelegramWebApp();
    if (!tg) return;
    tg.showConfirm(
      language === 'kk'
        ? 'Төлем туралы хабарлама ботқа жіберіледі.\n\nБотты ашып, төлем жасаңыз.'
        : 'Сообщение об оплате будет отправлено в бот.\n\nОткройте бот и завершите оплату.',
      (confirmed) => {
        if (confirmed) {
          tg.openTelegramLink(`https://t.me/imantap_bot?start=payment`);
          setTimeout(() => tg.close(), 300);
        }
      }
    );
  };

  return (
    <div
      className={`w-full ${
        urgent
          ? 'bg-gradient-to-r from-red-500 to-orange-500'
          : 'bg-gradient-to-r from-amber-500 to-yellow-500'
      }`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-between">
        {/* Левая часть */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">{urgent ? '⚠️' : '🎁'}</span>
          <div className="min-w-0">
            <p className="text-white text-[11px] font-black leading-tight truncate">
              {language === 'kk' ? 'Демо-режим' : 'Демо-режим'}
            </p>
            <p className="text-white/90 text-[10px] leading-tight">
              {language === 'kk' ? 'Қалды:' : 'Осталось:'}{' '}
              <span className="font-black">{timeLeft}</span>
            </p>
          </div>
        </div>

        {/* Кнопка */}
        <button
          onClick={handleUpgrade}
          className="shrink-0 ml-3 bg-white/25 active:bg-white/40 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-[10px] font-black transition-all active:scale-95 border border-white/30"
        >
          {language === 'kk' ? 'Толық нұсқа →' : 'Полная версия →'}
        </button>
      </div>
    </div>
  );
};

export default DemoBanner;
