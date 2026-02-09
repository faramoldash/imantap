
import React from 'react';
import { DayProgress, Language } from '../src/types/types';
import { TOTAL_DAYS, TRANSLATIONS, TRACKER_KEYS } from '../constants';

interface CalendarProps {
  progress: Record<number, DayProgress>;
  realTodayDay: number;
  selectedDay: number;
  language: Language;
  onSelectDay: (day: number) => void;
}

const Calendar: React.FC<CalendarProps> = ({ progress, realTodayDay, selectedDay, language, onSelectDay }) => {
  const t = TRANSLATIONS[language];
  const days = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);
  
  // Allow viewing Day 1 even if Ramadan hasn't started (realTodayDay is 0), otherwise lock future days
  const maxAvailableDay = Math.max(1, realTodayDay);

  const getStatusColor = (day: number, isLocked: boolean) => {
    if (isLocked) {
      return 'bg-slate-50 border-slate-100 text-slate-300 opacity-50 cursor-not-allowed';
    }

    const data = progress[day];
    const isToday = day === realTodayDay;
    const isSelected = day === selectedDay;

    if (!data) {
        if (isSelected) return 'bg-emerald-50 border-emerald-500 text-emerald-900 border-[3px] shadow-lg';
        if (isToday) return 'bg-white border-emerald-300 text-emerald-600 border-[2px] shadow-sm';
        return 'bg-white border-slate-100 text-slate-300';
    }
    
    const completedCount = TRACKER_KEYS.filter(key => data[key as keyof DayProgress]).length;
    const progressPercent = (completedCount / TRACKER_KEYS.length) * 100;

    let baseClasses = '';
    if (progressPercent >= 80) baseClasses = 'bg-emerald-500 text-white shadow-emerald-200 shadow-lg border-emerald-400';
    else if (progressPercent > 0) baseClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    else baseClasses = 'bg-white border-slate-200 text-slate-700';

    if (isSelected) {
        return `${baseClasses} ring-4 ring-emerald-500/30 border-[4px] border-emerald-600 scale-105 z-10`;
    }
    if (isToday) {
        return `${baseClasses} border-amber-400 border-[3px]`;
    }

    return baseClasses;
  };

  return (
    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8 px-2">
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{t.calendarTitle}</h3>
        <div className="flex items-center space-x-2">
           <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.todayLabel}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-5 gap-4">
        {days.map((day) => {
          const isToday = day === realTodayDay;
          const isLocked = day > maxAvailableDay;

          return (
            <button
              key={day}
              onClick={() => !isLocked && onSelectDay(day)}
              disabled={isLocked}
              className={`aspect-square rounded-[1.5rem] flex flex-col items-center justify-center transition-all border-2 relative overflow-hidden ${
                !isLocked ? 'active:scale-95' : ''
              } ${getStatusColor(day, isLocked)}`}
            >
              {isLocked ? (
                 <span className="text-xl opacity-50">🔒</span>
              ) : (
                <>
                  <span className="text-sm font-black mb-1">{day}</span>
                  <div className="flex space-x-0.5">
                      {progress[day]?.fasting && (
                          <span className="text-[8px]">🌙</span>
                      )}
                      {isToday && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full"></span>
                      )}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;