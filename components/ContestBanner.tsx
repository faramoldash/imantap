import React, { useState, useEffect } from 'react';
import { Language } from '../src/types/types';
import { TRANSLATIONS } from '../constants';

interface ContestData {
  _id: string;
  name: string;
  prize: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'finished';
}

interface ContestParticipant {
  rank: number | null;
  xp: number;
  xpToNext: number | null;
}

interface ContestBannerProps {
  contestData: { contest: ContestData; participant: ContestParticipant } | null;
  isPaid: boolean;
  language: Language;
  onViewLeaderboard: () => void;
  onPaywall: () => void;
}

function formatCountdown(endDateStr: string): string {
  const ms = new Date(endDateStr).getTime() - Date.now();
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (days > 0) return `${days}д ${hours}ч ${mins}м`;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const ContestBanner: React.FC<ContestBannerProps> = ({
  contestData, isPaid, language, onViewLeaderboard, onPaywall,
}) => {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!contestData || contestData.contest.status !== 'active') return;
    setCountdown(formatCountdown(contestData.contest.endDate));
    const interval = setInterval(
      () => setCountdown(formatCountdown(contestData.contest.endDate)),
      1000
    );
    return () => clearInterval(interval);
  }, [contestData]);

  if (!contestData) return null;

  const { contest, participant } = contestData;
  const t = TRANSLATIONS[language];
  const isActive = contest.status === 'active';
  const isFinished = contest.status === 'finished';

  return (
    <div className="mx-4 mb-3 rounded-2xl bg-gradient-to-br from-amber-900/40 to-yellow-900/30 border border-amber-500/30 p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">
            {isFinished ? t.contestFinished.split('·')[0].trim() : t.contestLabel}
          </div>
          <div className="text-white font-black text-sm leading-tight">{contest.name}</div>
          <div className="text-amber-300 text-xs mt-0.5">🎁 {contest.prize}</div>
        </div>
        {isActive && (
          <div className="text-right ml-3 flex-shrink-0">
            <div className="text-[10px] text-white/60 mb-0.5">{t.contestTimeLeft}</div>
            <div className="text-amber-400 font-black text-xs font-mono">{countdown}</div>
          </div>
        )}
      </div>

      {isPaid && participant.rank != null ? (
        <div className="flex items-center justify-between mt-1">
          <div className="text-xs text-white/80">
            📍 {participant.rank} {t.contestMyRank}
            {' · '}
            <span className="text-amber-400 font-bold">{participant.xp.toLocaleString()} XP</span>
          </div>
          {isActive && (
            <button
              onClick={onViewLeaderboard}
              className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/30"
            >
              {t.contestViewLeaderboard}
            </button>
          )}
        </div>
      ) : isPaid && isActive ? (
        <div className="flex items-center justify-between mt-1">
          <div className="text-xs text-white/60">{t.contestEarnXp}</div>
          <button
            onClick={onViewLeaderboard}
            className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/30"
          >
            {t.contestViewLeaderboard}
          </button>
        </div>
      ) : !isPaid && isActive ? (
        <div className="flex items-center justify-between mt-1">
          <div className="text-xs text-white/60">{t.contestSubscribeToJoin}</div>
          <button
            onClick={onPaywall}
            className="text-xs font-bold text-white bg-amber-500 px-3 py-1.5 rounded-xl"
          >
            {t.contestSubscribeBtn}
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default ContestBanner;
