import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UserData, Language, GoalCategoryId, DailyGoalRecord, CustomGoalItem } from '../src/types/types';
import {
  TRANSLATIONS,
  GOAL_CATEGORIES,
  GoalCategory,
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

// ─ XP анимация ──────────────────────────────────
const XpFloatAnim: React.FC<{ xp: number; onDone: () => void }> = ({ xp, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 1400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="pointer-events-none fixed z-[200] left-1/2"
      style={{ top: '38%', animation: 'xpFloat 1.4s ease-out forwards', transform: 'translateX(-50%)' }}
    >
      <span className="text-2xl font-black text-emerald-500 drop-shadow-lg">+{xp} XP ✨</span>
    </div>
  );
};

// ─ MAIN ─────────────────────────────────────
const TasksList: React.FC<TasksListProps> = ({ language, userData, setUserData }) => {
  const t = TRANSLATIONS[language];
  const today = getTodayStr();

  // Какая категория развёрнута (inline)
  const [expandedId, setExpandedId] = useState<GoalCategoryId | null>(null);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [floatXp, setFloatXp] = useState<number | null>(null);

  // ref на input развёрнутой категории
  const inputRef = useRef<HTMLInputElement>(null);
  // ref на развёрнутый блок
  const expandedRef = useRef<HTMLDivElement>(null);

  // При раскрытии — скроллим блок в видимость
  useEffect(() => {
    if (expandedId && expandedRef.current) {
      setTimeout(() => {
        expandedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 120);
    }
  }, [expandedId]);

  // Записи за сегодня
  const todayRecords = useMemo(
    () => getTodayGoalRecords(userData.dailyGoalRecords, today),
    [userData.dailyGoalRecords, today]
  );

  const doneCount = todayRecords.filter(r => r.completed).length;
  const totalXpToday = todayRecords
    .filter(r => r.completed)
    .reduce((s, r) => s + r.xpEarned, 0);
  const progressPct = Math.round((doneCount / GOAL_CATEGORIES.length) * 100);

  // ─ Выбрать шаблон / кастомную цель
  const handleSelect = (categoryId: GoalCategoryId, goalId: string, goalText: string, xp: number) => {
    const rec = getTodayCategoryRecord(userData.dailyGoalRecords, today, categoryId);
    if (rec?.completed) return;
    const updated = [
      ...todayRecords.filter(r => r.categoryId !== categoryId),
      { categoryId, goalId, goalText, completed: false, xpEarned: xp } as DailyGoalRecord,
    ];
    setUserData(prev => ({
      ...(prev as UserData),
      dailyGoalRecords: { ...(prev as UserData).dailyGoalRecords, [today]: updated },
    }) as UserData);
    // Свернём блок чтобы видеть выбранную цель + кнопку «Орындадым»
    setTimeout(() => {
      expandedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  };

  // ─ Отметить выполненной
  const handleComplete = (categoryId: GoalCategoryId) => {
    const rec = todayRecords.find(r => r.categoryId === categoryId);
    if (!rec || rec.completed) return;
    const updated = todayRecords.map(r =>
      r.categoryId === categoryId
        ? { ...r, completed: true, completedAt: new Date().toISOString() }
        : r
    );
    setUserData(prev => ({
      ...(prev as UserData),
      xp: ((prev as UserData).xp || 0) + rec.xpEarned,
      dailyGoalRecords: { ...(prev as UserData).dailyGoalRecords, [today]: updated },
    }) as UserData);
    setFloatXp(rec.xpEarned);
    setExpandedId(null);
  };

  // ─ Добавить кастомную
  const handleAddCustom = (categoryId: GoalCategoryId) => {
    const text = (customInputs[categoryId] ?? '').trim();
    if (!text) return;
    const newItem: CustomGoalItem = {
      id: `custom-${Date.now()}`,
      text,
      xp: 30,
      categoryId,
    };
    setUserData(prev => ({
      ...(prev as UserData),
      goalCustomItems: {
        ...((prev as UserData).goalCustomItems ?? {}),
        [categoryId]: [...((prev as UserData).goalCustomItems?.[categoryId] ?? []), newItem],
      },
    }) as UserData);
    setCustomInputs(prev => ({ ...prev, [categoryId]: '' }));
  };

  // ─ Удалить кастомную
  const handleDeleteCustom = (categoryId: GoalCategoryId, itemId: string) => {
    setUserData(prev => ({
      ...(prev as UserData),
      goalCustomItems: {
        ...((prev as UserData).goalCustomItems ?? {}),
        [categoryId]: ((prev as UserData).goalCustomItems?.[categoryId] ?? []).filter(
          i => i.id !== itemId
        ),
      },
    }) as UserData);
  };

  const getRecord = (catId: GoalCategoryId) =>
    getTodayCategoryRecord(userData.dailyGoalRecords, today, catId);

  const getStreak = (catId: GoalCategoryId) =>
    (userData.goalStreaks as Record<string, number> | undefined)?.[catId] ?? 0;

  return (
    <div className="pb-24 pt-2 space-y-3">
      <style>{`
        @keyframes xpFloat {
          0%   { opacity:1; transform:translateX(-50%) translateY(0) scale(1.2); }
          70%  { opacity:1; transform:translateX(-50%) translateY(-60px) scale(1); }
          100% { opacity:0; transform:translateX(-50%) translateY(-90px) scale(0.8); }
        }
        @keyframes expandDown {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .habit-expand { animation: expandDown 0.18s ease-out; }
      `}</style>

      {floatXp !== null && <XpFloatAnim xp={floatXp} onDone={() => setFloatXp(null)} />}

      {/* ─── ЗАГОЛОВОК ─── */}
      <div className="px-1">
        <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">
          {language === 'kk' ? 'Күнделікті мақсаттар' : 'Ежедневные цели'}
        </h2>
        {/* Прогресс-бар */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPct}%`,
                background:
                  progressPct === 100
                    ? 'linear-gradient(90deg,#10b981,#059669)'
                    : progressPct > 50
                    ? 'linear-gradient(90deg,#f59e0b,#10b981)'
                    : 'linear-gradient(90deg,#fbbf24,#f59e0b)',
              }}
            />
          </div>
          <span className="text-[11px] font-black text-slate-400 shrink-0">
            {doneCount}/{GOAL_CATEGORIES.length}
          </span>
          {totalXpToday > 0 && (
            <span className="text-[11px] font-black text-emerald-500 shrink-0">+{totalXpToday} XP</span>
          )}
        </div>
      </div>

      {/* ─── СПИСОК ─── */}
      <div className="bg-white rounded-[1.8rem] border border-slate-100 shadow-sm overflow-hidden">
        {GOAL_CATEGORIES.map((cat, idx) => {
          const rec = getRecord(cat.id);
          const isDone = rec?.completed === true;
          const isSelected = !!rec && !rec.completed;
          const isOpen = expandedId === cat.id;
          const streak = getStreak(cat.id);
          const customItems: CustomGoalItem[] =
            userData.goalCustomItems?.[cat.id] ?? [];
          const isLast = idx === GOAL_CATEGORIES.length - 1;

          return (
            <div key={cat.id}>
              {/* ─ ROW ─ */}
              <div
                className={`relative transition-colors ${
                  isDone ? 'bg-emerald-50/60' : isSelected ? 'bg-amber-50/60' : 'bg-white'
                }`}
              >
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-slate-50 transition-colors text-left"
                  onPointerDown={() => {
                    if (isDone) return;
                    setExpandedId(isOpen ? null : cat.id);
                  }}
                >
                  {/* Круг-иконка */}
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
                      isDone
                        ? 'bg-emerald-100'
                        : isSelected
                        ? 'bg-amber-100'
                        : 'bg-slate-100'
                    }`}
                  >
                    {isDone ? '✅' : cat.icon}
                  </div>

                  {/* Текст */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-[13px] font-bold leading-tight ${
                        isDone ? 'text-emerald-700 line-through' : 'text-slate-800'
                      }`}>
                        {language === 'kk' ? cat.name_kk : cat.name_ru}
                      </p>
                      {streak > 0 && (
                        <span className="text-[10px] font-black text-orange-500">🔥{streak}</span>
                      )}
                    </div>
                    {isDone && rec && (
                      <p className="text-[11px] text-emerald-600 font-medium mt-0.5 truncate">
                        {rec.goalText}
                      </p>
                    )}
                    {isSelected && rec && (
                      <p className="text-[11px] text-amber-600 font-medium mt-0.5 truncate">
                        {rec.goalText}
                      </p>
                    )}
                    {!isDone && !isSelected && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {language === 'kk' ? 'Мақсат таңдаңыз' : 'Выберите цель'}
                      </p>
                    )}
                  </div>

                  {/* Правая часть */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isSelected && rec && (
                      <button
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          handleComplete(cat.id);
                        }}
                        className="bg-emerald-500 text-white text-[11px] font-black px-3 py-1.5 rounded-xl active:scale-95 transition-all shadow-sm"
                      >
                        {t.goalsDoneBtn || 'Орындадым'}
                      </button>
                    )}
                    {isDone && rec && (
                      <span className="text-[11px] font-black text-emerald-500">+{rec.xpEarned} XP</span>
                    )}
                    {!isDone && (
                      <span className={`text-slate-300 text-sm transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}>⌄</span>
                    )}
                  </div>
                </button>

                {/* ─ РАЗВЁРНУТАЯ ПАНЕЛЬ ─ */}
                {isOpen && !isDone && (
                  <div
                    ref={expandedRef}
                    className="habit-expand px-4 pb-4 space-y-4"
                  >
                    {/* Выбранная цель */}
                    {isSelected && rec && (
                      <div className="flex items-start justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-amber-500 uppercase tracking-wider mb-1">
                            {language === 'kk' ? 'Таңдалған мақсат' : 'Выбранная цель'}
                          </p>
                          <p className="text-[13px] font-semibold text-slate-800 leading-snug">{rec.goalText}</p>
                        </div>
                        <button
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            handleComplete(cat.id);
                          }}
                          className="bg-emerald-500 text-white text-[12px] font-black px-4 py-2 rounded-xl active:scale-95 shrink-0 shadow-sm"
                        >
                          {t.goalsDoneBtn || 'Орындадым'}
                        </button>
                      </div>
                    )}

                    {/* Шаблоны */}
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                        {language === 'kk' ? 'Шаблондар' : 'Шаблоны'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {cat.templates.map((tmpl: GoalTemplate) => {
                          const chosen = rec?.goalId === tmpl.id;
                          return (
                            <button
                              key={tmpl.id}
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                handleSelect(
                                  cat.id,
                                  tmpl.id,
                                  language === 'kk' ? tmpl.text_kk : tmpl.text_ru,
                                  tmpl.xp
                                );
                              }}
                              className={`px-3 py-2 rounded-2xl border text-[12px] font-semibold transition-all active:scale-95 text-left ${
                                chosen
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 active:bg-emerald-50 active:border-emerald-300'
                              }`}
                              style={{ maxWidth: '60%' }}
                            >
                              <span className="block leading-snug">
                                {language === 'kk' ? tmpl.text_kk : tmpl.text_ru}
                              </span>
                              <span className={`text-[10px] font-black mt-0.5 block ${
                                chosen ? 'text-white/80' : 'text-emerald-600'
                              }`}>
                                +{tmpl.xp} XP
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Кастомные цели */}
                    {customItems.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                          {language === 'kk' ? 'Менің мақсаттарым' : 'Мои цели'}
                        </p>
                        <div className="space-y-1.5">
                          {customItems.map(item => {
                            const chosen = rec?.goalId === item.id;
                            return (
                              <div
                                key={item.id}
                                className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl border ${
                                  chosen ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <button
                                  className="flex-1 text-left"
                                  onPointerDown={(e) => {
                                    e.stopPropagation();
                                    handleSelect(cat.id, item.id, item.text, item.xp);
                                  }}
                                >
                                  <span className={`text-[13px] font-semibold block ${
                                    chosen ? 'text-emerald-800' : 'text-slate-700'
                                  }`}>{item.text}</span>
                                  <span className="text-[10px] font-black text-emerald-600">+{item.xp} XP</span>
                                </button>
                                <button
                                  onPointerDown={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCustom(cat.id, item.id);
                                  }}
                                  className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-[10px] active:scale-90 shrink-0"
                                >✕</button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Добавить свою цель */}
                    <div className="flex gap-2">
                      <input
                        ref={expandedId === cat.id ? inputRef : undefined}
                        type="text"
                        value={customInputs[cat.id] ?? ''}
                        onChange={e =>
                          setCustomInputs(prev => ({ ...prev, [cat.id]: e.target.value }))
                        }
                        onKeyPress={e => e.key === 'Enter' && handleAddCustom(cat.id)}
                        onFocus={() => {
                          setTimeout(() => {
                            expandedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                          }, 300);
                        }}
                        placeholder={
                          language === 'kk' ? 'Өз мақсатыңызды жазыңыз...' : 'Своя цель...'
                        }
                        className="flex-1 bg-slate-100 border border-transparent rounded-2xl px-4 py-2.5 text-[13px] outline-none focus:border-emerald-300 transition-colors"
                      />
                      <button
                        onPointerDown={(e) => {
                          e.preventDefault();
                          handleAddCustom(cat.id);
                        }}
                        className="bg-emerald-500 text-white w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-black active:scale-90 shrink-0"
                      >+</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Разделитель */}
              {!isLast && (
                <div className="h-px bg-slate-100 mx-4" />
              )}
            </div>
          );
        })}
      </div>

      {/* ─── EMPTY STATE ─── */}
      {todayRecords.length === 0 && (
        <div className="text-center py-6 px-4">
          <p className="text-2xl mb-2">🎯</p>
          <p className="text-[13px] font-semibold text-slate-400">
            {language === 'kk'
              ? 'Жоғары басыңыз — бірінші мақсатты таңдаңыз'
              : 'Нажмите на пункт, чтобы выбрать цель'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TasksList;
