import React, { useState, useEffect } from 'react';
import { Language } from '../src/types/types';
import { PRAYER_ICONS } from '../constants';

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
  { key: 'fajr',    icon: PRAYER_ICONS.fajr,    kk: 'Таңғы (Фаджр)',   ru: 'Фаджр',   kkShort: 'Таң',       kkCountdown: 'Таң намазына дейін',    ruCountdown: 'До намаза Фаджр'   },
  { key: 'sunrise', icon: PRAYER_ICONS.sunrise,  kk: 'Күн шығу',         ru: 'Восход',  kkShort: 'Күн шығу', kkCountdown: 'Күннің шығуына дейін',  ruCountdown: 'До восхода'        },
  { key: 'dhuhr',   icon: PRAYER_ICONS.dhuhr,    kk: 'Бесін (Зухр)',     ru: 'Зухр',    kkShort: 'Бесін',    kkCountdown: 'Бесін намазына дейін',  ruCountdown: 'До намаза Зухр'    },
  { key: 'asr',     icon: PRAYER_ICONS.asr,      kk: 'Екінті (Аср)',     ru: 'Аср',     kkShort: 'Екінті',   kkCountdown: 'Екінті намазына дейін', ruCountdown: 'До намаза Аср'     },
  { key: 'maghrib', icon: PRAYER_ICONS.maghrib,  kk: 'Ақшам (Мағриб)',   ru: 'Магриб',  kkShort: 'Ақшам',   kkCountdown: 'Ақшам намазына дейін',  ruCountdown: 'До намаза Магриб'  },
  { key: 'isha',    icon: PRAYER_ICONS.isha,      kk: 'Құптан (Иша)',     ru: 'Иша',     kkShort: 'Құптан',  kkCountdown: 'Құптан намазына дейін', ruCountdown: 'До намаза Иша'     },
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

function getCurrentPrayer(prayerTimes: PrayerTimes, nowSec: number): string {
  const prayersOnly = PRAYERS.filter(p => p.key !== 'sunrise');
  let current = 'isha'; // до Фаджра считаем текущим Ишу
  for (const prayer of prayersOnly) {
    const prayerSec = getTimeInSeconds(prayerTimes[prayer.key as keyof PrayerTimes]);
    if (prayerSec <= nowSec) current = prayer.key;
  }
  return current;
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
  const currentPrayerKey = getCurrentPrayer(prayerTimes, nowSec);

  const today = new Date();

  // Григорианская дата
  const monthNamesKk = ['қаңтар','ақпан','наурыз','сәуір','мамыр','маусым','шілде','тамыз','қыркүйек','қазан','қараша','желтоқсан'];
  const monthNamesRu = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const monthNames = language === 'kk' ? monthNamesKk : monthNamesRu;
  const gregorianDate = `${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;

  // Хиджри дата (без суффиксов вроде "ХЖ")
  const hijriParts = new Intl.DateTimeFormat(
    language === 'kk' ? 'kk-KZ-u-ca-islamic' : 'ru-RU-u-ca-islamic',
    { day: 'numeric', month: 'long', year: 'numeric' }
  ).formatToParts(today);
  const hijriDay = hijriParts.find(p => p.type === 'day')?.value ?? '';
  const hijriMonth = hijriParts.find(p => p.type === 'month')?.value ?? '';
  const hijriYear = hijriParts.find(p => p.type === 'year')?.value?.replace(/[^\d]/g, '') ?? '';
  const hijriDate = `${hijriDay} ${hijriMonth} ${hijriYear}`;

  return (
    <div className="bg-header rounded-[2rem] p-4 text-white shadow-xl">

      {/* Шапка: таймер слева, город/дата справа */}
      <div className="flex items-center justify-between mb-3">
        {nextPrayer && nextPrayerInfo && (
          <div className="bg-white/15 rounded-xl px-3 py-1.5 text-center">
            <p className="text-[9px] font-bold leading-none" style={{ color: 'var(--bronze-hover)' }}>
              {language === 'kk' ? nextPrayerInfo.kkCountdown : nextPrayerInfo.ruCountdown}
            </p>
            <p className="text-white font-black text-sm leading-tight mt-0.5">
              {formatCountdown(nextPrayer.secondsLeft)}
            </p>
          </div>
        )}

        <div className="text-right">
          <p className="text-[10px] font-bold leading-none" style={{ color: 'var(--bronze-hover)' }}>📍 {city}</p>
          <p className="text-white font-black text-xs leading-tight mt-0.5">{gregorianDate}</p>
          <p className="text-[9px] mt-0.5 text-white/70 font-medium">{hijriDate}</p>
        </div>
      </div>

      {/* Список намазов — один ряд */}
      <div className="grid grid-cols-6 gap-1.5">
        {PRAYERS.map(prayer => {
          const timeStr = prayerTimes[prayer.key as keyof PrayerTimes];
          const prayerSec = getTimeInSeconds(timeStr);
          const isPast = prayerSec < nowSec;
          const isCurrent = prayer.key === currentPrayerKey;
          const name = language === 'kk' ? prayer.kkShort : prayer.ru;

          return (
            <div
              key={prayer.key}
              className={`rounded-xl p-1.5 text-center transition-all ${
                isCurrent
                  ? 'bg-white shadow-md scale-105'
                  : isPast
                  ? 'bg-white/10 text-white/50'
                  : 'bg-white/15 text-white'
              }`}
              style={isCurrent ? { color: 'var(--bronze-pressed)' } : undefined}
            >
              <p className="text-[8px] font-bold leading-none truncate">{name}</p>
              <p className="text-[9px] font-black mt-0.5 leading-none">
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