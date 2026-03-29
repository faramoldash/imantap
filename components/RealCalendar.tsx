import React, { useState, useMemo } from 'react';
import { Language, DayProgress } from '../src/types/types';

interface RealCalendarProps {
  language: Language;
  ramadanStartDate: string;
  preparationStartDate: string;
  firstTaraweehDate: string;
  eidAlFitrDate: string;
  allProgress: Record<number, DayProgress>;
  preparationProgress: Record<number, DayProgress>;
  selectedDay: number;
  realTodayDay: number;
  onDaySelect: (day: number) => void;
  onPreparationDaySelect: (day: number) => void;
  onBasicDateSelect: (date: Date) => void;
  trackerKeys: string[];
  preparationTrackerKeys: string[];
}

const RealCalendar: React.FC<RealCalendarProps> = ({ 
  language, 
  ramadanStartDate,
  preparationStartDate,
  firstTaraweehDate,
  eidAlFitrDate,
  allProgress,
  preparationProgress,
  selectedDay,
  realTodayDay,
  onDaySelect,
  onPreparationDaySelect,
  onBasicDateSelect,
  trackerKeys,
  preparationTrackerKeys
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthNames = {
    kk: ['Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым', 'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан'],
    ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
  };
  
  const weekDays = {
    kk: ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб', 'Жк'],
    ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  };

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const daysInMonth = lastDay.getDate();
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, [currentMonth]);
  
  const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const todayAlmatyStr = new Date().toLocaleDateString('en-CA', { timeZone: userTZ });
  
  // new Date(y, m-1, d) — полночь в локальном TZ браузера, без привязки к +05:00
  const [rsY, rsM, rsD] = ramadanStartDate.split('-').map(Number);
  const ramadanStart = new Date(rsY, rsM - 1, rsD);
  const ramadanEnd = new Date(rsY, rsM - 1, rsD + 28);

  const [psY, psM, psD] = preparationStartDate.split('-').map(Number);
  const prepStart = new Date(psY, psM - 1, psD);

  const [ftY, ftM, ftD] = firstTaraweehDate.split('-').map(Number);
  const firstTaraweeh = new Date(ftY, ftM - 1, ftD);

  const [edY, edM, edD] = eidAlFitrDate.split('-').map(Number);
  const eidDate = new Date(edY, edM - 1, edD);
  
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const str = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    return str === todayAlmatyStr;
  };
  
  const isRamadanDay = (date: Date | null) => {
    if (!date) return false;
    return date >= ramadanStart && date <= ramadanEnd;
  };
  
  const isPreparationDay = (date: Date | null) => {
    if (!date) return false;
    return date >= prepStart && date < ramadanStart;
  };
  
  const isFirstTaraweehDay = (date: Date | null) => {
    if (!date) return false;
    const str = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    return str === firstTaraweehDate; // ✅ сравниваем строку с пропсом 'YYYY-MM-DD'
  };

  const isPostRamadanDay = (date: Date | null) => {
    if (!date) return false;
    return date > ramadanEnd; // 20 марта и далее (Ораза айт + базовые дни)
  };

  const isEidDay = (date: Date | null) => {
    if (!date) return false;
    const str = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    return str === eidAlFitrDate; // ✅
  };
  
  const getRamadanDayNumber = (date: Date) => {
    const diffTime = date.getTime() - ramadanStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };
  
  const getPreparationDayNumber = (date: Date) => {
    const diffTime = date.getTime() - prepStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };
  
  const calculateProgress = (dayNum: number, isPrep: boolean = false) => {
    const dayData = isPrep ? preparationProgress[dayNum] : allProgress[dayNum];
    if (!dayData) return 0;
    const keys = isPrep ? preparationTrackerKeys : trackerKeys;
    const completed = keys.filter(key => dayData[key as keyof DayProgress]).length;
    return Math.round((completed / keys.length) * 100);
  };
  
  const goToPrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };
  
  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Вычисляем строку даты выбранного дня
  const prepStartMs = prepStart.getTime();
  const selectedDateMs = prepStartMs + (selectedDay - 1) * 86400000;
  const selectedDateStr = new Date(selectedDateMs)
    .toLocaleDateString('en-CA', { timeZone: userTZ });

  return (
    <div className="bg-card p-6 rounded-[2.5rem] shadow-sm border border-default">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button 
          onClick={goToPrevMonth}
          className="w-10 h-10 rounded-2xl bg-surface flex items-center justify-center text-primary font-black text-lg transition-colors active:scale-95"
        >
          ←
        </button>
        
        <div className="text-center">
          <h3 className="text-base font-black text-primary">
            {monthNames[language][currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            onClick={goToToday}
            className="text-[9px] font-bold text-brand uppercase tracking-wider mt-1 hover:underline active:scale-95"
          >
            {language === 'kk' ? 'Бүгінге өту' : 'Сегодня'}
          </button>
        </div>
        
        <button 
          onClick={goToNextMonth}
          className="w-10 h-10 rounded-2xl bg-surface flex items-center justify-center text-primary font-black text-lg transition-colors active:scale-95"
        >
          →
        </button>
      </div>
      
      {/* Week days */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays[language].map((day, idx) => (
          <div key={idx} className="text-center text-[10px] font-black text-secondary uppercase">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="aspect-square"></div>;
          }
          
          const isTodayDate = isToday(date);
          const isRamadan = isRamadanDay(date);
          const isPrep = isPreparationDay(date);
          const isTaraweeh = isFirstTaraweehDay(date);
          const isEid = isEidDay(date);
          const isPostRamadan = isPostRamadanDay(date) && !isEid; // базовые дни (не Ораза айт)
          
          const ramadanDay = isRamadan ? getRamadanDayNumber(date) : null;
          const prepDay = isPrep ? getPreparationDayNumber(date) : null;
          
          const calendarDateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
          const isSelected = calendarDateStr === selectedDateStr;
          const progress = ramadanDay ? calculateProgress(ramadanDay, false) : 
                          prepDay ? calculateProgress(prepDay, true) : 0;
          
          // Цвета
          let bgColor = 'var(--surface)'; // обычный день
          let textColor = 'text-primary';

          if (isTodayDate) {
            bgColor = 'var(--bronze)';
            textColor = 'text-white';
          } else if (isEid) {
            bgColor = 'rgb(251 146 60)'; // яркий оранжевый - Ораза айт
            textColor = 'text-white';
          } else if (isTaraweeh) {
            bgColor = 'rgb(251 191 36)'; // золотой - первый таравих
            textColor = 'text-white';
          } else if (isRamadan) {
            bgColor = progress > 0 ? '' : 'var(--brand-tint)';
            textColor = 'text-brand';
          } else if (isPrep) {
            bgColor = progress > 0 ? '' : 'var(--brand-tint)';
            textColor = 'text-brand';
          }
          
          return (
            <div
              key={idx}
              onClick={() => {
                // Дата кликнутого дня в локальном TZ браузера
                const clickedMs = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
                const dayNumber = Math.floor((clickedMs - prepStartMs) / 86400000) + 1;
                onDaySelect(dayNumber);
              }}
                
              className={`
                aspect-square rounded-2xl flex flex-col items-center justify-center text-center
                transition-all relative overflow-hidden cursor-pointer active:scale-95
                ${isSelected ? 'ring-2 ring-brand scale-105 z-10' : ''}
              `}
              style={{
                background: (ramadanDay || prepDay) && progress > 0
                  ? isTaraweeh
                    ? `conic-gradient(rgb(251 191 36) ${progress * 3.6}deg, rgb(254 243 199) ${progress * 3.6}deg)`
                    : `conic-gradient(var(--bronze) ${progress * 3.6}deg, var(--brand-tint) ${progress * 3.6}deg)`
                  : bgColor
              }}
            >
              {/* Внутренний круг для радиального прогресса */}
              {(ramadanDay || prepDay) && progress > 0 && progress < 100 && (
                <div className={`absolute inset-1 rounded-xl flex items-center justify-center ${
                  isTodayDate ? 'bg-brand' : 'bg-card'
                }`}>
                  <div className="flex flex-col items-center">
                    <span className={`text-sm font-bold ${isTodayDate ? 'text-white' : 'text-primary'}`}>
                      {date.getDate()}
                    </span>
                    <span className={`text-[8px] font-black mt-0.5 ${
                      isTodayDate ? 'text-white' : isTaraweeh ? 'text-amber-600' : 'text-brand'
                    }`}>
                      {isTaraweeh ? '⭐' : ramadanDay || (prepDay && '📝')}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Контент для дней без прогресса или с полным прогрессом */}
              {((!ramadanDay && !prepDay) || progress === 0 || progress === 100) && (
                <>
                  <span className={`text-sm font-bold ${textColor}`}>
                    {date.getDate()}
                  </span>
                  
                  {ramadanDay && (
                    <span className={`text-[8px] font-black mt-0.5 ${
                      isTodayDate ? 'text-white' : 'text-brand'
                    }`}>
                      {ramadanDay}
                    </span>
                  )}

                  {prepDay && (
                    <span className={`text-[8px] font-black mt-0.5 ${
                      isTaraweeh ? 'text-white' : 'text-brand'
                    }`}>
                      {isTaraweeh ? '⭐' : '📝'}
                    </span>
                  )}
                </>
              )}
              
              {/* Индикатор сегодня */}
              {isTodayDate && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              )}
              
              {/* Галочка для завершённых дней */}
              {(ramadanDay || prepDay) && progress === 100 && (
                <div className={`absolute top-0.5 right-0.5 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center ${
                  isTaraweeh ? 'bg-amber-500' : 'bg-brand'
                }`}>
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-5 text-[9px] font-bold">
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 bg-brand rounded"></div>
          <span className="text-secondary">{language === 'kk' ? 'Бүгін' : 'Сегодня'}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 bg-brand-tint border border-brand-subtle rounded"></div>
          <span className="text-secondary">{language === 'kk' ? 'Дайындық' : 'Подготовка'}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 bg-brand-tint border border-brand-subtle rounded"></div>
          <span className="text-secondary">{language === 'kk' ? 'Рамазан' : 'Рамадан'}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 bg-amber-400 rounded flex items-center justify-center text-[6px]">⭐</div>
          <span className="text-secondary">{language === 'kk' ? '1-ші тарауық' : '1-й таравих'}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 bg-orange-500 rounded flex items-center justify-center text-[6px]">🎉</div>
          <span className="text-secondary">{language === 'kk' ? 'Ораза айт' : 'Ораза айт'}</span>
        </div>
      </div>
    </div>
  );
};

export default RealCalendar;