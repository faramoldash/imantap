import React, { useEffect, useState } from 'react';
import { Language } from '../src/types/types';

interface DemoBannerProps {
  demoExpires: string;
  language: Language;
}

const DemoBanner: React.FC<DemoBannerProps> = ({ demoExpires, language }) => {
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

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-white shadow-lg">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl animate-pulse">🎁</span>
          <div>
            <p className="text-sm font-bold leading-tight">
              {language === 'kk' ? 'Демо-режим' : 'Демо-режим'}
            </p>
            <p className="text-xs opacity-90">
              {language === 'kk' ? 'Қалған уақыт' : 'Осталось'}: <span className="font-bold">{timeLeft}</span>
            </p>
          </div>
        </div>
        <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95">
          {language === 'kk' ? 'Төлық нұсқа' : 'Полная версия'}
        </button>
      </div>
    </div>
  );
};

export default DemoBanner;