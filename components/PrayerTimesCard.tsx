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
  xp: number;
  onXpClick?: () => void;
}

const PRAYER_COUNTDOWN_LABELS: Record<string, { kk: string; ru: string }> = {
  fajr:    { kk: 'Таң намазына дейін',    ru: 'До намаза Фаджр'   },
  sunrise: { kk: 'Күннің шығуына дейін',  ru: 'До восхода'        },
  dhuhr:   { kk: 'Бесін намазына дейін',  ru: 'До намаза Зухр'    },
  asr:     { kk: 'Екінті намазына дейін', ru: 'До намаза Аср'     },
  maghrib: { kk: 'Ақшам намазына дейін',  ru: 'До намаза Магриб'  },
  isha:    { kk: 'Құптан намазына дейін', ru: 'До намаза Иша'     },
};

const PRAYER_KEYS_FOR_NEXT = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

function getTimeInSeconds(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 3600 + m * 60;
}

function getNowSeconds(): number {
  const now = new Date();
  return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
}

function getNextPrayer(prayerTimes: PrayerTimes): { key: string; secondsLeft: number } | null {
  const nowSec = getNowSeconds();
  for (const key of PRAYER_KEYS_FOR_NEXT) {
    const prayerSec = getTimeInSeconds(prayerTimes[key as keyof PrayerTimes]);
    if (prayerSec > nowSec) {
      return { key, secondsLeft: prayerSec - nowSec };
    }
  }
  const fajrSec = getTimeInSeconds(prayerTimes.fajr);
  return { key: 'fajr', secondsLeft: (24 * 3600 - nowSec) + fajrSec };
}

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

const PrayerTimesCard: React.FC<Props> = ({ prayerTimes, language, city, xp, onXpClick }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!prayerTimes) return null;

  const nextPrayer = getNextPrayer(prayerTimes);
  const countdownLabel = nextPrayer ? PRAYER_COUNTDOWN_LABELS[nextPrayer.key] : null;

  const today = new Date();

  const monthNamesKk = ['қаңтар','ақпан','наурыз','сәуір','мамыр','маусым','шілде','тамыз','қыркүйек','қазан','қараша','желтоқсан'];
  const monthNamesRu = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const monthNames = language === 'kk' ? monthNamesKk : monthNamesRu;
  const gregorianDate = `${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;

  return (
    <div className="px-4 pb-4 pt-1 text-white">
      <div className="grid grid-cols-3 items-center gap-2">

        {/* Левая колонка — обратный отсчёт */}
        <div className="flex justify-start">
          {nextPrayer && countdownLabel ? (
            <div className="bg-white/15 rounded-xl px-3 py-1.5 text-center">
              <p className="text-[9px] font-bold leading-none" style={{ color: 'var(--bronze-hover)' }}>
                {language === 'kk' ? countdownLabel.kk : countdownLabel.ru}
              </p>
              <p className="text-white font-black text-sm leading-tight mt-0.5">
                {formatCountdown(nextPrayer.secondsLeft)}
              </p>
            </div>
          ) : <div />}
        </div>

        {/* Центральная колонка — XP */}
        <div className="flex justify-center">
          <div
            onClick={onXpClick}
            className="flex flex-col items-center justify-center rounded-2xl px-4 py-2 shadow-lg active:scale-95 transition-transform cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #C8860A, #E8A020)' }}
          >
            <span className="text-lg leading-none">🏆</span>
            <span className="text-white font-black text-base leading-tight tracking-tight">{xp.toLocaleString()}</span>
            <span className="text-white/80 font-black text-[9px] uppercase tracking-widest leading-none">XP</span>
          </div>
        </div>

        {/* Правая колонка — город/дата */}
        <div className="flex justify-end">
          <div className="bg-white/15 rounded-xl px-3 py-1.5 text-center">
            <p className="text-[9px] font-bold leading-none" style={{ color: 'var(--bronze-hover)' }}>📍 {city}</p>
            <p className="text-white font-black text-xs leading-tight mt-0.5">{gregorianDate}</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PrayerTimesCard;
