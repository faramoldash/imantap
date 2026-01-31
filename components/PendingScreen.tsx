import React from 'react';

interface PendingScreenProps {
  language: 'kk' | 'ru';
}

const PendingScreen: React.FC<PendingScreenProps> = ({ language }) => {
  const isKk = language === 'kk';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Spinner Animation */}
        <div className="mb-6 flex justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600"></div>
        </div>
        
        {/* Icon */}
        <div className="text-6xl mb-4">⏳</div>
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-800 mb-4">
          {isKk ? 'Төлем тексерілуде' : 'Проверка оплаты'}
        </h1>
        
        {/* Description */}
        <p className="text-slate-600 mb-6 leading-relaxed">
          {isKk 
            ? 'Сіздің төлеміңіз қарастырылып жатыр.\nБұл әдетте 10-30 минутқа созылады.'
            : 'Ваш платёж находится на проверке.\nОбычно это занимает 10-30 минут.'}
        </p>
        
        {/* Info Box */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-emerald-800">
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
          className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          {isKk ? 'Жабу' : 'Закрыть'}
        </button>
      </div>
    </div>
  );
};

export default PendingScreen;
