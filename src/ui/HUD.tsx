import React, { useState } from 'react';
import { Menu, X, Camera, Volume2, VolumeX, Pause, Map, Play } from 'lucide-react';
import { MatchScore, TeamInfo, PlayerState, CameraMode } from '../types/game';
import { Minimap } from './Minimap';

interface HUDProps {
  score: MatchScore;
  timer: number;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  activePlayer: PlayerState | null;
  shootPower: number;
  allPlayers: PlayerState[];
  ball: any;
  cameraMode: CameraMode['id'];
  onCycleCamera: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  mode: string;
  onExitToHub?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  timer,
  homeTeam,
  awayTeam,
  activePlayer,
  shootPower,
  allPlayers,
  ball,
  cameraMode,
  onCycleCamera,
  isMuted,
  onToggleMute,
  onPause,
  mode,
  onExitToHub
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isKickoff = activePlayer?.hasBall && Math.hypot(ball.position.x, ball.position.z) < 1.2;

  // Short 3-letter codes for ultra-compact display (e.g. OJU, MIT, ENH, GRA)
  const homeCode = homeTeam.shortName || homeTeam.name.substring(0, 3).toUpperCase();
  const awayCode = awayTeam.shortName || awayTeam.name.substring(0, 3).toUpperCase();

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-2 sm:p-3 select-none">
      {/* --- Top Row: Broadcast Scoreboard (Exact match to reference screenshot) --- */}
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-3xl flex items-center justify-between">
          {/* Main Top Broadcast Scoreboard Ribbon */}
          <div className="pointer-events-auto flex-1 bg-black/85 backdrop-blur-md px-2.5 sm:px-5 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl border border-white/20 shadow-2xl flex items-center justify-between mx-1">
            {/* Home Crest & Name */}
            <div className="flex items-center space-x-1.5 sm:space-x-3">
              <div
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl border border-white/80 flex items-center justify-center text-xs sm:text-base shadow-md shrink-0"
                style={{ backgroundColor: homeTeam.primaryColor }}
              >
                🦁
              </div>
              <span className="font-display font-black text-white text-[11px] sm:text-sm tracking-wider drop-shadow-sm uppercase">
                {homeTeam.name}
              </span>
            </div>

            {/* Score */}
            <div className="flex items-center space-x-1.5 sm:space-x-3 px-2.5 py-0.5 sm:px-3 sm:py-1 bg-zinc-900/90 rounded-lg sm:rounded-xl border border-white/10 shadow-inner">
              <span className="font-mono font-black text-amber-400 text-xs sm:text-lg tracking-widest">
                {score.home} - {score.away}
              </span>
            </div>

            {/* Away Crest & Name */}
            <div className="flex items-center space-x-1.5 sm:space-x-3">
              <span className="font-display font-black text-white text-[11px] sm:text-sm tracking-wider drop-shadow-sm uppercase">
                {awayTeam.name}
              </span>
              <div
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl border border-white/80 flex items-center justify-center text-xs sm:text-base shadow-md shrink-0"
                style={{ backgroundColor: awayTeam.primaryColor }}
              >
                🏔️
              </div>
            </div>

            {/* Match Clock & Half Indicator */}
            <div className="border-l border-white/20 pl-2.5 sm:pl-4 flex flex-col items-end leading-tight">
              <span className="font-mono font-black text-white text-xs sm:text-base tracking-wider">
                {formatTime(timer)}
              </span>
              <span className="text-[8px] sm:text-[9.5px] text-zinc-300 font-sans font-black uppercase tracking-wider">
                1ST HALF
              </span>
            </div>
          </div>

          {/* Quick Menu Button (☰) in Top-Right */}
          <button
            onClick={() => setShowMenu(true)}
            title="Match Menu"
            className="pointer-events-auto p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-black/85 hover:bg-zinc-800 border border-white/20 text-white shadow-xl active:scale-95 transition-all flex items-center justify-center shrink-0 ml-1"
          >
            <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          </button>
        </div>

        {/* Kickoff Prompt Sub-pill */}
        {isKickoff && (
          <div className="w-full max-w-3xl flex justify-start px-2 mt-1">
            <div className="pointer-events-none bg-black/85 backdrop-blur-md px-3 py-1 rounded-lg sm:rounded-xl border border-emerald-500/50 shadow-lg flex items-center space-x-2 animate-pulse">
              <span className="text-xs">⚽</span>
              <div className="flex flex-col text-left">
                <span className="text-[8.5px] sm:text-[9.5px] font-black text-emerald-400 uppercase tracking-wide leading-none">
                  KICKOFF - {homeTeam.name}
                </span>
                <span className="text-[7.5px] sm:text-[8.5px] font-bold text-zinc-300 leading-tight">
                  Move or pass to take it
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- Middle: Charging Shot Power Meter --- */}
      {shootPower > 0 && (
        <div className="self-center flex flex-col items-center space-y-0.5 my-auto">
          <span className="text-[8.5px] font-black text-rose-400 uppercase tracking-widest drop-shadow-md">
            POWER
          </span>
          <div className="w-32 sm:w-44 h-2 bg-black/80 rounded-full border border-rose-500/80 p-0.5 overflow-hidden shadow-2xl">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-rose-600 transition-all duration-75"
              style={{ width: `${shootPower * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* --- Optional Minimap: Scaled to fit landscape phones cleanly --- */}
      {showMinimap && (
        <div className="self-center pointer-events-auto pb-0.5 transform scale-[0.68] sm:scale-80 md:scale-95 origin-bottom transition-all">
          <Minimap
            players={allPlayers}
            ball={ball}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
        </div>
      )}

      {/* --- Empty space on bottom for Joystick & Action Buttons --- */}
      <div className="h-1" />

      {/* --- THE TINY MENU MODAL (Opens when tapping ☰) --- */}
      {showMenu && (
        <div className="fixed inset-0 z-50 pointer-events-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-white/20 rounded-3xl p-5 shadow-2xl flex flex-col space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-base">⚙️</span>
                <span className="font-display text-base text-white">MATCH CONTROLS</span>
              </div>
              <button
                onClick={() => setShowMenu(false)}
                className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Active Player Card & Stamina */}
            <div className="p-3 bg-black/50 rounded-2xl border border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-black font-mono shadow-md"
                  style={{ backgroundColor: homeTeam.primaryColor }}
                >
                  {activePlayer ? activePlayer.number : '10'}
                </div>
                <div>
                  <span className="text-xs font-black text-white block">
                    {activePlayer ? activePlayer.name : 'OJUELEGBA #10'}
                  </span>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">
                    {activePlayer ? activePlayer.role.replace('_', ' ') : 'STRIKER'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-zinc-400 block">STAMINA</span>
                <span className="text-xs font-black text-emerald-400 font-mono">
                  {Math.round(activePlayer?.stamina || 100)}%
                </span>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {/* Camera Cycle */}
              <button
                onClick={onCycleCamera}
                className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-white/10 text-white flex items-center space-x-2 active:scale-95 transition-all"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                <span>CAM: {cameraMode.toUpperCase()}</span>
              </button>

              {/* Sound Toggle */}
              <button
                onClick={onToggleMute}
                className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-white/10 text-white flex items-center space-x-2 active:scale-95 transition-all"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                <span>{isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}</span>
              </button>

              {/* Radar Toggle */}
              <button
                onClick={() => setShowMinimap(!showMinimap)}
                className={`p-3 rounded-xl border text-white flex items-center space-x-2 active:scale-95 transition-all ${
                  showMinimap ? 'bg-emerald-950 border-emerald-500/50 text-emerald-300' : 'bg-zinc-800 border-white/10'
                }`}
              >
                <Map className="w-4 h-4 text-cyan-400" />
                <span>{showMinimap ? 'HIDE RADAR' : 'SHOW RADAR'}</span>
              </button>

              {/* Pause */}
              <button
                onClick={() => { setShowMenu(false); onPause(); }}
                className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-white/10 text-white flex items-center space-x-2 active:scale-95 transition-all"
              >
                <Pause className="w-4 h-4 text-zinc-300" />
                <span>PAUSE GAME</span>
              </button>

              {/* Exit to Arcade Hub */}
              {onExitToHub && (
                <button
                  onClick={() => { setShowMenu(false); onExitToHub(); }}
                  className="col-span-2 p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/30 text-amber-300 font-bold flex items-center justify-center space-x-2 active:scale-95 transition-all text-xs"
                >
                  <span>← EXIT TO ARCADE HUB</span>
                </button>
              )}
            </div>

            {/* Resume Button */}
            <button
              onClick={() => setShowMenu(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm flex items-center justify-center space-x-2 shadow-xl active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>RESUME MATCH</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
