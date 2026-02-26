import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  UserData, Language, GoalCategoryId,
  DailyGoalRecord, CustomGoalItem
} from '../src/types/types';
import {
  TRANSLATIONS, GOAL_CATEGORIES, GoalTemplate, GoalCategory,
  getTodayCategoryRecord, getTodayGoalRecords,
} from '../constants';

interface Props {
  language: Language;
  userData: UserData;
  setUserData: (u: UserData | ((p: UserData) => UserData)) => void;
}

function todayStr(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}

// ─── XP pop-up ─────────────────────────────────────────────────────────────
const XpPop: React.FC<{ xp: number; onDone: () => void }> = ({ xp, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 1800); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="pointer-events-none fixed z-[999] inset-x-0 flex justify-center" style={{ top: '38%' }}>
      <div
        className="bg-emerald-500 text-white font-black text-xl px-7 py-3 rounded-full shadow-2xl"
        style={{ animation: 'xpPop 1.8s cubic-bezier(.22,1,.36,1) forwards' }}
      >
        +{xp} XP ✨
      </div>
    </div>
  );
};

// ─── Строка категории ───────────────────────────────────────────────────────
const CategoryRow: React.FC<{
  cat: GoalCategory;
  lang: Language;
  rec?: DailyGoalRecord;
  streak: number;
  onOpen: () => void;
  onDone: () => void;
  t: Record<string, string>;
}> = ({ cat, lang, rec, streak, onOpen, onDone, t }) => {
  const done     = rec?.completed === true;
  const selected = !!rec && !done;
  const name     = lang === 'kk' ? cat.name_kk : cat.name_ru;

  const bg     = done ? '#ecfdf5' : selected ? '#fefce8' : '#ffffff';
  const border = done ? '#6ee7b7' : selected ? '#fde68a' : '#f1f5f9';
  const shadow = done
    ? '0 2px 8px rgba(16,185,129,.12)'
    : selected ? '0 2px 8px rgba(234,179,8,.12)'
    : '0 1px 4px rgba(0,0,0,.05)';

  return (
    <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 18, boxShadow: shadow, overflow: 'hidden' }}>
      <button
        type="button"
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
        onClick={onOpen}
      >
        <div style={{ width: 44, height: 44, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, background: done ? '#d1fae5' : selected ? '#fef9c3' : '#f8fafc' }}>
          {done ? '✅' : cat.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: done ? '#059669' : '#0f172a', textDecoration: done ? 'line-through' : 'none', opacity: done ? .75 : 1 }}>{name}</span>
            {streak > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#f97316' }}>🔥{streak}</span>}
          </div>
          {selected && rec && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#b45309', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.goalText}</p>}
          {done    && rec && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#059669', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.goalText}</p>}
          {!done && !selected && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>{lang === 'kk' ? 'Таңдау →' : 'Выбрать →'}</p>}
        </div>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          {done && rec && <span style={{ fontSize: 12, fontWeight: 900, color: '#10b981' }}>+{rec.xpEarned} XP</span>}
          {selected && (
            <button
              type="button"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 900, fontSize: 12, padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,.35)' }}
              onClick={e => { e.stopPropagation(); onDone(); }}
            >
              {t.goalsDoneBtn || 'Орындадым ✓'}
            </button>
          )}
          {!done && !selected && (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </button>
    </div>
  );
};

// ─── Bottom Sheet ───────────────────────────────────────────────────────────
const GoalSheet: React.FC<{
  cat: GoalCategory;
  lang: Language;
  // localRec — оптимистичная запись (мгновенный UI)
  localRec?: DailyGoalRecord;
  customItems: CustomGoalItem[];
  inputVal: string;
  onClose: () => void;
  onSelect: (id: string, text: string, xp: number) => void;
  onDeselect: () => void;
  onDone: () => void;
  onAddCustom: () => void;
  onDeleteCustom: (id: string) => void;
  onInputChange: (v: string) => void;
  t: Record<string, string>;
}> = ({
  cat, lang, localRec, customItems, inputVal,
  onClose, onSelect, onDeselect, onDone, onAddCustom, onDeleteCustom, onInputChange, t
}) => {
  const done     = localRec?.completed === true;
  const selected = !!localRec && !done;
  const name     = lang === 'kk' ? cat.name_kk : cat.name_ru;
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        // z-index выше навигации (nav обычно z-50 = 50), sheet на 300
        zIndex: 300,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        background: 'rgba(15,23,42,.5)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#fff', borderRadius: '22px 22px 0 0',
          // Высота с учётом навигации: отступ снизу 80px (высота nav)
          maxHeight: 'calc(85vh - 0px)',
          display: 'flex', flexDirection: 'column',
          animation: 'sheetUp .26s cubic-bezier(.22,1,.36,1)',
          // Важно: sheet рисуется поверх всего, включая nav
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', flexShrink: 0 }}>
          <div style={{ width: 38, height: 4, borderRadius: 4, background: '#e2e8f0' }} />
        </div>

        {/* Шапка */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              {done ? '✅' : cat.icon}
            </div>
            <div>
              <p style={{ fontWeight: 900, fontSize: 16, color: '#0f172a', margin: 0 }}>{name}</p>
              <p style={{ fontSize: 11, margin: 0, color: done ? '#10b981' : selected ? '#d97706' : '#94a3b8', fontWeight: 600 }}>
                {done
                  ? (lang === 'kk' ? '✓ Орындалды' : '✓ Выполнено')
                  : selected
                  ? (lang === 'kk' ? 'Мақсат таңдалды — қайта басу үшін алып тастаңыз' : 'Цель выбрана — нажмите снова чтобы снять')
                  : (lang === 'kk' ? 'Мақсат таңдаңыз' : 'Выберите цель')}
              </p>
            </div>
          </div>
          <button
            type="button"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#64748b', fontWeight: 700 }}
            onClick={onClose}
          >✕</button>
        </div>

        {/* Скроллируемый контент */}
        <div
          style={{
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch' as any,
            flex: 1,
            // Отступ снизу чтобы поле ввода не прятался за nav
            padding: '16px 20px 100px',
            display: 'flex', flexDirection: 'column', gap: 20,
          }}
        >
          {/* === ВЫПОЛНЕНО === */}
          {done && localRec && (
            <div style={{ background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '1.5px solid #6ee7b7', borderRadius: 16, padding: '20px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 36, margin: '0 0 8px' }}>🎉</p>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#065f46', margin: '0 0 4px' }}>{localRec.goalText}</p>
              <p style={{ fontWeight: 900, fontSize: 14, color: '#10b981', margin: '0 0 8px' }}>+{localRec.xpEarned} XP</p>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                {lang === 'kk' ? 'Ертең жаңа мақсат таңдауға болады' : 'Завтра можно выбрать новую цель'}
              </p>
            </div>
          )}

          {/* === ВЫБРАННАЯ ЦЕЛЬ + кнопка Done === */}
          {selected && localRec && (
            <div style={{ background: '#fefce8', border: '1.5px solid #fde68a', borderRadius: 16, padding: '14px 16px' }}>
              <p style={{ fontSize: 10, fontWeight: 900, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
                {lang === 'kk' ? 'Таңдалған мақсат' : 'Выбранная цель'}
              </p>
              <p style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', margin: '0 0 10px', lineHeight: 1.4 }}>{localRec.goalText}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontWeight: 900, fontSize: 13, color: '#d97706' }}>+{localRec.xpEarned} XP</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* Кнопка снять выбор */}
                  <button
                    type="button"
                    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', background: '#f1f5f9', color: '#64748b', fontWeight: 700, fontSize: 13, padding: '10px 14px', borderRadius: 14, border: 'none', cursor: 'pointer' }}
                    onClick={onDeselect}
                  >
                    {lang === 'kk' ? 'Алып тастау' : 'Снять'}
                  </button>
                  {/* Кнопка выполнил */}
                  <button
                    type="button"
                    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 900, fontSize: 14, padding: '10px 22px', borderRadius: 14, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,.4)' }}
                    onClick={onDone}
                  >
                    {t.goalsDoneBtn || 'Орындадым ✓'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* === ШАБЛОНЫ === */}
          {!done && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
                {lang === 'kk' ? 'Шаблондар' : 'Шаблоны'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cat.templates.map((tmpl: GoalTemplate) => {
                  const chosen = localRec?.goalId === tmpl.id;
                  const label  = lang === 'kk' ? tmpl.text_kk : tmpl.text_ru;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      style={{
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                        background: chosen ? 'linear-gradient(135deg,#10b981,#059669)' : '#f8fafc',
                        border: chosen ? '1.5px solid #10b981' : '1.5px solid #f1f5f9',
                        borderRadius: 14, padding: '12px 14px', cursor: 'pointer',
                        boxShadow: chosen ? '0 2px 10px rgba(16,185,129,.2)' : 'none',
                        textAlign: 'left', width: '100%',
                        // Плавная смена фона при выборе
                        transition: 'background .15s, border-color .15s, box-shadow .15s',
                      }}
                      // Повторный клик = снять выбор
                      onClick={() => chosen ? onDeselect() : onSelect(tmpl.id, label, tmpl.xp)}
                    >
                      <span style={{ fontWeight: 600, fontSize: 13, color: chosen ? '#fff' : '#1e293b', lineHeight: 1.35, flex: 1 }}>{label}</span>
                      <span style={{ fontWeight: 900, fontSize: 11, color: chosen ? 'rgba(255,255,255,.8)' : '#10b981', flexShrink: 0 }}>
                        {chosen ? '✓ ' : '+'}{tmpl.xp} XP
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* === МОИ ЦЕЛИ === */}
          {!done && customItems.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
                {lang === 'kk' ? 'Менің мақсаттарым' : 'Мои цели'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {customItems.map(item => {
                  const chosen = localRec?.goalId === item.id;
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: chosen ? 'linear-gradient(135deg,#10b981,#059669)' : '#f8fafc',
                        border: chosen ? '1.5px solid #10b981' : '1.5px solid #f1f5f9',
                        borderRadius: 14, padding: '12px 14px',
                        transition: 'background .15s, border-color .15s',
                      }}
                    >
                      <button
                        type="button"
                        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={() => chosen ? onDeselect() : onSelect(item.id, item.text, item.xp)}
                      >
                        <span style={{ fontWeight: 600, fontSize: 13, color: chosen ? '#fff' : '#1e293b', display: 'block' }}>{item.text}</span>
                        <span style={{ fontWeight: 900, fontSize: 11, color: chosen ? 'rgba(255,255,255,.8)' : '#10b981' }}>{chosen ? '✓ ' : '+'}{item.xp} XP</span>
                      </button>
                      <button
                        type="button"
                        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', width: 28, height: 28, borderRadius: '50%', background: chosen ? 'rgba(255,255,255,.2)' : '#e2e8f0', border: 'none', cursor: 'pointer', color: chosen ? '#fff' : '#94a3b8', fontSize: 11, flexShrink: 0 }}
                        onClick={() => onDeleteCustom(item.id)}
                      >✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === ДОБАВИТЬ СВОЮ ЦЕЛЬ === */}
          {!done && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
                {lang === 'kk' ? 'Өз мақсатыңды қос' : 'Добавить свою'}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={e => onInputChange(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && onAddCustom()}
                  onFocus={() => {
                    // Скроллим input в видимую зону через 350ms (после анимации клавиатуры)
                    setTimeout(() => {
                      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 350);
                  }}
                  placeholder={lang === 'kk' ? 'Мақсатыңызды жазыңыз...' : 'Напишите цель...'}
                  style={{ flex: 1, fontSize: 14, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '12px 16px', outline: 'none' }}
                  onFocusCapture={e => { (e.target as HTMLInputElement).style.borderColor = '#10b981'; }}
                  onBlur={e => { (e.target as HTMLInputElement).style.borderColor = '#e2e8f0'; }}
                />
                <button
                  type="button"
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', width: 48, height: 48, borderRadius: 14, background: inputVal.trim() ? 'linear-gradient(135deg,#10b981,#059669)' : '#e2e8f0', border: 'none', cursor: 'pointer', color: inputVal.trim() ? '#fff' : '#94a3b8', fontSize: 22, fontWeight: 900, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={onAddCustom}
                >+</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN ──────────────────────────────────────────────────────────────────
const TasksList: React.FC<Props> = ({ language: lang, userData, setUserData }) => {
  const t   = TRANSLATIONS[lang] as Record<string, string>;
  const day = todayStr();

  // ─── Локальный оптимистичный state для dailyGoalRecords ────────────────
  // Позволяет мгновенно отражать выбор/снятие без ожидания пропса userData
  const [localRecords, setLocalRecords] = useState<DailyGoalRecord[]>(
    () => getTodayGoalRecords(userData.dailyGoalRecords, day)
  );

  // Синхронизируем с внешним userData только если он "новее" (например после sync с сервером)
  // Используем ref чтобы не перезаписывать оптимистичные изменения
  const lastSyncedRef = useRef<string>(JSON.stringify(getTodayGoalRecords(userData.dailyGoalRecords, day)));
  useEffect(() => {
    const incoming = getTodayGoalRecords(userData.dailyGoalRecords, day);
    const incomingStr = JSON.stringify(incoming);
    // Обновляем local только если внешние данные реально изменились
    if (incomingStr !== lastSyncedRef.current) {
      lastSyncedRef.current = incomingStr;
      setLocalRecords(incoming);
    }
  }, [userData.dailyGoalRecords, day]);

  const [sheetCatId, setSheetCatId] = useState<GoalCategoryId | null>(null);
  const [inputs,     setInputs]     = useState<Record<string, string>>({});
  const [floatXp,    setFloatXp]    = useState<number | null>(null);

  const doneCount   = localRecords.filter(r => r.completed).length;
  const xpToday     = localRecords.filter(r => r.completed).reduce((s, r) => s + r.xpEarned, 0);
  const progressPct = Math.round((doneCount / GOAL_CATEGORIES.length) * 100);

  const getLocalRec = useCallback(
    (id: GoalCategoryId) => localRecords.find(r => r.categoryId === id),
    [localRecords]
  );

  const getStreak = (id: GoalCategoryId): number => {
    const s = (userData.goalStreaks as Record<string, { current: number; longest: number; lastCompletedDate: string }> | undefined)?.[id];
    return s?.current ?? 0;
  };

  // ─ Мгновенное обновление localRecords + синхронизация с userData ────────
  const applyRecords = useCallback((next: DailyGoalRecord[]) => {
    const str = JSON.stringify(next);
    lastSyncedRef.current = str;
    setLocalRecords(next);
    setUserData(p => ({
      ...(p as UserData),
      dailyGoalRecords: { ...(p as UserData).dailyGoalRecords, [day]: next },
    } as UserData));
  }, [day, setUserData]);

  // ─ Выбрать шаблон / свою цель ───────────────────────────────────────────
  const handleSelect = useCallback((catId: GoalCategoryId, goalId: string, goalText: string, xp: number) => {
    const rec = localRecords.find(r => r.categoryId === catId);
    if (rec?.completed) return;
    const next: DailyGoalRecord[] = [
      ...localRecords.filter(r => r.categoryId !== catId),
      { categoryId: catId, goalId, goalText, completed: false, xpEarned: xp },
    ];
    applyRecords(next);
  }, [localRecords, applyRecords]);

  // ─ Снять выбор (повторный тап) ──────────────────────────────────────────
  const handleDeselect = useCallback((catId: GoalCategoryId) => {
    const rec = localRecords.find(r => r.categoryId === catId);
    if (!rec || rec.completed) return; // выполненную снять нельзя
    const next = localRecords.filter(r => r.categoryId !== catId);
    applyRecords(next);
  }, [localRecords, applyRecords]);

  // ─ Выполнить цель ───────────────────────────────────────────────────────
  const handleDone = useCallback((catId: GoalCategoryId) => {
    const rec = localRecords.find(r => r.categoryId === catId);
    if (!rec || rec.completed) return;
    const next = localRecords.map(r =>
      r.categoryId === catId ? { ...r, completed: true, completedAt: new Date().toISOString() } : r
    );

    // Обновляем streak
    const streaks = { ...((userData.goalStreaks as Record<string, any>) ?? {}) };
    const cur = streaks[catId] ?? { current: 0, longest: 0, lastCompletedDate: '' };
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    const isConsec = cur.lastCompletedDate === yesterday;
    const newCurrent = isConsec ? cur.current + 1 : 1;
    streaks[catId] = { current: newCurrent, longest: Math.max(newCurrent, cur.longest || 0), lastCompletedDate: day };

    // Сначала обновляем local мгновенно
    lastSyncedRef.current = JSON.stringify(next);
    setLocalRecords(next);

    setUserData(p => ({
      ...(p as UserData),
      xp: ((p as UserData).xp || 0) + rec.xpEarned,
      dailyGoalRecords: { ...(p as UserData).dailyGoalRecords, [day]: next },
      goalStreaks: streaks as UserData['goalStreaks'],
    } as UserData));

    setFloatXp(rec.xpEarned);
    setSheetCatId(null);
  }, [localRecords, userData.goalStreaks, day, setUserData]);

  // ─ Добавить свою цель ───────────────────────────────────────────────────
  const handleAddCustom = useCallback((catId: GoalCategoryId) => {
    const text = (inputs[catId] ?? '').trim();
    if (!text) return;
    const item: CustomGoalItem = { id: `custom-${Date.now()}`, text, xp: 30, categoryId: catId };
    setUserData(p => ({
      ...(p as UserData),
      goalCustomItems: {
        ...((p as UserData).goalCustomItems ?? {}),
        [catId]: [...((p as UserData).goalCustomItems?.[catId] ?? []), item],
      },
    } as UserData));
    setInputs(prev => ({ ...prev, [catId]: '' }));
  }, [inputs, setUserData]);

  // ─ Удалить свою цель ────────────────────────────────────────────────────
  const handleDeleteCustom = useCallback((catId: GoalCategoryId, itemId: string) => {
    setUserData(p => ({
      ...(p as UserData),
      goalCustomItems: {
        ...((p as UserData).goalCustomItems ?? {}),
        [catId]: ((p as UserData).goalCustomItems?.[catId] ?? []).filter(i => i.id !== itemId),
      },
    } as UserData));
  }, [setUserData]);

  const sheetCat    = sheetCatId ? (GOAL_CATEGORIES.find(c => c.id === sheetCatId) ?? null) : null;
  const sheetRec    = sheetCatId ? getLocalRec(sheetCatId) : undefined;
  const sheetCustom = sheetCatId ? (userData.goalCustomItems?.[sheetCatId] ?? []) : [];

  return (
    <div style={{ paddingBottom: 112, paddingTop: 4 }}>
      <style>{`
        @keyframes xpPop {
          0%   { opacity:0; transform:scale(.7) translateY(16px); }
          20%  { opacity:1; transform:scale(1.08) translateY(0); }
          70%  { opacity:1; transform:scale(1) translateY(-60px); }
          100% { opacity:0; transform:scale(.9) translateY(-90px); }
        }
        @keyframes sheetUp {
          from { transform:translateY(100%); }
          to   { transform:translateY(0); }
        }
      `}</style>

      {floatXp !== null && <XpPop xp={floatXp} onDone={() => setFloatXp(null)} />}

      {/* ── Шапка ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <h2 style={{ fontWeight: 900, fontSize: 18, color: '#0f172a', margin: 0 }}>
              {lang === 'kk' ? 'Күнделікті мақсаттар' : 'Ежедневные цели'}
            </h2>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>
              {lang === 'kk'
                ? `Бүгін ${doneCount} / ${GOAL_CATEGORIES.length} орындалды`
                : `Сегодня выполнено ${doneCount} / ${GOAL_CATEGORIES.length}`}
            </p>
          </div>
          {xpToday > 0 && (
            <div style={{ background: '#ecfdf5', border: '1.5px solid #6ee7b7', borderRadius: 20, padding: '5px 12px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: 900, fontSize: 13, color: '#10b981' }}>+{xpToday} XP</span>
            </div>
          )}
        </div>

        {/* Прогресс-бар */}
        <div style={{ height: 10, borderRadius: 10, background: '#f1f5f9', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%', borderRadius: 10,
              transition: 'width .7s cubic-bezier(.22,1,.36,1)',
              width: `${progressPct}%`,
              background:
                progressPct === 100 ? 'linear-gradient(90deg,#10b981,#059669)'
                : progressPct > 50  ? 'linear-gradient(90deg,#f59e0b,#10b981)'
                : progressPct > 0   ? 'linear-gradient(90deg,#fbbf24,#f59e0b)'
                : 'transparent',
            }}
          />
        </div>

        <p style={{ fontSize: 12, textAlign: 'center', margin: '8px 0 0', fontWeight: 600,
          color: progressPct === 100 ? '#10b981' : progressPct > 0 ? '#f59e0b' : '#cbd5e1' }}>
          {progressPct === 100
            ? `🎉 ${lang === 'kk' ? 'Барлық мақсаттар орындалды!' : 'Все цели выполнены!'}`
            : progressPct > 0
            ? `💪 ${lang === 'kk' ? `${GOAL_CATEGORIES.length - doneCount} мақсат қалды` : `Осталось ${GOAL_CATEGORIES.length - doneCount} цели`}`
            : `🌙 ${lang === 'kk' ? 'Бүгінгі мақсаттарыңызды таңдаңыз' : 'Выберите цели на сегодня'}`
          }
        </p>
      </div>

      {/* ── Список ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {GOAL_CATEGORIES.map(cat => (
          <CategoryRow
            key={cat.id}
            cat={cat}
            lang={lang}
            rec={getLocalRec(cat.id)}
            streak={getStreak(cat.id)}
            t={t}
            onOpen={() => setSheetCatId(cat.id)}
            onDone={() => handleDone(cat.id)}
          />
        ))}
      </div>

      {/* ── Bottom Sheet ── */}
      {sheetCat && (
        <GoalSheet
          cat={sheetCat}
          lang={lang}
          localRec={sheetRec}
          customItems={sheetCustom}
          inputVal={inputs[sheetCatId!] ?? ''}
          onClose={() => setSheetCatId(null)}
          onSelect={(id, text, xp) => handleSelect(sheetCatId!, id, text, xp)}
          onDeselect={() => handleDeselect(sheetCatId!)}
          onDone={() => handleDone(sheetCatId!)}
          onAddCustom={() => handleAddCustom(sheetCatId!)}
          onDeleteCustom={id => handleDeleteCustom(sheetCatId!, id)}
          onInputChange={v => setInputs(p => ({ ...p, [sheetCatId!]: v }))}
          t={t}
        />
      )}
    </div>
  );
};

export default TasksList;
