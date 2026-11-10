import { Ball, BallType, GameMode, AIDifficulty, SnookerGameState } from './types';
import { SnookerPhysics, BALL_RADIUS, POCKETS } from './SnookerPhysics';

export const COLOR_SPOTS: Record<string, { x: number; z: number; colorHex: number; points: number }> = {
  yellow: { x: 1.4, z: 4.8, colorHex: 0xfacc15, points: 2 },
  green: { x: -1.4, z: 4.8, colorHex: 0x16a34a, points: 3 },
  brown: { x: 0.0, z: 4.8, colorHex: 0x92400e, points: 4 },
  blue: { x: 0.0, z: 0.0, colorHex: 0x2563eb, points: 5 },
  pink: { x: 0.0, z: -3.8, colorHex: 0xec4899, points: 6 },
  black: { x: 0.0, z: -6.6, colorHex: 0x18181b, points: 7 }
};

export const COLOR_CLEARANCE_ORDER: BallType[] = ['yellow', 'green', 'brown', 'blue', 'pink', 'black'];

export class SnookerEngine {
  public physics: SnookerPhysics;
  public state: SnookerGameState;
  public mode: GameMode = 'vs_ai';
  public aiDifficulty: AIDifficulty = 'medium';

  // Tracking shot dynamics
  private firstHitBall: Ball | null = null;
  private pottedThisTurn: Ball[] = [];
  private isTurnProcessing = false;
  private onStateChange?: (state: SnookerGameState) => void;

  constructor(mode: GameMode = 'vs_ai', difficulty: AIDifficulty = 'medium') {
    this.mode = mode;
    this.aiDifficulty = difficulty;

    const initialBalls = this.createInitialRack();
    this.physics = new SnookerPhysics(initialBalls);

    this.state = {
      p1Score: 0,
      p2Score: 0,
      currentBreak: 0,
      currentTurn: 'p1',
      targetBallType: 'red',
      remainingReds: 15,
      lastPotMessage: 'Game started! Oya strike cue ball!',
      isFoul: false,
      foulReason: '',
      aimAngle: -Math.PI / 2, // Aiming towards pink/red rack
      shotPower: 0.55,
      isBallsMoving: false,
      winner: null,
      commentary: 'Welcome to Naija 3D Snooker! Chalk your cue!'
    };

    // Attach physics collision hooks
    this.physics.onBallClack = () => {
      // Record first ball contacted by cue ball
    };
  }

  public setOnStateChange(cb: (state: SnookerGameState) => void) {
    this.onStateChange = cb;
  }

  private notify() {
    this.onStateChange?.({ ...this.state });
  }

  // Create full official 22-ball Snooker rack
  public createInitialRack(): Ball[] {
    const balls: Ball[] = [];

    // 1. Cue Ball in the "D"
    balls.push({
      id: 'cue',
      type: 'cue',
      points: 0,
      x: 0.0,
      y: BALL_RADIUS,
      z: 5.5,
      vx: 0,
      vz: 0,
      isPotted: false,
      colorHex: 0xf8fafc // glossy ivorine white
    });

    // 2. Colored Balls on their respective Baize spots
    for (const [key, spot] of Object.entries(COLOR_SPOTS)) {
      balls.push({
        id: key,
        type: key as BallType,
        points: spot.points,
        x: spot.x,
        y: BALL_RADIUS,
        z: spot.z,
        vx: 0,
        vz: 0,
        isPotted: false,
        colorHex: spot.colorHex
      });
    }

    // 3. 15 Red Balls in classic triangular rack
    // Apex sits right behind the Pink ball (pink at z = -3.8)
    const apexZ = -4.3;
    const r = BALL_RADIUS;
    const dy = r * 1.732; // row spacing (sqrt(3) * r)
    let redIndex = 1;

    for (let row = 0; row < 5; row++) {
      const zRow = apexZ - row * dy;
      const count = row + 1;
      const startX = -((count - 1) * r);

      for (let col = 0; col < count; col++) {
        const xPos = startX + col * (2 * r);
        balls.push({
          id: `red_${redIndex++}`,
          type: 'red',
          points: 1,
          x: xPos,
          y: BALL_RADIUS,
          z: zRow,
          vx: 0,
          vz: 0,
          isPotted: false,
          colorHex: 0xdc2626 // vibrant red resin
        });
      }
    }

    return balls;
  }

  public getCueBall(): Ball {
    return this.physics.balls.find(b => b.type === 'cue')!;
  }

  public getBall(id: string): Ball | undefined {
    return this.physics.balls.find(b => b.id === id);
  }

  // Shoot the cue ball
  public executeShot(angle: number, power: number): boolean {
    if (this.state.isBallsMoving || this.state.winner) return false;

    const cueBall = this.getCueBall();
    if (cueBall.isPotted) {
      this.respotCueBall();
    }

    // Clear turn tracking variables
    this.firstHitBall = null;
    this.pottedThisTurn = [];
    this.isTurnProcessing = true;

    // Impulse magnitude based on power slider
    const speed = 0.12 + power * 0.48;
    cueBall.vx = Math.cos(angle) * speed;
    cueBall.vz = Math.sin(angle) * speed;

    this.state.aimAngle = angle;
    this.state.shotPower = power;
    this.state.isBallsMoving = true;
    this.state.isFoul = false;
    this.state.foulReason = '';

    this.notify();
    return true;
  }

  // Physics frame update
  public update(delta: number) {
    if (!this.state.isBallsMoving) return;

    const events = this.physics.update(delta);

    // Track first contact with cue ball
    if (!this.firstHitBall) {
      for (const col of events.ballCollisions) {
        if (col.b1.type === 'cue') {
          this.firstHitBall = col.b2;
          break;
        } else if (col.b2.type === 'cue') {
          this.firstHitBall = col.b1;
          break;
        }
      }
    }

    // Track potted balls
    for (const potted of events.pottedBalls) {
      this.pottedThisTurn.push(potted);
    }

    // Check if movement completed
    const stillMoving = this.physics.isMoving();
    if (!stillMoving && this.isTurnProcessing) {
      this.physics.stopAll();
      this.state.isBallsMoving = false;
      this.isTurnProcessing = false;
      this.resolveTurnOutcome();
    }
  }

  // Resolve score, fouls, respots, and turn progression
  private resolveTurnOutcome() {
    const cueBall = this.getCueBall();
    const isCuePotted = cueBall.isPotted;
    const remainingReds = this.physics.balls.filter(b => b.type === 'red' && !b.isPotted).length;
    this.state.remainingReds = remainingReds;

    let isFoul = false;
    let foulPoints = 4; // minimum penalty
    let foulMessage = '';

    // 1. Foul: Cue ball pocketed ("in-off")
    if (isCuePotted) {
      isFoul = true;
      foulMessage = 'In-Off! Cue ball potted into pocket!';
      foulPoints = Math.max(4, this.getFoulValue(this.firstHitBall));
    }
    // 2. Foul: No ball hit at all ("Miss")
    else if (!this.firstHitBall) {
      isFoul = true;
      foulMessage = 'Miss! Cue ball failed to hit any target!';
    }
    // 3. Foul: Hit wrong ball first
    else {
      const target = this.state.targetBallType;
      if (target === 'red' && this.firstHitBall.type !== 'red') {
        isFoul = true;
        foulMessage = `Foul! Hit ${this.firstHitBall.type.toUpperCase()} when Red was on!`;
        foulPoints = Math.max(4, this.firstHitBall.points);
      } else if (target === 'color' && this.firstHitBall.type === 'red') {
        isFoul = true;
        foulMessage = 'Foul! Hit Red when Color was nominated!';
      } else if (target !== 'red' && target !== 'color' && this.firstHitBall.type !== target) {
        isFoul = true;
        foulMessage = `Foul! Must hit ${target.toUpperCase()} in clearance order!`;
        foulPoints = Math.max(4, this.firstHitBall.points);
      }
    }

    // 4. Check illegally potted balls
    if (!isFoul && this.pottedThisTurn.length > 0) {
      for (const b of this.pottedThisTurn) {
        if (b.type === 'cue') continue;

        if (this.state.targetBallType === 'red' && b.type !== 'red') {
          isFoul = true;
          foulPoints = Math.max(foulPoints, b.points);
          foulMessage = `Foul! Potted ${b.type.toUpperCase()} when Red was on!`;
        } else if (this.state.targetBallType !== 'red' && this.state.targetBallType !== 'color' && b.type !== this.state.targetBallType) {
          isFoul = true;
          foulPoints = Math.max(foulPoints, b.points);
          foulMessage = `Foul! Potted ${b.type.toUpperCase()} out of clearance sequence!`;
        }
      }
    }

    // --- APPLY FOUL OR LEGAL POTS ---
    if (isFoul) {
      this.state.isFoul = true;
      this.state.foulReason = foulMessage;
      this.state.lastPotMessage = foulMessage;

      // Award penalty points to opponent
      if (this.state.currentTurn === 'p1') {
        this.state.p2Score += foulPoints;
      } else {
        this.state.p1Score += foulPoints;
      }

      // Reset break
      this.state.currentBreak = 0;

      // Respot potted colors
      for (const b of this.pottedThisTurn) {
        if (b.type !== 'red' && b.type !== 'cue') {
          this.respotColor(b);
        }
      }

      // If cue ball was potted, return to the "D"
      if (isCuePotted) {
        this.respotCueBall();
      }

      // Switch turn
      this.switchTurn();
      this.state.targetBallType = remainingReds > 0 ? 'red' : this.getNextClearanceColor();
      this.state.commentary = `Foul called! ${foulPoints} points awarded to opponent.`;
    } else {
      // LEGAL SHOT
      const legalPots = this.pottedThisTurn.filter(b => b.type !== 'cue');

      if (legalPots.length > 0) {
        // Calculate points gained in this pot
        let potPoints = 0;
        let potDescription = '';

        for (const b of legalPots) {
          potPoints += b.points;
          potDescription += `${b.type.toUpperCase()} (${b.points}pt) `;
        }

        if (this.state.currentTurn === 'p1') {
          this.state.p1Score += potPoints;
        } else {
          this.state.p2Score += potPoints;
        }
        this.state.currentBreak += potPoints;
        this.state.lastPotMessage = `Potted: ${potDescription}! Break: ${this.state.currentBreak}`;
        this.state.commentary = `Sweet strike! +${potPoints} pts! Break is now ${this.state.currentBreak}!`;

        // Update target ball sequence
        if (remainingReds > 0) {
          if (this.state.targetBallType === 'red') {
            // Next target is ANY color
            this.state.targetBallType = 'color';
          } else {
            // Potted a color, respot it and return target to red
            for (const b of legalPots) {
              if (b.type !== 'red') {
                this.respotColor(b);
              }
            }
            this.state.targetBallType = 'red';
          }
        } else {
          // In clearance phase: colors do NOT respot
          this.state.targetBallType = this.getNextClearanceColor();
        }

        // Check if table is fully cleared
        if (this.isTableCleared()) {
          this.finishFrame();
        }
      } else {
        // Safe shot or missed pot without foul
        this.state.currentBreak = 0;
        this.state.lastPotMessage = 'No ball potted. Turn passed.';
        this.state.commentary = 'No pot! Safety exchange!';
        this.switchTurn();
        this.state.targetBallType = remainingReds > 0 ? 'red' : this.getNextClearanceColor();
      }
    }

    this.notify();

    // Trigger AI shot if it is AI's turn
    if (this.mode === 'vs_ai' && this.state.currentTurn === 'p2' && !this.state.winner) {
      setTimeout(() => this.triggerAIShot(), 850);
    }
  }

  private switchTurn() {
    this.state.currentTurn = this.state.currentTurn === 'p1' ? 'p2' : 'p1';
  }

  private getFoulValue(ball: Ball | null): number {
    if (!ball) return 4;
    return Math.max(4, ball.points);
  }

  // Respot a color ball back to its home spot (or nearest available spot)
  public respotColor(ball: Ball) {
    const spot = COLOR_SPOTS[ball.type];
    if (!spot) return;

    ball.isPotted = false;
    ball.x = spot.x;
    ball.y = BALL_RADIUS;
    ball.z = spot.z;
    ball.vx = 0;
    ball.vz = 0;

    // Check if spot is blocked by another ball; if so, find clear offset
    for (const other of this.physics.balls) {
      if (other.id !== ball.id && !other.isPotted) {
        const distSq = (other.x - ball.x) ** 2 + (other.z - ball.z) ** 2;
        if (distSq < (BALL_RADIUS * 2.2) ** 2) {
          ball.z -= BALL_RADIUS * 2.5; // nudge forward towards baize
        }
      }
    }
  }

  // Respot cue ball in "D"
  public respotCueBall() {
    const cue = this.getCueBall();
    cue.isPotted = false;
    cue.x = 0.0;
    cue.y = BALL_RADIUS;
    cue.z = 5.2;
    cue.vx = 0;
    cue.vz = 0;
  }

  // Next color in clearance order
  private getNextClearanceColor(): BallType {
    for (const c of COLOR_CLEARANCE_ORDER) {
      const ball = this.physics.balls.find(b => b.type === c);
      if (ball && !ball.isPotted) {
        return c;
      }
    }
    return 'black';
  }

  // Check if all balls are potted
  private isTableCleared(): boolean {
    const active = this.physics.balls.filter(b => b.type !== 'cue' && !b.isPotted);
    return active.length === 0;
  }

  private finishFrame() {
    if (this.state.p1Score > this.state.p2Score) {
      this.state.winner = 'p1';
    } else if (this.state.p2Score > this.state.p1Score) {
      this.state.winner = 'p2';
    } else {
      this.state.winner = 'p1'; // Sudden death default
    }
    this.state.commentary = `FRAME OVER! Winner: ${this.state.winner === 'p1' ? 'Player 1' : 'Alhaji Snooker'}!`;
  }

  // AI Opponent Shot Solver ("Alhaji Snooker")
  public triggerAIShot() {
    if (this.state.winner || this.state.isBallsMoving) return;

    const cue = this.getCueBall();
    if (cue.isPotted) this.respotCueBall();

    // Determine legal target balls
    let validTargets: Ball[] = [];
    if (this.state.targetBallType === 'red') {
      validTargets = this.physics.balls.filter(b => b.type === 'red' && !b.isPotted);
    } else if (this.state.targetBallType === 'color') {
      validTargets = this.physics.balls.filter(b => b.type !== 'red' && b.type !== 'cue' && !b.isPotted);
    } else {
      validTargets = this.physics.balls.filter(b => b.type === this.state.targetBallType && !b.isPotted);
    }

    if (validTargets.length === 0) {
      validTargets = this.physics.balls.filter(b => b.type !== 'cue' && !b.isPotted);
    }

    if (validTargets.length === 0) return;

    // Find best target ball and pocket pairing
    let bestScore = -9999;
    let bestAimAngle = 0;
    let bestPower = 0.5;

    for (const target of validTargets) {
      for (const pocket of POCKETS) {
        // Vector from target to pocket
        const tpX = pocket.x - target.x;
        const tpZ = pocket.z - target.z;
        const distTP = Math.sqrt(tpX * tpX + tpZ * tpZ);
        if (distTP < 0.001) continue;

        const dirTPX = tpX / distTP;
        const dirTPZ = tpZ / distTP;

        // "Ghost ball" position where cue ball must make contact
        const ghostX = target.x - dirTPX * (BALL_RADIUS * 2);
        const ghostZ = target.z - dirTPZ * (BALL_RADIUS * 2);

        // Vector from cue to ghost ball
        const cgX = ghostX - cue.x;
        const cgZ = ghostZ - cue.z;
        const distCG = Math.sqrt(cgX * cgX + cgZ * cgZ);
        if (distCG < 0.001) continue;

        const dirCGX = cgX / distCG;
        const dirCGZ = cgZ / distCG;

        // Dot product between cue-to-ghost direction and target-to-pocket direction
        const cutAngleCos = dirCGX * dirTPX + dirCGZ * dirTPZ;

        // Only consider shots where cut angle is forward (> 0.25)
        if (cutAngleCos > 0.25) {
          // Score formula: high cut angle alignment, short distance to pocket, short distance to cue
          const candidateScore = cutAngleCos * 100 - distTP * 6 - distCG * 3 + target.points * 4;

          if (candidateScore > bestScore) {
            bestScore = candidateScore;
            bestAimAngle = Math.atan2(cgZ, cgX);
            bestPower = Math.min(0.85, Math.max(0.35, (distCG + distTP) * 0.055 + 0.3));
          }
        }
      }
    }

    // Fallback if no clean cut was found: aim directly at closest target
    if (bestScore === -9999) {
      const nearest = validTargets[0];
      const dx = nearest.x - cue.x;
      const dz = nearest.z - cue.z;
      bestAimAngle = Math.atan2(dz, dx);
      bestPower = 0.45;
    }

    // Apply difficulty noise
    let noise = 0;
    if (this.aiDifficulty === 'easy') {
      noise = (Math.random() - 0.5) * 0.12; // +/- 3.5 degrees
    } else if (this.aiDifficulty === 'medium') {
      noise = (Math.random() - 0.5) * 0.045; // +/- 1.3 degrees
    } else {
      noise = (Math.random() - 0.5) * 0.012; // tournament laser precision
    }

    const finalAngle = bestAimAngle + noise;
    const finalPower = bestPower;

    this.state.aimAngle = finalAngle;
    this.state.shotPower = finalPower;
    this.notify();

    setTimeout(() => {
      this.executeShot(finalAngle, finalPower);
    }, 450);
  }

  // Reset entire match
  public resetMatch() {
    const balls = this.createInitialRack();
    this.physics.setBalls(balls);

    this.state = {
      p1Score: 0,
      p2Score: 0,
      currentBreak: 0,
      currentTurn: 'p1',
      targetBallType: 'red',
      remainingReds: 15,
      lastPotMessage: 'New match started! Break the reds!',
      isFoul: false,
      foulReason: '',
      aimAngle: -Math.PI / 2,
      shotPower: 0.55,
      isBallsMoving: false,
      winner: null,
      commentary: 'Fresh table! Green baize ready. Take your break shot!'
    };

    this.notify();
  }
}
