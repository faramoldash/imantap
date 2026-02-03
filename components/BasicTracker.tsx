import React, { useMemo } from 'react';
import { DayProgress, Language, UserData } from '../src/types/types';
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
    title: 'Күнделік трекер',
    backButton: 'Артқа',
    prayers: 'Намаздар',
    fajr: 'Таң намазы',
    fajrDesc: 'Таң алдында оқылады',
    duha: 'Духа намазы',
    duhaDesc: 'Күн шыққаннан кейін',
    dhuhr: 'Бесін намазы',
    dhuhrDesc: 'Түскі намаз',
    asr: 'Екінті намазы',
    asrDesc: 'Түстен кейін',
    maghrib: 'Ақшам намазы',
    maghribDesc: 'Күн батқанда',
    isha: 'Құптан намазы',
    ishaDesc: 'Кешкі намаз',
    spiritual: 'Рухани амалдар',
    morningDhikr: 'Таңғы зікір',
    morningDhikrDesc: 'Таң намазынан кейін',
    eveningDhikr: 'Кешкі зікір',
    eveningDhikrDesc: 'Ақшам намазынан кейін',
    quranRead: 'Құран оқу',
    quranReadDesc: 'Күнделікті оқу',
    salawat: 'Салауат',
    salawatDesc: 'Пайғамбарға дұға',
    charity: 'Садақа',
    charityDesc: 'Жақсылық жасау',
    noXP: 'Әдеттегі күндер үшін XP есептелмейді',
  } : {
    title: 'Ежедневный трекер',
    backButton: 'Назад',
    prayers: 'Намазы',
    fajr: 'Фаджр',
    fajrDesc: 'Утренний намаз',
    duha: 'Духа',
    duhaDesc: 'После восхода солнца',
    dhuhr: 'Зухр',
    dhuhrDesc: 'Полуденный намаз',
    asr: 'Аср',
    asrDesc: 'Послеполуденный',
    maghrib: 'Магриб',
    maghribDesc: 'После заката',
    isha: 'Иша',
    ishaDesc: 'Ночной намаз',
    spiritual: 'Духовные практики',
    morningDhikr: 'Утренний зикр',
    morningDhikrDesc: 'После фаджра',
    eveningDhikr: 'Вечерний зикр',
    eveningDhikrDesc: 'После магриба',
    quranRead: 'Чтение Корана',
    quranReadDesc: 'Ежедневное чтение',
    salawat: 'Салават',
    salawatDesc: 'Благословение Пророку',
    charity: 'Садака',
    charityDesc: 'Творить добро',
    noXP: 'XP не начисляется для обычных дней',
  };

  const dateStr = date.toISOString().split('T')[0];
  
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

  const prayersData = [
    { key: 'fajr', icon: '🌅', color: 'from-orange-500 to-pink-500' },
    { key: 'duha', icon: '☀️', color: 'from-yellow-400 to-orange-400' },
    { key: 'dhuhr', icon: '🌞', color: 'from-amber-400 to-yellow-500' },
    { key: 'asr', icon: '🌤️', color: 'from-orange-400 to-amber-500' },
    { key: 'maghrib', icon: '🌆', color: 'from-purple-500 to-pink-500' },
    { key: 'isha', icon: '🌙', color: 'from-indigo-600 to-purple-600' },
  ];

  const spiritualData = [
    { key: 'morningDhikr', icon: '📿', color: 'from-emerald-500 to-teal-500' },
    { key: 'eveningDhikr', icon: '🤲', color: 'from-blue-500 to-indigo-500' },
    { key: 'quranRead', icon: '📖', color: 'from-green-600 to-emerald-600' },
    { key: 'salawat', icon: '☪️', color: 'from-cyan-500 to-blue-500' },
    { key: 'charity', icon: '💝', color: 'from-pink-500 to-rose-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-600 to-slate-700 text-white p-6 rounded-b-[3rem] shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <span className="text-9xl">📅</span>
        </div>
        
        <button 
          onClick={onBack}
          className="mb-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold hover:bg-white/30 transition-colors active:scale-95 relative z-10"
        >
          ← {t.backButton}
        </button>
        
        <div className="text-center relative z-10">
          <p className="text-xs font-black uppercase tracking-widest opacity-90 mb-2">
            {t.title}
          </p>
          <h1 className="text-2xl font-black mb-3">
            {dateString}
          </h1>
          <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 border border-white/20">
            <p className="text-xs font-bold opacity-90">
              {t.noXP}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-4">
        {/* Намазы */}
        <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
            <span className="mr-2">🕌</span>
            {t.prayers}
          </h3>
          <div className="space-y-3">
            {prayersData.map(({ key, icon, color }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-xl shadow-sm`}>
                    {icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">
                      {t[key as keyof typeof t]}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold">
                      {t[`${key}Desc` as keyof typeof t]}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updateField(key as keyof DayProgress, !data[key as keyof typeof data])}
                  className={`w-12 h-12 rounded-2xl transition-all flex items-center justify-center text-lg font-black ${
                    data[key as keyof typeof data]
                      ? `bg-gradient-to-br ${color} text-white shadow-lg active:scale-95`
                      : 'bg-slate-50 text-slate-300 active:scale-95'
                  }`}
                >
                  {data[key as keyof typeof data] ? '✓' : ''}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Духовные практики */}
        <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
            <span className="mr-2">✨</span>
            {t.spiritual}
          </h3>
          <div className="space-y-3">
            {spiritualData.map(({ key, icon, color }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-xl shadow-sm`}>
                    {icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">
                      {t[key as keyof typeof t]}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold">
                      {t[`${key}Desc` as keyof typeof t]}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updateField(key as keyof DayProgress, !data[key as keyof typeof data])}
                  className={`w-12 h-12 rounded-2xl transition-all flex items-center justify-center text-lg font-black ${
                    data[key as keyof typeof data]
                      ? `bg-gradient-to-br ${color} text-white shadow-lg active:scale-95`
                      : 'bg-slate-50 text-slate-300 active:scale-95'
                  }`}
                >
                  {data[key as keyof typeof data] ? '✓' : ''}
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
