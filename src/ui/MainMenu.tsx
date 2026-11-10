import React, { useState } from 'react';
import { Play, Target, Dumbbell, Globe, Volume2, VolumeX, Sparkles, HelpCircle, Smartphone, Lock, Unlock, Crown, Zap, Upload, Box, CheckCircle2 } from 'lucide-react';
import { GameMode, TeamInfo } from '../types/game';
import { TEAMS } from '../game/constants';
import { soundFX } from '../audio/SoundFX';
import { assetManager } from '../game/AssetManager';

interface MainMenuProps {
  onStartMatch: (mode: GameMode, homeTeam: TeamInfo, awayTeam: TeamInfo, duration: number) => void;
  onOpenMultiplayer: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onBackToHub?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartMatch,
  onOpenMultiplayer,
  isMuted,
  onToggleMute,
  onBackToHub
}) => {
  const [selectedHomeIndex, setSelectedHomeIndex] = useState(0); // Enerhen Junction
  const [selectedAwayIndex, setSelectedAwayIndex] = useState(1); // Hausa Quarters
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [customModelLoaded, setCustomModelLoaded] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [bossUnlocked, setBossUnlocked] = useState(true); // Unlocked by default so player can enjoy immediately!

  // Dynamically resolve phone URL based on current machine network IP
  const getPhoneUrls = () => {
    const isBrowser = typeof window !== 'undefined';
    const currentHost = isBrowser ? window.location.hostname : '192.168.1.25';
    const currentPort = isBrowser && window.location.port ? window.location.port : '3000';

    const phoneHost = currentHost === 'localhost' || currentHost === '127.0.0.1'
      ? '192.168.1.25'
      : currentHost;

    return {
      wifiUrl: `http://${phoneHost}:${currentPort}`,
      tunnelUrl: 'https://silver-eggs-camp.loca.lt'
    };
  };

  const { wifiUrl: localIpUrl, tunnelUrl: publicTunnelUrl } = getPhoneUrls();

  const handleCopyLink = (url: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const availableTeams = bossUnlocked ? TEAMS : TEAMS.filter(t => !t.isBoss);
  const homeTeam = availableTeams[selectedHomeIndex % availableTeams.length];
  const awayTeam = availableTeams[selectedAwayIndex % availableTeams.length];

  const handleStartExhibition = () => {
    soundFX.playWhistle(true);
    onStartMatch('exhibition', homeTeam, awayTeam, durationMinutes);
  };

  const handleStartPenalties = () => {
    soundFX.playWhistle(true);
    onStartMatch('penalties', homeTeam, awayTeam, durationMinutes);
  };

  const handleStartTraining = () => {
    soundFX.playWhistle(true);
    onStartMatch('training', homeTeam, awayTeam, durationMinutes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-gradient-to-b from-black/85 via-zinc-950/95 to-black/95 backdrop-blur-md overflow-y-auto">
      {/* Background Decorative Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Responsive Card (Widescreen 2-column layout in horizontal mobile view) */}
      <div className="relative w-full max-w-xl landscape:max-w-4xl bg-zinc-900/95 border border-white/10 rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 shadow-2xl flex flex-col my-auto max-h-[96vh] overflow-y-auto">
        {/* Top Sound, Phone & Help Buttons */}
        <div className="w-full flex justify-between items-center mb-1.5 sm:mb-2.5">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Back to Games Hub */}
            {onBackToHub && (
              <button
                onClick={onBackToHub}
                className="flex items-center space-x-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 text-[9px] sm:text-xs font-black border border-amber-400/40 shadow-sm transition-all active:scale-95"
                title="Return to Naija Street Arcade Games Hub"
              >
                <span>← ALL GAMES</span>
              </button>
            )}

            <button
              onClick={() => setShowHowToPlay(true)}
              className="flex items-center space-x-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[9px] sm:text-xs font-bold border border-white/10 transition-colors"
            >
              <HelpCircle className="w-3 h-3 text-amber-400" />
              <span>WARRI RULES</span>
            </button>

            {/* Play on Phone Button */}
            <button
              onClick={() => setShowPhoneModal(true)}
              className="flex items-center space-x-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[9px] sm:text-xs font-black shadow-md transition-all active:scale-95"
            >
              <Smartphone className="w-3 h-3 text-emerald-400" />
              <span>PLAY ON PHONE</span>
            </button>

            {/* 3D Model (.GLB) Loader Button */}
            <button
              onClick={() => setShowModelModal(true)}
              className={`flex items-center space-x-1 px-2 py-0.5 sm:px-2 sm:py-1 rounded-lg sm:rounded-xl border text-[9px] sm:text-[11px] font-black transition-all active:scale-95 ${customModelLoaded
                ? 'bg-blue-600/30 border-blue-400 text-blue-300'
                : 'bg-zinc-800/90 border-cyan-500/40 text-cyan-300 hover:bg-zinc-700'
                }`}
            >
              <Box className="w-3 h-3 text-cyan-400" />
              <span>{customModelLoaded ? '3D GLB' : '3D ASSETS'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Boss Team Unlock Toggle */}
            <button
              onClick={() => setBossUnlocked(!bossUnlocked)}
              title={bossUnlocked ? "Boss Team Unlocked" : "Unlock Boss Team"}
              className={`flex items-center space-x-1 px-2 py-0.5 sm:px-2 sm:py-1 rounded-lg sm:rounded-xl border text-[9px] sm:text-[11px] font-black transition-all ${bossUnlocked
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-zinc-800 border-zinc-600 text-zinc-400'
                }`}
            >
              <Crown className="w-3 h-3 text-amber-400" />
              <span>{bossUnlocked ? 'BOSS' : 'UNLOCK BOSS'}</span>
            </button>

            <button
              onClick={onToggleMute}
              className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-bold border border-white/10 transition-colors"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Responsive Content Grid: 2 columns in Horizontal Mobile View, 1 column in Portrait */}
        <div className="w-full flex flex-col landscape:grid landscape:grid-cols-2 landscape:gap-3.5 items-stretch">
          {/* LEFT COLUMN: Title, Squad Selection, Match Length */}
          <div className="flex flex-col justify-between">
            {/* Title Header */}
            <div className="flex flex-col items-center landscape:items-start text-center landscape:text-left mb-1.5 sm:mb-2">
              <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-400 text-[8.5px] sm:text-[10px] font-black tracking-wider uppercase mb-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                <span>WARRI NO DEY CARRY LAST • 5-A-SIDE</span>
              </div>

              <h1 className="font-display text-xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-500 drop-shadow-md leading-tight">
                MONKEY POST 3D
              </h1>
              <p className="text-zinc-400 text-[9px] sm:text-xs font-medium mt-0.5 hidden sm:block">
                Warri & Effurun Neighborhood Edition • Tiny Posts • Authentic Slang
              </p>
            </div>

            {/* Team Selection Section (Warri Neighborhoods - Responsive Grid) */}
            <div className="w-full grid grid-cols-2 gap-1.5 sm:gap-2.5 mb-1.5">
              {/* Home Team */}
              <div className="bg-black/50 p-1.5 sm:p-2.5 rounded-xl border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[7.5px] sm:text-[9px] font-black text-emerald-400 uppercase tracking-widest truncate">
                      YOUR SQUAD
                    </span>
                    {homeTeam.isBoss && (
                      <span className="px-1 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[7px] font-black border border-amber-400/40 flex items-center space-x-0.5 shrink-0">
                        <Crown className="w-1.5 h-1.5" />
                        <span>BOSS</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <div
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full ring-2 ring-white/50 shrink-0"
                      style={{ backgroundColor: homeTeam.primaryColor }}
                    />
                    <span className="font-extrabold text-[11px] sm:text-xs text-white truncate">
                      {homeTeam.name}
                    </span>
                  </div>

                  <div className="text-[8px] sm:text-[9px] font-bold text-amber-300/90 mb-0.5 flex items-center space-x-1">
                    <Zap className="w-2 h-2 text-amber-400 shrink-0" />
                    <span className="truncate">{homeTeam.playstyle}</span>
                  </div>
                </div>

                {/* Selector buttons (2 rows of 4 for compact fit) */}
                <div className="grid grid-cols-4 gap-0.5 sm:gap-1 mt-auto pt-1">
                  {availableTeams.map((team, idx) => (
                    <button
                      key={`home_${team.id}`}
                      onClick={() => setSelectedHomeIndex(idx)}
                      className={`py-0.5 px-0.5 rounded text-[7.5px] sm:text-[8.5px] font-black transition-all truncate text-center ${selectedHomeIndex === idx
                        ? 'bg-emerald-500 text-black shadow-md'
                        : team.isBoss
                          ? 'bg-amber-950/70 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                    >
                      {team.shortName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Away Team */}
              <div className="bg-black/50 p-1.5 sm:p-2.5 rounded-xl border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[7.5px] sm:text-[9px] font-black text-rose-400 uppercase tracking-widest truncate">
                      OPPONENT
                    </span>
                    {awayTeam.isBoss && (
                      <span className="px-1 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[7px] font-black border border-amber-400/40 flex items-center space-x-0.5 shrink-0">
                        <Crown className="w-1.5 h-1.5" />
                        <span>BOSS</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <div
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full ring-2 ring-white/50 shrink-0"
                      style={{ backgroundColor: awayTeam.primaryColor }}
                    />
                    <span className="font-extrabold text-[11px] sm:text-xs text-white truncate">
                      {awayTeam.name}
                    </span>
                  </div>

                  <div className="text-[8px] sm:text-[9px] font-bold text-rose-300/90 mb-0.5 flex items-center space-x-1">
                    <Zap className="w-2 h-2 text-rose-400 shrink-0" />
                    <span className="truncate">{awayTeam.playstyle}</span>
                  </div>
                </div>

                {/* Selector buttons (2 rows of 4 for compact fit) */}
                <div className="grid grid-cols-4 gap-0.5 sm:gap-1 mt-auto pt-1">
                  {availableTeams.map((team, idx) => (
                    <button
                      key={`away_${team.id}`}
                      onClick={() => setSelectedAwayIndex(idx)}
                      className={`py-0.5 px-0.5 rounded text-[7.5px] sm:text-[8.5px] font-black transition-all truncate text-center ${selectedAwayIndex === idx
                        ? 'bg-rose-500 text-white shadow-md'
                        : team.isBoss
                          ? 'bg-amber-950/70 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                    >
                      {team.shortName}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Match Duration Selector */}
            <div className="w-full flex items-center justify-between bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 text-[9px] sm:text-[10px]">
              <span className="font-bold text-zinc-300">Match Length:</span>
              <div className="flex space-x-1.5">
                {[3, 5].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setDurationMinutes(mins)}
                    className={`px-2 py-0.5 rounded text-[8.5px] sm:text-[9.5px] font-black transition-all ${durationMinutes === mins
                      ? 'bg-amber-400 text-black shadow-md'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                  >
                    {mins} MINS
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Action Game Mode Buttons (Immediately accessible in horizontal view) */}
          <div className="flex flex-col justify-center space-y-1.5 sm:space-y-2 mt-2 landscape:mt-0">
            {/* 1. Exhibition Match vs CPU */}
            <button
              onClick={handleStartExhibition}
              className="w-full py-2.5 sm:py-3 px-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black text-xs sm:text-sm shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0" />
              <span className="truncate">PLAY WARRI DERBY (5v5)</span>
            </button>

            {/* 2. Penalty Shootout */}
            <button
              onClick={handleStartPenalties}
              className="w-full py-2 sm:py-2.5 px-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-black text-[11px] sm:text-xs shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all"
            >
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">PENALTY SHOOTOUT</span>
            </button>

            {/* 3. Training Free Roam */}
            <button
              onClick={handleStartTraining}
              className="w-full py-1.5 sm:py-2 px-3 rounded-xl sm:rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-extrabold text-[10px] sm:text-[11px] border border-white/10 flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
            >
              <Dumbbell className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">TEKKERS TRAINING GROUND</span>
            </button>

            {/* 4. Online Multiplayer */}
            <button
              onClick={onOpenMultiplayer}
              className="w-full py-1.5 sm:py-2 px-3 rounded-xl sm:rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-extrabold text-[10px] sm:text-[11px] border border-white/10 flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
            >
              <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">ONLINE STREET ROOM</span>
            </button>
          </div>
        </div>
      </div>

      {/* Play on Phone QR Code Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative">
            <button
              onClick={() => setShowPhoneModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 shadow-lg">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="font-display text-xl text-white">PLAY ON YOUR PHONE</h3>
            <p className="text-zinc-400 text-xs mt-1 mb-4">
              Scan with your phone's camera or open in your browser
            </p>

            {/* QR Code */}
            <div className="bg-white p-3 rounded-2xl shadow-xl mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(localIpUrl)}`}
                alt="QR Code to play on phone"
                className="w-44 h-44 rounded-lg block"
              />
            </div>

            {/* URL options */}
            <div className="w-full space-y-2 mb-4 text-left">
              <div className="p-3 bg-black/60 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">
                    Wi-Fi Direct (Fastest, Local Network)
                  </span>
                  <span className="font-mono text-sm font-bold text-white block mt-0.5 select-all">
                    {localIpUrl}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyLink(localIpUrl)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-black"
                >
                  {copiedLink ? 'COPIED!' : 'COPY'}
                </button>
              </div>

              <div className="p-3 bg-black/60 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider block">
                    Mobile Data / Anywhere (Public Tunnel)
                  </span>
                  <span className="font-mono text-xs font-bold text-zinc-300 block mt-0.5 select-all">
                    {publicTunnelUrl}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyLink(publicTunnelUrl)}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-black"
                >
                  COPY
                </button>
              </div>

              {/* Landscape Requirement Notice */}
              <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-center space-x-2 text-amber-300 text-[11px] font-bold">
                <span className="text-base">🔄</span>
                <span>Requires rotating phone to <strong>Landscape mode</strong> to play!</span>
              </div>
            </div>

            <button
              onClick={() => setShowPhoneModal(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* 3D Model (.GLB) Loader Modal */}
      {showModelModal && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl flex flex-col relative text-left">
            <button
              onClick={() => setShowModelModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center space-x-2.5 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg text-white">3D CHARACTER ASSETS (.GLB)</h3>
                <p className="text-zinc-400 text-[10px]">Real 3D Rigged Humanoid Model Pipeline</p>
              </div>
            </div>

            {/* Current Status Pill */}
            <div className={`p-3 rounded-2xl border mb-3 flex items-center justify-between text-xs font-bold ${customModelLoaded
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
              : 'bg-zinc-800/80 border-white/10 text-zinc-300'
              }`}>
              <div className="flex items-center space-x-2">
                {customModelLoaded ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Box className="w-4 h-4 text-cyan-400 shrink-0" />
                )}
                <span>{customModelLoaded ? 'Custom 3D Rigged Model Active' : 'Procedural PBR Athletic Model Active'}</span>
              </div>
              <span className="text-[10px] text-zinc-400">WebGL</span>
            </div>

            {/* Upload Input */}
            <div className="p-4 bg-black/60 rounded-2xl border-2 border-dashed border-cyan-500/40 text-center mb-3 hover:border-cyan-400 transition-colors">
              <Upload className="w-6 h-6 text-cyan-400 mx-auto mb-1.5" />
              <p className="text-xs font-black text-white mb-0.5">Import .GLB / .GLTF 3D Character</p>
              <p className="text-[10px] text-zinc-400 mb-3">Load any rigged 3D human model from Mixamo, Blender, or Sketchfab</p>
              <label className="inline-block px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-black text-xs rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all">
                {isLoadingModel ? 'LOADING MODEL...' : 'BROWSE .GLB FILE'}
                <input
                  type="file"
                  accept=".glb,.gltf"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIsLoadingModel(true);
                      try {
                        const gltf = await assetManager.loadCustomModelFromFile(file);
                        if (gltf) {
                          setCustomModelLoaded(true);
                          soundFX.playGoalCelebration();
                        }
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setIsLoadingModel(false);
                      }
                    }
                  }}
                />
              </label>
            </div>

            {/* Quick Guide */}
            <div className="space-y-2 text-[11px] text-zinc-400 border-t border-white/10 pt-3">
              <p className="text-white font-bold text-xs">How to get 100% photorealistic models:</p>
              <ul className="space-y-1 list-disc list-inside text-zinc-300">
                <li><strong>mixamo.com:</strong> Free Adobe library with 100+ rigged characters & soccer running/kicking animations (export as glTF/FBX).</li>
                <li><strong>sketchfab.com:</strong> Search CC0 "street soccer player" or "african athlete" and download in .GLB format.</li>
                <li><strong>Drop permanently:</strong> Place <code className="text-cyan-300 bg-black/50 px-1 py-0.5 rounded">player.glb</code> inside <code className="text-cyan-300 bg-black/50 px-1 py-0.5 rounded">public/models/</code> to load automatically.</li>
              </ul>
            </div>

            <button
              onClick={() => setShowModelModal(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs border border-white/10"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* How to Play & Warri Slang Guide */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-2xl text-amber-400 mb-3 flex items-center space-x-2">
              <span>🇳🇬 WARRI RULES & SLANG COMMENTARY</span>
            </h2>

            <div className="space-y-3 text-xs sm:text-sm text-zinc-300">
              <div className="p-3 bg-black/50 rounded-xl border border-white/5">
                <strong className="text-amber-400 block mb-1">Warri Monkey Post Playstyles:</strong>
                <ul className="space-y-1 text-xs">
                  <li><strong>Enerhen Junction:</strong> High stamina, aggressive pressing & slide-tackles.</li>
                  <li><strong>Hausa Quarters:</strong> Technical, possession-based play with tight passing.</li>
                  <li><strong>Deco Road:</strong> Balanced all-rounders with disciplined tactical spacing.</li>
                  <li><strong>Jakpa / Airport Road:</strong> Blistering pace on counter-attacks.</li>
                  <li><strong>Pessu / Riverine:</strong> Crafty dribblers and small-sided tricksters.</li>
                  <li><strong>GRA / Shell Compound:</strong> Boss powerhouse with pristine kits & golden cleats!</li>
                </ul>
              </div>

              <div className="p-3 bg-black/50 rounded-xl border border-white/5">
                <strong className="text-emerald-400 block mb-1">Warri Voice Lines & Slangs:</strong>
                <ul className="space-y-1 text-xs">
                  <li>💥 <strong>Tackles:</strong> <em>"No dey fall hand!"</em>, <em>"Clear am!"</em>, <em>"Wetin be dat?!"</em></li>
                  <li>🪄 <strong>Nutmegs:</strong> <em>"See am pass him leg!"</em>, <em>"He don sell am market!"</em></li>
                  <li>🚀 <strong>Miss / Bar:</strong> <em>"Dis one na over bar o!"</em>, <em>"You wan shoot bird?"</em></li>
                  <li>⚽ <strong>Goals:</strong> <em>"Who send you?!"</em>, <em>"Goal dey!"</em>, <em>"Gbege don burst!"</em></li>
                </ul>
              </div>

              <div className="p-3 bg-black/50 rounded-xl border border-white/5">
                <strong className="text-cyan-400 block mb-1">Controls:</strong>
                <ul className="space-y-1 text-xs">
                  <li><strong>Move:</strong> WASD / On-screen Joystick</li>
                  <li><strong>Pass:</strong> Tap = Short ground pass; Hold = Through ball</li>
                  <li><strong>Shoot:</strong> Hold to charge power; Tap without ball = Slide Tackle!</li>
                  <li><strong>Sprint:</strong> Shift / Sprint button (drains stamina)</li>
                  <li><strong>Switch:</strong> E / Q / Switch button</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full mt-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 font-black text-black text-sm"
            >
              WARRI NO DEY CARRY LAST, OYA NA!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
