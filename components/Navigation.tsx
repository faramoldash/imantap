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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 will-change-transform">
      <div className="flex items-center justify-around max-w-md mx-auto pt-2 pb-6">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              haptics.selection();
              setView(item.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`
              flex flex-col items-center justify-center gap-1
              py-2 px-4 rounded-full transition-colors duration-200
              ${currentView === item.id 
                ? 'bg-slate-100' 
                : 'bg-transparent'
              }
            `}
          >
            {/* Иконка */}
            <span className={`text-[28px] leading-none ${
              currentView === item.id ? '' : 'opacity-50'
            }`}>
              {item.icon}
            </span>
            
            {/* Текст */}
            <span className={`text-[10px] font-semibold leading-none ${
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
