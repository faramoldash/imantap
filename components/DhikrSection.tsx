
import React from 'react';
import { Language } from '../src/types/types';
import { TRANSLATIONS, MORNING_DHIKRS, EVENING_DHIKRS } from '../constants';

const DhikrSection: React.FC<{ language: Language }> = ({ language }) => {
  const t = TRANSLATIONS[language];

  const renderDhikrList = (title: string, items: any[], icon: string) => (
    <div className="space-y-4 mb-8">
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <p className="text-2xl font-serif text-emerald-900 text-right leading-relaxed dir-rtl">
            {item.arabic}
          </p>
          <p className="text-xs text-emerald-600 italic">
            {item.translit}
          </p>
          <p className="text-sm text-slate-700 leading-relaxed pt-2 border-t border-slate-50">
            {language === 'ru' ? item.translation_ru : item.translation_kk}
          </p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="pb-10">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-6">
        <h2 className="text-2xl font-black text-slate-800">{t.dhikrPageTitle}</h2>
      </div>

      {renderDhikrList(t.dhikrMorningTitle, MORNING_DHIKRS, "🌅")}
      {renderDhikrList(t.dhikrEveningTitle, EVENING_DHIKRS, "🌃")}
    </div>
  );
};

export default DhikrSection;
