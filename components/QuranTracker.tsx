
import React from 'react';
import { UserData, Language } from '../types';
import { TRANSLATIONS, QURAN_SCHEDULE, XP_VALUES } from '../constants';

interface QuranTrackerProps {
  userData: UserData;
  setUserData: (data: UserData) => void;
  language: Language;
}

const QuranTracker: React.FC<QuranTrackerProps> = ({ userData, setUserData, language }) => {
  const t = TRANSLATIONS[language];

  const completedCount = userData.completedJuzs?.length || 0;
  const totalJuzs = 30;
  const percent = Math.round((completedCount / totalJuzs) * 100);

  // Custom SVG Progress Circle constants
  const size = 180;
  const strokeWidth = 20;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const toggleJuz = (id: number) => {
    const current = userData.completedJuzs || [];
    let next: number[];
    if (current.includes(id)) {
      next = current.filter(x => x !== id);
    } else {
      next = [...current, id];
    }
    setUserData({ ...userData, completedJuzs: next });
  };

  const handleKhatamFinish = () => {
    setUserData({
      ...userData,
      completedJuzs: [],
      quranKhatams: (userData.quranKhatams || 0) + 1,
      xp: userData.xp + (XP_VALUES.khatam || 1000)
    });
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Progress Summary or Khatam Button */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50 flex flex-col items-center">
        <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest">{t.quranProgress}</h3>
        
        {percent === 100 ? (
           <div className="flex flex-col items-center text-center animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-5xl mb-4 shadow-inner">
                🕋
              </div>
              <h2 className="text-2xl font-black text-emerald-700 mb-2 leading-tight">{t.quranKhatamCompleted}</h2>
              <p className="text-sm text-slate-500 mb-6 px-4">
                 МашаАлла! Сіз Құранды толық оқып шықтыңыз. +1000 XP
              </p>
              <button 
                onClick={handleKhatamFinish}
                className="bg-emerald-600 text-white px-8 py-4 rounded-[2rem] font-black shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
              >
                {t.quranStartOver}
              </button>
           </div>
        ) : (
            <div className="relative flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                cx={center}
                cy={center}
                r={radius}
                stroke="#f8fafc"
                strokeWidth={strokeWidth}
                fill="transparent"
                />
                <circle
                cx={center}
                cy={center}
                r={radius}
                stroke="#10b981"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={percent === 100 ? 0 : offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-800 leading-none">{percent}%</span>
                <span className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em]">{completedCount} / 30 {t.quranJuzCol}</span>
            </div>
            </div>
        )}

        {userData.quranKhatams > 0 && (
            <div className="mt-8 bg-amber-50 px-6 py-2 rounded-full border border-amber-100 flex items-center space-x-2">
                <span className="text-lg">📿</span>
                <span className="text-xs font-black text-amber-700 uppercase">{t.quranKhatamCount}: {userData.quranKhatams}</span>
            </div>
        )}
      </div>

      {/* 2. Authentic Hadith Section */}
      <div className="bg-emerald-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
           <span className="text-8xl font-serif">"</span>
        </div>
        <div className="relative z-10 space-y-4">
          <p className="text-emerald-50 text-sm italic leading-relaxed font-medium">
            «{t.quranHadith}»
          </p>
          <div className="flex flex-col items-center">
            <div className="h-0.5 w-12 bg-emerald-500 mb-2 rounded-full"></div>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              {t.quranHadithSource}
            </p>
          </div>
        </div>
      </div>

      {/* 3. 30-Day Schedule Table - Full Height */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 px-6 py-5 flex items-center justify-between border-b border-slate-100 sticky top-0 z-10">
           <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">{t.quranScheduleTitle}</h4>
           <span className="text-[10px] font-bold text-slate-400 uppercase">30 КҮН</span>
        </div>

        {/* Schedule List */}
        <div className="divide-y divide-slate-50">
          {QURAN_SCHEDULE.map((item) => {
            const isDone = userData.completedJuzs?.includes(item.id);
            return (
              <div 
                key={item.id}
                onClick={() => toggleJuz(item.id)}
                className={`grid grid-cols-12 gap-3 px-6 py-4 items-center transition-all cursor-pointer active:bg-slate-50 ${isDone ? 'bg-emerald-50/40' : 'bg-white'}`}
              >
                <div className="col-span-2">
                   <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${isDone ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {item.juz}
                   </div>
                </div>
                <div className="col-span-8 flex flex-col justify-center">
                   <div className="flex items-center space-x-2">
                      <span className={`text-[11px] font-black truncate ${isDone ? 'text-emerald-800' : 'text-slate-700'}`}>{item.start}</span>
                      <span className="text-slate-300">→</span>
                      <span className={`text-[11px] font-black truncate ${isDone ? 'text-emerald-800' : 'text-slate-700'}`}>{item.end}</span>
                   </div>
                </div>
                <div className="col-span-2 flex justify-end">
                   <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200' : 'border-slate-100 bg-white'}`}>
                      {isDone && <span className="text-[12px] font-black">✓</span>}
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuranTracker;
