import React, { useState, useMemo, useEffect } from 'react';
import { UserData, Language, DayProgress } from '../src/types/types';
import { TRANSLATIONS, XP_VALUES, BADGES } from '../constants';


interface ProfileViewProps {
  userData: UserData;
  language: Language;
  setUserData: (data: UserData) => void;
}


const ProfileView: React.FC<ProfileViewProps> = ({ userData, language, setUserData }) => {
  const t = TRANSLATIONS[language];
  const level = Math.floor(userData.xp / 1000) + 1;
  const levelName = t[`level${Math.min(level, 5)}`];


  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [isValidating, setIsValidating] = useState(false);


  // ===== СИНХРОНИЗАЦИЯ С БОТОМ =====
  useEffect(() => {
    const loadDataFromBot = async () => {
      try {
        // Получаем Telegram WebApp
        const tg = (window as any).Telegram?.WebApp;
        const telegramUserId = tg?.initDataUnsafe?.user?.id;
        
        if (!telegramUserId) {
          console.log('⚠️ Telegram user ID не найден');
          return;
        }
        
        // ✅ Проверяем - уже загружали данные для этого пользователя?
        if (userData.userId === telegramUserId && userData.myPromoCode) {
          console.log('✅ Данные уже загружены, пропускаем');
          return;
        }
        
        console.log('🔍 Загрузка данных для user ID:', telegramUserId);
        
        const response = await fetch(
          `https://imantap-bot-production.up.railway.app/api/user/${telegramUserId}/full`
        );
        
        if (!response.ok) {
          console.error('❌ Ошибка API:', response.status);
          return;
        }
        
        const result = await response.json();
        
        // Обрабатываем оба формата ответа
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
          console.log('✅ Получены данные с бота:', { promoCode, invitedCount });
          
          setUserData({
            ...userData,
            userId: telegramUserId,
            myPromoCode: promoCode,
            referralCount: invitedCount
          });
          
          console.log('✅ referralCount обновлён:', invitedCount);
        } else {
          console.log('⚠️ promoCode не найден в ответе');
        }
        
      } catch (error) {
        console.error('❌ Ошибка загрузки данных с бота:', error);
      }
    };
    
    loadDataFromBot();
  }, []);


  // Calculate Statistics
  const stats = useMemo(() => {
    const progressValues = Object.values(userData.progress) as DayProgress[];
    
    const totalFasts = progressValues.filter(p => p.fasting).length;
    const totalQuran = progressValues.reduce((acc, curr) => acc + (curr.quranPages || 0), 0);
    const totalCharity = progressValues.reduce((acc, curr) => acc + (curr.charityAmount || 0), 0);
    
    // Count total prayers performed (simple count of all true prayer booleans)
    const prayerKeys = ['fajr', 'duha', 'dhuhr', 'asr', 'maghrib', 'isha', 'taraweeh', 'tahajjud', 'witr'] as const;
    const totalPrayers = progressValues.reduce((acc, curr) => {
      const dailyPrayers = prayerKeys.filter(k => curr[k]).length;
      return acc + dailyPrayers;
    }, 0);


    return { totalFasts, totalQuran, totalCharity, totalPrayers };
  }, [userData.progress]);


  const inviteFriend = () => {
      const code = userData.myPromoCode;
      
      // Если промокод не загрузился из бота - показать ошибку
      if (!code) {
          console.error('❌ Промокод не загружен из бота');
          return;
      }


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


  const redeemPromoCode = async () => {
    setPromoError('');
    setPromoSuccess('');


    const input = promoInput.trim().toUpperCase();


    if (!input) return;


    if (userData.myPromoCode && input === userData.myPromoCode) {
        setPromoError(t.promoErrorSelf);
        return;
    }


    setIsValidating(true);


    // Simulate API verification delay
    await new Promise(resolve => setTimeout(resolve, 1500));


    // Mock database of valid codes (in a real app, this would be a server request)
    const MOCK_VALID_CODES = ['RAMADAN', 'BEREKE', 'QAZAQSTAN', 'ALMATY', 'ASTANA', 'UMMA', 'SUNNAH', 'TEST'];
    const isValid = MOCK_VALID_CODES.includes(input);


    setIsValidating(false);


    if (isValid) {
        const newXp = userData.xp + XP_VALUES.referral;
        setUserData({
            ...userData,
            xp: newXp,
            hasRedeemedReferral: true
        });
        setPromoSuccess(t.promoSuccess);
        setPromoInput('');
    } else {
        setPromoError(t.promoErrorNotFound);
    }
  };


  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };


  const StatCard = ({ icon, label, value, colorClass }: any) => (
    <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-2">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl ${colorClass}`}>
        {icon}
      </div>
      <div className="text-center">
        <span className="block text-xl font-black text-slate-800 leading-none mb-1">{value}</span>
        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-tight">{label}</span>
      </div>
    </div>
  );


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
                 <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">
                    {levelName}
                 </span>
                 <span className="text-xs font-bold text-slate-400">LVL {level}</span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                 {t.joinDate}: {new Date(userData.registrationDate || userData.startDate).toLocaleDateString()}
              </p>
           </div>
        </div>
        
        {/* User Badges Strip - РАСШИРЕННАЯ ВЕРСИЯ */}
        <div className="mt-6 pt-4 border-t border-slate-50">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-2">{language === 'kk' ? 'Жетістіктеріңіз' : 'Ваши достижения'}</h4>
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


      {/* Statistics Grid */}
      <div>
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 px-2">{t.statsTitle}</h3>
        <div className="grid grid-cols-2 gap-3">
           <StatCard icon="🌙" label={t.statsFasts} value={stats.totalFasts} colorClass="bg-indigo-50 text-indigo-600" />
           <StatCard icon="📖" label={t.statsQuran} value={stats.totalQuran} colorClass="bg-emerald-50 text-emerald-600" />
           <StatCard icon="🤲" label={t.statsPrayers} value={stats.totalPrayers} colorClass="bg-amber-50 text-amber-600" />
           <StatCard icon="💎" label={t.statsCharity} value={stats.totalCharity.toLocaleString()} colorClass="bg-rose-50 text-rose-600" />
        </div>
      </div>


      {/* Referral System (Moved from Rewards) */}
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
