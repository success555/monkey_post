import React from 'react';
import { TeamInfo, TeamSide } from '../types/game';

interface PenaltyProps {
  round: number;
  currentTurn: TeamSide;
  history: { home: boolean[]; away: boolean[] };
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
}

export const PenaltyShootoutHUD: React.FC<PenaltyProps> = ({
  round,
  currentTurn,
  history,
  homeTeam,
  awayTeam
}) => {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-25 pointer-events-none flex flex-col items-center space-y-2">
      {/* Shootout status board */}
      <div className="bg-black/80 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-amber-400/40 shadow-2xl flex flex-col items-center">
        <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest">
          MONKEY POST PENALTY SHOOTOUT • ROUND {Math.min(5, round)}/5
        </span>

        {/* Turn banner */}
        <div className="text-xs font-bold text-white mt-0.5">
          {currentTurn === 'home' ? (
            <span className="text-emerald-400">⚡ {homeTeam.name}'s turn to strike!</span>
          ) : (
            <span className="text-rose-400">⚡ {awayTeam.name}'s turn to strike!</span>
          )}
        </div>

        {/* Penalty score indicator bubbles */}
        <div className="flex space-x-6 mt-2">
          {/* Home team kicks */}
          <div className="flex space-x-1.5 items-center">
            <span className="text-[10px] font-bold text-zinc-300 mr-1">{homeTeam.shortName}:</span>
            {[0, 1, 2, 3, 4].map(idx => {
              const res = history.home[idx];
              return (
                <div
                  key={`home_${idx}`}
                  className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-black ${
                    res === true
                      ? 'bg-emerald-500 border-emerald-300 text-white'
                      : res === false
                      ? 'bg-rose-600 border-rose-300 text-white'
                      : 'bg-zinc-800 border-zinc-600 text-transparent'
                  }`}
                >
                  {res === true ? '✓' : res === false ? '✕' : ''}
                </div>
              );
            })}
          </div>

          {/* Away team kicks */}
          <div className="flex space-x-1.5 items-center">
            <span className="text-[10px] font-bold text-zinc-300 mr-1">{awayTeam.shortName}:</span>
            {[0, 1, 2, 3, 4].map(idx => {
              const res = history.away[idx];
              return (
                <div
                  key={`away_${idx}`}
                  className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-black ${
                    res === true
                      ? 'bg-emerald-500 border-emerald-300 text-white'
                      : res === false
                      ? 'bg-rose-600 border-rose-300 text-white'
                      : 'bg-zinc-800 border-zinc-600 text-transparent'
                  }`}
                >
                  {res === true ? '✓' : res === false ? '✕' : ''}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

