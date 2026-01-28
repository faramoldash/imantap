
import React, { useState } from 'react';
import { DayProgress, Language } from '../types';
import { TRANSLATIONS, TRACKER_KEYS, TOTAL_DAYS, NAMES_99 } from '../constants';

interface DashboardProps {
  day: number;
  data: DayProgress;
  allProgress: Record<number, DayProgress>;
  language: Language;
  updateProgress: (day: number, updates: Partial<DayProgress>) => void;
  onDaySelect: (day: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  day: selectedDay, 
  data, 
  allProgress, 
  updateProgress, 
  language,
  onDaySelect
}) => {
  const t = TRANSLATIONS[language];
  const [charityInput, setCharityInput] = useState(data.charityAmount > 0 ? data.charityAmount.toString() : '');
  const [activeDua, setActiveDua] = useState<'suhoor' | 'iftar'>('suhoor');
  
  const toggleItem = (key: keyof DayProgress) => {
    updateProgress(selectedDay, { [key]: !data[key] });
  };

  const handleCharityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCharityInput(val);
    const amount = parseInt(val) || 0;
    updateProgress(selectedDay, { 
      charityAmount: amount,
      charity: amount > 0 
    });
  };

  const calculateProgress = (dayNum: number) => {
    const dayData = allProgress[dayNum];
    if (!dayData) return 0;
    const completed = TRACKER_KEYS.filter(key => dayData[key as keyof DayProgress]).length;
    return Math.round((completed / TRACKER_KEYS.length) * 100);
  };

  const totalCharityMonth = Object.values(allProgress).reduce((sum, d) => sum + (d.charityAmount || 0), 0);

  const currentDayProgress = calculateProgress(selectedDay);
  const nameOfDay = NAMES_99[(selectedDay - 1) % 99];

  const ProgressCircle = ({ percentage, isSelected, dayNum }: { percentage: number, isSelected: boolean, dayNum: number }) => {
    const radius = 15;
    const stroke = 3;
    const size = 42; 
    const center = size / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div 
        onClick={() => {
            onDaySelect(dayNum);
            const dayData = allProgress[dayNum];
            setCharityInput(dayData?.charityAmount > 0 ? dayData.charityAmount.toString() : '');
        }}
        className={`relative flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isSelected ? 'scale-110 z-10' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <svg height={size} width={size} className="transform -rotate-90">
          <circle
            stroke="#f1f5f9"
            fill="transparent"
            strokeWidth={stroke}
            r={radius}
            cx={center}
            cy={center}
          />
          <circle
            stroke="currentColor"
            fill={isSelected ? '#10b98115' : 'transparent'}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
            strokeLinecap={percentage === 100 ? 'butt' : 'round'}
            r={radius}
            cx={center}
            cy={center}
            className="text-emerald-600 transition-all duration-500 ease-out"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-[11px] font-black ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>
          {dayNum}
        </span>
      </div>
    );
  };

  const ItemButton = ({ id, icon, small }: { id: keyof DayProgress, icon: string, small?: boolean }) => (
    <button
      onClick={() => toggleItem(id)}
      className={`p-2 rounded-[1.25rem] border transition-all flex flex-col items-center justify-center space-y-1 relative ${small ? 'h-20' : 'h-24'} ${
        data[id] 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-inner' 
          : 'bg-white border-slate-100 text-slate-600 shadow-sm'
      } active:scale-95`}
    >
      <span className={small ? "text-xl" : "text-2xl"}>{icon}</span>
      <span className="text-[9px] font-black text-center leading-tight uppercase tracking-tighter px-0.5">
        {t.items[id]}
      </span>
      {data[id] && (
        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-[8px] text-white shadow-md border border-white">
          ✓
        </div>
      )}
    </button>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Praise Text Section */}
      <section className="mt-2">
        <div className="bg-white p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center shadow-md border border-slate-100">
          {t.praiseText.split('\n').map((line: string, i: number) => (
            <p key={i} className={`text-slate-800 leading-tight font-black ${i === 0 ? 'text-base mb-2 text-emerald-800' : 'text-xs mb-1 opacity-80'}`}>
              {line}
            </p>
          ))}
        </div>
      </section>

      {/* 1. Calendar Section */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-5 px-1">
           <h4 className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{t.calendarTitle}</h4>
           <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">
             {t.dayLabel} {selectedDay}
           </span>
        </div>
        <div className="grid grid-cols-7 gap-y-4 gap-x-2 justify-items-center">
          {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((d) => (
            <ProgressCircle 
              key={d} 
              dayNum={d} 
              percentage={calculateProgress(d)} 
              isSelected={selectedDay === d} 
            />
          ))}
        </div>
      </div>

      {/* 2. Fasting Card */}
      <div 
        onClick={() => toggleItem('fasting')}
        className={`p-6 rounded-[2.5rem] transition-all cursor-pointer flex items-center justify-between ${
          data.fasting ? 'bg-emerald-600 text-white shadow-xl' : 'bg-white text-emerald-900 border border-slate-100 shadow-sm'
        } active:scale-[0.98]`}
      >
        <div className="flex items-center space-x-4">
          <div className={`p-4 rounded-[1.5rem] ${data.fasting ? 'bg-white/20' : 'bg-emerald-50'}`}>
            <span className="text-2xl">{data.fasting ? '🌙' : '🍽️'}</span>
          </div>
          <div>
            <h3 className="font-black text-lg leading-none mb-1">{t.fastingTitle}</h3>
            <p className={`text-[11px] font-bold ${data.fasting ? 'text-emerald-100' : 'text-slate-400'}`}>
              {t.fastingSub}
            </p>
          </div>
        </div>
        <div className={`w-10 h-10 rounded-[1.25rem] border-2 flex items-center justify-center transition-all ${data.fasting ? 'border-white bg-white text-emerald-600' : 'border-emerald-50 bg-emerald-50/30'}`}>
          {data.fasting && <span className="text-lg font-black">✓</span>}
        </div>
      </div>

      {/* New Section: Fasting Duas */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
         <h4 className="text-[10px] font-black text-slate-400 mb-5 tracking-widest uppercase px-1">{t.fastingDuasHeader}</h4>
         <div className="flex bg-slate-50 p-1 rounded-2xl mb-6">
            <button 
              onClick={() => setActiveDua('suhoor')}
              className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${activeDua === 'suhoor' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}
            >
              {t.duaSuhoorTitle}
            </button>
            <button 
              onClick={() => setActiveDua('iftar')}
              className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${activeDua === 'iftar' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}
            >
              {t.duaIftarTitle}
            </button>
         </div>
         <div className="space-y-4 animate-in fade-in duration-500">
            <p className="text-xl font-serif text-emerald-900 text-center leading-relaxed">
              {activeDua === 'suhoor' ? t.duaSuhoorArabic : t.duaIftarArabic}
            </p>
            <div className="pt-4 border-t border-slate-50">
               <p className="text-[11px] italic text-emerald-600 mb-2 leading-relaxed">
                  [{activeDua === 'suhoor' ? t.duaSuhoorTranslit : t.duaIftarTranslit}]
               </p>
               <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {activeDua === 'suhoor' ? t.duaSuhoorMeaning : t.duaIftarMeaning}
               </p>
            </div>
         </div>
      </div>

      {/* 3. Name of the Day */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 rounded-[2rem] border border-slate-700 shadow-lg flex items-center justify-between relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="text-4xl">✨</span>
         </div>
         <div className="flex items-center space-x-4 relative z-10">
            <div className="bg-emerald-500 p-3 rounded-2xl text-2xl shadow-lg">📜</div>
            <div>
              <p className="text-[9px] font-black text-emerald-400 tracking-[0.2em] uppercase mb-1">Күн есімі</p>
              <h5 className="font-black text-white text-base leading-tight">{nameOfDay.translit} <span className="text-emerald-400 font-serif ml-2">{nameOfDay.arabic}</span></h5>
            </div>
         </div>
         <p className="text-[10px] text-slate-300 font-medium italic max-w-[35%] text-right leading-tight relative z-10">{nameOfDay.meaning}</p>
      </div>

      {/* 4. Prayers Section */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
         <h4 className="text-[10px] font-black text-slate-400 mb-5 tracking-widest uppercase px-1">Намаздар</h4>
         <div className="grid grid-cols-3 gap-3">
            <ItemButton id="fajr" icon="🌅" small />
            <ItemButton id="duha" icon="🌤️" small />
            <ItemButton id="dhuhr" icon="☀️" small />
            <ItemButton id="asr" icon="⛅" small />
            <ItemButton id="maghrib" icon="🌇" small />
            <ItemButton id="isha" icon="🌃" small />
            <ItemButton id="taraweeh" icon="🕌" small />
            <ItemButton id="tahajjud" icon="🌌" small />
            <ItemButton id="witr" icon="✨" small />
         </div>
      </div>

      {/* 5. Charity (Садақа) Dedicated Section */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
         <div className="flex justify-between items-center mb-4 px-1">
            <h4 className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Садақа</h4>
            <div className="text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{t.charityTotalLabel}</p>
                <p className="text-xs font-black text-emerald-600">{totalCharityMonth.toLocaleString()} ₸</p>
            </div>
         </div>
         <div className="bg-emerald-50/50 p-5 rounded-[2rem] border border-emerald-100 flex items-center space-x-4">
            <div className="bg-white p-3 rounded-2xl text-2xl shadow-sm">💸</div>
            <div className="flex-1">
                <input 
                  type="number"
                  inputMode="numeric"
                  value={charityInput}
                  onChange={handleCharityChange}
                  placeholder={t.charityPlaceholder}
                  className="w-full bg-transparent border-none focus:ring-0 font-black text-lg text-emerald-900 placeholder:text-emerald-200"
                />
            </div>
            {data.charityAmount > 0 && (
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-black shadow-md">✓</div>
            )}
         </div>
      </div>

      {/* 6. Other Deeds Section */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
         <h4 className="text-[10px] font-black text-slate-400 mb-5 tracking-widest uppercase px-1">Амалдар</h4>
         <div className="grid grid-cols-2 gap-4">
            <ItemButton id="morningDhikr" icon="📿" />
            <ItemButton id="eveningDhikr" icon="🌙" />
            <ItemButton id="quranRead" icon="📖" />
            <ItemButton id="names99" icon="📜" />
            <ItemButton id="salawat" icon="💖" />
            <ItemButton id="hadith" icon="🗣️" />
            <ItemButton id="lessons" icon="🎧" />
            <ItemButton id="book" icon="📚" />
         </div>
      </div>

      {/* 7. Progress Card */}
      <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5"></div>
        <div className="flex justify-between items-end mb-5">
          <div>
            <p className="text-[11px] font-black text-emerald-400 tracking-[0.25em] uppercase mb-1">{t.progressLabel}</p>
            <h2 className="text-4xl font-black text-white">{currentDayProgress}%</h2>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-black text-white/40 uppercase tracking-tighter">
              {TRACKER_KEYS.filter(k => data[k as keyof DayProgress]).length} / {TRACKER_KEYS.length} АМАЛ
            </p>
          </div>
        </div>
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 transition-all duration-1000 ease-out" style={{ width: `${currentDayProgress}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
