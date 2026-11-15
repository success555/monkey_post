import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AyoEngine } from './AyoEngine';
import { AyoScene3D } from './AyoScene3D';
import { ayoSound } from './AyoAudio';
import { AyoGameState, AIDifficulty, GameMode, Player } from './types';

interface AyoGameProps {
  onExit: () => void;
}

const BAALE_QUOTES = {
  idle: [
    "Oju l'ọpọ́n — keep your eyes sharp on the board!",
    "Ayò l'on gba, a kii ba ti eran ja. Think twice before you sow!",
    "Every seed count, my child. Look at your opponent's rear pits.",
    "Street rookie plays with speed; Master plays with patience."
  ],
  playerCapture: [
    "Ehn ehn! Sweet capture! You harvest like harmattan breeze!",
    "Sharp eye! Two and three seeds swept!",
    "Careful now, don't leave your own flanks naked!"
  ],
  aiCapture: [
    "Ha! The elder sees what the child cannot see from the tree top!",
    "Baale don collect your seeds! Better protect your flank!",
    "Experience is not by mouth, na by Ayò seeds!"
  ],
  win: [
    "KABIEYESI! Victory is sweet like fresh palm wine!",
    "You have conquered the Ọpọ́n Ayò! A true grandmaster!"
  ],
  loss: [
    "Elder Baale remains unbeaten in this village. Try again!",
    "Go practice street monkey post, then return for Ayò wisdom!"
  ]
};

export const AyoGame: React.FC<AyoGameProps> = ({ onExit }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<AyoScene3D | null>(null);
  const engineRef = useRef<AyoEngine>(new AyoEngine());

  const [gameState, setGameState] = useState<AyoGameState>(engineRef.current.state);
  const [gameMode, setGameMode] = useState<GameMode>('vs_ai');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [commentary, setCommentary] = useState<string>("Welcome to Ọpọ́n Ayò! Pick any glowing pit on your side to sow.");
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showEndModal, setShowEndModal] = useState<boolean>(false);

  const getRandomQuote = (quotes: string[]) => quotes[Math.floor(Math.random() * quotes.length)];

  // Handle a pit move
  const handlePitClick = useCallback(async (pitIndex: number) => {
    const engine = engineRef.current;
    const scene = sceneRef.current;
    if (!scene || isThinking) return;

    const state = engine.state;
    if (state.isGameOver) return;

    // Check turn ownership
    const player: Player = state.currentTurn;
    if (gameMode === 'vs_ai' && player !== 1) return;

    const legalMoves = engine.getLegalMoves(player, state.board);
    if (!legalMoves.includes(pitIndex)) return;

    setIsThinking(true);
    scene.isInteractive = false;

    // 1. Make move in engine
    const result = engine.makeMove(pitIndex);
    if (!result.valid) {
      scene.isInteractive = true;
      setIsThinking(false);
      return;
    }

    // 2. Animate 3D move
    await scene.animateMoveSequence(pitIndex, result.sowPath, result.capturedPits, player);
    scene.updateBoardState(engine.state);
    setGameState({ ...engine.state });

    // Commentary
    if (result.totalCaptured > 0) {
      setCommentary(getRandomQuote(BAALE_QUOTES.playerCapture));
    } else {
      setCommentary(getRandomQuote(BAALE_QUOTES.idle));
    }

    if (result.isGameOver) {
      scene.isInteractive = true;
      setIsThinking(false);
      setShowEndModal(true);
      ayoSound.playVictory();
      return;
    }

    // If vs AI and now AI's turn
    if (gameMode === 'vs_ai' && engine.state.currentTurn === 2) {
      setCommentary("Elder Baale is contemplating the Ọpọ́n...");
      setTimeout(async () => {
        const aiMove = engine.getBestAIMove(difficulty);
        const aiLegal = engine.getLegalMoves(2, engine.state.board);
        const chosenPit = aiLegal.includes(aiMove) ? aiMove : aiLegal[0];

        if (chosenPit !== undefined) {
          const aiResult = engine.makeMove(chosenPit);
          if (aiResult.valid) {
            await scene.animateMoveSequence(chosenPit, aiResult.sowPath, aiResult.capturedPits, 2);
            scene.updateBoardState(engine.state);
            setGameState({ ...engine.state });

            if (aiResult.totalCaptured > 0) {
              setCommentary(getRandomQuote(BAALE_QUOTES.aiCapture));
            } else {
              setCommentary(getRandomQuote(BAALE_QUOTES.idle));
            }

            if (aiResult.isGameOver) {
              setShowEndModal(true);
              ayoSound.playVictory();
            }
          }
        }
        scene.isInteractive = true;
        setIsThinking(false);
      }, 700);
    } else {
      scene.isInteractive = true;
      setIsThinking(false);
    }
  }, [gameMode, difficulty, isThinking]);

  const handlePitClickRef = useRef(handlePitClick);
  handlePitClickRef.current = handlePitClick;

  // Initialize 3D Scene once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new AyoScene3D(containerRef.current);
    scene.onPitSelect = (pitIndex: number) => {
      handlePitClickRef.current(pitIndex);
    };
    scene.updateBoardState(engineRef.current.state);
    sceneRef.current = scene;
    if (typeof window !== 'undefined') {
      (window as any).__ayoScene = scene;
    }

    // Dispatches immediate & staggered resize passes to ensure canvas renders with correct dimensions
    const doResize = () => {
      scene.resize();
    };
    doResize();
    const raf = requestAnimationFrame(doResize);
    const t1 = setTimeout(doResize, 60);
    const t2 = setTimeout(doResize, 180);
    const t3 = setTimeout(doResize, 400);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Restart match
  const handleRestart = () => {
    engineRef.current.reset();
    const freshState = { ...engineRef.current.state };
    setGameState(freshState);
    setShowEndModal(false);
    setIsThinking(false);
    setCommentary("New match started! May the best elder carry the day.");
    if (sceneRef.current) {
      sceneRef.current.updateBoardState(freshState);
      sceneRef.current.isInteractive = true;
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const muted = ayoSound.toggleMute();
    setIsMuted(muted);
  };

  const p1Score = gameState.captured[1];
  const p2Score = gameState.captured[2];

  return (
    <div className="relative w-full h-full overflow-hidden bg-stone-950 font-sans select-none text-white">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing z-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* TOP HEADER HUD */}
      <header className="absolute top-0 left-0 right-0 z-20 flex flex-col items-center p-1.5 xs:p-2 sm:p-3 bg-gradient-to-b from-stone-950/95 via-stone-950/60 to-transparent pointer-events-none">
        <div className="w-full flex items-center justify-between">
          {/* Back to Hub Button */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onExit}
              className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-amber-600/30 text-amber-300 font-bold text-[10px] sm:text-xs tracking-wider uppercase transition-all shadow-md active:scale-95"
            >
              <span>&larr;</span>
              <span className="hidden xs:inline">ARCADE</span>
              <span>HUB</span>
            </button>
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-600/20 text-amber-400/90 text-xs font-semibold">
              <span>&#9876;</span>
              <span>AY&Ograve; OLỌ́PỌ́N 3D</span>
            </div>
          </div>

          {/* Center Scoreboards & Target (25 to win) */}
          <div className="pointer-events-auto flex items-center gap-1.5 xs:gap-2 sm:gap-3 bg-stone-900/90 backdrop-blur-md px-2 xs:px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl border border-amber-500/30 shadow-xl">
            {/* Player 1 (South) */}
            <div className={`flex flex-col items-center px-1.5 xs:px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl transition-all ${gameState.currentTurn === 1 ? 'bg-amber-500/20 ring-1 ring-amber-400' : 'opacity-70'}`}>
              <span className="text-[8px] xs:text-[9px] sm:text-[10px] tracking-wider uppercase font-extrabold text-amber-300">
                {gameMode === 'vs_ai' ? 'YOU' : 'P1'}<span className="hidden sm:inline"> {gameMode === 'vs_ai' ? '(SOUTH)' : ''}</span>
              </span>
              <div className="flex items-baseline gap-0.5 sm:gap-1">
                <span className="text-base xs:text-lg sm:text-2xl font-black text-amber-200">{p1Score}</span>
                <span className="text-[8px] xs:text-[9px] sm:text-[10px] text-stone-400 font-bold">/ 25</span>
              </div>
              {/* Progress Bar (hidden on ultra-small screens) */}
              <div className="hidden md:block w-12 sm:w-16 h-1 sm:h-1.5 bg-stone-800 rounded-full overflow-hidden mt-0.5 sm:mt-1">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, (p1Score / 25) * 100)}%` }}
                />
              </div>
            </div>

            {/* VS Divider & Current Turn Badge */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-black tracking-widest text-amber-500/60">VS</span>
              <div className={`mt-0.5 px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${
                gameState.currentTurn === 1
                  ? 'bg-amber-500 text-stone-950 animate-pulse'
                  : 'bg-orange-500 text-stone-950 animate-pulse'
              }`}>
                {gameState.currentTurn === 1
                  ? (gameMode === 'vs_ai' ? 'Your Turn' : 'P1 Turn')
                  : (gameMode === 'vs_ai' ? 'Baale...' : 'P2 Turn')}
              </div>
            </div>

            {/* Player 2 / AI (North) */}
            <div className={`flex flex-col items-center px-1.5 xs:px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl transition-all ${gameState.currentTurn === 2 ? 'bg-orange-500/20 ring-1 ring-orange-400' : 'opacity-70'}`}>
              <span className="text-[8px] xs:text-[9px] sm:text-[10px] tracking-wider uppercase font-extrabold text-orange-300">
                {gameMode === 'vs_ai' ? 'BAALE' : 'P2'}<span className="hidden sm:inline"> {gameMode === 'vs_ai' ? '(NORTH)' : ''}</span>
              </span>
              <div className="flex items-baseline gap-0.5 sm:gap-1">
                <span className="text-base xs:text-lg sm:text-2xl font-black text-orange-200">{p2Score}</span>
                <span className="text-[8px] xs:text-[9px] sm:text-[10px] text-stone-400 font-bold">/ 25</span>
              </div>
              {/* Progress Bar (hidden on ultra-small screens) */}
              <div className="hidden md:block w-12 sm:w-16 h-1 sm:h-1.5 bg-stone-800 rounded-full overflow-hidden mt-0.5 sm:mt-1">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, (p2Score / 25) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Action Icons (Mute, Rules, Reset) */}
          <div className="pointer-events-auto flex items-center gap-1 sm:gap-2">
            <button
              onClick={handleToggleMute}
              aria-label="Toggle Mute"
              className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg sm:rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700/60 flex items-center justify-center text-xs sm:text-sm text-stone-300 hover:text-white transition-all active:scale-95 shadow-sm"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            <button
              onClick={() => setShowRules(true)}
              aria-label="Rules Guide"
              className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg sm:rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-amber-600/40 flex items-center justify-center text-xs sm:text-sm font-black text-amber-400 hover:text-amber-200 transition-all active:scale-95 shadow-sm"
            >
              ?
            </button>
            <button
              onClick={handleRestart}
              aria-label="Restart Match"
              className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg sm:rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700/60 flex items-center justify-center text-xs sm:text-sm text-stone-300 hover:text-white transition-all active:scale-95 shadow-sm"
            >
              ↺
            </button>
          </div>
        </div>

        {/* COMMENTARY BANNER */}
        <div className="mt-1 sm:mt-1.5 pointer-events-none w-[94%] max-w-xs xs:max-w-sm sm:max-w-xl">
          <div className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-0.5 sm:py-1 rounded-full bg-stone-950/85 backdrop-blur-md border border-amber-600/30 shadow-lg text-center">
            <span className="text-xs sm:text-base">📿</span>
            <p className="flex-1 text-[10px] sm:text-xs md:text-sm font-semibold text-amber-200 italic truncate">
              &ldquo;{commentary}&rdquo;
            </p>
          </div>
        </div>
      </header>

      {/* BOTTOM CONTROLS DOCK */}
      <footer 
        className="absolute bottom-2 sm:bottom-4 left-0 right-0 z-20 flex flex-row items-center justify-between gap-1.5 sm:gap-2 px-2 sm:px-4 pointer-events-none"
        style={{ bottom: '8px' }}
      >
        {/* Instructions pill */}
        <div className="pointer-events-auto hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-900/90 backdrop-blur border border-amber-500/20 text-[10px] sm:text-[11px] font-medium text-stone-300 shadow-md">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>
            {gameMode === 'vs_ai'
              ? (isThinking ? 'Elder Baale moving...' : 'Click glowing pit (0–5) to sow')
              : `P${gameState.currentTurn}: Click glowing pit`}
          </span>
        </div>

        {/* Mode & Difficulty Selectors */}
        <div className="pointer-events-auto ml-auto flex items-center gap-1 sm:gap-2 bg-stone-950/90 backdrop-blur-md p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-stone-800 shadow-xl">
          {/* Mode Switcher */}
          <div className="flex bg-stone-900 p-0.5 rounded-lg sm:rounded-xl border border-stone-800">
            <button
              onClick={() => { setGameMode('vs_ai'); handleRestart(); }}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                gameMode === 'vs_ai'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              vs AI
            </button>
            <button
              onClick={() => { setGameMode('local_2p'); handleRestart(); }}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                gameMode === 'local_2p'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              2P Local
            </button>
          </div>

          {/* AI Difficulty (only visible when vs AI) */}
          {gameMode === 'vs_ai' && (
            <div className="flex bg-stone-900 p-0.5 rounded-lg sm:rounded-xl border border-stone-800">
              {(['easy', 'medium', 'master'] as AIDifficulty[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setDifficulty(lvl)}
                  className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide transition-all ${
                    difficulty === lvl
                      ? 'bg-orange-500 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {lvl === 'easy' ? 'Rookie' : lvl === 'medium' ? 'Trader' : 'Baale'}
                </button>
              ))}
            </div>
          )}
        </div>
      </footer>

      {/* RULES MODAL */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto bg-stone-900 border border-amber-600/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl text-stone-200">
            <button
              onClick={() => setShowRules(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold flex items-center justify-center text-sm"
            >
              &times;
            </button>
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl">📿</span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-amber-400">AYÒ OLỌ́PỌ́N RULES</h2>
                <p className="text-[10px] sm:text-xs text-stone-400">The Royal Yoruba Mancala Strategy Game</p>
              </div>
            </div>

            <div className="space-y-2.5 sm:space-y-3.5 text-[11px] sm:text-xs leading-relaxed text-stone-300">
              <div className="p-2.5 sm:p-3 bg-stone-950/60 rounded-xl border border-amber-500/20">
                <span className="font-bold text-amber-300 block mb-0.5 sm:mb-1">1. The Board & Seeds (Ọmọ Ayò)</span>
                There are 12 pits (6 South for Player 1, 6 North for Player 2/Baale) holding 48 total seeds (4 per pit).
              </div>

              <div className="p-2.5 sm:p-3 bg-stone-950/60 rounded-xl border border-amber-500/20">
                <span className="font-bold text-amber-300 block mb-0.5 sm:mb-1">2. Sowing Seeds</span>
                Pick all seeds from one of your pits and drop them one-by-one counter-clockwise. If a pit holds 12+ seeds, skip the origin pit during the lap!
              </div>

              <div className="p-2.5 sm:p-3 bg-stone-950/60 rounded-xl border border-amber-500/20">
                <span className="font-bold text-amber-300 block mb-0.5 sm:mb-1">3. Harvesting / Capturing</span>
                If your final seed drops on the opponent&apos;s side and brings that pit&apos;s count to exactly <strong>2</strong> or <strong>3</strong> seeds, you capture them! Continuous backward pits with 2 or 3 seeds are also captured in a chain reaction!
              </div>

              <div className="p-2.5 sm:p-3 bg-stone-950/60 rounded-xl border border-amber-500/20">
                <span className="font-bold text-amber-300 block mb-0.5 sm:mb-1">4. The Odu Rule (Anti-Starvation)</span>
                You cannot capture all seeds on the opponent&apos;s side if doing so leaves them with zero seeds to move on their next turn. Traditional chivalry requires leaving them a move!
              </div>

              <div className="p-2.5 sm:p-3 bg-stone-950/60 rounded-xl border border-amber-500/20">
                <span className="font-bold text-amber-300 block mb-0.5 sm:mb-1">5. Winning</span>
                The first player to capture <strong>25 or more seeds</strong> out of 48 instantly wins the match!
              </div>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="mt-4 sm:mt-6 w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider hover:brightness-110 active:scale-98 shadow-lg shadow-amber-500/30"
            >
              I Understand — Let&apos;s Play!
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xs sm:max-w-md max-h-[92vh] overflow-y-auto bg-stone-900 border-2 border-amber-500/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center shadow-2xl">
            <span className="text-4xl sm:text-5xl block mb-1 sm:mb-2">
              {gameState.winner === 1 ? '👑' : gameState.winner === 2 ? '📿' : '🤝'}
            </span>
            <h2 className="text-lg sm:text-2xl font-black text-amber-400 mb-0.5 sm:mb-1">
              {gameState.winner === 1
                ? (gameMode === 'vs_ai' ? 'YOU DEFEATED THE BAALE!' : 'PLAYER 1 WINS!')
                : gameState.winner === 2
                ? (gameMode === 'vs_ai' ? 'ELDER BAALE PREVAILS!' : 'PLAYER 2 WINS!')
                : 'STALEMATE / DRAW!'}
            </h2>
            <p className="text-[11px] sm:text-xs text-stone-400 mb-4 sm:mb-5">
              {gameState.winner === 1
                ? getRandomQuote(BAALE_QUOTES.win)
                : getRandomQuote(BAALE_QUOTES.loss)}
            </p>

            {/* Final Scores */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-stone-950 border border-amber-500/30">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-amber-300 block">
                  {gameMode === 'vs_ai' ? 'Your Harvest' : 'Player 1'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-amber-200">{p1Score}</span>
                <span className="text-[9px] sm:text-[10px] text-stone-400 block">seeds captured</span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-stone-950 border border-orange-500/30">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-orange-300 block">
                  {gameMode === 'vs_ai' ? 'Elder Baale' : 'Player 2'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-orange-200">{p2Score}</span>
                <span className="text-[9px] sm:text-[10px] text-stone-400 block">seeds captured</span>
              </div>
            </div>

            <div className="flex gap-2.5 sm:gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black text-[11px] sm:text-xs uppercase tracking-wider hover:brightness-110 active:scale-98 shadow-lg shadow-amber-500/30"
              >
                Play Rematch
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all border border-stone-700"
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

export default AyoGame;
