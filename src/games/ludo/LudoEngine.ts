import { LudoColor, TokenState, LudoGameState, MoveEvaluation } from './types';
import { COLOR_CIRCUIT_OFFSET, SAFE_CIRCUIT_TILES } from './LudoBoardCoords';

export class LudoEngine {
  public state: LudoGameState;
  public players: LudoColor[] = ['red', 'yellow']; // 2-Player: Red (South) vs Yellow (North)

  constructor() {
    this.state = this.getInitialState();
  }

  public getInitialState(): LudoGameState {
    const createTokens = (color: LudoColor): TokenState[] => [
      { id: `${color}_0`, color, index: 0, step: -1, isFinished: false },
      { id: `${color}_1`, color, index: 1, step: -1, isFinished: false },
      { id: `${color}_2`, color, index: 2, step: -1, isFinished: false },
      { id: `${color}_3`, color, index: 3, step: -1, isFinished: false }
    ];

    return {
      currentTurn: 'red',
      diceValue: null,
      hasRolled: false,
      consecutiveSixes: 0,
      bonusRoll: false,
      tokens: {
        red: createTokens('red'),
        yellow: createTokens('yellow'),
        green: createTokens('green'),
        blue: createTokens('blue')
      },
      winner: null,
      phase: 'roll_dice',
      lastAction: 'Game begins! Red rolls first.',
      commentary: "Welcome to Naija Ludo 3D! Shake the dice cup and throw six."
    };
  }

  public reset() {
    this.state = this.getInitialState();
  }

  /**
   * Convert token step into global 0..51 circuit index (-1 if in yard or home stretch)
   */
  public getGlobalCircuitIndex(color: LudoColor, step: number): number {
    if (step < 0 || step > 50) return -1;
    const offset = COLOR_CIRCUIT_OFFSET[color];
    return (step + offset) % 52;
  }

  /**
   * Roll Dice (1 to 6)
   */
  public rollDice(forcedVal?: number): { value: number; canAnyTokenMove: boolean; extraTurn: boolean } {
    if (this.state.phase !== 'roll_dice' || this.state.winner) {
      return { value: this.state.diceValue || 1, canAnyTokenMove: false, extraTurn: false };
    }

    const value = forcedVal || Math.floor(Math.random() * 6) + 1;
    this.state.diceValue = value;
    this.state.hasRolled = true;

    // Handle Consecutive Sixes rule
    if (value === 6) {
      this.state.consecutiveSixes += 1;
      if (this.state.consecutiveSixes >= 3) {
        // Penalty for 3 consecutive sixes in Naija rules!
        this.state.consecutiveSixes = 0;
        this.state.phase = 'roll_dice';
        this.state.hasRolled = false;
        this.passTurn();
        this.state.lastAction = 'Three 6s in a row! Penalty! Turn forfeited.';
        return { value, canAnyTokenMove: false, extraTurn: false };
      }
    } else {
      this.state.consecutiveSixes = 0;
    }

    const movableTokens = this.getMovableTokens(this.state.currentTurn, value);

    if (movableTokens.length === 0) {
      // No tokens can move!
      if (value === 6) {
        // Roll again on 6 even if cannot move
        this.state.phase = 'roll_dice';
        this.state.hasRolled = false;
        this.state.lastAction = `Rolled a 6! No moves possible, roll bonus again!`;
        return { value, canAnyTokenMove: false, extraTurn: true };
      } else {
        this.state.lastAction = `Rolled a ${value}. No moves possible! Turn passes.`;
        this.passTurn();
        return { value, canAnyTokenMove: false, extraTurn: false };
      }
    }

    // Tokens can move! Wait for token selection
    this.state.phase = 'select_token';
    this.state.lastAction = `Rolled a ${value}! Select a glowing token to move.`;
    return { value, canAnyTokenMove: true, extraTurn: value === 6 };
  }

  /**
   * Check if a specific token can legally move given the current dice value
   */
  public canTokenMove(token: TokenState, dice: number): boolean {
    if (token.isFinished) return false;

    // In Yard: Requires a 6 to open and step onto starting tile (step 0)
    if (token.step === -1) {
      return dice === 6;
    }

    // On Track: Cannot overshoot 57 (exact roll to enter house)
    const newStep = token.step + dice;
    return newStep <= 57;
  }

  /**
   * Get all movable tokens for a color
   */
  public getMovableTokens(color: LudoColor, dice: number): TokenState[] {
    return this.state.tokens[color].filter(t => this.canTokenMove(t, dice));
  }

  /**
   * Execute Move for a Token
   */
  public moveToken(tokenId: string): {
    success: boolean;
    choppedToken: TokenState | null;
    enteredHouse: boolean;
    bonusRoll: boolean;
    isGameOver: boolean;
  } {
    const dice = this.state.diceValue;
    if (!dice || this.state.phase !== 'select_token') {
      return { success: false, choppedToken: null, enteredHouse: false, bonusRoll: false, isGameOver: false };
    }

    const color = this.state.currentTurn;
    const token = this.state.tokens[color].find(t => t.id === tokenId);
    if (!token || !this.canTokenMove(token, dice)) {
      return { success: false, choppedToken: null, enteredHouse: false, bonusRoll: false, isGameOver: false };
    }

    let choppedToken: TokenState | null = null;
    let enteredHouse = false;
    let bonusRoll = dice === 6;

    // 1. If opening from yard:
    if (token.step === -1) {
      token.step = 0;
      this.state.lastAction = `${color.toUpperCase()} token came out of the yard!`;
    } else {
      // 2. Advancing along track:
      token.step += dice;

      // 3. Check House (step 57)
      if (token.step === 57) {
        token.isFinished = true;
        enteredHouse = true;
        bonusRoll = true; // Extra roll reward for entering house!
        this.state.lastAction = `${color.toUpperCase()} token reached HOUSE! 🎉`;
      }
    }

    // 4. Check Capture / Chopping ("Kpafuka!") on main circuit (steps 0 to 50)
    if (token.step >= 0 && token.step <= 50) {
      const globalTile = this.getGlobalCircuitIndex(color, token.step);

      // Only vulnerable if NOT on a safe tile
      if (!SAFE_CIRCUIT_TILES.includes(globalTile)) {
        // Check opponent tokens on same global tile
        const opponentColor = color === 'red' ? 'yellow' : 'red';
        const opponentTokens = this.state.tokens[opponentColor];

        const target = opponentTokens.find(op => {
          if (op.step < 0 || op.step > 50) return false;
          return this.getGlobalCircuitIndex(opponentColor, op.step) === globalTile;
        });

        if (target) {
          // CHOP! Send opponent token back to yard!
          target.step = -1;
          choppedToken = target;
          bonusRoll = true; // Extra roll reward for chopping!
          this.state.lastAction = `KPAFUKA! ${color.toUpperCase()} chopped ${opponentColor.toUpperCase()}'s token!`;
        }
      }
    }

    // 5. Check Game Over (e.g. 4 tokens in house)
    const finishedCount = this.state.tokens[color].filter(t => t.isFinished).length;
    let isGameOver = false;

    if (finishedCount >= 4) {
      isGameOver = true;
      this.state.winner = color;
      this.state.phase = 'game_over';
      this.state.lastAction = `${color.toUpperCase()} HAS WON THE MATCH! LUDO KING! 👑`;
      return { success: true, choppedToken, enteredHouse, bonusRoll, isGameOver: true };
    }

    // 6. Next Turn handling
    this.state.bonusRoll = bonusRoll;
    if (bonusRoll) {
      this.state.phase = 'roll_dice';
      this.state.hasRolled = false;
      this.state.diceValue = null;
    } else {
      this.passTurn();
    }

    return { success: true, choppedToken, enteredHouse, bonusRoll, isGameOver: false };
  }

  /**
   * Pass turn to next player
   */
  public passTurn() {
    const nextColor: LudoColor = this.state.currentTurn === 'red' ? 'yellow' : 'red';
    this.state.currentTurn = nextColor;
    this.state.phase = 'roll_dice';
    this.state.hasRolled = false;
    this.state.diceValue = null;
    this.state.consecutiveSixes = 0;
    this.state.bonusRoll = false;
  }

  /**
   * Smart AI Token Evaluation (Bros Emeka - Naija Ludo King)
   */
  public getBestAIMove(): string | null {
    const dice = this.state.diceValue;
    if (!dice) return null;

    const color = this.state.currentTurn;
    const movable = this.getMovableTokens(color, dice);
    if (movable.length === 0) return null;
    if (movable.length === 1) return movable[0].id;

    const opponentColor = color === 'red' ? 'yellow' : 'red';
    const opponentTokens = this.state.tokens[opponentColor];

    // Evaluate each movable token
    let bestToken = movable[0];
    let highestScore = -Infinity;

    movable.forEach(t => {
      let score = 0;

      // 1. Bringing token out of yard on 6
      if (t.step === -1 && dice === 6) {
        score += 70;
      }

      // 2. Entering House (step 57)
      if (t.step + dice === 57) {
        score += 100;
      }

      // 3. Chopping opponent ("Kpafuka!")
      const newStep = t.step + dice;
      if (newStep >= 0 && newStep <= 50) {
        const nextGlobal = this.getGlobalCircuitIndex(color, newStep);
        if (!SAFE_CIRCUIT_TILES.includes(nextGlobal)) {
          const chopOpportunity = opponentTokens.some(op => {
            if (op.step < 0 || op.step > 50) return false;
            return this.getGlobalCircuitIndex(opponentColor, op.step) === nextGlobal;
          });
          if (chopOpportunity) {
            score += 150; // Highest priority!
          }
        }
      }

      // 4. Entering Safe Home Column
      if (t.step <= 50 && newStep >= 51) {
        score += 60;
      }

      // 5. Landing on a safe star tile
      if (newStep >= 0 && newStep <= 50) {
        const nextGlobal = this.getGlobalCircuitIndex(color, newStep);
        if (SAFE_CIRCUIT_TILES.includes(nextGlobal)) {
          score += 40;
        }
      }

      // 6. Moving farthest advanced token
      score += t.step * 0.5;

      if (score > highestScore) {
        highestScore = score;
        bestToken = t;
      }
    });

    return bestToken.id;
  }
}

