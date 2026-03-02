import React, { useState, useCallback, useRef, useMemo } from 'react';
import { UserData, Language } from '../src/types/types';

interface DhikrType {
  id: string;
  arabic: string;
  translit: string;
  name_kk: string;
  name_ru: string;
  target: number;
  xp: number;
  color: string;
  light: string;
}

const DHIKRS: DhikrType[] = [
  { id: 'subhanallah',    arabic: 'سُبْحَانَ اللَّهِ',         translit: 'Субханалла',          name_kk: 'Субханалла',         name_ru: 'Субханалла',       target: 33,  xp: 30, color: '#10b981', light: '#ecfdf5' },
  { id: 'alhamdulillah',  arabic: 'الْحَمْدُ لِلَّهِ',          translit: 'Алхамдулилла',        name_kk: 'Алхамдулилла',       name_ru: 'Альхамдулилла',    target: 33,  xp: 30, color: '#3b82f6', light: '#eff6ff' },
  { id: 'allahuakbar',    arabic: 'اللَّهُ أَكْبَرُ',           translit: 'Аллаһу Акбар',        name_kk: 'Аллаһу Акбар',       name_ru: 'Аллаху Акбар',     target: 33,  xp: 30, color: '#f59e0b', light: '#fffbeb' },
  { id: 'astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ',       translit: 'Астагфирулла',        name_kk: 'Астагфирулла',       name_ru: 'Астагфирулла',     target: 100, xp: 40, color: '#8b5cf6', light: '#f5f3ff' },
  { id: 'lailaha',        arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', translit: 'Ла илаха иллаллаһ',  name_kk: 'Ла илаха иллаллаһ',  name_ru: 'Ля иляха иллалла', target: 100, xp: 50, color: '#ec4899', light: '#fdf2f8' },
];

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

const R = 88;
const CIRCUM = 2 * Math.PI * R;

const Tasbeeh: React.FC<Props> = ({ language: lang, userData, setUserData }) => {
  const [selectedId, setSelectedId] = useState('subhanallah');
  const [tapping, setTapping] = useState(false);
  const [flash, setFlash] = useState(false);
  const processingRef = useRef(false);

  const day = todayStr();

  const record: TasbeehRecord = useMemo(() =>
    (userData.tasbeehRecords as any)?.[day] ?? { counts: {}, completedIds: [], xpEarned: 0 },
    [userData.tasbeehRecords, day]
  );

  const dhikr  = DHIKRS.find(d => d.id === selectedId)!;
  const count  = record.counts[selectedId] ?? 0;
  const isDone = record.completedIds.includes(selectedId);
  const xpToday = record.xpEarned;
  const strokeOffset = CIRCUM * (1 - Math.min(count / dhikr.target, 1));

  const handleTap = useCallback(() => {
    if (isDone || processingRef.current) return;
    processingRef.current = true;
    setTimeout(() => { processingRef.current = false; }, 80);

    haptic('light');
    setTapping(true);
    setTimeout(() => setTapping(false), 120);

    setUserData(prev => {
      const prevRec: TasbeehRecord = (prev.tasbeehRecords as any)?.[day]
        ?? { counts: {}, completedIds: [], xpEarned: 0 };
      const prevCount = prevRec.counts[selectedId] ?? 0;
      const newCount  = prevCount + 1;
      const justDone  = newCount >= dhikr.target && !prevRec.completedIds.includes(selectedId);

      if (justDone) {
        haptic('success');
        setFlash(true);
        setTimeout(() => setFlash(false), 700);
        setTimeout(() => {
          if ((window as any).showXPNotification) {
            (window as any).showXPNotification(dhikr.xp, 1.0);
          }
        }, 100);
      }

      return {
        ...prev,
        xp: (prev.xp ?? 0) + (justDone ? dhikr.xp : 0),
        tasbeehRecords: {
          ...(prev.tasbeehRecords ?? {}),
          [day]: {
            counts:       { ...prevRec.counts, [selectedId]: newCount },
            completedIds: justDone ? [...prevRec.completedIds, selectedId] : prevRec.completedIds,
            xpEarned:     prevRec.xpEarned + (justDone ? dhikr.xp : 0),
          },
        },
      };
    });
  }, [isDone, selectedId, dhikr, day, setUserData]);

  const handleReset = useCallback(() => {
    setUserData(prev => {
      const prevRec: TasbeehRecord = (prev.tasbeehRecords as any)?.[day]
        ?? { counts: {}, completedIds: [], xpEarned: 0 };
      const wasCompleted = prevRec.completedIds.includes(selectedId);
      return {
        ...prev,
        xp: Math.max(0, (prev.xp ?? 0) - (wasCompleted ? dhikr.xp : 0)),
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

  return (
    <div style={{ paddingBottom: 112, paddingTop: 4 }}>
      <style>{`
        @keyframes tapScale { 0%{transform:scale(1)} 50%{transform:scale(0.93)} 100%{transform:scale(1)} }
        @keyframes flashGlow { 0%{opacity:1} 40%{opacity:0.25} 100%{opacity:1} }
        @keyframes popIn { 0%{transform:scale(0.7);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
      `}</style>

      {/* Шапка */}
      <div style={{
        background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
        borderRadius: 32, padding: '18px 20px 16px', marginBottom: 20, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:110, height:110, borderRadius:'50%', background:'rgba(16,185,129,0.10)', pointerEvents:'none' }} />
        <p style={{ fontSize:10, fontWeight:900, color:'#475569', textTransform:'uppercase', letterSpacing:'0.12em', margin:'0 0 5px' }}>
          📿 {lang === 'kk' ? 'Тасбих' : 'Тасбих'}
        </p>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <p style={{ fontSize:22, fontWeight:900, color:'#fff', margin:0 }}>
            {lang === 'kk' ? 'Зікір санағышы' : 'Счётчик зикра'}
          </p>
          {xpToday > 0 && (
            <span style={{ background:'rgba(16,185,129,0.18)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:14, padding:'5px 13px', fontSize:13, fontWeight:900, color:'#34d399' }}>
              +{xpToday} XP
            </span>
          )}
        </div>
      </div>

      {/* Выбор зікіра */}
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:6, marginBottom:24,
        WebkitOverflowScrolling:'touch' as any, scrollbarWidth:'none' as any }}>
        {DHIKRS.map(d => {
          const sel  = d.id === selectedId;
          const done = record.completedIds.includes(d.id);
          return (
            <button key={d.id} type="button"
              onClick={() => setSelectedId(d.id)}
              style={{
                flexShrink:0, padding:'10px 16px', borderRadius:20,
                background: sel ? d.color : done ? d.light : '#f8fafc',
                border:`1.5px solid ${sel ? d.color : done ? d.color+'55' : '#f1f5f9'}`,
                cursor:'pointer', touchAction:'manipulation', WebkitTapHighlightColor:'transparent',
                transition:'all .15s',
              }}
            >
              <p style={{ margin:0, fontSize:11, fontWeight:900, color: sel?'#fff': done?d.color:'#64748b', whiteSpace:'nowrap' }}>
                {done && !sel ? '✓ ' : ''}{lang === 'kk' ? d.name_kk : d.name_ru}
              </p>
              <p style={{ margin:'2px 0 0', fontSize:10, color: sel?'rgba(255,255,255,.65)':'#94a3b8', textAlign:'center' }}>
                {record.counts[d.id] ?? 0}/{d.target}
              </p>
            </button>
          );
        })}
      </div>

      {/* Главный счётчик */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:20 }}>

        {/* Arabic + транслит */}
        <p style={{ fontSize:34, fontWeight:700, color:'#0f172a', margin:'0 0 3px', direction:'rtl', fontFamily:'serif', lineHeight:1.4 }}>
          {dhikr.arabic}
        </p>
        <p style={{ fontSize:13, color:'#94a3b8', margin:'0 0 22px', fontWeight:600 }}>
          {dhikr.translit}
        </p>

        {/* Кольцо + кнопка */}
        <div style={{ position:'relative', width:220, height:220 }}>
          <svg width="220" height="220" style={{ position:'absolute', top:0, left:0, pointerEvents:'none' }}>
            <circle cx="110" cy="110" r={R} fill="none" stroke="#f1f5f9" strokeWidth="9" />
            <circle cx="110" cy="110" r={R} fill="none"
              stroke={dhikr.color}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={CIRCUM}
              strokeDashoffset={strokeOffset}
              style={{
                transform:'rotate(-90deg)', transformOrigin:'110px 110px',
                transition:'stroke-dashoffset .3s ease',
                animation: flash ? 'flashGlow .7s ease' : 'none',
              }}
            />
          </svg>

          <button type="button"
            onClick={handleTap}
            style={{
              position:'absolute', top:13, left:13,
              width:194, height:194, borderRadius:'50%',
              background: isDone ? dhikr.light : '#ffffff',
              border:'none', cursor: isDone ? 'default' : 'pointer',
              touchAction:'manipulation', WebkitTapHighlightColor:'transparent',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              boxShadow:`0 6px 28px ${dhikr.color}22`,
              animation: tapping ? 'tapScale .12s ease' : 'none',
              transition:'background .3s',
              userSelect:'none',
            }}
          >
            {isDone ? (
              <div style={{ animation:'popIn .4s ease', display:'flex', flexDirection:'column', alignItems:'center' }}>
                <span style={{ fontSize:46 }}>✅</span>
                <p style={{ fontSize:14, fontWeight:900, color:dhikr.color, margin:'6px 0 0' }}>
                  {lang === 'kk' ? 'Аяқталды!' : 'Готово!'}
                </p>
                <p style={{ fontSize:12, color:'#94a3b8', margin:'2px 0 0', fontWeight:600 }}>
                  +{dhikr.xp} XP
                </p>
              </div>
            ) : (
              <>
                <span style={{ fontSize:58, fontWeight:900, color:'#0f172a', lineHeight:1 }}>
                  {count}
                </span>
                <p style={{ fontSize:13, color:'#94a3b8', margin:'3px 0 0', fontWeight:600 }}>
                  / {dhikr.target}
                </p>
                <p style={{ fontSize:11, color:dhikr.color, margin:'7px 0 0', fontWeight:700 }}>
                  {lang === 'kk' ? 'Басу →' : 'Нажимай →'}
                </p>
              </>
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
              cursor:'pointer', touchAction:'manipulation', WebkitTapHighlightColor:'transparent',
            }}
          >
            {lang === 'kk' ? '↺ Нөлден бастау' : '↺ Сбросить'}
          </button>
        )}
      </div>

      {/* Итоги дня */}
      <div style={{ background:'#f8fafc', border:'1.5px solid #f1f5f9', borderRadius:28, padding:'16px 20px' }}>
        <p style={{ fontSize:10, fontWeight:900, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 14px' }}>
          📊 {lang === 'kk' ? 'Бүгінгі нәтиже' : 'Итог дня'}
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {DHIKRS.map(d => {
            const c    = record.counts[d.id] ?? 0;
            const done = record.completedIds.includes(d.id);
            const pct  = Math.min((c / d.target) * 100, 100);
            return (
              <div key={d.id}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:600, color: done ? d.color : '#64748b' }}>
                    {done ? '✓ ' : ''}{lang === 'kk' ? d.name_kk : d.name_ru}
                  </span>
                  <span style={{ fontSize:12, fontWeight:900, color: done ? d.color : '#94a3b8' }}>
                    {c}/{d.target}{done ? ` · +${d.xp} XP` : ''}
                  </span>
                </div>
                <div style={{ height:4, borderRadius:4, background:'#e2e8f0', overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:4, width:`${pct}%`, background:d.color, transition:'width .4s ease' }} />
                </div>
              </div>
            );
          })}
        </div>

        {xpToday > 0 && (
          <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:11, color:'#94a3b8' }}>
              {lang === 'kk' ? 'Бүгін жиналды' : 'Заработано сегодня'}
            </span>
            <span style={{ fontSize:13, fontWeight:900, color:'#10b981' }}>+{xpToday} XP ✨</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasbeeh;
