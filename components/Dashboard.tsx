
import React, { useState, useEffect, useMemo } from 'react';
import { DayProgress, Language, UserData, ViewType } from '../src/types/types';
import { TRANSLATIONS, TRACKER_KEYS, TOTAL_DAYS, NAMES_99, XP_VALUES } from '../constants';
import { haptics } from '../src/utils/haptics';

interface DashboardProps {
  day: number;
  realTodayDay: number;
  ramadanInfo: { isStarted: boolean, daysUntil: number };
  data: DayProgress;
  allProgress: Record<number, DayProgress>;
  language: Language;
  updateProgress: (day: number, updates: Partial<DayProgress>) => void;
  onDaySelect: (day: number) => void;
  xp: number;
  userData?: UserData;
  setUserData?: (data: UserData) => void;
  setView: (view: ViewType) => void;
}

type CharityCategory = 'charitySadaqah' | 'charityZakat' | 'charityFitrana';

const Dashboard: React.FC<DashboardProps> = ({ 
  day: selectedDay, 
  realTodayDay,
  ramadanInfo,
  data, 
  allProgress, 
  updateProgress, 
  language,
  onDaySelect,
  xp,
  userData,
  setUserData,
  setView
}) => {
  const t = TRANSLATIONS[language];
  const [activeCategory, setActiveCategory] = useState<CharityCategory>('charitySadaqah');
  const [charityInput, setCharityInput] = useState('');

  // Monthly totals for charity
  const monthlyTotals = useMemo(() => {
    return Object.values(allProgress).reduce((acc: Record<CharityCategory, number>, curr: DayProgress) => ({
      charitySadaqah: acc.charitySadaqah + (curr.charitySadaqah || 0),
      charityZakat: acc.charityZakat + (curr.charityZakat || 0),
      charityFitrana: acc.charityFitrana + (curr.charityFitrana || 0),
    }), { charitySadaqah: 0, charityZakat: 0, charityFitrana: 0 });
  }, [allProgress]);

  // Names of Allah for the day
  const dailyNames = useMemo(() => {
    // Ограничиваем день диапазоном 1-30
    const safeDay = Math.min(Math.max(selectedDay, 1), 30);
    
    let startIndex = 0;
    let count = safeDay <= 21 ? 3 : 4;
    
    if (safeDay <= 21) {
      startIndex = (safeDay - 1) * 3;
    } else {
      startIndex = 63 + (safeDay - 22) * 4;
    }
    
    // Убеждаемся что не выходим за границы массива (99 имен)
    const endIndex = Math.min(startIndex + count, NAMES_99.length);
    return NAMES_99.slice(startIndex, endIndex);
  }, [selectedDay]);

  useEffect(() => {
    const val = data[activeCategory] || 0;
    setCharityInput(val > 0 ? val.toString() : '');
  }, [selectedDay, activeCategory, data]);

  const toggleItem = (key: keyof DayProgress, e?: React.MouseEvent<HTMLElement>) => {
    const isCompleted = data[key];
    
    // Haptic feedback
    if (isCompleted) {
      haptics.light(); // Снятие галочки - легкая вибрация
    } else {
      haptics.success(); // Установка галочки - успех
    }

    updateProgress(selectedDay, { [key]: !data[key] });
  };

  const handleCharityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCharityInput(val);
    const amount = parseInt(val) || 0;
    
    const updates: Partial<DayProgress> = { [activeCategory]: amount };
    const updatedSadaqah = activeCategory === 'charitySadaqah' ? amount : (data.charitySadaqah || 0);
    const updatedZakat = activeCategory === 'charityZakat' ? amount : (data.charityZakat || 0);
    const updatedFitrana = activeCategory === 'charityFitrana' ? amount : (data.charityFitrana || 0);
    
    updates.charityAmount = updatedSadaqah + updatedZakat + updatedFitrana;
    
    // Logic: If total charity > 0, set boolean charity to true. If became 0, false.
    const wasCharity = data.charity;
    const isCharity = updates.charityAmount > 0;
    updates.charity = isCharity;
    
    // Only give XP if it toggles from false to true or true to false
    // (We simplify here to avoid spamming XP on typing amounts)
    
    updateProgress(selectedDay, updates);
  };

  const calculateProgress = (dayNum: number) => {
    const dayData = allProgress[dayNum];
    if (!dayData) return 0;
    const completed = TRACKER_KEYS.filter(key => dayData[key as keyof DayProgress]).length;
    return Math.round((completed / TRACKER_KEYS.length) * 100);
  };

  const currentDayProgress = calculateProgress(selectedDay);
  const level = Math.floor(xp / 1000) + 1;
  const levelProgress = (xp % 1000) / 10;
  const levelName = t[`level${Math.min(level, 5)}`];

  const toggleMemorized = (id: number, e?: React.MouseEvent<HTMLElement>) => {
    if (!userData || !setUserData) return;
    
    const current = userData.memorizedNames || [];
    const isMemorized = current.includes(id);
    const next = isMemorized ? current.filter(x => x !== id) : [...current, id];
    
    const nameXp = XP_VALUES['name'] || 15;
    const xpDelta = isMemorized ? -nameXp : nameXp;
    
    // Haptic feedback
    if (isMemorized) {
      haptics.light();
    } else {
      haptics.success();
    }

    setUserData({ 
      ...userData, 
      memorizedNames: next,
      xp: Math.max(0, userData.xp + xpDelta)
    });
  };

  // Determine which days are available
  const maxAvailableDay = Math.max(1, realTodayDay);

  const ProgressCircle = React.memo(({ percentage, isSelected, isToday, dayNum, maxAvailableDay, onDaySelect }: any) => {
    const radius = 15;
    const stroke = isSelected ? 4 : 2;
    const size = 42;
    const center = size / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;
    const isLocked = dayNum > maxAvailableDay;

    return (
      <div
        onClick={() => {
          if (!isLocked) {
            haptics.selection();
            onDaySelect(dayNum);
          }
        }}
        className={`relative flex flex-col items-center justify-center transition-all ${
          isLocked ? 'cursor-not-allowed opacity-40 grayscale' : 'cursor-pointer'
        } ${isSelected ? 'scale-110 z-10' : 'opacity-80'}`}
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="absolute">
          <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-200" />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={isSelected ? 'text-emerald-600' : 'text-emerald-400'}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        {isToday && !isLocked && <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse" />}
        {isLocked ? (
          <span className="text-lg">🔒</span>
        ) : (
          <span className={`text-xs font-black ${isSelected ? 'text-emerald-600' : 'text-slate-700'}`}>{dayNum}</span>
        )}
        {!isLocked && <div className="text-[8px] font-bold text-slate-400 absolute -bottom-4">{dayNum}</div>}
      </div>
    );
  });

  // Мемоизированный компонент для производительности
  const ItemButton = React.memo(({ id, icon, small, data, toggleItem, t }: any) => (
    <button 
      onClick={(e) => toggleItem(id, e)} 
      className={`p-2 rounded-[1.25rem] border transition-all flex flex-col items-center justify-center space-y-1 relative active:scale-95 ${small ? 'h-20' : 'h-24'} ${data[id] ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-inner' : 'bg-white border-slate-100 text-slate-600 shadow-sm'}`}
    >
      {icon}
      <span className="text-[11px] font-bold text-center leading-tight">{t.items[id]}</span>
      {data[id] && <span className="absolute top-1 right-1 text-xs">✓</span>}
    </button>
  ));

  return (
    <div className="space-y-6 pb-24 relative">

      {/* Real-time Countdown Card */}
      {!ramadanInfo.isStarted && (
        <section className="bg-gradient-to-br from-emerald-950 to-emerald-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden text-center text-white border border-emerald-800 animate-in fade-in">
           <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><span className="text-8xl">🌙</span></div>
           <div className="flex flex-col items-center justify-center relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-2">РАМАЗАНҒА ДЕЙІН</p>
              <h3 className="text-8xl font-black leading-none drop-shadow-lg">{ramadanInfo.daysUntil}</h3>
              <p className="text-sm font-black uppercase tracking-[0.2em] mt-2">КҮН ҚАЛДЫ</p>
           </div>
        </section>
      )}

      {/* Level Summary */}
      <section onClick={() => {
        haptics.medium();
        setView('rewards');
      }} className="cursor-pointer active:scale-[0.98] transition-transform">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-md border border-slate-100 flex items-center space-x-5">
           <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-3xl shadow-lg shadow-emerald-200 text-white font-serif">
             {level >= 5 ? '👑' : level >= 3 ? '⚔️' : '🌙'}
           </div>
           <div className="flex-1">
             <div className="flex justify-between items-end mb-1">
                <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">{levelName}</h4>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{level} ЛВЛ</span>
             </div>
             <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${levelProgress}%` }}></div>
             </div>
           </div>
        </div>
      </section>

      {/* Online Calendar Strip */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-5 px-1">
           <h4 className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{t.calendarTitle}</h4>
           <div className="flex items-center space-x-2">
              {ramadanInfo.isStarted && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>}
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">
                {ramadanInfo.isStarted ? `${t.dayLabel} ${realTodayDay}` : 'Күту режимі'}
              </span>
           </div>
        </div>
        <div className="grid grid-cols-7 gap-y-4 gap-x-2 justify-items-center overflow-x-auto pb-2 no-scrollbar">
          {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((d) => (
            <ProgressCircle
              key={d}
              percentage={calculateProgress(d)}
              isSelected={selectedDay === d}
              isToday={d === realTodayDay}
              dayNum={d}
              maxAvailableDay={maxAvailableDay}
              onDaySelect={onDaySelect}
            />
          ))}
        </div>
      </div>

      {/* Daily Trackers List */}
      <div className="space-y-6">
        
        {/* Fasting Card */}
        <div onClick={(e) => {
          haptics.medium();
          toggleItem('fasting', e);
        }} className={`p-6 rounded-[2.5rem] transition-all cursor-pointer flex items-center justify-between active:scale-95 ${data.fasting ? 'bg-emerald-600 text-white shadow-xl' : 'bg-white text-emerald-900 border border-slate-100 shadow-sm'}`}>
          <div className="flex items-center space-x-4">
            <div className={`p-4 rounded-[1.5rem] ${data.fasting ? 'bg-white/20' : 'bg-emerald-50'}`}><span className="text-2xl">{data.fasting ? '🌙' : '🍽️'}</span></div>
            <div>
              <h3 className="font-black text-lg leading-none mb-1">{t.fastingTitle}</h3>
              <p className={`text-[11px] font-bold ${data.fasting ? 'text-emerald-100' : 'text-slate-400'}`}>{t.fastingSub}</p>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-[1.25rem] border-2 flex items-center justify-center transition-all ${data.fasting ? 'border-white bg-white text-emerald-600' : 'border-emerald-50 bg-emerald-50/30'}`}>{data.fasting && <span className="text-lg font-black">✓</span>}</div>
        </div>

        {/* Prayers Section */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
           <h4 className="text-[10px] font-black text-slate-400 mb-5 tracking-widest uppercase px-1">Намаздар</h4>
           <div className="grid grid-cols-3 gap-3">
              <ItemButton id="fajr" icon="🌅" small data={data} toggleItem={toggleItem} t={t} />
              <ItemButton id="duha" icon="🌤️" small data={data} toggleItem={toggleItem} t={t} />
              <ItemButton id="dhuhr" icon="☀️" small data={data} toggleItem={toggleItem} t={t} />
              <ItemButton id="asr" icon="⛅" small data={data} toggleItem={toggleItem} t={t} />
              <ItemButton id="maghrib" icon="🌇" small data={data} toggleItem={toggleItem} t={t} />
              <ItemButton id="isha" icon="🌃" small data={data} toggleItem={toggleItem} t={t} />
              <ItemButton id="taraweeh" icon="🕌" small data={data} toggleItem={toggleItem} t={t} />
              <ItemButton id="tahajjud" icon="🌌" small data={data} toggleItem={toggleItem} t={t} />
              <ItemButton id="witr" icon="✨" small data={data} toggleItem={toggleItem} t={t} />
           </div>
        </div>

        {/* Spiritual Deeds Section */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
           <h4 className="text-[10px] font-black text-slate-400 mb-5 tracking-widest uppercase px-1">Рухани амалдар</h4>
           <div className="grid grid-cols-3 gap-3">
              <ItemButton id="quranRead" icon="📖" small data={data} toggleItem={toggleItem} t={t} />
              <ItemButton id="morningDhikr" icon="🌅" small data={data} toggleItem={toggleItem} t={t} />
              <ItemButton id="eveningDhikr" icon="🌃" small data={data} toggleItem={toggleItem} t={t} />
              <ItemButton id="salawat" icon="📿" small data={data} toggleItem={toggleItem} t={t} />
              <ItemButton id="names99" icon="📜" small data={data} toggleItem={toggleItem} t={t} />
              <ItemButton id="hadith" icon="☪️" small data={data} toggleItem={toggleItem} t={t} />
              <ItemButton id="lessons" icon="🎧" small data={data} toggleItem={toggleItem} t={t} />
              <ItemButton id="book" icon="📚" small data={data} toggleItem={toggleItem} t={t} />
           </div>
        </div>

        {/* Names of Allah Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 text-9xl font-serif pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            {dailyNames[0]?.arabic}
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
                <h4 className="text-[10px] font-black text-emerald-400 tracking-[0.3em] uppercase flex items-center">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
                  {t.namesDailyTitle}
                </h4>
                <button 
                  onClick={() => {
                    haptics.selection();
                    setView('dashboard');
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-colors backdrop-blur-sm shadow-lg border border-white/20"
                >
                  {t.viewAllNames} →
                </button>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {dailyNames.map((name) => {
                const isLearned = userData?.memorizedNames?.includes(name.id);
                return (
                  <div key={name.id} onClick={(e) => toggleMemorized(name.id, e)} className={`flex items-center justify-between p-4 rounded-[1.8rem] border transition-all cursor-pointer active:scale-[0.98] ${isLearned ? 'bg-white/20 border-white/30 text-white shadow-lg' : 'bg-black/10 border-white/10 text-emerald-50 hover:bg-black/20'}`}>
                     <div className="flex items-center space-x-4 overflow-hidden">
                        <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-[10px] font-black transition-all ${isLearned ? 'bg-emerald-400 text-emerald-900 shadow-md shadow-emerald-400/20' : 'bg-white/10 text-emerald-200'}`}>{name.id}</div>
                        <div className="overflow-hidden">
                           <span className="text-xl font-serif block leading-none mb-1 truncate">{name.arabic}</span>
                           <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200/70 truncate">{name.translit}</span>
                        </div>
                     </div>
                     <div className={`w-8 h-8 rounded-xl border-2 flex-shrink-0 flex items-center justify-center transition-all ${isLearned ? 'bg-white border-white text-emerald-700' : 'border-white/20 bg-transparent'}`}>{isLearned && <span className="text-sm font-black">✓</span>}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Charity / Sadaqa Section */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6 px-1">
            <h4 className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">{t.items.charity}</h4>
            <div className="flex items-center space-x-1.5">
               <span className="text-[10px] font-black text-slate-400 uppercase">Осы айда: </span>
               <span className="text-sm font-black text-emerald-600">{(monthlyTotals[activeCategory] || 0).toLocaleString()} ₸</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-6">
            {(['charitySadaqah', 'charityZakat', 'charityFitrana'] as CharityCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-tighter transition-all border flex flex-col items-center space-y-1 ${
                  activeCategory === cat 
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' 
                    : 'bg-white border-slate-100 text-slate-400'
                }`}
              >
                <span>{t[cat]}</span>
                <span className={`text-[8px] opacity-70 ${activeCategory === cat ? 'text-white' : 'text-slate-300'}`}>
                  {monthlyTotals[cat].toLocaleString()} ₸
                </span>
              </button>
            ))}
          </div>
          
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={charityInput}
              onChange={handleCharityChange}
              onFocus={(e) => {
                 setTimeout(() => {
                   e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 }, 300);
              }}
              placeholder={t.charityPlaceholder}
              className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm font-black text-slate-800 placeholder:text-slate-300 focus:ring-2 ring-emerald-500 transition-all outline-none"
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-xs">₸</div>
          </div>
        </div>

        {/* Overall Progress Section */}
        <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
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
    </div>
  );
};

export default Dashboard;