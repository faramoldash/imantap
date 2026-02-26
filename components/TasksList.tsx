import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { UserData, Language, GoalCategoryId, DailyGoalRecord, CustomGoalItem } from '../src/types/types';
import {
  TRANSLATIONS,
  GOAL_CATEGORIES,
  GoalTemplate,
  getTodayCategoryRecord,
  getTodayGoalRecords,
} from '../constants';

interface TasksListProps {
  language: Language;
  userData: UserData;
  setUserData: (data: UserData | ((prev: UserData) => UserData)) => void;
}

function getTodayStr(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Date().toLocaleDateString('en-CA', { timeZone: tz });
}

const XpFloatAnim: React.FC<{ xp: number; onDone: () => void }> = ({ xp, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 1400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="pointer-events-none fixed z-[200] left-1/2"
      style={{ top: '35%', animation: 'xpFloat 1.4s ease-out forwards', transform: 'translateX(-50%)' }}
    >
      <span className="text-3xl font-black text-emerald-500 drop-shadow-lg">+{xp} XP ✨</span>
    </div>
  );
};

// ─── Чип шаблона ───
// Отдельный компонент, чтобы работала обработка нажатия
const TemplateChip: React.FC<{
  label: string;
  xp: number;
  chosen: boolean;
  onSelect: () => void;
}> = ({ label, xp, chosen, onSelect }) => {
  const touchStarted = useRef(false);
  const touchMoved = useRef(false);

  return (
    <div
      className={`px-3.5 py-2.5 rounded-2xl border cursor-pointer select-none transition-all ${
        chosen
          ? 'bg-emerald-500 border-emerald-500 shadow-sm'
          : 'bg-white border-slate-200 active:bg-emerald-50 active:border-emerald-300'
      }`}
      style={{ maxWidth: '70%' }}
      // touchstart — запоминаем начало касания, сбрасываем флаг движения
      onTouchStart={() => {
        touchStarted.current = true;
        touchMoved.current = false;
      }}
      // touchmove — если пользователь скроллит — выходим
      onTouchMove={() => {
        touchMoved.current = true;
      }}
      // touchend — если не было движения — вызываем обработчик
      onTouchEnd={(e) => {
        if (touchStarted.current && !touchMoved.current) {
          e.preventDefault(); // предотвращаем ghost click
          onSelect();
        }
        touchStarted.current = false;
        touchMoved.current = false;
      }}
      // для десктопа
      onClick={() => {
        onSelect();
      }}
    >
      <p className={`text-[13px] font-semibold leading-snug ${
        chosen ? 'text-white' : 'text-slate-700'
      }`}>{label}</p>
      <p className={`text-[11px] font-black mt-0.5 ${
        chosen ? 'text-white/80' : 'text-emerald-600'
      }`}>+{xp} XP</p>
    </div>
  );
};

// ─── ROW ───
const HabitRow: React.FC<{
  cat: typeof GOAL_CATEGORIES[0];
  language: Language;
  rec?: DailyGoalRecord;
  customItems: CustomGoalItem[];
  customInputVal: string;
  streak: number;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (goalId: string, goalText: string, xp: number) => void;
  onComplete: () => void;
  onAddCustom: () => void;
  onDeleteCustom: (id: string) => void;
  onCustomInputChange: (val: string) => void;
  t: any;
}> = ({
  cat, language, rec, customItems, customInputVal, streak,
  isOpen, onToggle, onSelect, onComplete, onAddCustom, onDeleteCustom, onCustomInputChange, t
}) => {
  const isDone = rec?.completed === true;
  const isSelected = !!rec && !rec.completed;
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && panelRef.current) {
      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    }
  }, [isOpen]);

  // Обработка нажатия на строку — только onClick,
  // чтобы не срабатывало при скролле
  const rowTouchStartY = useRef(0);
  const rowTouchMoved = useRef(false);

  return (
    <div>
      {/* ROW */}
      <div
        className={`flex items-center gap-3 px-4 py-4 transition-colors ${
          isDone ? 'bg-emerald-50/50' : isSelected ? 'bg-amber-50/40' : 'bg-white'
        } ${!isDone ? 'cursor-pointer' : ''}`}
        onTouchStart={(e) => {
          rowTouchStartY.current = e.touches[0].clientY;
          rowTouchMoved.current = false;
        }}
        onTouchMove={(e) => {
          if (Math.abs(e.touches[0].clientY - rowTouchStartY.current) > 8) {
            rowTouchMoved.current = true;
          }
        }}
        onTouchEnd={() => {
          if (!rowTouchMoved.current && !isDone) {
            onToggle();
          }
        }}
        onClick={() => {
          // в браузере (desktop)
          if (!isDone) onToggle();
        }}
      >
        {/* Иконка */}
        <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center text-xl shrink-0 ${
          isDone ? 'bg-emerald-100' : isSelected ? 'bg-amber-100' : 'bg-slate-100'
        }`}>
          {isDone ? '✅' : cat.icon}
        </div>

        {/* Текст */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[14px] font-bold ${
              isDone ? 'text-slate-400 line-through' : 'text-slate-800'
            }`}>
              {language === 'kk' ? cat.name_kk : cat.name_ru}
            </span>
            {streak > 0 && (
              <span className="text-[11px] font-bold text-orange-400">🔥 {streak}</span>
            )}
          </div>
          <div className="mt-0.5">
            {isDone && rec && (
              <span className="text-[12px] text-emerald-600 font-medium">{rec.goalText}</span>
            )}
            {isSelected && rec && (
              <span className="text-[12px] text-amber-600 font-medium truncate block">{rec.goalText}</span>
            )}
            {!isDone && !isSelected && (
              <span className="text-[12px] text-slate-400">
                {language === 'kk' ? 'Таңдау →' : 'Выбрать →'}
              </span>
            )}
          </div>
        </div>

        {/* Правая часть */}
        <div className="shrink-0">
          {isDone && rec && (
            <span className="text-[12px] font-black text-emerald-500">+{rec.xpEarned} XP</span>
          )}
          {isSelected && (
            <button
              className="bg-emerald-500 text-white text-[12px] font-black px-3.5 py-2 rounded-2xl active:opacity-80 shadow-sm"
              onClick={(e) => { e.stopPropagation(); onComplete(); }}
              onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onComplete(); }}
            >
              {t.goalsDoneBtn || 'Орындадым'}
            </button>
          )}
          {!isDone && !isSelected && (
            <span className={`text-slate-300 text-lg leading-none transition-transform duration-200 inline-block ${
              isOpen ? '-rotate-180' : ''
            }`}>›</span>
          )}
        </div>
      </div>

      {/* ── РАЗВЁРНУТАЯ ПАНЕЛЬ ── */}
      {isOpen && !isDone && (
        <div ref={panelRef} className="px-4 pb-5 space-y-5 bg-slate-50/80 border-t border-slate-100">

          {/* Выбранная цель + кнопка Done */}
          {isSelected && rec && (
            <div className="pt-4">
              <div className="bg-white border border-amber-200 rounded-[1.4rem] px-4 py-3.5 flex items-start gap-3 shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">
                    {language === 'kk' ? '✅ Таңдалған мақсат' : '✅ Выбранная цель'}
                  </p>
                  <p className="text-[13px] font-semibold text-slate-800 leading-snug">{rec.goalText}</p>
                  <p className="text-[11px] font-black text-amber-600 mt-1">+{rec.xpEarned} XP</p>
                </div>
                <button
                  className="bg-emerald-500 text-white text-[13px] font-black px-4 py-2.5 rounded-[14px] active:opacity-80 shadow-sm shrink-0"
                  onClick={(e) => { e.stopPropagation(); onComplete(); }}
                  onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onComplete(); }}
                >
                  {t.goalsDoneBtn || 'Орындадым'}
                </button>
              </div>
            </div>
          )}

          {/* Шаблоны */}
          <div className={isSelected ? '' : 'pt-4'}>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
              {language === 'kk' ? 'Шаблондар' : 'Шаблоны'}
            </p>
            <div className="flex flex-wrap gap-2">
              {cat.templates.map((tmpl: GoalTemplate) => (
                <TemplateChip
                  key={tmpl.id}
                  label={language === 'kk' ? tmpl.text_kk : tmpl.text_ru}
                  xp={tmpl.xp}
                  chosen={rec?.goalId === tmpl.id}
                  onSelect={() => onSelect(tmpl.id, language === 'kk' ? tmpl.text_kk : tmpl.text_ru, tmpl.xp)}
                />
              ))}
            </div>
          </div>

          {/* Кастомные */}
          {customItems.length > 0 && (
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                {language === 'kk' ? 'Менің мақсаттарым' : 'Мои цели'}
              </p>
              <div className="space-y-2">
                {customItems.map(item => {
                  const chosen = rec?.goalId === item.id;
                  return (
                    <TemplateChip
                      key={item.id}
                      label={item.text}
                      xp={item.xp}
                      chosen={chosen}
                      onSelect={() => onSelect(item.id, item.text, item.xp)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Input */}
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
              {language === 'kk' ? 'Өз мақсатыңызды қос' : 'Своя цель'}
            </p>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={customInputVal}
                onChange={e => onCustomInputChange(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && onAddCustom()}
                onFocus={() => {
                  setTimeout(() => {
                    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 350);
                }}
                placeholder={language === 'kk' ? 'Мақсат жазыңыз...' : 'Напишите цель...'}
                className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-[13px] outline-none focus:border-emerald-400 transition-colors"
              />
              <button
                className="bg-emerald-500 text-white w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-black active:opacity-80 shrink-0"
                onClick={onAddCustom}
                onTouchEnd={(e) => { e.preventDefault(); onAddCustom(); }}
              >+</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN ───
const TasksList: React.FC<TasksListProps> = ({ language, userData, setUserData }) => {
  const t = TRANSLATIONS[language];
  const today = getTodayStr();

  const [expandedId, setExpandedId] = useState<GoalCategoryId | null>(null);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [floatXp, setFloatXp] = useState<number | null>(null);

  const todayRecords = useMemo(
    () => getTodayGoalRecords(userData.dailyGoalRecords, today),
    [userData.dailyGoalRecords, today]
  );

  const doneCount = todayRecords.filter(r => r.completed).length;
  const totalXpToday = todayRecords.filter(r => r.completed).reduce((s, r) => s + r.xpEarned, 0);
  const progressPct = Math.round((doneCount / GOAL_CATEGORIES.length) * 100);

  const handleToggle = useCallback((catId: GoalCategoryId) => {
    setExpandedId(prev => (prev === catId ? null : catId));
  }, []);

  const handleSelect = useCallback((catId: GoalCategoryId, goalId: string, goalText: string, xp: number) => {
    const rec = getTodayCategoryRecord(userData.dailyGoalRecords, today, catId);
    if (rec?.completed) return;
    const records = getTodayGoalRecords(userData.dailyGoalRecords, today);
    const updated = [
      ...records.filter(r => r.categoryId !== catId),
      { categoryId: catId, goalId, goalText, completed: false, xpEarned: xp } as DailyGoalRecord,
    ];
    setUserData(prev => ({
      ...(prev as UserData),
      dailyGoalRecords: { ...(prev as UserData).dailyGoalRecords, [today]: updated },
    }) as UserData);
  }, [userData.dailyGoalRecords, today, setUserData]);

  const handleComplete = useCallback((catId: GoalCategoryId) => {
    const records = getTodayGoalRecords(userData.dailyGoalRecords, today);
    const rec = records.find(r => r.categoryId === catId);
    if (!rec || rec.completed) return;
    const updated = records.map(r =>
      r.categoryId === catId ? { ...r, completed: true, completedAt: new Date().toISOString() } : r
    );
    setUserData(prev => ({
      ...(prev as UserData),
      xp: ((prev as UserData).xp || 0) + rec.xpEarned,
      dailyGoalRecords: { ...(prev as UserData).dailyGoalRecords, [today]: updated },
    }) as UserData);
    setFloatXp(rec.xpEarned);
    setExpandedId(null);
  }, [userData.dailyGoalRecords, today, setUserData]);

  const handleAddCustom = useCallback((catId: GoalCategoryId) => {
    const text = (customInputs[catId] ?? '').trim();
    if (!text) return;
    const newItem: CustomGoalItem = { id: `custom-${Date.now()}`, text, xp: 30, categoryId: catId };
    setUserData(prev => ({
      ...(prev as UserData),
      goalCustomItems: {
        ...((prev as UserData).goalCustomItems ?? {}),
        [catId]: [...((prev as UserData).goalCustomItems?.[catId] ?? []), newItem],
      },
    }) as UserData);
    setCustomInputs(prev => ({ ...prev, [catId]: '' }));
  }, [customInputs, setUserData]);

  const handleDeleteCustom = useCallback((catId: GoalCategoryId, itemId: string) => {
    setUserData(prev => ({
      ...(prev as UserData),
      goalCustomItems: {
        ...((prev as UserData).goalCustomItems ?? {}),
        [catId]: ((prev as UserData).goalCustomItems?.[catId] ?? []).filter(i => i.id !== itemId),
      },
    }) as UserData);
  }, [setUserData]);

  const getRecord = (catId: GoalCategoryId) =>
    getTodayCategoryRecord(userData.dailyGoalRecords, today, catId);
  const getStreak = (catId: GoalCategoryId) =>
    (userData.goalStreaks as Record<string, number> | undefined)?.[catId] ?? 0;

  return (
    <div className="pb-28 pt-1">
      <style>{`
        @keyframes xpFloat {
          0%   { opacity:1; transform:translateX(-50%) translateY(0) scale(1.2); }
          70%  { opacity:1; transform:translateX(-50%) translateY(-70px) scale(1); }
          100% { opacity:0; transform:translateX(-50%) translateY(-100px) scale(0.8); }
        }
      `}</style>

      {floatXp !== null && <XpFloatAnim xp={floatXp} onDone={() => setFloatXp(null)} />}

      {/* ─── ШАПКА ─── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[15px] font-black text-slate-800">
            {language === 'kk' ? 'Күнделікті мақсаттар' : 'Ежедневные цели'}
          </h2>
          <div className="flex items-center gap-2">
            {totalXpToday > 0 && (
              <span className="bg-emerald-50 text-emerald-600 text-[12px] font-black px-2.5 py-1 rounded-full border border-emerald-100">
                +{totalXpToday} XP
              </span>
            )}
            <span className="text-[13px] font-bold text-slate-400">
              {doneCount}/{GOAL_CATEGORIES.length}
            </span>
          </div>
        </div>
        {/* Прогресс-бар */}
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressPct}%`,
              background:
                progressPct === 100
                  ? 'linear-gradient(90deg,#10b981,#059669)'
                  : progressPct > 50
                  ? 'linear-gradient(90deg,#f59e0b,#10b981)'
                  : progressPct > 0
                  ? 'linear-gradient(90deg,#fbbf24,#f59e0b)'
                  : 'transparent',
            }}
          />
        </div>
      </div>

      {/* ─── ЛИСТ категорий ─── */}
      <div className="space-y-2">
        {GOAL_CATEGORIES.map((cat) => {
          const rec = getRecord(cat.id);
          const isOpen = expandedId === cat.id;
          const customItems: CustomGoalItem[] = userData.goalCustomItems?.[cat.id] ?? [];

          return (
            <div
              key={cat.id}
              className="bg-white rounded-[1.4rem] border border-slate-100 shadow-sm overflow-hidden"
            >
              <HabitRow
                cat={cat}
                language={language}
                rec={rec}
                customItems={customItems}
                customInputVal={customInputs[cat.id] ?? ''}
                streak={getStreak(cat.id)}
                isOpen={isOpen}
                onToggle={() => handleToggle(cat.id)}
                onSelect={(goalId, goalText, xp) => handleSelect(cat.id, goalId, goalText, xp)}
                onComplete={() => handleComplete(cat.id)}
                onAddCustom={() => handleAddCustom(cat.id)}
                onDeleteCustom={(id) => handleDeleteCustom(cat.id, id)}
                onCustomInputChange={(val) => setCustomInputs(prev => ({ ...prev, [cat.id]: val }))}
                t={t}
              />
            </div>
          );
        })}
      </div>

      {/* ─── Подсказка когда всё выполнено ─── */}
      {progressPct === 100 && (
        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-[1.4rem] p-5 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-black text-emerald-800 text-[15px]">
            {language === 'kk' ? 'Барлық мақсаттар орындалды!' : 'Все цели выполнены!'}
          </p>
          <p className="text-[12px] text-emerald-600 mt-1">+{totalXpToday} XP сегодня</p>
        </div>
      )}
    </div>
  );
};

export default TasksList;
