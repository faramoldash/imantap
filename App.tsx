
import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { UserData, ViewType, DayProgress, Language, CustomTask } from './types';
import { TOTAL_DAYS, INITIAL_DAY_PROGRESS, TRANSLATIONS, XP_VALUES, RAMADAN_START_DATE, DEFAULT_GOALS, BADGES } from './constants';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import QuranTracker from './components/QuranTracker';
import Navigation from './components/Navigation';
import NamesMemorizer from './components/NamesMemorizer';
import SyncIndicator, { SyncStatus } from './components/SyncIndicator';
import { syncQueue } from './src/utils/syncQueue';
import TasksList from './components/TasksList';
import RewardsView from './components/RewardsView';
import ProfileView from './components/ProfileView';
import Paywall from './components/Paywall';
import PendingScreen from './components/PendingScreen';
import DemoBanner from './components/DemoBanner';
import { checkUserAccess, AccessData } from './utils/api';


type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

type AppProps = {
  telegramUser: TelegramUser | null;
};

interface BackendUserData {
  userId: string;
  promoCode: string;
  invitedCount: number;
  username?: string;
}

const STORAGE_KEY = 'ramadan_tracker_data_v3';

const App: React.FC<AppProps> = ({ telegramUser }) => {
  // --- Payment / Auth State ---
  const [isCheckingPayment, setIsCheckingPayment] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessData, setAccessData] = useState<AccessData | null>(null);
  const [backendUserData, setBackendUserData] = useState<BackendUserData | null>(null);

  // Default user data structure
  const getDefaultUserData = (): UserData => {
    const forcedLang: Language = 'kk';
    const templates: CustomTask[] = DEFAULT_GOALS[forcedLang].map((text, idx) => ({
      id: `template-${idx}-${Date.now()}`,
      text,
      completed: false
    }));

    return {
      name: 'Брат/Сестра',
      startDate: RAMADAN_START_DATE,
      registrationDate: new Date().toISOString(),
      progress: {},
      memorizedNames: [],
      completedJuzs: [],
      quranKhatams: 0,
      completedTasks: [],
      deletedPredefinedTasks: [],
      customTasks: templates,
      quranGoal: 30,
      dailyQuranGoal: 5,
      dailyCharityGoal: 1000,
      language: forcedLang,
      xp: 0,
      referralCount: 0,
      unlockedBadges: [],
      hasRedeemedReferral: false,
    };
  };

  const [userData, setUserData] = useState<UserData>(getDefaultUserData());
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [newBadge, setNewBadge] = useState<typeof BADGES[0] | null>(null);

  // --- Payment Verification Logic ---
  useEffect(() => {
    const verifyPayment = async () => {
      // Ждём инициализации Telegram WebApp
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const tg = (window as any).Telegram?.WebApp;
      
      // 🔍 ДЕТАЛЬНАЯ ОТЛАДКА
      console.log('=== TELEGRAM WEBAPP DEBUG ===');
      console.log('🔍 window.Telegram существует?', !!(window as any).Telegram);
      console.log('🔍 WebApp существует?', !!tg);
      console.log('🔍 initDataUnsafe:', tg?.initDataUnsafe);
      console.log('🔍 user:', tg?.initDataUnsafe?.user);
      console.log('🔍 user.id:', tg?.initDataUnsafe?.user?.id);
      console.log('=============================');
      
      const user = tg?.initDataUnsafe?.user;
      const userId = user?.id;
      
      console.log('🔍 Extracted userId:', userId);
      
      // ❌ ЕСЛИ НЕТ USER ID - ОШИБКА!
      if (!userId) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Telegram user ID не найден!');
        console.error('❌ Это может быть из-за:');
        console.error('   1. Mini App открыт не из Telegram');
        console.error('   2. telegram-web-app.js не загрузился');
        console.error('   3. Telegram не передал данные пользователя');
        
        // Показываем Paywall
        setIsCheckingPayment(false);
        setHasAccess(false);
        setAccessData({
          hasAccess: false,
          paymentStatus: 'unpaid',
          reason: 'no_telegram_user'
        });
        return;
      }
      
      try {
        console.log('🔍 Проверка доступа для user ID:', userId);
        const access = await checkUserAccess(userId);
        
        console.log('✅ Результат проверки:', access);
        setAccessData(access);
        setHasAccess(access.hasAccess);
      } catch (error) {
        console.error("❌ Payment check failed", error);
        setHasAccess(false);
        setAccessData({
          hasAccess: false,
          paymentStatus: 'unpaid',
          reason: 'error'
        });
      } finally {
        setIsCheckingPayment(false);
      }
    };

    verifyPayment();
  }, []);

  // Load user data from MongoDB and merge with localStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        const tg = (window as any).Telegram?.WebApp;
        const user = tg?.initDataUnsafe?.user;

        // 1. Загружаем данные из localStorage (для быстрого старта)
        const savedData = localStorage.getItem(STORAGE_KEY);
        let localData: UserData | null = null;
        
        if (savedData) {
          try {
            localData = JSON.parse(savedData);
            setUserData(localData); // Показываем локальные данные сразу
          } catch (err) {
            console.error('❌ Ошибка парсинга localStorage:', err);
          }
        }

        // 2. Загружаем данные с сервера (если есть Telegram user)
        if (user?.id) {
          console.log('🔍 Загрузка данных с сервера для user ID:', user.id);

          const response = await fetch(
            `https://imantap-bot-production.up.railway.app/api/user/${user.id}/full`
          );

          if (response.ok) {
            const result = await response.json();
            
            if (result.success && result.data) {
              const serverData = result.data;
              console.log('✅ Данные загружены с сервера:', serverData);

              // 3. Мерджим данные: приоритет у сервера
              const mergedData: UserData = {
                ...(localData || getDefaultUserData()),
                ...serverData,
                // Telegram данные всегда берём из Telegram WebApp
                name: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : serverData.name || 'User',
                username: user.username ? `@${user.username}` : serverData.username,
                photoUrl: user.photo_url || serverData.photoUrl,
                // Промокод и рефералы всегда с сервера
                myPromoCode: serverData.myPromoCode,
                referralCount: serverData.referralCount,
                // Язык всегда казахский
                language: 'kk'
              };

              console.log('✅ Данные объединены:', mergedData);
              setUserData(mergedData);
              
              // Сохраняем в localStorage для кэша
              localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedData));
            }
          } else {
            console.log('⚠️ Используем локальные данные (сервер недоступен)');
          }
        } else {
          console.log('⚠️ Telegram user не найден, используем локальные данные');
        }

      } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);


  const calculateRamadanStatus = useCallback(() => {
    const start = new Date(userData.startDate);
    const now = new Date();
    
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = currentDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const isStarted = diffDays >= 1;
    const currentDay = isStarted ? Math.min(diffDays, TOTAL_DAYS) : 1;
    
    const daysUntil = !isStarted ? Math.ceil((startDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return { isStarted, currentDay, daysUntil };
  }, [userData.startDate]);

  const [ramadanInfo, setRamadanInfo] = useState(calculateRamadanStatus());
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedDay, setSelectedDay] = useState<number>(ramadanInfo.currentDay);
  const [realTodayDay, setRealTodayDay] = useState<number>(ramadanInfo.isStarted ? ramadanInfo.currentDay : 0);

  // --- Scroll Persistence Logic ---
  const [scrollPositions, setScrollPositions] = useState<Record<string, number>>({});

  const handleViewChange = useCallback((newView: ViewType) => {
    const currentScroll = window.scrollY;
    setScrollPositions(prev => ({
      ...prev,
      [currentView]: currentScroll
    }));
    setCurrentView(newView);
  }, [currentView]);

  useLayoutEffect(() => {
    const savedPosition = scrollPositions[currentView] || 0;
    window.scrollTo({ top: savedPosition, behavior: 'auto' });
  }, [currentView, scrollPositions]);

  const t = TRANSLATIONS[userData.language];

  useEffect(() => {
    const interval = setInterval(() => {
      const status = calculateRamadanStatus();
      setRamadanInfo(status);
      setRealTodayDay(status.isStarted ? status.currentDay : 0);
    }, 60000);
    return () => clearInterval(interval);
  }, [calculateRamadanStatus]);

  // Save to localStorage AND sync to server whenever userData changes
  // Debounce hook
  const useDebounce = (callback: Function, delay: number) => {
    const timeoutRef = useRef<NodeJS.Timeout>();
    
    return useCallback((...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }, [callback, delay]);
  };

  // Функция синхронизации с сервером
  const syncToServerFn = useCallback(async () => {
    const tg = (window as any).Telegram?.WebApp;
    const userId = tg?.initDataUnsafe?.user?.id;

    if (!userId) {
      setSyncStatus('offline');
      return false;
    }

    // Проверяем онлайн статус
    if (!navigator.onLine) {
      setSyncStatus('offline');
      console.log('📴 Offline - adding to queue');
      
      // Добавляем в очередь
      syncQueue.add({
        userId,
        name: userData.name,
        photoUrl: userData.photoUrl,
        startDate: userData.startDate,
        registrationDate: userData.registrationDate,
        progress: userData.progress,
        memorizedNames: userData.memorizedNames,
        completedJuzs: userData.completedJuzs,
        quranKhatams: userData.quranKhatams,
        completedTasks: userData.completedTasks,
        deletedPredefinedTasks: userData.deletedPredefinedTasks,
        customTasks: userData.customTasks,
        quranGoal: userData.quranGoal,
        dailyQuranGoal: userData.dailyQuranGoal,
        dailyCharityGoal: userData.dailyCharityGoal,
        language: userData.language,
        xp: userData.xp,
        hasRedeemedReferral: userData.hasRedeemedReferral,
        unlockedBadges: userData.unlockedBadges
      });
      
      return false;
    }

    try {
      setSyncStatus('syncing');
      
      const response = await fetch(
        `https://imantap-bot-production.up.railway.app/api/user/${userId}/sync`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: userData.name,
            photoUrl: userData.photoUrl,
            startDate: userData.startDate,
            registrationDate: userData.registrationDate,
            progress: userData.progress,
            memorizedNames: userData.memorizedNames,
            completedJuzs: userData.completedJuzs,
            quranKhatams: userData.quranKhatams,
            completedTasks: userData.completedTasks,
            deletedPredefinedTasks: userData.deletedPredefinedTasks,
            customTasks: userData.customTasks,
            quranGoal: userData.quranGoal,
            dailyQuranGoal: userData.dailyQuranGoal,
            dailyCharityGoal: userData.dailyCharityGoal,
            language: userData.language,
            xp: userData.xp,
            hasRedeemedReferral: userData.hasRedeemedReferral,
            unlockedBadges: userData.unlockedBadges
          }),
        }
      );

      if (response.ok) {
        console.log('✅ Synced to server');
        setSyncStatus('success');
        return true;
      } else {
        console.error('❌ Sync failed:', response.status);
        setSyncStatus('error');
        return false;
      }
    } catch (error) {
      console.error('❌ Sync error:', error);
      setSyncStatus('error');
      return false;
    }
  }, [userData, setSyncStatus]);

  // Debounced sync (5 секунд вместо немедленной синхронизации)
  const debouncedSync = useDebounce(syncToServerFn, 5000);

  // Save to localStorage AND sync to server whenever userData changes
  useEffect(() => {
    if (!isLoading) {
      // Сохраняем в localStorage немедленно
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      
      // Синхронизируем с задержкой
      debouncedSync();
    }
  }, [userData, isLoading, debouncedSync]);

  // Online/Offline listeners
  useEffect(() => {
    const handleOnline = async () => {
      console.log('🌐 Back online! Processing queue...');
      
      const processed = await syncQueue.processQueue(async (data) => {
        try {
          const response = await fetch(
            `https://imantap-bot-production.up.railway.app/api/user/${data.userId}/sync`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            }
          );
          return response.ok;
        } catch {
          return false;
        }
      });
      
      if (processed > 0) {
        setSyncStatus('success');
      }
    };
    
    const handleOffline = () => {
      console.log('📴 Gone offline');
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setSyncStatus]);

  // Функция для повторной попытки синхронизации
  const retrySync = useCallback(() => {
    setSyncStatus('idle');
    // Триггерим повторное сохранение через изменение userData
    setUserData(prev => ({ ...prev }));
  }, []);

  // --- GAMIFICATION LOGIC ---
  const checkBadges = (data: UserData) => {
    const earnedBadges = [...data.unlockedBadges];
    let newlyUnlockedId: string | null = null;
    const unlock = (id: string) => {
      if (!earnedBadges.includes(id)) {
        earnedBadges.push(id);
        newlyUnlockedId = id;
      }
    };

    const hasFasted = Object.values(data.progress).some(p => p.fasting);
    if (hasFasted) unlock('first_fast');
    if (data.completedJuzs.length >= 1) unlock('quran_master');
    const totalCharity = Object.values(data.progress).reduce((sum, p) => sum + (p.charityAmount || 0), 0);
    if (totalCharity >= 10000) unlock('charity_king');
    const totalTaraweeh = Object.values(data.progress).filter(p => p.taraweeh).length;
    if (totalTaraweeh >= 5) unlock('taraweeh_star');
    if (data.memorizedNames.length >= 10) unlock('names_scholar');
    if (data.xp >= 4000) unlock('ramadan_hero');
    
    // New Badges Logic
    if (data.quranKhatams > 0) unlock('khatam_master');
    
    const completedCustomTasks = (data.customTasks || []).filter(t => t.completed).length;
    if (completedCustomTasks >= 5) unlock('goal_achiever');
    
    if (data.referralCount >= 10) unlock('community_builder');

    if (newlyUnlockedId) {
      const badgeInfo = BADGES.find(b => b.id === newlyUnlockedId);
      if (badgeInfo) {
        setNewBadge(badgeInfo);
        setTimeout(() => setNewBadge(null), 4000); 
      }
      return earnedBadges;
    }
    return null;
  };

  const updateProgress = useCallback((day: number, updates: Partial<DayProgress>) => {
    setUserData(prev => {
      const existing = prev.progress[day] || INITIAL_DAY_PROGRESS(day);
      let xpDelta = 0;
      Object.keys(updates).forEach((key) => {
        const k = key as keyof DayProgress;
        const newVal = updates[k];
        const oldVal = existing[k];
        if (newVal !== oldVal) {
          if (typeof newVal === 'boolean' && XP_VALUES[k]) {
             xpDelta += newVal ? XP_VALUES[k] : -XP_VALUES[k];
          }
        }
      });

      const nextProgress = {
        ...prev.progress,
        [day]: { ...existing, ...updates }
      };

      const newState = {
        ...prev,
        xp: Math.max(0, prev.xp + xpDelta),
        progress: nextProgress
      };
      const newBadges = checkBadges(newState);
      if (newBadges) newState.unlockedBadges = newBadges;
      return newState;
    });
  }, []);

  const handleUserDataUpdate = (newData: UserData) => {
    const newBadges = checkBadges(newData);
    if (newBadges) newData.unlockedBadges = newBadges;
    setUserData(newData);
  };

  const renderView = () => {
    const dayData = userData.progress[selectedDay] || INITIAL_DAY_PROGRESS(selectedDay);
    switch (currentView) {
      case 'dashboard':
        return <Dashboard day={selectedDay} realTodayDay={realTodayDay} ramadanInfo={ramadanInfo} data={dayData} allProgress={userData.progress} updateProgress={updateProgress} language={userData.language} onDaySelect={(d) => setSelectedDay(d)} xp={userData.xp} userData={userData} setUserData={handleUserDataUpdate} setView={handleViewChange} />;
      case 'calendar':
        return <Calendar progress={userData.progress} realTodayDay={realTodayDay} selectedDay={selectedDay} language={userData.language} onSelectDay={(d) => { setSelectedDay(d); handleViewChange('dashboard'); }} />;
      case 'quran':
        return <QuranTracker userData={userData} setUserData={handleUserDataUpdate} language={userData.language} />;
      case 'tasks':
        return <TasksList language={userData.language} userData={userData} setUserData={handleUserDataUpdate} />;
      case 'profile':
        return <ProfileView userData={userData} language={userData.language} setUserData={handleUserDataUpdate} />;
      case 'names-99':
        return <NamesMemorizer language={userData.language} userData={userData} setUserData={handleUserDataUpdate} />;
      case 'rewards':
        return <RewardsView userData={userData} language={userData.language} setUserData={handleUserDataUpdate} />;
      default:
        return null;
    }
  };

  // --- RENDER LOADING STATE ---
  if (isCheckingPayment || isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-emerald-500 font-bold animate-pulse text-sm tracking-widest uppercase">
          {userData.language === 'kk' ? 'Деректерді тексеру...' : 'Деректерді тексеру...'}
        </p>
      </div>
    );
  }

  // --- RENDER PENDING SCREEN (Ожидание проверки) ---
  if (!hasAccess && accessData?.paymentStatus === 'pending') {
    return <PendingScreen language={userData.language} />;
  }

  // --- RENDER PAYWALL IF NOT PAID ---
  if (!hasAccess) {
    return <Paywall language={userData.language} />;
  }

  // --- CHECK IF DEMO MODE ---
  const showDemoBanner = accessData?.paymentStatus === 'demo' && accessData.demoExpires;

  // --- RENDER MAIN APP ---
  return (
    <div className={`min-h-screen pb-32 max-w-md mx-auto relative overflow-x-hidden bg-slate-50 ${showDemoBanner ? 'pt-16' : ''}`}>
      {/* Demo Banner (если демо-режим) */}
      {showDemoBanner && (
        <DemoBanner 
          demoExpires={accessData.demoExpires!} 
          language={userData.language} 
        />
      )}

      {/* Индикатор синхронизации */}
      <SyncIndicator status={syncStatus} onRetry={retrySync} />
      {telegramUser && (
        <div className="text-center text-sm text-slate-500 mt-4 space-y-1">
          <div>Ассаляму алейкум, {telegramUser.first_name}</div>
          {backendUserData && (
            <div className="text-xs">
              📋 Промокод: <strong>{backendUserData.promoCode}</strong> | 
              👥 Рефералдар: <strong>{backendUserData.invitedCount}</strong>
            </div>
          )}
        </div>
      )}
      {newBadge && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-24 pointer-events-none">
          <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex items-center space-x-4 animate-in slide-in-from-bottom-10 fade-in duration-500 w-full max-w-sm border border-slate-700 pointer-events-auto">
            <div className="text-4xl animate-bounce">{newBadge.icon}</div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">ЖАҢА ЖЕТІСТІК!</p>
              <h4 className="font-bold text-lg leading-tight">
                {newBadge.name_kk}
              </h4>
            </div>
            <button onClick={() => setNewBadge(null)} className="text-slate-500">✕</button>
          </div>
        </div>
      )}

      <header className="pt-16 px-6 pb-12 text-center bg-gradient-to-b from-emerald-900 to-emerald-800 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
           <span className="text-9xl">🌙</span>
        </div>
        
        <div className="flex justify-center mb-4 relative z-10">
            <div 
              onClick={() => handleViewChange('rewards')}
              className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 flex items-center space-x-2 cursor-pointer active:scale-95 transition-transform"
            >
                <span className="text-xl">🏆</span>
                <span className="text-white font-black text-sm">{userData.xp} XP</span>
            </div>
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight leading-tight uppercase relative z-10 whitespace-pre-line px-4">
            {ramadanInfo.isStarted ? t.ramadanStartedTitle : t.preRamadanTitle}
        </h1>
        
        {currentView !== 'dashboard' && (
            <button 
                onClick={() => handleViewChange('dashboard')}
                className="absolute top-6 right-6 bg-white/10 backdrop-blur-lg p-3 rounded-2xl border border-white/10 active:scale-90 transition-transform shadow-lg z-30"
            >
                🏠
            </button>
        )}
      </header>

      <main className="px-6 -mt-8 relative z-20">
        {renderView()}
      </main>

      <Navigation currentView={currentView} setView={handleViewChange} language={userData.language} />
    </div>
  );
};

export default App;