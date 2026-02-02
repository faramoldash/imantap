
import React, { useState } from 'react';
import { Language, UserData } from '../src/types/types';
import { TRANSLATIONS, NAMES_99 } from '../constants';

interface NamesMemorizerProps {
  language: Language;
  userData: UserData;
  setUserData: (data: UserData) => void;
}

const NamesMemorizer: React.FC<NamesMemorizerProps> = ({ language, userData, setUserData }) => {
  const t = TRANSLATIONS[language];
  const [filter, setFilter] = useState<'all' | 'learning' | 'learned'>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const memorizedCount = userData.memorizedNames?.length || 0;
  const progressPercent = Math.round((memorizedCount / 99) * 100);

  const toggleMemorized = (id: number) => {
    const current = userData.memorizedNames || [];
    let next: number[];
    if (current.includes(id)) {
      next = current.filter(x => x !== id);
    } else {
      next = [...current, id];
    }
    setUserData({ ...userData, memorizedNames: next });
  };

  const isNameVisible = (id: number) => {
    const isMemorized = userData.memorizedNames?.includes(id);
    if (filter === 'learned') return isMemorized;
    if (filter === 'learning') return !isMemorized;
    return true;
  };

  // We no longer separate the first name. All names are treated equally in the grid.
  const visibleNames = NAMES_99.filter(n => isNameVisible(n.id));
  const selectedName = NAMES_99.find(n => n.id === selectedId);

  const goToNextName = () => {
     if (selectedId === null) return;
     // Find current index in the full list to determine next ID
     const currentIndex = NAMES_99.findIndex(n => n.id === selectedId);
     if (currentIndex !== -1 && currentIndex < NAMES_99.length - 1) {
         setSelectedId(NAMES_99[currentIndex + 1].id);
     } else {
         // Loop back to start or close? Let's close if it's the last one.
         setSelectedId(null); 
     }
  };

  const hasNext = selectedId !== null && selectedId < 99;

  return (
    <div className="space-y-6 pb-24 pt-4">
      {/* Header with Stats */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <span className="text-8xl">🕌</span>
        </div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black mb-1 leading-tight">{t.namesTitle}</h2>
            <p className="text-emerald-400 font-black tracking-widest text-xs uppercase">{memorizedCount} / 99 {t.namesMemorized}</p>
          </div>
          <div className="relative w-20 h-20">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle 
                cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="10" 
                strokeDasharray={2 * Math.PI * 40} 
                strokeDashoffset={2 * Math.PI * 40 * (1 - progressPercent / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-in-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span className="text-base font-black leading-none">{progressPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-100 shadow-sm sticky top-2 z-30 backdrop-blur-md bg-white/90">
        {(['all', 'learning', 'learned'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-3 text-[10px] font-black rounded-2xl transition-all ${
              filter === f ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'
            } uppercase tracking-widest`}
          >
            {f === 'all' ? 'БАРЛЫҒЫ' : f === 'learning' ? t.namesStatusToLearn : t.namesStatusLearned}
          </button>
        ))}
      </div>

      {/* Names Grid - 3 columns for ALL items */}
      <div className="grid grid-cols-3 gap-3">
        {visibleNames.map((item) => {
          const isMemorized = userData.memorizedNames?.includes(item.id);

          return (
            <div 
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`p-4 rounded-[1.8rem] border transition-all relative overflow-hidden cursor-pointer h-24 flex flex-col items-center justify-center ${
                isMemorized 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-900' 
                  : 'bg-white border-slate-100 shadow-sm hover:border-emerald-200'
              } active:scale-95`}
            >
              <div className="text-center w-full flex flex-col items-center justify-center h-full">
                <span className="text-xl font-serif block text-emerald-900 leading-none mb-1 px-1 w-full truncate">{item.arabic}</span>
                <span className="text-[7px] font-black text-slate-400 block uppercase tracking-tighter leading-tight px-0.5 w-full break-words whitespace-normal line-clamp-2">
                  {item.translit}
                </span>
              </div>
              {isMemorized && (
                <div className="absolute top-1.5 right-1.5 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center text-[7px] text-white shadow-sm border border-white">✓</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Name Details Modal Overlay */}
      {selectedId && selectedName && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200"
          onClick={() => setSelectedId(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
          
          {/* Card */}
          <div 
            className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl relative z-10 animate-in zoom-in slide-in-from-bottom-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedId(null)}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full font-black text-xl active:scale-90 transition-transform"
            >
              ✕
            </button>

            <div className="text-center space-y-6 mt-4">
              <div className="bg-emerald-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-2 text-2xl font-black text-emerald-600 shadow-inner">
                {selectedName.id}
              </div>
              
              <div className="space-y-2">
                <span className="text-6xl font-serif block text-emerald-900 leading-none">
                  {selectedName.arabic}
                </span>
                <span className="text-sm font-black text-emerald-600 uppercase tracking-[0.2em]">
                  {selectedName.translit}
                </span>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <p className="text-base font-bold text-slate-800 leading-relaxed">
                  {selectedName.meaning}
                </p>
              </div>

              <div className="space-y-3">
                  <button
                    onClick={() => {
                      toggleMemorized(selectedName.id);
                    }}
                    className={`w-full py-5 rounded-[1.8rem] text-sm font-black transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-2 ${
                      userData.memorizedNames?.includes(selectedName.id)
                        ? 'bg-red-50 text-red-600 border border-red-100'
                        : 'bg-emerald-600 text-white shadow-emerald-200'
                    }`}
                  >
                    <span>{userData.memorizedNames?.includes(selectedName.id) ? t.namesUnmark : t.namesButton}</span>
                    {userData.memorizedNames?.includes(selectedName.id) ? <span>✕</span> : <span>✓</span>}
                  </button>
                  
                  {/* Show "Next Name" button if the current one is memorized and there is a next one */}
                  {userData.memorizedNames?.includes(selectedName.id) && hasNext && (
                      <button
                        onClick={goToNextName}
                        className="w-full py-4 rounded-[1.8rem] text-sm font-black bg-slate-900 text-white shadow-lg active:scale-95 transition-transform flex items-center justify-center space-x-2"
                      >
                         <span>{t.namesNext}</span>
                         <span>→</span>
                      </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NamesMemorizer;
