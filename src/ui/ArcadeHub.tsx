import React, { useState } from 'react';
import { Play, Sparkles, Plus, Info, Volume2, VolumeX, Users, Trophy, ChevronRight, X, Copy, Check, Gamepad2 } from 'lucide-react';
import { ArcadeGame, GameCategory } from '../types/arcade';
import { ARCADE_GAMES } from '../games/registry';
import { soundFX } from '../audio/SoundFX';

interface ArcadeHubProps {
  onSelectGame: (gameId: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const ArcadeHub: React.FC<ArcadeHubProps> = ({
  onSelectGame,
  isMuted,
  onToggleMute
}) => {
  const [activeCategory, setActiveCategory] = useState<GameCategory>('All');
  const [selectedPreviewGame, setSelectedPreviewGame] = useState<ArcadeGame | null>(null);
  const [showAddGameModal, setShowAddGameModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Filter games based on category tab
  const filteredGames = ARCADE_GAMES.filter(game => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Arcade') return game.category === 'Arcade' || game.category === 'Rhythm';
    return game.category === activeCategory;
  });

  const featuredGame = ARCADE_GAMES.find(g => g.id === 'monkey_post') || ARCADE_GAMES[0];

  const handleLaunchGame = (gameId: string) => {
    soundFX.playWhistle(true);
    soundFX.speakVoiceLine("Welcome to Monkey Post 3D! Street soccer time!");
    onSelectGame(gameId);
  };

  const handleCopyAddGameCode = () => {
    const codeSnippet = `// 1. Add your game to src/games/registry.ts:
{
  id: 'my_new_game',
  title: 'My Street Game',
  tagline: 'Exciting street gameplay',
  category: 'Sports', // 'Sports' | 'Strategy' | 'Rhythm' | 'Arcade'
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
}

// 2. In src/App.tsx, import your game and render when active:
{activeGameId === 'my_new_game' && (
  <MyNewGameComponent onExit={() => setActiveGameId(null)} />
)}`;

    navigator.clipboard.writeText(codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-40 bg-zinc-950 text-white flex flex-col overflow-y-auto overflow-x-hidden select-none">
      {/* Background Street Glow & Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/15 via-zinc-950/90 to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-white/10 bg-black/60 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-lg sm:text-xl shadow-lg shadow-amber-500/20">
            🦁
          </div>
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <h1 className="font-display font-black text-sm sm:text-lg tracking-wider text-white uppercase drop-shadow-md">
                NAIJA STREET ARCADE
              </h1>
              <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-400 text-black uppercase tracking-wider">
                HUB
              </span>
            </div>
            <p className="text-[9.5px] sm:text-xs text-zinc-400 font-sans hidden xs:block">
              African Street Sports & Classic Games Catalog
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Add Your Game Guide Button */}
          <button
            onClick={() => setShowAddGameModal(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 border border-white/10 text-zinc-200 hover:text-white text-[11px] sm:text-xs font-bold flex items-center space-x-1.5 active:scale-95 transition-all shadow-md"
            title="How to add other games to this menu"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Add Game</span>
            <span className="sm:hidden">Add</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleMute}
            className="p-1.5 sm:p-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 border border-white/10 text-white active:scale-95 transition-all shadow-md"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-3 sm:py-5 flex flex-col space-y-4 sm:space-y-6">
        {/* Spotlight Featured Banner: MONKEY POST 3D */}
        <div className="relative rounded-2xl sm:rounded-3xl border border-amber-400/40 bg-gradient-to-r from-amber-500/20 via-emerald-600/20 to-zinc-900/90 p-3 sm:p-6 shadow-2xl overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 sm:w-48 h-32 sm:h-48 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-6">
            <div className="flex-1 space-y-1.5 sm:space-y-2.5">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 flex items-center space-x-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>FEATURED • PLAYABLE NOW</span>
                </span>
                <span className="text-[10px] sm:text-xs text-zinc-400 font-bold">
                  ⚽ 3D African Street Football
                </span>
              </div>

              <h2 className="font-display font-black text-xl sm:text-3xl text-white tracking-wide">
                MONKEY POST 3D
              </h2>

              <p className="text-zinc-300 text-xs sm:text-sm font-sans max-w-2xl leading-relaxed">
                Take the pitch on Lagos asphalt! Battle between Ojuelegba, Mitchells Plain, Enerhen & Hausa Quarters with authentic 3D footballers, painted Africa map center circle, Mama T Provisions storefront, and live Warri commentary.
              </p>

              {/* Quick Feature Badges */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5">
                <span className="text-[9.5px] sm:text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-black/60 border border-white/10 text-zinc-300">
                  👥 1 - 2 Players (Local & Online)
                </span>
                <span className="text-[9.5px] sm:text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-black/60 border border-white/10 text-amber-300">
                  🏆 4 Game Modes
                </span>
                <span className="text-[9.5px] sm:text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-black/60 border border-white/10 text-emerald-300">
                  📱 Mobile Landscape Ready
                </span>
              </div>
            </div>

            {/* Launch Button */}
            <div className="shrink-0 flex sm:flex-col items-center justify-end gap-2">
              <button
                onClick={() => handleLaunchGame(featuredGame.id)}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs sm:text-base tracking-wide flex items-center justify-center space-x-2 shadow-xl shadow-amber-500/25 active:scale-95 transition-all group-hover:shadow-amber-500/40"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span>PLAY MONKEY POST NOW</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
          <div>
            <h3 className="font-display font-black text-sm sm:text-lg text-white tracking-wider uppercase">
              ALL GAMES CATALOG
            </h3>
            <p className="text-[10px] sm:text-xs text-zinc-400">
              Select Monkey Post to start playing or explore upcoming games
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {(['All', 'Sports', 'Strategy', 'Cards', 'Arcade'] as GameCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                {cat === 'All' ? `All Games (${ARCADE_GAMES.length})` : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Game Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pb-8">
          {filteredGames.map(game => {
            const isPlayable = game.status === 'playable';

            return (
              <div
                key={game.id}
                className={`relative rounded-2xl border transition-all flex flex-col justify-between p-3.5 sm:p-4 bg-gradient-to-b ${game.bannerGradient} ${
                  isPlayable
                    ? 'border-amber-400/50 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  {/* Top Card Ribbon */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-xl shadow-inner">
                      {game.iconEmoji}
                    </div>

                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm ${game.badgeColor}`}>
                      {game.badge}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <h4 className="font-display font-black text-base sm:text-lg text-white mb-0.5">
                    {game.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-sans line-clamp-1 mb-2">
                    {game.tagline}
                  </p>

                  {/* Tags */}
                  <div className="flex items-center space-x-2 text-[10px] text-zinc-300 font-semibold mb-3">
                    <span className="px-2 py-0.5 rounded-md bg-black/50 border border-white/5">
                      {game.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/50 border border-white/5">
                      {game.players}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-zinc-300 text-xs font-sans line-clamp-2 leading-relaxed mb-4">
                    {game.description}
                  </p>
                </div>

                {/* Card Action Button */}
                <div>
                  {isPlayable ? (
                    <button
                      onClick={() => handleLaunchGame(game.id)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{game.actionLabel}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedPreviewGame(game)}
                      className="w-full py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/10 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
                    >
                      <Info className="w-3.5 h-3.5 text-amber-400" />
                      <span>{game.actionLabel}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* "+ ADD YOUR GAME" DEVELOPER CARD */}
          <div
            onClick={() => setShowAddGameModal(true)}
            className="rounded-2xl border-2 border-dashed border-amber-400/30 hover:border-amber-400 bg-black/40 hover:bg-amber-500/5 p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all group min-h-[200px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-amber-400/30 group-hover:border-amber-400 group-hover:scale-110 flex items-center justify-center text-amber-400 mb-2.5 shadow-lg transition-all">
              <Plus className="w-6 h-6" />
            </div>

            <h4 className="font-display font-black text-sm text-white group-hover:text-amber-400 uppercase tracking-wider mb-1">
              + ADD YOUR GAME
            </h4>

            <p className="text-[11px] text-zinc-400 max-w-[220px] font-sans leading-relaxed mb-3">
              Easily plug in your custom React, Canvas, or Three.js games into this menu!
            </p>

            <span className="text-[10px] font-bold text-amber-400 group-hover:underline flex items-center space-x-1">
              <span>View Developer Template</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </main>

      {/* --- MODAL 1: GAME PREVIEW & LORE MODAL --- */}
      {selectedPreviewGame && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{selectedPreviewGame.iconEmoji}</span>
                <div>
                  <h3 className="font-display font-black text-base sm:text-lg text-white">
                    {selectedPreviewGame.title}
                  </h3>
                  <span className="text-[10px] text-zinc-400">{selectedPreviewGame.tagline}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPreviewGame(null)}
                className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
              <p>{selectedPreviewGame.description}</p>

              <div>
                <span className="font-bold text-amber-400 block mb-1 uppercase text-xs tracking-wider">
                  Planned Gameplay Features:
                </span>
                <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-300">
                  {selectedPreviewGame.features.map((f, idx) => (
                    <li key={idx}>{f}</li>
                  ))}
                </ul>
              </div>

              <div className="p-2.5 bg-black/50 rounded-xl border border-white/10">
                <span className="font-bold text-zinc-400 block text-[10px] uppercase">Controls Preview</span>
                <span className="text-xs text-white font-mono">{selectedPreviewGame.controlsSummary}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${selectedPreviewGame.badgeColor}`}>
                {selectedPreviewGame.badge}
              </span>
              <button
                onClick={() => setSelectedPreviewGame(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: DEVELOPER GUIDE - HOW TO ADD OTHER GAMES --- */}
      {showAddGameModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-xl bg-zinc-900 border border-amber-400/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-black text-base sm:text-lg text-white">
                    HOW TO ADD YOUR GAMES
                  </h3>
                  <span className="text-[10px] text-zinc-400">
                    Step-by-step developer guide for adding games to this menu
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowAddGameModal(false)}
                className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Steps */}
            <div className="space-y-3 text-xs text-zinc-300 font-sans">
              <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-1">
                <span className="font-bold text-amber-400 block text-xs">
                  Step 1: Register in <code>src/games/registry.ts</code>
                </span>
                <p className="text-[11px] text-zinc-400">
                  Open <code>src/games/registry.ts</code> and add an object with your game's id, title, description, category, and badge.
                </p>
              </div>

              <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-1">
                <span className="font-bold text-emerald-400 block text-xs">
                  Step 2: Create your Game Component
                </span>
                <p className="text-[11px] text-zinc-400">
                  Build your game in a folder (e.g. <code>src/games/my_game/MyGame.tsx</code>). Give it an <code>{'onExit: () => void'}</code> prop to return to this hub menu.
                </p>
              </div>

              <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-1">
                <span className="font-bold text-cyan-400 block text-xs">
                  Step 3: Render in <code>src/App.tsx</code>
                </span>
                <p className="text-[11px] text-zinc-400">
                  In <code>src/App.tsx</code>, render your component when <code>activeGameId === 'your_game_id'</code>.
                </p>
              </div>
            </div>

            {/* Code Snippet Box */}
            <div className="relative rounded-xl bg-black border border-white/10 p-3 text-[10.5px] font-mono text-zinc-300 overflow-x-auto">
              <div className="flex justify-between items-center mb-1 text-[10px] text-zinc-500">
                <span>Code Example Template</span>
                <button
                  onClick={handleCopyAddGameCode}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-400 flex items-center space-x-1"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="text-zinc-300 whitespace-pre">
{`// In src/games/registry.ts:
{
  id: 'my_game',
  title: 'My Custom Game',
  tagline: 'Exciting street gameplay',
  category: 'Sports',
  status: 'playable',
  ...
}`}
              </pre>
            </div>

            {/* Footer */}
            <button
              onClick={() => setShowAddGameModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase"
            >
              GOT IT, THANKS!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
