export type BallType = 'cue' | 'red' | 'yellow' | 'green' | 'brown' | 'blue' | 'pink' | 'black';

export type GameMode = 'vs_ai' | 'local_2p';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface Ball {
  id: string;
  type: BallType;
  points: number;
  x: number;       // Position on table X (-3.8 to +3.8)
  y: number;       // Height (ball radius ~0.24)
  z: number;       // Position on table Z (-7.8 to +7.8)
  vx: number;      // Velocity X
  vz: number;      // Velocity Z
  isPotted: boolean;
  colorHex: number;
}

export interface Pocket {
  id: string;
  x: number;
  z: number;
  radius: number;
}

export interface SnookerGameState {
  p1Score: number;
  p2Score: number;
  currentBreak: number;
  currentTurn: 'p1' | 'p2';
  targetBallType: 'red' | 'color' | BallType;
  remainingReds: number;
  lastPotMessage: string;
  isFoul: boolean;
  foulReason: string;
  aimAngle: number;     // In radians (0 to 2*PI)
  shotPower: number;    // 0 to 1
  isBallsMoving: boolean;
  winner: 'p1' | 'p2' | null;
  commentary: string;
}

