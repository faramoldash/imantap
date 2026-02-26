import React, { useState, useMemo } from 'react';
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

// ─── Анимация XP-флоата ───
const XpFloatAnim: React.FC<{ xp: number; onDone: () => void }> = ({ xp, onDone }) => {
  React.useEffect(() => {
    const t = setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="pointer-events-none fixed z-[100] left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2"
      style={{ animation: 'xpFloat 1.2s ease-out forwards' }}
    >
      <span className="text-2xl font-black text-emerald-500">+{xp} XP ✨</span>
    </div>
  );
};

const TasksList: React.FC<TasksListProps> = ({ language, userData, setUserData }) => {
  const t = TRANSLATIONS[language];
  const today = getTodayStr();

  const [openCategoryId, setOpenCategoryId] = useState<GoalCategoryId | null>(null);
  const [customInput, setCustomInput] = useState('');
  // XP-анимация после выполнения
  const [floatXp, setFloatXp] = useState<number | null>(null);
  // Конфетти-флаг (после Done)
  const [burst, setBurst] = useState(false);

  // ─── Состояние карточек ───
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

  const openCategory = openCategoryId
    ? GOAL_CATEGORIES.find(c => c.id === openCategoryId) ?? null
    : null;
  const openCategoryCustomItems: CustomGoalItem[] = openCategoryId
    ? (userData.goalCustomItems?.[openCategoryId] ?? [])
    : [];
  const openCategoryRecord = openCategoryId
    ? getTodayCategoryRecord(userData.dailyGoalRecords, today, openCategoryId)
    : undefined;

  // ─── Выбор задачи (НЕ закрываем модалку!) ───
  const handleSelectGoal = (goalId: string, goalText: string, xp: number) => {
    if (!openCategoryId) return;
    if (openCategoryRecord?.completed) return;

    const todayRecords = getTodayGoalRecords(userData.dailyGoalRecords, today);
    const updatedRecords = [
      ...todayRecords.filter(r => r.categoryId !== openCategoryId),
      {
        categoryId: openCategoryId,
        goalId,
        goalText,
        completed: false,
        xpEarned: xp,
      } as DailyGoalRecord
    ];

    setUserData(prev => ({
      ...prev,
      dailyGoalRecords: {
        ...(prev as UserData).dailyGoalRecords,
        [today]: updatedRecords
      }
    }) as UserData);
    // ✅ НЕ закрываем — пользователь видит кнопку «Орындадым»
  };

  // ─── Выполнение задачи ───
  const handleComplete = (categoryId: GoalCategoryId) => {
    const todayRecords = getTodayGoalRecords(userData.dailyGoalRecords, today);
    const record = todayRecords.find(r => r.categoryId === categoryId);
    if (!record || record.completed) return;
    if (todayRecords.filter(r => r.categoryId === categoryId && r.completed).length > 0) return;

    const xpToAdd = record.xpEarned;

    const updatedRecords = todayRecords.map(r =>
      r.categoryId === categoryId
        ? { ...r, completed: true, completedAt: new Date().toISOString() }
        : r
    );

    setUserData(prev => ({
      ...(prev as UserData),
      xp: ((prev as UserData).xp || 0) + xpToAdd,
      dailyGoalRecords: {
        ...(prev as UserData).dailyGoalRecords,
        [today]: updatedRecords
      }
    }) as UserData);

    // XP float + burst
    setFloatXp(xpToAdd);
    setBurst(true);
    setTimeout(() => setBurst(false), 700);
    setOpenCategoryId(null);
  };

  // ─── Inline Done прямо с карточки (без открытия модалки) ───
  const handleInlineDone = (e: React.MouseEvent, categoryId: GoalCategoryId) => {
    e.stopPropagation();
    handleComplete(categoryId);
  };

  // ─── Добавить кастомную цель ───
  const handleAddCustom = () => {
    if (!openCategoryId || !customInput.trim()) return;
    const newItem: CustomGoalItem = {
      id: `custom-${Date.now()}`,
      text: customInput.trim(),
      xp: 30,
      categoryId: openCategoryId
    };
    setUserData(prev => ({
      ...(prev as UserData),
      goalCustomItems: {
        ...((prev as UserData).goalCustomItems ?? {}),
        [openCategoryId]: [
          ...((prev as UserData).goalCustomItems?.[openCategoryId] ?? []),
          newItem
        ]
      }
    }) as UserData);
    setCustomInput('');
  };

  const handleDeleteCustom = (itemId: string) => {
    if (!openCategoryId) return;
    setUserData(prev => ({
      ...(prev as UserData),
      goalCustomItems: {
        ...((prev as UserData).goalCustomItems ?? {}),
        [openCategoryId]: ((prev as UserData).goalCustomItems?.[openCategoryId] ?? []).filter(i => i.id !== itemId)
      }
    }) as UserData);
  };

  // ─── Стрик для категории ───
  const getCatStreak = (catId: GoalCategoryId) =>
    (userData.goalStreaks as Record<string, number> | undefined)?.[catId] ?? 0;

  // ─── Цвета статусов ───
  const statusRing: Record<CardStatus, string> = {
    empty:    'border-white/20',
    selected: 'border-amber-400/60 ring-2 ring-amber-300/30',
    done:     'border-emerald-400/60 ring-2 ring-emerald-300/30',
  };

  // ─── Прогресс-цвет ───
  const progressPct = Math.round((doneCount / GOAL_CATEGORIES.length) * 100);

  return (
    <div className="space-y-5 pb-10 pt-3">

      {/* ─── XP-флоат анимация ─── */}
      {floatXp !== null && (
        <XpFloatAnim xp={floatXp} onDone={() => setFloatXp(null)} />
      )}

      {/* ─── CSS для XP-флоата ─── */}
      <style>{`
        @keyframes xpFloat {
          0%   { opacity:1; transform:translate(-50%,-50%) scale(1.2); }
          80%  { opacity:1; transform:translate(-50%,-120%) scale(1); }
          100% { opacity:0; transform:translate(-50%,-140%) scale(0.8); }
        }
        @keyframes burstPop {
          0%   { transform:scale(1); }
          40%  { transform:scale(1.08); }
          100% { transform:scale(1); }
        }
        .burst { animation: burstPop 0.6s ease-out; }
      `}</style>

      {/* ─── ШАПКА — Сводка дня ─── */}
      <div className={`rounded-[2.2rem] p-5 shadow-sm border border-slate-100 bg-white transition-all ${
        burst ? 'burst' : ''
      }`}>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
          {t.goalsSectionTitle}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-slate-800 leading-none">{doneCount}</span>
            <span className="text-xl font-black text-slate-300 leading-none mb-0.5">/</span>
            <span className="text-xl font-black text-slate-400 leading-none mb-0.5">{GOAL_CATEGORIES.length}</span>
          </div>
          {totalXpToday > 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl">
              <p className="text-emerald-700 font-black text-sm">+{totalXpToday} XP</p>
              <p className="text-[9px] font-bold text-emerald-400 uppercase text-center">{t.goalsXpReward}</p>
            </div>
          ) : selectedCount > 0 ? (
            <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl">
              <p className="text-amber-700 font-black text-sm text-center">{selectedCount}</p>
              <p className="text-[9px] font-bold text-amber-400 uppercase">таңдалды</p>
            </div>
          ) : null}
        </div>

        {/* Прогресс-бар с лейблом */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPct}%`,
                background: progressPct === 100
                  ? 'linear-gradient(90deg,#10b981,#059669)'
                  : progressPct > 50
                  ? 'linear-gradient(90deg,#f59e0b,#10b981)'
                  : 'linear-gradient(90deg,#f59e0b,#fbbf24)'
              }}
            />
          </div>
          <span className="text-[10px] font-black text-slate-400 shrink-0">{progressPct}%</span>
        </div>

        {/* Подсказка если есть выбранные но не выполненные */}
        {selectedCount > 0 && doneCount < GOAL_CATEGORIES.length && (
          <p className="text-[10px] font-bold text-amber-500 mt-3 text-center animate-pulse">
            ⬇️ {language === 'kk' ? 'Мақсатыңызды орындап, «Орындадым» басыңыз' : 'Выполните цель и нажмите «Выполнено»'}
          </p>
        )}
      </div>

      {/* ─── СЕТКА 6 КАРТОЧЕК ─── */}
      <div className="grid grid-cols-2 gap-3">
        {cardStates.map(({ category, status, record }) => {
          const streak = getCatStreak(category.id);
          const isDone = status === 'done';
          const isSelected = status === 'selected';
          const isEmpty = status === 'empty';

          return (
            <button
              key={category.id}
              onClick={() => setOpenCategoryId(category.id)}
              className={`relative rounded-[2rem] border-2 p-4 text-left transition-all duration-200 active:scale-95 overflow-hidden ${
                statusRing[status]
              } ${
                isDone
                  ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/60'
                  : isSelected
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50'
                  : 'bg-white'
              }`}
            >
              {/* Декоративный кружок на фоне */}
              <div
                className={`absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10 ${
                  isDone ? 'bg-emerald-400' : isSelected ? 'bg-amber-300' : 'bg-slate-200'
                }`}
              />

              {/* Стрик-бейдж */}
              {streak > 0 && (
                <div className="absolute top-3 right-3 flex items-center gap-0.5 bg-orange-100 rounded-full px-2 py-0.5">
                  <span className="text-[9px]">🔥</span>
                  <span className="text-[9px] font-black text-orange-600">{streak}</span>
                </div>
              )}

              {/* Иконка + чекмарк */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                  isDone ? 'bg-emerald-100' : isSelected ? 'bg-amber-100' : 'bg-slate-100'
                }`}>
                  {isDone ? '✅' : category.icon}
                </div>
              </div>

              {/* Название */}
              <p className="text-[11px] font-black text-slate-700 uppercase tracking-wider leading-tight">
                {language === 'kk' ? category.name_kk : category.name_ru}
              </p>

              {/* Статус-строка */}
              {isEmpty && (
                <p className="text-[10px] font-semibold text-slate-400 mt-1.5">
                  {language === 'kk' ? 'Мақсат таңдау →' : 'Выбрать цель →'}
                </p>
              )}

              {isSelected && record && (
                <p className="text-[9px] font-semibold text-amber-700 mt-1.5 leading-tight line-clamp-2">
                  {record.goalText}
                </p>
              )}

              {isDone && record && (
                <>
                  <p className="text-[9px] font-semibold text-emerald-700 mt-1.5 leading-tight line-clamp-2">
                    {record.goalText}
                  </p>
                  <p className="text-[9px] font-black text-emerald-500 mt-1">+{record.xpEarned} XP</p>
                </>
              )}

              {/* ─── INLINE DONE КНОПКА (если выбрана, но не выполнена) ─── */}
              {isSelected && record && (
                <button
                  onClick={(e) => handleInlineDone(e, category.id)}
                  className="mt-3 w-full bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black py-2 rounded-xl active:scale-95 transition-all shadow-sm shadow-emerald-200"
                >
                  {t.goalsDoneBtn || '✓ Орындадым'}
                </button>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── МОДАЛКА ВЫБОРА ЗАДАЧИ ─── */}
      {openCategory && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpenCategoryId(null); }}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-[2.5rem] pb-10 animate-in slide-in-from-bottom-10 duration-300 flex flex-col"
            style={{ maxHeight: '88vh' }}
          >
            {/* ─── Хэндл ─── */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* ─── Шапка модалки ─── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                  openCategoryRecord?.completed ? 'bg-emerald-100' : 'bg-slate-100'
                }`}>
                  {openCategoryRecord?.completed ? '✅' : openCategory.icon}
                </div>
                <div>
                  <p className="font-black text-slate-800 text-base leading-tight">
                    {language === 'kk' ? openCategory.name_kk : openCategory.name_ru}
                  </p>
                  {openCategoryRecord?.completed ? (
                    <p className="text-[10px] font-bold text-emerald-600">
                      ✅ {t.goalsCompletedToday}
                    </p>
                  ) : openCategoryRecord ? (
                    <p className="text-[10px] font-bold text-amber-500">
                      {language === 'kk' ? '⬇️ Орындадым басыңыз' : '⬇️ Нажмите «Выполнено»'}
                    </p>
                  ) : (
                    <p className="text-[10px] font-bold text-slate-400">
                      {language === 'kk' ? 'Мақсат таңдаңыз' : 'Выберите цель'}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setOpenCategoryId(null)}
                className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-black text-sm active:scale-90"
              >
                ✕
              </button>
            </div>

            {/* ─── Скроллируемый контент ─── */}
            <div className="flex-1 overflow-y-auto px-6 pt-4 space-y-5">

              {/* ЕСЛИ ВЫПОЛНЕНО — locked экран */}
              {openCategoryRecord?.completed ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-[2rem] p-6 text-center">
                  <div className="text-4xl mb-3">🎉</div>
                  <p className="font-black text-emerald-800 text-sm mb-1">{openCategoryRecord.goalText}</p>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase">+{openCategoryRecord.xpEarned} XP</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-3">{t.goalsLockedMsg}</p>
                </div>
              ) : (
                <>
                  {/* ─── ВЫБРАННАЯ ЦЕЛЬ + Кнопка DONE ─── */}
                  {openCategoryRecord && !openCategoryRecord.completed && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-[1.8rem] p-4">
                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">
                        {language === 'kk' ? '✅ Таңдалған мақсат' : '✅ Выбранная цель'}
                      </p>
                      <p className="font-bold text-slate-800 text-sm leading-snug mb-3">
                        {openCategoryRecord.goalText}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-amber-600">+{openCategoryRecord.xpEarned} XP</span>
                        <button
                          onClick={() => handleComplete(openCategoryRecord.categoryId)}
                          className="bg-emerald-500 text-white text-sm font-black px-6 py-2.5 rounded-2xl active:scale-90 shadow shadow-emerald-200 transition-all"
                        >
                          {t.goalsDoneBtn || '✓ Орындадым'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ─── ШАБЛОНЫ — компактные чипы ─── */}
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      {t.goalsTemplates || 'Шаблондар'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {openCategory.templates.map((tmpl: GoalTemplate) => {
                        const isChosen = openCategoryRecord?.goalId === tmpl.id && !openCategoryRecord?.completed;
                        return (
                          <button
                            key={tmpl.id}
                            onClick={() => handleSelectGoal(tmpl.id, language === 'kk' ? tmpl.text_kk : tmpl.text_ru, tmpl.xp)}
                            disabled={!!openCategoryRecord?.completed}
                            className={`text-left px-3.5 py-2.5 rounded-2xl border text-[12px] font-semibold transition-all active:scale-95 max-w-[48%] ${
                              isChosen
                                ? 'bg-amber-400 border-amber-400 text-white shadow-sm shadow-amber-200'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'
                            }`}
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

                  {/* ─── КАСТОМНЫЕ ЦЕЛИ ─── */}
                  {openCategoryCustomItems.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        {t.goalsMyGoals || 'Менің мақсаттарым'}
                      </p>
                      <div className="space-y-2">
                        {openCategoryCustomItems.map((item) => {
                          const isChosen = openCategoryRecord?.goalId === item.id && !openCategoryRecord?.completed;
                          return (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between p-3.5 rounded-[1.5rem] border transition-all ${
                                isChosen ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-100'
                              }`}
                            >
                              <button
                                className="flex-1 text-left pr-3"
                                onClick={() => handleSelectGoal(item.id, item.text, item.xp)}
                                disabled={!!openCategoryRecord?.completed}
                              >
                                <span className={`text-sm font-semibold block ${
                                  isChosen ? 'text-amber-800' : 'text-slate-700'
                                }`}>{item.text}</span>
                                <span className="text-[10px] font-black text-emerald-600">+{item.xp} XP</span>
                              </button>
                              {!openCategoryRecord?.completed && (
                                <button
                                  onClick={() => handleDeleteCustom(item.id)}
                                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs active:scale-90 shrink-0"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ─── ДОБАВИТЬ СВОЮ ЦЕЛЬ ─── */}
                  {!openCategoryRecord?.completed && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        {t.goalsAddCustom || 'Өз мақсатыңды қос'}
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customInput}
                          onChange={e => setCustomInput(e.target.value)}
                          onKeyPress={e => e.key === 'Enter' && handleAddCustom()}
                          placeholder={t.goalsCustomPlaceholder || 'Мақсат жазыңыз...'}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-emerald-300 transition-colors"
                        />
                        <button
                          onClick={handleAddCustom}
                          className="bg-emerald-500 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl active:scale-90 shrink-0 shadow shadow-emerald-200"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Нижний отступ для скролла */}
              <div className="h-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksList;
