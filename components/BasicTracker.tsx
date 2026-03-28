import React, { useMemo, useCallback } from 'react';
import { DayProgress, Language, UserData } from '../src/types/types';
import { PRAYER_ICONS } from '../constants';
import { haptics } from '../src/utils/haptics';

interface BasicTrackerProps {
  date: Date;
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
    title: 'Әдеттегі трекер',
    backButton: 'Артқа',
    prayers: 'Намаздар',
    spiritual: 'Рухани амалдар',
    progress: 'Прогресс',
    completed: 'Орындалды',
    fajr: 'Таң',
    duha: 'Дұха',
    dhuhr: 'Бесін',
    asr: 'Екінті',
    maghrib: 'Ақшам',
    isha: 'Құптан',
    morningDhikr: 'Таңғы зікір',
    eveningDhikr: 'Кешкі зікір',
    quranRead: 'Құран',
    salawat: 'Салауат',
    charity: 'Садақа',
    hadith: 'Хадис',
    noXP: 'XP жоқ',
    backToHome: 'Басты бетке',
  } : {
    title: 'Обычный трекер',
    backButton: 'Назад',
    prayers: 'Намазы',
    spiritual: 'Духовные практики',
    progress: 'Прогресс',
    completed: 'Выполнено',
    fajr: 'Фаджр',
    duha: 'Духа',
    dhuhr: 'Зухр',
    asr: 'Аср',
    maghrib: 'Магриб',
    isha: 'Иша',
    morningDhikr: 'Утренний зикр',
    eveningDhikr: 'Вечерний зикр',
    quranRead: 'Коран',
    salawat: 'Салават',
    charity: 'Садака',
    hadith: 'Хадис',
    noXP: 'Без XP',
    backToHome: 'На главную',
  };

  const dateStr = date.toISOString().split('T')[0];

  const data = userData.basicProgress?.[dateStr] || {
    day: 0,
    date: dateStr,  // ✅ Используем dateStr
    fasting: false,
    fajr: false,
    morningDhikr: false,
    quranRead: false,
    salawat: false,
    duha: false,
    charity: false,
    charityAmount: 0,
    dhuhr: false,
    asr: false,
    eveningDhikr: false,
    maghrib: false,
    isha: false,
    taraweeh: false,
    witr: false,
    quranPages: 0,
    hadith: false,  // ✅ Добавлено
  };

  const updateField = useCallback((field: keyof DayProgress, value: boolean) => {
    haptics.light();
    onUpdate(dateStr, { [field]: value });
  }, [dateStr, onUpdate]);

  const dateString = useMemo(() => {
    const monthNames = language === 'kk' 
      ? ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан']
      : ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const weekDays = language === 'kk'
      ? ['Жексенбі', 'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі']
      : ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return `${weekDays[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]}`;
  }, [date, language]);

  // ✅ ИСПРАВЛЕНО: убрали 'lessons', добавили 'hadith'
  const trackerKeys: (keyof typeof data)[] = [
    'fajr', 'duha', 'dhuhr', 'asr', 'maghrib', 'isha',
    'morningDhikr', 'eveningDhikr', 'quranRead', 'salawat',
    'charity', 'hadith'
  ];

  const completedCount = trackerKeys.filter(key => data[key]).length;
  const progressPercent = Math.round((completedCount / trackerKeys.length) * 100);

  const ItemButton = useCallback(({ id, icon, small = false }: {
    id: keyof DayProgress;
    icon: string;
    small?: boolean;
  }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        updateField(id, !data[id as keyof typeof data]);
      }}
      className={`p-2 rounded-[1.25rem] border transition-all flex flex-col items-center justify-center space-y-1 relative active:scale-95 ${
        small ? 'h-20' : 'h-24'
      } ${
        data[id as keyof typeof data]
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-inner'
          : 'bg-white border-slate-100 text-slate-600 shadow-sm'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-[11px] font-bold text-center leading-tight">
        {t[id as keyof typeof t]}
      </span>
      {data[id as keyof typeof data] && (
        <span className="absolute top-1 right-1 text-xs">✓</span>
      )}
    </button>
  ), [data, updateField, t]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-600 to-slate-700 p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <span className="text-9xl">📅</span>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={onBack}
              className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold hover:bg-white/30 transition-colors active:scale-95"
            >
              ← {t.backButton}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-90 mb-2">
              {t.title}
            </p>
            <h1 className="text-2xl font-black mb-3">
              {dateString}
            </h1>
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <p className="text-xs font-bold opacity-90">{t.noXP}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Намазы */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h4 className="text-[10px] font-black text-slate-400 mb-5 tracking-widest uppercase px-1">
          {t.prayers}
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <ItemButton id="fajr" icon={PRAYER_ICONS.fajr} small />
          <ItemButton id="duha" icon={PRAYER_ICONS.duha} small />
          <ItemButton id="dhuhr" icon={PRAYER_ICONS.dhuhr} small />
          <ItemButton id="asr" icon={PRAYER_ICONS.asr} small />
          <ItemButton id="maghrib" icon={PRAYER_ICONS.maghrib} small />
          <ItemButton id="isha" icon={PRAYER_ICONS.isha} small />
        </div>
      </div>

      {/* Духовные практики */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h4 className="text-[10px] font-black text-slate-400 mb-5 tracking-widest uppercase px-1">
          {t.spiritual}
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <ItemButton id="quranRead" icon="📖" small />
          <ItemButton id="morningDhikr" icon="🤲" small />
          <ItemButton id="eveningDhikr" icon="🌙" small />
          <ItemButton id="salawat" icon="☪️" small />
          <ItemButton id="charity" icon="💝" small />
          <ItemButton id="hadith" icon="📜" small />
        </div>
      </div>

      {/* Прогресс */}
      <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl">🎯</div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
              {t.progress}
            </h4>
          </div>
          
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-5xl font-black leading-none">{completedCount}</p>
              <p className="text-sm font-bold text-white/60 mt-1">/ {trackerKeys.length}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black">{progressPercent}%</p>
              <p className="text-[10px] font-black text-white/60 uppercase">{t.completed}</p>
            </div>
          </div>
          
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Кнопка назад */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <button
          onClick={() => {
            haptics.medium();
            onBack();
          }}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-2xl font-black text-base shadow-lg active:scale-95 transition-all"
        >
          {t.backToHome}
        </button>
      </div>
    </div>
  );
};

export default BasicTracker;