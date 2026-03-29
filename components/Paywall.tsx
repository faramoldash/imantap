
import React from 'react';
import { Language } from '../src/types/types';
import { getTelegramWebApp } from '../src/utils/telegram';

interface PaywallProps {
  language: Language;
}

const Paywall: React.FC<PaywallProps> = ({ language }) => {
  const isKk = language === 'kk';

  const handleClose = () => {
    // Close the Mini App to return to the bot
    const tg = getTelegramWebApp();
    if (tg) {
      tg.close();
    }
  };

  return (
    <div className="min-h-screen bg-header flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-10 opacity-10">
        <span className="text-9xl">🔒</span>
      </div>
      <div className="absolute bottom-0 left-0 p-10 opacity-10">
        <span className="text-9xl">🌙</span>
      </div>

      <div className="bg-card p-8 rounded-[3rem] shadow-2xl relative z-10 max-w-sm w-full animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-brand-tint rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
          💎
        </div>

        <h2 className="text-2xl font-black text-primary mb-4 uppercase leading-tight">
          {isKk ? 'Төлем қажет' : 'Требуется оплата'}
        </h2>

        <p className="text-secondary text-sm mb-6 leading-relaxed">
          {isKk 
            ? 'Бұл қосымшаға кіру үшін алдымен Telegram бот арқылы төлем жасауыңыз керек.' 
            : 'Для доступа к приложению необходимо сначала произвести оплату через Telegram бота.'}
        </p>

        <div className="bg-surface rounded-2xl p-4 mb-8 border border-default">
           <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-secondary uppercase">{isKk ? 'Бағасы:' : 'Цена:'}</span>
              <span className="text-lg font-black text-primary line-through decoration-red-400 decoration-2">2 490 ₸</span>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-brand uppercase">{isKk ? 'Промокодпен:' : 'С промокодом:'}</span>
              <span className="text-xl font-black text-brand">1 990 ₸</span>
           </div>
           <p className="text-[10px] text-secondary mt-2 italic">
             {isKk ? '(-20% жеңілдік)' : '(-20% скидка)'}
           </p>
        </div>

        <button 
          onClick={handleClose}
          className="w-full btn-primary py-4 rounded-2xl font-black uppercase text-sm shadow-xl active:scale-95 transition-transform"
        >
          {isKk ? 'Ботқа оралу' : 'Вернуться в бот'}
        </button>
      </div>
    </div>
  );
};

export default Paywall;
