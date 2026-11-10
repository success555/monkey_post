export type LudoColor = 'red' | 'yellow' | 'green' | 'blue';

export type GameMode = 'vs_ai' | 'local_2p';

export interface TokenState {
  id: string;
  color: LudoColor;
  index: number; // 0 to 3 (4 tokens per player)
  step: number;  // -1 = In Yard, 0 = Start tile, 1..50 = Main circuit, 51..56 = Home Column, 57 = In House (Finished)
  isFinished: boolean;
}

export interface LudoGameState {
  currentTurn: LudoColor;
  diceValue: number | null;
  hasRolled: boolean;
  consecutiveSixes: number;
  bonusRoll: boolean;
  tokens: Record<LudoColor, TokenState[]>;
  winner: LudoColor | null;
  phase: 'roll_dice' | 'select_token' | 'animating' | 'game_over';
  lastAction: string;
  commentary: string;
}

export interface MoveEvaluation {
  tokenId: string;
  canMove: boolean;
  isOpeningYard: boolean;
  isCapture: boolean;
  isReachingHome: boolean;
  score: number; // AI evaluation weight
}

