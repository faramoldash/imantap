import React, { useState, useEffect, useMemo } from 'react';
import { DayProgress, Language, UserData, ViewType } from '../src/types/types';
import { TRANSLATIONS, TRACKER_KEYS, PREPARATION_TRACKER_KEYS, TOTAL_DAYS, PREPARATION_DAYS, NAMES_99, XP_VALUES, RAMADAN_START_DATE, PREPARATION_START_DATE, FIRST_TARAWEEH_DATE, EID_AL_FITR_DATE } from '../constants';
import { haptics } from '../src/utils/haptics';
import RealCalendar from './RealCalendar';
import SubscriptionStatus from '../components/SubscriptionStatus';

// ✅ Хелпер: дата по Алматы времени (UTC+5)
function toAlmatyDateStr(date: Date): string {
  const almatyMs = date.getTime() + 5 * 60 * 60 * 1000;
  return new Date(almatyMs).toISOString().split('T')[0];
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

  const t = TRANSLATIONS[language];

  // ✅ ОПРЕДЕЛЯЕМ ТЕКУЩИЙ ДЕНЬ С УЧЕТОМ ФАЗЫ
  const currentDay = useMemo(() => {
    const almatyOffset = 5 * 60;
    const now = new Date();
    const almatyTime = new Date(now.getTime() + (almatyOffset + now.getTimezoneOffset()) * 60000);
    const prepStart = new Date(PREPARATION_START_DATE + 'T00:00:00+05:00');
    const daysSincePrep = Math.floor((almatyTime.getTime() - prepStart.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, daysSincePrep + 1); // сегодня = 11
  }, []);

  // ✅ ОПРЕДЕЛЯЕМ ФАЗУ И ДАТУ ВЫБРАННОГО ДНЯ
  const selectedDayInfo = useMemo(() => {
    const prepStartMs = new Date(PREPARATION_START_DATE + 'T00:00:00+05:00').getTime();
    const ramadanStartMs = new Date(RAMADAN_START_DATE + 'T00:00:00+05:00').getTime();

    const selectedDateMs = prepStartMs + (selectedDay - 1) * 86400000;

    let phase: 'basic' | 'preparation' | 'ramadan';
    let dayInPhase: number;

    if (selectedDateMs < ramadanStartMs) {
      phase = 'preparation';
      dayInPhase = selectedDay; // 1–10
    } else {
      phase = 'ramadan';
      dayInPhase = Math.floor((selectedDateMs - ramadanStartMs) / 86400000) + 1; // 1–29
    }

    // +18000000 = +5ч чтобы toISOString() давал дату Алматы
    const selectedDate = new Date(selectedDateMs);

    console.log('📅 SELECTED DAY INFO:', { selectedDay, phase, dayInPhase, date: toAlmatyDateStr(selectedDate) });
    return { phase, dayInPhase, selectedDate };
  }, [selectedDay]);

  console.log('📅 SELECTED DAY INFO:', {
    selectedDay,
    phase: selectedDayInfo.phase,
    dayInPhase: selectedDayInfo.dayInPhase,
    date: toAlmatyDateStr(selectedDayInfo.selectedDate)
  });

  // ✅ ДАННЫЕ ОТОБРАЖАЕМОГО ДНЯ
  const displayedData = useMemo(() => {
    let data;
    if (selectedDayInfo.phase === 'ramadan') {
      data = allProgress[selectedDayInfo.dayInPhase];
    } else if (selectedDayInfo.phase === 'preparation') {
      data = userData?.preparationProgress?.[selectedDayInfo.dayInPhase];
    } else {
      const dateKey = toAlmatyDateStr(selectedDayInfo.selectedDate);
      data = userData?.basicProgress?.[dateKey];
    }
    // ✅ Если день ещё пустой — возвращаем пустой объект, а не undefined
    return data || {};
  }, [selectedDay, selectedDayInfo, allProgress, userData]);

  const isToday = selectedDay === currentDay;
  const isFutureDay = selectedDay > currentDay;

  // ✅ НАВИГАЦИЯ
  const canGoPrev = selectedDay > 1;
  const canGoNext = selectedDay < (PREPARATION_DAYS + TOTAL_DAYS); // 10 + 29 = 39

  const goToPrevDay = () => {
    if (canGoPrev) {
      hasNavigated.current = true; // ✅ Устанавливаем флаг
      haptics.selection();
      onDaySelect(selectedDay - 1);
    }
  };

  const goToNextDay = () => {
    if (canGoNext) {
      hasNavigated.current = true; // ✅ Устанавливаем флаг
      haptics.selection();
      onDaySelect(selectedDay + 1);
    }
  };

  const goToToday = () => {
    hasNavigated.current = true;
    haptics.medium();
    onDaySelect(currentDay);
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
      updateProgress(selectedDayInfo.dayInPhase, { [key]: newValue });
    } else if (selectedDayInfo.phase === 'preparation') {
      updatePreparationProgress(selectedDayInfo.dayInPhase, { [key]: newValue });
    } else {
      // Базовый день - используем дату
      const dateKey = toAlmatyDateStr(selectedDayInfo.selectedDate);
      if (updateBasicProgress) {
        updateBasicProgress(dateKey, { [key]: newValue });
      }
    }
  };

  const calculateProgress = () => {
    let keys: string[];
    
    if (selectedDayInfo.phase === 'ramadan') {
      keys = [...TRACKER_KEYS];
    } else {
      // Подготовка и базовые дни - базовый набор задач
      keys = [...PREPARATION_TRACKER_KEYS];
      
      // Добавляем дополнительные задачи в зависимости от дня
      const dayOfWeek = selectedDayInfo.selectedDate.getDay();
      const isMondayOrThursday = dayOfWeek === 1 || dayOfWeek === 4;
      
      const firstTaraweehDate = new Date(FIRST_TARAWEEH_DATE + 'T00:00:00+05:00');
      const isFirstTaraweehDay = toAlmatyDateStr(selectedDayInfo.selectedDate) === FIRST_TARAWEEH_DATE;
      
      const eidDate = new Date(EID_AL_FITR_DATE + 'T00:00:00+05:00');
      const isEidDay = toAlmatyDateStr(selectedDayInfo.selectedDate) === EID_AL_FITR_DATE;
      
      // Добавляем оразу в пн/чт
      if (isMondayOrThursday) {
        keys.push('fasting');
      }
      
      // Добавляем таравих 18 февраля
      if (isFirstTaraweehDay) {
        keys.push('taraweeh');
      }
      
      // Добавляем Айт намаз 20 марта
      if (isEidDay) {
        keys.push('eidPrayer');
      }
    }
    
    if (!displayedData) return 0;
    const completed = keys.filter(key => displayedData[key as keyof DayProgress]).length;
    return Math.round((completed / keys.length) * 100);
  };

  const selectedDayProgress = calculateProgress();

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
          const shuffled = [...unlearned].sort(() => Math.random() - 0.5);
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

  // ✅ Состояние для управления видимыми именами
  const [visibleNames, setVisibleNames] = useState<typeof NAMES_99>([]);
  const [fadingOutId, setFadingOutId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ Состояние для анимации XP
  const [xpNotifications, setXpNotifications] = useState<Array<{
    id: string, 
    amount: number, 
    multiplier?: number,
    timestamp: number
  }>>([]);

  // ✅ Регистрируем глобальный колбэк для показа XP с бэкенда
  useEffect(() => {
    (window as any).showXPNotification = (xpAmount: number, multiplier: number) => {
      const notificationId = `${Date.now()}-${Math.random()}`;
      
      setXpNotifications(prev => [...prev, {
        id: notificationId,
        amount: xpAmount,
        multiplier: multiplier,
        timestamp: Date.now()
      }]);
      
      // Убираем уведомление через 2 секунды
      setTimeout(() => {
        setXpNotifications(prev => prev.filter(n => n.id !== notificationId));
      }, 2000);
    };
    
    return () => {
      delete (window as any).showXPNotification;
    };
  }, []);

  // ✅ Инициализация имен - только один раз!
  useEffect(() => {
    if (!isInitialized) {
      const memorized = userData?.memorizedNames || [];
      const unlearned = NAMES_99.filter(name => !memorized.includes(name.id));
      
      if (unlearned.length === 0) {
        // Все выучены - показываем рандомные
        const shuffled = [...NAMES_99].sort(() => Math.random() - 0.5);
        setVisibleNames(shuffled.slice(0, 3));
      } else {
        // Есть невыученные
        const shuffled = [...unlearned].sort(() => Math.random() - 0.5);
        setVisibleNames(shuffled.slice(0, 3));
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Проверяем все ли имена выучены
  const allNamesLearned = (userData?.memorizedNames?.length || 0) === 99;

  // ✅ REF для шапки трекера
  const headerRef = React.useRef<HTMLDivElement>(null);

  // ✅ Флаг для отслеживания навигации (не скроллим при первом рендере)
  const hasNavigated = React.useRef(false);

  // ✅ Скроллим к шапке только после навигации
  useEffect(() => {
    if (hasNavigated.current && headerRef.current) {
      headerRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [selectedDay]);

  const ItemButton = React.memo(({ id, icon, small, displayedData, toggleItem, t, disabled }: any) => (
    <button 
      onClick={(e) => !disabled && toggleItem(id, e)} 
      disabled={disabled}
      className={`p-2 rounded-[1.25rem] border transition-all flex flex-col items-center justify-center space-y-1 relative ${
        disabled 
          ? 'cursor-not-allowed opacity-40' 
          : 'active:scale-95 cursor-pointer'
      } ${small ? 'h-20' : 'h-24'} ${
        displayedData[id] 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-inner' 
          : 'bg-white border-slate-100 text-slate-600 shadow-sm'
      }`}
    >
      {icon}
      <span className="text-[11px] font-bold text-center leading-tight">{t.items[id]}</span>
      {displayedData[id] && <span className="absolute top-1 right-1 text-xs">✓</span>}
      {disabled && <span className="absolute top-1 right-1 text-xs">🔒</span>}
    </button>
  ));

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
              className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-transform"
            >
              {userData.language === 'kk' ? 'Жаңарту' : 'Продлить'}
            </button>
          </div>
        </div>
      )}

      {/* Real-time Countdown Card */}
      {!ramadanInfo.isStarted && isToday && (
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

      {/* ✅ ТРЕКЕР ВЫБРАННОГО ДНЯ - ШАПКА С НАВИГАЦИЕЙ */}
      <section 
        ref={headerRef}
        style={{ scrollMarginTop: '24px' }}
        className={`p-6 rounded-[3rem] shadow-xl text-white relative overflow-hidden ${
        selectedDayInfo.phase === 'ramadan'
          ? 'bg-gradient-to-br from-emerald-900 to-emerald-700'
          : selectedDayInfo.phase === 'preparation'
          ? 'bg-gradient-to-br from-orange-600 to-orange-400'
          : 'bg-gradient-to-br from-blue-900 to-blue-600'
      }`}>
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <span className="text-9xl">🌙</span>
        </div>
        
        <div className="relative z-10">
          {/* Навигация */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPrevDay}
              disabled={!canGoPrev}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all font-bold text-lg ${
                canGoPrev 
                  ? 'bg-white/20 hover:bg-white/30 active:scale-95 text-white' 
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              }`}
            >
              ←
            </button>
            
            {/* Центральная кнопка */}
            {isToday ? (
              <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-2xl text-xs font-black uppercase border border-white/30">
                {language === 'kk' ? 'Бүгін' : 'Сегодня'}
              </div>
            ) : (
              <button
                onClick={goToToday}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-2xl text-xs font-black uppercase transition-all active:scale-95 border border-white/30"
              >
                {language === 'kk' ? 'Бүгінге өту' : 'К сегодня'}
              </button>
            )}
            
            <button
              onClick={goToNextDay}
              disabled={!canGoNext}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all font-bold text-lg ${
                canGoNext 
                  ? 'bg-white/20 hover:bg-white/30 active:scale-95 text-white' 
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              }`}
            >
              →
            </button>
          </div>
          
          <div className="text-center">
            {/* Название фазы - НЕ показываем для базовых дней */}
            {selectedDayInfo.phase !== 'basic' && (
              <p className="text-[10px] font-black uppercase tracking-widest opacity-90 mb-2">
                {selectedDayInfo.phase === 'ramadan'
                  ? (language === 'kk' ? 'Рамазан' : 'Рамадан')
                  : (language === 'kk' ? 'Рамазанға дайындық' : 'Подготовка к Рамадану')}
              </p>
            )}
            
            {/* Заголовок "День X" - только для Рамадана */}
            {selectedDayInfo.phase === 'ramadan' && (
              <h1 className="text-2xl font-black mb-2">
                {language === 'kk' ? 'Күн' : 'День'} {selectedDayInfo.dayInPhase}
              </h1>
            )}
            
            {/* Дата */}
            <p className={`text-sm font-bold opacity-90 ${selectedDayInfo.phase === 'ramadan' ? '' : 'mb-2'}`}>
              {(() => {
                const currentDayDate = selectedDayInfo.selectedDate;
                
                const monthNames = language === 'kk' 
                  ? ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан']
                  : ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
                const weekDays = language === 'kk'
                  ? ['Жексенбі', 'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі']
                  : ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
                
                return `${weekDays[currentDayDate.getDay()]}, ${currentDayDate.getDate()} ${monthNames[currentDayDate.getMonth()]}`;
              })()}
            </p>
            
            {/* Бейджи - для подготовки и базовых дней */}
            {(selectedDayInfo.phase === 'preparation' || selectedDayInfo.phase === 'basic') && (() => {
              const dayOfWeek = selectedDayInfo.selectedDate.getDay();
              const isMondayOrThursday = dayOfWeek === 1 || dayOfWeek === 4;
              const firstTaraweehDate = new Date(FIRST_TARAWEEH_DATE + 'T00:00:00+05:00');
              const isFirstTaraweehDay = toAlmatyDateStr(selectedDayInfo.selectedDate) === FIRST_TARAWEEH_DATE;
              const eidDate = new Date(EID_AL_FITR_DATE + 'T00:00:00+05:00');
              const isEidDay = toAlmatyDateStr(selectedDayInfo.selectedDate) === EID_AL_FITR_DATE;
              
              if (!isMondayOrThursday && !isFirstTaraweehDay && !isEidDay) return null;
              
              return (
                <div className="flex justify-center gap-2 flex-wrap mt-3">
                  {isMondayOrThursday && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                      <p className="text-xs font-bold">🌙 {language === 'kk' ? 'Дүйсенбі/Бейсенбі оразасы' : 'Ораза в пн/чт'}</p>
                    </div>
                  )}
                  {isFirstTaraweehDay && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/30">
                      <p className="text-xs font-bold">⭐ {language === 'kk' ? 'Бірінші тарауық!' : 'Первый таравих!'}</p>
                    </div>
                  )}
                  {isEidDay && (
                    <div className="bg-gradient-to-r from-amber-400 to-orange-400 backdrop-blur-sm rounded-full px-4 py-2 border-2 border-amber-200 shadow-lg">
                      <p className="text-sm font-black text-white">🎉 {language === 'kk' ? 'ОРАЗА АЙТ!' : 'ОРАЗА АЙТ!'}</p>
                    </div>
                  )}
                </div>
              );
            })()}
            {/* ⚠️ Предупреждение для прошлых дней подготовки/Рамадана */}
            {!isToday && !isFutureDay && (selectedDayInfo.phase === 'preparation' || selectedDayInfo.phase === 'ramadan') && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <p className="text-[10px] font-bold text-white/80 text-center flex items-center justify-center space-x-1.5">
                  <span>⚠️</span>
                  <span>
                    {language === 'kk' 
                      ? 'XP тек бүгінгі күн үшін есептеледі' 
                      : 'XP начисляется только за сегодняшний день'}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

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
          const dayOfWeek = selectedDayInfo.selectedDate.getDay();
          showFasting = dayOfWeek === 1 || dayOfWeek === 4;
          fastingType = language === 'kk' ? 'Сүннет ораза' : 'Сунна ораза';
        } else if (selectedDayInfo.phase === 'basic') {
          const dayOfWeek = selectedDayInfo.selectedDate.getDay();
          showFasting = dayOfWeek === 1 || dayOfWeek === 4;
          fastingType = language === 'kk' ? 'Сүннет ораза (Дүйсенбі/Бейсенбі)' : 'Сунна ораза (пн/чт)';
        }
        
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
                    {fastingType}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isFutureDay && toggleItem('fasting')}
                disabled={isFutureDay}
                className={`w-12 h-12 rounded-2xl transition-all ${
                  isFutureDay
                    ? 'cursor-not-allowed opacity-40 bg-slate-100 text-slate-300'
                    : displayedData.fasting
                    ? 'bg-sky-600 text-white shadow-lg active:scale-95'
                    : 'bg-slate-100 text-slate-400 active:scale-95'
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
        const eidDate = new Date(EID_AL_FITR_DATE + 'T00:00:00+05:00');
        const isEidDay = toAlmatyDateStr(selectedDayInfo.selectedDate) === EID_AL_FITR_DATE;
        
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
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-sky-100">
        <h4 className="text-[10px] font-black text-slate-400 mb-5 tracking-widest uppercase px-1">
          {language === 'kk' ? 'Намаздар' : 'Намазы'}
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <ItemButton id="fajr" icon={<span className="text-2xl">🌅</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
          <ItemButton id="duha" icon={<span className="text-2xl">☀️</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
          <ItemButton id="dhuhr" icon={<span className="text-2xl">🌞</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
          <ItemButton id="asr" icon={<span className="text-2xl">🌤️</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
          <ItemButton id="maghrib" icon={<span className="text-2xl">🌆</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
          <ItemButton id="isha" icon={<span className="text-2xl">🌙</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
          {selectedDayInfo.phase === 'ramadan' && (
            <>
              <ItemButton id="taraweeh" icon={<span className="text-2xl">⭐</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
              <ItemButton id="tahajjud" icon={<span className="text-2xl">🌌</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
              <ItemButton id="witr" icon={<span className="text-2xl">✨</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
            </>
          )}
          {(selectedDayInfo.phase === 'preparation' || selectedDayInfo.phase === 'basic') && (() => {
            const firstTaraweehDate = new Date(FIRST_TARAWEEH_DATE + 'T00:00:00+05:00');
            const isFirstTaraweehDay = toAlmatyDateStr(selectedDayInfo.selectedDate) === FIRST_TARAWEEH_DATE;
            
            return isFirstTaraweehDay ? (
              <ItemButton id="taraweeh" icon={<span className="text-2xl">⭐</span>} small displayedData={displayedData} toggleItem={toggleItem} t={t} disabled={isFutureDay} />
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
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 text-9xl font-serif pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            الله
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-[10px] font-black text-emerald-400 tracking-[0.3em] uppercase flex items-center">
                <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
                {language === 'kk' ? 'Алланың 99 есімі' : '99 имен Аллаха'}
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
            
            {allNamesLearned && (
              <p className="text-xs text-emerald-200 mb-4 font-medium">
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
                        : 'bg-black/10 border-white/10 text-emerald-50 hover:bg-black/20 cursor-pointer active:scale-[0.98]'
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
                    {!allNamesLearned && (
                      <div className={`w-8 h-8 rounded-xl border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        isLearned 
                          ? 'bg-white border-white text-emerald-700' 
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
        onDaySelect={(day) => {
          hasNavigated.current = true;
          onDaySelect(day);
        }}
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
                {(() => {
                  // Используем ту же логику что и в calculateProgress
                  let keys: string[];
                  
                  if (selectedDayInfo.phase === 'ramadan') {
                    keys = [...TRACKER_KEYS];
                  } else {
                    keys = [...PREPARATION_TRACKER_KEYS];
                    
                    const dayOfWeek = selectedDayInfo.selectedDate.getDay();
                    const isMondayOrThursday = dayOfWeek === 1 || dayOfWeek === 4;
                    
                    const firstTaraweehDate = new Date(FIRST_TARAWEEH_DATE + 'T00:00:00+05:00');
                    const isFirstTaraweehDay = toAlmatyDateStr(selectedDayInfo.selectedDate) === FIRST_TARAWEEH_DATE;
                    
                    const eidDate = new Date(EID_AL_FITR_DATE + 'T00:00:00+05:00');
                    const isEidDay = toAlmatyDateStr(selectedDayInfo.selectedDate) === EID_AL_FITR_DATE;
                    
                    if (isMondayOrThursday) keys.push('fasting');
                    if (isFirstTaraweehDay) keys.push('taraweeh');
                    if (isEidDay) keys.push('eidPrayer');
                  }
                  
                  return keys.filter(k => displayedData[k as keyof DayProgress]).length;
                })()}
              </p>
              <p className="text-sm font-bold text-white/60 mt-1">
                / {(() => {
                  // Считаем общее количество задач
                  let keys: string[];
                  
                  if (selectedDayInfo.phase === 'ramadan') {
                    keys = [...TRACKER_KEYS];
                  } else {
                    keys = [...PREPARATION_TRACKER_KEYS];
                    
                    const dayOfWeek = selectedDayInfo.selectedDate.getDay();
                    const isMondayOrThursday = dayOfWeek === 1 || dayOfWeek === 4;
                    
                    const firstTaraweehDate = new Date(FIRST_TARAWEEH_DATE + 'T00:00:00+05:00');
                    const isFirstTaraweehDay = toAlmatyDateStr(selectedDayInfo.selectedDate) === FIRST_TARAWEEH_DATE;
                    
                    const eidDate = new Date(EID_AL_FITR_DATE + 'T00:00:00+05:00');
                    const isEidDay = toAlmatyDateStr(selectedDayInfo.selectedDate) === EID_AL_FITR_DATE;
                    
                    if (isMondayOrThursday) keys.push('fasting');
                    if (isFirstTaraweehDay) keys.push('taraweeh');
                    if (isEidDay) keys.push('eidPrayer');
                  }
                  
                  return keys.length;
                })()} {language === 'kk' ? 'тапсырма' : 'задач'}
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
              className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 transition-all duration-1000 ease-out"
              style={{ width: `${selectedDayProgress}%` }}
            ></div>
          </div>
          
          {/* Мотивационные сообщения */}
          {selectedDayProgress === 100 && (
            <p className="text-xs font-black text-emerald-400 mt-3 text-center">
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

      {/* ✅ XP NOTIFICATIONS - Анимация начисления XP */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center space-y-2">
        {xpNotifications.map((notification) => (
          <div
            key={notification.id}
            className="animate-xp-float text-white px-5 py-2.5 rounded-2xl shadow-lg font-black text-sm border border-white/20"
            style={{
              animation: 'xpFloat 2s ease-out forwards',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.85))',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
            }}
          >
            +{notification.amount} XP ✨
            {notification.multiplier && notification.multiplier > 1.0 && (
              <span className="text-xs opacity-90 ml-1">
                (x{notification.multiplier.toFixed(1)} 🔥)
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
