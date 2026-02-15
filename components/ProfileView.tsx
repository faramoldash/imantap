import React, { useState, useMemo, useEffect } from 'react';
import { UserData, Language, DayProgress } from '../src/types/types';
import { TRANSLATIONS, XP_VALUES, BADGES } from '../constants';
import { getUserLevelInfo } from '../src/utils/levelHelper';

interface ProfileViewProps {
  userData: UserData;
  language: Language;
  setUserData: (data: UserData) => void;
  onNavigate?: (view: string) => void;
}

type PeriodFilter = 'today' | 'week' | 'month' | 'ramadan' | 'all';

const ProfileView: React.FC<ProfileViewProps> = ({ userData, language, setUserData }) => {
  const t = TRANSLATIONS[language];
  const levelInfo = getUserLevelInfo(userData.xp, language);
  
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('week');

  // ===== СИНХРОНИЗАЦИЯ С БОТОМ =====
  useEffect(() => {
    const loadDataFromBot = async () => {
      try {
        const tg = (window as any).Telegram?.WebApp;
        const telegramUserId = tg?.initDataUnsafe?.user?.id;
        
        if (!telegramUserId) return;
        if (userData.userId === telegramUserId && userData.myPromoCode) return;
        
        const response = await fetch(
          `https://imantap-bot-production.up.railway.app/api/user/${telegramUserId}/full`
        );
        
        if (!response.ok) return;
        
        const result = await response.json();
        let promoCode = null;
        let invitedCount = 0;
        
        if (result.success && result.data) {
          promoCode = result.data.promoCode;
          invitedCount = result.data.invitedCount || 0;
        } else if (result.promoCode) {
          promoCode = result.promoCode;
          invitedCount = result.invitedCount || 0;
        }
        
        if (promoCode) {
          setUserData({
            ...userData,
            userId: telegramUserId,
            myPromoCode: promoCode,
            referralCount: invitedCount
          });
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки данных с бота:', error);
      }
    };
    
    loadDataFromBot();
  }, []);

  // ===== ФИЛЬТРАЦИЯ ПО ПЕРИОДАМ =====
  const getFilteredProgress = (): DayProgress[] => {
    const now = new Date();
    const progressArray = Object.values(userData.progress) as DayProgress[];
    
    switch (periodFilter) {
      case 'today':
        const todayStr = now.toISOString().split('T')[0];
        return progressArray.filter(p => p.date?.startsWith(todayStr));
      
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return progressArray.filter(p => p.date && new Date(p.date) >= weekAgo);
      
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return progressArray.filter(p => p.date && new Date(p.date) >= monthAgo);
      
      case 'ramadan':
        const ramadanStart = new Date('2026-02-19');
        const ramadanEnd = new Date('2026-03-20');
        return progressArray.filter(p => {
          if (!p.date) return false;
          const date = new Date(p.date);
          return date >= ramadanStart && date <= ramadanEnd;
        });
      
      case 'all':
      default:
        return progressArray;
    }
  };

  // ===== СТАТИСТИКА =====
  const stats = useMemo(() => {
    const progressValues = getFilteredProgress();
    
    const totalFasts = progressValues.filter(p => p.fasting).length;
    const totalQuran = progressValues.reduce((acc, curr) => acc + (curr.quranPages || 0), 0);
    const totalCharity = progressValues.reduce((acc, curr) => acc + (curr.charityAmount || 0), 0);
    
    // Намазы по типам
    const prayerStats = {
      fajr: progressValues.filter(p => p.fajr).length,
      dhuhr: progressValues.filter(p => p.dhuhr).length,
      asr: progressValues.filter(p => p.asr).length,
      maghrib: progressValues.filter(p => p.maghrib).length,
      isha: progressValues.filter(p => p.isha).length,
      taraweeh: progressValues.filter(p => p.taraweeh).length,
    };
    
    const totalPossiblePrayers = progressValues.length * 5; // 5 обязательных
    const totalPrayers = prayerStats.fajr + prayerStats.dhuhr + prayerStats.asr + prayerStats.maghrib + prayerStats.isha;
    const prayerPercent = totalPossiblePrayers > 0 ? Math.round((totalPrayers / totalPossiblePrayers) * 100) : 0;
    
    // Сегодняшний прогресс
    const today = new Date().toISOString().split('T')[0];
    const todayProgress = progressValues.find(p => p.date?.startsWith(today));
    const todayTasks = todayProgress ? [
      todayProgress.fajr,
      todayProgress.dhuhr,
      todayProgress.asr,
      todayProgress.maghrib,
      todayProgress.isha,
      todayProgress.quranRead,
      todayProgress.charity,
      todayProgress.morningDhikr,
      todayProgress.eveningDhikr
    ].filter(Boolean).length : 0;
    
    return { 
      totalFasts, 
      totalQuran, 
      totalCharity, 
      prayerStats,
      totalPrayers,
      prayerPercent,
      daysInPeriod: progressValues.length,
      todayTasks
    };
  }, [userData.progress, periodFilter]);

  const inviteFriend = () => {
    const code = userData.myPromoCode;
    if (!code) return;

    const botUsername = 'imantap_bot';
    const botLink = `https://t.me/${botUsername}`;
    const inviteLink = `${botLink}?start=ref_${code}`;
    const text = language === 'kk' 
      ? `🌙 Рамазан айына бірге дайындалайық! Менің промокодымды «${code}» қолданып, +100 XP бонус ал!` 
      : `🌙 Давай готовиться к Рамадану вместе! Используй мой промокод «${code}» и получи +100 XP бонус!`;
    
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`;
    
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6 pb-8 pt-4 animate-in fade-in slide-in-from-right duration-500">
      
      {/* Header / Profile Card */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="flex items-center space-x-6 relative z-10">
          {userData.photoUrl ? (
            <img 
              src={userData.photoUrl} 
              alt="Profile" 
              className="w-20 h-20 rounded-[2rem] object-cover border-4 border-emerald-50 shadow-md"
            />
          ) : (
            <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner text-emerald-600">
              👤
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-slate-900 mb-0.5 truncate leading-tight">{userData.name || 'User'}</h2>
            {userData.username && (
              <p className="text-xs text-slate-400 font-bold mb-2">@{userData.username.replace('@','')}</p>
            )}
            
            <div className="flex items-center space-x-2 mb-2">
              <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black uppercase flex items-center space-x-1">
                <span>{levelInfo.icon}</span>
                <span>{levelInfo.name}</span>
              </span>
              <span className="text-xs font-bold text-slate-400">LVL {levelInfo.level}</span>
            </div>
            
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">
              {t.joinDate}: {new Date(userData.registrationDate || userData.startDate).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
              })}
            </p>
            
            {userData.subscriptionExpiresAt && userData.daysLeft !== null && (
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">
                {language === 'kk' ? 'Жазылым аяқталатын күн' : 'Подписка до'}: {' '}
                <span className={`${
                  userData.daysLeft <= 3 
                    ? 'text-red-600' 
                    : userData.daysLeft <= 7 
                    ? 'text-orange-600' 
                    : 'text-slate-600'
                }`}>
                  {new Date(userData.subscriptionExpiresAt).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </span>
              </p>
            )}
          </div>
        </div>
        
        {/* User Badges Strip */}
        <div className="mt-6 pt-4 border-t border-slate-50">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-2">
            {language === 'kk' ? 'Жетістіктеріңіз' : 'Ваши достижения'}
          </h4>
          <div className="grid grid-cols-4 gap-3">
            {BADGES.map(badge => {
              const isUnlocked = userData.unlockedBadges.includes(badge.id);
              return (
                <div key={badge.id} className="flex flex-col items-center group">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 ${
                    isUnlocked ? 'bg-amber-50 shadow-lg shadow-amber-100 grayscale-0 scale-100' : 'bg-slate-50 grayscale scale-90 opacity-40'
                  }`}>
                    {badge.icon}
                  </div>
                  <p className={`text-[8px] font-black text-center mt-2 uppercase tracking-tighter leading-tight ${
                    isUnlocked ? 'text-slate-800' : 'text-slate-300'
                  }`}>
                    {language === 'kk' ? badge.name_kk : badge.name_ru}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ✅ HERO METRICS */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-6 rounded-[3rem] text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-emerald-200 text-[10px] font-black uppercase tracking-wider mb-1">
              {language === 'kk' ? 'Streak' : 'Серия'}
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-4xl font-black">{userData.currentStreak || 0}</span>
              <span className="text-lg font-bold text-emerald-200">{language === 'kk' ? 'күн' : 'дней'}</span>
              <span className="text-3xl animate-bounce">🔥</span>
            </div>
            <p className="text-[9px] text-emerald-200 mt-1">
              {language === 'kk' ? 'Рекорд' : 'Рекорд'}: {userData.bestStreak || 0} {language === 'kk' ? 'күн' : 'дней'}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-emerald-200 text-[10px] font-black uppercase tracking-wider mb-1">XP</p>
            <div className="flex items-center space-x-2 justify-end">
              <span className="text-4xl font-black">{userData.xp.toLocaleString()}</span>
            </div>
            <p className="text-[9px] text-emerald-200 mt-1">
              {language === 'kk' ? 'Бүгін' : 'Сегодня'}: +{stats.todayTasks * 50} XP
            </p>
          </div>
        </div>
        
        {/* Сегодняшний прогресс */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100">
              {language === 'kk' ? 'Бүгінгі прогресс' : 'Прогресс сегодня'}
            </span>
            <span className="text-sm font-black">{stats.todayTasks} / 9</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-500" 
              style={{ width: `${(stats.todayTasks / 9) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* ✅ ВРЕМЕННЫЕ ФИЛЬТРЫ */}
      <div>
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3 px-2">
          {language === 'kk' ? 'Статистика' : 'Статистика'}
        </h3>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {[
            { value: 'today', label: language === 'kk' ? 'Бүгін' : 'Сегодня' },
            { value: 'week', label: language === 'kk' ? '7 күн' : '7 дней' },
            { value: 'month', label: language === 'kk' ? '30 күн' : '30 дней' },
            { value: 'ramadan', label: language === 'kk' ? 'Рамазан' : 'Рамадан' },
            { value: 'all', label: language === 'kk' ? 'Барлығы' : 'Всё время' },
          ].map(period => (
            <button
              key={period.value}
              onClick={() => setPeriodFilter(period.value as PeriodFilter)}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                periodFilter === period.value 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* ✅ ДЕТАЛЬНАЯ СТАТИСТИКА */}
      <div className="space-y-4">
        {/* Намазы */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-xl">🕌</div>
              <div>
                <h4 className="text-sm font-black text-slate-800">
                  {language === 'kk' ? 'Намаздар' : 'Намазы'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {stats.totalPrayers} / {stats.daysInPeriod * 5} ({stats.prayerPercent}%)
                </p>
              </div>
            </div>
            <span className="text-2xl font-black text-emerald-600">{stats.prayerPercent}%</span>
          </div>
          
          <div className="space-y-3">
            {[
              { key: 'fajr', name: language === 'kk' ? 'Таң' : 'Фаджр', icon: '🌅' },
              { key: 'dhuhr', name: language === 'kk' ? 'Бесін' : 'Зухр', icon: '☀️' },
              { key: 'asr', name: language === 'kk' ? 'Екінті' : 'Аср', icon: '🌤️' },
              { key: 'maghrib', name: language === 'kk' ? 'Шам' : 'Магриб', icon: '🌆' },
              { key: 'isha', name: language === 'kk' ? 'Құптан' : 'Иша', icon: '🌙' },
            ].map(prayer => {
              const count = stats.prayerStats[prayer.key as keyof typeof stats.prayerStats];
              const percent = stats.daysInPeriod > 0 ? Math.round((count / stats.daysInPeriod) * 100) : 0;
              return (
                <div key={prayer.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700 flex items-center space-x-2">
                      <span>{prayer.icon}</span>
                      <span>{prayer.name}</span>
                    </span>
                    <span className="text-xs font-black text-slate-400">{count}/{stats.daysInPeriod}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500" 
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Құран */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-xl">📖</div>
              <div>
                <h4 className="text-sm font-black text-slate-800">
                  {language === 'kk' ? 'Құран оқу' : 'Чтение Корана'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {language === 'kk' ? 'Барлығы оқылды' : 'Всего прочитано'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-600">{stats.totalQuran}</span>
              <p className="text-[9px] text-slate-400 uppercase">{language === 'kk' ? 'бет' : 'стр'}</p>
            </div>
          </div>
          
          {stats.daysInPeriod > 0 && (
            <div className="bg-emerald-50 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">
                  {language === 'kk' ? 'Орташа күніне' : 'В среднем в день'}
                </span>
                <span className="text-lg font-black text-emerald-600">
                  {(stats.totalQuran / stats.daysInPeriod).toFixed(1)} {language === 'kk' ? 'бет' : 'стр'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Садақа */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-xl">💎</div>
              <div>
                <h4 className="text-sm font-black text-slate-800">
                  {language === 'kk' ? 'Садақа' : 'Садака'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {language === 'kk' ? 'Барлығы' : 'Всего'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-rose-600">{stats.totalCharity.toLocaleString()}</span>
              <p className="text-[9px] text-slate-400 uppercase">₸</p>
            </div>
          </div>
          
          {stats.daysInPeriod > 0 && (
            <div className="bg-rose-50 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800">
                  {language === 'kk' ? 'Орташа күніне' : 'В среднем в день'}
                </span>
                <span className="text-lg font-black text-rose-600">
                  {Math.round(stats.totalCharity / stats.daysInPeriod).toLocaleString()} ₸
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Referral System */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 opacity-20 transform translate-x-4 -translate-y-4">
          <span className="text-8xl">🤝</span>
        </div>
        <div className="relative z-10">
          <h3 className="text-lg font-black uppercase mb-1">{t.referralTitle}</h3>
          <p className="text-xs text-emerald-100 mb-6 w-3/4 leading-relaxed">{t.referralDesc}</p>
          
          {userData.myPromoCode && (
            <div className="mb-6 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
              <p className="text-[9px] uppercase tracking-widest text-emerald-200 mb-1">{t.yourCodeLabel}</p>
              <p className="text-2xl font-black font-mono tracking-wider select-all">{userData.myPromoCode}</p>
            </div>
          )}

          <div className="flex items-center space-x-2 mb-6">
            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold">
              {t.referralReward}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <button 
              onClick={inviteFriend}
              className="bg-white text-emerald-800 px-6 py-3 rounded-2xl font-black text-xs shadow-lg active:opacity-90 transition-opacity"
            >
              {userData.myPromoCode ? t.referralBtnShare : t.referralBtn}
            </button>
            <div className="text-right">
              <span className="block text-2xl font-black">{userData.referralCount || 0}</span>
              <span className="text-[8px] uppercase tracking-widest opacity-70">{t.referralCountLabel}</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default ProfileView;
