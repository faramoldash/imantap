import React, { useState, useEffect } from 'react';
import { Language } from '../src/types/types';

interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

interface Props {
  prayerTimes: PrayerTimes | null;
  language: Language;
  city: string;
}

const PRAYERS = [
  { key: 'fajr',    icon: '🌙', kk: 'Таңғы (Фаджр)',   ru: 'Фаджр'   },
  { key: 'sunrise', icon: '🌅', kk: 'Күн шығу',         ru: 'Восход'  },
  { key: 'dhuhr',   icon: '☀️', kk: 'Бесін (Зухр)',     ru: 'Зухр'    },
  { key: 'asr',     icon: '🌤', kk: 'Екінті (Аср)',     ru: 'Аср'     },
  { key: 'maghrib', icon: '🌇', kk: 'Ақшам (Мағриб)',   ru: 'Магриб'  },
  { key: 'isha',    icon: '🌃', kk: 'Құптан (Иша)',     ru: 'Иша'     },
];

function getTimeInSeconds(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 3600 + m * 60;
}

function getNowSeconds(): number {
  const now = new Date();
  return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
}

function getNextPrayer(prayerTimes: PrayerTimes): { key: string; timeStr: string; secondsLeft: number } | null {
  const nowSec = getNowSeconds();
  const prayersOnly = PRAYERS.filter(p => p.key !== 'sunrise');

  for (const prayer of prayersOnly) {
    const prayerSec = getTimeInSeconds(prayerTimes[prayer.key as keyof PrayerTimes]);
    if (prayerSec > nowSec) {
      return { key: prayer.key, timeStr: prayerTimes[prayer.key as keyof PrayerTimes], secondsLeft: prayerSec - nowSec };
    }
  }
  // После Иша — следующий Фаджр
  const fajrSec = getTimeInSeconds(prayerTimes.fajr);
  const diff = (24 * 3600 - nowSec) + fajrSec;
  return { key: 'fajr', timeStr: prayerTimes.fajr, secondsLeft: diff };
}

function formatCountdown(seconds: number, language: string): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const hSuffix = language === 'kk' ? 'сағ' : 'ч';
  const mSuffix = language === 'kk' ? 'мин' : 'м';
  const sSuffix = language === 'kk' ? 'сек' : 'с';
  const ss = String(s).padStart(2, '0');
  if (h > 0) return `${h}${hSuffix} ${m}${mSuffix} ${ss}${sSuffix}`;
  if (m > 0) return `${m}${mSuffix} ${ss}${sSuffix}`;
  return `${ss}${sSuffix}`;
}

const PrayerTimesCard: React.FC<Props> = ({ prayerTimes, language, city }) => {
  const [nowSec, setNowSec] = useState(getNowSeconds());

  useEffect(() => {
    const interval = setInterval(() => {
      setNowSec(getNowSeconds());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!prayerTimes) return null;

  const nextPrayer = getNextPrayer(prayerTimes);
  const nextPrayerInfo = PRAYERS.find(p => p.key === nextPrayer?.key);

  // Хиджри дата
  const today = new Date();
  const hijriDate = new Intl.DateTimeFormat(
    language === 'kk' ? 'kk-KZ-u-ca-islamic' : 'ru-RU-u-ca-islamic',
    { day: 'numeric', month: 'long', year: 'numeric' }
  ).format(today);

  const locale = language === 'kk' ? 'kk-KZ' : 'ru-RU';
  const day = today.toLocaleDateString(locale, { day: 'numeric' });
  const month = today.toLocaleDateString(locale, { month: 'long' });
  const year = today.getFullYear();
  const yearSuffix = language === 'kk' ? ' ж.' : ' г.';
  const gregorianDate = `${day} ${month} ${year}${yearSuffix}`;

  return (
    <div className="bg-gradient-to-br from-emerald-900 to-teal-700 rounded-[2rem] p-6 text-white shadow-xl">
      
      {/* Шапка: город и дата */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-emerald-300 text-xs font-bold">📍 {city}</p>
          <p className="text-white font-black text-sm">{gregorianDate}</p>
          <p className="text-emerald-200 text-xs mt-0.5">{hijriDate}</p>
        </div>

        {/* Таймер до следующего намаза */}
        {nextPrayer && nextPrayerInfo && (
          <div className="bg-white/15 rounded-2xl px-4 py-2 text-center">
            <p className="text-emerald-200 text-[10px] font-bold">
              {language === 'kk' ? 'Келесі намаз' : 'Следующий намаз'}
            </p>
            <p className="text-white font-black text-lg leading-tight">
              {formatCountdown(nextPrayer.secondsLeft, language)}
            </p>
            <p className="text-emerald-200 text-[10px]">
              {nextPrayerInfo.icon} {language === 'kk' ? nextPrayerInfo.kk : nextPrayerInfo.ru}
            </p>
          </div>
        )}
      </div>

      {/* Список намазов */}
      <div className="grid grid-cols-3 gap-2">
        {PRAYERS.map(prayer => {
          const timeStr = prayerTimes[prayer.key as keyof PrayerTimes];
          const prayerSec = getTimeInSeconds(timeStr);
          const isPast = prayer.key !== 'sunrise' && prayerSec < nowSec;
          const isNext = prayer.key === nextPrayer?.key;

          return (
            <div
              key={prayer.key}
              className={`rounded-2xl p-2 text-center transition-all ${
                isNext
                  ? 'bg-white text-emerald-800 shadow-lg scale-105'
                  : isPast
                  ? 'bg-white/10 text-white/50'
                  : 'bg-white/15 text-white'
              }`}
            >
              <p className="text-base">{prayer.icon}</p>
              <p className={`text-[10px] font-bold leading-tight ${isNext ? 'text-emerald-700' : ''}`}>
                {language === 'kk' ? prayer.kk.split(' ')[0] : prayer.ru}
              </p>
              <p className={`text-xs font-black ${isNext ? 'text-emerald-900' : ''}`}>
                {timeStr}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PrayerTimesCard;