import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { UserData, ViewType, DayProgress, Language, CustomTask } from './src/types/types';
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
      name: 'Брат/Сестра',
      startDate: RAMADAN_START_DATE,
      registrationDate: new Date().toISOString(),
      progress: {},
      preparationProgress: {},
      basicProgress: {},
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
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: ''
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

  // ✅ ИСПРАВЛЕНИЕ: Мемоизация accessData
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

  // ✅ Добавьте эту строку:
  const userDataRef = useRef(userData);

  // ✅ И добавьте useEffect для обновления ref:
  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  // Обновляем userData когда загрузка завершена
  useEffect(() => {
    if (initialUserData) {
      // ✅ ВАЖНО: startDate берем из констант, а НЕ с сервера!
      const correctedData = {
        ...initialUserData,
        startDate: RAMADAN_START_DATE, // ✅ Принудительно используем константу
      };
      setUserData(correctedData);
    }
  }, [initialUserData]);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [newBadge, setNewBadge] = useState<typeof BADGES[0] | null>(null);

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
    
    console.log('📅 RAMADAN STATUS:', {
      userData_startDate: userData.startDate,
      startDate: startDate.toISOString(),
      currentDate: currentDate.toISOString(),
      diffDays,
      isStarted,
      currentDay,
      daysUntil
    });
    
    return { isStarted, currentDay, daysUntil };
  }, [userData.startDate]);

  const ramadanInfo = useMemo(() => {
    const result = calculateRamadanStatus();
    console.log('📅 RAMADAN INFO CALCULATED:', result);
    return result;
  }, [calculateRamadanStatus]);

  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedDay, setSelectedDay] = useState<number>(ramadanInfo.currentDay);
  const [realTodayDay, setRealTodayDay] = useState<number>(ramadanInfo.isStarted ? ramadanInfo.currentDay : 0);
  const [selectedBasicDate, setSelectedBasicDate] = useState<Date | null>(null);
  const [selectedPreparationDay, setSelectedPreparationDay] = useState<number | null>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // SCROLL LOGIC - с сохранением позиций
  const scrollMemory = useRef<Record<string, number>>({});

  // Сохраняем позицию при уходе
  useEffect(() => {
    return () => {
      scrollMemory.current[currentView] = document.body.scrollTop;
    };
  }, [currentView]);

  // Восстанавливаем при заходе
  useEffect(() => {
    // Трекеры - всегда наверх
    if (selectedBasicDate || selectedPreparationDay) {
      document.body.scrollTop = 0;
      return;
    }

    // Восстанавливаем сохраненную позицию
    const savedPos = scrollMemory.current[currentView] ?? 0;
    document.body.scrollTop = savedPos;
    
    console.log('📍', currentView, '→', savedPos);
  }, [currentView, selectedBasicDate, selectedPreparationDay]);

  const t = TRANSLATIONS[userData.language];

  useEffect(() => {
    // ✅ Обновляем realTodayDay синхронно с ramadanInfo
    setRealTodayDay(ramadanInfo.isStarted ? ramadanInfo.currentDay : 0);
    
    // ✅ Обновляем каждые 60 секунд
    const interval = setInterval(() => {
      const newStatus = calculateRamadanStatus();
      console.log('📅 RAMADAN INFO UPDATE:', newStatus);
      setRealTodayDay(newStatus.isStarted ? newStatus.currentDay : 0);
    }, 60000);
    
    return () => clearInterval(interval);
  }, [ramadanInfo, calculateRamadanStatus]);

  // ✅ Отслеживание клавиатуры + автоскролл к полю
  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg) return;
    
    let lastHeight = tg.viewportHeight;
    
    const checkKeyboard = () => {
      const currentHeight = tg.viewportHeight;
      
      // Если высота уменьшилась > 100px - клавиатура открыта
      if (lastHeight - currentHeight > 100) {
        setIsKeyboardOpen(true);
        
        // ✅ Автоматически скроллим к активному полю
        setTimeout(() => {
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            activeElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
        }, 300);
      } 
      // Если высота восстановилась - клавиатура закрыта
      else if (currentHeight - lastHeight > 100) {
        setIsKeyboardOpen(false);
      }
      
      lastHeight = currentHeight;
    };
    
    // Проверяем каждые 100ms
    const interval = setInterval(checkKeyboard, 100);
    
    return () => clearInterval(interval);
  }, []);

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
    const userId = getTelegramUserId();
    if (!userId) {
      setSyncStatus('offline');
      return false;
    }
    
    // ✅ Читаем userData напрямую через ref
    const currentUserData = userDataRef.current;
    
    if (!navigator.onLine) {
      setSyncStatus('offline');
      console.log('📴 Offline - adding to queue');
      
      syncQueue.add({
        userId,
        name: currentUserData.name,
        photoUrl: currentUserData.photoUrl,
        startDate: currentUserData.startDate,
        registrationDate: currentUserData.registrationDate,
        progress: currentUserData.progress,
        memorizedNames: currentUserData.memorizedNames,
        completedJuzs: currentUserData.completedJuzs,
        quranKhatams: currentUserData.quranKhatams,
        completedTasks: currentUserData.completedTasks,
        deletedPredefinedTasks: currentUserData.deletedPredefinedTasks,
        customTasks: currentUserData.customTasks,
        quranGoal: currentUserData.quranGoal,
        dailyQuranGoal: currentUserData.dailyQuranGoal,
        dailyCharityGoal: currentUserData.dailyCharityGoal,
        language: currentUserData.language,
        xp: currentUserData.xp,
        hasRedeemedReferral: currentUserData.hasRedeemedReferral,
        unlockedBadges: currentUserData.unlockedBadges
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
            name: currentUserData.name,
            username: currentUserData.username, 
            photoUrl: currentUserData.photoUrl,
            registrationDate: currentUserData.registrationDate,
            progress: currentUserData.progress,
            preparationProgress: currentUserData.preparationProgress,
            basicProgress: currentUserData.basicProgress,
            memorizedNames: currentUserData.memorizedNames,
            completedJuzs: currentUserData.completedJuzs,
            quranKhatams: currentUserData.quranKhatams,
            completedTasks: currentUserData.completedTasks,
            deletedPredefinedTasks: currentUserData.deletedPredefinedTasks,
            customTasks: currentUserData.customTasks,
            quranGoal: currentUserData.quranGoal,
            dailyQuranGoal: currentUserData.dailyQuranGoal,
            dailyCharityGoal: currentUserData.dailyCharityGoal,
            language: currentUserData.language,
            xp: currentUserData.xp,
            hasRedeemedReferral: currentUserData.hasRedeemedReferral,
            unlockedBadges: currentUserData.unlockedBadges,
            currentStreak: currentUserData.currentStreak,
            longestStreak: currentUserData.longestStreak,
            lastActiveDate: currentUserData.lastActiveDate
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
  }, [setSyncStatus]);

  // Debounced sync (5 секунд вместо немедленной синхронизации)
  const debouncedSync = useDebounce(syncToServerFn, 5000);

  // Save to localStorage AND sync to server whenever userData changes
  useEffect(() => {
    if (!isLoading) {
      // ✅ НЕМЕДЛЕННО сохраняем в localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      
      // ✅ Синхронизируем с сервером с задержкой (для оптимизации)
      debouncedSync();
    }
  }, [userData, isLoading, debouncedSync]);

  // ✅ НОВЫЙ useEffect - сохраняем при закрытии приложения
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Немедленно синхронизируем перед закрытием
      const userId = getTelegramUserId();
      if (!userId) return;
      
      // Используем sendBeacon для надежной отправки при закрытии
      const data = JSON.stringify({
        name: userData.name,
        username: userData.username,
        photoUrl: userData.photoUrl,
        startDate: userData.startDate,
        registrationDate: userData.registrationDate,
        progress: userData.progress,
        preparationProgress: userData.preparationProgress,
        basicProgress: userData.basicProgress,
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
        unlockedBadges: userData.unlockedBadges,
        currentStreak: userData.currentStreak,
        longestStreak: userData.longestStreak,
        lastActiveDate: userData.lastActiveDate
      });
      
      const blob = new Blob([data], { type: 'application/json' });
      navigator.sendBeacon(
        `https://imantap-bot-production.up.railway.app/api/user/${userId}/sync`,
        blob
      );
    };
    
    // Telegram WebApp закрытие
    const tg = getTelegramWebApp();
    if (tg) {
      tg.onEvent('viewportChanged', handleBeforeUnload);
    }
    
    // Обычное закрытие браузера
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (tg) {
        tg.offEvent('viewportChanged', handleBeforeUnload);
      }
    };
  }, [userData]);

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

  // ✅ Сбрасываем выбранные трекеры при переключении вкладок
  useEffect(() => {
    if (currentView !== 'dashboard') {
      if (selectedBasicDate) setSelectedBasicDate(null);
      if (selectedPreparationDay) setSelectedPreparationDay(null);
    }
  }, [currentView]);

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

  // --- STREAK LOGIC ---
  const updateStreak = (data: UserData): UserData => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastActive = data.lastActiveDate || '';
    
    // ✅ Если уже обновляли сегодня - не трогаем
    if (lastActive === today) {
      return data;
    }
    
    const lastActiveDate = lastActive ? new Date(lastActive) : null;
    const todayDate = new Date(today);
    
    let newStreak = 0;
    
    if (!lastActiveDate) {
      // ✅ Первая активность
      newStreak = 1;
    } else {
      // Вычисляем разницу в днях
      const diffTime = todayDate.getTime() - lastActiveDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // ✅ Следующий день подряд - увеличиваем стрик
        newStreak = (data.currentStreak || 0) + 1;
      } else if (diffDays > 1) {
        // ✅ Пропустили день(дни) - начинаем с 1
        newStreak = 1;
      }
      // Если diffDays === 0, это сегодняшний день (уже обработано выше)
    }
    
    const newLongest = Math.max(newStreak, data.longestStreak || 0);
    
    console.log('🔥 Стрик обновлен:', {
      lastActive,
      today,
      oldStreak: data.currentStreak,
      newStreak,
      longestStreak: newLongest
    });
    
    return {
      ...data,
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveDate: today
    };
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

      let newState = {
        ...prev,
        xp: Math.max(0, prev.xp + xpDelta),
        progress: nextProgress
      };

      // ✅ ОБНОВЛЯЕМ СТРИК при каждом изменении прогресса
      newState = updateStreak(newState);

      const newBadges = checkBadges(newState);
      if (newBadges) newState.unlockedBadges = newBadges;

      return newState;
    });
  }, []);

  const updatePreparationProgress = useCallback((day: number, updates: Partial<DayProgress>) => {
    setUserData(prev => {
      const existing = prev.preparationProgress?.[day] || {
        day,
        fasting: false,
        fajr: false,
        morningDhikr: false,
        quranRead: false,
        salawat: false,
        hadith: false,
        duha: false,
        charity: false,
        charityAmount: 0,
        dhuhr: false,
        asr: false,
        eveningDhikr: false,
        maghrib: false,
        isha: false,
        taraweeh: false,
        witr: false,
        quranPages: 0,
        date: new Date().toISOString(),
      };

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

      const nextPrepProgress = {
        ...prev.preparationProgress,
        [day]: { ...existing, ...updates }
      };

      let newState = {
        ...prev,
        xp: Math.max(0, prev.xp + xpDelta),
        preparationProgress: nextPrepProgress
      };

      newState = updateStreak(newState);

      const newBadges = checkBadges(newState);
      if (newBadges) newState.unlockedBadges = newBadges;

      return newState;
    });
  }, []);

  const updateBasicProgress = useCallback((dateStr: string, updates: Partial<DayProgress>) => {
    setUserData(prev => {
      const existing = prev.basicProgress?.[dateStr] || {
        day: 0,
        fasting: false,
        fajr: false,
        morningDhikr: false,
        quranRead: false,
        salawat: false,
        hadith: false,
        duha: false,
        charity: false,
        charityAmount: 0,
        dhuhr: false,
        asr: false,
        eveningDhikr: false,
        maghrib: false,
        isha: false,
        taraweeh: false,
        witr: false,
        quranPages: 0,
        date: dateStr,
      };

      // ❌ НЕТ XP для базовых дней

      // ✅ Обновляем basicProgress
      const nextBasicProgress = {
        ...prev.basicProgress,
        [dateStr]: { ...existing, ...updates }
      };

      // ✅ Создаём новое состояние БЕЗ XP
      let newState = {
        ...prev,
        basicProgress: nextBasicProgress
      };

      // ✅ ОБНОВЛЯЕМ СТРИК - базовые дни тоже считаются активностью!
      newState = updateStreak(newState);

      return newState;
    });
  }, []);

  const handleUserDataUpdate = (newData: UserData) => {
    const newBadges = checkBadges(newData);
    if (newBadges) newData.unlockedBadges = newBadges;
    setUserData(newData);
  };

  const renderView = () => {
    // Обрабатываем разные view
    const dayData = userData.progress[selectedDay] || INITIAL_DAY_PROGRESS(selectedDay);
    
    switch (currentView) {
      case 'dashboard':
        // ✅ Если выбран базовый день - показываем в Dashboard
        if (selectedBasicDate) {
          return (
            <BasicTracker
              date={selectedBasicDate}
              language={userData.language}
              userData={userData}
              onUpdate={updateBasicProgress}
              onBack={() => setSelectedBasicDate(null)}
            />
          );
        }
        
        // ✅ Если выбран день подготовки - показываем в Dashboard
        if (selectedPreparationDay) {
          return (
            <PreparationTracker
              day={selectedPreparationDay}
              language={userData.language}
              userData={userData}
              onUpdate={updatePreparationProgress}
              onBack={() => setSelectedPreparationDay(null)}
            />
          );
        }
        
        // ✅ Обычный Dashboard
        return (
          <Dashboard 
            day={selectedDay} 
            realTodayDay={realTodayDay} 
            ramadanInfo={ramadanInfo} 
            data={dayData} 
            allProgress={userData.progress} 
            updateProgress={updateProgress} 
            language={userData.language} 
            onDaySelect={(d) => setSelectedDay(d)} 
            onPreparationDaySelect={(d) => setSelectedPreparationDay(d)} 
            onBasicDateSelect={(date) => setSelectedBasicDate(date)} 
            xp={userData.xp} 
            userData={userData} 
            setUserData={handleUserDataUpdate} 
            setView={setCurrentView} 
          />
        );
        
      case 'calendar':
        return <Calendar progress={userData.progress} realTodayDay={realTodayDay} selectedDay={selectedDay} language={userData.language} onSelectDay={(d) => { setSelectedDay(d); setCurrentView('dashboard'); }} />;
        
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
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-emerald-800 flex items-center justify-center">
        <div className="text-center">
          {/* Анимированная луна */}
          <div className="mb-8 relative">
            <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-2xl">
              <span className="text-5xl animate-pulse">🌙</span>
            </div>
            {/* Пульсирующее кольцо */}
            <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-white/30 animate-ping"></div>
          </div>
          
          {/* Название */}
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
            ImanTap
          </h1>
          
          {/* Простой текст */}
          <p className="text-sm font-bold text-white/70">
            {userData.language === 'kk' ? 'Жүктелуде...' : 'Загрузка...'}
          </p>
          
          {/* Точки загрузки */}
          <div className="flex justify-center space-x-2 mt-6">
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER PENDING SCREEN ---
  if (accessData?.paymentStatus === 'pending') {
    console.log('→ Показываю PENDING');
    return <PendingScreen language={userData.language} />;
  }

  // --- RENDER PAYWALL ---
  // Demo пользователи НЕ должны видеть Paywall!
  if (!hasAccess && accessData?.paymentStatus !== 'demo') {
    console.log('→ Показываю PAYWALL (hasAccess = false, не demo)');
    return <Paywall language={userData.language} />;
  }

  // --- DEMO BANNER CHECK ---
  const showDemoBanner = accessData?.paymentStatus === 'demo' && !!accessData.demoExpires;

  console.log('→ Показываю MAIN APP. Demo banner:', showDemoBanner);

  // --- RENDER MAIN APP ---
  return (
    <div className="h-full pb-32 max-w-md mx-auto relative overflow-x-hidden bg-slate-50">
      {/* Demo Banner */}
      {showDemoBanner && (
        <DemoBanner 
          demoExpires={accessData.demoExpires!} 
          language={userData.language}
          userId={userData?.userId}
        />
      )}
      
      {/* Индикатор синхронизации */}
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
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <span className="text-9xl">🌙</span>
        </div>
        
        <div className="flex justify-center mb-4 relative z-10">
          <div 
            onClick={() => setCurrentView('rewards')}
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
            onClick={() => setCurrentView('dashboard')}
            className="absolute top-6 right-6 bg-white/10 backdrop-blur-lg p-3 rounded-2xl border border-white/10 active:scale-90 transition-transform shadow-lg z-30"
          >
            🏠
          </button>
        )}
      </header>

      <main 
        key={`${currentView}-${selectedBasicDate?.toISOString() || ''}-${selectedPreparationDay || ''}`}
        className="px-6 -mt-8 relative z-20"
      >
        {renderView()}
      </main>

      <Navigation 
        currentView={currentView} 
        setView={setCurrentView}
        language={userData.language}
        isHidden={isKeyboardOpen}
      />
    </div>
  );
  };

export default App;
