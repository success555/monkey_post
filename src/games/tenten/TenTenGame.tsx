import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TenTenEngine } from './TenTenEngine';
import { tenTenSound } from './TenTenAudio';
import { FootChoice, AIDifficulty, GameMode, TenTenState } from './types';

interface TenTenGameProps {
  onExit: () => void;
}

const AISHA_QUOTES = {
  idle: [
    "Ten-Ten, make we play, no cheating!",
    "Listen to the clapping beat, match your feet sharp!",
    "Street rhythm queen no dey shake legs!",
    "You fit reach Ten-Ten before me? Try am!"
  ],
  p1Score: [
    "Ehn ehn! Clean legwork! You step am well!",
    "Gbosa! See as you avoid my foot!",
    "Sharp reflex! Quick like harmattan breeze!"
  ],
  aiScore: [
    "Aha! Aisha don score! Call another one!",
    "My feet dey fly! You no fit catch me!",
    "Afrobeat rhythm dey flow for my body!"
  ],
  blocked: [
    "BLOCKED! Our feet clash! Turn don change!",
    "Ha! I read your mind like newspaper!",
    "Leg clash! No point for anybody!"
  ],
  p1Win: [
    "TEN-TEN! KABIEYESI! You be true rhythm champion!",
    "Master legwork! You win this street duel!"
  ],
  aiWin: [
    "TEN-TEN! Aisha carries the crown today! Rematch?",
    "Better go practice your clapping rhythm!"
  ]
};

export const TenTenGame: React.FC<TenTenGameProps> = ({ onExit }) => {
  const engineRef = useRef<TenTenEngine>(new TenTenEngine());
  const [gameState, setGameState] = useState<TenTenState>(engineRef.current.state);
  const [gameMode, setGameMode] = useState<GameMode>('vs_ai');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const [commentary, setCommentary] = useState<string>("Ten-Ten, make we play! Tap Left or Right on the 4th beat.");
  const [lastRoundText, setLastRoundText] = useState<string>('');

  const getRandomQuote = (quotes: string[]) => quotes[Math.floor(Math.random() * quotes.length)];

  // Synchronize state with engine
  const syncState = useCallback((state: TenTenState) => {
    setGameState({ ...state });
  }, []);

  // Initialize engine and event hooks
  useEffect(() => {
    const engine = engineRef.current;
    engine.setMode(gameMode);
    engine.setDifficulty(difficulty);

    engine.onTick = (s) => {
      syncState(s);
    };

    engine.onRoundResolved = (res) => {
      setLastRoundText(res.comboMessage);
      if (res.scored) {
        if (res.scorer === 'p1') {
          setCommentary(getRandomQuote(AISHA_QUOTES.p1Score));
        } else {
          setCommentary(getRandomQuote(AISHA_QUOTES.aiScore));
        }
      } else {
        setCommentary(getRandomQuote(AISHA_QUOTES.blocked));
      }
    };

    engine.onGameOver = (winner) => {
      setShowWinModal(true);
      if (winner === 'p1') {
        setCommentary(getRandomQuote(AISHA_QUOTES.p1Win));
      } else {
        setCommentary(getRandomQuote(AISHA_QUOTES.aiWin));
      }
    };

    // Auto-start rhythm loop
    engine.start();

    return () => {
      engine.stop();
    };
  }, [gameMode, difficulty, syncState]);

  // Keyboard controls listener (A/D for P1, Arrows for P2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const engine = engineRef.current;

      // Player 1: A = Left, D = Right
      if (key === 'a') {
        engine.setPlayerFoot('p1', 'left');
      } else if (key === 'd') {
        engine.setPlayerFoot('p1', 'right');
      }

      // Player 2 (Local 2P): Left Arrow = Left, Right Arrow = Right
      if (gameMode === 'local_2p') {
        if (e.key === 'ArrowLeft') {
          engine.setPlayerFoot('p2', 'left');
        } else if (e.key === 'ArrowRight') {
          engine.setPlayerFoot('p2', 'right');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameMode]);

  // Button clicks for P1
  const handleP1Choice = (foot: 'left' | 'right') => {
    engineRef.current.setPlayerFoot('p1', foot);
  };

  // Button clicks for P2 (2P Mode)
  const handleP2Choice = (foot: 'left' | 'right') => {
    engineRef.current.setPlayerFoot('p2', foot);
  };

  // Restart Match
  const handleRestart = () => {
    engineRef.current.reset();
    engineRef.current.setMode(gameMode);
    engineRef.current.setDifficulty(difficulty);
    setShowWinModal(false);
    setLastRoundText('');
    setCommentary("New match started! Listen to the clapping beat.");
    engineRef.current.start();
  };

  // Switch Mode
  const handleModeChange = (newMode: GameMode) => {
    setGameMode(newMode);
    engineRef.current.setMode(newMode);
    handleRestart();
  };

  // Switch Difficulty
  const handleDifficultyChange = (newDiff: AIDifficulty) => {
    setDifficulty(newDiff);
    engineRef.current.setDifficulty(newDiff);
  };

  const handleToggleMute = () => {
    const muted = tenTenSound.toggleMute();
    setIsMuted(muted);
  };

  const beat = gameState.beat;
  const p1Score = gameState.p1Score;
  const p2Score = gameState.p2Score;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans select-none text-white">
      {/* Dynamic African Playground Courtyard with Warm Chalk Dust */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/40 via-stone-950 to-black" />

      {/* Chalk Circle Ground Marking */}
      <div className="absolute inset-10 sm:inset-16 rounded-full border-2 border-dashed border-cyan-400/20 pointer-events-none flex items-center justify-center">
        <span className="font-display text-7xl sm:text-9xl font-black text-cyan-400/5 select-none tracking-widest">
          10-10
        </span>
      </div>

      {/* HEADER HUD */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-stone-950/90 to-transparent pointer-events-none">
        {/* Back to Hub Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-cyan-500/30 text-cyan-300 font-bold text-xs tracking-wider uppercase transition-all shadow-lg active:scale-95"
          >
            <span>&larr;</span>
            <span className="hidden sm:inline">ARCADE</span>
            <span>HUB</span>
          </button>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
            <span>👏</span>
            <span>TEN-TEN RHYTHM DUEL</span>
          </div>
        </div>

        {/* Center Scoreboard */}
        <div className="pointer-events-auto flex items-center gap-4 bg-stone-900/90 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-cyan-500/30 shadow-xl">
          {/* Player 1 Score */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">
              {gameMode === 'vs_ai' ? 'YOU (P1)' : 'PLAYER 1'}
            </span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl sm:text-2xl font-black text-amber-300">{p1Score}</span>
              <span className="text-[10px] text-stone-500 font-bold">/ 10</span>
            </div>
            {gameState.caller === 'p1' && (
              <span className="text-[8px] font-black uppercase tracking-tight px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-950 shadow">
                CALLER 👑
              </span>
            )}
          </div>

          {/* VS Divider */}
          <div className="text-xs font-black text-stone-500">VS</div>

          {/* Player 2 / AI Score */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black uppercase text-cyan-400 tracking-wider">
              {gameMode === 'vs_ai' ? 'AISHA (AI)' : 'PLAYER 2'}
            </span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl sm:text-2xl font-black text-cyan-300">{p2Score}</span>
              <span className="text-[10px] text-stone-500 font-bold">/ 10</span>
            </div>
            {gameState.caller === 'p2' && (
              <span className="text-[8px] font-black uppercase tracking-tight px-1.5 py-0.2 rounded-full bg-cyan-400 text-stone-950 shadow">
                CALLER 👑
              </span>
            )}
          </div>
        </div>

        {/* Right Action Icons (Mute, Rules, Restart) */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={handleToggleMute}
            aria-label="Toggle Mute"
            className="w-9 h-9 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700/60 flex items-center justify-center text-sm text-stone-300 hover:text-white transition-all active:scale-95 shadow-md"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={() => setShowRules(true)}
            aria-label="Rules Guide"
            className="w-9 h-9 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-cyan-500/40 flex items-center justify-center text-sm font-black text-cyan-400 hover:text-cyan-200 transition-all active:scale-95 shadow-md"
          >
            ?
          </button>
          <button
            onClick={handleRestart}
            aria-label="Restart Match"
            className="w-9 h-9 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700/60 flex items-center justify-center text-sm text-stone-300 hover:text-white transition-all active:scale-95 shadow-md"
          >
            ↺
          </button>
        </div>
      </header>

      {/* TOP RIVAL AREA: AISHA (AI) OR PLAYER 2 */}
      <div className="absolute top-16 sm:top-20 left-0 right-0 z-10 flex flex-col items-center">
        {/* Opponent Visual Character Sneaker Footwear */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-black uppercase tracking-wider text-cyan-300 mb-1">
            {gameMode === 'vs_ai' ? '💃🏾 Aisha — Rhythm Queen' : '👤 Player 2'}
          </span>

          {/* Opponent Feet Display */}
          <div className="flex items-center gap-6 sm:gap-12 py-2">
            {/* Left Foot */}
            <div
              className={`flex flex-col items-center transition-all duration-150 ${
                gameState.p2Foot === 'left'
                  ? 'translate-y-4 scale-110'
                  : 'opacity-70'
              }`}
            >
              <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-2xl bg-gradient-to-b from-cyan-500 to-blue-700 border-2 border-cyan-300 shadow-xl flex items-center justify-center transform -rotate-6">
                <span className="text-2xl sm:text-3xl">👟</span>
              </div>
              <span className="text-[10px] font-bold text-cyan-400/80 mt-1">Left Foot</span>
            </div>

            {/* Right Foot */}
            <div
              className={`flex flex-col items-center transition-all duration-150 ${
                gameState.p2Foot === 'right'
                  ? 'translate-y-4 scale-110'
                  : 'opacity-70'
              }`}
            >
              <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-2xl bg-gradient-to-b from-cyan-500 to-blue-700 border-2 border-cyan-300 shadow-xl flex items-center justify-center transform rotate-6">
                <span className="text-2xl sm:text-3xl">👟</span>
              </div>
              <span className="text-[10px] font-bold text-cyan-400/80 mt-1">Right Foot</span>
            </div>
          </div>
        </div>

        {/* 2P Controls for Player 2 (Only in Local 2P Mode) */}
        {gameMode === 'local_2p' && (
          <div className="flex gap-3 mt-1">
            <button
              onClick={() => handleP2Choice('left')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all ${
                gameState.p2Foot === 'left'
                  ? 'bg-cyan-500 text-stone-950 border-cyan-300 shadow-lg'
                  : 'bg-stone-900 border-cyan-500/40 text-cyan-300 hover:bg-stone-800'
              }`}
            >
              P2 Left [←]
            </button>
            <button
              onClick={() => handleP2Choice('right')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all ${
                gameState.p2Foot === 'right'
                  ? 'bg-cyan-500 text-stone-950 border-cyan-300 shadow-lg'
                  : 'bg-stone-900 border-cyan-500/40 text-cyan-300 hover:bg-stone-800'
              }`}
            >
              P2 Right [→]
            </button>
          </div>
        )}
      </div>

      {/* CENTER ARENA: RHYTHM BEAT DIAL + CHANT BANNER */}
      <main className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
        {/* Commentary Speech Pill */}
        <div className="pointer-events-auto mb-3 max-w-md px-4 py-1.5 rounded-full bg-stone-950/85 backdrop-blur-md border border-cyan-500/30 shadow-lg text-center">
          <p className="text-xs sm:text-sm font-semibold text-cyan-200 italic truncate">
            &ldquo;{commentary}&rdquo;
          </p>
        </div>

        {/* Dynamic Result Popup (e.g. CLEAN SCORE +1 / BLOCKED) */}
        {lastRoundText && (
          <div className="mb-2 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-400 text-stone-950 shadow-xl animate-bounce">
            {lastRoundText}
          </div>
        )}

        {/* CENTRAL BEAT PULSE RING */}
        <div className="relative flex items-center justify-center my-1 sm:my-2">
          {/* Outer Pulsing Aura */}
          <div
            className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 transition-all duration-150 flex items-center justify-center ${
              beat === 4
                ? 'border-emerald-400 bg-emerald-500/20 scale-110 shadow-[0_0_50px_rgba(52,211,153,0.5)]'
                : beat === 3
                ? 'border-amber-400 bg-amber-500/20 scale-105 shadow-[0_0_30px_rgba(251,191,36,0.4)]'
                : 'border-cyan-500/40 bg-stone-900/60 scale-100'
            }`}
          >
            {/* Center Beat Name */}
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-black">
                {beat === 1 ? '👏' : beat === 2 ? '👏' : beat === 3 ? '🤾' : '🦶'}
              </span>
              <span className="font-display font-black text-sm sm:text-lg tracking-wider uppercase mt-1">
                {beat === 1 ? 'CLAP!' : beat === 2 ? 'CLAP!' : beat === 3 ? 'JUMP!' : 'STEP!'}
              </span>
              <span className="text-[9px] font-bold text-stone-400">
                Beat {beat} / 4
              </span>
            </div>
          </div>
        </div>

        {/* 4-Beat Indicator Dots */}
        <div className="flex items-center gap-2 mt-2">
          {[1, 2, 3, 4].map((b) => (
            <div
              key={b}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-100 ${
                beat === b
                  ? 'bg-cyan-400 scale-125 shadow-lg shadow-cyan-400/80'
                  : 'bg-stone-700'
              }`}
            />
          ))}
        </div>
      </main>

      {/* BOTTOM AREA: PLAYER 1 SNEAKERS & CONTROLS */}
      <footer className="absolute bottom-2 sm:bottom-4 left-0 right-0 z-20 flex flex-col items-center">
        {/* Player 1 Visual Sneakers */}
        <div className="flex items-center gap-6 sm:gap-12 py-1 mb-2 pointer-events-none">
          {/* P1 Left Foot */}
          <div
            className={`flex flex-col items-center transition-all duration-150 ${
              gameState.p1Foot === 'left'
                ? '-translate-y-4 scale-110'
                : 'opacity-70'
            }`}
          >
            <span className="text-[10px] font-bold text-amber-400/80 mb-1">Left Foot [A]</span>
            <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-2xl bg-gradient-to-t from-amber-500 to-yellow-400 border-2 border-amber-300 shadow-xl flex items-center justify-center transform -rotate-6">
              <span className="text-2xl sm:text-3xl">👟</span>
            </div>
          </div>

          {/* P1 Right Foot */}
          <div
            className={`flex flex-col items-center transition-all duration-150 ${
              gameState.p1Foot === 'right'
                ? '-translate-y-4 scale-110'
                : 'opacity-70'
            }`}
          >
            <span className="text-[10px] font-bold text-amber-400/80 mb-1">Right Foot [D]</span>
            <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-2xl bg-gradient-to-t from-amber-500 to-yellow-400 border-2 border-amber-300 shadow-xl flex items-center justify-center transform rotate-6">
              <span className="text-2xl sm:text-3xl">👟</span>
            </div>
          </div>
        </div>

        {/* Big Touch Buttons for Player 1 */}
        <div className="flex items-center gap-3 sm:gap-4 mb-2">
          <button
            onClick={() => handleP1Choice('left')}
            className={`px-5 py-3 rounded-2xl border-2 font-black text-sm sm:text-base uppercase tracking-wider transition-all active:scale-95 shadow-xl ${
              gameState.p1Foot === 'left'
                ? 'bg-amber-400 text-stone-950 border-white shadow-amber-500/50 scale-105'
                : 'bg-stone-900/90 border-amber-500/40 text-amber-300 hover:bg-stone-800'
            }`}
          >
            🦶 STEP LEFT (A)
          </button>
          <button
            onClick={() => handleP1Choice('right')}
            className={`px-5 py-3 rounded-2xl border-2 font-black text-sm sm:text-base uppercase tracking-wider transition-all active:scale-95 shadow-xl ${
              gameState.p1Foot === 'right'
                ? 'bg-amber-400 text-stone-950 border-white shadow-amber-500/50 scale-105'
                : 'bg-stone-900/90 border-amber-500/40 text-amber-300 hover:bg-stone-800'
            }`}
          >
            STEP RIGHT (D) 🦶
          </button>
        </div>

        {/* Mode & Difficulty Selector Dock */}
        <div className="flex flex-wrap items-center justify-center gap-2 px-3 py-1.5 rounded-2xl bg-stone-950/80 backdrop-blur border border-stone-800">
          {/* Game Mode (vs AI or 2P) */}
          <div className="flex bg-stone-900 p-0.5 rounded-xl border border-stone-800">
            <button
              onClick={() => handleModeChange('vs_ai')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                gameMode === 'vs_ai'
                  ? 'bg-cyan-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              vs AI
            </button>
            <button
              onClick={() => handleModeChange('local_2p')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                gameMode === 'local_2p'
                  ? 'bg-cyan-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              2P Local Duel
            </button>
          </div>

          {/* Difficulty Tiers (Easy, Medium, Hard) */}
          <div className="flex bg-stone-900 p-0.5 rounded-xl border border-stone-800">
            {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => handleDifficultyChange(lvl)}
                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all ${
                  difficulty === lvl
                    ? 'bg-amber-400 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {lvl === 'easy' ? 'Easy (96 BPM)' : lvl === 'medium' ? 'Medium (120 BPM)' : 'Hard (146 BPM)'}
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* RULES MODAL */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-stone-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl text-stone-200">
            <button
              onClick={() => setShowRules(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold flex items-center justify-center text-sm"
            >
              &times;
            </button>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">👏</span>
              <div>
                <h2 className="text-xl font-black text-cyan-400">TEN-TEN RHYTHM RULES</h2>
                <p className="text-xs text-stone-400">The Iconic African Street Playground Duel</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs leading-relaxed text-stone-300">
              <div className="p-3 bg-stone-950/60 rounded-xl border border-cyan-500/20">
                <span className="font-bold text-cyan-300 block mb-0.5">1. The 4-Beat Afrobeat Rhythm</span>
                The game cycles in 4 beats:
                <ul className="mt-1 list-disc list-inside space-y-0.5">
                  <li><strong>Beat 1</strong>: Handclap 👏</li>
                  <li><strong>Beat 2</strong>: Handclap 👏</li>
                  <li><strong>Beat 3</strong>: Jump / Prep 🤾 (Choose Left or Right foot!)</li>
                  <li><strong>Beat 4</strong>: STEP / REVEAL 🦶 (&quot;TEN-TEN!&quot;)</li>
                </ul>
              </div>

              <div className="p-3 bg-stone-950/60 rounded-xl border border-cyan-500/20">
                <span className="font-bold text-cyan-300 block mb-0.5">2. Scoring & Calling Rule</span>
                One player is the <strong>Caller</strong> (Attacker).
                <ul className="mt-1 list-disc list-inside space-y-0.5">
                  <li>If your foot <strong>differs</strong> from the opponent on Beat 4 (Left vs Right), the Caller <strong>scores +1 point</strong>!</li>
                  <li>If your foot <strong>matches</strong> the opponent (feet clash directly: Left vs Left or Right vs Right), it is <strong>BLOCKED</strong>! The Caller scores 0, and Caller role passes to the other player!</li>
                </ul>
              </div>

              <div className="p-3 bg-stone-950/60 rounded-xl border border-cyan-500/20">
                <span className="font-bold text-cyan-300 block mb-0.5">3. Winning</span>
                First player to reach <strong>10 points</strong> wins the match (&quot;TEN-TEN!&quot;).
              </div>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-stone-950 font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-98 shadow-lg shadow-cyan-400/30"
            >
              I Dey Ready &mdash; Let&apos;s Play!
            </button>
          </div>
        </div>
      )}

      {/* VICTORY / GAME OVER MODAL */}
      {showWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-stone-900 border-2 border-cyan-400 rounded-3xl p-6 text-center shadow-2xl">
            <span className="text-5xl block mb-2">
              {gameState.winner === 'p1' ? '👑' : '💃🏾'}
            </span>
            <h2 className="text-2xl font-black text-cyan-400 mb-1">
              {gameState.winner === 'p1' ? 'TEN-TEN! YOU WIN!' : 'TEN-TEN! AISHA WINS!'}
            </h2>
            <p className="text-xs text-stone-300 mb-6">
              {gameState.winner === 'p1'
                ? "Gbosa! Unrivaled footwork! You conquered the Ten-Ten street duel!"
                : "Aisha holds the street crown! Better practice your clapping tempo!"}
            </p>

            {/* Score Recap */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-stone-950 border border-amber-500/30">
                <span className="text-[10px] uppercase font-bold text-amber-300 block">Player 1</span>
                <span className="text-3xl font-black text-amber-200">{p1Score}</span>
                <span className="text-[10px] text-stone-400 block">points</span>
              </div>
              <div className="p-3 rounded-2xl bg-stone-950 border border-cyan-500/30">
                <span className="text-[10px] uppercase font-bold text-cyan-300 block">
                  {gameMode === 'vs_ai' ? 'Aisha (AI)' : 'Player 2'}
                </span>
                <span className="text-3xl font-black text-cyan-200">{p2Score}</span>
                <span className="text-[10px] text-stone-400 block">points</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-stone-950 font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-98 shadow-lg shadow-cyan-400/30"
              >
                Play Rematch
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs uppercase tracking-wider transition-all border border-stone-700"
              >
                Arcade Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenTenGame;
