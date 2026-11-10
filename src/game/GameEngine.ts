import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { Pitch } from './Pitch';
import { PlayerMesh } from './PlayerMesh';
import { BallMesh } from './BallMesh';
import { Environment } from './Environment';
import { PhysicsEngine } from './PhysicsEngine';
import { AIController } from './AIController';
import { soundFX } from '../audio/SoundFX';
import {
  PlayerState,
  BallState,
  TeamInfo,
  TeamSide,
  GameMode,
  MatchState,
  MatchScore,
  CameraMode
} from '../types/game';
import {
  PITCH_LENGTH,
  PITCH_WIDTH,
  GOAL_WIDTH,
  GOAL_HEIGHT,
  BALL_RADIUS,
  TEAMS,
  WARRI_COMMENTARY
} from './constants';
import { multiplayerService } from '../multiplayer/multiplayerService';

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  // Components
  private pitch: Pitch;
  private environment: Environment;
  private ballMesh: BallMesh;
  private playerMeshes: Map<string, PlayerMesh> = new Map();
  private physics: PhysicsEngine;
  private ai: AIController;

  // Game States
  public mode: GameMode = 'exhibition';
  public matchState: MatchState = 'menu';
  public score: MatchScore = { home: 0, away: 0 };
  public matchTimer: number = 300; // 5 min match in seconds
  public homeTeam: TeamInfo = TEAMS[0];
  public awayTeam: TeamInfo = TEAMS[1];

  // Active User Player
  private activePlayerId: string = 'home_1';
  private cameraMode: CameraMode['id'] = 'broadcast';

  // Input states
  private moveInput = { x: 0, z: 0 };
  private isSprintPressed = false;
  private passPressStartTime = 0;
  private isPassKeyDown = false;
  private shootPressStartTime = 0;
  private isShootKeyDown = false;
  public shootPower: number = 0; // 0.0 to 1.0 (for HUD gauge)

  // Penalty Shootout Mode Specifics
  public penaltyRound: number = 1;
  public penaltyTeamTurn: TeamSide = 'home';
  public penaltyScore = { home: 0, away: 0 };
  public penaltyHistory: { home: boolean[]; away: boolean[] } = { home: [], away: [] };

  // Callbacks for UI
  public onScoreUpdate?: (score: MatchScore) => void;
  public onTimerUpdate?: (secondsLeft: number) => void;
  public onCommentary?: (text: string, type: 'goal' | 'tackle' | 'miss' | 'skill' | 'nutmeg' | 'general') => void;
  public onMatchEnd?: (score: MatchScore, winner: string) => void;
  public onPowerChange?: (power: number) => void;

  // Animation Frame
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private resizeObserver: ResizeObserver | null = null;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7dd3fc); // Bright Lagos sunny blue sky
    this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.005);

    // 2. Camera setup: wider FOV so street environment & pitch are beautifully framed
    const width = container.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 800) || 800;
    const height = container.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 600) || 600;
    const aspect = (width > 0 && height > 0) ? width / height : 16 / 9;
    this.camera = new THREE.PerspectiveCamera(50, Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9, 0.5, 200);
    this.camera.position.set(-3.5, 15.5, 18.5);
    this.camera.lookAt(0, 0, -1);

    // 3. WebGL Renderer with Cinematic Film Tone Mapping & PBR Soft Shadows
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    container.appendChild(this.renderer.domElement);

    // 4. Initialize Core World
    this.physics = new PhysicsEngine();
    this.ai = new AIController(this.physics);
    this.environment = new Environment();
    this.scene.add(this.environment.group);

    this.pitch = new Pitch();
    this.scene.add(this.pitch.group);

    // Initial Ball State
    const initialBallState: BallState = {
      position: { x: 0, y: BALL_RADIUS, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      ownerId: null,
      lastTouchTeam: null,
      lastTouchPlayer: null
    };
    this.ballMesh = new BallMesh(initialBallState);
    this.scene.add(this.ballMesh.group);

    // Setup Goal and Commentary Callbacks
    this.physics.onGoalScored = (scoringTeam) => this.handleGoalScored(scoringTeam);
    this.physics.onCommentary = (text, type) => this.emitCommentary(text, type);

    // 5. Setup Listeners & Auto-Resize Observers
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('orientationchange', () => {
      this.onWindowResize();
      setTimeout(this.onWindowResize, 100);
      setTimeout(this.onWindowResize, 300);
    });

    if (typeof ResizeObserver !== 'undefined' && this.container) {
      this.resizeObserver = new ResizeObserver(() => {
        this.onWindowResize();
      });
      this.resizeObserver.observe(this.container);
    }

    this.setupDesktopInputs();

    // Initial resize pass on next microtask to sync with rendered DOM layout
    setTimeout(this.onWindowResize, 0);

    // Start Rendering Loop
    this.lastTime = performance.now();
    this.animate();
  }

  // Set up 10 street players (5v5)
  public initializePlayers(homeTeam: TeamInfo, awayTeam: TeamInfo) {
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;

    // Apply distinct playstyle team stats to physics engine
    this.physics.setTeamStats(homeTeam.stats, awayTeam.stats);

    // Clear existing
    this.playerMeshes.forEach(mesh => this.scene.remove(mesh.group));
    this.playerMeshes.clear();

    const roles: PlayerState['role'][] = ['striker', 'midfielder', 'winger_left', 'defender', 'winger_right'];
    const homeNames = ['OJU 10', 'OJU 8', 'OJU 7', 'OJU 5', 'OJU 9'];
    const awayNames = ['MIT 10', 'MIT 8', 'MIT 7', 'MIT 6', 'MIT 4'];
    const homeNumbers = [10, 8, 7, 5, 9];
    const awayNumbers = [10, 8, 7, 6, 4];

    // Tactical formation layouts matching uploaded screenshot
    // Home team (Ojuelegba) kicks off towards East (+X)
    const homeBasePositions = [
      { x: -0.2, z: 0 },     // No. 10 on the ball at center circle!
      { x: -4.0, z: 2.5 },   // No. 8 Midfielder
      { x: -7.5, z: -3.5 },  // No. 7 Left Winger
      { x: -6.5, z: 4.8 },   // No. 5 Defender
      { x: -4.5, z: -4.2 }   // No. 9 Right Mid
    ];

    // Away team (Mitchells Plain) defending West (-X)
    const awayBasePositions = [
      { x: 3.5, z: -1.2 },   // No. 10 Forward
      { x: 3.8, z: 1.8 },    // No. 8 Midfielder
      { x: 7.2, z: -3.8 },   // No. 7 Winger
      { x: 6.8, z: 2.6 },    // No. 6 Midfielder
      { x: 10.5, z: 0.2 }    // No. 4 Defender
    ];

    // Create 5 Home Players
    for (let i = 0; i < 5; i++) {
      const isUser = i === 0; // User starts as No. 10 with ball at center spot!
      const pState: PlayerState = {
        id: `home_${i + 1}`,
        name: homeNames[i],
        number: homeNumbers[i],
        team: 'home',
        isUserControlled: isUser,
        position: { x: homeBasePositions[i].x, y: 0, z: homeBasePositions[i].z },
        velocity: { x: 0, y: 0, z: 0 },
        rotation: Math.PI / 2, // Facing east toward Mitchells Plain
        hasBall: i === 0, // No. 10 starts on the ball
        stamina: 100,
        isSprinting: false,
        isTackling: false,
        isKicking: false,
        tackleCooldown: 0,
        role: roles[i],
        basePosition: homeBasePositions[i]
      };

      const pMesh = new PlayerMesh(pState, homeTeam);
      this.playerMeshes.set(pState.id, pMesh);
      this.scene.add(pMesh.group);

      if (isUser) {
        this.activePlayerId = pState.id;
        this.ballMesh.state.ownerId = pState.id;
        this.ballMesh.state.position.x = -0.1;
        this.ballMesh.state.position.z = 0;
      }
    }

    // Create 5 Away Players
    for (let i = 0; i < 5; i++) {
      const pState: PlayerState = {
        id: `away_${i + 1}`,
        name: awayNames[i],
        number: awayNumbers[i],
        team: 'away',
        isUserControlled: false,
        position: { x: awayBasePositions[i].x, y: 0, z: awayBasePositions[i].z },
        velocity: { x: 0, y: 0, z: 0 },
        rotation: -Math.PI / 2, // Facing west toward Ojuelegba
        hasBall: false,
        stamina: 100,
        isSprinting: false,
        isTackling: false,
        isKicking: false,
        tackleCooldown: 0,
        role: roles[i],
        basePosition: awayBasePositions[i]
      };

      const pMesh = new PlayerMesh(pState, awayTeam);
      this.playerMeshes.set(pState.id, pMesh);
      this.scene.add(pMesh.group);
    }
  }

  // Start a new match
  public startMatch(mode: GameMode, durationMinutes: number = 5) {
    this.mode = mode;
    this.matchState = 'playing';
    this.score = { home: 0, away: 0 };
    this.matchTimer = durationMinutes * 60;

    // Immediately sync viewport & projection matrices before kickoff
    this.onWindowResize();

    if (this.onScoreUpdate) this.onScoreUpdate(this.score);
    if (this.onTimerUpdate) this.onTimerUpdate(this.matchTimer);

    if (mode === 'penalties') {
      this.setupPenaltyShootoutRound();
    } else {
      this.resetKickoff('home');
    }

    soundFX.playWhistle(false);
    this.emitCommentary(
      WARRI_COMMENTARY.kickoff[Math.floor(Math.random() * WARRI_COMMENTARY.kickoff.length)],
      'general'
    );
  }

  // Reset positions for kickoff
  public resetKickoff(kickingTeam: TeamSide) {
    // Reset ball to center
    this.ballMesh.state.position = { x: 0, y: BALL_RADIUS, z: 0 };
    this.ballMesh.state.velocity = { x: 0, y: 0, z: 0 };
    this.ballMesh.state.ownerId = null;

    // Reset player positions
    this.playerMeshes.forEach((mesh) => {
      const p = mesh.state;
      p.position.x = p.basePosition.x;
      p.position.z = p.basePosition.z;
      p.velocity = { x: 0, y: 0, z: 0 };
      p.rotation = p.team === 'home' ? Math.PI / 2 : -Math.PI / 2;
      p.hasBall = false;
      p.stamina = 100;
    });

    // Give ball to the kicking team's striker at center spot
    const kickoffPlayerId = kickingTeam === 'home' ? 'home_1' : 'away_1';
    const kickoffPlayer = this.playerMeshes.get(kickoffPlayerId);
    if (kickoffPlayer) {
      kickoffPlayer.state.position.x = kickingTeam === 'home' ? -0.2 : 0.2;
      kickoffPlayer.state.position.z = 0;
      kickoffPlayer.state.hasBall = true;
      this.ballMesh.state.ownerId = kickoffPlayerId;
      this.ballMesh.state.position.x = kickoffPlayer.state.position.x;
      this.ballMesh.state.position.z = kickoffPlayer.state.position.z;

      if (kickingTeam === 'home') {
        this.switchActivePlayer(kickoffPlayerId);
      }
    }
  }

  // Handle Goal Scored
  private handleGoalScored(scoringTeam: TeamSide) {
    if (this.matchState !== 'playing' && this.mode !== 'penalties') return;

    if (this.mode === 'penalties') {
      this.handlePenaltyGoal(true);
      return;
    }

    // Update match score
    if (scoringTeam === 'home') {
      this.score.home++;
    } else {
      this.score.away++;
    }

    if (this.onScoreUpdate) this.onScoreUpdate(this.score);

    // Epic Naija Confetti blast!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: scoringTeam === 'home' ? ['#008751', '#ffffff', '#fbbf24'] : ['#e11d48', '#ffffff', '#38bdf8']
    });

    // Commentary celebration
    const phrase = WARRI_COMMENTARY.goals[Math.floor(Math.random() * WARRI_COMMENTARY.goals.length)];
    this.emitCommentary(phrase, 'goal');

    this.matchState = 'goal_scored';

    // Kickoff restart after 3 seconds
    setTimeout(() => {
      if (this.matchState === 'goal_scored') {
        const nextKickoffTeam = scoringTeam === 'home' ? 'away' : 'home';
        this.resetKickoff(nextKickoffTeam);
        this.matchState = 'playing';
        soundFX.playWhistle(true);
      }
    }, 2800);
  }

  // Penalty Shootout Setup
  private setupPenaltyShootoutRound() {
    this.matchState = 'penalty_round';
    const isHomeTurn = this.penaltyTeamTurn === 'home';
    const shooterGoalX = isHomeTurn ? PITCH_LENGTH / 2 : -PITCH_LENGTH / 2;
    const penaltySpotX = isHomeTurn ? 10.5 : -10.5;

    // Reset ball to penalty spot
    this.ballMesh.state.position = { x: penaltySpotX, y: BALL_RADIUS, z: 0 };
    this.ballMesh.state.velocity = { x: 0, y: 0, z: 0 };
    this.ballMesh.state.ownerId = null;

    // Hide other players away from penalty area
    this.playerMeshes.forEach(mesh => {
      mesh.group.position.set(0, -10, 0); // off-screen
    });

    // Setup 1 shooter
    const shooterId = isHomeTurn ? 'home_1' : 'away_1';
    const shooterMesh = this.playerMeshes.get(shooterId);
    if (shooterMesh) {
      shooterMesh.state.position.x = penaltySpotX + (isHomeTurn ? -1.2 : 1.2);
      shooterMesh.state.position.z = 0;
      shooterMesh.state.rotation = isHomeTurn ? Math.PI / 2 : -Math.PI / 2;
      shooterMesh.state.hasBall = true;
      shooterMesh.setUserControlled(isHomeTurn);
      this.activePlayerId = shooterId;
      this.ballMesh.state.ownerId = shooterId;
      shooterMesh.updateTransform();
    }

    // Setup 1 defender standing on the monkey post line
    const defenderId = isHomeTurn ? 'away_5' : 'home_5';
    const defenderMesh = this.playerMeshes.get(defenderId);
    if (defenderMesh) {
      defenderMesh.state.position.x = shooterGoalX + (isHomeTurn ? -0.4 : 0.4);
      defenderMesh.state.position.z = 0;
      defenderMesh.state.rotation = isHomeTurn ? -Math.PI / 2 : Math.PI / 2;
      defenderMesh.setUserControlled(false);
      defenderMesh.updateTransform();
    }

    this.emitCommentary(
      `Round ${this.penaltyRound}: ${isHomeTurn ? this.homeTeam.name : this.awayTeam.name} to take the penalty!`,
      'general'
    );
  }

  public handlePenaltyGoal(scored: boolean) {
    if (this.penaltyTeamTurn === 'home') {
      this.penaltyHistory.home.push(scored);
      if (scored) this.penaltyScore.home++;
      this.penaltyTeamTurn = 'away';
    } else {
      this.penaltyHistory.away.push(scored);
      if (scored) this.penaltyScore.away++;
      this.penaltyTeamTurn = 'home';
      this.penaltyRound++;
    }

    this.score = { ...this.penaltyScore };
    if (this.onScoreUpdate) this.onScoreUpdate(this.score);

    if (scored) {
      confetti({ particleCount: 50, spread: 60 });
      this.emitCommentary("GOAL! Penalty converted into monkey post!", 'goal');
    } else {
      this.emitCommentary("SAVED / MISSED! Tiny post stands tall!", 'miss');
    }

    // Check if shootout has ended (5 rounds or clear lead)
    if (this.penaltyRound > 5 && this.penaltyScore.home !== this.penaltyScore.away) {
      const winner = this.penaltyScore.home > this.penaltyScore.away ? this.homeTeam.name : this.awayTeam.name;
      this.matchState = 'fulltime';
      if (this.onMatchEnd) this.onMatchEnd(this.score, winner);
      return;
    }

    // Next kick
    setTimeout(() => {
      this.setupPenaltyShootoutRound();
    }, 2200);
  }

  // Switch human-controlled player
  public switchActivePlayer(targetId?: string) {
    if (targetId && this.playerMeshes.has(targetId)) {
      this.activePlayerId = targetId;
    } else {
      // Find closest home teammate to the ball
      let closestId = this.activePlayerId;
      let minDistance = 999;

      this.playerMeshes.forEach((mesh, id) => {
        if (mesh.state.team === 'home') {
          const dist = Math.hypot(
            mesh.state.position.x - this.ballMesh.state.position.x,
            mesh.state.position.z - this.ballMesh.state.position.z
          );
          if (dist < minDistance) {
            minDistance = dist;
            closestId = id;
          }
        }
      });

      this.activePlayerId = closestId;
    }

    // Update highlights
    this.playerMeshes.forEach((mesh, id) => {
      mesh.setUserControlled(id === this.activePlayerId);
    });
  }

  // Get active human player
  public getActivePlayer(): PlayerState | null {
    const mesh = this.playerMeshes.get(this.activePlayerId);
    return mesh ? mesh.state : null;
  }

  // Mobile / Joystick Vector Input (-1 to 1)
  public setMovementInput(x: number, z: number) {
    this.moveInput.x = x;
    this.moveInput.z = z;
  }

  public setSprintInput(sprinting: boolean) {
    this.isSprintPressed = sprinting;
  }

  // Pass Action (Press & Release)
  public handlePassPress() {
    this.passPressStartTime = performance.now();
    this.isPassKeyDown = true;
  }

  public handlePassRelease() {
    if (!this.isPassKeyDown) return;
    this.isPassKeyDown = false;
    const duration = (performance.now() - this.passPressStartTime) / 1000;
    const isLofted = duration > 0.35; // long press = through pass / lofted

    const activePlayer = this.getActivePlayer();
    if (!activePlayer || !activePlayer.hasBall) return;

    // Find best target teammate
    const teammates = Array.from(this.playerMeshes.values())
      .filter(m => m.state.team === 'home')
      .map(m => m.state);

    const target = this.ai.findBestPassTarget(activePlayer, teammates);
    const activeMesh = this.playerMeshes.get(activePlayer.id);
    if (activeMesh) activeMesh.triggerKick();

    this.physics.passBall(activePlayer, target, isLofted, this.ballMesh.state);

    // Auto-switch to pass recipient if target identified
    if (target) {
      setTimeout(() => {
        this.switchActivePlayer(target.id);
      }, 250);
    }
  }

  // Shoot Action (Press & Release with Power Meter)
  public handleShootPress() {
    const activePlayer = this.getActivePlayer();
    if (!activePlayer) return;

    if (!activePlayer.hasBall) {
      // If user doesn't have the ball, shoot button triggers a SLIDING TACKLE!
      const activeMesh = this.playerMeshes.get(activePlayer.id);
      if (activeMesh) activeMesh.triggerTackle();
      const allPlayers = Array.from(this.playerMeshes.values()).map(m => m.state);
      this.physics.executeTackle(activePlayer, this.ballMesh.state, allPlayers);
      return;
    }

    this.shootPressStartTime = performance.now();
    this.isShootKeyDown = true;
  }

  public handleShootRelease() {
    if (!this.isShootKeyDown) return;
    this.isShootKeyDown = false;
    const duration = (performance.now() - this.shootPressStartTime) / 1000;
    // Power scale (0.3 to 1.0) based on hold duration (max 1 second)
    const power = Math.min(1.0, 0.3 + duration * 0.7);
    this.shootPower = 0;
    if (this.onPowerChange) this.onPowerChange(0);

    const activePlayer = this.getActivePlayer();
    if (!activePlayer || !activePlayer.hasBall) return;

    const activeMesh = this.playerMeshes.get(activePlayer.id);
    if (activeMesh) activeMesh.triggerKick();

    this.physics.shootBall(activePlayer, power, this.ballMesh.state);

    if (this.mode === 'penalties') {
      // Check after shot whether it went in or wide
      setTimeout(() => {
        const goalX = PITCH_LENGTH / 2;
        const reached = this.ballMesh.state.position.x >= goalX;
        const inside = Math.abs(this.ballMesh.state.position.z) <= GOAL_WIDTH / 2 &&
                       this.ballMesh.state.position.y <= GOAL_HEIGHT;
        if (!reached || !inside) {
          this.handlePenaltyGoal(false);
        }
      }, 1500);
    }
  }

  // Camera Mode Toggle
  public setCameraMode(mode: CameraMode['id']) {
    this.cameraMode = mode;
  }

  public cycleCameraMode() {
    const modes: CameraMode['id'][] = ['broadcast', 'action', 'topdown'];
    const idx = modes.indexOf(this.cameraMode);
    this.cameraMode = modes[(idx + 1) % modes.length];
  }

  // Desktop Keyboard Bindings
  private keysPressed: Set<string> = new Set();
  private setupDesktopInputs() {
    window.addEventListener('keydown', (e) => {
      this.keysPressed.add(e.code);

      // Pass
      if (e.code === 'KeyJ' || e.code === 'Space') {
        if (!this.isPassKeyDown) this.handlePassPress();
      }

      // Shoot / Tackle
      if (e.code === 'KeyK') {
        if (!this.isShootKeyDown) this.handleShootPress();
      }

      // Switch Player
      if (e.code === 'KeyE' || e.code === 'KeyQ') {
        this.switchActivePlayer();
      }

      // Sprint
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.isSprintPressed = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed.delete(e.code);

      // Release Pass
      if (e.code === 'KeyJ' || e.code === 'Space') {
        this.handlePassRelease();
      }

      // Release Shoot
      if (e.code === 'KeyK') {
        this.handleShootRelease();
      }

      // Release Sprint
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.isSprintPressed = false;
      }
    });
  }

  private updateDesktopMovement() {
    let dx = 0;
    let dz = 0;

    if (this.keysPressed.has('KeyW') || this.keysPressed.has('ArrowUp')) dz -= 1;
    if (this.keysPressed.has('KeyS') || this.keysPressed.has('ArrowDown')) dz += 1;
    if (this.keysPressed.has('KeyA') || this.keysPressed.has('ArrowLeft')) dx -= 1;
    if (this.keysPressed.has('KeyD') || this.keysPressed.has('ArrowRight')) dx += 1;

    // Only override if desktop keys are active
    if (dx !== 0 || dz !== 0) {
      const len = Math.hypot(dx, dz);
      this.moveInput.x = dx / len;
      this.moveInput.z = dz / len;
    } else if (this.keysPressed.size === 0) {
      // If no keys pressed and not mobile touch
      // keep touch joystick input intact
    }
  }

  // Commentary Helper
  private emitCommentary(text: string, type: 'goal' | 'tackle' | 'miss' | 'skill' | 'nutmeg' | 'general') {
    if (this.onCommentary) {
      this.onCommentary(text, type);
    }
    soundFX.speakVoiceLine(text);
  }

  // Update loop
  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.05); // cap at 20fps step for physics stability
    this.lastTime = now;

    this.updateDesktopMovement();

    // Shoot power accumulation when holding button
    if (this.isShootKeyDown) {
      const elapsed = (now - this.shootPressStartTime) / 1000;
      this.shootPower = Math.min(1.0, elapsed / 0.8);
      if (this.onPowerChange) this.onPowerChange(this.shootPower);
    }

    // Match Timer Countdown
    if (this.matchState === 'playing' && this.mode === 'exhibition') {
      this.matchTimer -= delta;
      if (this.matchTimer <= 0) {
        this.matchTimer = 0;
        this.matchState = 'fulltime';
        soundFX.playWhistle(false);
        const winner = this.score.home > this.score.away
          ? this.homeTeam.name
          : this.score.away > this.score.home
          ? this.awayTeam.name
          : 'Draw';
        if (this.onMatchEnd) this.onMatchEnd(this.score, winner);
      }
      if (this.onTimerUpdate) this.onTimerUpdate(Math.ceil(this.matchTimer));
    }

    const allPlayers = Array.from(this.playerMeshes.values()).map(m => m.state);

    if (this.matchState === 'playing' || this.matchState === 'goal_scored' || this.mode === 'training') {
      // 1. Update Human Player
      const activePlayer = this.getActivePlayer();
      if (activePlayer) {
        this.physics.updatePlayer(
          activePlayer,
          this.moveInput,
          this.isSprintPressed,
          delta,
          allPlayers,
          this.ballMesh.state
        );
      }

      // 2. Update AI Players (4 teammates + 5 opponents)
      const aiPlayers = allPlayers.filter(p => !p.isUserControlled);
      this.ai.update(aiPlayers, allPlayers, this.ballMesh.state, delta);

      // 3. Update Ball Physics
      this.physics.updateBall(this.ballMesh.state, allPlayers, delta);

      // 4. Multiplayer synchronization
      if (this.mode === 'multiplayer') {
        multiplayerService.broadcastGameState(allPlayers, this.ballMesh.state, this.score);
      }
    }

    // 5. Update 3D Meshes & Animations
    this.playerMeshes.forEach(mesh => mesh.update(delta));
    this.ballMesh.update(delta);
    this.environment.update(delta);

    // 6. Camera Tracking
    this.updateCamera(delta);

    // 7. Render Scene
    this.renderer.render(this.scene, this.camera);
  };

  // Dynamic Camera Modes
  private updateCamera(delta: number) {
    const ballPos = this.ballMesh.state.position;
    const activePlayer = this.getActivePlayer();

    if (this.cameraMode === 'broadcast') {
      // Elevated 3/4 street broadcast view exactly matching reference screenshot
      const targetCamX = -3.5 + THREE.MathUtils.clamp(ballPos.x * 0.45, -8, 8);
      const targetCamY = 15.2;
      const targetCamZ = 17.8 + THREE.MathUtils.clamp(ballPos.z * 0.35, -4, 4);

      this.camera.position.x += (targetCamX - this.camera.position.x) * 4 * delta;
      this.camera.position.y += (targetCamY - this.camera.position.y) * 4 * delta;
      this.camera.position.z += (targetCamZ - this.camera.position.z) * 4 * delta;

      const lookTarget = new THREE.Vector3(
        THREE.MathUtils.clamp(ballPos.x * 0.55 + 0.5, -8, 8),
        0.2,
        THREE.MathUtils.clamp(ballPos.z * 0.35 - 1.8, -6, 2)
      );
      this.camera.lookAt(lookTarget);

    } else if (this.cameraMode === 'action' && activePlayer) {
      // Action Cam: Behind player looking toward target goal
      const forwardX = Math.sin(activePlayer.rotation);
      const forwardZ = Math.cos(activePlayer.rotation);

      const targetCamX = activePlayer.position.x - forwardX * 6.5;
      const targetCamZ = activePlayer.position.z - forwardZ * 6.5;
      const targetCamY = 4.2;

      this.camera.position.x += (targetCamX - this.camera.position.x) * 6 * delta;
      this.camera.position.y += (targetCamY - this.camera.position.y) * 6 * delta;
      this.camera.position.z += (targetCamZ - this.camera.position.z) * 6 * delta;

      const lookTarget = new THREE.Vector3(
        activePlayer.position.x + forwardX * 6,
        1.2,
        activePlayer.position.z + forwardZ * 6
      );
      this.camera.lookAt(lookTarget);

    } else if (this.cameraMode === 'topdown') {
      // Topdown Tactical Cam
      this.camera.position.set(0, 32, 0.1);
      this.camera.lookAt(0, 0, 0);
    }
  }

  public resize = () => {
    this.onWindowResize();
  };

  private onWindowResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 0);
    const height = this.container.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 0);
    if (width <= 0 || height <= 0 || !Number.isFinite(width) || !Number.isFinite(height)) return;
    const aspect = width / height;
    if (!Number.isFinite(aspect) || aspect <= 0) return;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public getAllPlayers(): PlayerState[] {
    return Array.from(this.playerMeshes.values()).map(m => m.state);
  }

  public getBallState(): BallState {
    return this.ballMesh.state;
  }

  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    window.removeEventListener('resize', this.onWindowResize);
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}

