import React, { useState, useEffect } from 'react';
import { 
  Play, Sparkles, Plus, Info, Volume2, VolumeX, Users, Trophy, 
  ChevronRight, X, Copy, Check, Gamepad2, Shield, User, Coins, 
  Flame, Zap, ShoppingBag, Target, ArrowRight 
} from 'lucide-react';
import { ArcadeGame, GameCategory } from '../types/arcade';
import { ARCADE_GAMES } from '../games/registry';
import { soundFX } from '../audio/SoundFX';
import { authStore } from '../auth/authStore';
import { UserProfile } from '../auth/types';
import { UserAuthModal } from './UserAuthModal';
import { AdminLoginModal } from './AdminLoginModal';
import { UserProfileModal } from './UserProfileModal';
import { useUser, UserButton } from '@clerk/nextjs';

interface ArcadeHubProps {
  onSelectGame: (gameId: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenAdmin: () => void;
}

export const ArcadeHub: React.FC<ArcadeHubProps> = ({
  onSelectGame,
  isMuted,
  onToggleMute,
  onOpenAdmin
}) => {
  // Navigation & Category states
  const [activeHubTab, setActiveHubTab] = useState<'games' | 'leaderboard' | 'quests' | 'shop'>('games');
  const [activeCategory, setActiveCategory] = useState<GameCategory>('All');
  const [selectedPreviewGame, setSelectedPreviewGame] = useState<ArcadeGame | null>(null);
  const [showAddGameModal, setShowAddGameModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Auth Modals
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(authStore.getCurrentUser());

  // Mobile horizontal (landscape) view detection (< 620px height)
  const [isMobileLandscape, setIsMobileLandscape] = useState<boolean>(false);
  const [showHeroInLandscape, setShowHeroInLandscape] = useState<boolean>(false);

  useEffect(() => {
    const handleCheckLandscape = () => {
      if (typeof window === 'undefined') return;
      const isLandscape = window.innerWidth > window.innerHeight;
      const isShortHeight = window.innerHeight <= 620;
      setIsMobileLandscape(isLandscape && isShortHeight);
    };
    handleCheckLandscape();
    window.addEventListener('resize', handleCheckLandscape);
    window.addEventListener('orientationchange', handleCheckLandscape);
    return () => {
      window.removeEventListener('resize', handleCheckLandscape);
      window.removeEventListener('orientationchange', handleCheckLandscape);
    };
  }, []);

  // Subscribe to auth state updates
  useEffect(() => {
    return authStore.subscribe(() => {
      setCurrentUser(authStore.getCurrentUser());
    });
  }, []);

  // Sync Clerk authenticated user to Arcade profile
  const { isSignedIn: isClerkSignedIn, user: clerkUser } = useUser();

  useEffect(() => {
    if (isClerkSignedIn && clerkUser) {
      const email = clerkUser.primaryEmailAddress?.emailAddress || `${clerkUser.id}@streetarcade.ng`;
      const username = clerkUser.username || clerkUser.firstName || 'StreetPlayer';
      const displayName = clerkUser.fullName || clerkUser.firstName || username;
      const avatar = (clerkUser.publicMetadata?.avatar as string) || '⚽';
      
      const existing = authStore.getCurrentUser();
      if (!existing || existing.id !== clerkUser.id) {
        authStore.register(clerkUser.id, email, displayName, avatar);
      }
    }
  }, [isClerkSignedIn, clerkUser]);

  // Filter games based on category tab
  const filteredGames = ARCADE_GAMES.filter(game => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Arcade') return game.category === 'Arcade' || game.category === 'Rhythm';
    return game.category === activeCategory;
  });

  const featuredGame = ARCADE_GAMES.find(g => g.id === 'monkey_post') || ARCADE_GAMES[0];

  const handleLaunchGame = (gameId: string) => {
    soundFX.playWhistle(true);
    soundFX.speakVoiceLine("Welcome to Naija Street Arcade! Game on!");
    onSelectGame(gameId);
  };

  const handleAdminClick = () => {
    if (currentUser?.role === 'admin') {
      onOpenAdmin();
    } else {
      setShowAdminLoginModal(true);
    }
  };

  const handleCopyAddGameCode = () => {
    const codeSnippet = `// 1. Add your game to src/games/registry.ts:
{
  id: 'my_new_game',
  title: 'My Street Game',
  tagline: 'Exciting street gameplay',
  category: 'Sports',
  status: 'playable',
  players: '1 - 2 Players',
  difficulty: 'Casual',
  badge: 'NEW GAME',
  badgeColor: 'bg-emerald-500 text-black',
  iconEmoji: '🎮',
  bannerGradient: 'from-blue-600/30 to-black',
  accentColor: '#3b82f6',
  description: 'Your game description goes here...',
  features: ['Feature 1', 'Feature 2'],
  controlsSummary: 'Touch / Keyboard controls',
  actionLabel: 'PLAY NOW'
}`;

    navigator.clipboard.writeText(codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div 
      className="relative min-h-screen w-full bg-zinc-950 text-white flex flex-col font-sans select-none overflow-x-hidden"
    >
      {/* Background Street Glow & Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/15 via-zinc-950/90 to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

      {/* TOP DASHBOARD NAVIGATION BAR */}
      <header className="relative z-10 w-full px-3 sm:px-6 py-2 sm:py-3 border-b border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-between shrink-0 mobile-landscape-compact-header">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-lg sm:text-xl shadow-lg shadow-amber-500/20 shrink-0">
            🦁
          </div>
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <h1 className="font-display font-black text-xs sm:text-base md:text-lg tracking-wider text-white uppercase drop-shadow-md whitespace-nowrap">
                NAIJA STREET ARCADE
              </h1>
              <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-400 text-black uppercase tracking-wider">
                HUB
              </span>
            </div>
            <p className="text-[9.5px] sm:text-xs text-zinc-400 font-sans hidden md:block">
              Nigeria's #1 3D Street Sports & Classic Games Arena
            </p>
          </div>
        </div>

        {/* Right: User Profile, Admin Portal, Audio & Add Game */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* USER PROFILE PILL OR LOGIN BUTTON */}
          {currentUser ? (
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center space-x-1 sm:space-x-1.5 p-1 sm:pr-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 transition-all active:scale-95 shadow-md"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs sm:text-sm shrink-0">
                {currentUser.avatar}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-[11px] font-bold text-white leading-tight truncate max-w-[80px]">
                  {currentUser.displayName}
                </div>
                <div className="text-[9px] text-amber-400 font-mono font-bold">
                  🪙 {currentUser.streetCoins.toLocaleString()}
                </div>
              </div>
            </button>
          ) : (
            <div className="flex items-center space-x-1">
              <a
                href="/"
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-zinc-200 text-[11px] font-bold transition-all active:scale-95 flex items-center space-x-1"
              >
                <User className="w-3 h-3 text-amber-400" />
                <span>Sign In / Register</span>
              </a>
            </div>
          )}

          {/* ADMIN PORTAL BUTTON */}
          <button
            onClick={handleAdminClick}
            className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition-all active:scale-95 border shadow-md ${
              currentUser?.role === 'admin'
                ? 'bg-amber-500 text-black border-amber-400 font-black'
                : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-white/10'
            }`}
            title="Arcade Administrator Control Center"
          >
            <Shield className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Admin</span>
          </button>

          {/* Add Game Guide */}
          <button
            onClick={() => setShowAddGameModal(true)}
            className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-zinc-200 text-[11px] font-bold active:scale-95 transition-all shadow-md flex items-center space-x-1"
            title="How to add custom games"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline">+ Add Game</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className="p-1 sm:p-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-white active:scale-95 transition-all shadow-md"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* DASHBOARD NAV TABS */}
      <div className="relative z-10 w-full px-3 sm:px-6 py-1 sm:py-1.5 border-b border-white/5 bg-zinc-950/80 backdrop-blur-sm shrink-0 mobile-landscape-compact-tabs">
        <div className="max-w-6xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-1 sm:space-x-2">
            {[
              { id: 'games', label: 'Arcade Games (6)', icon: Gamepad2 },
              { id: 'leaderboard', label: 'Street Leaderboard', icon: Trophy },
              { id: 'quests', label: 'Daily Quests & Coins', icon: Target },
              { id: 'shop', label: 'Street Vault Shop', icon: ShoppingBag }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeHubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveHubTab(tab.id as any)}
                  className={`flex items-center space-x-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500 text-black font-black shadow-md'
                      : 'text-zinc-400 hover:text-white bg-zinc-900/60'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MAIN DASHBOARD CONTENT AREA */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-2.5 sm:py-5 flex flex-col space-y-3 sm:space-y-5">
        {/* ======================================================== */}
        {/* TAB 1: ALL GAMES CATALOG */}
        {/* ======================================================== */}
        {activeHubTab === 'games' && (
          <>
            {/* GAMER WELCOME HUD STRIP (Hidden on mobile horizontal view to save screen real estate) */}
            {currentUser && (
              <div className="hidden md:flex mobile-landscape-hide p-3 sm:p-4 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-md flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{currentUser.avatar}</div>
                  <div>
                    <div className="text-xs text-zinc-400 font-bold">
                      Welcome back, <span className="text-white font-extrabold">{currentUser.displayName}</span>!
                    </div>
                    <div className="text-[11px] text-amber-400 font-bold flex items-center space-x-2">
                      <span>🏆 {currentUser.rank}</span>
                      <span>•</span>
                      <span>Lvl {currentUser.level}</span>
                      <span>•</span>
                      <span>{currentUser.stats.winRate}% Win Rate</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs font-mono font-bold">
                  <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-white/5 text-amber-300">
                    🪙 {currentUser.streetCoins.toLocaleString()} Coins
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-white/5 text-emerald-400">
                    🔥 5-Day Streak
                  </div>
                </div>
              </div>
            )}

            {/* SPOTLIGHT FEATURED BANNER */}
            {isMobileLandscape && !showHeroInLandscape ? (
              /* COMPACT QUICK-PLAY BAR FOR MOBILE LANDSCAPE (Leaves room for all 6 games on screen!) */
              <div className="rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-500/20 via-zinc-900 to-black p-2 sm:p-2.5 shadow-lg flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center space-x-2 truncate">
                  <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-lg shrink-0">
                    ⚽
                  </div>
                  <div className="truncate">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-display font-black text-xs text-amber-400 truncate">FEATURED: MONKEY POST 3D</span>
                      <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-emerald-500 text-black font-black uppercase">LIVE NOW</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 truncate font-sans">
                      3D African street football on Lagos asphalt • 1-2 Players
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => handleLaunchGame('monkey_post')}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-black font-display font-black text-[11px] uppercase tracking-wider shadow-md active:scale-95 flex items-center space-x-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>PLAY NOW</span>
                  </button>
                  <button
                    onClick={() => setShowHeroInLandscape(true)}
                    className="px-2 py-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white text-[10px] font-bold"
                    title="View Full Game Overview"
                  >
                    Info ▼
                  </button>
                </div>
              </div>
            ) : (
              /* FULL SPOTLIGHT HERO BANNER (Matches Image 1 reference) */
              <div className="relative rounded-2xl sm:rounded-3xl border border-amber-400/40 bg-gradient-to-r from-amber-500/20 via-emerald-600/20 to-zinc-900/90 p-3.5 sm:p-6 shadow-2xl overflow-hidden group">
                {isMobileLandscape && (
                  <button
                    onClick={() => setShowHeroInLandscape(false)}
                    className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-md bg-zinc-800/90 text-zinc-300 text-[10px] font-bold hover:bg-zinc-700"
                  >
                    Collapse ▲
                  </button>
                )}
                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 sm:w-48 h-32 sm:h-48 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-6">
                  <div className="flex-1 space-y-1.5 sm:space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 flex items-center space-x-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>FEATURED • PLAYABLE NOW</span>
                      </span>
                      <span className="text-[10px] sm:text-xs text-zinc-400 font-bold">
                        ⚽ 3D African Street Football
                      </span>
                    </div>

                    <h2 className="font-display font-black text-lg sm:text-2xl md:text-3xl text-white tracking-wide">
                      MONKEY POST 3D
                    </h2>

                    <p className="text-zinc-300 text-xs sm:text-sm font-sans max-w-2xl leading-relaxed">
                      Take the pitch on Lagos asphalt! Battle between Ojuelegba, Mitchells Plain, Enerhen & Hausa Quarters with authentic 3D footballers, painted Africa map center circle, Mama T Provisions storefront, and live Warri commentary.
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5">
                      <span className="text-[9.5px] sm:text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-black/60 border border-white/10 text-zinc-300">
                        👥 1-2 Players (Local & Online)
                      </span>
                      <span className="text-[9.5px] sm:text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-black/60 border border-white/10 text-amber-300">
                        🏆 4 Game Modes
                      </span>
                      <span className="text-[9.5px] sm:text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-black/60 border border-white/10 text-emerald-300">
                        📱 Mobile Landscape Ready
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex sm:flex-col justify-end">
                    <button
                      onClick={() => handleLaunchGame('monkey_post')}
                      className="w-full sm:w-auto px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-black font-display font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 transition-all active:scale-95 group-hover:scale-105"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>PLAY MONKEY POST NOW</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORY FILTER TABS & CATALOG HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2.5 pt-1">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-display font-black text-sm sm:text-lg text-white tracking-wide">
                    ALL GAMES CATALOG
                  </h3>
                  <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    {filteredGames.length} GAMES PLAYABLE
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-zinc-400 font-sans hidden sm:block">
                  Select Monkey Post to start playing or explore upcoming games
                </p>
              </div>

              {/* Category Pills */}
              <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
                {(['All', 'Sports', 'Strategy', 'Cards', 'Arcade'] as GameCategory[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 sm:px-3 py-1 rounded-xl text-[10.5px] sm:text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
                      activeCategory === cat
                        ? 'bg-amber-400 text-black font-black shadow-md shadow-amber-400/20'
                        : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-white/5'
                    }`}
                  >
                    {cat === 'All' ? `All Games (${ARCADE_GAMES.length})` : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* GAMES CARDS GRID (3-column on landscape so ALL 6 games are visible!) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4 pb-12 mobile-landscape-grid">
              {filteredGames.map(game => (
                <div
                  key={game.id}
                  className="group relative rounded-2xl border border-white/10 bg-zinc-900/90 hover:border-amber-400/60 p-2.5 sm:p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 overflow-hidden mobile-landscape-card"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${game.bannerGradient} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none`} />

                  <div className="relative z-10 space-y-1.5 sm:space-y-2">
                    {/* Header: Icon + Badge */}
                    <div className="flex items-start justify-between gap-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-zinc-950/80 border border-white/10 flex items-center justify-center text-lg sm:text-xl shadow-inner shrink-0">
                        {game.iconEmoji}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider bg-emerald-500 text-black shadow-md shrink-0">
                        PLAYABLE NOW
                      </span>
                    </div>

                    {/* Title & Tagline */}
                    <div>
                      <h4 className="font-display font-black text-xs sm:text-base text-white group-hover:text-amber-400 transition-colors truncate">
                        {game.title}
                      </h4>
                      <p className="text-[10px] sm:text-[11px] text-zinc-400 font-sans line-clamp-1">
                        {game.tagline}
                      </p>
                    </div>

                    {/* Category & Player Tags */}
                    <div className="flex items-center space-x-1.5 text-[9.5px] sm:text-[10.5px] text-zinc-400 font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-black/60 border border-white/5">{game.category}</span>
                      <span>•</span>
                      <span className="truncate">{game.players}</span>
                    </div>

                    {/* Description */}
                    <p className="text-zinc-300 text-[10.5px] sm:text-xs font-sans line-clamp-2 leading-relaxed">
                      {game.description}
                    </p>
                  </div>

                  {/* Launch Game Button */}
                  <div className="relative z-10 pt-2 mt-2 border-t border-white/10">
                    <button
                      onClick={() => handleLaunchGame(game.id)}
                      className="w-full py-1.5 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-black font-display font-black text-[11px] sm:text-xs tracking-wider uppercase shadow-lg shadow-amber-400/20 flex items-center justify-center space-x-1.5 transition-all active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{game.actionLabel}</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* ADD YOUR OWN GAME PROMPT CARD */}
              <div
                onClick={() => setShowAddGameModal(true)}
                className="col-span-2 md:col-span-3 rounded-2xl border-2 border-dashed border-white/15 hover:border-amber-400/60 p-3.5 sm:p-5 flex flex-col items-center justify-center text-center space-y-1.5 cursor-pointer bg-zinc-950/40 hover:bg-zinc-900/50 transition-all group"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform shadow-lg">
                  <Plus className="w-5 h-5" />
                </div>
                <h4 className="font-display font-bold text-xs sm:text-sm text-white group-hover:text-amber-400">
                  + ADD YOUR GAME
                </h4>
                <p className="text-[10.5px] sm:text-xs text-zinc-400 max-w-sm">
                  Easily plug in your custom React, Canvas, or Three.js games into this menu!
                </p>
              </div>
            </div>
          </>
        )}

        {/* ======================================================== */}
        {/* TAB 2: STREET LEADERBOARD */}
        {/* ======================================================== */}
        {activeHubTab === 'leaderboard' && (
          <div className="space-y-4 animate-in fade-in pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-display text-base sm:text-lg text-white">Nigeria Street Arcade Rankings</h3>
                <p className="text-xs text-zinc-400">Top ranked players across Lagos, Warri, Abuja & Kano.</p>
              </div>
              <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-300 font-bold">
                LIVE SEASON 1 RANKINGS
              </span>
            </div>

            <div className="space-y-2.5">
              {authStore.getUsers().map((u, idx) => (
                <div
                  key={u.id}
                  className={`p-3 sm:p-4 rounded-2xl border backdrop-blur-md flex items-center justify-between transition-all ${
                    idx === 0 
                      ? 'bg-gradient-to-r from-amber-500/20 via-zinc-900 to-zinc-900 border-amber-500/50 shadow-xl' 
                      : 'bg-zinc-900/90 border-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-display font-black text-sm ${
                      idx === 0 ? 'bg-amber-400 text-black shadow-md' :
                      idx === 1 ? 'bg-zinc-300 text-black' :
                      idx === 2 ? 'bg-amber-700 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      #{idx + 1}
                    </div>

                    <div className="text-2xl">{u.avatar}</div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">{u.displayName}</span>
                        {idx === 0 && <span className="text-xs">👑</span>}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {u.rank} • Lvl {u.level}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs font-mono text-right">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block">Win Rate</span>
                      <span className="font-bold text-emerald-400">{u.stats.winRate}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block">Street Coins</span>
                      <span className="font-bold text-amber-300">🪙 {u.streetCoins.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: DAILY QUESTS & REWARDS */}
        {/* ======================================================== */}
        {activeHubTab === 'quests' && (
          <div className="space-y-4 animate-in fade-in pb-8">
            <div>
              <h3 className="font-display text-base sm:text-lg text-white">Daily Street Quests</h3>
              <p className="text-xs text-zinc-400">Complete challenges to earn Street Coins and rank up.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: 'Score 2 Goals in Monkey Post 3D', reward: '🪙 500 Coins', progress: '1/2', done: false, icon: '⚽' },
                { title: 'Roll a Double in Naija Ludo 3D', reward: '🪙 350 Coins', progress: '1/1', done: true, icon: '🎲' },
                { title: 'Pot 3 Balls in a Row in Snooker', reward: '🪙 400 Coins', progress: '0/3', done: false, icon: '🎱' },
                { title: 'Play Whot 20 Card against Bros Chidi', reward: '🪙 300 Coins', progress: '1/1', done: true, icon: '🃏' },
                { title: 'Capture 4 Seeds in Ayò Olọ́pọ́n', reward: '🪙 450 Coins', progress: '2/4', done: false, icon: '🪵' }
              ].map((q, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-between shadow-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{q.icon}</span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">{q.title}</h4>
                      <span className="text-[11px] font-mono font-bold text-amber-400">{q.reward}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    {q.done ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>CLAIMED</span>
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-zinc-400">{q.progress}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: STREET VAULT SHOP */}
        {/* ======================================================== */}
        {activeHubTab === 'shop' && (
          <div className="space-y-4 animate-in fade-in pb-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display text-base sm:text-lg text-white">Street Vault Equipment</h3>
                <p className="text-xs text-zinc-400">Unlock custom balls, cues, and jersey skins with Street Coins.</p>
              </div>
              <div className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
                Balance: 🪙 {currentUser?.streetCoins.toLocaleString() || '1,500'}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { title: 'Golden Nigeria Retro Football', price: '2,500 Coins', icon: '⚽', desc: 'Vibrant green-white-gold stitched 3D match ball for Monkey Post.' },
                { title: 'Ash & Rosewood Cue Stick', price: '3,200 Coins', icon: '🎱', desc: 'Championship English taper with blue Master chalk tip for Snooker 3D.' },
                { title: 'Carved Iroko Seed Pits', price: '1,800 Coins', icon: '🪵', desc: 'Authentic royal Yoruba patterned seed pits for Ayò Olọ́pọ́n.' },
                { title: 'Lagos Island Acrylic Ludo Pawns', price: '2,000 Coins', icon: '🎲', desc: 'Transparent glowing physical pawns with custom dice.' },
                { title: 'Gold Foil Whot Card Deck', price: '1,500 Coins', icon: '🃏', desc: 'Premium metallic finished cards with special audio FX.' }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-3xl">{item.icon}</span>
                    <h4 className="font-bold text-sm text-white">{item.title}</h4>
                    <p className="text-xs text-zinc-400">{item.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-amber-400">{item.price}</span>
                    <button
                      onClick={() => alert(`Unlocked ${item.title}! Added to your equipment locker.`)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider"
                    >
                      UNLOCK
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}

      {/* USER LOGIN & REGISTER MODAL */}
      <UserAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setCurrentUser(authStore.getCurrentUser())}
      />

      {/* ADMIN LOGIN MODAL */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={() => onOpenAdmin()}
      />

      {/* USER PROFILE MODAL */}
      {currentUser && (
        <UserProfileModal
          user={currentUser}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={() => {
            authStore.logout();
            setCurrentUser(null);
          }}
        />
      )}

      {/* HOW TO ADD A NEW GAME MODAL */}
      {showAddGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl bg-zinc-900 border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl text-left space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-display text-base sm:text-lg text-amber-400 flex items-center space-x-2">
                <span>➕</span>
                <span>HOW TO ADD YOUR GAME TO THE HUB</span>
              </h3>
              <button onClick={() => setShowAddGameModal(false)} className="text-zinc-400 hover:text-white font-bold p-1">✕</button>
            </div>

            <div className="text-xs text-zinc-300 space-y-2 leading-relaxed">
              <p>Adding a new game to the Arcade Dashboard takes only two simple steps:</p>
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 font-mono text-[11px] text-emerald-400">
                1. Add your entry into <strong>src/games/registry.ts</strong><br />
                2. Import your component into <strong>src/App.tsx</strong> and render when active!
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleCopyAddGameCode}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'COPIED SNIPPET!' : 'COPY CODE TEMPLATE'}</span>
              </button>
              <button
                onClick={() => setShowAddGameModal(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 text-white font-bold text-xs uppercase"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
