
import React, { useState, useEffect, useCallback } from 'react';
import { UserData, ViewType, DayProgress, Language } from './types';
import { TOTAL_DAYS, INITIAL_DAY_PROGRESS, TRANSLATIONS } from './constants';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import QuranTracker from './components/QuranTracker';
import AIInsights from './components/AIInsights';
import Navigation from './components/Navigation';
import UsefulMaterials from './components/UsefulMaterials';
import NamesMemorizer from './components/NamesMemorizer';
import TasksList from './components/TasksList';

const STORAGE_KEY = 'ramadan_tracker_data_v2';

const App: React.FC = () => {
  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...parsed, 
        language: 'kk', 
        completedJuzs: parsed.completedJuzs || [],
        completedTasks: parsed.completedTasks || [],
        deletedPredefinedTasks: parsed.deletedPredefinedTasks || [],
        customTasks: parsed.customTasks || []
      };
    }
    
    return {
      name: 'Брат/Сестра',
      startDate: new Date().toISOString(),
      progress: {},
      memorizedNames: [],
      completedJuzs: [],
      completedTasks: [],
      deletedPredefinedTasks: [],
      customTasks: [],
      quranGoal: 30, 
      language: 'kk', 
    };
  });

  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [currentRamadanDay, setCurrentRamadanDay] = useState<number>(1);

  const t = TRANSLATIONS[userData.language];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  useEffect(() => {
    const start = new Date(userData.startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setCurrentRamadanDay(Math.min(Math.max(diffDays, 1), TOTAL_DAYS));
  }, [userData.startDate]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  }, [userData]);

  const updateProgress = useCallback((day: number, updates: Partial<DayProgress>) => {
    setUserData(prev => {
      const existing = prev.progress[day] || INITIAL_DAY_PROGRESS(day);
      return {
        ...prev,
        progress: {
          ...prev.progress,
          [day]: { ...existing, ...updates }
        }
      };
    });
  }, []);

  const renderView = () => {
    const dayData = userData.progress[currentRamadanDay] || INITIAL_DAY_PROGRESS(currentRamadanDay);

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            day={currentRamadanDay} 
            data={dayData} 
            allProgress={userData.progress}
            updateProgress={updateProgress}
            language={userData.language}
            onDaySelect={(d) => setCurrentRamadanDay(d)}
          />
        );
      case 'calendar':
        return (
          <Calendar 
            progress={userData.progress} 
            language={userData.language}
            onSelectDay={(d) => {
              setCurrentRamadanDay(d);
              setCurrentView('dashboard');
            }}
          />
        );
      case 'quran':
        return (
          <QuranTracker 
            userData={userData}
            setUserData={setUserData}
            language={userData.language}
          />
        );
      case 'ai-insights':
        return <AIInsights day={currentRamadanDay} language={userData.language} />;
      case 'tasks':
        return (
          <TasksList 
            language={userData.language} 
            userData={userData} 
            setUserData={setUserData} 
          />
        );
      case 'useful-materials':
        return <UsefulMaterials language={userData.language} setView={setCurrentView} />;
      case 'names-99':
        return (
          <NamesMemorizer 
            language={userData.language} 
            userData={userData} 
            setUserData={setUserData} 
          />
        );
      default:
        return (
          <Dashboard 
            day={currentRamadanDay} 
            data={dayData} 
            allProgress={userData.progress}
            updateProgress={updateProgress}
            language={userData.language}
            onDaySelect={(d) => setCurrentRamadanDay(d)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen pb-32 max-w-md mx-auto relative overflow-x-hidden bg-slate-50">
      <header className="pt-16 px-6 pb-12 text-center bg-gradient-to-b from-emerald-900 to-emerald-800 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
           <span className="text-9xl">🌙</span>
        </div>
        
        <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase relative z-10 whitespace-pre-line">
            {t.appTitle}
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

      <main className="px-6 -mt-8 relative z-20">
        {renderView()}
      </main>

      <Navigation currentView={currentView} setView={setCurrentView} language={userData.language} />
    </div>
  );
};

export default App;
