import React, { useState, useMemo } from 'react';
import { UserData, Language, GoalCategoryId, DailyGoalRecord, CustomGoalItem } from '../src/types/types';
import { TRANSLATIONS, GOAL_CATEGORIES, GoalCategory, GoalTemplate, getTodayCategoryRecord, getTodayGoalRecords } from '../constants';

interface TasksListProps {
  language: Language;
  userData: UserData;
  setUserData: (data: UserData) => void;
}

// ─── Вспомогательные типы ───
type CardStatus = 'empty' | 'selected' | 'done';

interface CategoryCardState {
  category: GoalCategory;
  status: CardStatus;
  record?: DailyGoalRecord;
}

// ─── Получить текущую дату в формате YYYY-MM-DD по часовому поясу пользователя ───
function getTodayStr(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Date().toLocaleDateString('en-CA', { timeZone: tz });
}

// ─── Главный компонент ───
const TasksList: React.FC<TasksListProps> = ({ language, userData, setUserData }) => {
  const t = TRANSLATIONS[language];
  const today = getTodayStr();

  // Активная модалка (какая категория открыта)
  const [openCategoryId, setOpenCategoryId] = useState<GoalCategoryId | null>(null);
  // Инпут для добавления кастомной цели
  const [customInput, setCustomInput] = useState('');

  // ─── Состояние карточек — вычисляем из dailyGoalRecords ───
  const cardStates = useMemo((): CategoryCardState[] => {
    return GOAL_CATEGORIES.map(cat => {
      const record = getTodayCategoryRecord(userData.dailyGoalRecords, today, cat.id);
      let status: CardStatus = 'empty';
      if (record) {
        status = record.completed ? 'done' : 'selected';
      }
      return { category: cat, status, record };
    });
  }, [userData.dailyGoalRecords, today]);

  // ─── Счётчик: сколько категорий закрыто сегодня ───
  const doneCount = cardStates.filter(c => c.status === 'done').length;
  const totalXpToday = useMemo(() => {
    return getTodayGoalRecords(userData.dailyGoalRecords, today)
      .filter(r => r.completed)
      .reduce((sum, r) => sum + r.xpEarned, 0);
  }, [userData.dailyGoalRecords, today]);

  // Текущая открытая категория
  const openCategory = openCategoryId
    ? GOAL_CATEGORIES.find(c => c.id === openCategoryId) ?? null
    : null;

  // Кастомные цели для открытой категории
  const openCategoryCustomItems: CustomGoalItem[] = openCategoryId
    ? (userData.goalCustomItems?.[openCategoryId] ?? [])
    : [];

  // Запись для открытой категории на сегодня
  const openCategoryRecord = openCategoryId
    ? getTodayCategoryRecord(userData.dailyGoalRecords, today, openCategoryId)
    : undefined;

  // ─── Выбор задачи из шаблона или кастомной ───
  const handleSelectGoal = (goalId: string, goalText: string, xp: number) => {
    if (!openCategoryId) return;

    // ЗащИТА 1: если уже есть выполненная запись — блокируем
    if (openCategoryRecord?.completed) return;

    const newRecord: DailyGoalRecord = {
      categoryId: openCategoryId,
      goalId,
      goalText,
      completed: false,
      xpEarned: 0, // XP ещё не начислен — только при выполнении
    };

    const todayRecords = getTodayGoalRecords(userData.dailyGoalRecords, today);

    // ЗащИТА 2: заменяем только если задача ещё не выполнена (completed: false)
    const updatedRecords = [
      ...todayRecords.filter(r => r.categoryId !== openCategoryId),
      { ...newRecord, xpEarned: xp } // xp запоминаем для момента выполнения
    ];

    setUserData({
      ...userData,
      dailyGoalRecords: {
        ...userData.dailyGoalRecords,
        [today]: updatedRecords
      }
    });

    setOpenCategoryId(null);
  };

  // ─── Отметка выполнения ───
  const handleComplete = (categoryId: GoalCategoryId) => {
    const todayRecords = getTodayGoalRecords(userData.dailyGoalRecords, today);
    const record = todayRecords.find(r => r.categoryId === categoryId);

    // ЗащИТА 3: задача должна быть выбрана и ещё не выполнена
    if (!record || record.completed) return;

    // ЗащИТА 4: проверяем что 1 запись на категорию в день
    const completedInCategory = todayRecords.filter(
      r => r.categoryId === categoryId && r.completed
    ).length;
    if (completedInCategory > 0) return; // Уже выполнено сегодня

    const xpToAdd = record.xpEarned;

    const updatedRecords = todayRecords.map(r =>
      r.categoryId === categoryId
        ? { ...r, completed: true, completedAt: new Date().toISOString() }
        : r
    );

    // ЗащИТА 5: XP начисляем один раз через prev — не через переменную
    setUserData(prev => ({
      ...prev,
      xp: (prev.xp || 0) + xpToAdd,
      dailyGoalRecords: {
        ...prev.dailyGoalRecords,
        [today]: updatedRecords
      }
    }) as UserData);
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
    setUserData({
      ...userData,
      goalCustomItems: {
        ...(userData.goalCustomItems ?? {}) as Record<GoalCategoryId, CustomGoalItem[]>,
        [openCategoryId]: [
          ...(userData.goalCustomItems?.[openCategoryId] ?? []),
          newItem
        ]
      }
    });
    setCustomInput('');
  };

  // ─── Удалить кастомную цель ───
  const handleDeleteCustom = (itemId: string) => {
    if (!openCategoryId) return;
    setUserData({
      ...userData,
      goalCustomItems: {
        ...(userData.goalCustomItems ?? {}) as Record<GoalCategoryId, CustomGoalItem[]>,
        [openCategoryId]: (userData.goalCustomItems?.[openCategoryId] ?? []).filter(i => i.id !== itemId)
      }
    });
  };

  // ─── Открыть модалку категории ───
  const handleOpenCategory = (categoryId: GoalCategoryId, status: CardStatus) => {
    // Если выполнено — только смотреть, а не менять задачу (открываем, но выбор заблокирован)
    setOpenCategoryId(categoryId);
  };

  // ─── Цвета карточек ───
  const cardStyle: Record<CardStatus, string> = {
    empty: 'bg-white border-slate-100 shadow-sm',
    selected: 'bg-amber-50 border-amber-200',
    done: 'bg-emerald-50 border-emerald-200'
  };
  const iconBg: Record<CardStatus, string> = {
    empty: 'bg-slate-100',
    selected: 'bg-amber-100',
    done: 'bg-emerald-100'
  };

  return (
    <div className="space-y-6 pb-8 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Шапка: сводка дня */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
          {t.goalsSectionTitle}
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-slate-800">
              {doneCount} <span className="text-slate-300">/</span> {GOAL_CATEGORIES.length}
            </p>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
              {t.goalsCompletedToday}
            </p>
          </div>
          {totalXpToday > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl">
              <p className="text-emerald-700 font-black text-sm">+{totalXpToday} XP</p>
              <p className="text-[9px] font-bold text-emerald-400 uppercase">{t.goalsXpReward}</p>
            </div>
          )}
        </div>
        {/* Прогресс-бар */}
        <div className="mt-4 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${Math.round((doneCount / GOAL_CATEGORIES.length) * 100)}%` }}
          />
        </div>
      </div>

      {/* Сетка 6 карточек */}
      <div className="grid grid-cols-2 gap-4">
        {cardStates.map(({ category, status, record }) => (
          <button
            key={category.id}
            onClick={() => handleOpenCategory(category.id, status)}
            className={`rounded-[2.5rem] border-2 p-5 text-left transition-all active:scale-95 ${
              cardStyle[status]
            }`}
          >
            {/* Иконка */}
            <div className={`w-12 h-12 rounded-2xl ${iconBg[status]} flex items-center justify-center text-2xl mb-3`}>
              {status === 'done' ? '✅' : category.icon}
            </div>

            {/* Название */}
            <p className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
              {language === 'kk' ? category.name_kk : category.name_ru}
            </p>

            {/* Статус / текст задачи */}
            {status === 'empty' && (
              <p className="text-[9px] font-bold text-slate-400 mt-1">Таңдау →</p>
            )}
            {status === 'selected' && record && (
              <p className="text-[9px] font-bold text-amber-600 mt-1 leading-tight line-clamp-2">
                {record.goalText}
              </p>
            )}
            {status === 'done' && record && (
              <>
                <p className="text-[9px] font-bold text-emerald-600 mt-1 leading-tight line-clamp-2">
                  {record.goalText}
                </p>
                <p className="text-[9px] font-black text-emerald-500 mt-1">+{record.xpEarned} XP</p>
              </>
            )}
          </button>
        ))}
      </div>

      {/* ─── МОДАЛКА ВЫБОРА ЗАДАЧИ ─── */}
      {openCategory && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpenCategoryId(null); }}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-[3rem] p-6 pb-10 animate-in slide-in-from-bottom-10 duration-300"
            style={{ maxHeight: '85vh', overflowY: 'auto' }}
          >
            {/* Шапка модалки */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{openCategory.icon}</span>
                <div>
                  <p className="font-black text-slate-800 text-base">
                    {language === 'kk' ? openCategory.name_kk : openCategory.name_ru}
                  </p>
                  {openCategoryRecord?.completed ? (
                    <p className="text-[10px] font-black text-emerald-600 uppercase">
                      ✅ {t.goalsCompletedToday}
                    </p>
                  ) : openCategoryRecord ? (
                    <p className="text-[10px] font-black text-amber-500 uppercase">
                      {t.goalsChooseTask}
                    </p>
                  ) : (
                    <p className="text-[10px] font-black text-slate-400 uppercase">
                      {t.goalsChooseTask}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setOpenCategoryId(null)}
                className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-black active:scale-90"
              >
                ✕
              </button>
            </div>

            {/* Если выполнено — заблокированный резюме */}
            {openCategoryRecord?.completed ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-[2rem] p-5 text-center">
                <p className="text-3xl mb-2">✅</p>
                <p className="font-black text-emerald-800 text-sm">{openCategoryRecord.goalText}</p>
                <p className="text-[10px] font-bold text-emerald-500 mt-1 uppercase">+{openCategoryRecord.xpEarned} XP {t.goalsXpReward}</p>
                <p className="text-[9px] font-bold text-emerald-400 mt-3 uppercase">{t.goalsLockedMsg}</p>
              </div>
            ) : (
              <>
                {/* Если задача уже выбрана — чекбокс */}
                {openCategoryRecord && !openCategoryRecord.completed && (
                  <div className="mb-5 bg-amber-50 border border-amber-200 rounded-[2rem] p-4 flex items-center justify-between">
                    <div className="flex-1 pr-3">
                      <p className="text-[10px] font-black text-amber-600 uppercase mb-1">{t.goalsChooseTask}</p>
                      <p className="font-bold text-slate-800 text-sm leading-tight">{openCategoryRecord.goalText}</p>
                      <p className="text-[10px] font-black text-amber-500 mt-1">+{openCategoryRecord.xpEarned} XP</p>
                    </div>
                    <button
                      onClick={() => {
                        handleComplete(openCategoryRecord.categoryId);
                        setOpenCategoryId(null);
                      }}
                      className="bg-emerald-600 text-white text-[11px] font-black px-4 py-3 rounded-2xl active:scale-90 shrink-0"
                    >
                      {t.goalsDoneBtn}
                    </button>
                  </div>
                )}

                {/* Шаблонные цели */}
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  {t.goalsTemplates}
                </p>
                <div className="space-y-2 mb-5">
                  {openCategory.templates.map((tmpl: GoalTemplate) => {
                    const isSelected = openCategoryRecord?.goalId === tmpl.id && !openCategoryRecord.completed;
                    return (
                      <button
                        key={tmpl.id}
                        onClick={() => handleSelectGoal(tmpl.id, language === 'kk' ? tmpl.text_kk : tmpl.text_ru, tmpl.xp)}
                        disabled={!!openCategoryRecord?.completed}
                        className={`w-full text-left flex items-center justify-between p-4 rounded-[1.5rem] border transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-amber-50 border-amber-300'
                            : 'bg-slate-50 border-slate-100 hover:border-emerald-200'
                        }`}
                      >
                        <span className={`text-sm font-semibold leading-tight flex-1 pr-3 ${
                          isSelected ? 'text-amber-800' : 'text-slate-700'
                        }`}>
                          {language === 'kk' ? tmpl.text_kk : tmpl.text_ru}
                        </span>
                        <span className={`text-[10px] font-black shrink-0 ${
                          isSelected ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          +{tmpl.xp} XP
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Кастомные цели */}
                {openCategoryCustomItems.length > 0 && (
                  <>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      {t.goalsMyGoals}
                    </p>
                    <div className="space-y-2 mb-5">
                      {openCategoryCustomItems.map((item) => {
                        const isSelected = openCategoryRecord?.goalId === item.id && !openCategoryRecord.completed;
                        return (
                          <div key={item.id} className={`flex items-center justify-between p-4 rounded-[1.5rem] border transition-all ${
                            isSelected ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-100'
                          }`}>
                            <button
                              className="flex-1 text-left pr-3"
                              onClick={() => handleSelectGoal(item.id, item.text, item.xp)}
                              disabled={!!openCategoryRecord?.completed}
                            >
                              <span className={`text-sm font-semibold leading-tight block ${
                                isSelected ? 'text-amber-800' : 'text-slate-700'
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
                  </>
                )}

                {/* Добавить свою цель */}
                {!openCategoryRecord?.completed && (
                  <>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      {t.goalsAddCustom}
                    </p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={customInput}
                        onChange={e => setCustomInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleAddCustom()}
                        placeholder={t.goalsCustomPlaceholder}
                        className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-emerald-300"
                      />
                      <button
                        onClick={handleAddCustom}
                        className="bg-emerald-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl active:scale-90 shrink-0"
                      >
                        +
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksList;
