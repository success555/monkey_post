import React from 'react';
import { Trophy, RotateCcw, Home } from 'lucide-react';
import { MatchScore, TeamInfo } from '../types/game';

interface MatchOverProps {
  score: MatchScore;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  winner: string;
  onRematch: () => void;
  onReturnMenu: () => void;
}

export const MatchOverModal: React.FC<MatchOverProps> = ({
  score,
  homeTeam,
  awayTeam,
  winner,
  onRematch,
  onReturnMenu
}) => {
  const isHomeWinner = score.home > score.away;
  const isDraw = score.home === score.away;

  const getWarriBanter = () => {
    if (isDraw) return "Draw match! In Warri street football, nobody dey carry last! Play extra time!";
    if (isHomeWinner) {
      const phrases = [
        "Who send you?! You scatter their monkey post well well!",
        "Warri no dey carry last! From Enerhen to Deco Road, your name dey ring bell!",
        "Gbege don burst! You show dem say you be real Warri street champion!"
      ];
      return phrases[Math.floor(Math.random() * phrases.length)];
    } else {
      const phrases = [
        "Wetin be dat?! Dem score you for your own neighborhood! No dey fall hand!",
        "Chai! Over bar and missed chances don finish you! Go back to training ground!",
        "Dem don sell you market! Next time bring your complete boots come!"
      ];
      return phrases[Math.floor(Math.random() * phrases.length)];
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-sm sm:max-w-md bg-zinc-900 border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl flex flex-col items-center text-center my-auto max-h-[94vh] overflow-y-auto">
        {/* Trophy Icon */}
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black mb-2 sm:mb-4 shadow-xl">
          <Trophy className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>

        <span className="text-[10px] sm:text-xs font-black uppercase text-amber-400 tracking-widest mb-1">
          FULL TIME • WARRI STREET DERBY
        </span>

        {/* Big Score Header */}
        <div className="flex items-center space-x-6 my-1.5 sm:my-2">
          <div className="flex flex-col items-center">
            <span className="text-[10px] sm:text-xs font-bold text-zinc-400">{homeTeam.shortName}</span>
            <span className="font-display text-3xl sm:text-4xl text-white">{score.home}</span>
          </div>
          <span className="font-display text-xl sm:text-2xl text-zinc-600">-</span>
          <div className="flex flex-col items-center">
            <span className="text-[10px] sm:text-xs font-bold text-zinc-400">{awayTeam.shortName}</span>
            <span className="font-display text-3xl sm:text-4xl text-white">{score.away}</span>
          </div>
        </div>

        {/* Winner Tag */}
        <div className="my-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-white/10 text-white font-extrabold text-xs sm:text-sm">
          {isDraw ? 'STREET DRAW' : `🏆 ${winner} VICTORIOUS`}
        </div>

        {/* Warri Banter Box */}
        <div className="w-full my-2.5 sm:my-3.5 p-2.5 sm:p-3 bg-black/50 rounded-xl sm:rounded-2xl border border-amber-400/20 text-amber-300 text-xs sm:text-sm font-semibold italic">
          "{getWarriBanter()}"
        </div>

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-2 gap-2 sm:gap-3 mt-1.5 sm:mt-2">
          <button
            onClick={onRematch}
            className="py-2.5 sm:py-3 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-lg active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>REMATCH</span>
          </button>

          <button
            onClick={onReturnMenu}
            className="py-2.5 sm:py-3 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 border border-white/10 active:scale-95 transition-all"
          >
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
