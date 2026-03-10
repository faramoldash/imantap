import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { UserData, Language } from '../src/types/types';
import { DHIKRS } from '../constants';

type TasbeehRecord = {
  counts: Record<string, number>;
  completedIds: string[];
  xpEarned: number;
};

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

function haptic(type: 'light' | 'success' = 'light') {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (type === 'success') tg?.HapticFeedback?.notificationOccurred('success');
    else tg?.HapticFeedback?.impactOccurred('light');
  } catch {}
}

const ACCENT  = '#10b981';
const R       = 90;
const CIRCUM  = 2 * Math.PI * R;
// Кнопка меньше кольца → кольцо всегда видно, scale не закрывает
const BTN_SIZE = 178;   // должно быть меньше (220 - 2*R_stroke_outer) = 220 - 2*(90+5) = 30px зазор
const BTN_OFFSET = (220 - BTN_SIZE) / 2;

const Tasbeeh: React.FC<Props> = ({ language: lang, userData, setUserData }) => {
  const [selectedId, setSelectedId] = useState(DHIKRS[0].id);
  const [tapping,    setTapping]    = useState(false);
  const [flash,      setFlash]      = useState(false);
  const processingRef               = useRef(false);
  const carouselRef                 = useRef<HTMLDivElement>(null);

  const scrollToCard = useCallback((index: number) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const card = carousel.children[index] as HTMLElement;
    if (!card) return;
    const carouselCenter = carousel.offsetWidth / 2;
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    carousel.scrollTo({ left: cardCenter - carouselCenter, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const index = DHIKRS.findIndex(d => d.id === selectedId);
    if (index >= 0) setTimeout(() => scrollToCard(index), 100);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const day   = todayStr();
  const dhikr = DHIKRS.find(d => d.id === selectedId)!;

  const record: TasbeehRecord = useMemo(() =>
    (userData.tasbeehRecords as any)?.[day] ?? { counts: {}, completedIds: [], xpEarned: 0 },
    [userData.tasbeehRecords, day]
  );

  const count    = record.counts[selectedId] ?? 0;
  const xpEarned = record.completedIds.includes(selectedId);
  const xpToday  = record.xpEarned;
  const totals = userData.tasbeehTotals || {};

  // Кольцо продолжает крутиться после target (по кругу заново)
  const ringCount    = count === 0 ? 0 : count <= dhikr.target
    ? count
    : (count % dhikr.target) || dhikr.target;
  const strokeOffset = CIRCUM * (1 - ringCount / dhikr.target);

  const handleTap = useCallback(() => {
    if (processingRef.current) return;
    processingRef.current = true;
    setTimeout(() => { processingRef.current = false; }, 80);
    haptic('light');

    setUserData(prev => {
      const prevRec: TasbeehRecord = (prev.tasbeehRecords as any)?.[day]
        ?? { counts: {}, completedIds: [], xpEarned: 0 };
      const prevCount     = prevRec.counts[selectedId] ?? 0;
      const newCount      = prevCount + 1;
      const justHitTarget = newCount === dhikr.target &&
        !prevRec.completedIds.includes(selectedId);

      if (justHitTarget) {
        haptic('success');
        setFlash(true);
        setTimeout(() => setFlash(false), 700);
      }

      const prevTotals = prev.tasbeehTotals || {};
      return {
        ...prev,
        xp: (prev.xp ?? 0) + (justHitTarget ? dhikr.xp : 0),
        tasbeehTotals: {
          ...prevTotals,
          [selectedId]: (prevTotals[selectedId] ?? 0) + 1,
        },
        tasbeehRecords: {
          ...(prev.tasbeehRecords ?? {}),
          [day]: {
            counts:       { ...prevRec.counts, [selectedId]: newCount },
            completedIds: justHitTarget
              ? [...prevRec.completedIds, selectedId]
              : prevRec.completedIds,
            xpEarned: prevRec.xpEarned + (justHitTarget ? dhikr.xp : 0),
          },
        },
      };
    });
  }, [selectedId, dhikr, day, setUserData]);

  const handleReset = useCallback(() => {
    setUserData(prev => {
      const prevRec: TasbeehRecord = (prev.tasbeehRecords as any)?.[day]
        ?? { counts: {}, completedIds: [], xpEarned: 0 };
      const wasCompleted = prevRec.completedIds.includes(selectedId);
      const prevTotals = prev.tasbeehTotals || {};
      const currentCount = prevRec.counts[selectedId] ?? 0;
      return {
        ...prev,
        xp: Math.max(0, (prev.xp ?? 0) - (wasCompleted ? dhikr.xp : 0)),
        tasbeehTotals: {
          ...prevTotals,
          [selectedId]: Math.max(0, (prevTotals[selectedId] ?? 0) - currentCount),
        },
        tasbeehRecords: {
          ...(prev.tasbeehRecords ?? {}),
          [day]: {
            counts:       { ...prevRec.counts, [selectedId]: 0 },
            completedIds: prevRec.completedIds.filter(id => id !== selectedId),
            xpEarned:     Math.max(0, prevRec.xpEarned - (wasCompleted ? dhikr.xp : 0)),
          },
        },
      };
    });
  }, [selectedId, dhikr, day, setUserData]);

  const translit = lang === 'kk' ? dhikr.translit_kk : dhikr.translit_ru;
  const meaning  = lang === 'kk' ? dhikr.meaning_kk  : dhikr.meaning_ru;
  const name     = lang === 'kk' ? dhikr.name_kk     : dhikr.name_ru;

  return (
    <div style={{ paddingBottom: 112, paddingTop: 4 }}>
      <style>{`
        @keyframes flashGlow {
          0%   { opacity: 1; }
          40%  { opacity: 0.25; }
          100% { opacity: 1; }
        }
        @keyframes popIn {
          0%   { transform: scale(0.75); opacity: 0; }
          70%  { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        .tasbeeh-btn:active { transform: scale(0.94) !important; }
      `}</style>

      {/* ── Шапка ── */}
      <div style={{
        background: 'linear-gradient(135deg,#0f172a,#1e293b)',
        borderRadius: 32, padding: '18px 20px 16px',
        marginBottom: 20, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:110, height:110,
          borderRadius:'50%', background:'rgba(16,185,129,0.10)', pointerEvents:'none' }} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <p style={{ fontSize:22, fontWeight:900, color:'#fff', margin:0 }}>
            {lang === 'kk' ? 'Зікір санағышы' : 'Счётчик зикра'}
          </p>
          {xpToday > 0 && (
            <span style={{ background:'rgba(16,185,129,0.18)',
              border:'1px solid rgba(16,185,129,0.3)', borderRadius:14,
              padding:'5px 13px', fontSize:13, fontWeight:900, color:'#34d399' }}>
              +{xpToday} XP
            </span>
          )}
        </div>
      </div>

      {/* ── Выбор зікіра ── */}
      <style>{`
        .tasbeeh-carousel::-webkit-scrollbar { display: none; }
        .dhikr-card { transition: all .2s ease; }
      `}</style>
      <div
        ref={carouselRef}
        className="tasbeeh-carousel"
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          paddingBottom: 8,
          marginBottom: 24,
          marginLeft: -16,
          marginRight: -16,
          paddingLeft: `calc(50vw - 80px)`,
          paddingRight: `calc(50vw - 80px)`,
          paddingTop: 4,
          scrollbarWidth: 'none' as any,
          WebkitOverflowScrolling: 'touch' as any,
          scrollSnapType: 'x mandatory',
        }}
      >
        {DHIKRS.map((d, index) => {
          const sel  = d.id === selectedId;
          const done = record.completedIds.includes(d.id);
          const nm   = lang === 'kk' ? d.name_kk : d.name_ru;
          return (
            <button
              key={d.id}
              type="button"
              data-index={index}
              onClick={() => {
                setSelectedId(d.id);
                scrollToCard(index);
              }}
              className="dhikr-card"
              style={{
                flexShrink: 0,
                minWidth: 100,
                maxWidth: 160,
                padding: '8px 12px',
                borderRadius: 16,
                background: sel ? ACCENT : done ? '#ecfdf5' : '#f8fafc',
                border: `1.5px solid ${sel ? ACCENT : done ? ACCENT + '55' : '#e2e8f0'}`,
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                scrollSnapAlign: 'center',
                transform: sel ? 'scale(1.04)' : 'scale(0.96)',
                opacity: sel ? 1 : 0.75,
                boxShadow: sel ? `0 4px 16px ${ACCENT}33` : 'none',
              }}
            >
              <p style={{
                margin: 0, fontSize: 12, fontWeight: 900, whiteSpace: 'normal',
                color: sel ? '#fff' : done ? ACCENT : '#64748b',
                textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.3,
              }}>
                {done && !sel ? '✓ ' : ''}{nm}
              </p>
              <p style={{
                margin: '4px 0 0', fontSize: 10, textAlign: 'center',
                color: sel ? 'rgba(255,255,255,.75)' : '#94a3b8', fontWeight: 600,
              }}>
                {record.counts[d.id] ?? 0}/{d.target}
              </p>
              {(totals[d.id] ?? 0) > 0 && (
                <p style={{
                  margin: '2px 0 0', fontSize: 9, textAlign: 'center',
                  color: sel ? 'rgba(255,255,255,.5)' : '#cbd5e1',
                }}>
                  {lang === 'kk' ? 'жалпы: ' : 'всего: '}{totals[d.id]}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Текст зікіра ── */}
      <div style={{ textAlign:'center', padding:'0 20px', marginBottom:22 }}>
        {/* Arabic */}
        <p style={{
          fontSize: 30, fontWeight: 700, color: '#0f172a',
          margin: '0 0 8px', direction: 'rtl', fontFamily: 'serif', lineHeight: 1.6,
        }}>
          {dhikr.arabic}
        </p>
        {/* Транслит */}
        <p style={{ fontSize: 14, fontWeight: 700, color: '#475569', margin: '0 0 6px' }}>
          {translit}
        </p>
        {/* Перевод */}
        <p style={{ fontSize: 14, fontWeight: 400, color: '#94a3b8', margin: 0 }}>
          {meaning}
        </p>
      </div>

      {/* ── Кольцо + кнопка ── */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:20 }}>
        <div style={{ position:'relative', width:220, height:220 }}>

          {/* SVG кольцо — всегда поверх, кнопка меньше → кольцо не перекрыто */}
          <svg width="220" height="220"
            style={{ position:'absolute', top:0, left:0, pointerEvents:'none', zIndex:2 }}>
            <circle cx="110" cy="110" r={R}
              fill="none" stroke="#f1f5f9" strokeWidth="10" />
            <circle cx="110" cy="110" r={R}
              fill="none"
              stroke={ACCENT}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUM}
              strokeDashoffset={strokeOffset}
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: '110px 110px',
                transition: 'stroke-dashoffset .25s ease',
                ...(flash ? { animation: 'flashGlow .7s ease' } : {}),
              }}
            />
          </svg>

          {/* Кнопка (меньше SVG, кольцо всегда видно) */}
          <button
            type="button"
            className="tasbeeh-btn"
            onClick={() => { setTapping(true); setTimeout(() => setTapping(false), 150); handleTap(); }}
            style={{
              position: 'absolute',
              top:    BTN_OFFSET,
              left:   BTN_OFFSET,
              width:  BTN_SIZE,
              height: BTN_SIZE,
              borderRadius: '50%',
              background: xpEarned ? '#ecfdf5' : '#ffffff',
              border: 'none',
              cursor: 'pointer',
              zIndex: 1,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 6px 28px ${ACCENT}22`,
              transition: 'transform .1s ease, background .3s',
              transform: tapping ? 'scale(0.93)' : 'scale(1)',
              userSelect: 'none',
            }}
          >
            <span style={{ fontSize:56, fontWeight:900, color:'#0f172a', lineHeight:1 }}>
              {count}
            </span>
            <p style={{ fontSize:13, color:'#94a3b8', margin:'3px 0 0', fontWeight:600 }}>
              / {dhikr.target}
            </p>
            {xpEarned ? (
              <p style={{ fontSize:12, color:ACCENT, margin:'6px 0 0', fontWeight:800,
                animation:'popIn .4s ease' }}>
                +{dhikr.xp} XP ✓
              </p>
            ) : (
              <p style={{ fontSize:12, color:ACCENT, margin:'7px 0 0', fontWeight:700 }}>
                {lang === 'kk' ? 'Басу →' : 'Нажимай →'}
              </p>
            )}
          </button>
        </div>

        {/* Сброс */}
        {count > 0 && (
          <button type="button" onClick={handleReset}
            style={{
              marginTop:14, padding:'7px 18px', borderRadius:14,
              background:'#f8fafc', border:'1.5px solid #f1f5f9',
              fontSize:12, fontWeight:700, color:'#94a3b8',
              cursor:'pointer', touchAction:'manipulation',
              WebkitTapHighlightColor:'transparent',
            }}
          >
            {lang === 'kk' ? '↺ Нөлден бастау' : '↺ Сбросить'}
          </button>
        )}
      </div>

      {/* ── Итоги дня ── */}
      <div style={{ background:'#f8fafc', border:'1.5px solid #f1f5f9',
        borderRadius:28, padding:'16px 20px' }}>
        <p style={{ fontSize:10, fontWeight:900, color:'#94a3b8',
          textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 14px' }}>
          📊 {lang === 'kk' ? 'Бүгінгі нәтиже' : 'Итог дня'}
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {DHIKRS.map(d => {
            const c    = record.counts[d.id] ?? 0;
            const done = record.completedIds.includes(d.id);
            const pct  = Math.min((c / d.target) * 100, 100);
            const nm   = lang === 'kk' ? d.name_kk : d.name_ru;
            return (
              <div key={d.id}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:600, color: done ? ACCENT : '#64748b' }}>
                    {done ? '✓ ' : ''}{nm}
                  </span>
                  <span style={{ fontSize:12, fontWeight:900, color: done ? ACCENT : '#94a3b8' }}>
                    {c}/{d.target}{done ? ` · +${d.xp} XP` : ''}
                  </span>
                </div>
                <div style={{ height:4, borderRadius:4, background:'#e2e8f0', overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:4,
                    width:`${pct}%`, background:ACCENT, transition:'width .4s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
        {xpToday > 0 && (
          <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #f1f5f9',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:12, color:'#94a3b8' }}>
              {lang === 'kk' ? 'Бүгін жиналды' : 'Заработано сегодня'}
            </span>
            <span style={{ fontSize:13, fontWeight:900, color:ACCENT }}>
              +{xpToday} XP ✨
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasbeeh;