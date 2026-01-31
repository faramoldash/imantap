import React, { useState, useEffect } from 'react';

interface DemoBannerProps {
  demoExpires: string;
  language: 'kk' | 'ru';
}

const DemoBanner: React.FC<DemoBannerProps> = ({ demoExpires, language }) => {
  const isKk = language === 'kk';
  
  const [hoursLeft, setHoursLeft] = useState(0);
  
  useEffect(() => {
    const calculateHours = () => {
      const now = new Date();
      const expires = new Date(demoExpires);
      const diff = expires.getTime() - now.getTime();
      const hours = Math.max(0, Math.floor(diff / 1000 / 60 / 60));
      setHoursLeft(hours);
    };
    
    calculateHours();
    const interval = setInterval(calculateHours, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [demoExpires]);
  
  const handleUpgrade = () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) tg.close(); // Close Mini App and return to bot
  };
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-3 flex items-center gap-3 shadow-lg z-50">
      {/* Icon */}
      <div className="text-2xl">🎁</div>
      
      {/* Text */}
      <div className="flex-1">
        <div className="font-bold text-sm">
          {isKk ? 'Демо-режим' : 'Демо-режим'}
        </div>
        <div className="text-xs opacity-90">
          {isKk 
            ? `Қалған уақыт: ${hoursLeft} сағат`
            : `Осталось: ${hoursLeft} часов`}
        </div>
      </div>
      
      {/* Button */}
      <button
        onClick={handleUpgrade}
        className="bg-white text-rose-600 font-bold text-sm px-4 py-2 rounded-lg hover:bg-rose-50 transition"
      >
        {isKk ? 'Толық нұсқа' : 'Полная версия'}
      </button>
    </div>
  );
};

export default DemoBanner;