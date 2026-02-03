import React, { useState, useMemo } from 'react';
import { Language, DayProgress } from '../src/types/types';

interface RealCalendarProps {
  language: Language;
  ramadanStartDate: string;
  allProgress: Record<number, DayProgress>;
  selectedDay: number;
  realTodayDay: number;
  onDaySelect: (day: number) => void;
  trackerKeys: string[];
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
  
  // ✅ ИСПРАВЛЕНЫ ДНИ НЕДЕЛИ
  const weekDays = {
    kk: ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб', 'Жк'], // Дүйсенбі, Сейсенбі, Сәрсенбі, Бейсенбі, Жұма, Сенбі, Жексенбі
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
          // Первый день всегда открыт, остальные блокируются
          const isLocked = ramadanDay ? (ramadanDay > realTodayDay && ramadanDay !== 1) : false;
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
                ${isLocked ? 'cursor-not-allowed' : ''}
                ${isSelected ? 'ring-2 ring-emerald-600 scale-105 z-10' : ''}
              `}
              style={{
                background: ramadanDay && !isLocked && progress > 0
                  ? `conic-gradient(rgb(16 185 129) ${progress * 3.6}deg, rgb(240 253 244) ${progress * 3.6}deg)`
                  : isTodayDate
                    ? 'rgb(16 185 129)'
                    : isRamadan && !isLocked
                      ? 'rgb(240 253 244)'
                      : isRamadan && isLocked
                        ? 'rgb(241 245 249)'
                        : 'rgb(248 250 252)'
              }}
            >
              {/* Внутренний белый круг для радиального прогресса */}
              {ramadanDay && !isLocked && progress > 0 && progress < 100 && (
                <div className="absolute inset-1 rounded-lg bg-white flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-slate-700">{date.getDate()}</span>
                    <span className="text-[8px] font-black text-emerald-600 mt-0.5">
                      {ramadanDay}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Контент для дней без прогресса или с полным прогрессом */}
              {(!ramadanDay || isLocked || progress === 0 || progress === 100) && (
                <>
                  <span className={`text-sm font-bold ${
                    isTodayDate ? 'text-white' : 
                    isRamadan && !isLocked ? 'text-emerald-700' :
                    isRamadan && isLocked ? 'text-slate-400' :
                    'text-slate-600'
                  }`}>
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
                </>
              )}
              
              {/* Индикатор сегодня */}
              {isTodayDate && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              )}
              
              {/* Галочка для завершённых дней */}
              {ramadanDay && !isLocked && progress === 100 && (
                <div className="absolute top-0.5 right-0.5 text-white text-[10px] bg-emerald-600 rounded-full w-4 h-4 flex items-center justify-center">
                  ✓
                </div>
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