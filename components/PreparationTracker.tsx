import React, { useMemo, useCallback } from 'react';
import { DayProgress, Language, UserData } from '../src/types/types';
import { PREPARATION_START_DATE, FIRST_TARAWEEH_DATE, XP_VALUES } from '../constants';
import { haptics } from '../src/utils/haptics';

interface PreparationTrackerProps {
  day: number;
  language: Language;
  userData: UserData;
  onUpdate: (day: number, updates: Partial<DayProgress>) => void;
  onBack: () => void;
}

const PreparationTracker: React.FC<PreparationTrackerProps> = ({
  day,
  language,
  userData,
  onUpdate,
  onBack
}) => {
  const t = language === 'kk' ? {
    title: 'Рамазанға',
    backButton: 'Артқа',
    day: 'Күн',
    fasting: 'Ораза',
    fastingDesc: 'Сүннет ораза',
    prayers: 'Намаздар',
    fajr: 'Таң',
    duha: 'Дұха',
    dhuhr: 'Бесін',
    asr: 'Екінті',
    maghrib: 'Ақшам',
    isha: 'Құптан',
    taraweeh: 'Таравих',
    spiritual: 'Рухани амалдар',
    morningDhikr: 'Таңғы зікір',
    eveningDhikr: 'Кешкі зікір',
    quranRead: 'Құран',
    salawat: 'Салауат',
    hadith: 'Хадис',
    charity: 'Садақа',
    progress: 'Прогресс',
    completed: 'Орындалды',
    firstTaraweeh: 'Бірінші таравих!',
    mondayThursday: 'Дүйсенбі/Бейсенбі оразасы',
    backToHome: 'Басты бетке',
    xpEarned: 'XP жиналды',
  } : {
    title: 'Подготовка к Рамадану',
    backButton: 'Назад',
    day: 'День',
    fasting: 'Ораза',
    fastingDesc: 'Сунна ораза',
    prayers: 'Намазы',
    fajr: 'Фаджр',
    duha: 'Духа',
    dhuhr: 'Зухр',
    asr: 'Аср',
    maghrib: 'Магриб',
    isha: 'Иша',
    taraweeh: 'Таравих',
    spiritual: 'Духовные практики',
    morningDhikr: 'Утренний зикр',
    eveningDhikr: 'Вечерний зикр',
    quranRead: 'Коран',
    salawat: 'Салават',
    hadith: 'Хадис',
    charity: 'Садака',
    progress: 'Прогресс',
    completed: 'Выполнено',
    firstTaraweeh: 'Первый таравих!',
    mondayThursday: 'Ораза в пн/чт',
    backToHome: 'На главную',
    xpEarned: 'XP заработано',
  };

  const prepStartDate = new Date(PREPARATION_START_DATE);
  const currentDayDate = new Date(prepStartDate);
  currentDayDate.setDate(prepStartDate.getDate() + (day - 1));
  currentDayDate.setHours(0, 0, 0, 0);
  const dayOfWeek = currentDayDate.getDay();
  
  const firstTaraweehDate = new Date(FIRST_TARAWEEH_DATE);
  const isFirstTaraweehDay = currentDayDate.getTime() === firstTaraweehDate.getTime();
  const isMondayOrThursday = dayOfWeek === 1 || dayOfWeek === 4;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const canEdit = currentDayDate <= today;

  const dateStr = useMemo(() => {
    const monthNames = language === 'kk' 
      ? ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан']
      : ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const weekDays = language === 'kk'
      ? ['Жексенбі', 'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі']
      : ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return `${weekDays[currentDayDate.getDay()]}, ${currentDayDate.getDate()} ${monthNames[currentDayDate.getMonth()]}`;
  }, [currentDayDate, language]);

  const data = userData.preparationProgress?.[day] || {
    day,
    fasting: false,
    fajr: false,
    morningDhikr: false,
    quranRead: false,
    salawat: false,
    hadith: false,
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
    date: dateStr
  };

  const updateField = useCallback((field: keyof DayProgress, value: boolean | number) => {
    if (!canEdit) return;
    haptics.light();
    onUpdate(day, { [field]: value });
  }, [day, onUpdate, canEdit]);

  // Подсчет прогресса
  const trackerKeys: (keyof typeof data)[] = [
    'fajr', 'duha', 'dhuhr', 'asr', 'maghrib', 'isha',
    'morningDhikr', 'eveningDhikr', 'quranRead', 'salawat',
    'hadith', 'charity'
  ];
  
  if (isMondayOrThursday) trackerKeys.push('fasting');
  if (isFirstTaraweehDay) trackerKeys.push('taraweeh');

  const completedCount = trackerKeys.filter(key => data[key]).length;
  const progressPercent = Math.round((completedCount / trackerKeys.length) * 100);

  // ✅ Подсчет XP с правильной типизацией
  const earnedXP = useMemo(() => {
    let xp = 0;
    trackerKeys.forEach(key => {
      if (data[key]) {
        const xpKey = key as keyof typeof XP_VALUES;
        if (XP_VALUES[xpKey]) {
          xp += XP_VALUES[xpKey];
        }
      }
    });
    return xp;
  }, [trackerKeys, data]);

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
      disabled={!canEdit}
      className={`p-2 rounded-[1.25rem] border transition-all flex flex-col items-center justify-center space-y-1 relative ${
        small ? 'h-20' : 'h-24'
      } ${
        !canEdit
          ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
          : data[id as keyof typeof data]
            ? 'bg-sky-50 border-sky-200 text-sky-700 shadow-inner active:scale-95'
            : 'bg-white border-slate-100 text-slate-600 shadow-sm active:scale-95'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-[11px] font-bold text-center leading-tight">
        {t[id as keyof typeof t]}
      </span>
      {data[id as keyof typeof data] && (
        <span className="absolute top-1 right-1 text-xs">✓</span>
      )}
      {!canEdit && (
        <span className="absolute top-1 left-1 text-xs">🔒</span>
      )}
    </button>
  ), [data, updateField, canEdit, t]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-600 to-blue-600 p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <span className="text-9xl">🌙</span>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => {
                haptics.medium();
                onBack();
              }}
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
              {t.day} {day}
            </h1>
            <p className="text-sm font-bold opacity-90 mb-3">
              {dateStr}
            </p>
            
            {/* Бейджи */}
            <div className="flex justify-center gap-2 flex-wrap">
              {isMondayOrThursday && (
                <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                  <p className="text-xs font-bold">🌙 {t.mondayThursday}</p>
                </div>
              )}
              {isFirstTaraweehDay && (
                <div className="inline-block bg-amber-500/20 backdrop-blur-sm rounded-full px-3 py-1.5 border border-amber-300/30">
                  <p className="text-xs font-bold">⭐ {t.firstTaraweeh}</p>
                </div>
              )}
              <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                <p className="text-xs font-bold">💎 +{earnedXP} {t.xpEarned}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ораза (только в пн/чт) */}
      {isMondayOrThursday && (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-sky-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-sky-100 rounded-[2rem] flex items-center justify-center text-2xl">
                🌙
              </div>
              <div>
                <h3 className="font-black text-slate-800">{t.fasting}</h3>
                <p className="text-xs text-slate-500">{t.fastingDesc}</p>
              </div>
            </div>
            <button
              onClick={() => updateField('fasting', !data.fasting)}
              disabled={!canEdit}
              className={`w-12 h-12 rounded-2xl transition-all ${
                !canEdit 
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                  : data.fasting
                    ? 'bg-sky-600 text-white shadow-lg active:scale-95'
                    : 'bg-slate-100 text-slate-400 active:scale-95'
              }`}
            >
              {!canEdit ? '🔒' : data.fasting ? '✓' : ''}
            </button>
          </div>
        </div>
      )}

      {/* Намазы */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-sky-100">
        <h4 className="text-[10px] font-black text-slate-400 mb-5 tracking-widest uppercase px-1">
          {t.prayers}
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <ItemButton id="fajr" icon="🌅" small />
          <ItemButton id="duha" icon="☀️" small />
          <ItemButton id="dhuhr" icon="🌞" small />
          <ItemButton id="asr" icon="🌤️" small />
          <ItemButton id="maghrib" icon="🌆" small />
          <ItemButton id="isha" icon="🌙" small />
          {isFirstTaraweehDay && (
            <ItemButton id="taraweeh" icon="⭐" small />
          )}
        </div>
      </div>

      {/* Духовные практики */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-sky-100">
        <h4 className="text-[10px] font-black text-slate-400 mb-5 tracking-widest uppercase px-1">
          {t.spiritual}
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <ItemButton id="quranRead" icon="📖" small />
          <ItemButton id="morningDhikr" icon="🤲" small />
          <ItemButton id="eveningDhikr" icon="🌙" small />
          <ItemButton id="salawat" icon="☪️" small />
          <ItemButton id="hadith" icon="📜" small />
          <ItemButton id="charity" icon="💝" small />
        </div>
      </div>

      {/* Прогресс */}
      <div className="bg-sky-900 p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl">🎯</div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-sky-400">
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
              className="h-full bg-gradient-to-r from-sky-500 via-sky-400 to-blue-300 transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Кнопка назад */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-sky-100">
        <button
          onClick={() => {
            haptics.medium();
            onBack();
          }}
          className="w-full bg-gradient-to-br from-sky-600 to-blue-700 text-white py-4 rounded-2xl font-black text-base shadow-lg active:scale-95 transition-all"
        >
          {t.backToHome}
        </button>
      </div>
    </div>
  );
};

export default PreparationTracker;