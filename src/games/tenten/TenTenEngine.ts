import { FootChoice, AIDifficulty, GameMode, TenTenState } from './types';
import { tenTenSound } from './TenTenAudio';

export interface RoundResult {
  p1Foot: 'left' | 'right';
  p2Foot: 'left' | 'right';
  caller: 'p1' | 'p2';
  scored: boolean;
  scorer: 'p1' | 'p2' | null;
  newStreak: number;
  comboMessage: string;
}

export class TenTenEngine {
  public state: TenTenState;
  public mode: GameMode = 'vs_ai';
  public difficulty: AIDifficulty = 'medium';

  // Tempo / Rhythm settings (BPM)
  private bpm: number = 120;
  private timerId: number | null = null;
  private isRunning: boolean = false;

  // History for AI pattern recognition
  private playerHistory: ('left' | 'right')[] = [];

  // Callbacks
  public onTick?: (state: TenTenState) => void;
  public onRoundResolved?: (result: RoundResult) => void;
  public onGameOver?: (winner: 'p1' | 'p2') => void;

  constructor() {
    this.state = this.getInitialState();
    this.updateBpm();
  }

  public getInitialState(): TenTenState {
    return {
      p1Score: 0,
      p2Score: 0,
      targetScore: 10, // 10 points for authentic "TEN-TEN!"
      currentRound: 1,
      beat: 1,
      phase: 'waiting',
      p1Foot: null,
      p2Foot: null,
      caller: 'p1', // Player 1 starts as Caller
      roundWinner: null,
      streak: 0,
      comboText: '',
      commentary: "Ten-Ten, make we play! Get your feet ready on the beat.",
      winner: null
    };
  }

  public setMode(mode: GameMode) {
    this.mode = mode;
  }

  public setDifficulty(difficulty: AIDifficulty) {
    this.difficulty = difficulty;
    this.updateBpm();
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  private updateBpm() {
    switch (this.difficulty) {
      case 'easy':
        this.bpm = 96; // Relaxed reflex tempo
        break;
      case 'medium':
        this.bpm = 120; // Classic Lagos playground groove
        break;
      case 'hard':
        this.bpm = 146; // Blazing Afrobeat high-speed duel
        break;
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.state.phase = 'clapping';
    this.scheduleNextBeat();
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public reset() {
    this.stop();
    this.state = this.getInitialState();
    this.playerHistory = [];
    this.onTick?.(this.state);
  }

  // Player input for Foot Thrust
  public setPlayerFoot(player: 'p1' | 'p2', foot: 'left' | 'right') {
    if (player === 'p1') {
      this.state.p1Foot = foot;
    } else {
      this.state.p2Foot = foot;
    }
  }

  // Beat loop
  private scheduleNextBeat() {
    if (!this.isRunning) return;

    const beatIntervalMs = (60 / this.bpm) * 1000;

    this.timerId = window.setTimeout(() => {
      this.stepBeat();
      this.scheduleNextBeat();
    }, beatIntervalMs);
  }

  private stepBeat() {
    if (this.state.phase === 'game_over') {
      this.stop();
      return;
    }

    const currentBeat = this.state.beat;

    if (currentBeat === 1) {
      // Beat 1: Handclap 👏
      this.state.beat = 2;
      this.state.phase = 'clapping';
      this.state.p1Foot = null;
      this.state.p2Foot = null;
      this.state.roundWinner = null;
      tenTenSound.playClap();
      tenTenSound.playConga(false);
    } else if (currentBeat === 2) {
      // Beat 2: Handclap 👏
      this.state.beat = 3;
      this.state.phase = 'step_window';
      tenTenSound.playClap();
      tenTenSound.playConga(true);
      tenTenSound.playPreStep(); // "TEN!" prep cue
    } else if (currentBeat === 3) {
      // Beat 3: Prepare foot choice ("TEN!")
      this.state.beat = 4;
      this.state.phase = 'step_window';

      // If AI mode, AI prepares its foot now
      if (this.mode === 'vs_ai' && !this.state.p2Foot) {
        this.state.p2Foot = this.getAIFootChoice();
      }
    } else if (currentBeat === 4) {
      // Beat 4: STEP / REVEAL! ("TEN-TEN!")
      this.state.phase = 'evaluating';
      tenTenSound.playFootStomp();
      this.resolveRound();
      this.state.beat = 1;
    }

    this.onTick?.(this.state);
  }

  // AI Decision Logic based on difficulty
  private getAIFootChoice(): 'left' | 'right' {
    const isAiCaller = this.state.caller === 'p2';

    if (this.difficulty === 'easy') {
      // 70% random, predictable
      return Math.random() < 0.5 ? 'left' : 'right';
    }

    if (this.difficulty === 'medium') {
      // If AI is Caller: wants to AVOID player's predicted foot to score!
      // If AI is Defender: wants to MATCH player's foot to block!
      const lastPlayerMove = this.playerHistory[this.playerHistory.length - 1];
      if (lastPlayerMove && Math.random() < 0.6) {
        if (isAiCaller) {
          // Choose opposite to score
          return lastPlayerMove === 'left' ? 'right' : 'left';
        } else {
          // Choose same to block
          return lastPlayerMove;
        }
      }
      return Math.random() < 0.5 ? 'left' : 'right';
    }

    // HARD / GRANDMASTER: Adaptive Markov & Bias Analysis
    let predictedPlayerFoot: 'left' | 'right' = 'right';
    if (this.playerHistory.length >= 3) {
      const leftCount = this.playerHistory.filter(f => f === 'left').length;
      predictedPlayerFoot = leftCount >= this.playerHistory.length / 2 ? 'left' : 'right';

      // Check alternation pattern (L -> R -> L)
      const lastTwo = this.playerHistory.slice(-2);
      if (lastTwo[0] !== lastTwo[1]) {
        predictedPlayerFoot = lastTwo[1] === 'left' ? 'right' : 'left';
      }
    } else {
      predictedPlayerFoot = Math.random() < 0.5 ? 'left' : 'right';
    }

    if (isAiCaller) {
      // AI wants to score -> pick opposite of predicted player foot
      return predictedPlayerFoot === 'left' ? 'right' : 'left';
    } else {
      // AI wants to block -> pick exact predicted player foot!
      return predictedPlayerFoot;
    }
  }

  // Resolve Round on Beat 4 ("TEN-TEN!")
  private resolveRound() {
    // If player didn't pick in time, pick default
    const p1Foot: 'left' | 'right' = this.state.p1Foot || (Math.random() < 0.5 ? 'left' : 'right');
    const p2Foot: 'left' | 'right' = this.state.p2Foot || (Math.random() < 0.5 ? 'left' : 'right');

    this.state.p1Foot = p1Foot;
    this.state.p2Foot = p2Foot;

    // Record player choice in history for AI analysis
    this.playerHistory.push(p1Foot);
    if (this.playerHistory.length > 20) {
      this.playerHistory.shift();
    }

    const caller = this.state.caller;
    let scored = false;
    let scorer: 'p1' | 'p2' | null = null;
    let comboMessage = '';

    // Authentic Ten-Ten Rule:
    // If feet are DIFFERENT (e.g. Left vs Right): Caller SCORES!
    // If feet MATCH (Left vs Left, or Right vs Right): Defender BLOCKS and becomes new Caller!
    if (p1Foot !== p2Foot) {
      // Caller scores!
      scored = true;
      scorer = caller;
      if (caller === 'p1') {
        this.state.p1Score += 1;
        this.state.roundWinner = 'p1';
        this.state.streak += 1;
      } else {
        this.state.p2Score += 1;
        this.state.roundWinner = 'p2';
        this.state.streak += 1;
      }

      tenTenSound.playScore();

      if (this.state.streak >= 5) {
        comboMessage = "AFROBEAT LEGEND! 🔥 x5";
      } else if (this.state.streak >= 3) {
        comboMessage = "ZANKU LEGWORK! ⚡ x3";
      } else if (this.state.streak >= 2) {
        comboMessage = "DOUBLE STEP! ✨ x2";
      } else {
        comboMessage = "CLEAN SCORE! +1";
      }
    } else {
      // Defender blocked caller! Turn passes
      scored = false;
      this.state.roundWinner = 'block';
      this.state.streak = 0;
      comboMessage = "BLOCKED! FEET CLASHED!";
      tenTenSound.playBlock();

      // Caller switches to the other player!
      this.state.caller = caller === 'p1' ? 'p2' : 'p1';
    }

    this.state.comboText = comboMessage;
    this.state.currentRound += 1;

    // Check Win Condition (Target = 10)
    if (this.state.p1Score >= this.state.targetScore) {
      this.state.winner = 'p1';
      this.state.phase = 'game_over';
      this.stop();
      tenTenSound.playVictory();
      this.onGameOver?.('p1');
    } else if (this.state.p2Score >= this.state.targetScore) {
      this.state.winner = 'p2';
      this.state.phase = 'game_over';
      this.stop();
      tenTenSound.playVictory();
      this.onGameOver?.('p2');
    }

    const result: RoundResult = {
      p1Foot,
      p2Foot,
      caller,
      scored,
      scorer,
      newStreak: this.state.streak,
      comboMessage
    };

    this.onRoundResolved?.(result);
  }
}

