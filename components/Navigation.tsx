
import React from 'react';
import { ViewType, Language } from '../types';
import { TRANSLATIONS } from '../constants';

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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center h-20 px-2 pb-4 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] overflow-x-auto no-scrollbar">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id)}
          className={`flex flex-col items-center justify-center space-y-1 transition-all flex-shrink-0 min-w-[64px] ${
            currentView === item.id ? 'text-emerald-600 scale-105' : 'text-slate-400'
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          <span className="text-[8px] font-bold uppercase tracking-tight text-center">{item.label}</span>
          {currentView === item.id && (
            <div className="w-1 h-1 bg-emerald-600 rounded-full mt-1"></div>
          )}
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
