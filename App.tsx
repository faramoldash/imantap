import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { UserData, ViewType, DayProgress, Language, CustomTask, GoalCategoryId, DailyGoalRecord, CustomGoalItem } from './src/types/types';
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
import PreparationTracker from './components/PreparationTracker';
import BasicTracker from './components/BasicTracker';
import { initTelegramApp, getTelegramUserId, getTelegramWebApp } from './src/utils/telegram';
import { useAppInitialization } from './src/hooks/useAppInitialization';
import CirclesView from './components/CirclesView';
import { getUserCircles } from './src/services/api';
import { PREPARATION_START_DATE } from './constants';


interface BackendUserData {
  userId: string;
  promoCode: string;
  invitedCount: number;
  username?: string;
}

const STORAGE_KEY = 'ramadan_tracker_data_v4';

const App: React.FC = () => {
  // Инициализация Telegram WebApp
  useEffect(() => {
    initTelegramApp();
  }, []);

  // Default user data structure
  const getDefaultUserData = useCallback((): UserData => {
    const forcedLang: Language = 'kk';
    const templates: CustomTask[] = DEFAULT_GOALS[forcedLang].map((text, idx) => ({
      id: `template-${idx}-${Date.now()}`,
      text,
      completed: false
    }));

    return {
      name: 'Мырза/Ханым',
      startDate: RAMADAN_START_DATE,
      registrationDate: new Date().toISOString(),
      progress: {},
      preparationProgress: {},
      basicProgress: {},
      memorizedNames: [],
      completedJuzs: [],
      earnedJuzXpIds: [],
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
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
      subscriptionExpiresAt: null,
      daysLeft: null,
      // ✅ НОВЫЕ ПОЛЯ — Мақсаттар v2
      dailyGoalRecords: {},
      goalCustomItems: {} as Record<GoalCategoryId, CustomGoalItem[]>,
      goalStreaks: {} as Record<GoalCategoryId, number>,
    };
  }, []);

  // Используем хук для инициализации
  const { 
    isLoading, 
    hasAccess, 
    accessData: rawAccessData,
    userData: initialUserData, 
    error 
  } = useAppInitialization(getDefaultUserData);

  // ✅ Мемоизация accessData
  const accessData = useMemo(() => ({
    hasAccess: rawAccessData?.hasAccess ?? false,
    paymentStatus: rawAccessData?.paymentStatus,
    demoExpires: rawAccessData?.demoExpires,
    reason: rawAccessData?.reason,
  }), [
    rawAccessData?.hasAccess,
    rawAccessData?.paymentStatus,
    rawAccessData?.demoExpires,
    rawAccessData?.reason
  ]);

  const [userData, setUserData] = useState<UserData>(getDefaultUserData());

  const userDataRef = useRef(userData);
  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  // Обновляем userData когда загрузка завершена
  useEffect(() => {
    if (initialUserData) {
      const correctedData: UserData = {
        ...initialUserData,
        earnedJuzXpIds: initialUserData.earnedJuzXpIds || [],
        startDate: RAMADAN_START_DATE,
        progress: initialUserData.progress || {},
        preparationProgress: initialUserData.preparationProgress || {},
        basicProgress: initialUserData.basicProgress || {},
        currentStreak: initialUserData.currentStreak ?? 0,
        longestStreak: initialUserData.longestStreak ?? 0,
        lastActiveDate: initialUserData.lastActiveDate || '',
        subscriptionExpiresAt: initialUserData.subscriptionExpiresAt || null,
        daysLeft: initialUserData.daysLeft || null,
        // ✅ НОВЫЕ — защита от undefined если пришло старое значение с бэкенда
        dailyGoalRecords: initialUserData.dailyGoalRecords || {},
        goalCustomItems: (initialUserData.goalCustomItems || {}) as Record<GoalCategoryId, CustomGoalItem[]>,
        goalStreaks: (initialUserData.goalStreaks || {}) as Record<GoalCategoryId, number>,
      };
      
      console.log('📥 Инициализация userData из сервера:', {
        progressDays: Object.keys(correctedData.progress).length,
        preparationDays: Object.keys(correctedData.preparationProgress).length,
        basicDays: Object.keys(correctedData.basicProgress).length,
        currentStreak: correctedData.currentStreak,
        lastActiveDate: correctedData.lastActiveDate,
        subscriptionExpiresAt: correctedData.subscriptionExpiresAt,
        daysLeft: correctedData.daysLeft,
        dailyGoalRecordDays: Object.keys(correctedData.dailyGoalRecords || {}).length,
      });
      
      setUserData(correctedData);
    }
  }, [initialUserData]);

  // Загрузка кругов пользователя
  useEffect(() => {
    const loadUserCircles = async () => {
      const userId = getTelegramUserId();
      if (!userId) return;
      
      try {
        const circles = await getUserCircles(userId);
        setUserCircles(circles || []);
        console.log('🤝 Загружено кругов:', circles?.length || 0);
      } catch (error) {
        console.error('❌ Ошибка загрузки кругов:', error);
        setUserCircles([]);
      }
    };
    
    loadUserCircles();
  }, []);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [newBadge, setNewBadge] = useState<typeof BADGES[0] | null>(null);

  const calculateRamadanStatus = useCallback(() => {
    const [sy, sm, sd] = userData.startDate.split('-').map(Number);
    const startDate = new Date(sy, sm - 1, sd);
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = currentDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const isStarted = diffDays >= 0;
    const currentDay = isStarted ? diffDays + 1 : 0;
    const daysUntil = !isStarted ? -diffDays : 0;
    return { isStarted, currentDay, daysUntil };
  }, [userData.startDate]);

  const ramadanInfo = useMemo(() => {
    const result = calculateRamadanStatus();
    console.log('📅 RAMADAN INFO CALCULATED:', result);
    return result;
  }, [calculateRamadanStatus]);

  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [navigationData, setNavigationData] = useState<any>(null);
  const hasInitializedDay = useRef(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [realTodayDay, setRealTodayDay] = useState<number>(ramadanInfo.isStarted ? ramadanInfo.currentDay : 0);
  const [selectedBasicDate, setSelectedBasicDate] = useState<Date | null>(null);
  const [selectedPreparationDay, setSelectedPreparationDay] = useState<number | null>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [userCircles, setUserCircles] = useState<any[]>([]);

  const handleNavigation = useCallback((view: ViewType, data?: any) => {
    setCurrentView(view);
    setNavigationData(data);
  }, []);

  const scrollMemory = useRef<Record<string, number>>({});

  useEffect(() => {
    return () => {
      scrollMemory.current[currentView] = document.body.scrollTop;
    };
  }, [currentView]);

  useEffect(() => {
    if (selectedBasicDate || selectedPreparationDay) {
      document.body.scrollTop = 0;
      return;
    }
    const savedPos = scrollMemory.current[currentView] ?? 0;
    document.body.scrollTop = savedPos;
    console.log('📍', currentView, '→', savedPos);
  }, [currentView, selectedBasicDate, selectedPreparationDay]);

  const t = TRANSLATIONS[userData.language];

  useEffect(() => {
    const getAlmatyDay = () => {
      const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: userTZ });
      const prepStart = new Date(PREPARATION_START_DATE + 'T00:00:00');
      const todayDate = new Date(todayStr + 'T00:00:00');
      const daysSincePrep = Math.floor((todayDate.getTime() - prepStart.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(1, daysSincePrep + 1);
    };

    const calculatedDay = getAlmatyDay();
    setRealTodayDay(ramadanInfo.isStarted ? ramadanInfo.currentDay : 0);

    if (!hasInitializedDay.current) {
      setSelectedDay(calculatedDay);
      hasInitializedDay.current = true;
    }

    const interval = setInterval(() => {
      setRealTodayDay(ramadanInfo.isStarted ? ramadanInfo.currentDay : 0);
      const newDay = getAlmatyDay();
      setSelectedDay(prev => prev === newDay - 1 ? newDay : prev);
    }, 60000);

    return () => clearInterval(interval);
  }, [ramadanInfo.isStarted]);

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg) return;
    let lastHeight = tg.viewportHeight;
    const checkKeyboard = () => {
      const currentHeight = tg.viewportHeight;
      if (lastHeight - currentHeight > 100) {
        setIsKeyboardOpen(true);
        setTimeout(() => {
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      } else if (currentHeight - lastHeight > 100) {
        setIsKeyboardOpen(false);
      }
      lastHeight = currentHeight;
    };
    const interval = setInterval(checkKeyboard, 100);
    return () => clearInterval(interval);
  }, []);

  const useDebounce = (callback: Function, delay: number) => {
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    return useCallback((...args: any[]) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => { callback(...args); }, delay);
    }, [callback, delay]);
  };

  // ─── Функция синхронизации (включая новые поля) ───
  const syncToServerFn = useCallback(async () => {
    const userId = getTelegramUserId();
    if (!userId) { setSyncStatus('offline'); return false; }
    const d = userDataRef.current;

    // Общее тело запроса — вынесено чтобы не uдублировать
    const buildPayload = (data: UserData) => ({
      name: data.name,
      username: data.username,
      photoUrl: data.photoUrl,
      registrationDate: data.registrationDate,
      progress: data.progress,
      preparationProgress: data.preparationProgress,
      basicProgress: data.basicProgress,
      memorizedNames: data.memorizedNames,
      completedJuzs: data.completedJuzs,
      earnedJuzXpIds: data.earnedJuzXpIds || [],
      quranKhatams: data.quranKhatams,
      completedTasks: data.completedTasks,
      deletedPredefinedTasks: data.deletedPredefinedTasks,
      customTasks: data.customTasks,
      quranGoal: data.quranGoal,
      dailyQuranGoal: data.dailyQuranGoal,
      dailyCharityGoal: data.dailyCharityGoal,
      language: data.language,
      xp: data.xp,
      hasRedeemedReferral: data.hasRedeemedReferral,
      unlockedBadges: data.unlockedBadges,
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
      lastActiveDate: data.lastActiveDate,
      // ✅ НОВЫЕ ПОЛЯ
      dailyGoalRecords: data.dailyGoalRecords || {},
      goalCustomItems: data.goalCustomItems || {},
      goalStreaks: data.goalStreaks || {},
    });

    if (!navigator.onLine) {
      setSyncStatus('offline');
      syncQueue.add({ userId, ...buildPayload(d) });
      return false;
    }

    try {
      setSyncStatus('syncing');
      const response = await fetch(
        `https://imantap-bot-production.up.railway.app/api/user/${userId}/sync`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload(d)),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Synced to server', { xpAdded: data.xpAdded, streakMultiplier: data.streakMultiplier });

        if (data.success && data.data) {
          const validatedData: UserData = {
            ...data.data,
            lastActiveDate: data.data.lastActiveDate || '',
            subscriptionExpiresAt: data.data.subscriptionExpiresAt || null,
            registrationDate: data.data.registrationDate || new Date().toISOString(),
            startDate: data.data.startDate || RAMADAN_START_DATE,
            // ✅ Защита полей v2 при ответе сервера
            dailyGoalRecords: data.data.dailyGoalRecords || {},
            goalCustomItems: (data.data.goalCustomItems || {}) as Record<GoalCategoryId, CustomGoalItem[]>,
            goalStreaks: (data.data.goalStreaks || {}) as Record<GoalCategoryId, number>,
          };
          setUserData(validatedData);
        }

        if (data.xpAdded && data.xpAdded > 0) {
          if ((window as any).showXPNotification) {
            (window as any).showXPNotification(data.xpAdded, data.streakMultiplier || 1.0);
          }
        }

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
  }, [setSyncStatus]);

  const debouncedSync = useDebounce(syncToServerFn, 5000);

  useEffect(() => {
    if (!isLoading && userData.userId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      const hasData = userData.xp > 0 ||
        Object.keys(userData.progress).length > 0 ||
        Object.keys(userData.preparationProgress || {}).length > 0 ||
        (userData.memorizedNames || []).length > 0 ||
        Object.keys(userData.dailyGoalRecords || {}).length > 0; // ✅
      if (hasData) { debouncedSync(); }
    }
  }, [userData, isLoading, debouncedSync]);

  // ─── Сохранение при закрытии (с новыми полями) ───
  useEffect(() => {
    const handleBeforeUnload = () => {
      const userId = getTelegramUserId();
      if (!userId) return;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(userDataRef.current)); } catch {}

      const data = JSON.stringify({
        name: userDataRef.current.name,
        username: userDataRef.current.username,
        photoUrl: userDataRef.current.photoUrl,
        registrationDate: userDataRef.current.registrationDate,
        progress: userDataRef.current.progress,
        preparationProgress: userDataRef.current.preparationProgress,
        basicProgress: userDataRef.current.basicProgress,
        memorizedNames: userDataRef.current.memorizedNames,
        completedJuzs: userDataRef.current.completedJuzs,
        quranKhatams: userDataRef.current.quranKhatams,
        completedTasks: userDataRef.current.completedTasks,
        deletedPredefinedTasks: userDataRef.current.deletedPredefinedTasks,
        customTasks: userDataRef.current.customTasks,
        quranGoal: userDataRef.current.quranGoal,
        dailyQuranGoal: userDataRef.current.dailyQuranGoal,
        dailyCharityGoal: userDataRef.current.dailyCharityGoal,
        language: userDataRef.current.language,
        xp: userDataRef.current.xp,
        hasRedeemedReferral: userDataRef.current.hasRedeemedReferral,
        unlockedBadges: userDataRef.current.unlockedBadges,
        currentStreak: userDataRef.current.currentStreak,
        longestStreak: userDataRef.current.longestStreak,
        lastActiveDate: userDataRef.current.lastActiveDate,
        // ✅ НОВЫЕ ПОЛЯ
        dailyGoalRecords: userDataRef.current.dailyGoalRecords || {},
        goalCustomItems: userDataRef.current.goalCustomItems || {},
        goalStreaks: userDataRef.current.goalStreaks || {},
      });

      const url = `https://imantap-bot-production.up.railway.app/api/user/${userId}/sync`;
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([data], { type: 'application/json' }));
      } else {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data, keepalive: true }).catch(() => {});
      }
    };

    const tg = getTelegramWebApp();
    if (tg) tg.onEvent('viewportChanged', handleBeforeUnload);
    window.addEventListener('beforeunload', handleBeforeUnload);
    const handleVisibilityChange = () => { if (document.visibilityState === 'hidden') handleBeforeUnload(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (tg) tg.offEvent('viewportChanged', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      const userId = getTelegramUserId();
      if (!userId || !navigator.onLine) return;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(userDataRef.current)); } catch {}
      syncToServerFn().catch(() => {});
    }, 30000);
    return () => clearInterval(autoSaveInterval);
  }, [syncToServerFn]);

  useEffect(() => {
    const handleOnline = async () => {
      console.log('🌐 Back online! Processing queue...');
      const processed = await syncQueue.processQueue(async (data) => {
        try {
          const response = await fetch(`https://imantap-bot-production.up.railway.app/api/user/${data.userId}/sync`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
          });
          return response.ok;
        } catch { return false; }
      });
      if (processed > 0) setSyncStatus('success');
    };
    const handleOffline = () => { console.log('📤 Gone offline'); setSyncStatus('offline'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [setSyncStatus]);

  useEffect(() => {
    if (currentView !== 'dashboard') {
      if (selectedBasicDate) setSelectedBasicDate(null);
      if (selectedPreparationDay) setSelectedPreparationDay(null);
    }
  }, [currentView]);

  const retrySync = useCallback(() => {
    setSyncStatus('idle');
    setUserData(prev => ({ ...prev }));
  }, []);

  // --- GAMIFICATION LOGIC ---
  const checkBadges = (data: UserData) => {
    const earnedBadges = [...data.unlockedBadges];
    let newlyUnlockedId: string | null = null;
    const unlock = (id: string) => {
      if (!earnedBadges.includes(id)) { earnedBadges.push(id); newlyUnlockedId = id; }
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
    if (data.quranKhatams > 0) unlock('khatam_master');
    const completedCustomTasks = (data.customTasks || []).filter(t => t.completed).length;
    if (completedCustomTasks >= 5) unlock('goal_achiever');
    if (data.referralCount >= 10) unlock('community_builder');
    if (newlyUnlockedId) {
      const badgeInfo = BADGES.find(b => b.id === newlyUnlockedId);
      if (badgeInfo) { setNewBadge(badgeInfo); setTimeout(() => setNewBadge(null), 4000); }
      return earnedBadges;
    }
    return null;
  };

  // --- STREAK LOGIC ---
  const updateStreak = (data: UserData): UserData => {
    const userTimezone = (data as any).location?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Almaty';
    const today = new Date().toLocaleDateString('en-CA', { timeZone: userTimezone });
    const lastActive = data.lastActiveDate || '';
    if (lastActive === today) return data;
    const lastActiveDate = lastActive ? new Date(lastActive) : null;
    const todayDate = new Date(today);
    let newStreak = 0;
    if (!lastActiveDate) {
      newStreak = 1;
    } else {
      const diffDays = Math.floor((todayDate.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) newStreak = (data.currentStreak || 0) + 1;
      else if (diffDays > 1) newStreak = 1;
    }
    const newLongest = Math.max(newStreak, data.longestStreak || 0);
    return { ...data, currentStreak: newStreak, longestStreak: newLongest, lastActiveDate: today };
  };

  const EMPTY_DAY_PROGRESS = (dayOrDate: number | string): DayProgress => ({
    day: typeof dayOrDate === 'number' ? dayOrDate : 0,
    fasting: false, tahajjud: false, fajr: false, morningDhikr: false,
    quranRead: false, names99: false, salawat: false, hadith: false, duha: false,
    charity: false, charityAmount: 0, charitySadaqah: 0, charityZakat: 0, charityFitrana: 0,
    dhuhr: false, lessons: false, asr: false, book: false, eveningDhikr: false,
    maghrib: false, isha: false, taraweeh: false, witr: false, quranPages: 0,
    date: typeof dayOrDate === 'string' ? dayOrDate : new Date().toISOString(),
  });

  const updateProgress = useCallback((day: number, updates: Partial<DayProgress>) => {
    setUserData(prev => {
      const existing = prev.progress[day] || INITIAL_DAY_PROGRESS(day);
      let newState = { ...prev, progress: { ...prev.progress, [day]: { ...existing, ...updates } } };
      newState = updateStreak(newState);
      const newBadges = checkBadges(newState);
      if (newBadges) newState.unlockedBadges = newBadges;
      return newState;
    });
    setTimeout(() => { syncToServerFn(); }, 100);
  }, [syncToServerFn]);

  const updatePreparationProgress = useCallback((day: number, updates: Partial<DayProgress>) => {
    setUserData(prev => {
      const existing = prev.preparationProgress?.[day] || EMPTY_DAY_PROGRESS(day);
      let newState = { ...prev, preparationProgress: { ...prev.preparationProgress, [day]: { ...existing, ...updates } } };
      newState = updateStreak(newState);
      const newBadges = checkBadges(newState);
      if (newBadges) newState.unlockedBadges = newBadges;
      return newState;
    });
    setTimeout(() => { syncToServerFn(); }, 100);
  }, [syncToServerFn]);

  const updateBasicProgress = useCallback((dateStr: string, updates: Partial<DayProgress>) => {
    setUserData(prev => {
      const existing = prev.basicProgress?.[dateStr] || EMPTY_DAY_PROGRESS(dateStr);
      let newState = { ...prev, basicProgress: { ...prev.basicProgress, [dateStr]: { ...existing, ...updates } } };
      newState = updateStreak(newState);
      return newState;
    });
    setTimeout(() => { syncToServerFn(); }, 100);
  }, [syncToServerFn]);

  const handleUserDataUpdate = (newData: UserData) => {
    const newBadges = checkBadges(newData);
    if (newBadges) newData.unlockedBadges = newBadges;
    setUserData(newData);
  };

  const renderView = () => {
    const dayData = userData.progress[selectedDay] || INITIAL_DAY_PROGRESS(selectedDay);
    switch (currentView) {
      case 'dashboard':
        if (selectedBasicDate) {
          return (
            <BasicTracker date={selectedBasicDate} language={userData.language} userData={userData}
              onUpdate={updateBasicProgress} onBack={() => setSelectedBasicDate(null)} />
          );
        }
        if (selectedPreparationDay) {
          return (
            <PreparationTracker day={selectedPreparationDay} language={userData.language} userData={userData}
              onUpdate={updatePreparationProgress} onBack={() => setSelectedPreparationDay(null)} />
          );
        }
        return (
          <Dashboard day={selectedDay} realTodayDay={realTodayDay} ramadanInfo={ramadanInfo}
            data={dayData} allProgress={userData.progress} updateProgress={updateProgress}
            updatePreparationProgress={updatePreparationProgress} updateBasicProgress={updateBasicProgress}
            language={userData.language} onDaySelect={(d) => setSelectedDay(d)}
            onPreparationDaySelect={(d) => setSelectedPreparationDay(d)}
            onBasicDateSelect={(date) => setSelectedBasicDate(date)}
            xp={userData.xp} userData={userData} setUserData={handleUserDataUpdate} setView={setCurrentView} />
        );
      case 'calendar':
        return <Calendar progress={userData.progress} realTodayDay={realTodayDay} selectedDay={selectedDay}
          language={userData.language} onSelectDay={(d) => { setSelectedDay(d); setCurrentView('dashboard'); }} />;
      case 'quran':
        return <QuranTracker userData={userData} setUserData={handleUserDataUpdate} language={userData.language} />;
      case 'tasks':
        return <TasksList language={userData.language} userData={userData} setUserData={handleUserDataUpdate} />;
      case 'profile':
        return <ProfileView userData={userData} language={userData.language} setUserData={handleUserDataUpdate} onNavigate={handleNavigation} />;
      case 'names-99':
        return <NamesMemorizer language={userData.language} userData={userData} setUserData={handleUserDataUpdate} />;
      case 'rewards':
        return <RewardsView userData={userData} language={userData.language} setUserData={handleUserDataUpdate} onNavigate={handleNavigation} />;
      case 'circles':
        return <CirclesView userData={userData} language={userData.language} onNavigate={handleNavigation} navigationData={navigationData} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-emerald-800 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8 relative">
            <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-2xl">
              <span className="text-5xl animate-pulse">🌙</span>
            </div>
            <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-white/30 animate-ping"></div>
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">ImanTap</h1>
          <p className="text-sm font-bold text-white/70">{userData.language === 'kk' ? 'Жүктелуде...' : 'Загрузка...'}</p>
          <div className="flex justify-center space-x-2 mt-6">
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!accessData.hasAccess && accessData?.paymentStatus === 'pending') {
    return <PendingScreen language={userData.language} />;
  }

  if (!isLoading && accessData && !accessData.hasAccess) {
    return <Paywall language={userData.language} />;
  }

  const showDemoBanner = accessData?.paymentStatus === 'demo' && !!accessData.demoExpires;

  return (
    <div className="h-full pb-32 max-w-md mx-auto relative overflow-x-hidden bg-slate-50">
      {showDemoBanner && (
        <DemoBanner demoExpires={accessData.demoExpires!} language={userData.language} userId={String(userData.userId)} />
      )}
      <SyncIndicator status={syncStatus} onRetry={retrySync} />
      {newBadge && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-24 pointer-events-none">
          <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex items-center space-x-4 animate-in slide-in-from-bottom-10 fade-in duration-500 w-full max-w-sm border border-slate-700 pointer-events-auto">
            <div className="text-4xl animate-bounce">{newBadge.icon}</div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">ЖАҢА ЖЕТІСТІК!</p>
              <h4 className="font-bold text-lg leading-tight">{newBadge.name_kk}</h4>
            </div>
            <button onClick={() => setNewBadge(null)} className="text-slate-500">✕</button>
          </div>
        </div>
      )}
      <header className={`px-6 pb-12 text-center bg-gradient-to-b from-emerald-900 to-emerald-800 rounded-b-[3rem] shadow-xl relative overflow-hidden ${showDemoBanner ? 'pt-4' : 'pt-16'}`}>
        <div className="absolute top-0 right-0 p-10 opacity-10"><span className="text-9xl">🌙</span></div>
        <div className="flex justify-center mb-4 relative z-10">
          <div onClick={() => setCurrentView('rewards')}
            className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 flex items-center space-x-2 cursor-pointer active:scale-95 transition-transform">
            <span className="text-xl">🏆</span>
            <span className="text-white font-black text-sm">{userData.xp} XP</span>
          </div>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight leading-tight uppercase relative z-10 whitespace-pre-line px-4">
          {ramadanInfo.isStarted ? t.ramadanStartedTitle : t.preRamadanTitle}
        </h1>
        {currentView !== 'dashboard' && (
          <button onClick={() => setCurrentView('dashboard')}
            className="absolute top-6 right-6 bg-white/10 backdrop-blur-lg p-3 rounded-2xl border border-white/10 active:scale-90 transition-transform shadow-lg z-30">
            🏠
          </button>
        )}
      </header>
      <main key={`${currentView}-${selectedBasicDate?.toISOString() || ''}-${selectedPreparationDay || ''}`}
        className="px-6 -mt-8 relative z-20">
        {renderView()}
      </main>
      <Navigation currentView={currentView} setView={setCurrentView} language={userData.language} isHidden={isKeyboardOpen} />
    </div>
  );
};

export default App;
