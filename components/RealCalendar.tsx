import React, { useState, useMemo } from 'react';
import { Language, DayProgress } from '../src/types/types';

interface RealCalendarProps {
  language: Language;
  ramadanStartDate: string; // ISO string '2026-02-19'
  allProgress: Record<number, DayProgress>; // Прогресс по дням
  selectedDay: number; // Выбранный день
  realTodayDay: number; // Реальный текущий день Рамадана (0 если не начался)
  onDaySelect: (day: number) => void; // Выбор дня
  trackerKeys: string[]; // Ключи трекера для подсчета прогресса
}

const RealCalendar: React.FC<RealCalendarProps> = ({ 
  language, 
  ramadanStartDate,
  allProgress,
  selectedDay,
  realTodayDay,
  onDaySelect,
  trackerKeys
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthNames = {
    kk: ['Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым', 'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан'],
    ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
  };
  
  const weekDays = {
    kk: ['Дс', 'Дс', 'Ср', 'Бс', 'Жм', 'Сб', 'Жк'],
    ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  };

  // Вычисляем дни месяца
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
  
  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.getTime() === today.getTime();
  };
  
  const isRamadanDay = (date: Date | null) => {
    if (!date) return false;
    return date >= ramadanStart && date <= ramadanEnd;
  };
  
  const getRamadanDayNumber = (date: Date) => {
    const diffTime = date.getTime() - ramadanStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };
  
  // Подсчёт прогресса для дня
  const calculateProgress = (dayNum: number) => {
    const dayData = allProgress[dayNum];
    if (!dayData) return 0;
    const completed = trackerKeys.filter(key => dayData[key as keyof DayProgress]).length;
    return Math.round((completed / trackerKeys.length) * 100);
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
          const ramadanDay = isRamadan ? getRamadanDayNumber(date) : null;
          
          // Логика блокировки
          const isLocked = ramadanDay ? ramadanDay > realTodayDay : false;
          const isSelected = ramadanDay === selectedDay;
          const progress = ramadanDay ? calculateProgress(ramadanDay) : 0;
          
          return (
            <div
              key={idx}
              onClick={() => {
                if (ramadanDay && !isLocked) {
                  onDaySelect(ramadanDay);
                }
              }}
              className={`
                aspect-square rounded-xl flex flex-col items-center justify-center text-center
                transition-all relative overflow-hidden
                ${ramadanDay && !isLocked ? 'cursor-pointer active:scale-95' : ''}
                ${isLocked ? 'cursor-not-allowed opacity-40' : ''}
                ${isSelected 
                  ? 'ring-2 ring-emerald-600 scale-105 z-10' 
                  : ''
                }
                ${isTodayDate 
                  ? 'bg-emerald-600 text-white shadow-lg font-black' 
                  : isRamadan && !isLocked
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold hover:bg-emerald-100'
                    : isRamadan && isLocked
                      ? 'bg-slate-100 border border-slate-200 text-slate-400'
                      : 'bg-slate-50 text-slate-600'
                }
              `}
            >
              {/* Прогресс-бар для дней Рамадана */}
              {ramadanDay && !isLocked && progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-200">
                  <div 
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
              
              {/* Номер дня */}
              <span className="text-sm font-bold">{date.getDate()}</span>
              
              {/* Номер дня Рамадана */}
              {ramadanDay && (
                <span className={`text-[8px] font-black mt-0.5 ${
                  isTodayDate ? 'text-white' : 'text-emerald-600'
                }`}>
                  {isLocked ? '🔒' : `${ramadanDay}`}
                </span>
              )}
              
              {/* Индикатор сегодня */}
              {isTodayDate && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              )}
              
              {/* Галочка для завершённых дней */}
              {ramadanDay && !isLocked && progress === 100 && (
                <div className="absolute top-0.5 right-0.5 text-[10px]">✓</div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center space-x-3 mt-5 text-[9px] font-bold">
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 bg-emerald-600 rounded"></div>
          <span className="text-slate-600">{language === 'kk' ? 'Бүгін' : 'Сегодня'}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 bg-emerald-50 border border-emerald-200 rounded"></div>
          <span className="text-slate-600">{language === 'kk' ? 'Ашық' : 'Открыто'}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-[6px]">🔒</div>
          <span className="text-slate-600">{language === 'kk' ? 'Жабық' : 'Закрыто'}</span>
        </div>
      </div>
    </div>
  );
};

export default RealCalendar;