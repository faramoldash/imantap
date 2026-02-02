
import React from 'react';
import { UserData, Language } from '../src/types/types';
import { TRANSLATIONS, BADGES } from '../constants';

interface RewardsViewProps {
  userData: UserData;
  language: Language;
  setUserData?: (data: UserData) => void;
}

const RewardsView: React.FC<RewardsViewProps> = ({ userData, language }) => {
  const t = TRANSLATIONS[language];
  const level = Math.floor(userData.xp / 1000) + 1;
  const levelName = t[`level${Math.min(level, 5)}`];

  // Dynamic Leaderboard using Real User Data
  const mockLeaderboard = [
    { name: "Ахмет", xp: 12450, isMe: false },
    { name: "Мәдина", xp: 10200, isMe: false },
    { name: "Әли", xp: 8900, isMe: false },
    // Use actual user data here
    { name: userData.name || (language === 'kk' ? "Сіз" : "Вы"), xp: userData.xp, isMe: true },
    { name: "Сара", xp: 7500, isMe: false },
    { name: "Омар", xp: 6800, isMe: false },
  ].sort((a, b) => b.xp - a.xp);

  return (
    <div className="space-y-8 pb-24 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Spiritual Status */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
          <span className="text-9xl">🏆</span>
        </div>
        <div className="relative z-10">
          <p className="text-emerald-400 font-black tracking-widest text-[10px] uppercase mb-2">{t.rewardsLevelName}</p>
          <h2 className="text-3xl font-black mb-6">{levelName}</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase">
              <span className="text-slate-400">{t.rewardsXP}</span>
              <span className="text-emerald-400">{userData.xp} XP</span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${(userData.xp % 1000) / 10}%` }}></div>
            </div>
            <p className="text-[9px] text-slate-400 italic">Келесі деңгейге: {1000 - (userData.xp % 1000)} XP қалды</p>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 px-2">{t.rewardsBadges}</h3>
        <div className="grid grid-cols-3 gap-4">
          {BADGES.map((badge) => {
            const isUnlocked = userData.unlockedBadges.includes(badge.id);
            return (
              <div key={badge.id} className="flex flex-col items-center group">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl transition-all duration-500 ${
                  isUnlocked ? 'bg-amber-50 shadow-lg shadow-amber-100 grayscale-0 scale-100' : 'bg-slate-50 grayscale scale-90 opacity-40'
                }`}>
                  {badge.icon}
                </div>
                <p className={`text-[9px] font-black text-center mt-3 uppercase tracking-tighter leading-tight ${
                  isUnlocked ? 'text-slate-800' : 'text-slate-300'
                }`}>
                  {language === 'kk' ? badge.name_kk : badge.name_ru}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 pb-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{t.rewardsLeaderboard}</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {mockLeaderboard.map((user, idx) => (
            <div key={idx} className={`flex items-center justify-between px-8 py-4 transition-colors ${
              user.isMe ? 'bg-emerald-50' : 'bg-white'
            }`}>
              <div className="flex items-center space-x-4">
                <span className={`w-6 text-xs font-black ${
                  idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-slate-300'
                }`}>{idx + 1}.</span>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black ${
                  user.isMe ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className={`text-sm font-black ${user.isMe ? 'text-emerald-900' : 'text-slate-700'}`}>
                    {user.name} {user.isMe && <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md ml-1">СІЗ</span>}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold">{user.xp} XP</p>
                </div>
              </div>
              {idx < 3 && <span className="text-xl">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
              </span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RewardsView;
