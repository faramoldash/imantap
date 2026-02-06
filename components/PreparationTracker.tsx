import React, { useMemo } from 'react';
import { DayProgress, Language, UserData } from '../src/types/types';
import { PREPARATION_START_DATE, FIRST_TARAWEEH_DATE, XP_VALUES } from '../constants';
import { haptics } from '../src/utils/haptics';

interface PreparationTrackerProps {
  day: number; // 1-7
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
    title: 'Рамазанға дайындық',
    backButton: 'Артқа',
    day: 'Күн',
    fasting: 'Ораза',
    fastingDesc: 'Бүгін ораза ұстап жүрсіз бе?',
    prayers: 'Намаздар',
    fajr: 'Таң намазы',
    duha: 'Дұха намазы',
    dhuhr: 'Бесін намазы',
    asr: 'Екінті намазы',
    maghrib: 'Ақшам намазы',
    isha: 'Құптан намазы',
    taraweeh: 'Таравих намазы',
    spiritual: 'Рухани амалдар',
    morningDhikr: 'Таңғы зікір',
    eveningDhikr: 'Кешкі зікір',
    quranRead: 'Құран оқу',
    salawat: 'Салауат',
    hadith: 'Хадис',
    charity: 'Садақа',
    firstTaraweeh: '⭐ Бүгін бірінші таравих намазы!',
    mondayThursday: '🌙 Дүйсенбі/Бейсенбі оразасы (сүннет)',
  } : {
    title: 'Подготовка к Рамадану',
    backButton: 'Назад',
    day: 'День',
    fasting: 'Ораза',
    fastingDesc: 'Держите оразу сегодня?',
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
    quranRead: 'Чтение Корана',
    salawat: 'Салават',
    hadith: 'Хадис',
    charity: 'Садака',
    firstTaraweeh: '⭐ Сегодня первый таравих намаз!',
    mondayThursday: '🌙 Ораза в понедельник/четверг (сунна)',
  };

  // Вычисляем реальную дату этого дня подготовки
    const prepStartDate = new Date(PREPARATION_START_DATE);
    const currentDayDate = new Date(prepStartDate);
    currentDayDate.setDate(prepStartDate.getDate() + (day - 1));
    const dayOfWeek = currentDayDate.getDay(); // 0=вс, 1=пн, 4=чт

    const firstTaraweehDate = new Date(FIRST_TARAWEEH_DATE);
    const isFirstTaraweehDay = currentDayDate.getTime() === firstTaraweehDate.getTime();

    // Ораза в понедельник (1) и четверг (4)
    const isMondayOrThursday = dayOfWeek === 1 || dayOfWeek === 4;

    // ✅ ПРОВЕРКА: можно ли редактировать этот день
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const canEdit = currentDayDate <= today; // Можно редактировать только если дата наступила

    // ✅ ПЕРЕМЕСТИЛИ СЮДА - Форматирование даты
    const dateStr = useMemo(() => {
    const monthNames = language === 'kk' 
        ? ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан']
        : ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `${currentDayDate.getDate()} ${monthNames[currentDayDate.getMonth()]}`;
    }, [currentDayDate, language]);

    // ✅ ТЕПЕРЬ dateStr объявлен и можно использовать
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
    date: dateStr  // ✅ Теперь работает
    };

const updateField = (field: keyof DayProgress, value: boolean | number) => {
  haptics.light();
  onUpdate(day, { [field]: value });
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-600 to-blue-600 text-white p-6 rounded-b-[3rem] shadow-xl mb-6">
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
          <h1 className="text-4xl font-black mb-2">
            {t.day} {day}
          </h1>
          <p className="text-sm font-bold opacity-90">
            {dateStr}
          </p>
        </div>
      </div>

      <div className="px-6 space-y-4">
        {/* Специальные уведомления */}
        {isFirstTaraweehDay && (
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 rounded-[2rem] shadow-lg text-white text-center">
            <p className="text-2xl mb-2">🌙</p>
            <p className="font-black text-base">{t.firstTaraweeh}</p>
          </div>
        )}
        
        {isMondayOrThursday && !isFirstTaraweehDay && (
          <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-4 rounded-[2rem] shadow-lg text-white text-center">
            <p className="font-bold text-sm">{t.mondayThursday}</p>
          </div>
        )}

        {/* Ораза (только в пн/чт) */}
        {isMondayOrThursday && (
          <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-sky-100">
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
                onClick={() => canEdit && updateField('fasting', !data.fasting)}
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
          </section>
        )}

        {/* Намазы */}
        <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-sky-100">
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
                    onClick={() => canEdit && updateField(prayer as keyof DayProgress, !data[prayer as keyof DayProgress])}
                    disabled={!canEdit}
                    className={`w-10 h-10 rounded-xl transition-all ${
                        !canEdit
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        : data[prayer as keyof DayProgress]
                            ? 'bg-sky-600 text-white active:scale-95'
                            : 'bg-slate-100 text-slate-400 active:scale-95'
                    }`}
                    >
                    {!canEdit ? '🔒' : data[prayer as keyof DayProgress] ? '✓' : ''}
                    </button>
              </div>
            ))}
            
            {/* Таравих только 18 февраля */}
            {isFirstTaraweehDay && (
              <div className="flex items-center justify-between pt-2 border-t border-amber-100">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-black text-amber-600">
                    {t.taraweeh}
                  </span>
                  <span className="text-xs">⭐</span>
                </div>
                <button
                    onClick={() => canEdit && updateField('taraweeh', !data.taraweeh)}
                    disabled={!canEdit}
                    className={`w-10 h-10 rounded-xl transition-all ${
                        !canEdit
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        : data.taraweeh
                            ? 'bg-amber-500 text-white active:scale-95'
                            : 'bg-amber-50 text-amber-300 active:scale-95'
                    }`}
                    >
                    {!canEdit ? '🔒' : data.taraweeh ? '✓' : ''}
                    </button>
              </div>
            )}
          </div>
        </section>

        {/* Духовные практики */}
        <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-sky-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
            {t.spiritual}
          </h3>
          <div className="space-y-3">
            {['morningDhikr', 'eveningDhikr', 'quranRead', 'salawat', 'hadith', 'charity'].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">
                  {t[item as keyof typeof t]}
                </span>
                <button
                    onClick={() => canEdit && updateField(item as keyof DayProgress, !data[item as keyof DayProgress])}
                    disabled={!canEdit}
                    className={`w-10 h-10 rounded-xl transition-all ${
                        !canEdit
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        : data[item as keyof DayProgress]
                            ? 'bg-sky-600 text-white active:scale-95'
                            : 'bg-slate-100 text-slate-400 active:scale-95'
                    }`}
                    >
                    {!canEdit ? '🔒' : data[item as keyof DayProgress] ? '✓' : ''}
                    </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PreparationTracker;
