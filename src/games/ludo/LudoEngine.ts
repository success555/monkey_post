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
      diceValues: null,
      diceSum: null,
      isDoubles: false,
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
      lastAction: 'Game begins! Red rolls first with 2 dice.',
      commentary: "Welcome to Naija Ludo 3D! Shake the two dice and roll six to open!"
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
   * Roll Two 3D Dice (each 1 to 6)
   */
  public rollTwoDice(forced?: [number, number]): {
    dice: [number, number];
    sum: number;
    canAnyTokenMove: boolean;
    extraTurn: boolean;
    hasSix: boolean;
  } {
    if (this.state.phase !== 'roll_dice' || this.state.winner) {
      const fallback: [number, number] = this.state.diceValues || [1, 1];
      return {
        dice: fallback,
        sum: fallback[0] + fallback[1],
        canAnyTokenMove: false,
        extraTurn: false,
        hasSix: false
      };
    }

    const d1 = forced ? forced[0] : Math.floor(Math.random() * 6) + 1;
    const d2 = forced ? forced[1] : Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;
    const hasSix = (d1 === 6 || d2 === 6);
    const isDoubles = (d1 === d2);

    this.state.diceValues = [d1, d2];
    this.state.diceSum = sum;
    this.state.diceValue = sum;
    this.state.isDoubles = isDoubles;
    this.state.hasRolled = true;

    // Handle 3 consecutive doubles/sixes penalty
    if (isDoubles || hasSix) {
      this.state.consecutiveSixes += 1;
      if (this.state.consecutiveSixes >= 3) {
        this.state.consecutiveSixes = 0;
        this.state.phase = 'roll_dice';
        this.state.hasRolled = false;
        this.state.bonusRoll = false;
        this.passTurn();
        this.state.lastAction = 'Three doubles/sixes in a row! Penalty! Turn forfeited.';
        return { dice: [d1, d2], sum, canAnyTokenMove: false, extraTurn: false, hasSix };
      }
    } else {
      this.state.consecutiveSixes = 0;
    }

    // Determine extra bonus roll for doubles or double six in Nigerian rules
    const extraTurn = isDoubles || (d1 === 6 && d2 === 6);
    this.state.bonusRoll = extraTurn;

    const movableTokens = this.getMovableTokens(this.state.currentTurn, [d1, d2]);

    if (movableTokens.length === 0) {
      if (extraTurn) {
        this.state.phase = 'roll_dice';
        this.state.hasRolled = false;
        this.state.lastAction = `Rolled [${d1}, ${d2}] Double! No moves possible, roll bonus again!`;
        return { dice: [d1, d2], sum, canAnyTokenMove: false, extraTurn: true, hasSix };
      } else {
        this.state.lastAction = `Rolled [${d1}, ${d2}]. No moves possible! Turn passes.`;
        this.passTurn();
        return { dice: [d1, d2], sum, canAnyTokenMove: false, extraTurn: false, hasSix };
      }
    }

    // Tokens can move! Wait for token selection
    this.state.phase = 'select_token';
    this.state.lastAction = `Rolled [${d1}, ${d2}] (Total ${sum})! Tap a glowing token to move.`;
    return { dice: [d1, d2], sum, canAnyTokenMove: true, extraTurn, hasSix };
  }

  // Backwards compatibility single roll delegator
  public rollDice(forcedVal?: number): { value: number; canAnyTokenMove: boolean; extraTurn: boolean } {
    const forced: [number, number] | undefined = forcedVal ? [forcedVal, Math.floor(Math.random() * 6) + 1] : undefined;
    const res = this.rollTwoDice(forced);
    return { value: res.sum, canAnyTokenMove: res.canAnyTokenMove, extraTurn: res.extraTurn };
  }

  /**
   * Find all tokens belonging to player that can make a legal move with given dice
   */
  public getMovableTokens(color: LudoColor, dice: [number, number] | number): TokenState[] {
    const d1 = Array.isArray(dice) ? dice[0] : dice;
    const d2 = Array.isArray(dice) ? dice[1] : 0;
    const sum = Array.isArray(dice) ? d1 + d2 : d1;
    const hasSix = (d1 === 6 || d2 === 6);

    const tokens = this.state.tokens[color];
    const movable: TokenState[] = [];

    for (const t of tokens) {
      if (t.isFinished) continue;

      // In yard: can open if either die is 6
      if (t.step === -1) {
        if (hasSix) {
          movable.push(t);
        }
        continue;
      }

      // On circuit / home stretch: check if can advance by sum or single die without overshooting 57
      if (t.step + sum <= 57) {
        movable.push(t);
      } else if (t.step + d1 <= 57 || (d2 > 0 && t.step + d2 <= 57)) {
        movable.push(t);
      }
    }

    return movable;
  }

  /**
   * Move a token according to rolled dice values
   */
  public moveToken(tokenId: string): {
    success: boolean;
    capturedToken: TokenState | null;
    isHome: boolean;
    extraTurn: boolean;
  } {
    if (this.state.phase !== 'select_token' || !this.state.diceValues) {
      return { success: false, capturedToken: null, isHome: false, extraTurn: false };
    }

    const [d1, d2] = this.state.diceValues;
    const sum = d1 + d2;
    const hasSix = (d1 === 6 || d2 === 6);

    // Find token
    let targetToken: TokenState | null = null;
    for (const color of this.players) {
      const found = this.state.tokens[color].find(t => t.id === tokenId);
      if (found) {
        targetToken = found;
        break;
      }
    }

    if (!targetToken || targetToken.color !== this.state.currentTurn || targetToken.isFinished) {
      return { success: false, capturedToken: null, isHome: false, extraTurn: false };
    }

    let extraTurnAwarded = this.state.bonusRoll;
    let captured: TokenState | null = null;

    // CASE 1: Opening from Yard
    if (targetToken.step === -1) {
      if (!hasSix) {
        return { success: false, capturedToken: null, isHome: false, extraTurn: false };
      }

      // Yard pawn opens onto Start tile (step 0)
      // And advances by the non-six die (if one is 6 and the other is > 0)
      const advanceDie = (d1 === 6 ? d2 : d1);
      // In Nigerian rules: 6 opens pawn, advanceDie moves it along track!
      const initialStep = advanceDie > 0 && advanceDie <= 6 ? advanceDie : 0;
      targetToken.step = initialStep;

      this.state.lastAction = `${targetToken.color.toUpperCase()} pawn opens yard onto track (${initialStep} steps)!`;
      this.state.commentary = `Yard don open! Oya, safe trip for track!`;
    }
    // CASE 2: Moving on track or home stretch
    else {
      let moveSteps = sum;
      if (targetToken.step + sum > 57) {
        // Fallback to smaller single die if sum overshoots
        if (targetToken.step + d1 <= 57) {
          moveSteps = d1;
        } else if (targetToken.step + d2 <= 57) {
          moveSteps = d2;
        } else {
          return { success: false, capturedToken: null, isHome: false, extraTurn: false };
        }
      }

      targetToken.step += moveSteps;

      if (targetToken.step === 57) {
        targetToken.isFinished = true;
        extraTurnAwarded = true; // Bonus roll for getting a pawn home!
        this.state.lastAction = `${targetToken.color.toUpperCase()} pawn reached Home! Bonus roll awarded!`;
        this.state.commentary = `Goal! Pawn safely inside house!`;
      } else {
        this.state.lastAction = `${targetToken.color.toUpperCase()} pawn moved ${moveSteps} steps.`;
      }
    }

    // Check Kpafuka Chop Capture (only on main circuit steps 0..50)
    if (targetToken.step >= 0 && targetToken.step <= 50) {
      const myGlobalIndex = this.getGlobalCircuitIndex(targetToken.color, targetToken.step);
      const isSafe = SAFE_CIRCUIT_TILES.includes(myGlobalIndex);

      if (!isSafe) {
        // Look for opponent tokens occupying this exact global tile
        for (const otherColor of this.players) {
          if (otherColor === targetToken.color) continue;

          for (const oppToken of this.state.tokens[otherColor]) {
            if (oppToken.step >= 0 && oppToken.step <= 50) {
              const oppGlobal = this.getGlobalCircuitIndex(otherColor, oppToken.step);
              if (oppGlobal === myGlobalIndex) {
                // KPAFUKA CHOP! Opponent sent back to yard
                oppToken.step = -1;
                captured = oppToken;
                extraTurnAwarded = true; // Chop gives immediate extra roll!
                this.state.lastAction = `KPAFUKA! ${targetToken.color.toUpperCase()} chopped ${otherColor.toUpperCase()}! Back to yard!`;
                this.state.commentary = `Chop chop! Bros don kpafuka opponent pawn! Bonus roll!`;
                break;
              }
            }
          }
          if (captured) break;
        }
      }
    }

    // Check Win Condition: all 4 tokens finished
    const allFinished = this.state.tokens[targetToken.color].every(t => t.isFinished);
    if (allFinished) {
      this.state.winner = targetToken.color;
      this.state.phase = 'game_over';
      this.state.lastAction = `${targetToken.color.toUpperCase()} WINS THE MATCH!`;
      this.state.commentary = `VICTORY! ${targetToken.color === 'red' ? 'Player 1' : 'Bros Emeka'} is the Naija Ludo King!`;
      return {
        success: true,
        capturedToken: captured,
        isHome: targetToken.isFinished,
        extraTurn: false
      };
    }

    // Next turn or extra bonus roll
    if (extraTurnAwarded) {
      this.state.phase = 'roll_dice';
      this.state.hasRolled = false;
      this.state.bonusRoll = false;
    } else {
      this.passTurn();
    }

    return {
      success: true,
      capturedToken: captured,
      isHome: targetToken.isFinished,
      extraTurn: extraTurnAwarded
    };
  }

  public passTurn() {
    this.state.currentTurn = this.state.currentTurn === 'red' ? 'yellow' : 'red';
    this.state.diceValue = null;
    this.state.diceValues = null;
    this.state.diceSum = null;
    this.state.isDoubles = false;
    this.state.hasRolled = false;
    this.state.bonusRoll = false;
    this.state.phase = 'roll_dice';
  }

  /**
   * AI Decision Engine ("Bros Emeka"): picks the smartest token to move
   */
  public getBestAIMove(color: LudoColor): string | null {
    if (!this.state.diceValues) return null;
    const movable = this.getMovableTokens(color, this.state.diceValues);
    if (movable.length === 0) return null;
    if (movable.length === 1) return movable[0].id;

    const [d1, d2] = this.state.diceValues;
    const sum = d1 + d2;
    const opponentColor: LudoColor = color === 'red' ? 'yellow' : 'red';

    let bestToken = movable[0];
    let bestScore = -999;

    for (const t of movable) {
      let score = 0;

      // 1. Prioritize opening yard pawn if rolled 6
      if (t.step === -1) {
        score += 85;
      }

      // 2. Prioritize scoring a pawn home
      if (t.step + sum === 57) {
        score += 150;
      }

      // 3. Prioritize captures (Kpafuka chop)
      const nextStep = t.step + sum;
      if (nextStep >= 0 && nextStep <= 50) {
        const nextGlobal = this.getGlobalCircuitIndex(color, nextStep);
        if (!SAFE_CIRCUIT_TILES.includes(nextGlobal)) {
          for (const opp of this.state.tokens[opponentColor]) {
            if (opp.step >= 0 && opp.step <= 50) {
              const oppGlobal = this.getGlobalCircuitIndex(opponentColor, opp.step);
              if (oppGlobal === nextGlobal) {
                score += 120; // Massive reward for chop!
              }
            }
          }
        } else {
          score += 35; // Safe star tile bonus
        }
      }

      // 4. Progress along track
      score += t.step * 2;

      if (score > bestScore) {
        bestScore = score;
        bestToken = t;
      }
    }

    return bestToken.id;
  }
}
