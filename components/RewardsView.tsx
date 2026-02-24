import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserData, Language } from '../src/types/types';
import { TRANSLATIONS } from '../constants';
import { getGlobalLeaderboard, getFriendsLeaderboard, getCountries, getCities } from '../src/services/api';
import { translateName } from '../src/utils/translations';
import { getUserLevelInfo } from '../src/utils/levelHelper';
import { getUserCircles } from '../src/services/api';
import { useUserCircles } from '../src/hooks/useUserCircles';

interface RewardsViewProps {
  userData: UserData;
  language: Language;
  setUserData?: (data: UserData) => void;
  onNavigate?: (view: string, data?: any) => void;
}

type FilterType = 'global' | 'country' | 'city' | 'friends';

const XP_GUIDE_NAMAZ = [
  { emoji: '🌅', nameKk: 'Бамдат', nameRu: 'Фаджр', xp: 50 },
  { emoji: '☀️', nameKk: 'Дұха', nameRu: 'Духа', xp: 30 },
  { emoji: '🌤️', nameKk: 'Бесін', nameRu: 'Зухр', xp: 50 },
  { emoji: '🌇', nameKk: 'Екінді', nameRu: 'Аср', xp: 50 },
  { emoji: '🌆', nameKk: 'Ақшам', nameRu: 'Магриб', xp: 50 },
  { emoji: '🌙', nameKk: 'Құптан', nameRu: 'Иша', xp: 50 },
  { emoji: '🌟', nameKk: 'Тәравих', nameRu: 'Таравих', xp: 100 },
  { emoji: '✨', nameKk: 'Тәхажжуд', nameRu: 'Тахаджуд', xp: 100 },
  { emoji: '🤲', nameKk: 'Витр', nameRu: 'Витр', xp: 50 },
];

const XP_GUIDE_IBADAH = [
  { emoji: '🌙', nameKk: 'Ораза', nameRu: 'Пост', xp: 200 },
  { emoji: '📖', nameKk: 'Құран оқу', nameRu: 'Чтение Корана', xp: 100 },
  { emoji: '📄', nameKk: 'Бір пара', nameRu: 'Одна пара', xp: 150 },
  { emoji: '🌅', nameKk: 'Таңғы зікір', nameRu: 'Утр. зикр', xp: 30 },
  { emoji: '🌌', nameKk: 'Кешкі зікір', nameRu: 'Веч. зикр', xp: 30 },
  { emoji: '💫', nameKk: 'Салауат', nameRu: 'Салауат', xp: 20 },
  { emoji: '📜', nameKk: 'Хадис', nameRu: 'Хадис', xp: 50 },
  { emoji: '💝', nameKk: 'Садақа', nameRu: 'Садака', xp: 100 },
  { emoji: '🕋', nameKk: '99 есімдер', nameRu: '99 имён', xp: 50 },
  { emoji: '📚', nameKk: 'Дарыс', nameRu: 'Урок', xp: 50 },
  { emoji: '📕', nameKk: 'Кітап', nameRu: 'Книга', xp: 50 },
];

const XP_GUIDE_BONUS = [
  { emoji: '📿', nameKk: 'Аллах есімін жаттау', nameRu: 'Имя Аллаха выучено', xp: 100 },
  { emoji: '🎉', nameKk: 'Алғашқы Құран хатымы', nameRu: 'Первый хатым Корана', xp: 1000 },
  { emoji: '👥', nameKk: 'Дос шақыру', nameRu: 'Пригласить друга', xp: 100 },
  { emoji: '💎', nameKk: 'Досың төлемі', nameRu: 'Оплата друг', xp: 400 },
];

const XpSection = ({
  titleKk, titleRu, items, language,
}: {
  titleKk: string; titleRu: string;
  items: { emoji: string; nameKk: string; nameRu: string; xp: number }[];
  language: Language;
}) => (
  <div>
    <div className="px-6 pt-4 pb-2">
      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
        {language === 'kk' ? titleKk : titleRu}
      </p>
      <div className="mt-2 h-px bg-white/10" />
    </div>
    {items.map(item => (
      <div key={item.nameKk} className="flex items-center justify-between px-6 py-[9px]">
        <span className="text-[12px] text-white/80">{item.emoji} {language === 'kk' ? item.nameKk : item.nameRu}</span>
        <span className="text-[12px] font-black text-emerald-400">+{item.xp} XP</span>
      </div>
    ))}
  </div>
);

const RewardsView: React.FC<RewardsViewProps> = ({ userData, language, onNavigate }) => {
  const t = TRANSLATIONS[language];
  const levelInfo = getUserLevelInfo(userData.xp, language);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('global');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [cities, setCities] = useState<Array<{ city: string; count: number }>>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [xpGuideOpen, setXpGuideOpen] = useState(false);
  const { circles: userCircles, isLoadingCircles } = useUserCircles(userData.userId);

  const leaderboardRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const loadLeaderboard = useCallback(async (reset = false) => {
    try {
      if (reset) { setIsLoading(true); setOffset(0); setLeaderboard([]); }
      else setIsLoadingMore(true);
      const currentOffset = reset ? 0 : offset;
      if (filterType === 'friends') {
        const data = await getFriendsLeaderboard(userData.userId, 20);
        if (data) {
          const withMe = data.map((u: any, i: number) => ({ ...u, isMe: u.userId === userData.userId, rank: i + 1 }));
          const pos = withMe.findIndex((u: any) => u.isMe);
          if (pos !== -1) { setUserRank(pos + 1); setTotalUsers(withMe.length); }
          setLeaderboard(withMe); setHasMore(false);
        }
      } else {
        const result = await getGlobalLeaderboard({ limit: 20, offset: currentOffset, country: filterType === 'country' || filterType === 'city' ? 'Kazakhstan' : null, city: filterType === 'city' ? selectedCity : null });
        if (result?.data) {
          const withMe = result.data.map((u: any, i: number) => ({ ...u, isMe: u.userId === userData.userId, rank: currentOffset + i + 1 }));
          if (result.userRank !== undefined) setUserRank(result.userRank);
          else { const pos = withMe.findIndex((u: any) => u.isMe); if (pos !== -1) setUserRank(currentOffset + pos + 1); }
          if (result.total !== undefined) setTotalUsers(result.total);
          reset ? setLeaderboard(withMe) : setLeaderboard(p => [...p, ...withMe]);
          setHasMore(result.hasMore ?? false); setOffset(currentOffset + 20);
        }
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); setIsLoadingMore(false); setIsPulling(false); setPullDistance(0); }
  }, [filterType, selectedCity, userData.userId, offset]);

  useEffect(() => {
    if (filterType === 'city') getCities('Kazakhstan').then(setCities);
    else { setCities([]); setSelectedCity(null); }
  }, [filterType]);
  useEffect(() => { loadLeaderboard(true); }, [filterType, selectedCity]);
  useEffect(() => {
    autoRefreshInterval.current = setInterval(() => loadLeaderboard(true), 30000);
    return () => { if (autoRefreshInterval.current) clearInterval(autoRefreshInterval.current); };
  }, [loadLeaderboard]);

  const handleTouchStart = (e: React.TouchEvent) => { if (leaderboardRef.current?.scrollTop === 0) touchStartY.current = e.touches[0].clientY; };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current && leaderboardRef.current?.scrollTop === 0) {
      const d = e.touches[0].clientY - touchStartY.current;
      if (d > 0 && d < 150) { setIsPulling(true); setPullDistance(d); }
    }
  };
  const handleTouchEnd = () => { pullDistance > 80 ? loadLeaderboard(true) : (setIsPulling(false), setPullDistance(0)); touchStartY.current = 0; };
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 50 && hasMore && !isLoadingMore && filterType !== 'friends') loadLeaderboard(false);
  };
  const handleFilterChange = (type: FilterType) => { setFilterType(type); setOffset(0); setUserRank(null); if (type !== 'city') setSelectedCity(null); };
  const handleCreateCircle = () => onNavigate?.('circles', { from: 'rewards', action: 'create' });
  const handleJoinByCode = () => onNavigate?.('circles', { from: 'rewards', action: 'join' });
  const handleViewAllCircles = () => onNavigate?.('circles', { from: 'rewards' });

  return (
    <div className="space-y-6 pb-8 pt-4">

      {/* Дәрежеңіз */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><span className="text-9xl">{levelInfo.icon}</span></div>
        <div className="relative z-10">
          <p className="text-emerald-400 font-black tracking-widest text-[10px] uppercase mb-2">{language === 'kk' ? 'ДӘРЕЖЕҢІЗ' : 'ВАШ УРОВЕНЬ'}</p>
          <div className="flex items-center space-x-3 mb-2"><span className="text-4xl">{levelInfo.icon}</span><h2 className="text-3xl font-black">{levelInfo.name}</h2></div>
          <p className="text-emerald-300 text-sm font-bold mb-6">{language === 'kk' ? 'Деңгей' : 'Уровень'} {levelInfo.level}</p>
          {userRank !== null && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">🏆</span>
                  <div>
                    <p className="text-[9px] font-black text-emerald-300 uppercase tracking-wider">{language === 'kk' ? 'Сіздің орныңыз' : 'Ваше место'}</p>
                    <p className="text-2xl font-black text-white">{userRank}{totalUsers > 0 && <span className="text-sm font-medium text-slate-300 ml-2">/ {totalUsers}</span>}</p>
                  </div>
                </div>
                {userRank <= 3 && <span className="text-4xl animate-bounce">{userRank === 1 ? '🥇' : userRank === 2 ? '🥈' : '🥉'}</span>}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase">
              <span className="text-slate-400">XP</span>
              <span className="text-emerald-400">{userData.xp.toLocaleString()} XP</span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500" style={{ width: `${levelInfo.progressPercent}%` }}></div>
            </div>
            {levelInfo.hasNextLevel
              ? <p className="text-[9px] text-slate-400 italic">{language === 'kk' ? `Келесі деңгейге: ${levelInfo.xpToNextLevel.toLocaleString()} XP қалды` : `До следующего уровня: ${levelInfo.xpToNextLevel.toLocaleString()} XP`}</p>
              : <p className="text-[9px] text-emerald-400 italic font-bold">{language === 'kk' ? '🎉 Максималды деңгей!' : '🎉 Максимальный уровень!'}</p>
            }
          </div>
        </div>
      </div>

      {/* Круги */}
      <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-[2.5rem] p-6 shadow-xl overflow-hidden">
        <div className="absolute -right-8 -bottom-8 text-[140px] opacity-5 pointer-events-none">🤝</div>
        <div className="relative z-10 mb-6">
          <h3 className="text-white font-black uppercase tracking-widest text-[10px] mb-1">{language === 'kk' ? 'МЕНІҢ ТОПТАРЫМ' : 'МОИ КРУГИ'}</h3>
          <p className="text-white/40 text-[10px]">{language === 'kk' ? 'Достармен бірге прогресс' : 'Прогресс вместе с друзьями'}</p>
        </div>
        {isLoadingCircles ? (
          <div className="text-center py-8"><div className="inline-block w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : userCircles.length > 0 ? (
          <div className="relative z-10 space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10"><div className="text-3xl font-black bg-gradient-to-br from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-1">{userCircles.length}</div><div className="text-[9px] font-bold text-white/90">{language === 'kk' ? 'барлық топ' : 'всего кругов'}</div></div>
              <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10"><div className="text-3xl font-black bg-gradient-to-br from-orange-400 to-red-400 bg-clip-text text-transparent mb-1">{userCircles.filter((c: any) => c.members?.find((m: any) => m.userId === userData.userId)?.status === 'active').length}</div><div className="text-[9px] font-bold text-white/90">{language === 'kk' ? 'белсенді топ' : 'активных'}</div></div>
              <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10"><div className="text-3xl font-black bg-gradient-to-br from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">{(() => { if (!userCircles.length) return 0; const p = userCircles.map((c: any) => { const ms = c.members?.filter((m: any) => m.status === 'active') || []; if (!ms.length) return 0; const avg = ms.reduce((s: number, m: any) => s + (m.xp || 0), 0) / ms.length; const max = Math.max(...ms.map((m: any) => m.xp || 0), 1); return max > 0 ? Math.round((avg / max) * 100) : 0; }); return Math.round(p.reduce((s: number, x: number) => s + x, 0) / p.length); })()}%</div><div className="text-[9px] font-bold text-white/90">{language === 'kk' ? 'орташа прогресс' : 'средний прогресс'}</div></div>
            </div>
            <button onClick={handleViewAllCircles} className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-black uppercase tracking-wider active:scale-[0.98] flex items-center justify-center space-x-2 border border-emerald-400/30">
              <span>{language === 'kk' ? 'Ашу' : 'Открыть'}</span><span className="text-lg">→</span>
            </button>
          </div>
        ) : (
          <div className="relative z-10 text-center py-8">
            <span className="text-7xl opacity-80 block mb-4">🌟</span>
            <h4 className="text-lg font-black text-white mb-2">{language === 'kk' ? 'Әлі топтар жоқ' : 'Пока нет кругов'}</h4>
            <p className="text-xs text-white/40 mb-6 max-w-[220px] mx-auto leading-relaxed">{language === 'kk' ? 'Досыңызбен бірге жарысыңыз!' : 'Соревнуйтесь с друзьями!'}</p>
            <div className="space-y-3">
              <button onClick={handleCreateCircle} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-black uppercase tracking-wider active:scale-[0.98] border border-emerald-400/30">{language === 'kk' ? '+ Жаңа топ құру' : '+ Создать круг'}</button>
              <button onClick={handleJoinByCode} className="w-full py-3.5 rounded-2xl bg-white/10 text-white/90 text-sm font-black uppercase tracking-wider active:scale-[0.98] border border-white/20">{language === 'kk' ? '📥 Кодпен қосылу' : '📥 Присоединиться по коду'}</button>
            </div>
          </div>
        )}
      </div>

      {/* Лидерборд */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        {isPulling && (
          <div className="absolute top-0 left-0 right-0 z-50 flex justify-center pt-2" style={{ transform: `translateY(${Math.min(pullDistance - 40, 40)}px)` }}>
            <div className="bg-white rounded-full p-2 shadow-lg">
              <svg className={`w-5 h-5 text-emerald-600 ${pullDistance > 80 ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        )}
        <div className="p-6 pb-4 sticky top-0 bg-white z-10 border-b border-slate-50">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">{t.rewardsLeaderboard}</h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {(['global','country','city','friends'] as FilterType[]).map(type => (
              <button key={type} onClick={() => handleFilterChange(type)} className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${ filterType === type ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600' }`}>
                {type === 'global' && `🌍 ${language === 'kk' ? 'Жалпы' : 'Глобальный'}`}
                {type === 'country' && `🇰🇿 ${language === 'kk' ? 'Ел бойынша' : 'По стране'}`}
                {type === 'city' && `🏙️ ${language === 'kk' ? 'Қала бойынша' : 'По городу'}`}
                {type === 'friends' && `👥 ${language === 'kk' ? 'Достар' : 'Друзья'}`}
              </button>
            ))}
          </div>
          {filterType === 'city' && (
            <div className="mt-3">
              <select value={selectedCity || ''} onChange={e => setSelectedCity(e.target.value || null)} className="w-full px-4 py-3 rounded-xl text-sm font-bold bg-slate-50 border-2 border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">{language === 'kk' ? '🌍 Барлық қалалар' : '🌍 Все города'}</option>
                {cities.map(c => <option key={c.city} value={c.city}>{c.city} ({c.count.toLocaleString()} {language === 'kk' ? 'адам' : 'чел.'})</option>)}
              </select>
            </div>
          )}
        </div>
        <div ref={leaderboardRef} className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto" onScroll={handleScroll} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          {isLoading ? (
            <div className="px-8 py-12 text-center"><div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div></div>
          ) : leaderboard.length === 0 ? (
            <div className="px-8 py-12 text-center"><span className="text-6xl mb-4 block">🏆</span><p className="text-slate-400 text-sm">{language === 'kk' ? 'Деректер жоқ' : 'Нет данных'}</p></div>
          ) : (
            <>
              {leaderboard.map((user, idx) => (
                <div key={user.userId || idx} className={`flex items-center justify-between px-6 py-4 animate-in fade-in slide-in-from-right-4 ${ user.isMe ? 'bg-emerald-50' : 'bg-white hover:bg-slate-50' }`} style={{ animationDelay: `${idx * 30}ms`, animationDuration: '400ms' }}>
                  <div className="flex items-center space-x-4">
                    <span className={`w-6 text-xs font-black ${ user.rank === 1 ? 'text-amber-500 text-xl' : user.rank === 2 ? 'text-slate-400 text-lg' : user.rank === 3 ? 'text-amber-700 text-lg' : 'text-slate-300' }`}>{user.rank}.</span>
                    <div className={`w-10 h-10 rounded-2xl overflow-hidden flex-shrink-0 ${ user.isMe ? 'ring-2 ring-emerald-500 scale-110' : '' }`}>
                      {(() => { const p = user.isMe ? (userData.photoUrl || user.photoUrl) : user.photoUrl; return p ? <img src={p} alt={user.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.removeAttribute('style'); }} /> : null; })()}
                      <div className={`w-full h-full flex items-center justify-center text-sm font-black ${ user.isMe ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600' }`} style={(() => { const p = user.isMe ? (userData.photoUrl || user.photoUrl) : user.photoUrl; return p ? { display: 'none' } : {}; })()}>{(user.name || user.username || 'U').charAt(0).toUpperCase()}</div>
                    </div>
                    <div>
                      <p className={`text-sm font-black ${ user.isMe ? 'text-emerald-900' : 'text-slate-700' }`}>{user.name || user.username || 'User'}{user.isMe && <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md ml-1 animate-pulse">{language === 'kk' ? 'СІЗ' : 'ВЫ'}</span>}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-slate-400 font-bold">{user.xp} XP</p>
                        {user.location?.city && <span className="text-[9px] text-slate-300">📍 {translateName(user.location.city, language, 'city')}</span>}
                      </div>
                    </div>
                  </div>
                  {user.rank <= 3 && <span className="text-2xl animate-bounce" style={{ animationDelay: `${(user.rank - 1) * 100}ms` }}>{user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}</span>}
                </div>
              ))}
              {isLoadingMore && <div className="px-8 py-4 text-center"><div className="inline-block w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div></div>}
              {!hasMore && !isLoadingMore && filterType !== 'friends' && <div className="px-8 py-4 text-center"><p className="text-[10px] text-slate-400 italic">{language === 'kk' ? 'Барлық қатысушылар' : 'Все участники показаны'}</p></div>}
            </>
          )}
        </div>
      </div>

      {/* ⚡ XP ГАЙД — цвета карточки Дәрежеңіз */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] shadow-2xl overflow-hidden">

        {/* Шапка */}
        <button
          onClick={() => setXpGuideOpen(p => !p)}
          className="w-full flex items-center justify-between px-6 py-5 active:bg-white/5 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-lg">⚡</span>
            </div>
            <div className="text-left">
              <p className="font-black text-white text-sm">
                {language === 'kk' ? 'XP қалай жинауға болады?' : 'Как зарабатывать XP?'}
              </p>
              <p className="text-[11px] text-emerald-400 font-bold mt-0.5">
                {language === 'kk' ? 'Күнде 1730+ XP жинауға болады' : 'Можно заработать 1730+ XP в день'}
              </p>
            </div>
          </div>
          <div className={`w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${xpGuideOpen ? 'rotate-180' : ''}`}>
            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {xpGuideOpen && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">

            {/* 🔥 Стрик */}
            <div className="px-6 pb-4">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">🔥</span>
                  <div>
                    <p className="text-[12px] font-black text-white leading-none">
                      {language === 'kk' ? 'Стрик бонусы' : 'Бонус серии'}
                    </p>
                    <p className="text-[11px] text-white/50 mt-0.5">
                      {language === 'kk' ? 'Күн сайын белсенді болыңыз' : 'Будьте активны каждый день'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <div className="bg-white/10 rounded-xl px-3 py-2 text-center border border-white/10">
                    <p className="text-[12px] font-black text-white leading-none">×2.0</p>
                    <p className="text-[9px] text-white/50 mt-0.5">{language === 'kk' ? '10 күн' : '10 дней'}</p>
                  </div>
                  <div className="bg-emerald-500/20 rounded-xl px-3 py-2 text-center border border-emerald-500/30">
                    <p className="text-[12px] font-black text-emerald-400 leading-none">×3.0</p>
                    <p className="text-[9px] text-emerald-400/70 mt-0.5">{language === 'kk' ? '20+ күн' : '20+ дней'}</p>
                  </div>
                </div>
              </div>
            </div>

            <XpSection titleKk="Намаз" titleRu="Намаз" items={XP_GUIDE_NAMAZ} language={language} />
            <XpSection titleKk="Ибадат" titleRu="Ибадат" items={XP_GUIDE_IBADAH} language={language} />
            <XpSection titleKk="Бонустар" titleRu="Бонусы" items={XP_GUIDE_BONUS} language={language} />

            <div className="pb-5" />
          </div>
        )}
      </div>

      {/* Индикатор автообновления */}
      <div className="fixed bottom-32 right-4 bg-white rounded-full p-2 shadow-lg border border-slate-100 animate-pulse">
        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
    </div>
  );
};

export default RewardsView;
