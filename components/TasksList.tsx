import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UserData, Language, GoalCategoryId, DailyGoalRecord, CustomGoalItem } from '../src/types/types';
import { TRANSLATIONS, GOAL_CATEGORIES, GoalCategory, GoalTemplate, getTodayCategoryRecord, getTodayGoalRecords } from '../constants';

interface TasksListProps {
  language: Language;
  userData: UserData;
  setUserData: (data: UserData | ((prev: UserData) => UserData)) => void;
}

type CardStatus = 'empty' | 'selected' | 'done';

interface CategoryCardState {
  category: GoalCategory;
  status: CardStatus;
  record?: DailyGoalRecord;
}

function getTodayStr(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Date().toLocaleDateString('en-CA', { timeZone: tz });
}

// ─── XP float анимация ───
const XpFloatAnim: React.FC<{ xp: number; onDone: () => void }> = ({ xp, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 1400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="pointer-events-none fixed z-[200] left-1/2"
      style={{
        top: '38%',
        animation: 'xpFloat 1.4s ease-out forwards',
        transform: 'translateX(-50%)',
      }}
    >
      <span className="text-2xl font-black text-emerald-500 drop-shadow-lg">+{xp} XP ✨</span>
    </div>
  );
};

// ─── Хук блокировки скролла body (iOS/Telegram WebView safe) ───
function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    // Запоминаем текущую позицию скролла
    const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

    // Фиксируем body
    const prev = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      // Восстанавливаем стили
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.left = prev.left;
      document.body.style.right = prev.right;
      document.body.style.width = prev.width;
      document.body.style.overflow = prev.overflow;
      // Возвращаемся на ту же позицию
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}

const TasksList: React.FC<TasksListProps> = ({ language, userData, setUserData }) => {
  const t = TRANSLATIONS[language];
  const today = getTodayStr();

  const [openCategoryId, setOpenCategoryId] = useState<GoalCategoryId | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [floatXp, setFloatXp] = useState<number | null>(null);
  const [burst, setBurst] = useState(false);

  // Блокируем скролл фона когда открыта модалка
  useBodyScrollLock(!!openCategoryId);

  // Ref на скроллируемый контейнер модалки
  const modalScrollRef = useRef<HTMLDivElement>(null);

  // ─── Карточки ───
  const cardStates = useMemo((): CategoryCardState[] => {
    return GOAL_CATEGORIES.map(cat => {
      const record = getTodayCategoryRecord(userData.dailyGoalRecords, today, cat.id);
      let status: CardStatus = 'empty';
      if (record) status = record.completed ? 'done' : 'selected';
      return { category: cat, status, record };
    });
  }, [userData.dailyGoalRecords, today]);

  const doneCount = cardStates.filter(c => c.status === 'done').length;
  const selectedCount = cardStates.filter(c => c.status === 'selected').length;
  const totalXpToday = useMemo(() => {
    return getTodayGoalRecords(userData.dailyGoalRecords, today)
      .filter(r => r.completed)
      .reduce((sum, r) => sum + r.xpEarned, 0);
  }, [userData.dailyGoalRecords, today]);

  const openCategory = openCategoryId ? GOAL_CATEGORIES.find(c => c.id === openCategoryId) ?? null : null;
  const openCategoryCustomItems: CustomGoalItem[] = openCategoryId ? (userData.goalCustomItems?.[openCategoryId] ?? []) : [];
  const openCategoryRecord = openCategoryId ? getTodayCategoryRecord(userData.dailyGoalRecords, today, openCategoryId) : undefined;

  // При открытии модалки скроллим внутренний контейнер наверх
  useEffect(() => {
    if (openCategoryId && modalScrollRef.current) {
      modalScrollRef.current.scrollTop = 0;
    }
  }, [openCategoryId]);

  // ─── Выбор цели (НЕ закрываем модалку) ───
  const handleSelectGoal = (goalId: string, goalText: string, xp: number) => {
    if (!openCategoryId || openCategoryRecord?.completed) return;
    const todayRecords = getTodayGoalRecords(userData.dailyGoalRecords, today);
    const updatedRecords = [
      ...todayRecords.filter(r => r.categoryId !== openCategoryId),
      { categoryId: openCategoryId, goalId, goalText, completed: false, xpEarned: xp } as DailyGoalRecord,
    ];
    setUserData(prev => ({
      ...(prev as UserData),
      dailyGoalRecords: { ...(prev as UserData).dailyGoalRecords, [today]: updatedRecords },
    }) as UserData);
    // Скроллим вверх чтобы пользователь видел блок «Выбранная цель» + Done кнопку
    setTimeout(() => {
      if (modalScrollRef.current) modalScrollRef.current.scrollTop = 0;
    }, 50);
  };

  // ─── Выполнение ───
  const handleComplete = (categoryId: GoalCategoryId) => {
    const todayRecords = getTodayGoalRecords(userData.dailyGoalRecords, today);
    const record = todayRecords.find(r => r.categoryId === categoryId);
    if (!record || record.completed) return;
    if (todayRecords.filter(r => r.categoryId === categoryId && r.completed).length > 0) return;
    const xpToAdd = record.xpEarned;
    const updatedRecords = todayRecords.map(r =>
      r.categoryId === categoryId ? { ...r, completed: true, completedAt: new Date().toISOString() } : r
    );
    setUserData(prev => ({
      ...(prev as UserData),
      xp: ((prev as UserData).xp || 0) + xpToAdd,
      dailyGoalRecords: { ...(prev as UserData).dailyGoalRecords, [today]: updatedRecords },
    }) as UserData);
    setFloatXp(xpToAdd);
    setBurst(true);
    setTimeout(() => setBurst(false), 700);
    setOpenCategoryId(null);
  };

  const handleInlineDone = (e: React.MouseEvent, categoryId: GoalCategoryId) => {
    e.stopPropagation();
    handleComplete(categoryId);
  };

  const handleAddCustom = () => {
    if (!openCategoryId || !customInput.trim()) return;
    const newItem: CustomGoalItem = { id: `custom-${Date.now()}`, text: customInput.trim(), xp: 30, categoryId: openCategoryId };
    setUserData(prev => ({
      ...(prev as UserData),
      goalCustomItems: {
        ...((prev as UserData).goalCustomItems ?? {}),
        [openCategoryId]: [...((prev as UserData).goalCustomItems?.[openCategoryId] ?? []), newItem],
      },
    }) as UserData);
    setCustomInput('');
  };

  const handleDeleteCustom = (itemId: string) => {
    if (!openCategoryId) return;
    setUserData(prev => ({
      ...(prev as UserData),
      goalCustomItems: {
        ...((prev as UserData).goalCustomItems ?? {}),
        [openCategoryId]: ((prev as UserData).goalCustomItems?.[openCategoryId] ?? []).filter(i => i.id !== itemId),
      },
    }) as UserData);
  };

  const getCatStreak = (catId: GoalCategoryId) =>
    (userData.goalStreaks as Record<string, number> | undefined)?.[catId] ?? 0;

  const progressPct = Math.round((doneCount / GOAL_CATEGORIES.length) * 100);

  // ─── Стили карточек ───
  const cardBg: Record<CardStatus, string> = {
    empty: 'bg-white border-slate-100',
    selected: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300',
    done: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300',
  };
  const iconBg: Record<CardStatus, string> = {
    empty: 'bg-slate-100',
    selected: 'bg-amber-100',
    done: 'bg-emerald-100',
  };

  return (
    <div className="space-y-4 pb-10 pt-3">

      {/* CSS анимации */}
      <style>{`
        @keyframes xpFloat {
          0%   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.2); }
          70%  { opacity: 1; transform: translateX(-50%) translateY(-60px) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-90px) scale(0.8); }
        }
        @keyframes burstPop {
          0%   { transform: scale(1); }
          35%  { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        .burst-anim { animation: burstPop 0.55s ease-out; }
        .modal-scroll {
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
      `}</style>

      {/* XP float */}
      {floatXp !== null && <XpFloatAnim xp={floatXp} onDone={() => setFloatXp(null)} />}

      {/* ─── СВОДКА ДНЯ ─── */}
      <div className={`rounded-[2rem] p-5 bg-white border border-slate-100 shadow-sm transition-all ${
        burst ? 'burst-anim' : ''
      }`}>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
          {t.goalsSectionTitle}
        </p>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-end gap-1.5">
            <span className="text-3xl font-black text-slate-800 leading-none">{doneCount}</span>
            <span className="text-lg font-black text-slate-300 mb-0.5">/</span>
            <span className="text-lg font-black text-slate-400 mb-0.5">{GOAL_CATEGORIES.length}</span>
            <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">{t.goalsCompletedToday}</span>
          </div>
          {totalXpToday > 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-2xl text-center">
              <p className="text-emerald-700 font-black text-sm">+{totalXpToday} XP</p>
              <p className="text-[9px] font-bold text-emerald-400 uppercase">{t.goalsXpReward}</p>
            </div>
          ) : selectedCount > 0 ? (
            <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-2xl text-center">
              <p className="text-amber-600 font-black text-xs">{selectedCount} {language === 'kk' ? 'таңдалды' : 'выбрано'}</p>
              <p className="text-[9px] font-bold text-amber-400 uppercase">{language === 'kk' ? 'Орындаңыз' : 'Выполните'}</p>
            </div>
          ) : null}
        </div>

        {/* Прогресс-бар */}
        <div className="flex items-center gap-2.5">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
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
          <span className="text-[10px] font-black text-slate-400">{progressPct}%</span>
        </div>

        {/* Habitify-style подсказка */}
        {selectedCount > 0 && doneCount < GOAL_CATEGORIES.length && (
          <div className="mt-3 flex items-center gap-2 bg-amber-50 rounded-2xl px-3 py-2">
            <span className="text-base">💡</span>
            <p className="text-[11px] font-semibold text-amber-700">
              {language === 'kk'
                ? 'Мақсатты орындап, жасыл батырманы басыңыз'
                : 'Выполните цель и нажмите зелёную кнопку'}
            </p>
          </div>
        )}
      </div>

      {/* ─── СЕТКА КАРТОЧЕК ─── */}
      <div className="grid grid-cols-2 gap-3">
        {cardStates.map(({ category, status, record }) => {
          const streak = getCatStreak(category.id);
          const isDone = status === 'done';
          const isSelected = status === 'selected';
          const isEmpty = status === 'empty';

          return (
            <div
              key={category.id}
              className={`relative rounded-[1.8rem] border-2 p-4 transition-all duration-200 overflow-hidden ${
                cardBg[status]
              }`}
            >
              {/* Декоративный круг */}
              <div
                className={`absolute -right-5 -top-5 w-20 h-20 rounded-full pointer-events-none ${
                  isDone ? 'bg-emerald-300/10' : isSelected ? 'bg-amber-300/10' : 'bg-slate-200/20'
                }`}
              />

              {/* Стрик бейдж */}
              {streak > 0 && (
                <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 bg-orange-50 border border-orange-100 rounded-full px-1.5 py-0.5">
                  <span className="text-[9px]">🔥</span>
                  <span className="text-[9px] font-black text-orange-500">{streak}</span>
                </div>
              )}

              {/* Кнопка-область (открыть модалку) */}
              <button
                className="w-full text-left active:scale-95 transition-transform"
                onClick={() => setOpenCategoryId(category.id)}
              >
                {/* Иконка */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-2.5 ${iconBg[status]}`}>
                  {isDone ? '✅' : category.icon}
                </div>

                {/* Название */}
                <p className="text-[11px] font-black text-slate-700 uppercase tracking-wide leading-tight">
                  {language === 'kk' ? category.name_kk : category.name_ru}
                </p>

                {/* Статус */}
                {isEmpty && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    {language === 'kk' ? 'Таңдау →' : 'Выбрать →'}
                  </p>
                )}
                {isSelected && record && (
                  <p className="text-[9px] font-semibold text-amber-700 mt-1 leading-tight line-clamp-2">
                    {record.goalText}
                  </p>
                )}
                {isDone && record && (
                  <>
                    <p className="text-[9px] font-semibold text-emerald-700 mt-1 leading-tight line-clamp-2">
                      {record.goalText}
                    </p>
                    <p className="text-[9px] font-black text-emerald-500 mt-0.5">+{record.xpEarned} XP ✓</p>
                  </>
                )}
              </button>

              {/* Inline Done кнопка */}
              {isSelected && record && (
                <button
                  onClick={(e) => handleInlineDone(e, category.id)}
                  className="mt-2.5 w-full bg-emerald-500 text-white text-[11px] font-black py-2 rounded-xl active:scale-95 transition-all shadow-sm"
                >
                  {t.goalsDoneBtn || '✓ Орындадым'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── МОДАЛКА ─── */}
      {openCategory && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{
            background: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            // Блокируем touch-события на overlay, чтобы не прокручивался фон
            touchAction: 'none',
          }}
          onTouchMove={(e) => e.preventDefault()}
          onClick={(e) => { if (e.target === e.currentTarget) setOpenCategoryId(null); }}
        >
          {/*
            Контейнер модалки:
            - h-[85vh]: фиксированная высота — обязательна чтобы flex-1 внутри работал
            - flex flex-col: шапка фикс + контент скроллится
          */}
          <div
            className="w-full max-w-md bg-white rounded-t-[2.5rem] flex flex-col"
            style={{ height: '85vh' }}
            // Останавливаем всплытие touch, чтобы overlay не получал события
            onTouchMove={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Шапка модалки (фиксированная, не скроллится) */}
            <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl ${
                  openCategoryRecord?.completed ? 'bg-emerald-100' : 'bg-slate-100'
                }`}>
                  {openCategoryRecord?.completed ? '✅' : openCategory.icon}
                </div>
                <div>
                  <p className="font-black text-slate-800 text-[15px] leading-tight">
                    {language === 'kk' ? openCategory.name_kk : openCategory.name_ru}
                  </p>
                  <p className={`text-[10px] font-bold ${
                    openCategoryRecord?.completed
                      ? 'text-emerald-600'
                      : openCategoryRecord
                      ? 'text-amber-500'
                      : 'text-slate-400'
                  }`}>
                    {openCategoryRecord?.completed
                      ? `✅ ${t.goalsCompletedToday}`
                      : openCategoryRecord
                      ? (language === 'kk' ? '⬇ Орындадым басыңыз' : '⬇ Нажмите «Выполнено»')
                      : (language === 'kk' ? 'Мақсат таңдаңыз' : 'Выберите цель')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpenCategoryId(null)}
                className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-sm font-black shrink-0 active:scale-90"
              >
                ✕
              </button>
            </div>

            {/*
              Скроллируемый контент:
              - flex-1 + min-h-0 — ключевая связка! Без min-h-0 flex-child не обрезается
              - modal-scroll — класс с -webkit-overflow-scrolling: touch
              - ref — для scrollTop = 0 при выборе цели
            */}
            <div
              ref={modalScrollRef}
              className="flex-1 min-h-0 modal-scroll px-5 py-4"
              style={{ touchAction: 'pan-y' }}
            >
              <div className="space-y-4 pb-8">

                {/* ВЫПОЛНЕНО — locked */}
                {openCategoryRecord?.completed ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-[1.8rem] p-6 text-center">
                    <div className="text-4xl mb-3">🎉</div>
                    <p className="font-black text-emerald-800 text-sm mb-1">{openCategoryRecord.goalText}</p>
                    <p className="text-[11px] font-bold text-emerald-500">+{openCategoryRecord.xpEarned} XP</p>
                    <p className="text-[10px] text-slate-400 mt-3">{t.goalsLockedMsg}</p>
                  </div>
                ) : (
                  <>
                    {/* Выбранная цель + Done */}
                    {openCategoryRecord && !openCategoryRecord.completed && (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-[1.6rem] p-4">
                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1.5">
                          {language === 'kk' ? '✅ Таңдалған мақсат' : '✅ Выбранная цель'}
                        </p>
                        <p className="font-semibold text-slate-800 text-sm leading-snug mb-3">
                          {openCategoryRecord.goalText}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-amber-600">+{openCategoryRecord.xpEarned} XP</span>
                          <button
                            onClick={() => handleComplete(openCategoryRecord.categoryId)}
                            className="bg-emerald-500 text-white text-sm font-black px-5 py-2.5 rounded-2xl active:scale-95 shadow-sm shadow-emerald-200 transition-all"
                          >
                            {t.goalsDoneBtn || '✓ Орындадым'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Шаблоны — flex-wrap чипы */}
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                        {t.goalsTemplates || 'Шаблондар'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {openCategory.templates.map((tmpl: GoalTemplate) => {
                          const isChosen = openCategoryRecord?.goalId === tmpl.id;
                          return (
                            <button
                              key={tmpl.id}
                              onClick={() => handleSelectGoal(tmpl.id, language === 'kk' ? tmpl.text_kk : tmpl.text_ru, tmpl.xp)}
                              disabled={!!openCategoryRecord?.completed}
                              className={`text-left px-3 py-2.5 rounded-2xl border text-[12px] font-semibold transition-all active:scale-95 ${
                                isChosen
                                  ? 'bg-amber-400 border-amber-400 text-white shadow-sm'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-200'
                              }`}
                              style={{ maxWidth: '49%' }}
                            >
                              <span className="block leading-snug">
                                {language === 'kk' ? tmpl.text_kk : tmpl.text_ru}
                              </span>
                              <span className={`text-[10px] font-black block mt-0.5 ${
                                isChosen ? 'text-white/80' : 'text-emerald-600'
                              }`}>+{tmpl.xp} XP</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Кастомные цели */}
                    {openCategoryCustomItems.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                          {t.goalsMyGoals || 'Менің мақсаттарым'}
                        </p>
                        <div className="space-y-2">
                          {openCategoryCustomItems.map((item) => {
                            const isChosen = openCategoryRecord?.goalId === item.id;
                            return (
                              <div
                                key={item.id}
                                className={`flex items-center justify-between p-3.5 rounded-[1.5rem] border ${
                                  isChosen ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-100'
                                }`}
                              >
                                <button className="flex-1 text-left pr-2" onClick={() => handleSelectGoal(item.id, item.text, item.xp)} disabled={!!openCategoryRecord?.completed}>
                                  <span className={`text-sm font-semibold block ${isChosen ? 'text-amber-800' : 'text-slate-700'}`}>{item.text}</span>
                                  <span className="text-[10px] font-black text-emerald-600">+{item.xp} XP</span>
                                </button>
                                {!openCategoryRecord?.completed && (
                                  <button onClick={() => handleDeleteCustom(item.id)}
                                    className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs active:scale-90 shrink-0"
                                  >✕</button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Добавить свою цель */}
                    {!openCategoryRecord?.completed && (
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          {t.goalsAddCustom || 'Өз мақсатыңды қос'}
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customInput}
                            onChange={e => setCustomInput(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleAddCustom()}
                            placeholder={t.goalsCustomPlaceholder || 'Мақсат жазыңыз...'}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-emerald-300 transition-colors"
                          />
                          <button
                            onClick={handleAddCustom}
                            className="bg-emerald-500 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black active:scale-90 shrink-0 shadow-sm"
                          >+</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksList;
