import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { HUD } from './ui/HUD';
import { MobileControls } from './ui/MobileControls';
import { CommentaryBanner } from './ui/CommentaryBanner';
import { MainMenu } from './ui/MainMenu';
import { MatchOverModal } from './ui/MatchOverModal';
import { MultiplayerModal } from './ui/MultiplayerModal';
import { PenaltyShootoutHUD } from './ui/PenaltyShootout';
import { RotateOverlay } from './ui/RotateOverlay';
import {
  GameMode,
  MatchScore,
  TeamInfo,
  PlayerState,
  BallState,
  CommentaryMessage,
  CameraMode
} from './types/game';
import { TEAMS } from './game/constants';
import { soundFX } from './audio/SoundFX';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Match & Team States
  const [gameMode, setGameMode] = useState<GameMode>('exhibition');
  const [matchState, setMatchState] = useState<'menu' | 'playing' | 'paused' | 'goal' | 'fulltime'>('menu');
  const [score, setScore] = useState<MatchScore>({ home: 0, away: 0 });
  const [timer, setTimer] = useState<number>(300);
  const [homeTeam, setHomeTeam] = useState<TeamInfo>(TEAMS[0]);
  const [awayTeam, setAwayTeam] = useState<TeamInfo>(TEAMS[1]);

  // Active Player & Game Data
  const [activePlayer, setActivePlayer] = useState<PlayerState | null>(null);
  const [allPlayers, setAllPlayers] = useState<PlayerState[]>([]);
  const [ball, setBall] = useState<BallState | null>(null);
  const [shootPower, setShootPower] = useState<number>(0);
  const [cameraMode, setCameraMode] = useState<CameraMode['id']>('broadcast');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Commentary & Popups
  const [commentary, setCommentary] = useState<CommentaryMessage | null>(null);
  const [showMainMenu, setShowMainMenu] = useState<boolean>(true);
  const [showMultiplayerModal, setShowMultiplayerModal] = useState<boolean>(false);
  const [showMatchOverModal, setShowMatchOverModal] = useState<boolean>(false);
  const [matchWinner, setMatchWinner] = useState<string>('');

  // Penalty Shootout State
  const [penaltyRound, setPenaltyRound] = useState<number>(1);
  const [penaltyTurn, setPenaltyTurn] = useState<'home' | 'away'>('home');
  const [penaltyHistory, setPenaltyHistory] = useState<{ home: boolean[]; away: boolean[] }>({
    home: [],
    away: []
  });

  // Initialize 3D Engine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current);
    engineRef.current = engine;
    engine.initializePlayers(homeTeam, awayTeam);

    // Callbacks from Game Engine
    engine.onScoreUpdate = (newScore) => {
      setScore({ ...newScore });
    };

    engine.onTimerUpdate = (newTime) => {
      setTimer(newTime);
    };

    engine.onPowerChange = (power) => {
      setShootPower(power);
    };

    engine.onCommentary = (text, type) => {
      setCommentary({
        id: Math.random().toString(36).substring(2, 9),
        text,
        type,
        timestamp: Date.now()
      });
    };

    engine.onMatchEnd = (finalScore, winner) => {
      setScore(finalScore);
      setMatchWinner(winner);
      setShowMatchOverModal(true);
      setMatchState('fulltime');
    };

    // State Polling Loop for HUD & Minimap (every 60ms)
    const interval = setInterval(() => {
      if (engineRef.current) {
        const eng = engineRef.current;
        setActivePlayer(eng.getActivePlayer());
        setAllPlayers(eng.getAllPlayers());
        setBall({ ...eng.getBallState() });

        if (eng.mode === 'penalties') {
          setPenaltyRound(eng.penaltyRound);
          setPenaltyTurn(eng.penaltyTeamTurn);
          setPenaltyHistory({
            home: [...eng.penaltyHistory.home],
            away: [...eng.penaltyHistory.away]
          });
        }
      }
    }, 60);

    return () => {
      clearInterval(interval);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Start match handler
  const handleStartMatch = (mode: GameMode, home: TeamInfo, away: TeamInfo, durationMinutes: number) => {
    setHomeTeam(home);
    setAwayTeam(away);
    setGameMode(mode);
    setShowMainMenu(false);
    setShowMatchOverModal(false);
    setMatchState('playing');

    if (engineRef.current) {
      engineRef.current.initializePlayers(home, away);
      engineRef.current.startMatch(mode, durationMinutes);
    }
  };

  // Start Multiplayer match
  const handleStartMultiplayerMatch = (roomId: string) => {
    setShowMultiplayerModal(false);
    handleStartMatch('multiplayer', homeTeam, awayTeam, 5);
  };

  // Restart match
  const handleRematch = () => {
    setShowMatchOverModal(false);
    if (engineRef.current) {
      engineRef.current.startMatch(gameMode, 5);
      setMatchState('playing');
    }
  };

  // Return to menu
  const handleReturnMenu = () => {
    setShowMatchOverModal(false);
    setShowMainMenu(true);
    setMatchState('menu');
  };

  // Audio mute toggle
  const handleToggleMute = useCallback(() => {
    const muted = soundFX.toggleMute();
    setIsMuted(muted);
  }, []);

  // Camera cycle
  const handleCycleCamera = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.cycleCameraMode();
      const modes: CameraMode['id'][] = ['broadcast', 'action', 'topdown'];
      setCameraMode((prev) => {
        const idx = modes.indexOf(prev);
        const next = modes[(idx + 1) % modes.length];
        return next;
      });
    }
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Screen Orientation Gate: Demands device rotation to Landscape before playing */}
      <RotateOverlay />

      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Naija Pidgin Commentary Banner */}
      <CommentaryBanner message={commentary} />

      {/* In-Game HUD (Scoreboard, Timer, Minimap, Camera Switch, etc.) */}
      {!showMainMenu && (
        <HUD
          score={score}
          timer={timer}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          activePlayer={activePlayer}
          shootPower={shootPower}
          allPlayers={allPlayers}
          ball={ball}
          cameraMode={cameraMode}
          onCycleCamera={handleCycleCamera}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={() => setShowMainMenu(true)}
          mode={gameMode}
        />
      )}

      {/* Penalty Shootout Tracker */}
      {!showMainMenu && gameMode === 'penalties' && (
        <PenaltyShootoutHUD
          round={penaltyRound}
          currentTurn={penaltyTurn}
          history={penaltyHistory}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />
      )}

      {/* Mobile Touch Virtual Analog Controls */}
      {!showMainMenu && (
        <MobileControls
          onMove={(x, z) => engineRef.current?.setMovementInput(x, z)}
          onSprint={(sprinting) => engineRef.current?.setSprintInput(sprinting)}
          onPassPress={() => engineRef.current?.handlePassPress()}
          onPassRelease={() => engineRef.current?.handlePassRelease()}
          onShootPress={() => engineRef.current?.handleShootPress()}
          onShootRelease={() => engineRef.current?.handleShootRelease()}
          onSwitch={() => engineRef.current?.switchActivePlayer()}
          hasBall={activePlayer?.hasBall || false}
          shootPower={shootPower}
        />
      )}

      {/* Main Menu Screen */}
      {showMainMenu && (
        <MainMenu
          onStartMatch={handleStartMatch}
          onOpenMultiplayer={() => setShowMultiplayerModal(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Match Over Modal */}
      {showMatchOverModal && (
        <MatchOverModal
          score={score}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          winner={matchWinner}
          onRematch={handleRematch}
          onReturnMenu={handleReturnMenu}
        />
      )}

      {/* Multiplayer Room Lobby Modal */}
      {showMultiplayerModal && (
        <MultiplayerModal
          onClose={() => setShowMultiplayerModal(false)}
          onStartMultiplayerMatch={handleStartMultiplayerMatch}
        />
      )}
    </div>
  );
};

