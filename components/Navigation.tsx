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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200/50 z-50 pb-safe">
      <div className="flex items-center justify-around max-w-md mx-auto px-2 pt-2 pb-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              haptics.selection();
              setView(item.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`
              relative flex flex-col items-center justify-center 
              py-1 px-4 rounded-full transition-all
              ${currentView === item.id 
                ? 'bg-slate-100/80' 
                : 'bg-transparent'
              }
            `}
          >
            {/* Иконка */}
            <span className={`text-[26px] leading-none mb-0.5 transition-transform ${
              currentView === item.id ? '' : 'opacity-60'
            }`}>
              {item.icon}
            </span>
            
            {/* Текст */}
            <span className={`text-[10px] font-semibold tracking-tight leading-none ${
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
