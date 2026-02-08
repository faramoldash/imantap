import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserData, Language } from '../src/types/types';
import { TRANSLATIONS, BADGES } from '../constants';
import { getGlobalLeaderboard, getFriendsLeaderboard, getCountries, getCities } from '../src/services/api';

interface RewardsViewProps {
  userData: UserData;
  language: Language;
  setUserData?: (data: UserData) => void;
}

type FilterType = 'global' | 'country' | 'city' | 'friends';

const RewardsView: React.FC<RewardsViewProps> = ({ userData, language }) => {
  const t = TRANSLATIONS[language];
  const level = Math.floor(userData.xp / 1000) + 1;
  const levelName = t[`level${Math.min(level, 5)}`];
  
  // Состояния
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('global');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Загрузка лидерборда
  const loadLeaderboard = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setOffset(0);
        setLeaderboard([]);
      } else {
        setIsLoadingMore(true);
      }

      let data: any;
      const currentOffset = reset ? 0 : offset;

      if (filterType === 'friends') {
        data = await getFriendsLeaderboard(userData.userId, 20);
        if (data) {
          const withMe = data.map((user: any) => ({
            ...user,
            isMe: user.userId === userData.userId
          }));
          setLeaderboard(withMe);
          setHasMore(false);
        }
      } else {
        const result = await getGlobalLeaderboard({
          limit: 20,
          offset: currentOffset,
          country: filterType === 'country' || filterType === 'city' ? selectedCountry : null,
          city: filterType === 'city' ? selectedCity : null
        });

        if (result) {
          const withMe = result.leaderboard.map((user: any) => ({
            ...user,
            isMe: user.userId === userData.userId
          }));

          if (reset) {
            setLeaderboard(withMe);
          } else {
            setLeaderboard(prev => [...prev, ...withMe]);
          }

          setHasMore(result.pagination.hasMore);
          setOffset(currentOffset + 20);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки лидерборда:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsPulling(false);
      setPullDistance(0);
    }
  }, [filterType, selectedCountry, selectedCity, userData.userId, offset]);

  // Загрузка списков для фильтров
  useEffect(() => {
    const loadFilters = async () => {
      const countriesList = await getCountries();
      setCountries(countriesList);
    };
    loadFilters();
  }, []);

  // Загрузка городов при выборе страны
  useEffect(() => {
    if (selectedCountry) {
      const loadCities = async () => {
        const citiesList = await getCities(selectedCountry);
        setCities(citiesList);
      };
      loadCities();
    } else {
      setCities([]);
      setSelectedCity(null);
    }
  }, [selectedCountry]);

  // Первоначальная загрузка и при изменении фильтров
  useEffect(() => {
    loadLeaderboard(true);
  }, [filterType, selectedCountry, selectedCity]);

  // Автообновление каждые 30 секунд
  useEffect(() => {
    autoRefreshInterval.current = setInterval(() => {
      loadLeaderboard(true);
    }, 30000);

    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, [loadLeaderboard]);

  // Pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current && containerRef.current && containerRef.current.scrollTop === 0) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY.current;
      
      if (distance > 0 && distance < 150) {
        setIsPulling(true);
        setPullDistance(distance);
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 80) {
      loadLeaderboard(true);
    } else {
      setIsPulling(false);
      setPullDistance(0);
    }
    touchStartY.current = 0;
  };

  // Infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 50 && hasMore && !isLoadingMore && filterType !== 'friends') {
      loadLeaderboard(false);
    }
  };

  // Переключение фильтра
  const handleFilterChange = (type: FilterType) => {
    setFilterType(type);
    setOffset(0);
    if (type === 'global' || type === 'friends') {
      setSelectedCountry(null);
      setSelectedCity(null);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="space-y-8 pb-24 pt-4 h-screen overflow-y-auto"
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {isPulling && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4" style={{ transform: `translateY(${Math.min(pullDistance - 40, 40)}px)` }}>
          <div className="bg-white rounded-full p-3 shadow-lg">
            <svg className={`w-6 h-6 text-emerald-600 ${pullDistance > 80 ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>
      )}

      {/* Spiritual Status */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(userData.xp % 1000) / 10}%` }}></div>
            </div>
            <p className="text-[9px] text-slate-400 italic">Келесі деңгейге: {1000 - (userData.xp % 1000)} XP қалды</p>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 px-2">{t.rewardsBadges}</h3>
        <div className="grid grid-cols-3 gap-4">
          {BADGES.map((badge, idx) => {
            const isUnlocked = userData.unlockedBadges.includes(badge.id);
            return (
              <div 
                key={badge.id} 
                className="flex flex-col items-center group animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${idx * 50}ms`, animationDuration: '500ms' }}
              >
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
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="p-8 pb-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">{t.rewardsLeaderboard}</h3>
          
          {/* Фильтры */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
            <button
              onClick={() => handleFilterChange('global')}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                filterType === 'global' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              🌍 {language === 'kk' ? 'Жалпы' : 'Глобальный'}
            </button>
            <button
              onClick={() => handleFilterChange('country')}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                filterType === 'country' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              🇰🇿 {language === 'kk' ? 'Ел бойынша' : 'По стране'}
            </button>
            <button
              onClick={() => handleFilterChange('city')}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                filterType === 'city' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              🏙️ {language === 'kk' ? 'Қала бойынша' : 'По городу'}
            </button>
            <button
              onClick={() => handleFilterChange('friends')}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                filterType === 'friends' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              👥 {language === 'kk' ? 'Достар' : 'Друзья'}
            </button>
          </div>

          {/* Селекторы для страны и города */}
          {(filterType === 'country' || filterType === 'city') && (
            <div className="space-y-2 mb-4">
              <select
                value={selectedCountry || ''}
                onChange={(e) => setSelectedCountry(e.target.value || null)}
                className="w-full px-4 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200"
              >
                <option value="">{language === 'kk' ? 'Елді таңдаңыз' : 'Выберите страну'}</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>

              {filterType === 'city' && selectedCountry && (
                <select
                  value={selectedCity || ''}
                  onChange={(e) => setSelectedCity(e.target.value || null)}
                  className="w-full px-4 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200"
                >
                  <option value="">{language === 'kk' ? 'Қаланы таңдаңыз' : 'Выберите город'}</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Список лидерборда */}
        <div className="divide-y divide-slate-50">
          {isLoading ? (
            <div className="px-8 py-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm mt-4">{language === 'kk' ? 'Жүктелуде...' : 'Загрузка...'}</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <span className="text-6xl mb-4 block">🏆</span>
              <p className="text-slate-400 text-sm">{language === 'kk' ? 'Деректер жоқ' : 'Нет данных'}</p>
            </div>
          ) : (
            <>
              {leaderboard.map((user, idx) => (
                <div 
                  key={user.userId || idx} 
                  className={`flex items-center justify-between px-8 py-4 transition-all duration-300 animate-in fade-in slide-in-from-right-4 ${
                    user.isMe ? 'bg-emerald-50' : 'bg-white hover:bg-slate-50'
                  }`}
                  style={{ animationDelay: `${idx * 30}ms`, animationDuration: '400ms' }}
                >
                  <div className="flex items-center space-x-4">
                    <span className={`w-6 text-xs font-black transition-all ${
                      idx === 0 ? 'text-amber-500 text-xl' : idx === 1 ? 'text-slate-400 text-lg' : idx === 2 ? 'text-amber-700 text-lg' : 'text-slate-300'
                    }`}>{idx + 1}.</span>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all ${
                      user.isMe ? 'bg-emerald-600 text-white scale-110' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={`text-sm font-black ${user.isMe ? 'text-emerald-900' : 'text-slate-700'}`}>
                        {user.name || user.username || 'User'} 
                        {user.isMe && (
                          <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md ml-1 animate-pulse">
                            {language === 'kk' ? 'СІЗ' : 'ВЫ'}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-slate-400 font-bold">{user.xp} XP</p>
                        {user.location?.city && (
                          <span className="text-[9px] text-slate-300">📍 {user.location.city}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {idx < 3 && (
                    <span className="text-2xl animate-bounce" style={{ animationDelay: `${idx * 100}ms` }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </span>
                  )}
                </div>
              ))}

              {/* Индикатор загрузки при пагинации */}
              {isLoadingMore && (
                <div className="px-8 py-4 text-center">
                  <div className="inline-block w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* Сообщение об окончании списка */}
              {!hasMore && !isLoadingMore && filterType !== 'friends' && (
                <div className="px-8 py-4 text-center">
                  <p className="text-[10px] text-slate-400 italic">
                    {language === 'kk' ? 'Барлық қатысушылар' : 'Все участники показаны'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
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
