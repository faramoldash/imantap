
import React from 'react';
import { UserData, Language } from '../types';
import { TRANSLATIONS, QURAN_SCHEDULE } from '../constants';

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
  const size = 200;
  const strokeWidth = 24; // slightly thicker for the bold look
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

  const renderIntroText = (text: string) => {
    return text.split('\n\n').map((paragraph, idx) => (
      <p key={idx} className="text-sm text-slate-600 leading-relaxed mb-4 last:mb-0">
        {paragraph.split(/(\*\*.*?\*\*|\*\*\*.*?\*\*\*)/).map((part, i) => {
          if (part.startsWith('***') && part.endsWith('***')) {
            return <em key={i} className="font-bold italic text-emerald-800">{part.slice(3, -3)}</em>;
          }
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-black text-slate-800">{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </p>
    ));
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Құран прогресі (Summary Stats) */}
      <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-50 flex flex-col items-center">
        <h3 className="text-xl font-black text-slate-800 mb-8 uppercase tracking-tight">{t.quranProgress}</h3>
        
        <div className="relative flex items-center justify-center">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background Ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress Ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#10b981"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={percent === 100 ? 0 : offset}
              strokeLinecap={percent === 100 ? 'butt' : 'round'}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-slate-800 leading-none">{percent}%</span>
            <span className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">{completedCount} / 30 ПАРА</span>
          </div>
        </div>

        <div className="w-full flex justify-center space-x-12 mt-10">
          <div className="flex flex-col items-center">
             <div className="w-3 h-3 bg-emerald-500 rounded-full mb-1"></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{t.quranReadLabel}</p>
          </div>
          <div className="flex flex-col items-center">
             <div className="w-3 h-3 bg-slate-100 rounded-full mb-1"></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{t.quranLeft}</p>
          </div>
        </div>
      </div>

      {/* 2. Құран кестесі (Schedule Table) */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
           <h4 className="text-sm font-black text-slate-800">{t.quranScheduleTitle}</h4>
        </div>

        {/* Header Row */}
        <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-slate-50/50 border-b border-slate-100">
           <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase">{t.quranJuzCol}</div>
           <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase">{t.quranStartCol}</div>
           <div className="col-span-4 text-[10px] font-black text-slate-400 uppercase">{t.quranEndCol}</div>
           <div className="col-span-2 text-center text-[10px] font-black text-slate-400 uppercase">Оқ.</div>
        </div>

        {/* Schedule List */}
        <div className="divide-y divide-slate-50">
          {QURAN_SCHEDULE.map((item) => {
            const isDone = userData.completedJuzs?.includes(item.id);
            return (
              <div 
                key={item.id}
                onClick={() => toggleJuz(item.id)}
                className={`grid grid-cols-12 gap-2 px-6 py-4 items-center transition-colors cursor-pointer active:bg-slate-50 ${isDone ? 'bg-emerald-50/30' : 'bg-white'}`}
              >
                <div className="col-span-3">
                   <span className={`text-[11px] font-black ${isDone ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {item.juz}
                   </span>
                </div>
                <div className="col-span-3">
                   <span className="text-[10px] font-bold text-slate-500 line-clamp-2">{item.start}</span>
                </div>
                <div className="col-span-4">
                   <span className="text-[10px] font-bold text-slate-500 line-clamp-2">{item.end}</span>
                </div>
                <div className="col-span-2 flex justify-center">
                   <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-100 bg-white'}`}>
                      {isDone && <span className="text-[12px] font-black">✓</span>}
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Құран оқудың маңыздылығы (Spiritual Intro) */}
      {t.quranIntro && (
        <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100 shadow-inner">
           <div className="flex items-center space-x-3 mb-6">
              <span className="text-3xl">📖</span>
              <h3 className="text-lg font-black text-emerald-900 leading-tight">Құран оқудың маңыздылығы</h3>
           </div>
           <div className="prose prose-sm prose-emerald">
              {renderIntroText(t.quranIntro)}
           </div>
        </div>
      )}

      {/* Quote Footer */}
      <div className="bg-emerald-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
           <span className="text-6xl italic font-serif">"</span>
        </div>
        <p className="text-emerald-50 text-sm italic leading-relaxed relative z-10 font-medium">
          "{t.quranHadith}"
        </p>
      </div>
    </div>
  );
};

export default QuranTracker;
