import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  ArrowLeft, Volume2, VolumeX, Eye, HelpCircle, 
  RotateCcw, Sparkles, Trophy, Zap, Smartphone, RotateCw 
} from 'lucide-react';
import { LudoEngine } from './LudoEngine';
import { LudoScene3D } from './LudoScene3D';
import { ludoSound } from './LudoAudio';
import { LudoGameState, GameMode, LudoColor } from './types';

interface LudoGameProps {
  onExit: () => void;
}

const EMEKA_QUOTES = {
  idle: [
    "Shake the cup well! Throw six sharp sharp!",
    "No shaking, Ludo is a game of patience and calculation!",
    "Make you watch your back, harmattan dey blow for track!",
    "Bros Emeka don play Ludo before they pave this street!"
  ],
  rollSix: [
    "SIX! Bring your seed out immediately!",
    "Double six! God dey create miracle on this board!",
    "Two dice in hand! Bonus roll! Keep the fire burning!"
  ],
  chop: [
    "KPAFUKA! Your token don fly back to yard!",
    "Chop chop! See as you leave your back open!",
    "Back to square one! Go learn how to run!"
  ],
  house: [
    "HOUSE! One token don safely enter!",
    "Praise master! One step closer to crown!"
  ],
  win: [
    "KABIEYESI! LUDO KING OF NIGERIA CONFIRMED! 👑",
    "Sweet victory! Street champion forever!"
  ],
  loss: [
    "Bros Emeka carries the day! Go practice more!",
    "Next time, protect your seeds on the safe stars!"
  ]
};

export const LudoGame: React.FC<LudoGameProps> = ({ onExit }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<LudoScene3D | null>(null);
  const engineRef = useRef<LudoEngine>(new LudoEngine());

  const [gameState, setGameState] = useState<LudoGameState>(engineRef.current.state);
  const [gameMode, setGameMode] = useState<GameMode>('vs_ai');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'iso' | 'top'>('iso');
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const [commentary, setCommentary] = useState<string>("Welcome to Naija Ludo 3D! Shake the two dice and roll six.");

  // Orientation State: Works ONLY on horizontal (landscape) view!
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });

  // Track screen orientation changes
  useEffect(() => {
    const handleOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
    };

    handleOrientation();
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);

    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  const getRandomQuote = (quotes: string[]) => quotes[Math.floor(Math.random() * quotes.length)];

  // Helper to sync state and visual tokens
  const syncBoardState = useCallback(() => {
    const engine = engineRef.current;
    const scene = sceneRef.current;
    const state = { ...engine.state };
    setGameState(state);

    if (scene) {
      const dice = state.diceValues;
      const movableTokens = dice ? engine.getMovableTokens(state.currentTurn, dice).map((t) => t.id) : [];
      scene.syncTokens(state.tokens, movableTokens);
    }
  }, []);

  // Handle Token Move Execution
  const handleExecuteMove = useCallback((tokenId: string) => {
    const engine = engineRef.current;
    const scene = sceneRef.current;
    if (!scene || engine.state.phase !== 'select_token') return;

    const color = engine.state.currentTurn;
    const token = engine.state.tokens[color].find((t) => t.id === tokenId);
    if (!token) return;

    const fromStep = token.step;

    // Execute logic in engine
    const result = engine.moveToken(tokenId);
    if (!result.success) return;

    scene.isInteractive = false;
    const toStep = token.step;

    // Animate token hop along track
    scene.animatePawnMove(tokenId, fromStep, toStep, color, token.index, () => {
      if (result.capturedToken) {
        ludoSound.playKpafuka();
        setCommentary(getRandomQuote(EMEKA_QUOTES.chop));
      } else if (result.isHome) {
        ludoSound.playEnterHome();
        setCommentary(getRandomQuote(EMEKA_QUOTES.house));
      }

      syncBoardState();

      if (engine.state.winner) {
        ludoSound.playVictory();
        setShowWinModal(true);
        setCommentary(getRandomQuote(EMEKA_QUOTES.win));
        scene.isInteractive = true;
        return;
      }

      scene.isInteractive = true;

      // Check if AI turn next
      if (gameMode === 'vs_ai' && engine.state.currentTurn === 'yellow') {
        triggerAiTurn();
      }
    });
  }, [gameMode, syncBoardState]);

  // AI Turn Logic (Bros Emeka)
  const triggerAiTurn = useCallback(() => {
    const engine = engineRef.current;
    const scene = sceneRef.current;
    if (engine.state.winner !== null || !scene) return;

    setIsAiThinking(true);
    scene.isInteractive = false;
    setCommentary("Bros Emeka is shaking the two dice...");

    setTimeout(() => {
      // 1. Roll Two Dice for AI
      const rollRes = engine.rollTwoDice();

      scene.rollTwoDice3D(rollRes.dice[0], rollRes.dice[1], () => {
        if (rollRes.hasSix) {
          setCommentary(getRandomQuote(EMEKA_QUOTES.rollSix));
        }

        syncBoardState();

        if (!rollRes.canAnyTokenMove) {
          // No moves possible
          scene.isInteractive = true;
          setIsAiThinking(false);
          // If doubles/bonus roll, roll again!
          if (rollRes.extraTurn && engine.state.currentTurn === 'yellow') {
            triggerAiTurn();
          }
          return;
        }

        // 2. AI chooses best token after brief calculation
        setTimeout(() => {
          const bestTokenId = engine.getBestAIMove('yellow');
          if (bestTokenId) {
            handleExecuteMove(bestTokenId);
          }
          scene.isInteractive = true;
          setIsAiThinking(false);

          // If AI earned bonus roll (rolled double or chopped), trigger AI turn again!
          if (engine.state.bonusRoll && engine.state.currentTurn === 'yellow' && !engine.state.winner) {
            triggerAiTurn();
          }
        }, 650);
      });
    }, 550);
  }, [handleExecuteMove, syncBoardState]);

  // Handle Player Clicking "ROLL 2 DICE"
  const handleRollDice = () => {
    const engine = engineRef.current;
    const scene = sceneRef.current;
    if (gameState.phase !== 'roll_dice' || isAiThinking || gameState.winner || !scene) return;

    scene.isInteractive = false;
    const rollRes = engine.rollTwoDice();

    scene.rollTwoDice3D(rollRes.dice[0], rollRes.dice[1], () => {
      if (rollRes.hasSix) {
        setCommentary(getRandomQuote(EMEKA_QUOTES.rollSix));
      }

      syncBoardState();
      scene.isInteractive = true;

      // If no moves possible and turn passed to AI
      if (!rollRes.canAnyTokenMove && engine.state.currentTurn === 'yellow' && gameMode === 'vs_ai') {
        triggerAiTurn();
      }
    });
  };

  // Keyboard Spacebar to Roll Dice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameState.phase === 'roll_dice' && !isAiThinking) {
        e.preventDefault();
        handleRollDice();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.phase, isAiThinking]);

  // Initialize 3D Engine & Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new LudoScene3D(containerRef.current);
    sceneRef.current = scene;

    // Attach callbacks
    scene.onTokenSelect = (tokenId) => {
      if (gameState.phase === 'select_token' && !isAiThinking) {
        handleExecuteMove(tokenId);
      }
    };

    scene.onDiceClick = () => {
      if (gameState.phase === 'roll_dice' && !isAiThinking) {
        handleRollDice();
      }
    };

    syncBoardState();

    const doResize = () => scene.resize();
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
      scene.destroy();
    };
  }, []);

  const handleToggleCamera = () => {
    const next = cameraMode === 'iso' ? 'top' : 'iso';
    setCameraMode(next);
    sceneRef.current?.setCameraMode(next);
  };

  const handleToggleMute = () => {
    const muted = ludoSound.toggleMute();
    setIsMuted(muted);
  };

  const handleResetMatch = () => {
    engineRef.current.reset();
    setShowWinModal(false);
    setCommentary("New match! Red rolls first with two dice.");
    syncBoardState();
  };

  const requestFullscreenLandscape = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      const scr = window.screen as any;
      if (scr?.orientation?.lock) {
        await scr.orientation.lock('landscape');
      }
    } catch (e) {
      console.log('Orientation lock skipped:', e);
    }
  };

  // Get finished token count
  const getFinishedCount = (color: LudoColor) => {
    return gameState.tokens[color].filter(t => t.isFinished).length;
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-950 select-none text-white font-sans">
      {/* 1. MANDATORY HORIZONTAL VIEW (LANDSCAPE) GATE OVERLAY FOR MOBILE */}
      {isPortrait && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in">
          {/* Street Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-black uppercase mb-6 shadow-lg">
            <span>🎲 NAIJA LUDO 3D</span>
          </div>

          {/* Animated Rotating Smartphone */}
          <div className="relative w-28 h-28 flex items-center justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl relative">
              <div
                className="transition-transform duration-700 ease-in-out"
                style={{ animation: 'rotatePhone 2.6s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
              >
                <Smartphone className="w-12 h-12 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg border-2 border-zinc-900">
                <RotateCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </div>
          </div>

          <h2 className="font-display text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 mb-2">
            HORIZONTAL VIEW REQUIRED
          </h2>
          <p className="text-xs text-zinc-300 max-w-xs mb-6 leading-relaxed">
            Please rotate your mobile phone to <strong>Landscape mode</strong> to view the full 3D Nigeria Ludo board and roll the two dice!
          </p>

          <div className="flex flex-col space-y-2.5 w-full max-w-xs">
            <button
              onClick={requestFullscreenLandscape}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-black font-black text-xs uppercase tracking-wider shadow-lg active:scale-95"
            >
              ROTATE / FULLSCREEN
            </button>
            <button
              onClick={onExit}
              className="w-full py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 font-bold text-xs uppercase tracking-wider hover:text-white"
            >
              Back to Arcade Hub
            </button>
          </div>
        </div>
      )}

      {/* 2. 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full overflow-hidden cursor-pointer z-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* 3. MOBILE LANDSCAPE TOP HEADER (Ultra-compact) */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-black/85 via-black/45 to-transparent pointer-events-auto">
        {/* Left: Hub back & Game Title */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onExit}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-bold shadow-md active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hub</span>
          </button>

          <div className="flex items-center space-x-1.5">
            <span className="text-base">🎲</span>
            <span className="font-display text-xs sm:text-sm tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-300 to-yellow-400">
              NAIJA LUDO 3D
            </span>
          </div>
        </div>

        {/* Center: Turn Status Pill */}
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-md flex items-center space-x-1.5 ${
            gameState.currentTurn === 'red'
              ? 'bg-red-500/20 border-red-500 text-red-400'
              : 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${gameState.currentTurn === 'red' ? 'bg-red-500 animate-ping' : 'bg-yellow-500 animate-ping'}`} />
            <span>
              {gameState.currentTurn === 'red' 
                ? 'YOUR TURN (RED)' 
                : (gameMode === 'vs_ai' ? 'BROS EMEKA (YELLOW)' : 'PLAYER 2 (YELLOW)')}
            </span>
          </div>
        </div>

        {/* Right: Camera, Audio, Rules */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleToggleCamera}
            className="px-2 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-zinc-200 text-[11px] font-bold shadow-md flex items-center space-x-1 active:scale-95"
          >
            <Eye className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">{cameraMode === 'iso' ? '3D' : '2D'}</span>
          </button>

          <button
            onClick={handleToggleMute}
            className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-zinc-300 shadow-md active:scale-95"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <button
            onClick={() => setShowRules(true)}
            className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-zinc-300 shadow-md active:scale-95"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* 4. LEFT THUMB FLANK: Players Status & TWO DICE CARD */}
      <div className="absolute left-2.5 top-12 bottom-3 z-10 flex flex-col justify-between pointer-events-auto w-36 sm:w-44">
        {/* Player Scorecards */}
        <div className="flex flex-col space-y-1.5">
          {/* Player 1 (Red) */}
          <div className={`p-2 rounded-xl border backdrop-blur-md transition-all shadow-lg ${
            gameState.currentTurn === 'red' 
              ? 'bg-red-950/80 border-red-500 scale-102 shadow-red-500/20' 
              : 'bg-zinc-900/70 border-white/10 opacity-75'
          }`}>
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-red-400">
              <span>PLAYER 1</span>
              <span>{getFinishedCount('red')}/4 HOME</span>
            </div>
            {/* Progress pips */}
            <div className="flex space-x-1 mt-1">
              {gameState.tokens.red.map((t, idx) => (
                <div
                  key={idx}
                  className={`flex-1 h-1.5 rounded-full ${t.isFinished ? 'bg-red-500 shadow-sm' : t.step >= 0 ? 'bg-amber-400' : 'bg-zinc-700'}`}
                />
              ))}
            </div>
          </div>

          {/* Player 2 (Yellow) */}
          <div className={`p-2 rounded-xl border backdrop-blur-md transition-all shadow-lg ${
            gameState.currentTurn === 'yellow' 
              ? 'bg-amber-950/80 border-yellow-500 scale-102 shadow-yellow-500/20' 
              : 'bg-zinc-900/70 border-white/10 opacity-75'
          }`}>
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-yellow-400">
              <span>{gameMode === 'vs_ai' ? 'BROS EMEKA' : 'PLAYER 2'}</span>
              <span>{getFinishedCount('yellow')}/4 HOME</span>
            </div>
            {/* Progress pips */}
            <div className="flex space-x-1 mt-1">
              {gameState.tokens.yellow.map((t, idx) => (
                <div
                  key={idx}
                  className={`flex-1 h-1.5 rounded-full ${t.isFinished ? 'bg-yellow-400 shadow-sm' : t.step >= 0 ? 'bg-amber-400' : 'bg-zinc-700'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* TWO DICE OUTCOME CARD */}
        <div className="p-2.5 rounded-2xl bg-zinc-900/90 border border-white/15 backdrop-blur-md shadow-2xl flex flex-col items-center">
          <div className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold mb-1">TWO 3D DICE</div>
          
          <div className="flex items-center space-x-2 mb-1">
            {/* Die 1 Pip */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-300 text-zinc-950 font-black text-lg flex items-center justify-center shadow-lg border border-white/60">
              {gameState.diceValues ? gameState.diceValues[0] : '-'}
            </div>
            <span className="text-xs font-bold text-zinc-500">+</span>
            {/* Die 2 Pip */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-300 text-zinc-950 font-black text-lg flex items-center justify-center shadow-lg border border-white/60">
              {gameState.diceValues ? gameState.diceValues[1] : '-'}
            </div>
          </div>

          <div className="text-xs font-black text-amber-400">
            {gameState.diceSum ? `TOTAL: ${gameState.diceSum} STEPS` : 'READY TO ROLL'}
          </div>

          {gameState.isDoubles && (
            <div className="mt-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[9px] font-black uppercase animate-pulse">
              DOUBLE BONUS ROLL!
            </div>
          )}
        </div>
      </div>

      {/* 5. TOP COMMENTARY BANNER */}
      <div className="absolute top-11 inset-x-0 z-10 flex justify-center pointer-events-none px-4">
        <div className="px-3.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs text-zinc-200 font-semibold shadow-lg text-center max-w-sm truncate">
          {commentary}
        </div>
      </div>

      {/* 6. RIGHT THUMB FLANK: "ROLL 2 DICE" & PAWN SELECTOR (Ergonomic for right thumb) */}
      <div className="absolute right-2.5 bottom-3 z-20 flex flex-col items-end pointer-events-auto space-y-2">
        {/* Token Choice Buttons when multiple tokens can move */}
        {gameState.phase === 'select_token' && gameState.currentTurn === 'red' && (
          <div className="flex flex-col space-y-1.5 bg-zinc-900/95 backdrop-blur-md p-2 rounded-2xl border border-amber-500/40 shadow-2xl max-w-[170px]">
            <div className="text-[10px] font-bold text-amber-400 text-center uppercase">SELECT PAWN TO MOVE</div>
            <div className="grid grid-cols-2 gap-1.5">
              {gameState.tokens.red.map((t, i) => {
                const canMove = engineRef.current.getMovableTokens('red', gameState.diceValues || [0, 0]).some(m => m.id === t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => handleExecuteMove(t.id)}
                    disabled={!canMove}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase transition-all shadow ${
                      canMove
                        ? 'bg-amber-500 hover:bg-amber-400 text-black active:scale-95 animate-pulse'
                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-40'
                    }`}
                  >
                    {t.step === -1 ? `P${i+1} OPEN` : `P${i+1} RUN`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* BIG ERGONOMIC "ROLL 2 DICE" BUTTON */}
        <button
          onClick={handleRollDice}
          disabled={gameState.phase !== 'roll_dice' || isAiThinking || gameState.currentTurn !== 'red'}
          className={`w-36 sm:w-44 py-3.5 px-4 rounded-2xl font-display text-xs sm:text-sm tracking-wider flex items-center justify-center space-x-2 shadow-2xl transition-all active:scale-95 ${
            gameState.phase === 'roll_dice' && gameState.currentTurn === 'red' && !isAiThinking
              ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 text-zinc-950 font-black shadow-emerald-500/40 animate-bounce'
              : 'bg-zinc-800/80 text-zinc-500 border border-white/5 cursor-not-allowed'
          }`}
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>{isAiThinking ? 'AI ROLLING...' : gameState.phase === 'select_token' ? 'SELECT PAWN' : 'ROLL 2 DICE'}</span>
        </button>
      </div>

      {/* 7. RULES MODAL */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-white/15 rounded-3xl p-5 shadow-2xl text-left space-y-3">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 className="font-display text-base text-amber-400 flex items-center space-x-2">
                <span>🎲</span>
                <span>NAIJA LUDO 2-DICE RULES</span>
              </h3>
              <button onClick={() => setShowRules(false)} className="text-zinc-400 hover:text-white p-1">✕</button>
            </div>

            <div className="text-[11px] text-zinc-300 space-y-2 max-h-[50vh] overflow-y-auto pr-1 leading-relaxed">
              <p className="font-semibold text-emerald-400">1. Two Dice Rolling & 6-to-Open:</p>
              <p>You roll two dice every turn! Rolling a <strong>6 on either die</strong> opens your pawn from the yard onto the track. The second die value can advance that pawn immediately!</p>

              <p className="font-semibold text-emerald-400">2. Doubles Bonus Roll:</p>
              <p>Rolling doubles (e.g. [5, 5] or [6, 6]) grants an <strong>immediate extra bonus roll</strong>! Rolling three doubles in a row triggers a forfeit penalty.</p>

              <p className="font-semibold text-emerald-400">3. Kpafuka Chop Capture:</p>
              <p>Landing on an opponent pawn on normal tiles chops them back to their yard and grants a bonus roll!</p>

              <p className="font-semibold text-emerald-400">4. Safe Star Tiles:</p>
              <p>Pawns resting on the Star tiles are completely protected and cannot be chopped.</p>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider"
            >
              GOT IT, OYA PLAY!
            </button>
          </div>
        </div>
      )}

      {/* 8. VICTORY WIN MODAL */}
      {showWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in zoom-in-95">
          <div className="w-full max-w-sm bg-zinc-900 border border-amber-500/50 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
            <h2 className="font-display text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
              {gameState.winner === 'red' ? 'YOU WIN THE MATCH!' : 'BROS EMEKA WINS!'}
            </h2>
            <p className="text-xs font-bold text-zinc-200">
              {gameState.winner === 'red' 
                ? 'All 4 tokens safely entered the house! Undisputed Street Ludo Champion!' 
                : 'Bros Emeka completed all 4 tokens first! Practice more and rematch!'}
            </p>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleResetMatch}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>REMATCH</span>
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-wider"
              >
                EXIT HUB
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
