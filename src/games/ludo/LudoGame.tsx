import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LudoEngine } from './LudoEngine';
import { LudoScene3D } from './LudoScene3D';
import { ludoSound } from './LudoAudio';
import { LudoGameState, GameMode } from './types';
import { getTokenWorldPosition } from './LudoBoardCoords';

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
    "Bonus roll! Keep the fire burning!"
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
  const [commentary, setCommentary] = useState<string>("Welcome to Naija Ludo 3D! Shake the cup and roll six.");
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);

  const getRandomQuote = (quotes: string[]) => quotes[Math.floor(Math.random() * quotes.length)];

  // Helper to sync state and visual tokens
  const syncBoardState = useCallback(() => {
    const engine = engineRef.current;
    const scene = sceneRef.current;
    const state = { ...engine.state };
    setGameState(state);

    if (scene) {
      const dice = state.diceValue;
      const movableTokens = dice ? engine.getMovableTokens(state.currentTurn, dice).map((t) => t.id) : [];
      scene.syncTokens(state.tokens, movableTokens);
    }
  }, []);

  // Handle Token Move Execution
  const handleExecuteMove = useCallback(async (tokenId: string) => {
    const engine = engineRef.current;
    const scene = sceneRef.current;
    if (!scene) return;

    const color = engine.state.currentTurn;
    const token = engine.state.tokens[color].find((t) => t.id === tokenId);
    if (!token) return;

    const startPos = getTokenWorldPosition(color, token.index, token.step);

    // Make move in engine
    const result = engine.moveToken(tokenId);
    if (!result.success) return;

    scene.isInteractive = false;

    // 1. Animate token hop to new position
    const endPos = getTokenWorldPosition(color, token.index, token.step);
    await scene.animateTokenMove(tokenId, startPos, endPos);

    // 2. Animate Chop if an opponent was captured
    if (result.choppedToken) {
      setCommentary(getRandomQuote(EMEKA_QUOTES.chop));
      const opponentColor = result.choppedToken.color;
      const yardTarget = getTokenWorldPosition(opponentColor, result.choppedToken.index, -1);
      await scene.animateChop(result.choppedToken.id, yardTarget);
    } else if (result.enteredHouse) {
      ludoSound.playEnterHome();
      setCommentary(getRandomQuote(EMEKA_QUOTES.house));
    }

    syncBoardState();

    if (result.isGameOver) {
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
  }, [gameMode, syncBoardState]);

  // AI Turn Logic (Bros Emeka)
  const triggerAiTurn = useCallback(() => {
    const engine = engineRef.current;
    const scene = sceneRef.current;
    if (engine.state.winner !== null || !scene) return;

    setIsAiThinking(true);
    scene.isInteractive = false;
    setCommentary("Bros Emeka is shaking the dice cup...");

    setTimeout(async () => {
      // 1. Roll Dice for AI
      const rollRes = engine.rollDice();
      await scene.animateDiceRoll(rollRes.value);

      if (rollRes.value === 6) {
        setCommentary(getRandomQuote(EMEKA_QUOTES.rollSix));
      }

      syncBoardState();

      if (!rollRes.canAnyTokenMove) {
        // No moves possible
        scene.isInteractive = true;
        setIsAiThinking(false);
        // If rolled 6, AI rolls again
        if (rollRes.extraTurn && engine.state.currentTurn === 'yellow') {
          triggerAiTurn();
        }
        return;
      }

      // 2. AI chooses best token after brief hesitation
      setTimeout(async () => {
        const bestTokenId = engine.getBestAIMove();
        if (bestTokenId) {
          await handleExecuteMove(bestTokenId);
        }
        scene.isInteractive = true;
        setIsAiThinking(false);

        // If AI earned bonus roll (rolled 6 or chopped), trigger AI turn again!
        if (engine.state.bonusRoll && engine.state.currentTurn === 'yellow' && !engine.state.winner) {
          triggerAiTurn();
        }
      }, 700);
    }, 600);
  }, [handleExecuteMove, syncBoardState]);

  // Handle Player Clicking "ROLL DICE"
  const handleRollDice = async () => {
    const engine = engineRef.current;
    const scene = sceneRef.current;
    if (gameState.phase !== 'roll_dice' || isAiThinking || gameState.winner || !scene) return;

    scene.isInteractive = false;
    const rollRes = engine.rollDice();
    await scene.animateDiceRoll(rollRes.value);

    if (rollRes.value === 6) {
      setCommentary(getRandomQuote(EMEKA_QUOTES.rollSix));
    }

    syncBoardState();
    scene.isInteractive = true;

    // If no moves possible and turn passed to AI
    if (!rollRes.canAnyTokenMove && engine.state.currentTurn === 'yellow' && gameMode === 'vs_ai') {
      triggerAiTurn();
    }
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

  // Initialize 3D Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new LudoScene3D(containerRef.current);
    sceneRef.current = scene;

    scene.onTokenSelect = (tokenId) => {
      const engine = engineRef.current;
      if (engine.state.phase === 'select_token' && !isAiThinking) {
        if (gameMode === 'vs_ai' && engine.state.currentTurn !== 'red') return;
        handleExecuteMove(tokenId);
      }
    };

    scene.onDiceClick = () => {
      if (engineRef.current.state.phase === 'roll_dice' && !isAiThinking) {
        handleRollDice();
      }
    };

    syncBoardState();

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [handleExecuteMove, isAiThinking, gameMode, syncBoardState]);

  // Restart match
  const handleRestart = () => {
    engineRef.current.reset();
    setShowWinModal(false);
    setIsAiThinking(false);
    setCommentary("New match started! Red rolls first.");
    syncBoardState();
  };

  const handleToggleMute = () => {
    const muted = ludoSound.toggleMute();
    setIsMuted(muted);
  };

  const redTokens = gameState.tokens.red;
  const yellowTokens = gameState.tokens.yellow;
  const redFinished = redTokens.filter((t) => t.isFinished).length;
  const yellowFinished = yellowTokens.filter((t) => t.isFinished).length;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans select-none text-white">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* TOP HEADER HUD */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-stone-950/90 via-stone-950/60 to-transparent pointer-events-none">
        {/* Back to Hub Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-amber-500/30 text-amber-300 font-bold text-xs tracking-wider uppercase transition-all shadow-lg active:scale-95"
          >
            <span>&larr;</span>
            <span className="hidden sm:inline">ARCADE</span>
            <span>HUB</span>
          </button>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-600/20 text-amber-300 text-xs font-semibold">
            <span>🎲</span>
            <span>NAIJA LUDO 3D</span>
          </div>
        </div>

        {/* Center Scoreboards & Finished Tokens */}
        <div className="pointer-events-auto flex items-center gap-3 bg-stone-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-500/30 shadow-2xl">
          {/* Red Player (South) */}
          <div className={`flex flex-col items-center px-2 sm:px-3 py-1 rounded-xl transition-all ${gameState.currentTurn === 'red' ? 'bg-red-500/20 ring-1 ring-red-400' : 'opacity-70'}`}>
            <span className="text-[10px] tracking-widest uppercase font-extrabold text-red-400">
              {gameMode === 'vs_ai' ? 'YOU (RED)' : 'PLAYER 1 (RED)'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-red-300">{redFinished}</span>
              <span className="text-[10px] text-stone-400 font-bold">/ 4 in House</span>
            </div>
            {/* Progress Dots */}
            <div className="flex gap-1 mt-0.5">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${idx < redFinished ? 'bg-red-500 shadow-sm shadow-red-500' : 'bg-stone-700'}`}
                />
              ))}
            </div>
          </div>

          {/* Turn Indicator */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-stone-500">VS</span>
            <div className={`mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
              gameState.currentTurn === 'red'
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-yellow-400 text-stone-950 animate-pulse'
            }`}>
              {gameState.currentTurn === 'red'
                ? (gameState.phase === 'roll_dice' ? 'Red Roll' : 'Red Move')
                : (gameMode === 'vs_ai' ? 'Emeka...' : 'Yellow Turn')}
            </div>
          </div>

          {/* Yellow Player (North) */}
          <div className={`flex flex-col items-center px-2 sm:px-3 py-1 rounded-xl transition-all ${gameState.currentTurn === 'yellow' ? 'bg-yellow-500/20 ring-1 ring-yellow-400' : 'opacity-70'}`}>
            <span className="text-[10px] tracking-widest uppercase font-extrabold text-yellow-400">
              {gameMode === 'vs_ai' ? 'BROS EMEKA (AI)' : 'PLAYER 2 (YELLOW)'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-yellow-300">{yellowFinished}</span>
              <span className="text-[10px] text-stone-400 font-bold">/ 4 in House</span>
            </div>
            {/* Progress Dots */}
            <div className="flex gap-1 mt-0.5">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${idx < yellowFinished ? 'bg-yellow-400 shadow-sm shadow-yellow-400' : 'bg-stone-700'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Action Icons (Mute, Rules, Reset) */}
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
            className="w-9 h-9 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-amber-500/40 flex items-center justify-center text-sm font-black text-amber-400 hover:text-amber-200 transition-all active:scale-95 shadow-md"
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

      {/* COMMENTARY BANNER */}
      <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-10 w-[92%] max-w-xl pointer-events-none">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-stone-950/85 backdrop-blur-md border border-amber-500/30 shadow-2xl text-center">
          <span className="text-lg">🎲</span>
          <p className="flex-1 text-xs sm:text-sm font-semibold text-amber-200 italic truncate">
            &ldquo;{commentary}&rdquo;
          </p>
        </div>
      </div>

      {/* BOTTOM CONTROLS DOCK */}
      <footer className="absolute bottom-3 sm:bottom-4 left-0 right-0 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 pointer-events-none">
        {/* Instructions / Status pill */}
        <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900/90 backdrop-blur border border-amber-500/20 text-xs font-medium text-stone-300 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{gameState.lastAction}</span>
        </div>

        {/* Center: BIG TACTILE ROLL DICE BUTTON */}
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            onClick={handleRollDice}
            disabled={gameState.phase !== 'roll_dice' || isAiThinking || gameState.winner !== null}
            className={`px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center gap-2 transition-all shadow-xl active:scale-95 ${
              gameState.phase === 'roll_dice' && !isAiThinking
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 hover:brightness-110 shadow-amber-500/30 animate-pulse'
                : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-60'
            }`}
          >
            <span className="text-xl">🎲</span>
            <span>ROLL DICE {gameState.phase === 'roll_dice' && !isAiThinking ? '(SPACE)' : ''}</span>
          </button>

          {/* Dice Pip Preview */}
          {gameState.diceValue && (
            <div className="w-11 h-11 rounded-xl bg-stone-900 border border-amber-400/60 flex items-center justify-center font-display font-black text-xl text-amber-300 shadow-lg">
              {gameState.diceValue}
            </div>
          )}
        </div>

        {/* Mode Selector Switcher */}
        <div className="pointer-events-auto flex items-center gap-2 bg-stone-950/90 backdrop-blur-md p-1.5 rounded-2xl border border-stone-800 shadow-2xl">
          <div className="flex bg-stone-900 p-0.5 rounded-xl border border-stone-800">
            <button
              onClick={() => { setGameMode('vs_ai'); handleRestart(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                gameMode === 'vs_ai'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              vs AI
            </button>
            <button
              onClick={() => { setGameMode('local_2p'); handleRestart(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                gameMode === 'local_2p'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              2P Local
            </button>
          </div>
        </div>
      </footer>

      {/* RULES MODAL */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-stone-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-stone-200">
            <button
              onClick={() => setShowRules(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold flex items-center justify-center text-sm"
            >
              &times;
            </button>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🎲</span>
              <div>
                <h2 className="text-xl font-black text-amber-400">NAIJA LUDO 3D RULES</h2>
                <p className="text-xs text-stone-400">Authentic Nigerian Street Board Game Rules</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs leading-relaxed text-stone-300">
              <div className="p-3 bg-stone-950/60 rounded-xl border border-amber-500/20">
                <span className="font-bold text-amber-300 block mb-0.5">1. Opening from Yard (Six!)</span>
                A token can only leave your corner yard and step onto your starting square when you roll a <strong>6</strong>! Rolling a 6 also gives you a <strong>bonus roll</strong>!
              </div>

              <div className="p-3 bg-stone-950/60 rounded-xl border border-amber-500/20">
                <span className="font-bold text-amber-300 block mb-0.5">2. KPAFUKA! (Capturing / Chopping)</span>
                If your token lands on an opponent&apos;s token on any regular track tile, the opponent is <strong>CHOPPED</strong> and sent straight back to their yard! Chopping earns you a <strong>bonus roll</strong>!
              </div>

              <div className="p-3 bg-stone-950/60 rounded-xl border border-amber-500/20">
                <span className="font-bold text-amber-300 block mb-0.5">3. Safe Star Squares</span>
                Tokens standing on the <strong>Globe / Star tiles</strong> and starting arrow tiles are safe and cannot be chopped!
              </div>

              <div className="p-3 bg-stone-950/60 rounded-xl border border-amber-500/20">
                <span className="font-bold text-amber-300 block mb-0.5">4. Three 6s Penalty</span>
                Rolling three 6s in a row triggers the classic street penalty: the bonus is forfeited and turn passes!
              </div>

              <div className="p-3 bg-stone-950/60 rounded-xl border border-amber-500/20">
                <span className="font-bold text-amber-300 block mb-0.5">5. Reaching House & Winning</span>
                Tokens travel full circle around the track, climb their home column, and enter the center <strong>House</strong>. First player to bring all 4 tokens to House wins the crown!
              </div>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-98 shadow-lg shadow-amber-500/30"
            >
              I Understand &mdash; Let&apos;s Roll!
            </button>
          </div>
        </div>
      )}

      {/* VICTORY MODAL */}
      {showWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-stone-900 border-2 border-amber-500 rounded-3xl p-6 text-center shadow-2xl">
            <span className="text-5xl block mb-2">👑</span>
            <h2 className="text-2xl font-black text-amber-400 mb-1">
              {gameState.winner === 'red'
                ? (gameMode === 'vs_ai' ? 'YOU ARE THE LUDO KING!' : 'PLAYER 1 (RED) WINS!')
                : (gameMode === 'vs_ai' ? 'BROS EMEKA WINS!' : 'PLAYER 2 (YELLOW) WINS!')}
            </h2>
            <p className="text-xs text-stone-300 mb-6">
              {gameState.winner === 'red'
                ? getRandomQuote(EMEKA_QUOTES.win)
                : getRandomQuote(EMEKA_QUOTES.loss)}
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-98 shadow-lg shadow-amber-500/30"
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

export default LudoGame;
