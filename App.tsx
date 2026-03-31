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
import Tasbeeh from './components/Tasbeeh';
import RewardsView from './components/RewardsView';
import ProfileView from './components/ProfileView';
import Paywall from './components/Paywall';
import PendingScreen from './components/PendingScreen';
import DemoBanner from './components/DemoBanner';
import PreparationTracker from './components/PreparationTracker';
import BasicTracker from './components/BasicTracker';
import { initTelegramApp, getTelegramUserId, getTelegramWebApp } from './src/utils/telegram';
import { useAppInitialization } from './src/hooks/useAppInitialization';
import { useTheme } from './src/hooks/useTheme';
import CirclesView from './components/CirclesView';
import { getUserCircles } from './src/services/api';
import { getCurrentContest } from './src/services/api';
import ContestBanner from './components/ContestBanner';
import { PREPARATION_START_DATE } from './constants';
import PrayerTimesCard from './components/PrayerTimesCard';

const API_BASE_URL = import.meta.env.VITE_API_URL || '${API_BASE_URL}';

interface BackendUserData {
  userId: string;
  promoCode: string;
  invitedCount: number;
  username?: string;
}

const STORAGE_KEY = 'ramadan_tracker_data_v4';

// ─── Безопасная нормализация UserData ────────────────────────────────────────
// Гарантирует что критические поля всегда правильного типа,
// даже если сервер вернул null / undefined / неправильный тип.
function normalizeUserData(raw: UserData): UserData {
  // language должен быть обязательно валидным,
  // если пришло что-то другое — фоллбэк на 'kk'
  const lang: Language =
    raw.language === 'kk' || raw.language === 'ru' ? raw.language : 'kk';

  return {
    ...raw,
    language:           lang,
    unlockedBadges:     Array.isArray(raw.unlockedBadges)         ? raw.unlockedBadges         : [],
    memorizedNames:     Array.isArray(raw.memorizedNames)         ? raw.memorizedNames         : [],
    completedJuzs:      Array.isArray(raw.completedJuzs)          ? raw.completedJuzs          : [],
    earnedJuzXpIds:     Array.isArray(raw.earnedJuzXpIds)         ? raw.earnedJuzXpIds         : [],
    completedTasks:     Array.isArray(raw.completedTasks)         ? raw.completedTasks         : [],
    customTasks:        Array.isArray(raw.customTasks)            ? raw.customTasks            : [],
    deletedPredefinedTasks: Array.isArray(raw.deletedPredefinedTasks) ? raw.deletedPredefinedTasks : [],
    progress:            raw.progress            || {},
    preparationProgress: raw.preparationProgress || {},
    basicProgress:       raw.basicProgress       || {},
    tasbeehRecords: raw.tasbeehRecords || {},
    tasbeehTotals: raw.tasbeehTotals || {},
    dailyGoalRecords:    raw.dailyGoalRecords     || {},
    goalCustomItems:    (raw.goalCustomItems      || {}) as Record<GoalCategoryId, CustomGoalItem[]>,
    goalStreaks: (raw.goalStreaks || {}) as Record<GoalCategoryId, { current: number; longest: number; lastCompletedDate: string }>,
    startDate:           raw.startDate            || RAMADAN_START_DATE,
    lastActiveDate:      raw.lastActiveDate        || '',
    subscriptionExpiresAt: raw.subscriptionExpiresAt || null,
    currentStreak:       raw.currentStreak         ?? 0,
    longestStreak:       raw.longestStreak         ?? 0,
    xp:                  raw.xp                   ?? 0,
    quranKhatams:        raw.quranKhatams          ?? 0,
    referralCount:       raw.referralCount         ?? 0,
    registrationDate:    raw.registrationDate      || new Date().toISOString(),
  };
}

const App: React.FC = () => {
  useTheme();
  useEffect(() => { initTelegramApp(); }, []);

  useEffect(() => {
    (window as any).showXPNotification = (xpAmount: number, multiplier: number) => {
      const id = `${Date.now()}-${Math.random()}`;
      setXpNotifications(prev => [...prev, { id, amount: xpAmount, multiplier }]);
      setTimeout(() => setXpNotifications(prev => prev.filter(n => n.id !== id)), 2000);
    };
    return () => { delete (window as any).showXPNotification; };
  }, []);

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
      dailyGoalRecords: {},
      goalCustomItems: {} as Record<GoalCategoryId, CustomGoalItem[]>,
      goalStreaks: {} as Record<GoalCategoryId, { current: number; longest: number; lastCompletedDate: string }>,
      tasbeehRecords:   {},
    };
  }, []);

  const {
    isLoading,
    hasAccess,
    accessData: rawAccessData,
    userData: initialUserData,
    error
  } = useAppInitialization(getDefaultUserData);

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
  useEffect(() => { userDataRef.current = userData; }, [userData]);

  // ─── Инициализация из сервера ──────────────────────────────────────────────
  useEffect(() => {
    if (initialUserData) {
      const correctedData = normalizeUserData(initialUserData);
      console.log('📥 Инициализация userData из сервера:', {
        language: correctedData.language,
        progressDays: Object.keys(correctedData.progress).length,
        unlockedBadges: correctedData.unlockedBadges.length,
      });
      setUserData(correctedData);
    }
  }, [initialUserData]);

  useEffect(() => {
    const loadUserCircles = async () => {
      const userId = getTelegramUserId();
      if (!userId) return;
      try {
        const circles = await getUserCircles(userId);
        setUserCircles(circles || []);
      } catch { setUserCircles([]); }
    };
    loadUserCircles();
  }, []);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [xpNotifications, setXpNotifications] = useState<Array<{id: string; amount: number; multiplier?: number}>>([]);
  const [newBadge, setNewBadge] = useState<typeof BADGES[0] | null>(null);

  const calculateRamadanStatus = useCallback(() => {
    const [sy, sm, sd] = userData.startDate.split('-').map(Number);
    const startDate = new Date(sy, sm - 1, sd);
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = currentDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const isStarted = diffDays >= 0;
    const currentDay = isStarted ? Math.min(diffDays + 1, TOTAL_DAYS) : 0;
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
  const [contestData, setContestData] = useState<{ contest: any; participant: any } | null>(null);
  useEffect(() => {
    if (!userData?.userId) return;
    getCurrentContest(userData.userId).then(data => {
      setContestData(data);
    }).catch(() => {});
  }, [userData?.userId]);
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
    return () => { scrollMemory.current[currentView] = document.body.scrollTop; };
  }, [currentView]);
  useEffect(() => {
    if (selectedBasicDate || selectedPreparationDay) { document.body.scrollTop = 0; return; }
    const savedPos = scrollMemory.current[currentView] ?? 0;
    document.body.scrollTop = savedPos;
  }, [currentView, selectedBasicDate, selectedPreparationDay]);

  // ─── Защищённый доступ к переводам — никогда не вернёт undefined ──────────
  const lang: Language = userData.language === 'kk' || userData.language === 'ru'
    ? userData.language
    : 'kk';
  const t = TRANSLATIONS[lang] ?? TRANSLATIONS['kk'];

  useEffect(() => {
    const getAlmatyDay = () => {
      const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: userTZ });
      const prepStart = new Date(PREPARATION_START_DATE + 'T00:00:00');
      const todayDate = new Date(todayStr + 'T00:00:00');
      const daysSincePrep = Math.floor((todayDate.getTime() - prepStart.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(1, daysSincePrep + 1);
    };
    setRealTodayDay(ramadanInfo.isStarted ? ramadanInfo.currentDay : 0);
    if (!hasInitializedDay.current) {
      setSelectedDay(getAlmatyDay());
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
          const el = document.activeElement as HTMLElement;
          if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  const syncToServerFn = useCallback(async () => {
    const userId = getTelegramUserId();
    if (!userId) { setSyncStatus('offline'); return false; }
    const d = userDataRef.current;
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
      unlockedBadges: Array.isArray(data.unlockedBadges) ? data.unlockedBadges : [],
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
      lastActiveDate: data.lastActiveDate,
      tasbeehRecords: data.tasbeehRecords || {},
      tasbeehTotals: data.tasbeehTotals || {},
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
        `${API_BASE_URL}/api/user/${userId}/sync`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload(d)) }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const validatedData = normalizeUserData(data.data as UserData);
          setUserData(prev => {
            // Берём dailyGoalRecords: мёрджим по датам, локальные данные побеждают
            const mergedGoalRecords: typeof prev.dailyGoalRecords = {
              ...validatedData.dailyGoalRecords,
              ...prev.dailyGoalRecords,  // ← локальные всегда побеждают
            };
            const mergedStreaks =
              Object.keys(prev.goalStreaks || {}).length > 0
                ? prev.goalStreaks
                : validatedData.goalStreaks;
            return {
              ...validatedData,
              dailyGoalRecords: mergedGoalRecords,
              goalStreaks: mergedStreaks,
              tasbeehRecords: {
                ...(validatedData.tasbeehRecords || {}),
                ...(prev.tasbeehRecords || {}),  // локальные данные побеждают
              },
            };
          });
        }
        if (data.xpAdded && data.xpAdded > 0) {
          if ((window as any).showXPNotification) {
            (window as any).showXPNotification(data.xpAdded, data.streakMultiplier || 1.0);
          }
        }
        setSyncStatus('success');
        return true;
      } else {
        setSyncStatus('error');
        return false;
      }
    } catch {
      setSyncStatus('error');
      return false;
    }
  }, [setSyncStatus]);

  const debouncedSync = useDebounce(syncToServerFn, 5000);

  useEffect(() => {
    if (!isLoading && userData.userId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      const hasData =
        userData.xp > 0 ||
        Object.keys(userData.progress).length > 0 ||
        Object.keys(userData.preparationProgress || {}).length > 0 ||
        (userData.memorizedNames || []).length > 0 ||
        Object.keys(userData.dailyGoalRecords || {}).length > 0 ||
        Object.keys(userData.tasbeehRecords || {}).length > 0;
      if (hasData) debouncedSync();
    }
  }, [userData, isLoading, debouncedSync]);

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
        unlockedBadges: Array.isArray(userDataRef.current.unlockedBadges) ? userDataRef.current.unlockedBadges : [],
        currentStreak: userDataRef.current.currentStreak,
        longestStreak: userDataRef.current.longestStreak,
        lastActiveDate: userDataRef.current.lastActiveDate,
        dailyGoalRecords: userDataRef.current.dailyGoalRecords || {},
        goalCustomItems: userDataRef.current.goalCustomItems || {},
        goalStreaks: userDataRef.current.goalStreaks || {},
        tasbeehRecords: userDataRef.current.tasbeehRecords || {},
        tasbeehTotals: userDataRef.current.tasbeehTotals || {},
      });
      const url = `${API_BASE_URL}/api/user/${userId}/sync`;
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
      const processed = await syncQueue.processQueue(async (data) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/user/${data.userId}/sync`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
          });
          return response.ok;
        } catch { return false; }
      });
      if (processed > 0) setSyncStatus('success');
    };
    const handleOffline = () => setSyncStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setSyncStatus]);

  useEffect(() => {
    if (currentView !== 'dashboard') {
      if (selectedBasicDate) setSelectedBasicDate(null);
      if (selectedPreparationDay) setSelectedPreparationDay(null);
    }
  }, [currentView]);

  const retrySync = useCallback(() => {
    setSyncStatus('idle');
    syncToServerFn();
  }, [syncToServerFn]);

  // ─── checkBadges: защищён от любого мусора в unlockedBadges ─────────────
  const checkBadges = (data: UserData) => {
    const earnedBadges = Array.isArray(data.unlockedBadges) ? [...data.unlockedBadges] : [];
    let newlyUnlockedId: string | null = null;
    const unlock = (id: string) => { if (!earnedBadges.includes(id)) { earnedBadges.push(id); newlyUnlockedId = id; } };
    if (Object.values(data.progress || {}).some(p => p.fasting) || (data.shawwalDates || []).length > 0) unlock('first_fast');
    if ((data.completedJuzs || []).length >= 1) unlock('quran_master');
    const ramadanCharity = Object.values(data.progress || {}).reduce((s, p) => s + ((p as any).charityAmount || 0), 0);
    const basicCharity = Object.values(data.basicProgress || {}).reduce((s, p) => s + ((p as any).charityAmount || 0), 0);
    if (ramadanCharity + basicCharity >= 10000) unlock('charity_king');
    if (Object.values(data.progress || {}).filter(p => p.taraweeh).length >= 5) unlock('taraweeh_star');
    if ((data.memorizedNames || []).length >= 10) unlock('names_scholar');
    if ((data.xp || 0) >= 4000) unlock('ramadan_hero');
    if ((data.quranKhatams || 0) > 0) unlock('khatam_master');
    if ((data.customTasks || []).filter(t => t.completed).length >= 5) unlock('goal_achiever');
    if ((data.referralCount || 0) >= 10) unlock('community_builder');
    if (newlyUnlockedId) {
      const badgeInfo = BADGES.find(b => b.id === newlyUnlockedId);
      if (badgeInfo) { setNewBadge(badgeInfo); setTimeout(() => setNewBadge(null), 4000); }
      return earnedBadges;
    }
    return null;
  };

  const updateStreak = (data: UserData): UserData => {
    const userTimezone = (data as any).location?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Almaty';
    const today = new Date().toLocaleDateString('en-CA', { timeZone: userTimezone });
    const lastActive = data.lastActiveDate || '';
    if (lastActive === today) return data;
    const lastActiveDate = lastActive ? new Date(lastActive) : null;
    const todayDate = new Date(today);
    let newStreak = 0;
    if (!lastActiveDate) { newStreak = 1; }
    else {
      const diffDays = Math.floor((todayDate.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) newStreak = (data.currentStreak || 0) + 1;
      else if (diffDays > 1) newStreak = 1;
    }
    return { ...data, currentStreak: newStreak, longestStreak: Math.max(newStreak, data.longestStreak || 0), lastActiveDate: today };
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
    debouncedSync();
  }, [debouncedSync]);

  const updatePreparationProgress = useCallback((day: number, updates: Partial<DayProgress>) => {
    setUserData(prev => {
      const existing = prev.preparationProgress?.[day] || EMPTY_DAY_PROGRESS(day);
      let newState = { ...prev, preparationProgress: { ...prev.preparationProgress, [day]: { ...existing, ...updates } } };
      newState = updateStreak(newState);
      const newBadges = checkBadges(newState);
      if (newBadges) newState.unlockedBadges = newBadges;
      return newState;
    });
    debouncedSync();
  }, [debouncedSync]);

  const updateBasicProgress = useCallback((dateStr: string, updates: Partial<DayProgress>) => {
    setUserData(prev => {
      const existing = prev.basicProgress?.[dateStr] || EMPTY_DAY_PROGRESS(dateStr);
      let newState = { ...prev, basicProgress: { ...prev.basicProgress, [dateStr]: { ...existing, ...updates } } };
      newState = updateStreak(newState);
      return newState;
    });
    debouncedSync();
  }, [debouncedSync]);

  // ─── handleUserDataUpdate: поддерживает как прямой UserData,
  //     так и функциональный апдейт (prev: UserData) => UserData
  //     Это нужно для TasksList, QuranTracker и др. компонентов,
  //     которые вызывают setUserData(p => ({ ...p, xp: ... }))
  const handleUserDataUpdate = useCallback(
    (updater: UserData | ((prev: UserData) => UserData)) => {
      setUserData(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        const normalized = normalizeUserData(next);
        const newBadges = checkBadges(normalized);
        if (newBadges) normalized.unlockedBadges = newBadges;
        return normalized;
      });
      debouncedSync();
    },
    [debouncedSync]
  );

  const renderView = () => {
    const dayData = userData.progress[selectedDay] || INITIAL_DAY_PROGRESS(selectedDay);
    switch (currentView) {
      case 'dashboard':
        if (selectedBasicDate) return (
          <BasicTracker date={selectedBasicDate} language={lang} userData={userData}
            onUpdate={updateBasicProgress} onBack={() => setSelectedBasicDate(null)} />
        );
        if (selectedPreparationDay) return (
          <PreparationTracker day={selectedPreparationDay} language={lang} userData={userData}
            onUpdate={updatePreparationProgress} onBack={() => setSelectedPreparationDay(null)} />
        );
        return (
          <>
            <ContestBanner
              contestData={contestData}
              isPaid={userData.paymentStatus === 'paid'}
              language={lang}
              onViewLeaderboard={() => handleNavigation('rewards', { filter: 'contest' })}
              onPaywall={() => handleNavigation('paywall' as ViewType)}
            />
            <Dashboard day={selectedDay} realTodayDay={realTodayDay} ramadanInfo={ramadanInfo}
              data={dayData} allProgress={userData.progress} updateProgress={updateProgress}
              updatePreparationProgress={updatePreparationProgress} updateBasicProgress={updateBasicProgress}
              language={lang} onDaySelect={(d) => setSelectedDay(d)}
              onPreparationDaySelect={(d) => setSelectedPreparationDay(d)}
              onBasicDateSelect={(date) => setSelectedBasicDate(date)}
              xp={userData.xp} userData={userData} setUserData={handleUserDataUpdate} setView={setCurrentView} />
          </>
        );
      case 'calendar':
        return <Calendar progress={userData.progress} realTodayDay={realTodayDay} selectedDay={selectedDay}
          language={lang} onSelectDay={(d) => { setSelectedDay(d); setCurrentView('dashboard'); }} />;
      case 'quran':
        return <QuranTracker userData={userData} setUserData={handleUserDataUpdate} language={lang} />;
      case 'tasks':
        return <TasksList language={lang} userData={userData} setUserData={handleUserDataUpdate} />;
      case 'tasbeeh':
        return <Tasbeeh language={lang} userData={userData} setUserData={handleUserDataUpdate} />;
      case 'profile':
        return <ProfileView userData={userData} language={lang} setUserData={handleUserDataUpdate} onNavigate={handleNavigation} />;
      case 'names-99':
        return <NamesMemorizer language={lang} userData={userData} setUserData={handleUserDataUpdate} />;
      case 'rewards':
        return <RewardsView userData={userData} language={lang} setUserData={handleUserDataUpdate} onNavigate={handleNavigation} contestData={contestData} navigationData={navigationData} />;
      case 'circles':
        return <CirclesView userData={userData} language={lang} onNavigate={handleNavigation} navigationData={navigationData} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-header flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8 relative">
            <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-2xl">
              <span className="text-5xl animate-pulse">🌙</span>
            </div>
            <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-white/30 animate-ping" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">ImanTap</h1>
          <p className="text-sm font-bold text-white/70">{lang === 'kk' ? 'Жүктелуде...' : 'Загрузка...'}</p>
          <div className="flex justify-center space-x-2 mt-6">
            {[0, 150, 300].map(d => (
              <div key={d} className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!accessData.hasAccess && accessData?.paymentStatus === 'pending') return <PendingScreen language={lang} />;
  if (!isLoading && accessData && !accessData.hasAccess) return <Paywall language={lang} />;

  const showDemoBanner = accessData?.paymentStatus === 'demo' && !!accessData.demoExpires;

  return (
    <div className="min-h-full max-w-md mx-auto relative overflow-x-hidden bg-page flex flex-col">

      <style>{`
        @keyframes xpFloat {
          0%   { opacity: 0; transform: translateY(10px) scale(0.8); }
          20%  { opacity: 1; transform: translateY(0) scale(1.05); }
          70%  { opacity: 1; transform: translateY(-40px) scale(1); }
          100% { opacity: 0; transform: translateY(-70px) scale(0.9); }
        }
      `}</style>

      {showDemoBanner && (
        <div className="sticky top-0 z-50">
          <DemoBanner
            demoExpires={accessData.demoExpires!}
            language={lang}
            userId={String(userData.userId)}
          />
        </div>
      )}

      <SyncIndicator status={syncStatus} onRetry={retrySync} />

      {newBadge && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-24 pointer-events-none">
          <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex items-center space-x-4 animate-in slide-in-from-bottom-10 fade-in duration-500 w-full max-w-sm border border-white/10 pointer-events-auto">
            <div className="text-4xl animate-bounce">{newBadge.icon}</div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-brand uppercase tracking-widest">ЖАҢА ЖЕТІСТІК!</p>
              <h4 className="font-bold text-lg leading-tight">{newBadge.name_kk}</h4>
            </div>
            <button onClick={() => setNewBadge(null)} className="text-white/40">✕</button>
          </div>
        </div>
      )}

      {xpNotifications.length > 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] pointer-events-none flex flex-col items-center gap-2">
          {xpNotifications.map(n => (
            <div key={n.id} style={{
              animation: 'xpFloat 2s ease-out forwards',
              background: 'linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,41,59,0.92))',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 20, padding: '12px 24px',
              fontWeight: 900, fontSize: 16, color: 'white',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              +{n.amount} XP ✨
              {n.multiplier && n.multiplier > 1 && (
                <span style={{ fontSize: 12, marginLeft: 6, opacity: 0.8 }}>
                  x{n.multiplier.toFixed(1)} 🔥
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <header className="px-6 pt-8 pb-5 bg-header rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <PrayerTimesCard
          prayerTimes={(userData as any)?.prayerTimes || null}
          language={lang}
          city={(userData as any)?.location?.city || 'Астана'}
          xp={userData.xp}
          onXpClick={() => setCurrentView('rewards')}
        />
      </header>

      <main
        key={`${currentView}-${selectedBasicDate?.toISOString() || ''}-${selectedPreparationDay || ''}`}
        className="px-6 mt-4 relative z-20 flex-1 pb-32"
      >
        {renderView()}
      </main>

      <Navigation
        currentView={currentView}
        setView={setCurrentView}
        language={lang}
        isHidden={isKeyboardOpen}
      />
    </div>
  );
};

export default App;
