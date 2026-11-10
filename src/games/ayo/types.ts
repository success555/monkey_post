export type Player = 1 | 2; // 1 = South (Human/Player 1), 2 = North (AI / Player 2)

export type AIDifficulty = 'easy' | 'medium' | 'master';

export type GameMode = 'vs_ai' | 'local_2p';

export interface PitState {
  index: number; // 0 to 11
  seeds: number;
  player: Player; // 0-5 = Player 1, 6-11 = Player 2
}

export interface AyoGameState {
  board: number[]; // 12 elements (indices 0-5 = Player 1, indices 6-11 = Player 2)
  captured: {
    1: number;
    2: number;
  };
  currentTurn: Player;
  isGameOver: boolean;
  winner: Player | 'draw' | null;
  lastMove: {
    player: Player;
    pitIndex: number;
    seedsCaptured: number;
  } | null;
  consecutiveCaptures: number[];
}

export interface MoveResult {
  valid: boolean;
  reason?: string;
  sowPath: number[];
  capturedPits: { pitIndex: number; count: number }[];
  totalCaptured: number;
  nextTurn: Player;
  isGameOver: boolean;
  winner: Player | 'draw' | null;
}
