
import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { UserData, ViewType, DayProgress, Language, CustomTask } from './types';
import { TOTAL_DAYS, INITIAL_DAY_PROGRESS, TRANSLATIONS, XP_VALUES, RAMADAN_START_DATE, DEFAULT_GOALS, BADGES } from './constants';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import QuranTracker from './components/QuranTracker';
import Navigation from './components/Navigation';
import NamesMemorizer from './components/NamesMemorizer';
import TasksList from './components/TasksList';
import RewardsView from './components/RewardsView';
import ProfileView from './components/ProfileView';
import Paywall from './components/Paywall';

const STORAGE_KEY = 'ramadan_tracker_data_v3';

const App: React.FC = () => {
  // --- Payment / Auth State ---
  const [isCheckingPayment, setIsCheckingPayment] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...parsed,
        xp: parsed.xp || 0,
        referralCount: parsed.referralCount || 0,
        unlockedBadges: parsed.unlockedBadges || [],
        dailyQuranGoal: parsed.dailyQuranGoal || 5,
        dailyCharityGoal: parsed.dailyCharityGoal || 1000,
        hasRedeemedReferral: parsed.hasRedeemedReferral || false,
        myPromoCode: parsed.myPromoCode || undefined,
        username: parsed.username || undefined,
        photoUrl: parsed.photoUrl || undefined
      };
    }
    
    const initialLang: Language = 'kk';
    const templates: CustomTask[] = DEFAULT_GOALS[initialLang].map((text, idx) => ({
        id: `template-${idx}-${Date.now()}`,
        text,
        completed: false
    }));

    return {
      name: 'Брат/Сестра',
      startDate: RAMADAN_START_DATE,
      progress: {},
      memorizedNames: [],
      completedJuzs: [],
      completedTasks: [],
      deletedPredefinedTasks: [],
      customTasks: templates,
      quranGoal: 30, 
      dailyQuranGoal: 5,
      dailyCharityGoal: 1000,
      language: initialLang,
      xp: 0,
      referralCount: 0,
      unlockedBadges: [],
      hasRedeemedReferral: false,
    };
  });

  const [newBadge, setNewBadge] = useState<typeof BADGES[0] | null>(null);

  // --- Payment Verification Logic ---
  useEffect(() => {
    const verifyPayment = async () => {
      // 1. Get Telegram User ID
      const tg = (window as any).Telegram?.WebApp;
      const user = tg?.initDataUnsafe?.user;
      
      // FOR DEVELOPMENT ONLY:
      // If no telegram user (browser testing), allow access. 
      // Change to 'false' to test Paywall in browser.
      if (!user) {
        setTimeout(() => {
            setHasAccess(true); 
            setIsCheckingPayment(false);
        }, 1000);
        return;
      }

      try {
        // 2. REAL IMPLEMENTATION:
        // Replace this with your actual Backend API call.
        // const response = await fetch(`https://your-backend.com/api/check-payment?userId=${user.id}`);
        // const data = await response.json();
        // setHasAccess(data.isPaid);

        // 3. MOCK IMPLEMENTATION (Simulated):
        // For now, we simulate a network request that grants access.
        // In a real scenario, this defaults to FALSE until the server confirms payment.
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Logic: You can temporarily hardcode `true` here to develop, 
        // but in production, this relies on the backend.
        setHasAccess(true); 

      } catch (error) {
        console.error("Payment check failed", error);
        setHasAccess(false); // Default to block on error
      } finally {
        setIsCheckingPayment(false);
      }
    };

    verifyPayment();
  }, []);


  // --- Sync with Telegram Data ---
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        const fullName = `${user.first_name} ${user.last_name || ''}`.trim();
        const username = user.username ? `@${user.username}` : undefined;
        const photoUrl = user.photo_url;

        let newLang = userData.language;
        if (user.language_code) {
             if (user.language_code === 'ru' || user.language_code === 'kz' || user.language_code === 'kk') {
                 newLang = user.language_code === 'ru' ? 'ru' : 'kk';
             }
        }

        if (userData.name !== fullName || userData.username !== username || userData.photoUrl !== photoUrl) {
            setUserData(prev => ({
                ...prev,
                name: fullName,
                username: username,
                photoUrl: photoUrl,
                language: prev.name === 'Брат/Сестра' ? newLang : prev.language 
            }));
        }
    }
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  }, [userData]);

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
  if (isCheckingPayment) {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 space-y-4">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-emerald-500 font-bold animate-pulse text-sm tracking-widest uppercase">
                {userData.language === 'kk' ? 'Деректерді тексеру...' : 'Проверка доступа...'}
            </p>
        </div>
    );
  }

  // --- RENDER PAYWALL IF NOT PAID ---
  if (!hasAccess) {
    return <Paywall language={userData.language} />;
  }

  // --- RENDER MAIN APP ---
  return (
    <div className="min-h-screen pb-32 max-w-md mx-auto relative overflow-x-hidden bg-slate-50">
      
      {newBadge && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-24 pointer-events-none">
          <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex items-center space-x-4 animate-in slide-in-from-bottom-10 fade-in duration-500 w-full max-w-sm border border-slate-700 pointer-events-auto">
            <div className="text-4xl animate-bounce">{newBadge.icon}</div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">ЖАҢА ЖЕТІСТІК!</p>
              <h4 className="font-bold text-lg leading-tight">
                {userData.language === 'kk' ? newBadge.name_kk : newBadge.name_ru}
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
