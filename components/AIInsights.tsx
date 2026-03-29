{/* Временно скрыто - AI Insights */}
{/* <AIInsights day={selectedDay} language={userData.language} /> */}

import React, { useState, useEffect } from 'react';
import { getDailySpiritualInsight, getDuaRecommendation } from '../src/services/geminiService';
import { Language } from '../src/types/types';
import { TRANSLATIONS } from '../constants';
import { getTelegramWebApp } from '../src/utils/telegram';

interface InsightData {
  title: string;
  ayah: string;
  meaning: string;
  advice: string;
  reflection: string;
}

const AIInsights: React.FC<{ day: number, language: Language }> = ({ day, language }) => {
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userState, setUserState] = useState('');
  const [dua, setDua] = useState<any>(null);
  const [duaLoading, setDuaLoading] = useState(false);
  
  const t = TRANSLATIONS[language];

  useEffect(() => {
    const fetchInsight = async () => {
      setLoading(true);
      try {
        const data = await getDailySpiritualInsight(day, language);
        if (data) setInsight(data);
      } catch (e) {
        console.error("Failed to fetch insight", e);
      }
      setLoading(false);
    };
    fetchInsight();
  }, [day, language]);

  const handleGetDua = async () => {
    if (!userState.trim()) return;
    setDuaLoading(true);
    try {
      const data = await getDuaRecommendation(userState, language);
      if (data) setDua(data);
    } catch (e) {
      console.error("Failed to fetch dua", e);
    }
    setDuaLoading(false);
  };

  const shareToTelegram = (text: string) => {
    const shareUrl = `https://t.me/share/url?url=&text=${encodeURIComponent(text)}`;
    const tg = getTelegramWebApp();
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  const handleShareInsight = () => {
    if (!insight) return;
    const header = language === 'kk' ? `🌙 Рамазан ғибраты - ${day}-күн` : `🌙 Духовное наставление - ${day}-й день`;
    const text = `${header}\n\n✨ ${insight.title}\n\n📖 ${insight.ayah}\n\n📝 ${insight.meaning}\n\n💡 ${insight.advice}\n\n#Рамазан #Ғибрат`;
    shareToTelegram(text);
  };

  const handleShareDua = () => {
    if (!dua) return;
    const header = language === 'kk' ? `🤲 Көңіл-күйге сай дұға` : `🤲 Дуа под состояние`;
    const text = `${header}\n\n✨ ${dua.arabic}\n\n📝 [${dua.transliteration}]\n\n📖 ${dua.translation}\n\n💎 Пайдасы: ${dua.benefit}\n\n#Рамазан #Дұға`;
    shareToTelegram(text);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--bronze) transparent var(--bronze) var(--bronze)' }}></div>
        <p className="text-secondary font-medium animate-pulse">...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Insight Card */}
      <div className="bg-card rounded-[2.5rem] p-8 shadow-xl border border-default relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
          <span className="text-6xl">✨</span>
        </div>
        
        <div className="flex justify-between items-start mb-4 relative z-10">
          <span className="bg-brand-tint text-brand px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block">
            {t.insightDaily}
          </span>
          <button
            onClick={handleShareInsight}
            className="text-[10px] font-black text-brand bg-brand-tint px-3 py-1 rounded-full flex items-center space-x-1 active:scale-90 transition-transform"
          >
            <span>{t.shareBtn}</span>
            <span>✈️</span>
          </button>
        </div>
        
        <h2 className="text-2xl font-black text-primary mb-4">{insight?.title}</h2>

        <div className="space-y-6">
          <div className="relative">
            <p className="text-lg font-serif italic text-primary text-right leading-loose mb-2">
               {insight?.ayah}
            </p>
            <p className="text-secondary text-sm border-l-4 border-brand-subtle pl-4 py-1 italic">
              «{insight?.meaning}»
            </p>
          </div>

          <div className="bg-surface p-4 rounded-2xl">
            <p className="text-primary text-sm leading-relaxed">{insight?.advice}</p>
          </div>

          <div>
            <p className="text-primary text-sm leading-relaxed">{insight?.reflection}</p>
          </div>
        </div>
      </div>

      {/* Dua Generator Card */}
      <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 mb-20">
        <h3 className="font-bold text-amber-900 mb-1">{t.duaTitle}</h3>
        <p className="text-xs text-amber-700 mb-4 opacity-80">{t.duaSub}</p>
        
        <div className="flex flex-col space-y-3">
          <input 
            type="text"
            value={userState}
            onChange={(e) => setUserState(e.target.value)}
            onFocus={(e) => {
               setTimeout(() => {
                 e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
               }, 300);
            }}
            placeholder={t.duaPlaceholder}
            className="bg-white border border-amber-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-amber-400 outline-none"
          />
          <button 
            onClick={handleGetDua}
            disabled={duaLoading || !userState.trim()}
            className="bg-amber-600 text-white rounded-2xl py-3 font-bold text-sm shadow-lg shadow-amber-200 disabled:opacity-50 transition-all active:scale-95"
          >
            {duaLoading ? t.duaGenerating : t.duaBtn}
          </button>
        </div>

        {dua && (
          <div className="mt-6 p-4 bg-white rounded-2xl shadow-sm border border-amber-100 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-end mb-2">
              <button 
                onClick={handleShareDua}
                className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full flex items-center space-x-1 active:scale-90 transition-transform"
              >
                <span>{t.shareBtn}</span>
                <span>✈️</span>
              </button>
            </div>
            <p className="text-xl font-serif text-amber-900 text-center mb-3 leading-relaxed">{dua.arabic}</p>
            <p className="text-xs text-amber-600 italic text-center mb-3">[{dua.transliteration}]</p>
            <p className="text-sm text-primary border-t border-default pt-3">{dua.translation}</p>
            {dua.benefit && (
              <p className="text-[10px] text-amber-500 font-bold uppercase mt-3 tracking-wider">{dua.benefit}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;
