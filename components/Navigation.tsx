import React from 'react';
import { ViewType, Language } from '../src/types/types';
import { TRANSLATIONS } from '../constants';
import { haptics } from '../src/utils/haptics';

interface NavigationProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  language: Language;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView, language }) => {
  const t = TRANSLATIONS[language];
  
  const items: { id: ViewType; icon: string; label: string }[] = [
    { id: 'dashboard', icon: '🏠', label: t.navHome },
    { id: 'tasks', icon: '🎯', label: t.navTasks },
    { id: 'quran', icon: '📖', label: t.navQuran },
    { id: 'rewards', icon: '🏆', label: t.navRewards },
    { id: 'profile', icon: '👤', label: t.navProfile },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-1 py-1 z-50 safe-area-inset-bottom shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              haptics.selection();
              setView(item.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-all flex-1 active:scale-95 ${
              currentView === item.id 
                ? 'text-emerald-600' 
                : 'text-slate-500'
            }`}
          >
            {/* Иконка */}
            <span className={`text-xl leading-none mb-0.5 ${
              currentView === item.id ? 'transform scale-110' : ''
            }`}>
              {item.icon}
            </span>
            
            {/* Текст */}
            <span className={`text-[9px] font-bold tracking-tight leading-none ${
              currentView === item.id ? 'text-emerald-600' : 'text-slate-400'
            }`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
