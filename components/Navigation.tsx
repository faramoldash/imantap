import React from 'react';
import { ViewType, Language } from '../types';
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-3 z-50 safe-area-inset-bottom shadow-lg">
      <div className="flex items-center justify-around">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              haptics.selection();
              setView(item.id);
            }}
            className={`relative flex flex-col items-center justify-center space-y-1 py-2 px-3 rounded-2xl transition-all flex-shrink-0 min-w-[64px] active:scale-95 ${
              currentView === item.id 
                ? 'text-emerald-600' 
                : 'text-slate-400'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-tight">
              {item.label}
            </span>
            
            {/* Индикатор активной вкладки */}
            {currentView === item.id && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-emerald-600 rounded-full"></div>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;