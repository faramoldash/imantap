import React, { useState, useEffect, useMemo } from 'react';
import { DayProgress, Language, UserData, ViewType } from '../src/types/types';
import { TRANSLATIONS, TRACKER_KEYS, PREPARATION_TRACKER_KEYS, TOTAL_DAYS, NAMES_99, XP_VALUES, RAMADAN_START_DATE, PREPARATION_START_DATE, FIRST_TARAWEEH_DATE } from '../constants';
import { haptics } from '../src/utils/haptics';
import RealCalendar from './RealCalendar';

interface DashboardProps {
  day: number;
  realTodayDay: number;
  ramadanInfo: { isStarted: boolean, daysUntil: number };
  data: DayProgress;
  allProgress: Record<number, DayProgress>;
  language: Language;
  updateProgress: (day: number, updates: Partial<DayProgress>) => void;
  onDaySelect: (day: number) => void;
  onBasicDateSelect: (date: Date) => void;
  xp: number;
  userData?: UserData;
  setUserData?: (data: UserData) => void;
  setView: (view: ViewType) => void;
  onPreparationDaySelect: (day: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  day: selectedDay, 
  realTodayDay,
  ramadanInfo,
  data, 
  allProgress, 
  updateProgress, 
  language,
  onDaySelect,
  onPreparationDaySelect,
  onBasicDateSelect,
  xp,
  userData,
  setUserData,
  setView,
}) => {
  const t = TRANSLATIONS[language];

  // ✅ ОПРЕДЕЛЯЕМ ТЕКУЩИЙ ДЕНЬ С УЧЕТОМ ФАЗЫ
  const currentDay = useMemo(() => {
    const almatyOffset = 5 * 60;
    const now = new Date();
    const almatyTime = new Date(now.getTime() + (almatyOffset + now.getTimezoneOffset()) * 60000);
    
    if (ramadanInfo.isStarted) {
      // Рамадан
      const ramadanStart = new Date(RAMADAN_START_DATE + 'T00:00:00+05:00');
      const daysSinceRamadan = Math.floor((almatyTime.getTime() - ramadanStart.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(1, Math.min(daysSinceRamadan + 1, 30));
    } else {
      // Подготовка
      const prepStart = new Date(PREPARATION_START_DATE + 'T00:00:00+05:00');
      const daysSincePrep = Math.floor((almatyTime.getTime() - prepStart.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(1, Math.min(daysSincePrep + 1, 10));
    }
  }, [ramadanInfo.isStarted]);

  // ✅ ИСПОЛЬЗУЕМ ПРАВИЛЬНЫЙ ИСТОЧНИК ДАННЫХ
  const currentData = useMemo(() => {
    if (ramadanInfo.isStarted) {
      return allProgress[currentDay] || {};
    } else {
      return userData?.preparationProgress?.[currentDay] || {};
    }
  }, [currentDay, ramadanInfo.isStarted, allProgress, userData?.preparationProgress]);

  console.log('📅 DASHBOARD CURRENT DAY:', {
    currentDay,
    isRamadan: ramadanInfo.isStarted,
    currentData
  });

  const toggleItem = (key: keyof DayProgress, e?: React.MouseEvent<HTMLElement>) => {
    const isCompleted = currentData[key];
    if (isCompleted) {
      haptics.light();
    } else {
      haptics.success();
    }
    updateProgress(currentDay, { [key]: !currentData[key] });
  };

  const calculateProgress = (dayNum: number) => {
    const dayData = ramadanInfo.isStarted 
      ? allProgress[dayNum]
      : userData?.preparationProgress?.[dayNum];
    if (!dayData) return 0;
    
    const keys = ramadanInfo.isStarted ? TRACKER_KEYS : PREPARATION_TRACKER_KEYS;
    const completed = keys.filter(key => dayData[key as keyof DayProgress]).length;
    return Math.round((completed / keys.length) * 100);
  };

  const currentDayProgress = calculateProgress(currentDay);

  const toggleMemorized = (id: number, e?: React.MouseEvent<HTMLElement>) => {
    if (!userData || !setUserData) return;
    const current = userData.memorizedNames || [];
    const isMemorized = current.includes(id);
    const next = isMemorized ? current.filter(x => x !== id) : [...current, id];
    const nameXp = XP_VALUES['name'] || 15;
    const xpDelta = isMemorized ? -nameXp : nameXp;
    
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

  // ✅ РАНДОМНЫЕ НЕВЫУЧЕННЫЕ ИМЕНА (3 штуки)
  const dailyNames = useMemo(() => {
    const memorized = userData?.memorizedNames || [];
    const unlearned = NAMES_99.filter(name => !memorized.includes(name.id));
    
    if (unlearned.length === 0) {
      // Все имена выучены - показываем рандомные
      const shuffled = [...NAMES_99].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 3);
    }
    
    // Показываем 3 рандомных невыученных
    const shuffled = [...unlearned].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [userData?.memorizedNames, currentDay]);

  const ItemButton = React.memo(({ id, icon, small, currentData, toggleItem, t }: any) => (
    <button 
      onClick={(e) => toggleItem(id, e)} 
      className={`p-2 rounded-[1.25rem] border transition-all flex flex-col items-center justify-center space-y-1 relative active:scale-95 ${small ? 'h-20' : 'h-24'} ${currentData[id] ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-inner' : 'bg-white border-slate-100 text-slate-600 shadow-sm'}`}
    >
      {icon}
      <span className="text-[11px] font-bold text-center leading-tight">{t.items[id]}</span>
      {currentData[id] && <span className="absolute top-1 right-1 text-xs">✓</span>}
    </button>
  ));

  return (
    <div className="space-y-6 pb-4 relative">

      {/* Real-time Countdown Card */}
      {!ramadanInfo.isStarted && (
        <section className="bg-gradient-to-br from-emerald-950 to-emerald-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden text-center text-white border border-emerald-800 animate-in fade-in">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <span className="text-8xl">🌙</span>
          </div>
          
          <div className="flex flex-col items-center justify-center relative z-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3 mb-4 border border-white/20">
              <p className="text-sm font-black text-emerald-300">
                19 {language === 'kk' ? 'ақпан' : 'февраля'}
              </p>
              <p className="text-[10px] font-bold text-white/80 mt-1">
                {language === 'kk' ? 'Рамазанның 1-ші күні' : '1-й день Рамадана'}
              </p>
            </div>
            
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-2">
              {language === 'kk' ? 'РАМАЗАНҒА ДЕЙІН' : 'ДО РАМАДАНА'}
            </p>
            <h3 className="text-8xl font-black leading-none drop-shadow-lg">
              {ramadanInfo.daysUntil}
            </h3>
            <p className="text-sm font-black uppercase tracking-[0.2em] mt-2">
              {language === 'kk' ? 'КҮН ҚАЛДЫ' : 'ДНЕЙ ОСТАЛОСЬ'}
            </p>
          </div>
        </section>
      )}

      {/* ✅ STREAK CARD */}
      <section className="bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20 text-9xl">🔥</div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-1">
              {language === 'kk' ? 'Қатарынан' : 'Подряд'}
            </p>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-5xl font-black text-white leading-none">
                {userData?.currentStreak || 0}
              </h3>
              <span className="text-xl font-black text-white/80">
                {language === 'kk' ? 'күн' : 'дней'}
              </span>
            </div>
            
            {(userData?.currentStreak || 0) > 0 && (
              <p className="text-xs font-bold text-white/90 mt-2">
                {language === 'kk' ? '🔥 Жалғастырыңыз! МашаАллаһ!' : '🔥 Продолжайте! МашаАллаһ!'}
              </p>
            )}
            
            {(userData?.currentStreak || 0) === 0 && (
              <p className="text-xs font-bold text-white/90 mt-2">
                {language === 'kk' ? 'Бүгін белгілеп қатарды бастаңыз! 💪' : 'Начните серию сегодня! 💪'}
              </p>
            )}
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-5xl mb-2 backdrop-blur-sm">
              🔥
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black text-white/70 uppercase tracking-wider">
                {language === 'kk' ? 'Максимум' : 'Максимум'}
              </p>
              <p className="text-xs font-black text-white leading-tight">
                {userData?.longestStreak || 0} {language === 'kk' ? 'күн' : 'дней'}
              </p>
              <p className="text-[7px] font-bold text-white/70">
                {language === 'kk' ? 'қатарынан' : 'подряд'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ ТРЕКЕР ТЕКУЩЕГО ДНЯ - ШАПКА */}
      <section className="bg-gradient-to-br from-sky-600 to-blue-600 p-6 rounded-[3rem] shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <span className="text-9xl">🌙</span>
        </div>
        
        <div className="relative z-10">
          <div className="text-center mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-90 mb-2">
              {ramadanInfo.isStarted 
                ? (language === 'kk' ? 'Рамазан' : 'Рамадан')
                : (language === 'kk' ? 'Рамазанға дайындық' : 'Подготовка к Рамадану')}
            </p>
            <h1 className="text-2xl font-black mb-2">
              {language === 'kk' ? 'Күн' : 'День'} {currentDay}
            </h1>
            <p className="text-sm font-bold opacity-90">
              {(() => {
                const prepStartDate = ramadanInfo.isStarted 
                  ? new Date(RAMADAN_START_DATE)
                  : new Date(PREPARATION_START_DATE);
                const currentDayDate = new Date(prepStartDate);
                currentDayDate.setDate(prepStartDate.getDate() + (currentDay - 1));
                
                const monthNames = language === 'kk' 
                  ? ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан']
                  : ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
                const weekDays = language === 'kk'
                  ? ['Жексенбі', 'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі']
                  : ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
                
                return `${weekDays[currentDayDate.getDay()]}, ${currentDayDate.getDate()} ${monthNames[currentDayDate.getMonth()]}`;
              })()}
            </p>
            
            {/* Бейджи для подготовки */}
            {!ramadanInfo.isStarted && (() => {
              const prepStartDate = new Date(PREPARATION_START_DATE);
              const currentDayDate = new Date(prepStartDate);
              currentDayDate.setDate(prepStartDate.getDate() + (currentDay - 1));
              const dayOfWeek = currentDayDate.getDay();
              const isMondayOrThursday = dayOfWeek === 1 || dayOfWeek === 4;
              const firstTaraweehDate = new Date(FIRST_TARAWEEH_DATE);
              const isFirstTaraweehDay = currentDayDate.getTime() === firstTaraweehDate.getTime();
              
              return (
                <div className="flex justify-center gap-2 flex-wrap mt-3">
                  {isMondayOrThursday && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                      <p className="text-xs font-bold">🌙 {language === 'kk' ? 'Дүйсенбі/Бейсенбі оразасы' : 'Ораза в пн/чт'}</p>
                    </div>
                  )}
                  {isFirstTaraweehDay && (
                    <div className="bg-amber-500/20 backdrop-blur-sm rounded-full px-3 py-1.5 border border-amber-300/30">
                      <p className="text-xs font-bold">⭐ {language === 'kk' ? 'Бірінші таравих!' : 'Первый таравих!'}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Ораза */}
      {(() => {
        const showFasting = ramadanInfo.isStarted || (() => {
          const prepStartDate = new Date(PREPARATION_START_DATE);
          const currentDayDate = new Date(prepStartDate);
          currentDayDate.setDate(prepStartDate.getDate() + (currentDay - 1));
          const dayOfWeek = currentDayDate.getDay();
          return dayOfWeek === 1 || dayOfWeek === 4;
        })();
        
        if (!showFasting) return null;
        
        return (
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-sky-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-sky-100 rounded-[2rem] flex items-center justify-center text-2xl">
                  🌙
                </div>
                <div>
                  <h3 className="font-black text-slate-800">
                    {language === 'kk' ? 'Ораза' : 'Ораза'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {ramadanInfo.isStarted 
                      ? (language === 'kk' ? 'Міндетті ораза' : 'Обязательная ораза')
                      : (language === 'kk' ? 'Сүннет ораза' : 'Сунна ораза')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleItem('fasting')}
                className={`w-12 h-12 rounded-2xl transition-all ${
                  currentData.fasting
                    ? 'bg-sky-600 text-white shadow-lg active:scale-95'
                    : 'bg-slate-100 text-slate-400 active:scale-95'
                }`}
              >
                {currentData.fasting ? '✓' : ''}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Намазы */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-sky-100">
        <h4 className="text-[10px] font-black text-slate-400 mb-5 tracking-widest uppercase px-1">
          {language === 'kk' ? 'Намаздар' : 'Намазы'}
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <ItemButton id="fajr" icon={<span className="text-2xl">🌅</span>} small currentData={currentData} toggleItem={toggleItem} t={t} />
          <ItemButton id="duha" icon={<span className="text-2xl">☀️</span>} small currentData={currentData} toggleItem={toggleItem} t={t} />
          <ItemButton id="dhuhr" icon={<span className="text-2xl">🌞</span>} small currentData={currentData} toggleItem={toggleItem} t={t} />
          <ItemButton id="asr" icon={<span className="text-2xl">🌤️</span>} small currentData={currentData} toggleItem={toggleItem} t={t} />
          <ItemButton id="maghrib" icon={<span className="text-2xl">🌆</span>} small currentData={currentData} toggleItem={toggleItem} t={t} />
          <ItemButton id="isha" icon={<span className="text-2xl">🌙</span>} small currentData={currentData} toggleItem={toggleItem} t={t} />
          {ramadanInfo.isStarted && (
            <>
              <ItemButton id="taraweeh" icon={<span className="text-2xl">⭐</span>} small currentData={currentData} toggleItem={toggleItem} t={t} />
              <ItemButton id="tahajjud" icon={<span className="text-2xl">🌌</span>} small currentData={currentData} toggleItem={toggleItem} t={t} />
              <ItemButton id="witr" icon={<span className="text-2xl">✨</span>} small currentData={currentData} toggleItem={toggleItem} t={t} />
            </>
          )}
          {!ramadanInfo.isStarted && (() => {
            const prepStartDate = new Date(PREPARATION_START_DATE);
            const currentDayDate = new Date(prepStartDate);
            currentDayDate.setDate(prepStartDate.getDate() + (currentDay - 1));
            const firstTaraweehDate = new Date(FIRST_TARAWEEH_DATE);
            const isFirstTaraweehDay = currentDayDate.getTime() === firstTaraweehDate.getTime();
            
            return isFirstTaraweehDay ? (
              <ItemButton id="taraweeh" icon={<span className="text-2xl">⭐</span>} small currentData={currentData} toggleItem={toggleItem} t={t} />
            ) : null;
          })()}
        </div>
      </div>

      {/* Духовные практики */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-sky-100">
        <h4 className="text-[10px] font-black text-slate-400 mb-5 tracking-widest uppercase px-1">
          {language === 'kk' ? 'Рухани амалдар' : 'Духовные практики'}
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <ItemButton id="quranRead" icon={<span className="text-2xl">📖</span>} small currentData={currentData} toggleItem={toggleItem} t={t} />
          <ItemButton id="morningDhikr" icon={<span className="text-2xl">🤲</span>} small currentData={currentData} toggleItem={toggleItem} t={t} />
          <ItemButton id="eveningDhikr" icon={<span className="text-2xl">🌙</span>} small currentData={currentData} toggleItem={toggleItem} t={t} />
          {!ramadanInfo.isStarted && (
            <>
              <ItemButton id="salawat" icon={<span className="text-2xl">☪️</span>} small currentData={currentData} toggleItem={toggleItem} t={t} />
              <ItemButton id="hadith" icon={<span className="text-2xl">📜</span>} small currentData={currentData} toggleItem={toggleItem} t={t} />
              <ItemButton id="charity" icon={<span className="text-2xl">💝</span>} small currentData={currentData} toggleItem={toggleItem} t={t} />
            </>
          )}
        </div>
      </div>
      {/* ✅ 99 ИМЕН АЛЛАХА - 3 РАНДОМНЫХ НЕВЫУЧЕННЫХ */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-5 text-9xl font-serif pointer-events-none group-hover:scale-110 transition-transform duration-1000">
          {dailyNames[0]?.arabic}
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[10px] font-black text-emerald-400 tracking-[0.3em] uppercase flex items-center">
              <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
              {language === 'kk' ? 'Аллаһтың 99 есімі' : '99 имен Аллаха'}
            </h4>
            <button 
              onClick={() => {
                haptics.selection();
                setView('names-99');
              }}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-colors backdrop-blur-sm shadow-lg border border-white/20"
            >
              {language === 'kk' ? 'Барлығы →' : 'Все →'}
            </button>
          </div>
          
          <p className="text-xs text-emerald-200 mb-4 font-medium">
            {language === 'kk' 
              ? '🎯 Бүгін үшін 3 жаңа есім' 
              : '🎯 3 новых имени на сегодня'}
          </p>
          
          <div className="grid grid-cols-1 gap-3">
            {dailyNames.map((name) => {
              const isLearned = userData?.memorizedNames?.includes(name.id);
              return (
                <div 
                  key={name.id} 
                  onClick={(e) => toggleMemorized(name.id, e)} 
                  className={`flex items-center justify-between p-4 rounded-[1.8rem] border transition-all cursor-pointer active:scale-[0.98] ${
                    isLearned 
                      ? 'bg-white/20 border-white/30 text-white shadow-lg' 
                      : 'bg-black/10 border-white/10 text-emerald-50 hover:bg-black/20'
                  }`}
                >
                  <div className="flex items-center space-x-4 overflow-hidden">
                    <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-[10px] font-black transition-all ${
                      isLearned 
                        ? 'bg-emerald-400 text-emerald-900 shadow-md shadow-emerald-400/20' 
                        : 'bg-white/10 text-emerald-200'
                    }`}>
                      {name.id}
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-xl font-serif block leading-none mb-1 truncate">{name.arabic}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200/70 truncate">{name.translit}</span>
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-xl border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    isLearned 
                      ? 'bg-white border-white text-emerald-700' 
                      : 'border-white/20 bg-transparent'
                  }`}>
                    {isLearned && <span className="text-sm font-black">✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Прогресс заучивания */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60 font-bold">
                {language === 'kk' ? 'Жаттандым' : 'Выучено'}
              </span>
              <span className="text-emerald-400 font-black">
                {userData?.memorizedNames?.length || 0} / 99
              </span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-500"
                style={{ width: `${Math.round(((userData?.memorizedNames?.length || 0) / 99) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ КАЛЕНДАРЬ */}
      <RealCalendar 
        language={language}
        ramadanStartDate={RAMADAN_START_DATE}
        preparationStartDate={PREPARATION_START_DATE}
        firstTaraweehDate={FIRST_TARAWEEH_DATE}
        allProgress={allProgress}
        preparationProgress={userData?.preparationProgress || {}}
        selectedDay={selectedDay}
        realTodayDay={realTodayDay}
        onDaySelect={onDaySelect}
        onPreparationDaySelect={onPreparationDaySelect}
        onBasicDateSelect={onBasicDateSelect}
        trackerKeys={TRACKER_KEYS}
        preparationTrackerKeys={PREPARATION_TRACKER_KEYS}
      />

      {/* ✅ ПРОГРЕСС БАР */}
      <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl">✅</div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
              {language === 'kk' ? 'Бүгінгі прогресс' : 'Сегодняшний прогресс'}
            </h4>
            <span className="text-xs font-black text-white/40">
              {language === 'kk' ? `${currentDay}-күн` : `День ${currentDay}`}
            </span>
          </div>
          
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-5xl font-black leading-none">
                {(ramadanInfo.isStarted ? TRACKER_KEYS : PREPARATION_TRACKER_KEYS).filter(k => currentData[k as keyof DayProgress]).length}
              </p>
              <p className="text-sm font-bold text-white/60 mt-1">
                / {ramadanInfo.isStarted ? TRACKER_KEYS.length : PREPARATION_TRACKER_KEYS.length} {language === 'kk' ? 'тапсырма' : 'задач'}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-3xl font-black">
                {currentDayProgress}%
              </p>
              <p className="text-[10px] font-black text-white/60 uppercase">
                {language === 'kk' ? 'орындалды' : 'выполнено'}
              </p>
            </div>
          </div>
          
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 transition-all duration-1000 ease-out"
              style={{ width: `${currentDayProgress}%` }}
            ></div>
          </div>
          
          {/* Мотивационные сообщения */}
          {currentDayProgress === 100 && (
            <p className="text-xs font-black text-emerald-400 mt-3 text-center">
              🎉 {language === 'kk' ? 'Жарайсыз! Барлық амалдар орындалды!' : 'Отлично! Все задачи выполнены!'}
            </p>
          )}
          
          {currentDayProgress >= 50 && currentDayProgress < 100 && (
            <p className="text-xs font-bold text-white/80 mt-3 text-center">
              💪 {language === 'kk' ? 'Жақсы нәтиже! Тоқтамаңыз!' : 'Хороший результат! Не останавливайтесь!'}
            </p>
          )}
          
          {currentDayProgress < 50 && currentDayProgress > 0 && (
            <p className="text-xs font-bold text-white/80 mt-3 text-center">
              🚀 {language === 'kk' ? 'Керемет бастама! Толық орындауға тырысыңыз!' : 'Отличное начало! Постарайтесь выполнить все!'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;