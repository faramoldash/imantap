import React, { useMemo } from 'react';
import { DayProgress, Language, UserData } from '../src/types/types';
import { haptics } from '../src/utils/haptics';

interface BasicTrackerProps {
  date: Date; // Выбранная дата
  language: Language;
  userData: UserData;
  onUpdate: (dateStr: string, updates: Partial<DayProgress>) => void;
  onBack: () => void;
}

const BasicTracker: React.FC<BasicTrackerProps> = ({
  date,
  language,
  userData,
  onUpdate,
  onBack
}) => {
  const t = language === 'kk' ? {
    title: 'Күнделік трекер',
    backButton: 'Артқа',
    prayers: 'Намаздар',
    fajr: 'Таң намазы',
    duha: 'Духа намазы',
    dhuhr: 'Бесін намазы',
    asr: 'Екінті намазы',
    maghrib: 'Ақшам намазы',
    isha: 'Құптан намазы',
    spiritual: 'Рухани амалдар',
    morningDhikr: 'Таңғы зікір',
    eveningDhikr: 'Кешкі зікір',
    quranRead: 'Құран оқу',
    salawat: 'Салауат',
    charity: 'Садақа',
    noXP: '📝 Әдеттегі күндер үшін XP есептелмейді',
  } : {
    title: 'Базовый трекер',
    backButton: 'Назад',
    prayers: 'Намазы',
    fajr: 'Фаджр',
    duha: 'Духа',
    dhuhr: 'Зухр',
    asr: 'Аср',
    maghrib: 'Магриб',
    isha: 'Иша',
    spiritual: 'Духовные практики',
    morningDhikr: 'Утренний зикр',
    eveningDhikr: 'Вечерний зикр',
    quranRead: 'Чтение Корана',
    salawat: 'Салават',
    charity: 'Садака',
    noXP: '📝 XP не начисляется для обычных дней',
  };

  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const data = userData.basicProgress?.[dateStr] || {
    date: date.toISOString(),
    fajr: false,
    morningDhikr: false,
    quranRead: false,
    salawat: false,
    duha: false,
    charity: false,
    dhuhr: false,
    asr: false,
    eveningDhikr: false,
    maghrib: false,
    isha: false,
  };

  const updateField = (field: keyof DayProgress, value: boolean) => {
    haptics.light();
    onUpdate(dateStr, { [field]: value });
  };

  const dateString = useMemo(() => {
    const monthNames = language === 'kk' 
      ? ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан']
      : ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const weekDays = language === 'kk'
      ? ['Жексенбі', 'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі']
      : ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return `${weekDays[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]}`;
  }, [date, language]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-700 to-slate-800 text-white p-6 rounded-b-[3rem] shadow-xl mb-6">
        <button 
          onClick={onBack}
          className="mb-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold hover:bg-white/30 transition-colors active:scale-95"
        >
          ← {t.backButton}
        </button>
        
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-widest opacity-90 mb-2">
            {t.title}
          </p>
          <h1 className="text-lg font-black mb-2">
            {dateString}
          </h1>
          <p className="text-xs font-bold opacity-75 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 inline-block">
            {t.noXP}
          </p>
        </div>
      </div>

      <div className="px-6 space-y-4">
        {/* Намазы */}
        <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
            {t.prayers}
          </h3>
          <div className="space-y-3">
            {['fajr', 'duha', 'dhuhr', 'asr', 'maghrib', 'isha'].map((prayer) => (
              <div key={prayer} className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">
                  {t[prayer as keyof typeof t]}
                </span>
                <button
                  onClick={() => updateField(prayer as keyof DayProgress, !data[prayer as keyof typeof data])}
                  className={`w-10 h-10 rounded-xl transition-all active:scale-95 ${
                    data[prayer as keyof typeof data]
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {data[prayer as keyof typeof data] ? '✓' : ''}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Духовные практики */}
        <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
            {t.spiritual}
          </h3>
          <div className="space-y-3">
            {['morningDhikr', 'eveningDhikr', 'quranRead', 'salawat', 'charity'].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">
                  {t[item as keyof typeof t]}
                </span>
                <button
                  onClick={() => updateField(item as keyof DayProgress, !data[item as keyof typeof data])}
                  className={`w-10 h-10 rounded-xl transition-all active:scale-95 ${
                    data[item as keyof typeof data]
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {data[item as keyof typeof data] ? '✓' : ''}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default BasicTracker;
