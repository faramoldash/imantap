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

// ─────────────────────────────────────────────
// XP анимация
// ─────────────────────────────────────────────
const XpFloat: React.FC<{ xp: number; onDone: () => void }> = ({ xp, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="pointer-events-none fixed z-[999] left-1/2"
      style={{
        top: '40%',
        transform: 'translateX(-50%)',
        animation: 'xpPop 1.6s cubic-bezier(.22,1,.36,1) forwards',
      }}
    >
      <div className="bg-emerald-500 text-white font-black text-xl px-6 py-3 rounded-full shadow-xl shadow-emerald-200">
        +{xp} XP ✨
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Карточка категории (строка в списке)
// ─────────────────────────────────────────────
const CategoryRow: React.FC<{
  cat: typeof GOAL_CATEGORIES[0];
  language: Language;
  rec?: DailyGoalRecord;
  streak: number;
  onPress: () => void;
  onDone: () => void;
  t: any;
}> = ({ cat, language, rec, streak, onPress, onDone, t }) => {
  const isDone = rec?.completed === true;
  const isSelected = !!rec && !rec.completed;
  const name = language === 'kk' ? cat.name_kk : cat.name_ru;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: isDone
          ? 'linear-gradient(135deg,#ecfdf5,#f0fdf4)'
          : isSelected
          ? 'linear-gradient(135deg,#fffbeb,#fef3c7)'
          : '#ffffff',
        borderRadius: 20,
        border: isDone
          ? '1.5px solid #6ee7b7'
          : isSelected
          ? '1.5px solid #fcd34d'
          : '1.5px solid #f1f5f9',
        boxShadow: isDone
          ? '0 2px 12px rgba(16,185,129,0.08)'
          : isSelected
          ? '0 2px 12px rgba(245,158,11,0.08)'
          : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Декоративный круг */}
      <div
        className="absolute -right-4 -top-4 w-16 h-16 rounded-full pointer-events-none"
        style={{
          background: isDone ? '#d1fae5' : isSelected ? '#fef3c7' : '#f8fafc',
          opacity: 0.6,
        }}
      />

      <button
        type="button"
        className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left"
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        onClick={onPress}
      >
        {/* Иконка */}
        <div
          className="shrink-0 flex items-center justify-center text-xl"
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            background: isDone ? '#d1fae5' : isSelected ? '#fef3c7' : '#f8fafc',
          }}
        >
          {isDone ? '✅' : cat.icon}
        </div>

        {/* Текст */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-[14px]"
              style={{
                color: isDone ? '#059669' : '#0f172a',
                textDecoration: isDone ? 'line-through' : 'none',
                opacity: isDone ? 0.7 : 1,
              }}
            >
              {name}
            </span>
            {streak > 0 && (
              <span className="text-[11px] font-bold text-orange-400 shrink-0">
                🔥{streak}
              </span>
            )}
          </div>

          {isSelected && rec && (
            <p className="text-[12px] font-medium text-amber-700 mt-0.5 truncate leading-tight">
              {rec.goalText}
            </p>
          )}
          {isDone && rec && (
            <p className="text-[12px] font-medium text-emerald-600 mt-0.5 truncate leading-tight">
              {rec.goalText}
            </p>
          )}
          {!isDone && !isSelected && (
            <p className="text-[12px] text-slate-400 mt-0.5">
              {language === 'kk' ? 'Мақсат таңдаңыз' : 'Выберите цель'}
            </p>
          )}
        </div>

        {/* Правая часть */}
        <div className="shrink-0 flex items-center gap-2">
          {isDone && rec && (
            <span className="text-[12px] font-black text-emerald-500">
              +{rec.xpEarned} XP
            </span>
          )}
          {isSelected && (
            <button
              type="button"
              className="font-black text-[12px] text-white px-3.5 py-2 rounded-[12px]"
              style={{
                background: 'linear-gradient(135deg,#10b981,#059669)',
                boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onDone();
              }}
            >
              {t.goalsDoneBtn || 'Орындадым'}
            </button>
          )}
          {!isDone && !isSelected && (
            <div
              className="flex items-center justify-center text-slate-300"
              style={{ width: 28, height: 28, borderRadius: 8, background: '#f8fafc' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </div>
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────
// Bottom Sheet — выбор цели
// ─────────────────────────────────────────────
const GoalSheet: React.FC<{
  cat: typeof GOAL_CATEGORIES[0] | null;
  language: Language;
  rec?: DailyGoalRecord;
  customItems: CustomGoalItem[];
  customInputVal: string;
  onClose: () => void;
  onSelect: (goalId: string, goalText: string, xp: number) => void;
  onComplete: () => void;
  onAddCustom: () => void;
  onDeleteCustom: (id: string) => void;
  onCustomInputChange: (val: string) => void;
  t: any;
}> = ({
  cat, language, rec, customItems, customInputVal,
  onClose, onSelect, onComplete, onAddCustom, onDeleteCustom, onCustomInputChange, t,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const isDone = rec?.completed === true;
  const isSelected = !!rec && !rec.completed;

  // Блокируем скролл body пока шит открыт, не трогая его позицию
  useEffect(() => {
    if (!cat) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [cat]);

  const handleInputFocus = () => {
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
  };

  if (!cat) return null;

  const name = language === 'kk' ? cat.name_kk : cat.name_ru;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={sheetRef}
        className="w-full"
        style={{
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'sheetUp 0.28s cubic-bezier(.22,1,.36,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Шапка */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center text-2xl"
              style={{ width: 46, height: 46, borderRadius: 14, background: '#f8fafc' }}
            >
              {isDone ? '✅' : cat.icon}
            </div>
            <div>
              <p className="font-black text-slate-800 text-[16px]">{name}</p>
              {isDone
                ? <p className="text-[11px] font-semibold text-emerald-500">{language === 'kk' ? '✓ Орындалды' : '✓ Выполнено'}</p>
                : isSelected
                ? <p className="text-[11px] font-semibold text-amber-500">{language === 'kk' ? 'Мақсат таңдалды' : 'Цель выбрана'}</p>
                : <p className="text-[11px] text-slate-400">{language === 'kk' ? 'Мақсат таңдаңыз' : 'Выберите цель'}</p>
              }
            </div>
          </div>
          <button
            type="button"
            className="flex items-center justify-center font-bold text-slate-500 text-[14px]"
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: '#f1f5f9', touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
            onClick={onClose}
          >✕</button>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5" style={{ WebkitOverflowScrolling: 'touch' }}>

          {/* Если выполнено */}
          {isDone && rec && (
            <div
              className="rounded-[16px] p-5 text-center"
              style={{ background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '1.5px solid #6ee7b7' }}
            >
              <p className="text-4xl mb-2">🎉</p>
              <p className="font-black text-emerald-800 text-[15px] leading-snug">{rec.goalText}</p>
              <p className="text-[12px] font-black text-emerald-500 mt-2">+{rec.xpEarned} XP</p>
              <p className="text-[11px] text-slate-400 mt-2">
                {language === 'kk' ? 'Ертең жаңа мақсат таңдауға болады' : 'Завтра можно выбрать новую цель'}
              </p>
            </div>
          )}

          {/* Выбранная цель + кнопка Done */}
          {isSelected && rec && (
            <div
              className="rounded-[16px] p-4"
              style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1.5px solid #fcd34d' }}
            >
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">
                {language === 'kk' ? 'Таңдалған мақсат' : 'Выбранная цель'}
              </p>
              <p className="font-semibold text-slate-800 text-[14px] leading-snug mb-3">{rec.goalText}</p>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-black text-amber-600">+{rec.xpEarned} XP</span>
                <button
                  type="button"
                  className="font-black text-[13px] text-white px-5 py-2.5 rounded-[14px]"
                  style={{
                    background: 'linear-gradient(135deg,#10b981,#059669)',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onClick={onComplete}
                >
                  {t.goalsDoneBtn || 'Орындадым ✓'}
                </button>
              </div>
            </div>
          )}

          {/* Шаблоны */}
          {!isDone && (
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                {language === 'kk' ? 'Шаблондар' : 'Шаблоны'}
              </p>
              <div className="space-y-2">
                {cat.templates.map((tmpl: GoalTemplate) => {
                  const chosen = rec?.goalId === tmpl.id;
                  const label = language === 'kk' ? tmpl.text_kk : tmpl.text_ru;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      className="w-full text-left px-4 py-3 rounded-[14px] flex items-center justify-between gap-3 transition-all"
                      style={{
                        background: chosen
                          ? 'linear-gradient(135deg,#10b981,#059669)'
                          : '#f8fafc',
                        border: chosen ? '1.5px solid #10b981' : '1.5px solid #f1f5f9',
                        boxShadow: chosen ? '0 2px 10px rgba(16,185,129,0.2)' : 'none',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                      onClick={() => onSelect(tmpl.id, label, tmpl.xp)}
                    >
                      <span
                        className="text-[13px] font-semibold leading-snug flex-1"
                        style={{ color: chosen ? '#fff' : '#1e293b' }}
                      >
                        {label}
                      </span>
                      <span
                        className="text-[11px] font-black shrink-0"
                        style={{ color: chosen ? 'rgba(255,255,255,0.8)' : '#10b981' }}
                      >
                        +{tmpl.xp} XP
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Мои цели */}
          {!isDone && customItems.length > 0 && (
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                {language === 'kk' ? 'Менің мақсаттарым' : 'Мои цели'}
              </p>
              <div className="space-y-2">
                {customItems.map(item => {
                  const chosen = rec?.goalId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 px-4 py-3 rounded-[14px]"
                      style={{
                        background: chosen ? 'linear-gradient(135deg,#10b981,#059669)' : '#f8fafc',
                        border: chosen ? '1.5px solid #10b981' : '1.5px solid #f1f5f9',
                      }}
                    >
                      <button
                        type="button"
                        className="flex-1 text-left"
                        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                        onClick={() => onSelect(item.id, item.text, item.xp)}
                      >
                        <span className="text-[13px] font-semibold block" style={{ color: chosen ? '#fff' : '#1e293b' }}>
                          {item.text}
                        </span>
                        <span className="text-[11px] font-black" style={{ color: chosen ? 'rgba(255,255,255,0.8)' : '#10b981' }}>
                          +{item.xp} XP
                        </span>
                      </button>
                      <button
                        type="button"
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: chosen ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                          color: chosen ? '#fff' : '#94a3b8',
                          fontSize: 11,
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                        onClick={() => onDeleteCustom(item.id)}
                      >✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Добавить свою цель */}
          {!isDone && (
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                {language === 'kk' ? 'Өз мақсатыңды қос' : 'Добавить свою цель'}
              </p>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={customInputVal}
                  onChange={e => onCustomInputChange(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && onAddCustom()}
                  onFocus={handleInputFocus}
                  placeholder={language === 'kk' ? 'Мақсатыңызды жазыңыз...' : 'Напишите цель...'}
                  className="flex-1 text-[14px] outline-none"
                  style={{
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 14,
                    padding: '12px 16px',
                    transition: 'border-color 0.15s',
                  }}
                  onFocusCapture={e => { (e.target as HTMLInputElement).style.borderColor = '#10b981'; }}
                  onBlur={e => { (e.target as HTMLInputElement).style.borderColor = '#e2e8f0'; }}
                />
                <button
                  type="button"
                  className="flex items-center justify-center shrink-0 font-black text-white text-xl"
                  style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: customInputVal.trim()
                      ? 'linear-gradient(135deg,#10b981,#059669)'
                      : '#e2e8f0',
                    color: customInputVal.trim() ? '#fff' : '#94a3b8',
                    transition: 'background 0.15s',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onClick={onAddCustom}
                >+</button>
              </div>
            </div>
          )}

          <div style={{ height: 24 }} />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
const TasksList: React.FC<TasksListProps> = ({ language, userData, setUserData }) => {
  const t = TRANSLATIONS[language];
  const today = getTodayStr();

  const [openCatId, setOpenCatId] = useState<GoalCategoryId | null>(null);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [floatXp, setFloatXp] = useState<number | null>(null);

  const todayRecords = useMemo(
    () => getTodayGoalRecords(userData.dailyGoalRecords, today),
    [userData.dailyGoalRecords, today]
  );

  const doneCount = todayRecords.filter(r => r.completed).length;
  const totalXpToday = todayRecords.filter(r => r.completed).reduce((s, r) => s + r.xpEarned, 0);
  const progressPct = Math.round((doneCount / GOAL_CATEGORIES.length) * 100);

  const getRecord = useCallback(
    (catId: GoalCategoryId) => getTodayCategoryRecord(userData.dailyGoalRecords, today, catId),
    [userData.dailyGoalRecords, today]
  );
  const getStreak = (catId: GoalCategoryId) =>
    (userData.goalStreaks as Record<string, number> | undefined)?.[catId] ?? 0;

  const handleSelect = useCallback(
    (catId: GoalCategoryId, goalId: string, goalText: string, xp: number) => {
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
    },
    [userData.dailyGoalRecords, today, setUserData]
  );

  const handleComplete = useCallback(
    (catId: GoalCategoryId) => {
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
      setOpenCatId(null);
    },
    [userData.dailyGoalRecords, today, setUserData]
  );

  const handleAddCustom = useCallback(
    (catId: GoalCategoryId) => {
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
    },
    [customInputs, setUserData]
  );

  const handleDeleteCustom = useCallback(
    (catId: GoalCategoryId, itemId: string) => {
      setUserData(prev => ({
        ...(prev as UserData),
        goalCustomItems: {
          ...((prev as UserData).goalCustomItems ?? {}),
          [catId]: ((prev as UserData).goalCustomItems?.[catId] ?? []).filter(i => i.id !== itemId),
        },
      }) as UserData);
    },
    [setUserData]
  );

  const openCat = openCatId ? GOAL_CATEGORIES.find(c => c.id === openCatId) ?? null : null;
  const openRec = openCatId ? getRecord(openCatId) : undefined;
  const openCustomItems: CustomGoalItem[] = openCatId ? (userData.goalCustomItems?.[openCatId] ?? []) : [];

  return (
    <div className="pb-28 pt-2">
      <style>{`
        @keyframes xpPop {
          0%   { opacity:0; transform:translateX(-50%) translateY(20px) scale(0.8); }
          20%  { opacity:1; transform:translateX(-50%) translateY(0) scale(1.05); }
          70%  { opacity:1; transform:translateX(-50%) translateY(-50px) scale(1); }
          100% { opacity:0; transform:translateX(-50%) translateY(-80px) scale(0.9); }
        }
        @keyframes sheetUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {floatXp !== null && <XpFloat xp={floatXp} onDone={() => setFloatXp(null)} />}

      {/* ── Шапка ── */}
      <div className="mb-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-[18px] font-black text-slate-900 leading-tight">
              {language === 'kk' ? 'Күнделікті мақсаттар' : 'Ежедневные цели'}
            </h2>
            <p className="text-[12px] text-slate-400 mt-0.5">
              {language === 'kk'
                ? `Бүгін ${doneCount} / ${GOAL_CATEGORIES.length} мақсат орындалды`
                : `Сегодня выполнено ${doneCount} / ${GOAL_CATEGORIES.length}`}
            </p>
          </div>
          {totalXpToday > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '1.5px solid #6ee7b7' }}
            >
              <span className="text-emerald-600 font-black text-[13px]">+{totalXpToday} XP</span>
            </div>
          )}
        </div>

        {/* Прогресс */}
        <div
          className="relative h-2.5 rounded-full overflow-hidden"
          style={{ background: '#f1f5f9' }}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
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

        {/* Мотивационная фраза */}
        {progressPct === 0 && (
          <p className="text-[12px] text-slate-400 mt-2 text-center">
            {language === 'kk' ? '🌙 Бүгінгі мақсаттарыңызды таңдаңыз' : '🌙 Выберите цели на сегодня'}
          </p>
        )}
        {progressPct > 0 && progressPct < 100 && (
          <p className="text-[12px] text-amber-500 font-semibold mt-2 text-center">
            {language === 'kk'
              ? `💪 Жалғастырыңыз! ${GOAL_CATEGORIES.length - doneCount} мақсат қалды`
              : `💪 Продолжайте! Осталось ${GOAL_CATEGORIES.length - doneCount}`}
          </p>
        )}
        {progressPct === 100 && (
          <p className="text-[12px] text-emerald-500 font-black mt-2 text-center">
            🎉 {language === 'kk' ? 'Барлық мақсат орындалды! Керемет!' : 'Все цели выполнены! Отлично!'}
          </p>
        )}
      </div>

      {/* ── Список категорий ── */}
      <div className="space-y-2.5">
        {GOAL_CATEGORIES.map(cat => (
          <CategoryRow
            key={cat.id}
            cat={cat}
            language={language}
            rec={getRecord(cat.id)}
            streak={getStreak(cat.id)}
            t={t}
            onPress={() => setOpenCatId(cat.id)}
            onDone={() => handleComplete(cat.id)}
          />
        ))}
      </div>

      {/* ── Bottom Sheet ── */}
      {openCat && (
        <GoalSheet
          cat={openCat}
          language={language}
          rec={openRec}
          customItems={openCustomItems}
          customInputVal={customInputs[openCatId!] ?? ''}
          onClose={() => setOpenCatId(null)}
          onSelect={(goalId, goalText, xp) => handleSelect(openCatId!, goalId, goalText, xp)}
          onComplete={() => handleComplete(openCatId!)}
          onAddCustom={() => handleAddCustom(openCatId!)}
          onDeleteCustom={(id) => handleDeleteCustom(openCatId!, id)}
          onCustomInputChange={(val) => setCustomInputs(prev => ({ ...prev, [openCatId!]: val }))}
          t={t}
        />
      )}
    </div>
  );
};

export default TasksList;
