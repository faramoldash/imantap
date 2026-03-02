import React, { useMemo, useCallback } from 'react';
import { UserData, Language } from '../src/types/types';

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

const Tasbeeh: React.FC<Props> = ({ language: lang, userData, setUserData }) => {
  const day = todayStr();

  const record = useMemo(() => {
    return userData.tasbeehRecords?.[day] ?? { counts: {}, completedIds: [], xpEarned: 0 };
  }, [userData.tasbeehRecords, day]);

  const count = record.counts['subhanallah'] ?? 0;

  const inc = useCallback(() => {
    setUserData(prev => {
      const prevRec = prev.tasbeehRecords?.[day] ?? { counts: {}, completedIds: [], xpEarned: 0 };
      const nextCount = (prevRec.counts['subhanallah'] ?? 0) + 1;
      return {
        ...prev,
        tasbeehRecords: {
          ...(prev.tasbeehRecords ?? {}),
          [day]: {
            ...prevRec,
            counts: { ...prevRec.counts, subhanallah: nextCount },
          },
        },
      };
    });
  }, [day, setUserData]);

  return (
    <div style={{ paddingBottom: 112, paddingTop: 4 }}>
      <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 24, padding: 16 }}>
        <p style={{ margin: 0, fontWeight: 900 }}>
          {lang === 'kk' ? 'Тасбих' : 'Тасбих'}: Subhanallah
        </p>
        <p style={{ margin: '6px 0 12px', color: '#64748b' }}>
          {lang === 'kk' ? 'Санағы' : 'Счёт'}: {count}
        </p>
        <button type="button" onClick={inc} style={{ padding: '10px 14px', borderRadius: 12 }}>
          +1
        </button>
      </div>
    </div>
  );
};

export default Tasbeeh;