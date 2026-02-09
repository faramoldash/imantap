import React, { useState, useMemo } from 'react';
import { Language, DayProgress } from '../src/types/types';

interface RealCalendarProps {
  language: Language;
  ramadanStartDate: string;
  preparationStartDate: string;
  firstTaraweehDate: string;
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
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const ramadanStart = new Date(ramadanStartDate);
  ramadanStart.setHours(0, 0, 0, 0);
  
  const ramadanEnd = new Date(ramadanStart);
  ramadanEnd.setDate(ramadanEnd.getDate() + 29);
  
  const prepStart = new Date(preparationStartDate);
  prepStart.setHours(0, 0, 0, 0);
  
  const firstTaraweeh = new Date(firstTaraweehDate);
  firstTaraweeh.setHours(0, 0, 0, 0);
  
  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.getTime() === today.getTime();
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
    return date.getTime() === firstTaraweeh.getTime();
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

  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button 
          onClick={goToPrevMonth}
          className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 font-black text-lg transition-colors active:scale-95"
        >
          ←
        </button>
        
        <div className="text-center">
          <h3 className="text-base font-black text-slate-800">
            {monthNames[language][currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            onClick={goToToday}
            className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mt-1 hover:underline active:scale-95"
          >
            {language === 'kk' ? 'Бүгінге өту' : 'Сегодня'}
          </button>
        </div>
        
        <button 
          onClick={goToNextMonth}
          className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 font-black text-lg transition-colors active:scale-95"
        >
          →
        </button>
      </div>
      
      {/* Week days */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays[language].map((day, idx) => (
          <div key={idx} className="text-center text-[10px] font-black text-slate-400 uppercase">
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
          
          const ramadanDay = isRamadan ? getRamadanDayNumber(date) : null;
          const prepDay = isPrep ? getPreparationDayNumber(date) : null;
          
          // Логика блокировки
          const isLocked = ramadanDay ? (ramadanDay > realTodayDay && ramadanDay !== 1) : 
                           prepDay ? (date > today) : false;
          
          const isSelected = false; // TODO: добавить логику выбора
          const progress = ramadanDay ? calculateProgress(ramadanDay, false) : 
                          prepDay ? calculateProgress(prepDay, true) : 0;
          
          // Цвета
          let bgColor = 'rgb(248 250 252)'; // обычный день
          let textColor = 'text-slate-600';
          
          if (isTodayDate) {
            bgColor = 'rgb(16 185 129)'; // зелёный
            textColor = 'text-white';
          } else if (isTaraweeh) {
            bgColor = 'rgb(251 191 36)'; // золотой - первый таравих
            textColor = 'text-white';
          } else if (isRamadan && !isLocked) {
            bgColor = progress > 0 ? '' : 'rgb(240 253 244)'; // светло-зелёный
            textColor = 'text-emerald-700';
          } else if (isRamadan && isLocked) {
            bgColor = 'rgb(241 245 249)';
            textColor = 'text-slate-400';
          } else if (isPrep && !isLocked) {
            bgColor = progress > 0 ? '' : 'rgb(224 242 254)'; // голубой
            textColor = 'text-sky-700';
          } else if (isPrep && isLocked) {
            bgColor = 'rgb(241 245 249)';
            textColor = 'text-slate-400';
          }
          
          return (
            <div
              key={idx}
              onClick={() => {
                if (ramadanDay && !isLocked) {
                    onDaySelect(ramadanDay);
                } else if (prepDay) {
                    onPreparationDaySelect(prepDay);
                } else if (!isRamadan && !isPrep) {
                    // ✅ КЛИК НА ОБЫЧНЫЙ ДЕНЬ
                    onBasicDateSelect(date);
                }
                }}
              className={`
                aspect-square rounded-xl flex flex-col items-center justify-center text-center
                transition-all relative overflow-hidden
                ${(ramadanDay || prepDay) && !isLocked ? 'cursor-pointer active:scale-95' : ''}
                ${isLocked ? 'cursor-not-allowed' : ''}
                ${isSelected ? 'ring-2 ring-emerald-600 scale-105 z-10' : ''}
              `}
              style={{
                background: (ramadanDay || prepDay) && !isLocked && progress > 0
                  ? isTaraweeh
                    ? `conic-gradient(rgb(251 191 36) ${progress * 3.6}deg, rgb(254 243 199) ${progress * 3.6}deg)`
                    : isRamadan
                      ? `conic-gradient(rgb(16 185 129) ${progress * 3.6}deg, rgb(240 253 244) ${progress * 3.6}deg)`
                      : `conic-gradient(rgb(14 165 233) ${progress * 3.6}deg, rgb(224 242 254) ${progress * 3.6}deg)`
                  : bgColor
              }}
            >
              {/* Внутренний белый круг для радиального прогресса */}
              {(ramadanDay || prepDay) && !isLocked && progress > 0 && progress < 100 && (
                <div className="absolute inset-1 rounded-lg bg-white flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-slate-800">{date.getDate()}</span>
                    <span className={`text-[8px] font-black mt-0.5 ${
                      isTaraweeh ? 'text-amber-600' : isRamadan ? 'text-emerald-600' : 'text-sky-600'
                    }`}>
                      {isTaraweeh ? '⭐' : ramadanDay || (prepDay && '📝')}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Контент для дней без прогресса или с полным прогрессом */}
              {((!ramadanDay && !prepDay) || isLocked || progress === 0 || progress === 100) && (
                <>
                  <span className={`text-sm font-bold ${textColor}`}>
                    {date.getDate()}
                  </span>
                  
                  {ramadanDay && (
                    <span className={`text-[8px] font-black mt-0.5 ${
                      isTodayDate ? 'text-white' : 
                      isLocked ? 'text-slate-400' :
                      'text-emerald-600'
                    }`}>
                      {isLocked ? '🔒' : ramadanDay}
                    </span>
                  )}
                  
                  {prepDay && (
                    <span className={`text-[8px] font-black mt-0.5 ${
                      isTaraweeh ? 'text-white' :
                      isLocked ? 'text-slate-400' :
                      'text-sky-600'
                    }`}>
                      {isLocked ? '🔒' : isTaraweeh ? '⭐' : '📝'}
                    </span>
                  )}
                </>
              )}
              
              {/* Индикатор сегодня */}
              {isTodayDate && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              )}
              
              {/* Галочка для завершённых дней */}
              {(ramadanDay || prepDay) && !isLocked && progress === 100 && (
                <div className={`absolute top-0.5 right-0.5 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center ${
                  isTaraweeh ? 'bg-amber-500' : isRamadan ? 'bg-emerald-600' : 'bg-sky-600'
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
          <div className="w-3 h-3 bg-emerald-600 rounded"></div>
          <span className="text-slate-600">{language === 'kk' ? 'Бүгін' : 'Сегодня'}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 bg-sky-100 border border-sky-300 rounded"></div>
          <span className="text-slate-600">{language === 'kk' ? 'Дайындық' : 'Подготовка'}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 bg-emerald-50 border border-emerald-200 rounded"></div>
          <span className="text-slate-600">{language === 'kk' ? 'Рамазан' : 'Рамадан'}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 bg-amber-400 rounded flex items-center justify-center text-[6px]">⭐</div>
          <span className="text-slate-600">{language === 'kk' ? '1-ші таравих' : '1-й таравих'}</span>
        </div>
      </div>
    </div>
  );
};

export default RealCalendar;