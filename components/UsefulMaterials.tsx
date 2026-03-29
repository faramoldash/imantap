
import React, { useState } from 'react';
import { Language, ViewType } from '../src/types/types';
import { TRANSLATIONS, USEFUL_MATERIALS } from '../constants';
import { haptics } from '../src/utils/haptics';

interface UsefulMaterialsProps {
  language: Language;
  setView: (view: ViewType) => void;
}

const UsefulMaterials: React.FC<UsefulMaterialsProps> = ({ language, setView }) => {
  const t = TRANSLATIONS[language];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState(16);

  const selectedMaterial = USEFUL_MATERIALS.find(m => m.id === selectedId);

  const handleNext = () => {
    const currentIndex = USEFUL_MATERIALS.findIndex(m => m.id === selectedId);
    const nextIndex = (currentIndex + 1) % USEFUL_MATERIALS.length;
    setSelectedId(USEFUL_MATERIALS[nextIndex].id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = (content: string) => {
    // Splits by double newlines for paragraph separation
    return content.split(/\n/).map((paragraph, idx) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return <div key={idx} className="h-4" />;

      // Handle Headings (###)
      if (trimmed.startsWith('###')) {
        const text = trimmed.replace(/^###\s*/, '').trim();
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return (
            <h3 key={idx} className="text-xl font-black text-primary mt-8 mb-4">
                {parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <span key={i}>{part.slice(2, -2)}</span>;
                    }
                    return part;
                })}
            </h3>
        );
      }
      
      // Handle Paragraphs with Bold markers (**text**)
      const parts = paragraph.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className="mb-4 leading-relaxed">
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              // Extract text between stars and wrap in strong tag with black weight
              return <strong key={i} className="font-black text-primary">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  if (selectedMaterial) {
    return (
      <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between sticky top-0 z-40 bg-surface/80 backdrop-blur-md py-4">
          <button
            onClick={() => setSelectedId(null)}
            className="bg-card p-3 rounded-2xl shadow-sm border border-default font-bold text-xs text-secondary uppercase tracking-tighter"
          >
            ← {t.backToList}
          </button>
          <div className="flex items-center bg-card rounded-2xl border border-default p-1 shadow-sm">
             <button
                onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                className="w-10 h-10 flex items-center justify-center font-black text-secondary border-r border-default"
             >A-</button>
             <button
                onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
                className="w-10 h-10 flex items-center justify-center font-black text-primary"
             >A+</button>
          </div>
        </div>

        <article className="bg-card rounded-[3rem] p-8 shadow-2xl border border-default relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
             <span className="text-9xl">{selectedMaterial.icon}</span>
          </div>

          <h2 className="text-2xl font-black text-primary mb-8 leading-tight relative z-10">
            {language === 'ru' ? selectedMaterial.title_ru : selectedMaterial.title_kk}
          </h2>

          <div 
            className="prose text-secondary whitespace-pre-wrap relative z-10"
            style={{ fontSize: `${fontSize}px` }}
          >
            {renderContent(language === 'ru' ? selectedMaterial.content_ru : selectedMaterial.content_kk)}
          </div>

          <div className="mt-12 pt-8 border-t border-default flex justify-center">
             <button
               onClick={handleNext}
               className="btn-primary px-8 py-4 rounded-[2rem] font-black text-sm shadow-xl active:scale-95 transition-all"
             >
               {t.nextArticle} →
             </button>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-card p-6 rounded-[2rem] shadow-sm border border-default">
        <h2 className="text-2xl font-black text-primary">{t.usefulTitle}</h2>
      </div>

      <div 
        onClick={() => {
          haptics.selection();
          setView('dashboard');
        }}
        className="bg-gradient-to-br from-amber-400 to-amber-600 p-6 rounded-[2.5rem] shadow-lg shadow-amber-100 text-white flex items-center justify-between cursor-pointer active:scale-95 transition-all"
      >
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-2xl text-2xl">📜</div>
          <div>
            <h3 className="font-black text-lg">{t.namesTitle}</h3>
            <p className="text-xs text-amber-50">Выучите за этот Рамазан</p>
          </div>
        </div>
        <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black">СТАРТ</div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {USEFUL_MATERIALS.map((item) => (
          <div 
            key={item.id}
            onClick={() => {
              setSelectedId(item.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="bg-card p-6 rounded-[2.5rem] border border-default shadow-sm flex items-start space-x-4 active:scale-[0.98] transition-all cursor-pointer group"
          >
            <div className="p-4 bg-surface rounded-2xl text-2xl group-hover:bg-brand-tint transition-colors">
              {item.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-black text-primary text-lg mb-1">
                {language === 'ru' ? item.title_ru : item.title_kk}
              </h3>
              <p className="text-secondary text-sm leading-relaxed line-clamp-2">
                {language === 'ru' ? item.desc_ru : item.desc_kk}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsefulMaterials;
