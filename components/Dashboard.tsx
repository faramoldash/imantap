import React, { useState, useEffect, useMemo } from 'react';
import { DayProgress, Language, UserData, ViewType } from '../src/types/types';
import { TRANSLATIONS, TRACKER_KEYS, PREPARATION_TRACKER_KEYS, NAMES_99, RAMADAN_START_DATE, PREPARATION_START_DATE, FIRST_TARAWEEH_DATE, EID_AL_FITR_DATE, PRAYER_ICONS } from '../constants';
import { haptics } from '../src/utils/haptics';
import RealCalendar from './RealCalendar';
import SubscriptionStatus from '../components/SubscriptionStatus';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ✅ Хелпер: дата по Алматы времени (UTC+5)
function toLocalDateStr(date: Date): string {
  return date.toLocaleDateString('en-CA', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
}

interface DashboardProps {
  day: number;
  realTodayDay: number;
  ramadanInfo: { isStarted: boolean, daysUntil: number };
  data: DayProgress;
  allProgress: Record<number, DayProgress>;
  language: Language;
  updateProgress: (day: number, updates: Partial<DayProgress>) => void;
  updatePreparationProgress: (day: number, updates: Partial<DayProgress>) => void;
  updateBasicProgress?: (dateStr: string, updates: Partial<DayProgress>) => void;
  onDaySelect: (day: number) => void;
  onBasicDateSelect: (date: Date) => void;
  xp: number;
  userData?: UserData;
  setUserData?: (data: UserData) => void;
  setView: (view: ViewType) => void;
  onPreparationDaySelect: (day: number) => void;
}

const ItemButton = React.memo(({ id, icon, small, displayedData, toggleItem, t, disabled, prayerTime }: any) => (
    <button
      onClick={(e) => !disabled && toggleItem(id, e)}
      disabled={disabled}
      className={`p-2 rounded-[1.25rem] border transition-all flex flex-col items-center justify-center space-y-1 relative ${
        disabled
          ? 'cursor-not-allowed opacity-40'
          : 'active:scale-95 cursor-pointer'
      } ${small ? 'h-20' : 'h-24'} ${
        displayedData[id]
          ? 'btn-tracker-active shadow-inner'
          : 'btn-tracker-inactive shadow-sm'
      }`}
    >
      {icon}
      <span className="text-[11px] font-bold text-center leading-tight">{t.items[id]}</span>
      {prayerTime && <span className="text-[10px] font-black text-secondary leading-none">{prayerTime}</span>}
      {displayedData[id] && <span className="absolute top-1 right-1 text-xs">✓</span>}
      {disabled && <span className="absolute top-1 right-1 text-xs">🔒</span>}
    </button>
  ));

const Dashboard: React.FC<DashboardProps> = ({ 
  day: selectedDay, 
  realTodayDay,
  ramadanInfo,
  data, 
  allProgress, 
  updateProgress,
  updatePreparationProgress,
  updateBasicProgress,
  language,
  onDaySelect,
  onPreparationDaySelect,
  onBasicDateSelect,
  xp,
  userData,
  setUserData,
  setView,
}) => {

  // Показываем предупреждение только если осталось ≤ 3 дня
  const showSubscriptionWarning = userData.daysLeft !== null && 
                                   userData.daysLeft <= 3 && 
                                   userData.daysLeft > 0;

  // Shawwal
  const SHAWWAL_START_DATE = '2026-03-21';
  const SHAWWAL_END_DATE = '2026-04-19';
  const shawwalCompleted = userData?.shawwalFasts || 0;
  const isShawwalActive = (() => {
    const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: userTZ });
    return todayStr >= SHAWWAL_START_DATE &&
           todayStr <= SHAWWAL_END_DATE &&
           shawwalCompleted < 6;
  })();
  const isShawwalDone = shawwalCompleted >= 6;

  const t = TRANSLATIONS[language];
  // ✅ Состояние для управления видимыми именами
  const [visibleNames, setVisibleNames] = useState<typeof NAMES_99>([]);
  const [fadingOutId, setFadingOutId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [shawwalLoading, setShawwalLoading] = useState(false);
  const [shawwalDismissed, setShawwalDismissed] = useState(() =>
    localStorage.getItem('shawwal_done_dismissed') === '1'
  );

  // Проверяем все ли имена выучены
  const allNamesLearned = (userData?.memorizedNames?.length || 0) === 99;

  // ✅ ОПРЕДЕЛЯЕМ ТЕКУЩИЙ ДЕНЬ С УЧЕТОМ ФАЗЫ
  const currentDay = (() => {
    const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: userTZ });
    const todayDate = new Date(todayStr + 'T00:00:00');
    const prepStart = new Date(PREPARATION_START_DATE + 'T00:00:00');
    const daysSincePrep = Math.floor((todayDate.getTime() - prepStart.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, daysSincePrep + 1);
  })();

  // ✅ ОПРЕДЕЛЯЕМ ФАЗУ И ДАТУ ВЫБРАННОГО ДНЯ
  const selectedDayInfo = useMemo(() => {
    // new Date(y, m-1, d) создаёт полночь в локальном TZ браузера —
    // согласованно с тем, как currentDay строит todayDate выше.
    // Заменяет 'T00:00:00+05:00', который давал сдвиг для не-UTC+5 пользователей.
    const [rY, rM, rD] = RAMADAN_START_DATE.split('-').map(Number);
    const ramadanStartMs = new Date(rY, rM - 1, rD).getTime();

    const [eY, eM, eD] = EID_AL_FITR_DATE.split('-').map(Number);
    const eidDateMs = new Date(eY, eM - 1, eD).getTime();

    const [pY, pM, pD] = PREPARATION_START_DATE.split('-').map(Number);
    const prepStartMs = new Date(pY, pM - 1, pD).getTime();
    const selectedDateMs = prepStartMs + (selectedDay - 1) * 86400000;

    let phase: 'basic' | 'preparation' | 'ramadan';
    let dayInPhase: number;

    if (selectedDateMs < prepStartMs) {
      // ✅ До 9 февраля — обычный трекер
      phase = 'basic';
      dayInPhase = selectedDay;
    } else if (selectedDateMs < ramadanStartMs) {
      phase = 'preparation';
      dayInPhase = selectedDay;
    } else if (selectedDateMs >= eidDateMs) {
      phase = 'basic';
      dayInPhase = Math.floor((selectedDateMs - eidDateMs) / 86400000) + 1;
    } else {
      phase = 'ramadan';
      dayInPhase = Math.floor((selectedDateMs - ramadanStartMs) / 86400000) + 1;
    }

    // ✅ Создаём локальную дату без UTC смещения
    const [py, pm, pd] = PREPARATION_START_DATE.split('-').map(Number);
    const selectedDate = new Date(py, pm - 1, pd + (selectedDay - 1));

    console.log('📅 SELECTED DAY INFO:', { selectedDay, phase, dayInPhase, date: toLocalDateStr(selectedDate) });
    return { phase: phase as 'basic' | 'preparation' | 'ramadan', dayInPhase, selectedDate };
  }, [selectedDay]);

  // ✅ ДАННЫЕ ОТОБРАЖАЕМОГО ДНЯ
  const displayedData = useMemo(() => {
    let data;
    if (selectedDayInfo.phase === 'ramadan') {
      data = allProgress[selectedDayInfo.dayInPhase];
    } else if (selectedDayInfo.phase === 'preparation') {
      data = userData?.preparationProgress?.[selectedDayInfo.dayInPhase];
    } else {
      const dateKey = toLocalDateStr(selectedDayInfo.selectedDate);
      data = userData?.basicProgress?.[dateKey];
    }
    // ✅ Если день ещё пустой — возвращаем пустой объект, а не undefined
    return data || {};
  }, [selectedDay, selectedDayInfo, allProgress, userData]);

  const isToday = selectedDay === currentDay;
  const isFutureDay = selectedDay > currentDay;


  const markShawwalFast = async (dateStr?: string) => {
    if (shawwalLoading) return;
    haptics.success();
    setShawwalLoading(true);

    console.log('🌙 markShawwalFast called, dateStr:', dateStr);

    try {
      const tg = (window as any).Telegram?.WebApp;
      const userId = tg?.initDataUnsafe?.user?.id;
      const BOT_API = import.meta.env.VITE_API_URL || 'https://your-bot-url.railway.app';

      console.log('🌙 userId:', userId, 'BOT_API:', BOT_API);
      console.log('🌙 sending to:', `${BOT_API}/shawwal-fast`);

      const res = await fetch(`${BOT_API}/shawwal-fast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date: dateStr || null })
      });

      console.log('🌙 response status:', res.status);

      const data = await res.json();

      console.log('🌙 response data:', data);

      if (data.success && setUserData && userData) {
        setUserData({ 
          ...userData, 
          shawwalFasts: data.shawwalFasts,
          shawwalDates: data.shawwalDates || (userData as any).shawwalDates || []
        });
      }
      if (data.alreadyMarked) {
        haptics.light();
      }
    } catch (e) {
      console.error('❌ Shawwal error:', e);
    } finally {
      setShawwalLoading(false);
    }
  };

  console.log('📅 DASHBOARD:', {
    selectedDay,
    currentDay,
    isToday,
    phase: selectedDayInfo.phase,
    displayedData
  });

  const toggleItem = (key: keyof DayProgress, e?: React.MouseEvent<HTMLElement>) => {
    // ✅ БЛОКИРУЕМ БУДУЩИЕ ДНИ
    if (isFutureDay) {
      haptics.light();
      return;
    }
    
    const isCompleted = displayedData[key];
    const newValue = !isCompleted;
    
    if (isCompleted) {
      haptics.light();
    } else {
      haptics.success();
    }
    
    // ✅ УБРАЛИ ЛОКАЛЬНОЕ НАЧИСЛЕНИЕ XP - теперь только с бэкенда!
    
    // ✅ Используем правильную функцию в зависимости от фазы
    if (selectedDayInfo.phase === 'ramadan') {
      updateProgress(selectedDayInfo.dayInPhase, { 
        [key]: newValue,
        date: toLocalDateStr(selectedDayInfo.selectedDate)
      });
    } else if (selectedDayInfo.phase === 'preparation') {
      updatePreparationProgress(selectedDayInfo.dayInPhase, { 
        [key]: newValue,
        date: toLocalDateStr(selectedDayInfo.selectedDate)
      });
    } else {
      // Базовый день - используем дату
      const dateKey = toLocalDateStr(selectedDayInfo.selectedDate);
      if (updateBasicProgress) {
        updateBasicProgress(dateKey, { [key]: newValue, date: toLocalDateStr(selectedDayInfo.selectedDate) });
      }
    }
  };

  const calculateProgress = () => {
    let keys: string[];
    if (selectedDayInfo.phase === 'ramadan') {
      keys = [...TRACKER_KEYS];
    } else {
      keys = [...PREPARATION_TRACKER_KEYS];
      const dayOfWeekStr = selectedDayInfo.selectedDate.toLocaleDateString('en-US', {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, weekday: 'short'
      });
      if (dayOfWeekStr === 'Mon' || dayOfWeekStr === 'Thu') keys.push('fasting');
      if (selectedDayInfo.phase === 'preparation' && 
          toLocalDateStr(selectedDayInfo.selectedDate) === FIRST_TARAWEEH_DATE) {
        keys.push('taraweeh');
      }
      if (toLocalDateStr(selectedDayInfo.selectedDate) === EID_AL_FITR_DATE) keys.push('eidPrayer');
    }
    if (!displayedData) return { completed: 0, total: 0, percentage: 0 };
    const completed = keys.filter(k => displayedData[k as keyof DayProgress]).length;
    return { completed, total: keys.length, percentage: Math.round((completed / keys.length) * 100) };
  };

  // ✅ Деструктуризация:
  const { completed: completedTasks, total: totalTasks, percentage: selectedDayProgress } = calculateProgress();

  const toggleMemorized = (id: number, e?: React.MouseEvent<HTMLElement>) => {
    console.log('🔍 Clicked on:', id);
    if (!userData || !setUserData) return;
    
    // Если все выучены - ничего не делаем (режим повторения)
    if (allNamesLearned) return;
    
    const current = userData.memorizedNames || [];
    const isMemorized = current.includes(id);
    
    // Только добавление (нельзя убрать выученное с главной страницы)
    if (isMemorized) return;
    
    haptics.success();
    
    // Добавляем в выученные
    const next = [...current, id];

    // ✅ НЕ начисляем XP локально - бэкенд сделает это при синхронизации
    setUserData({ 
      ...userData, 
      memorizedNames: next
      // xp НЕ трогаем! Бэкенд начислит при sync
    });
    
    // Анимация исчезновения
    setFadingOutId(id);
    console.log('🎬 Fading out:', id);
    
    // Через 1000мс заменяем имя на той же позиции
    setTimeout(() => {
      const memorized = next;
      const unlearned = NAMES_99.filter(name => !memorized.includes(name.id));
      
      setVisibleNames(prev => {
        console.log('🔄 Current visible:', prev.map(n => n.id));
        // Находим индекс кликнутого имени
        const clickedIndex = prev.findIndex(n => n.id === id);
        console.log('📍 Clicked index:', clickedIndex);
        
        if (unlearned.length === 0) {
          // Все выучены - режим повторения, не заменяем
          return prev;
        } else {
          // Берем новое невыученное (не из текущих видимых)
          const shuffled = shuffleArray(unlearned);
          const newName = shuffled.find(n => !prev.find(v => v.id === n.id)) || shuffled[0];
          console.log('✨ New name:', newName.id);
          
          // Заменяем имя на той же позиции
          const newVisible = [...prev];
          newVisible[clickedIndex] = newName;
          console.log('📋 New visible:', newVisible.map(n => n.id));
          return newVisible;
        }
      });
      
      setFadingOutId(null);
      console.log('✅ Fading complete');
    }, 1000);
  };

  // ✅ Инициализация имен - только один раз!
  useEffect(() => {
    if (!isInitialized) {
      const memorized = userData?.memorizedNames || [];
      const unlearned = NAMES_99.filter(name => !memorized.includes(name.id));
      
      if (unlearned.length === 0) {
        // Все выучены - показываем рандомные
        const shuffled = shuffleArray(NAMES_99);
        setVisibleNames(shuffled.slice(0, 3));
      } else {
        // Есть невыученные
        const shuffled = shuffleArray(unlearned);
        setVisibleNames(shuffled.slice(0, 3));
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);


  return (
    <div className="space-y-6 pb-4 relative">
      {/* ✅ Предупреждение о подписке */}
      {showSubscriptionWarning && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <span className="text-3xl animate-pulse">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-black text-red-900 mb-1">
                {userData.language === 'kk' 
                  ? 'Жазылым аяқталуда!' 
                  : 'Подписка истекает!'}
              </p>
              <p className="text-xs font-bold text-red-700">
                {userData.language === 'kk'
                  ? `Тек ${userData.daysLeft} күн қалды. Жаңартыңыз!`
                  : `Осталось ${userData.daysLeft} ${userData.daysLeft === 1 ? 'день' : 'дня'}. Продлите подписку!`}
              </p>
            </div>
            <button 
              onClick={() => {
                const tg = (window as any).Telegram?.WebApp;
                if (tg) tg.close();
              }}
              className="bg-red-600 text-white text-xs font-bold px-4 py-3.5 rounded-2xl active:scale-95 transition-transform"
            >
              {userData.language === 'kk' ? 'Жаңарту' : 'Продлить'}
            </button>
          </div>
        </div>
      )}

      {/* Real-time Countdown Card */}
      {!ramadanInfo.isStarted && isToday && (
        <section className="bg-header p-8 rounded-[3rem] shadow-2xl relative overflow-hidden text-center text-white border border-white/10">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <span className="text-8xl">🌙</span>
          </div>
          
          <div className="flex flex-col items-center justify-center relative z-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3 mb-4 border border-white/20">
              <p className="text-sm font-black" style={{ color: 'var(--bronze-hover)' }}>
                {(() => {
                  const [rY, rM, rD] = RAMADAN_START_DATE.split('-').map(Number);
                  const d = new Date(rY, rM - 1, rD);
                  const monthNames = language === 'kk'
                    ? ['қаңтар','ақпан','наурыз','сәуір','мамыр','маусым','шілде','тамыз','қыркүйек','қазан','қараша','желтоқсан']
                    : ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
                  return `${d.getDate()} ${monthNames[d.getMonth()]}`;
                })()}
              </p>
              <p className="text-[10px] font-bold text-white/80 mt-1">
                {language === 'kk' ? 'Рамазанның 1-ші күні' : '1-й день Рамадана'}
              </p>
            </div>
            
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2" style={{ color: 'var(--bronze-hover)' }}>
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


      {/* 🌙 Shawwal Banner */}
      {(isShawwalActive || (isShawwalDone && !shawwalDismissed)) && !isFutureDay && (() => {
        const selectedDateStr = toLocalDateStr(selectedDayInfo.selectedDate);
        const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: userTZ });
        return selectedDateStr >= '2026-03-21' && todayStr <= '2026-04-19';
      })() && (
        <div className={`p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden border-2 ${
          isShawwalDone
            ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-200'
            : 'bg-header border-white/10'
        } text-white`}>
          <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl">🌙</div>

          <div className="relative z-10">
            {isShawwalDone ? (
              <div className="text-center relative">
                <button
                  onClick={() => { setShawwalDismissed(true); localStorage.setItem('shawwal_done_dismissed', '1'); }}
                  className="absolute -top-1 right-0 w-7 h-7 rounded-full bg-black/20 flex items-center justify-center text-white/80 hover:bg-black/30 active:scale-90 transition-all text-sm font-black"
                >
                  ✕
                </button>
                <p className="text-3xl mb-2">🎉</p>
                <h3 className="text-lg font-black">
                  {language === 'kk' ? 'Шәууал оразасы аяқталды!' : 'Пост Шавваля завершён!'}
                </h3>
                <p className="text-sm font-bold opacity-80 mt-1">
                  {language === 'kk' ? 'МашаАллаһ! 6/6 ораза ұсталды 🤲' : 'МашаАллаh! 6/6 постов соблюдено 🤲'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">
                      {language === 'kk' ? 'Шәууал оразасы' : 'Пост Шавваля'}
                    </p>
                    <h3 className="text-xl font-black">
                      {shawwalCompleted} / 6 {language === 'kk' ? 'ораза' : 'постов'}
                    </h3>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/30">
                    <p className="text-xs font-black">{6 - shawwalCompleted} {language === 'kk' ? 'қалды' : 'осталось'}</p>
                  </div>
                </div>

                {/* Прогресс-бар */}
                <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-white transition-all duration-700 ease-out rounded-full"
                    style={{ width: `${(shawwalCompleted / 6) * 100}%` }}
                  />
                </div>

                {/* 6 кружков */}
                <div className="flex justify-between mb-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all ${
                      i < shawwalCompleted
                        ? 'bg-white text-brand border-white shadow-lg'
                        : 'bg-white/10 border-white/30 text-white/50'
                    }`}>
                      {i < shawwalCompleted ? '✓' : i + 1}
                    </div>
                  ))}
                </div>

                {/* Кнопка */}
                {!isFutureDay && (
                  <button
                    onClick={() => markShawwalFast(toLocalDateStr(selectedDayInfo.selectedDate))}
                    disabled={shawwalLoading || ((userData as any)?.shawwalDates || []).includes(toLocalDateStr(selectedDayInfo.selectedDate))}
                    className={`w-full font-black py-3 rounded-2xl transition-all shadow-lg text-sm ${
                      ((userData as any)?.shawwalDates || []).includes(toLocalDateStr(selectedDayInfo.selectedDate))
                        ? 'bg-white/30 text-white/60 cursor-not-allowed'
                        : 'bg-white text-brand active:scale-95'
                    }`}
                  >
                    {shawwalLoading
                      ? '⏳ ...'
                      : ((userData as any)?.shawwalDates || []).includes(toLocalDateStr(selectedDayInfo.selectedDate))
                      ? (language === 'kk' ? '✅ Белгіленді' : '✅ Отмечено')
                      : `🌙 ${language === 'kk' ? 'Ораза ұстадым' : 'Я держал пост'}`
                    }
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ✅ СЧЁТЧИК STREAK с множителем - для текущего дня */}
      {isToday && userData?.currentStreak && userData.currentStreak > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-[2.5rem] shadow-xl text-white flex items-center justify-between relative overflow-hidden border border-orange-300">
          <div className="absolute top-0 right-0 p-8 opacity-10 text-7xl">🔥</div>
          
          <div className="relative z-10 flex items-center space-x-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-[2rem] flex items-center justify-center border border-white/30">
              <span className="text-3xl">🔥</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider opacity-90">
                {language === 'kk' ? 'Белсенділік серияңыз' : 'Серия активности'}
              </p>
              <p className="text-2xl font-black leading-none mt-1">
                {userData.currentStreak} {language === 'kk' ? 'күн' : 'дней'}
              </p>
            </div>
          </div>
          
          <div className="relative z-10 text-right bg-white/20 backdrop-blur-sm rounded-[1.5rem] px-4 py-2.5 border border-white/30">
            <p className="text-[9px] font-black uppercase opacity-80 leading-tight">
              {language === 'kk' ? 'XP бонусы' : 'Бонус XP'}
            </p>
            <p className="text-xl font-black leading-none mt-1">
              x{Math.min(1 + (userData.currentStreak * 0.1), 3.0).toFixed(1)}
            </p>
          </div>
        </div>
      )}

      {/* Ораза */}
      {(() => {
        let showFasting = false;
        let fastingType = '';
        
        if (selectedDayInfo.phase === 'ramadan') {
          showFasting = true;
          fastingType = language === 'kk' ? 'Міндетті ораза' : 'Обязательная ораза';
        } else if (selectedDayInfo.phase === 'preparation') {
          const dayOfWeekStr = selectedDayInfo.selectedDate.toLocaleDateString('en-US', {
            timeZone: 'Asia/Almaty', weekday: 'short'
          });
          const isMondayOrThursday = dayOfWeekStr === 'Mon' || dayOfWeekStr === 'Thu';
          showFasting = isMondayOrThursday;
          fastingType = language === 'kk' ? 'Сүннет ораза' : 'Сунна ораза';
        } else if (selectedDayInfo.phase === 'basic') {
          const dayOfWeekStr = selectedDayInfo.selectedDate.toLocaleDateString('en-US', {
            timeZone: 'Asia/Almaty', weekday: 'short'
          });
          const isMondayOrThursday = dayOfWeekStr === 'Mon' || dayOfWeekStr === 'Thu';
          showFasting = isMondayOrThursday;
          fastingType = language === 'kk' ? 'Сүннет ораза (Дүйсенбі/Бейсенбі)' : 'Сунна ораза (пн/чт)';
        }
        
        if (!showFasting) return null;
        
        return (
          <div className="bg-card p-6 rounded-[2.5rem] shadow-sm border border-default">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-brand-tint rounded-[2rem] flex items-center justify-center text-2xl">
                  🌙
                </div>
                <div>
                  <h3 className="font-black text-primary">
                    {language === 'kk' ? 'Ораза' : 'Ораза'}
                  </h3>
                  <p className="text-xs text-secondary">
                    {fastingType}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isFutureDay && toggleItem('fasting')}
                disabled={isFutureDay}
                className={`w-12 h-12 rounded-2xl transition-all ${
                  isFutureDay
                    ? 'cursor-not-allowed opacity-40 bg-surface text-secondary'
                    : displayedData.fasting
                    ? 'bg-brand text-white shadow-lg active:scale-95'
                    : 'bg-surface text-secondary active:scale-95'
                }`}
              >
                {isFutureDay ? '🔒' : displayedData.fasting ? '✓' : ''}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Айт намазы - 20 марта */}
      {(() => {
        const isEidDay = toLocalDateStr(selectedDayInfo.selectedDate) === EID_AL_FITR_DATE;
        
        if (!isEidDay) return null;
        
        return (
          <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 p-6 rounded-[2.5rem] shadow-xl border-2 border-amber-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-20 text-9xl">🎉</div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-[2rem] flex items-center justify-center text-3xl border-2 border-white/40">
                    🕌
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-black text-white text-lg">
                        {language === 'kk' ? 'Айт намазы' : 'Айт намаз'}
                      </h3>
                      <span className="text-2xl">🎉</span>
                    </div>
                    <p className="text-sm font-bold text-white/90">
                      {language === 'kk' ? 'Ораза айт мерекесі құтты болсын' : 'С праздником Ораза айт'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !isFutureDay && toggleItem('eidPrayer')}
                  disabled={isFutureDay}
                  className={`w-14 h-14 rounded-2xl transition-all shadow-lg flex items-center justify-center ${
                    isFutureDay
                      ? 'cursor-not-allowed opacity-40 bg-white/20 text-white/50'
                      : displayedData.eidPrayer
                      ? 'bg-white text-amber-600 scale-110 active:scale-105'
                      : 'bg-white/30 text-white backdrop-blur-sm active:scale-95'
                  }`}
                >
                  {isFutureDay ? (
                    <span className="text-xl">🔒</span>
                  ) : displayedData.eidPrayer ? (
                    <span className="text-2xl font-black">✓</span>
                  ) : (
                    <span className="text-xl">🕌</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Намазы */}
      {(() => {
        const pt = (userData as any)?.prayerTimes;
        return (
          <div className="bg-card p-6 rounded-[2.5rem] shadow-sm border border-default">
            <h4 className="text-[10px] font-black text-secondary mb-5 tracking-widest uppercase px-1">
              {language === 'kk' ? 'Намаздар' : 'Намазы'}
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <ItemButton id="fajr"    icon={<span className="text-2xl">{PRAYER_ICONS.fajr}</span>}    small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} prayerTime={pt?.fajr} />
              <ItemButton id="duha"    icon={<span className="text-2xl">{PRAYER_ICONS.duha}</span>}    small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
              <ItemButton id="dhuhr"   icon={<span className="text-2xl">{PRAYER_ICONS.dhuhr}</span>}   small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} prayerTime={pt?.dhuhr} />
              <ItemButton id="asr"     icon={<span className="text-2xl">{PRAYER_ICONS.asr}</span>}     small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} prayerTime={pt?.asr} />
              <ItemButton id="maghrib" icon={<span className="text-2xl">{PRAYER_ICONS.maghrib}</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} prayerTime={pt?.maghrib} />
              <ItemButton id="isha"    icon={<span className="text-2xl">{PRAYER_ICONS.isha}</span>}    small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} prayerTime={pt?.isha} />
              {selectedDayInfo.phase === 'ramadan' && (
                <>
                  <ItemButton id="taraweeh" icon={<span className="text-2xl">⭐</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
                  <ItemButton id="tahajjud" icon={<span className="text-2xl">🌌</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
                  <ItemButton id="witr"     icon={<span className="text-2xl">✨</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
                </>
              )}
              {(selectedDayInfo.phase === 'preparation' || selectedDayInfo.phase === 'basic') && (() => {
                const isFirstTaraweehDay = toLocalDateStr(selectedDayInfo.selectedDate) === FIRST_TARAWEEH_DATE;
                return isFirstTaraweehDay ? (
                  <ItemButton id="taraweeh" icon={<span className="text-2xl">⭐</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
                ) : null;
              })()}
            </div>
          </div>
        );
      })()}

      {/* Духовные практики */}
      <div className="bg-card p-6 rounded-[2.5rem] shadow-sm border border-default">
        <h4 className="text-[10px] font-black text-secondary mb-5 tracking-widest uppercase px-1">
          {language === 'kk' ? 'Рухани амалдар' : 'Духовные практики'}
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <ItemButton id="quranRead" icon={<span className="text-2xl">📖</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
          <ItemButton id="morningDhikr" icon={<span className="text-2xl">🤲</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
          <ItemButton id="eveningDhikr" icon={<span className="text-2xl">🌙</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
          <ItemButton id="salawat" icon={<span className="text-2xl">☪️</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
          {selectedDayInfo.phase === 'ramadan' && (
            <ItemButton id="hadith" icon={<span className="text-2xl">📜</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
          )}
          <ItemButton id="charity" icon={<span className="text-2xl">💝</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
          {selectedDayInfo.phase === 'ramadan' && (
            <ItemButton id="names99" icon={<span className="text-2xl">📿</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
          )}
          {selectedDayInfo.phase === 'ramadan' && (
            <ItemButton id="lessons" icon={<span className="text-2xl">🎓</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
          )}
          <ItemButton id="book" icon={<span className="text-2xl">📚</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
        </div>
      </div>

      {/* ✅ 99 ИМЕН АЛЛАХА - только для текущего дня */}
      {isToday && (
        <div className="bg-header p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 text-9xl font-serif pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            الله
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-[10px] font-black text-brand tracking-[0.3em] uppercase flex items-center">
                <span className="w-2 h-2 bg-brand rounded-full mr-2 animate-pulse"></span>
                {language === 'kk' ? 'Алланың 99 есімі' : '99 имен Аллаха'}
              </h4>
              <button 
                onClick={() => {
                  haptics.selection();
                  setView('names-99');
                }}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase transition-colors backdrop-blur-sm shadow-lg border border-white/20"
              >
                {language === 'kk' ? 'Барлығы →' : 'Все →'}
              </button>
            </div>
            
            {allNamesLearned && (
              <p className="text-xs mb-4 font-medium" style={{ color: 'var(--bronze-disabled)' }}>
                ✅ {language === 'kk' 
                  ? 'Барлық есімдер жаттадыңыз! МашаАллаһ!' 
                  : 'Все имена выучены! МашаАллаһ!'}
              </p>
            )}
            
            <div className="grid grid-cols-1 gap-3">
              {visibleNames.map((name, index) => {
                const isLearned = userData?.memorizedNames?.includes(name.id);
                const isFading = fadingOutId === name.id;
                
                return (
                  <div 
                    key={`${name.id}-${index}`}
                    onClick={(e) => !allNamesLearned && toggleMemorized(name.id, e)} 
                    className={`flex items-center justify-between p-4 rounded-[1.8rem] border transition-all duration-500 ease-out ${
                      isFading ? 'opacity-0 scale-95 translate-x-4' : 'opacity-100 scale-100 translate-x-0'
                    } ${
                      allNamesLearned
                        ? 'bg-white/10 border-white/20 text-white cursor-default'
                        : isLearned
                        ? 'bg-white/20 border-white/30 text-white shadow-lg cursor-pointer active:scale-[0.98]'
                        : 'bg-black/10 border-white/10 text-white hover:bg-black/20 cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex items-center space-x-4 overflow-hidden">
                      <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-[10px] font-black transition-all ${
                        isLearned 
                          ? 'bg-brand text-white shadow-md'
                          : 'bg-white/10'
                      }`}>
                        {name.id}
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-xl font-serif block leading-none mb-1 truncate">{name.arabic}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest truncate" style={{ color: 'var(--bronze-disabled)' }}>{name.translit}</span>
                      </div>
                    </div>
                    {!allNamesLearned && (
                      <div className={`w-8 h-8 rounded-xl border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        isLearned 
                          ? 'bg-white border-white text-brand'
                          : 'border-white/20 bg-transparent'
                      }`}>
                        {isLearned && <span className="text-sm font-black">✓</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Прогресс заучивания */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60 font-bold">
                  {language === 'kk' ? 'Жаттадым' : 'Выучено'}
                </span>
                <span className="text-brand font-black">
                  {userData?.memorizedNames?.length || 0} / 99
                </span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mt-2">
                <div 
                  className="h-full progress-bar transition-all duration-500"
                  style={{ width: `${Math.round(((userData?.memorizedNames?.length || 0) / 99) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ КАЛЕНДАРЬ */}
      <RealCalendar 
        language={language}
        ramadanStartDate={RAMADAN_START_DATE}
        preparationStartDate={PREPARATION_START_DATE}
        firstTaraweehDate={FIRST_TARAWEEH_DATE}
        eidAlFitrDate={EID_AL_FITR_DATE}
        allProgress={allProgress}
        preparationProgress={userData?.preparationProgress || {}}
        selectedDay={selectedDay}
        realTodayDay={realTodayDay}
        onDaySelect={onDaySelect}
        onPreparationDaySelect={onPreparationDaySelect}
        onBasicDateSelect={onBasicDateSelect}
        trackerKeys={[...TRACKER_KEYS]}
        preparationTrackerKeys={PREPARATION_TRACKER_KEYS}
      />

      {/* ✅ ПРОГРЕСС БАР */}
      <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl">✅</div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-brand">
              {isToday 
                ? (language === 'kk' ? 'Бүгінгі прогресс' : 'Сегодняшний прогресс')
                : (language === 'kk' ? 'Прогресс' : 'Прогресс')}
            </h4>
            <span className="text-xs font-bold text-white/60">
              {(() => {
                const date = selectedDayInfo.selectedDate;
                const day = date.getDate();
                const monthNames = language === 'kk' 
                  ? ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан']
                  : ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
                return `${day} ${monthNames[date.getMonth()]}`;
              })()}
            </span>
          </div>
          
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-5xl font-black leading-none">
                {completedTasks}
              </p>
              <p className="text-sm font-bold text-white/60 mt-1">
                / {totalTasks} {language === 'kk' ? 'тапсырма' : 'задач'}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-3xl font-black">
                {selectedDayProgress}%
              </p>
              <p className="text-[10px] font-black text-white/60 uppercase">
                {language === 'kk' ? 'орындалды' : 'выполнено'}
              </p>
            </div>
          </div>
          
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full progress-bar transition-all duration-1000 ease-out"
              style={{ width: `${selectedDayProgress}%` }}
            ></div>
          </div>
          
          {/* Мотивационные сообщения */}
          {selectedDayProgress === 100 && (
            <p className="text-xs font-black text-brand mt-3 text-center">
              🎉 {language === 'kk' ? 'Жарайсыз! Барлық амалдар орындалды!' : 'Отлично! Все задачи выполнены!'}
            </p>
          )}
          
          {selectedDayProgress >= 50 && selectedDayProgress < 100 && (
            <p className="text-xs font-bold text-white/80 mt-3 text-center">
              💪 {language === 'kk' ? 'Жақсы нәтиже! Тоқтамаңыз!' : 'Хороший результат! Не останавливайтесь!'}
            </p>
          )}
          
          {selectedDayProgress < 50 && selectedDayProgress > 0 && (
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