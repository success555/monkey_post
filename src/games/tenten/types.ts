export type FootChoice = 'left' | 'right' | null;

export type GameMode = 'vs_ai' | 'local_2p';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type RoundPhase = 'waiting' | 'clapping' | 'step_window' | 'evaluating' | 'game_over';

export interface TenTenState {
  p1Score: number;
  p2Score: number;
  targetScore: number; // 10 points for authentic "TEN-TEN!"
  currentRound: number;
  beat: 1 | 2 | 3 | 4; // 1: Clap, 2: Clap, 3: Jump/Ten!, 4: STEP!
  phase: RoundPhase;
  p1Foot: FootChoice;
  p2Foot: FootChoice;
  caller: 'p1' | 'p2'; // Who is the attacker trying to score
  roundWinner: 'p1' | 'p2' | 'block' | null;
  streak: number;
  comboText: string;
  commentary: string;
  winner: 'p1' | 'p2' | null;
}

