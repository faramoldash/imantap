import React from 'react';

interface PendingScreenProps {
  language: 'kk' | 'ru';
}

const PendingScreen: React.FC<PendingScreenProps> = ({ language }) => {
  const isKk = language === 'kk';
  
  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-xl p-8 text-center">
        {/* Spinner Animation */}
        <div className="mb-6 flex justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand"></div>
        </div>
        
        {/* Icon */}
        <div className="text-6xl mb-4">⏳</div>
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-primary mb-4">
          {isKk ? 'Төлем тексерілуде' : 'Проверка оплаты'}
        </h1>
        
        {/* Description */}
        <p className="text-secondary mb-6 leading-relaxed">
          {isKk 
            ? 'Сіздің төлеміңіз қарастырылып жатыр.\nБұл әдетте 10-30 минутқа созылады.'
            : 'Ваш платёж находится на проверке.\nОбычно это занимает 10-30 минут.'}
        </p>
        
        {/* Info Box */}
        <div className="bg-brand-tint border border-brand-subtle rounded-lg p-4 mb-6">
          <p className="text-sm text-brand">
            {isKk 
              ? '📱 Растау хабарламасы ботта келеді'
              : '📱 Подтверждение придёт в боте'}
          </p>
        </div>
        
        {/* Close Button */}
        <button
          onClick={() => {
            const tg = (window as any).Telegram?.WebApp;
            if (tg) tg.close();
          }}
          className="w-full btn-primary font-semibold py-3 px-6 rounded-lg transition"
        >
          {isKk ? 'Жабу' : 'Закрыть'}
        </button>
      </div>
    </div>
  );
};

export default PendingScreen;
