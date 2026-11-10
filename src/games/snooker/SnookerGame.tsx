import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  ArrowLeft, Volume2, VolumeX, Eye, HelpCircle, 
  RotateCcw, Sparkles, Trophy, Zap, AlertTriangle, Play 
} from 'lucide-react';
import { SnookerEngine } from './SnookerEngine';
import { SnookerScene3D } from './SnookerScene3D';
import { snookerAudio } from './SnookerAudio';
import { GameMode, AIDifficulty, SnookerGameState } from './types';

interface SnookerGameProps {
  onExit: () => void;
}

export const SnookerGame: React.FC<SnookerGameProps> = ({ onExit }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<SnookerScene3D | null>(null);
  const engineRef = useRef<SnookerEngine | null>(null);

  // Match Configuration
  const [gameMode, setGameMode] = useState<GameMode>('vs_ai');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'aim' | 'overhead'>('aim');
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  // Live Game State
  const [gameState, setGameState] = useState<SnookerGameState>({
    p1Score: 0,
    p2Score: 0,
    currentBreak: 0,
    currentTurn: 'p1',
    targetBallType: 'red',
    remainingReds: 15,
    lastPotMessage: 'Game started! Oya strike cue ball!',
    isFoul: false,
    foulReason: '',
    aimAngle: -Math.PI / 2,
    shotPower: 0.55,
    isBallsMoving: false,
    winner: null,
    commentary: 'Welcome to Naija 3D Snooker! Chalk your cue!'
  });

  // Aim and Drag tracking
  const [isDraggingAim, setIsDraggingAim] = useState(false);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize Engine and Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new SnookerEngine(gameMode, aiDifficulty);
    engineRef.current = engine;

    const scene = new SnookerScene3D(containerRef.current);
    sceneRef.current = scene;

    // Connect physics audio cues
    engine.physics.onBallClack = (speed) => snookerAudio.playBallClack(speed);
    engine.physics.onCushionBounce = (speed) => snookerAudio.playCushionBounce(speed);
    engine.physics.onPocketDrop = (ball) => {
      snookerAudio.playPocketDrop();
      if (ball.type !== 'cue') {
        snookerAudio.playCrowdCheer();
      }
    };

    engine.setOnStateChange((newState) => {
      setGameState({ ...newState });
      if (newState.isFoul) {
        snookerAudio.playFoulBuzzer();
      }
      if (newState.winner) {
        snookerAudio.playVictoryFanfare();
      }
    });

    // Main animation loop
    let lastTime = performance.now();
    let animId: number;

    const loop = (time: number) => {
      const delta = Math.min(0.033, (time - lastTime) / 1000);
      lastTime = time;

      engine.update(delta);
      scene.syncBalls(engine.physics.balls);
      scene.updateAim(
        engine.getCueBall(),
        engine.state.aimAngle,
        engine.state.shotPower,
        engine.state.isBallsMoving,
        engine.physics.balls
      );

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      scene.destroy();
    };
  }, []);

  // Update Game Mode
  const handleModeChange = (newMode: GameMode) => {
    setGameMode(newMode);
    if (engineRef.current) {
      engineRef.current.mode = newMode;
      engineRef.current.resetMatch();
    }
  };

  // Update AI Difficulty
  const handleDifficultyChange = (diff: AIDifficulty) => {
    setAiDifficulty(diff);
    if (engineRef.current) {
      engineRef.current.aiDifficulty = diff;
    }
  };

  // Toggle Camera View
  const handleToggleCamera = () => {
    const next = cameraMode === 'aim' ? 'overhead' : 'aim';
    setCameraMode(next);
    if (sceneRef.current) {
      sceneRef.current.cameraMode = next;
    }
  };

  // Toggle Sound Mute
  const handleToggleMute = () => {
    const muted = snookerAudio.toggleMute();
    setIsMuted(muted);
  };

  // Execute Shot
  const handleShoot = () => {
    if (!engineRef.current || gameState.isBallsMoving) return;
    snookerAudio.playCueStrike(gameState.shotPower);
    engineRef.current.executeShot(gameState.aimAngle, gameState.shotPower);
  };

  // Aim Adjustments
  const adjustAim = (deltaRad: number) => {
    if (!engineRef.current || gameState.isBallsMoving) return;
    const newAngle = engineRef.current.state.aimAngle + deltaRad;
    engineRef.current.state.aimAngle = newAngle;
    setGameState(prev => ({ ...prev, aimAngle: newAngle }));
  };

  const handlePowerChange = (power: number) => {
    if (!engineRef.current) return;
    engineRef.current.state.shotPower = power;
    setGameState(prev => ({ ...prev, shotPower: power }));
  };

  // Touch and Mouse Drag to Rotate Cue Stick Aim
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDraggingAim(true);
    lastTouchRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingAim || !lastTouchRef.current || !engineRef.current || gameState.isBallsMoving) return;
    const dx = e.clientX - lastTouchRef.current.x;
    lastTouchRef.current = { x: e.clientX, y: e.clientY };

    // Sensitivity factor
    const rot = dx * 0.0075;
    const newAngle = engineRef.current.state.aimAngle + rot;
    engineRef.current.state.aimAngle = newAngle;
    setGameState(prev => ({ ...prev, aimAngle: newAngle }));
  };

  const handlePointerUp = () => {
    setIsDraggingAim(false);
    lastTouchRef.current = null;
  };

  // Ball On Color Badge
  const getBallOnBadge = () => {
    const target = gameState.targetBallType;
    if (target === 'red') {
      return (
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-600/30 border border-red-500 text-red-400 font-black text-xs uppercase shadow-lg animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-sm" />
          <span>RED (1 PT)</span>
        </div>
      );
    }
    if (target === 'color') {
      return (
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/30 border border-amber-400 text-amber-300 font-black text-xs uppercase shadow-lg animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-yellow-400 via-green-500 to-pink-500 inline-block shadow-sm" />
          <span>ANY COLOR (2-7 PTS)</span>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-600/30 border border-emerald-400 text-emerald-300 font-black text-xs uppercase shadow-lg animate-pulse">
        <span className="w-2.5 h-2.5 rounded-full bg-white inline-block shadow-sm" />
        <span>CLEARANCE: {target.toUpperCase()}</span>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-950 select-none text-white font-sans">
      {/* 3D Three.js Viewport */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* TOP HEADER NAVIGATION */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-auto">
        {/* Left: Exit button & Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onExit}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Hub</span>
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl">🎱</span>
              <h1 className="font-display text-base sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-300 to-yellow-400 drop-shadow">
                NAIJA SNOOKER 3D
              </h1>
            </div>
            <p className="text-[10px] text-zinc-400 hidden sm:block">Championship Table & Official English Snooker Rules</p>
          </div>
        </div>

        {/* Center: Ball On Indicator */}
        <div className="flex items-center space-x-2">
          {getBallOnBadge()}
        </div>

        {/* Right: Camera, Sound, Rules */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleCamera}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-200 shadow-md active:scale-95"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] uppercase hidden sm:inline">{cameraMode === 'aim' ? 'Aim Cam' : 'Top Cam'}</span>
          </button>

          <button
            onClick={handleToggleMute}
            className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-zinc-300 shadow-md active:scale-95"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={() => setShowRulesModal(true)}
            className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-zinc-300 shadow-md active:scale-95"
            title="Snooker Rules"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* SCOREBOARD & BREAK BANNER */}
      <div className="absolute top-16 inset-x-0 z-10 flex justify-center pointer-events-none px-4">
        <div className="flex items-center space-x-4 bg-zinc-900/90 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/10 shadow-2xl">
          {/* Player 1 */}
          <div className={`text-center px-3 py-1 rounded-xl transition-all ${gameState.currentTurn === 'p1' ? 'bg-emerald-500/20 border border-emerald-500/50 scale-105' : 'opacity-70'}`}>
            <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Player 1</div>
            <div className="text-2xl font-black text-white">{gameState.p1Score}</div>
          </div>

          {/* Break & Reds Left */}
          <div className="text-center px-3 border-x border-white/10">
            <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Current Break</div>
            <div className="text-xl font-black text-amber-400">{gameState.currentBreak}</div>
            <div className="text-[9px] text-zinc-400 font-bold">Reds: {gameState.remainingReds}/15</div>
          </div>

          {/* Player 2 or AI */}
          <div className={`text-center px-3 py-1 rounded-xl transition-all ${gameState.currentTurn === 'p2' ? 'bg-amber-500/20 border border-amber-500/50 scale-105' : 'opacity-70'}`}>
            <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
              {gameMode === 'vs_ai' ? 'Alhaji Snooker (AI)' : 'Player 2'}
            </div>
            <div className="text-2xl font-black text-white">{gameState.p2Score}</div>
          </div>
        </div>
      </div>

      {/* PIDGIN COMMENTARY & FOUL TOAST */}
      <div className="absolute top-32 inset-x-0 z-10 flex flex-col items-center pointer-events-none px-4 space-y-1">
        {gameState.isFoul && (
          <div className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-red-600/90 border border-red-400 text-white font-bold text-xs uppercase shadow-xl animate-bounce">
            <AlertTriangle className="w-4 h-4 text-yellow-300" />
            <span>{gameState.foulReason}</span>
          </div>
        )}

        <div className="px-4 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-xs text-zinc-200 font-semibold shadow-lg">
          {gameState.commentary}
        </div>
      </div>

      {/* BOTTOM CONTROLS (Aim Wheel, Power Slider & Shoot Button) */}
      <div className="absolute bottom-4 inset-x-0 z-20 flex flex-col items-center pointer-events-auto px-4 space-y-2">
        {/* Micro-Aim Stepper buttons */}
        <div className="flex items-center space-x-3 bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg">
          <button
            onClick={() => adjustAim(-0.02)}
            disabled={gameState.isBallsMoving}
            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 active:scale-95 disabled:opacity-40"
          >
            ◀ Fine Left
          </button>
          <span className="text-[11px] text-zinc-400 font-mono font-bold">DRAG TABLE TO AIM</span>
          <button
            onClick={() => adjustAim(0.02)}
            disabled={gameState.isBallsMoving}
            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 active:scale-95 disabled:opacity-40"
          >
            Fine Right ▶
          </button>
        </div>

        {/* Power Slider & Shoot Button Container */}
        <div className="w-full max-w-md flex items-center space-x-3 bg-zinc-900/95 backdrop-blur-md p-3 rounded-2xl border border-white/15 shadow-2xl">
          {/* Power Gauge */}
          <div className="flex-1 flex flex-col space-y-1">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-zinc-400 uppercase tracking-wider">Shot Power</span>
              <span className="text-amber-400 font-mono">{Math.round(gameState.shotPower * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.01"
              value={gameState.shotPower}
              disabled={gameState.isBallsMoving}
              onChange={(e) => handlePowerChange(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-40"
            />
          </div>

          {/* STRIKE BUTTON */}
          <button
            onClick={handleShoot}
            disabled={gameState.isBallsMoving || (gameMode === 'vs_ai' && gameState.currentTurn === 'p2')}
            className={`px-6 py-3.5 rounded-xl font-display text-sm tracking-wider flex items-center space-x-2 shadow-xl transition-all active:scale-95 ${
              gameState.isBallsMoving || (gameMode === 'vs_ai' && gameState.currentTurn === 'p2')
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-zinc-950 font-black shadow-emerald-500/30'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{gameState.isBallsMoving ? 'ROLLING...' : 'STRIKE'}</span>
          </button>
        </div>
      </div>

      {/* RULES / INSTRUCTIONS MODAL */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-zinc-900 border border-white/15 rounded-3xl p-6 shadow-2xl text-left space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-display text-lg text-amber-400 flex items-center space-x-2">
                <span>🎱</span>
                <span>HOW TO PLAY SNOOKER</span>
              </h3>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-zinc-400 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-zinc-300 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              <p className="font-semibold text-emerald-400">1. Red and Color Rotation:</p>
              <p>You must pot a <strong className="text-red-400">Red ball (1 pt)</strong> first. Once a red is potted, you can pot <strong className="text-amber-400">any Color (2 to 7 pts)</strong>. Potted colors are respotted on the table while reds remain.</p>

              <p className="font-semibold text-emerald-400">2. Official Ball Point Values:</p>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] p-2 bg-zinc-950 rounded-xl border border-white/5">
                <span className="text-red-400">🔴 Red = 1 pt</span>
                <span className="text-yellow-400">🟡 Yellow = 2 pts</span>
                <span className="text-green-500">🟢 Green = 3 pts</span>
                <span className="text-amber-700">🟤 Brown = 4 pts</span>
                <span className="text-blue-500">🔵 Blue = 5 pts</span>
                <span className="text-pink-400">🌸 Pink = 6 pts</span>
                <span className="text-zinc-400">⚫ Black = 7 pts</span>
              </div>

              <p className="font-semibold text-emerald-400">3. End-Game Clearance:</p>
              <p>When all 15 reds are gone, the colors must be potted in strict ascending sequence: Yellow → Green → Brown → Blue → Pink → Black. They are not respotted.</p>

              <p className="font-semibold text-emerald-400">4. Fouls:</p>
              <p>Potting the white cue ball ("in-off"), missing all balls, or hitting the wrong ball awards at least <strong className="text-red-400">4 penalty points</strong> to your opponent.</p>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all"
            >
              GOT IT, LET'S PLAY!
            </button>
          </div>
        </div>
      )}

      {/* MATCH VICTORY MODAL */}
      {gameState.winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in zoom-in-95">
          <div className="w-full max-w-md bg-zinc-900 border border-amber-500/40 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
            <h2 className="font-display text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
              FRAME OVER!
            </h2>
            <p className="text-sm font-bold text-zinc-200">
              {gameState.winner === 'p1' ? 'PLAYER 1 WINS THE MATCH!' : 'ALHAJI SNOOKER TAKES THE FRAME!'}
            </p>

            <div className="p-3 bg-zinc-950 rounded-2xl border border-white/10 flex justify-around">
              <div>
                <div className="text-xs text-zinc-400 font-bold">P1 Score</div>
                <div className="text-2xl font-black text-emerald-400">{gameState.p1Score}</div>
              </div>
              <div className="border-r border-white/10" />
              <div>
                <div className="text-xs text-zinc-400 font-bold">P2 / AI Score</div>
                <div className="text-2xl font-black text-amber-400">{gameState.p2Score}</div>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => engineRef.current?.resetMatch()}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1"
              >
                <RotateCcw className="w-4 h-4" />
                <span>REMATCH</span>
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-wider transition-all"
              >
                EXIT TO HUB
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
