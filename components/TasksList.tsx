import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  UserData, Language, GoalCategoryId,
  DailyGoalRecord, CustomGoalItem
} from '../src/types/types';
import {
  TRANSLATIONS, GOAL_CATEGORIES, GoalTemplate, GoalCategory,
  getTodayGoalRecords,
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

// ─── XP pop-up ──────────────────────────────────────────────────────
const XpPop: React.FC<{ xp: number; onDone: () => void }> = ({ xp, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 1800); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="pointer-events-none fixed z-[999] inset-x-0 flex justify-center" style={{ top: '38%' }}>
      <div className="bg-emerald-500 text-white font-black text-xl px-7 py-3 rounded-full shadow-2xl"
        style={{ animation: 'xpPop 1.8s cubic-bezier(.22,1,.36,1) forwards' }}>
        +{xp} XP ✨
      </div>
    </div>
  );
};

// ─── Строка категории ───────────────────────────────────────────────────
// FIX #4: внешний контейнер — <div role="button">, а не <button>,
// чтобы вложенная кнопка «Орындадым» работала корректно в iOS/Telegram WebView.
const CategoryRow: React.FC<{
  cat: GoalCategory; lang: Language; rec?: DailyGoalRecord; streak: number;
  onOpen: () => void; onDone: () => void; t: Record<string, string>;
}> = ({ cat, lang, rec, streak, onOpen, onDone, t }) => {
  const done     = rec?.completed === true;
  const selected = !!rec && !done;
  const name     = lang === 'kk' ? cat.name_kk : cat.name_ru;
  const bg       = done ? '#ecfdf5' : selected ? '#fefce8' : '#ffffff';
  const border   = done ? '#6ee7b7' : selected ? '#fde68a' : '#f1f5f9';
  const shadow   = done ? '0 2px 8px rgba(16,185,129,.12)' : selected ? '0 2px 8px rgba(234,179,8,.12)' : '0 1px 4px rgba(0,0,0,.05)';

  return (
    <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 18, boxShadow: shadow, overflow: 'hidden' }}>
      {/* FIX #4: div role="button" вместо <button>, чтобы не было <button> внутри <button> */}
      <div
        role="button"
        tabIndex={0}
        style={{
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          textAlign: 'left',
          background: 'none',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={onOpen}
        onKeyDown={e => e.key === 'Enter' && onOpen()}
      >
        <div style={{ width: 44, height: 44, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, background: done ? '#d1fae5' : selected ? '#fef9c3' : '#f8fafc' }}>
          {done ? '✅' : cat.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: done ? '#059669' : '#0f172a', textDecoration: done ? 'line-through' : 'none', opacity: done ? .75 : 1 }}>{name}</span>
            {streak > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#f97316' }}>🔥{streak}</span>}
          </div>
          {selected && rec && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#b45309', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.goalText}</p>}
          {done    && rec && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#059669', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.goalText}</p>}
          {!done && !selected && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>{lang === 'kk' ? 'Таңдау →' : 'Выбрать →'}</p>}
        </div>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          {done && rec && rec.xpEarned > 0 && <span style={{ fontSize: 12, fontWeight: 900, color: '#10b981' }}>+{rec.xpEarned} XP</span>}
          {selected && (
            // Теперь это законная вложенная <button> — родитель div, не button
            <button
              type="button"
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                background: 'linear-gradient(135deg,#10b981,#059669)',
                color: '#fff',
                fontWeight: 900,
                fontSize: 12,
                padding: '8px 14px',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
              }}
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
      </div>
    </div>
  );
};

// ─── хук для высоты visualViewport ──────────────────────────────────────────
function useViewportHeight() {
  const [vh, setVh] = useState(() => {
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    return vv ? vv.height : window.innerHeight;
  });
  useEffect(() => {
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    if (!vv) return;
    const update = () => setVh(vv.height);
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, []);
  return vh;
}

// ─── Bottom Sheet ──────────────────────────────────────────────────────
const GoalSheet: React.FC<{
  cat: GoalCategory; lang: Language; localRec?: DailyGoalRecord;
  customItems: CustomGoalItem[]; inputVal: string;
  onClose: () => void; onSelect: (id: string, text: string, xp: number) => void;
  onDeselect: () => void; onDone: () => void; onAddCustom: () => void;
  onDeleteCustom: (id: string) => void; onInputChange: (v: string) => void;
  t: Record<string, string>;
}> = ({ cat, lang, localRec, customItems, inputVal, onClose, onSelect, onDeselect, onDone, onAddCustom, onDeleteCustom, onInputChange, t }) => {
  const done     = localRec?.completed === true;
  const selected = !!localRec && !done;
  const name     = lang === 'kk' ? cat.name_kk : cat.name_ru;
  const inputRef = useRef<HTMLInputElement>(null);

  const vpHeight  = useViewportHeight();
  const sheetMaxH = Math.floor(vpHeight * 0.88);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(15,23,42,.5)', overflow: 'hidden' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '22px 22px 0 0',
          maxHeight: sheetMaxH,
          display: 'flex',
          flexDirection: 'column',
          animation: 'sheetUp .26s cubic-bezier(.22,1,.36,1)',
          transition: 'max-height .25s ease',
          overflow: 'hidden',
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
              <p style={{ fontSize: 11, margin: 0, fontWeight: 600, color: done ? '#10b981' : selected ? '#d97706' : '#94a3b8' }}>
                {done
                  ? (lang === 'kk' ? '✓ Орындалды' : '✓ Выполнено')
                  : selected
                  ? (lang === 'kk' ? 'Мақсат таңдалды' : 'Цель выбрана')
                  : (lang === 'kk' ? 'Мақсат таңдаңыз' : 'Выберите цель')}
              </p>
            </div>
          </div>
          <button type="button"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#64748b', fontWeight: 700 }}
            onClick={onClose}>✕</button>
        </div>

        {/* Скроллируемый контент */}
        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any, flex: 1, padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ВЫПОЛНЕНО */}
          {done && localRec && (
            <div style={{ background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '1.5px solid #6ee7b7', borderRadius: 16, padding: '20px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 36, margin: '0 0 8px' }}>🎉</p>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#065f46', margin: '0 0 4px' }}>{localRec.goalText}</p>
              {localRec.xpEarned > 0 && <p style={{ fontWeight: 900, fontSize: 14, color: '#10b981', margin: '0 0 8px' }}>+{localRec.xpEarned} XP</p>}
              <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{lang === 'kk' ? 'Ертең жаңа мақсат таңдауға болады' : 'Завтра можно выбрать новую цель'}</p>
            </div>
          )}

          {/* ВЫБРАННАЯ ЦЕЛЬ */}
          {selected && localRec && (
            <div style={{ background: '#fefce8', border: '1.5px solid #fde68a', borderRadius: 16, padding: '14px 16px' }}>
              <p style={{ fontSize: 10, fontWeight: 900, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
                {lang === 'kk' ? 'Таңдалған мақсат' : 'Выбранная цель'}
              </p>
              <p style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', margin: '0 0 10px', lineHeight: 1.4 }}>{localRec.goalText}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                {localRec.xpEarned > 0 ? <span style={{ fontWeight: 900, fontSize: 13, color: '#d97706' }}>+{localRec.xpEarned} XP</span> : <span />}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button"
                    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', background: '#f1f5f9', color: '#64748b', fontWeight: 700, fontSize: 13, padding: '10px 14px', borderRadius: 14, border: 'none', cursor: 'pointer' }}
                    onClick={onDeselect}>{lang === 'kk' ? 'Алып тастау' : 'Снять'}</button>
                  <button type="button"
                    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 900, fontSize: 14, padding: '10px 22px', borderRadius: 14, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,.4)' }}
                    onClick={onDone}>{t.goalsDoneBtn || 'Орындадым ✓'}</button>
                </div>
              </div>
            </div>
          )}

          {/* ШАБЛОНЫ */}
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
                    <button key={tmpl.id} type="button"
                      style={{
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                        background: chosen ? 'linear-gradient(135deg,#10b981,#059669)' : '#f8fafc',
                        border: chosen ? '1.5px solid #10b981' : '1.5px solid #f1f5f9',
                        borderRadius: 14, padding: '12px 14px', cursor: 'pointer',
                        boxShadow: chosen ? '0 2px 10px rgba(16,185,129,.2)' : 'none',
                        textAlign: 'left', width: '100%', transition: 'background .15s, border-color .15s',
                      }}
                      onClick={() => chosen ? onDeselect() : onSelect(tmpl.id, label, tmpl.xp)}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: chosen ? '#fff' : '#1e293b', lineHeight: 1.35, flex: 1 }}>{label}</span>
                      <span style={{ fontWeight: 900, fontSize: 11, color: chosen ? 'rgba(255,255,255,.8)' : '#10b981', flexShrink: 0 }}>{chosen ? '✓ ' : '+'}{tmpl.xp} XP</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* МОИ ЦЕЛИ */}
          {!done && customItems.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
                {lang === 'kk' ? 'Менің мақсаттарым' : 'Мои цели'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {customItems.map(item => {
                  const chosen = localRec?.goalId === item.id;
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: chosen ? 'linear-gradient(135deg,#10b981,#059669)' : '#f8fafc', border: chosen ? '1.5px solid #10b981' : '1.5px solid #f1f5f9', borderRadius: 14, padding: '12px 14px', transition: 'background .15s' }}>
                      <button type="button"
                        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={() => chosen ? onDeselect() : onSelect(item.id, item.text, 0)}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: chosen ? '#fff' : '#1e293b', display: 'block' }}>{item.text}</span>
                        <span style={{ fontSize: 11, color: chosen ? 'rgba(255,255,255,.6)' : '#94a3b8' }}>{lang === 'kk' ? 'Өз мақсат' : 'Своя цель'}</span>
                      </button>
                      <button type="button"
                        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', width: 28, height: 28, borderRadius: '50%', background: chosen ? 'rgba(255,255,255,.2)' : '#e2e8f0', border: 'none', cursor: 'pointer', color: chosen ? '#fff' : '#94a3b8', fontSize: 11, flexShrink: 0 }}
                        onClick={() => onDeleteCustom(item.id)}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ДОБАВИТЬ СВОЮ ЦЕЛЬ */}
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
                  // FIX #5: onKeyPress устарел → onKeyDown
                  onKeyDown={e => e.key === 'Enter' && onAddCustom()}
                  placeholder={lang === 'kk' ? 'Мақсатыңызды жазыңыз...' : 'Напишите цель...'}
                  style={{ flex: 1, fontSize: 14, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '12px 16px', outline: 'none' }}
                  onFocus={e => {
                    (e.target as HTMLInputElement).style.borderColor = '#10b981';
                    // FIX #7: уменьшена задержка 400ms → 200ms для Android
                    setTimeout(() => inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200);
                  }}
                  onBlur={e => { (e.target as HTMLInputElement).style.borderColor = '#e2e8f0'; }}
                />
                <button type="button"
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', width: 48, height: 48, borderRadius: 14, background: inputVal.trim() ? 'linear-gradient(135deg,#10b981,#059669)' : '#e2e8f0', border: 'none', cursor: 'pointer', color: inputVal.trim() ? '#fff' : '#94a3b8', fontSize: 22, fontWeight: 900, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={onAddCustom}>+</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN ────────────────────────────────────────────────────────────────
const TasksList: React.FC<Props> = ({ language: lang, userData, setUserData }) => {
  const t   = TRANSLATIONS[lang] as Record<string, string>;

  // FIX #3: day пересчитывается каждую минуту, чтобы при смене дня данные сбросились
  const [day, setDay] = useState(todayStr);
  useEffect(() => {
    const id = setInterval(() => {
      const newDay = todayStr();
      setDay(prev => prev !== newDay ? newDay : prev);
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const [localRecords, setLocalRecords] = useState<DailyGoalRecord[]>(
    () => getTodayGoalRecords(userData.dailyGoalRecords, day)
  );
  const [localCustom, setLocalCustom] = useState<Record<string, CustomGoalItem[]>>(
    () => (userData.goalCustomItems as Record<string, CustomGoalItem[]>) || {}
  );

  // FIX #3: когда day меняется — сразу обновляем localRecords под новый день
  const lastSyncedRef = useRef(JSON.stringify(getTodayGoalRecords(userData.dailyGoalRecords, day)));
  useEffect(() => {
    const incoming = getTodayGoalRecords(userData.dailyGoalRecords, day);
    const str = JSON.stringify(incoming);
    lastSyncedRef.current = str;
    setLocalRecords(incoming);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  // При входящих изменениях userData — синкаем только если изменилось снаружи
  useEffect(() => {
    const incoming = getTodayGoalRecords(userData.dailyGoalRecords, day);
    const str = JSON.stringify(incoming);
    if (str !== lastSyncedRef.current) { lastSyncedRef.current = str; setLocalRecords(incoming); }
  }, [userData.dailyGoalRecords, day]);

  const lastCustomRef = useRef(JSON.stringify(userData.goalCustomItems || {}));
  useEffect(() => {
    const str = JSON.stringify(userData.goalCustomItems || {});
    if (str !== lastCustomRef.current) { lastCustomRef.current = str; setLocalCustom((userData.goalCustomItems as Record<string, CustomGoalItem[]>) || {}); }
  }, [userData.goalCustomItems]);

  const [sheetCatId, setSheetCatId] = useState<GoalCategoryId | null>(null);
  const [inputs,     setInputs]     = useState<Record<string, string>>({});
  const [floatXp,    setFloatXp]    = useState<number | null>(null);

  // FIX #1: Set для блокировки повторного handleDone пока выполняется первый
  const processingRef = useRef<Set<string>>(new Set());

  const doneCount   = localRecords.filter(r => r.completed).length;
  const xpToday     = localRecords.filter(r => r.completed).reduce((s, r) => s + r.xpEarned, 0);
  const progressPct = Math.round((doneCount / GOAL_CATEGORIES.length) * 100);

  const getLocalRec = useCallback((id: GoalCategoryId) => localRecords.find(r => r.categoryId === id), [localRecords]);
  const getStreak   = (id: GoalCategoryId): number =>
    ((userData.goalStreaks as Record<string, { current: number }> | undefined)?.[id]?.current ?? 0);

  const applyRecords = useCallback((next: DailyGoalRecord[]) => {
    lastSyncedRef.current = JSON.stringify(next);
    setLocalRecords(next);
    setUserData(p => ({ ...(p as UserData), dailyGoalRecords: { ...(p as UserData).dailyGoalRecords, [day]: next } } as UserData));
  }, [day, setUserData]);

  const handleSelect = useCallback((catId: GoalCategoryId, goalId: string, goalText: string, xp: number) => {
    if (localRecords.find(r => r.categoryId === catId)?.completed) return;
    applyRecords([...localRecords.filter(r => r.categoryId !== catId), { categoryId: catId, goalId, goalText, completed: false, xpEarned: xp }]);
  }, [localRecords, applyRecords]);

  const handleDeselect = useCallback((catId: GoalCategoryId) => {
    const rec = localRecords.find(r => r.categoryId === catId);
    if (!rec || rec.completed) return;
    applyRecords(localRecords.filter(r => r.categoryId !== catId));
  }, [localRecords, applyRecords]);

  const handleDone = useCallback((catId: GoalCategoryId) => {
    // FIX #1: блокируем повторный вызов от double-tap, пока не пройдёт 1 секунда
    if (processingRef.current.has(catId)) return;
    processingRef.current.add(catId);
    setTimeout(() => processingRef.current.delete(catId), 1000);

    const rec = localRecords.find(r => r.categoryId === catId);
    if (!rec || rec.completed) { processingRef.current.delete(catId); return; }

    const next = localRecords.map(r =>
      r.categoryId === catId ? { ...r, completed: true, completedAt: new Date().toISOString() } : r
    );
    const streaks = { ...((userData.goalStreaks as Record<string, any>) ?? {}) };
    const cur = streaks[catId] ?? { current: 0, longest: 0, lastCompletedDate: '' };
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA', {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    const newCurrent = cur.lastCompletedDate === yesterday ? cur.current + 1 : 1;
    streaks[catId] = {
      current: newCurrent,
      longest: Math.max(newCurrent, cur.longest || 0),
      lastCompletedDate: day,
    };
    lastSyncedRef.current = JSON.stringify(next);
    setLocalRecords(next);
    setUserData(p => ({
      ...(p as UserData),
      xp: ((p as UserData).xp || 0) + rec.xpEarned,
      dailyGoalRecords: { ...(p as UserData).dailyGoalRecords, [day]: next },
      goalStreaks: streaks as UserData['goalStreaks'],
    } as UserData));
    if (rec.xpEarned > 0) setFloatXp(rec.xpEarned);
    setSheetCatId(null);
  }, [localRecords, userData.goalStreaks, day, setUserData]);

  const handleAddCustom = useCallback((catId: GoalCategoryId) => {
    const text = (inputs[catId] ?? '').trim();
    if (!text) return;
    const item: CustomGoalItem = { id: `custom-${Date.now()}`, text, xp: 0, categoryId: catId };
    const updated = { ...localCustom, [catId]: [...(localCustom[catId] ?? []), item] };
    lastCustomRef.current = JSON.stringify(updated);
    setLocalCustom(updated);
    setUserData(p => ({
      ...(p as UserData),
      goalCustomItems: {
        ...((p as UserData).goalCustomItems ?? {}),
        [catId]: [...((p as UserData).goalCustomItems?.[catId] ?? []), item],
      },
    } as UserData));
    setInputs(prev => ({ ...prev, [catId]: '' }));
  }, [inputs, localCustom, setUserData]);

  const handleDeleteCustom = useCallback((catId: GoalCategoryId, itemId: string) => {
    const updated = { ...localCustom, [catId]: (localCustom[catId] ?? []).filter(i => i.id !== itemId) };
    lastCustomRef.current = JSON.stringify(updated);
    setLocalCustom(updated);
    setUserData(p => ({
      ...(p as UserData),
      goalCustomItems: {
        ...((p as UserData).goalCustomItems ?? {}),
        [catId]: ((p as UserData).goalCustomItems?.[catId] ?? []).filter(i => i.id !== itemId),
      },
    } as UserData));
  }, [localCustom, setUserData]);

  const sheetCat    = sheetCatId ? (GOAL_CATEGORIES.find(c => c.id === sheetCatId) ?? null) : null;
  const sheetRec    = sheetCatId ? getLocalRec(sheetCatId) : undefined;
  const sheetCustom = sheetCatId ? (localCustom[sheetCatId] ?? []) : [];

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

      {floatXp !== null && floatXp > 0 && <XpPop xp={floatXp} onDone={() => setFloatXp(null)} />}

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
            <div style={{ background: '#ecfdf5', border: '1.5px solid #6ee7b7', borderRadius: 20, padding: '5px 12px' }}>
              <span style={{ fontWeight: 900, fontSize: 13, color: '#10b981' }}>+{xpToday} XP</span>
            </div>
          )}
        </div>
        <div style={{ height: 10, borderRadius: 10, background: '#f1f5f9', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 10, transition: 'width .7s cubic-bezier(.22,1,.36,1)',
            width: `${progressPct}%`,
            background:
              progressPct === 100 ? 'linear-gradient(90deg,#10b981,#059669)'
              : progressPct > 50  ? 'linear-gradient(90deg,#f59e0b,#10b981)'
              : progressPct > 0   ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'transparent',
          }} />
        </div>
        <p style={{
          fontSize: 12, textAlign: 'center', margin: '8px 0 0', fontWeight: 600,
          color: progressPct === 100 ? '#10b981' : progressPct > 0 ? '#f59e0b' : '#cbd5e1',
        }}>
          {progressPct === 100
            ? `🎉 ${lang === 'kk' ? 'Барлық мақсаттар орындалды!' : 'Все цели выполнены!'}`
            : progressPct > 0
            ? `💪 ${lang === 'kk' ? `${GOAL_CATEGORIES.length - doneCount} мақсат қалды` : `Осталось ${GOAL_CATEGORIES.length - doneCount} цели`}`
            : `🌙 ${lang === 'kk' ? 'Бүгінгі мақсаттарыңызды таңдаңыз' : 'Выберите цели на сегодня'}`}
        </p>
      </div>

      {/* ── Список ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {GOAL_CATEGORIES.map(cat => (
          <CategoryRow key={cat.id} cat={cat} lang={lang}
            rec={getLocalRec(cat.id)} streak={getStreak(cat.id)} t={t}
            onOpen={() => setSheetCatId(cat.id)}
            onDone={() => handleDone(cat.id)}
          />
        ))}
      </div>

      {/* ── Bottom Sheet ── */}
      {sheetCat && (
        <GoalSheet
          cat={sheetCat} lang={lang} localRec={sheetRec}
          customItems={sheetCustom} inputVal={inputs[sheetCatId!] ?? ''}
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
