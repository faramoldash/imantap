
import React from 'react';
import { DayProgress, Language } from '../types';
import { TOTAL_DAYS, TRANSLATIONS, TRACKER_KEYS } from '../constants';

interface CalendarProps {
  progress: Record<number, DayProgress>;
  language: Language;
  onSelectDay: (day: number) => void;
}

const Calendar: React.FC<CalendarProps> = ({ progress, language, onSelectDay }) => {
  const t = TRANSLATIONS[language];
  const days = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);

  const getStatusColor = (day: number) => {
    const data = progress[day];
    if (!data) return 'bg-white border-slate-100 text-slate-300';
    
    const completedCount = TRACKER_KEYS.filter(key => data[key as keyof DayProgress]).length;
    const progressPercent = (completedCount / TRACKER_KEYS.length) * 100;

    if (progressPercent >= 80) return 'bg-emerald-500 text-white shadow-emerald-200 shadow-lg border-emerald-400';
    if (progressPercent > 0) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-white border-slate-200 text-slate-700';
  };

  return (
    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 mb-20">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{t.calendarTitle}</h3>
      </div>
      
      <div className="grid grid-cols-5 gap-4">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => onSelectDay(day)}
            className={`aspect-square rounded-[1.5rem] flex flex-col items-center justify-center transition-all active:scale-90 border-2 ${getStatusColor(day)}`}
          >
            <span className="text-sm font-black mb-1">{day}</span>
            {progress[day] && progress[day].fasting && (
                <span className="text-[10px]">🌙</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
