
import React, { useState, useMemo, useEffect } from 'react';
import { UserData, Language, DayProgress } from '../types';
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

  const generatePromoCode = () => {
    useEffect(() => {
      if (!userData.myPromoCode) return;

      const BOT_API_URL = "https://imantap-bot-production.up.railway.app";

      const loadReferralCount = async () => {
        try {
          const res = await fetch(
            `${BOT_API_URL}/referrals?code=${encodeURIComponent(userData.myPromoCode)}`
          );
          if (!res.ok) return;

          const data = await res.json();
          const invitedCount = data.invitedCount ?? 0;

          // Функциональное обновление, чтобы не затереть другие поля
          setUserData((prev) => ({
            ...prev,
            referralCount: invitedCount,
          }));
        } catch (e) {
          console.error("Failed to load referral count", e);
        }
      };

      loadReferralCount();
      // Зависимость ТОЛЬКО от промокода и setUserData, чтобы не вызвать цикл
    }, [userData.myPromoCode, setUserData]);
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const inviteFriend = () => {
    // 1. Берём/создаём промокод
    let code = userData.myPromoCode;

    if (!code) {
      code = generatePromoCode();
      setUserData({
        ...userData,
        myPromoCode: code
      });
    }

    // 2. Username бота без @
    const BOT_USERNAME = "imantap_bot";

    // 3. Реферальная ссылка, которой поделимся
    const botLink = `https://t.me/${BOT_USERNAME}?start=ref_${code}`;

    // 4. Текст для друга
    const text =
      language === "kk"
        ? `🌙 Рамазан айына бірге дайындалайық! Менің промокодымды «${code}» қолданып, +100 XP бонус ал!\n\nБотқа өту: ${botLink}`
        : `🌙 Давай готовиться к Рамадану вместе! Используй мой промокод «${code}» и получи +100 XP бонус!\n\nПерейти к боту: ${botLink}`;

    // 5. Формируем share-url
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
      botLink
    )}&text=${encodeURIComponent(text)}`;

    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, "_blank");
    }
    // НОВОЕ: принудительно обновляем счётчик после шаринга
    setTimeout(async () => {
      try {
        const BOT_API_URL = "https://imantap-bot-production.up.railway.app";
        const res = await fetch(
          `${BOT_API_URL}/referrals?code=${encodeURIComponent(code)}`
        );
        if (res.ok) {
          const data = await res.json();
          setUserData((prev) => ({
            ...prev,
            referralCount: data.invitedCount ?? 0,
          }));
        }
      } catch (e) {
        console.error("Failed to refresh referral count", e);
      }
    }, 2000); // через 2 секунды после шаринга
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
    <div className="space-y-6 pb-24 pt-4 animate-in fade-in slide-in-from-right duration-500">
      
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
        
        {/* User Badges Strip */}
        <div className="mt-6 pt-4 border-t border-slate-50 overflow-x-auto no-scrollbar">
           <div className="flex space-x-2">
             {userData.unlockedBadges && userData.unlockedBadges.length > 0 ? (
               userData.unlockedBadges.map(badgeId => {
                 const badge = BADGES.find(b => b.id === badgeId);
                 if(!badge) return null;
                 return (
                   <div key={badgeId} className="flex-shrink-0 bg-slate-50 p-2 rounded-2xl border border-slate-100" title={language === 'kk' ? badge.name_kk : badge.name_ru}>
                     <span className="text-xl grayscale-0">{badge.icon}</span>
                   </div>
                 )
               })
             ) : (
               <p className="text-[10px] text-slate-400 italic w-full text-center py-1">Әзірге жетістіктер жоқ...</p>
             )}
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

      {/* Redeem Promo Code */}
      <div className={`p-8 rounded-[3rem] border transition-all ${userData.hasRedeemedReferral ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 shadow-sm'}`}>
        <h3 className="text-lg font-black uppercase mb-1 text-slate-800">{t.promoInputTitle}</h3>
        
        {userData.hasRedeemedReferral ? (
            <div className="flex items-center space-x-2 mt-4 text-emerald-600">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">✓</div>
                <p className="font-bold text-xs">{t.promoActivated}</p>
            </div>
        ) : (
            <>
                <p className="text-xs text-slate-400 mb-4">{t.promoInputDesc}</p>
                <div className="flex space-x-2">
                    <input 
                        type="text" 
                        value={promoInput}
                        onChange={(e) => {
                            setPromoInput(e.target.value);
                            setPromoError('');
                        }}
                        disabled={isValidating}
                        onFocus={handleInputFocus}
                        placeholder={t.promoInputPlaceholder}
                        maxLength={10}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-black uppercase outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                    />
                    <button 
                        onClick={redeemPromoCode}
                        disabled={!promoInput || isValidating}
                        className="bg-slate-900 text-white px-4 rounded-2xl font-black text-xs disabled:opacity-50 transition-all active:scale-95"
                    >
                        {isValidating ? t.promoBtnChecking : t.promoBtnRedeem}
                    </button>
                </div>
                {promoError && <p className="text-[10px] font-bold text-red-500 mt-2 ml-1">{promoError}</p>}
                {promoSuccess && <p className="text-[10px] font-bold text-emerald-500 mt-2 ml-1 animate-pulse">{promoSuccess}</p>}
            </>
        )}
      </div>

    </div>
  );
};

export default ProfileView;
