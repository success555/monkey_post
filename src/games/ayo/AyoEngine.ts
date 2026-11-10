import { Player, AyoGameState, MoveResult, AIDifficulty } from './types';

export class AyoEngine {
  public state: AyoGameState;

  constructor() {
    this.state = this.getInitialState();
  }

  public getInitialState(): AyoGameState {
    return {
      board: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4], // 12 pits with 4 seeds each (48 total)
      captured: { 1: 0, 2: 0 },
      currentTurn: 1,
      isGameOver: false,
      winner: null,
      lastMove: null,
      consecutiveCaptures: []
    };
  }

  public reset() {
    this.state = this.getInitialState();
  }

  /**
   * Pits owned by Player:
   * Player 1: pits 0, 1, 2, 3, 4, 5 (South row)
   * Player 2: pits 6, 7, 8, 9, 10, 11 (North row)
   */
  public isPlayerPit(pitIndex: number, player: Player): boolean {
    return player === 1 ? pitIndex >= 0 && pitIndex <= 5 : pitIndex >= 6 && pitIndex <= 11;
  }

  public getOpponent(player: Player): Player {
    return player === 1 ? 2 : 1;
  }

  public getOpponentPits(player: Player): number[] {
    return player === 1 ? [6, 7, 8, 9, 10, 11] : [0, 1, 2, 3, 4, 5];
  }

  public getPlayerPits(player: Player): number[] {
    return player === 1 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11];
  }

  /**
   * Count total seeds remaining on a player's side
   */
  public countSeedsOnSide(player: Player, board: number[] = this.state.board): number {
    const pits = this.getPlayerPits(player);
    return pits.reduce((sum, idx) => sum + board[idx], 0);
  }

  /**
   * Check if a move feeds an opponent who currently has 0 seeds
   */
  public moveFeedsOpponent(pitIndex: number, player: Player, board: number[] = this.state.board): boolean {
    const seeds = board[pitIndex];
    let curr = pitIndex;
    let sowedSeeds = seeds;
    while (sowedSeeds > 0) {
      curr = (curr + 1) % 12;
      if (curr === pitIndex) continue; // Skip starting pit on 12+ seed laps
      if (this.isPlayerPit(curr, this.getOpponent(player))) {
        return true;
      }
      sowedSeeds--;
    }
    return false;
  }

  /**
   * Get all legal moves for current player
   */
  public getLegalMoves(player: Player = this.state.currentTurn, board: number[] = this.state.board): number[] {
    const pits = this.getPlayerPits(player);
    const opponent = this.getOpponent(player);
    const opponentSeeds = this.countSeedsOnSide(opponent, board);

    // Rule: If opponent has 0 seeds, the player MUST make a move that feeds them if possible
    if (opponentSeeds === 0) {
      const feedingMoves = pits.filter(p => board[p] > 0 && this.moveFeedsOpponent(p, player, board));
      if (feedingMoves.length > 0) {
        return feedingMoves;
      }
    }

    // Normal: Any pit on player's side with > 0 seeds
    return pits.filter(p => board[p] > 0);
  }

  /**
   * Execute a move from pitIndex
   */
  public makeMove(pitIndex: number): MoveResult {
    const player = this.state.currentTurn;
    const opponent = this.getOpponent(player);

    if (this.state.isGameOver) {
      return {
        valid: false,
        reason: 'Game is already over',
        sowPath: [],
        capturedPits: [],
        totalCaptured: 0,
        nextTurn: player,
        isGameOver: true,
        winner: this.state.winner
      };
    }

    if (!this.isPlayerPit(pitIndex, player)) {
      return {
        valid: false,
        reason: 'Not your pit',
        sowPath: [],
        capturedPits: [],
        totalCaptured: 0,
        nextTurn: player,
        isGameOver: false,
        winner: null
      };
    }

    const legalMoves = this.getLegalMoves(player, this.state.board);
    if (!legalMoves.includes(pitIndex)) {
      return {
        valid: false,
        reason: 'Illegal move (must feed starving opponent)',
        sowPath: [],
        capturedPits: [],
        totalCaptured: 0,
        nextTurn: player,
        isGameOver: false,
        winner: null
      };
    }

    // 1. Pick up seeds from selected pit
    const board = [...this.state.board];
    let seeds = board[pitIndex];
    board[pitIndex] = 0;

    // 2. Sow counter-clockwise one by one
    const sowPath: number[] = [];
    let curr = pitIndex;
    const originPit = pitIndex;

    while (seeds > 0) {
      curr = (curr + 1) % 12;
      // 12-seed skip rule: do not sow back into starting pit if looping around
      if (curr === originPit) {
        continue;
      }
      board[curr]++;
      sowPath.push(curr);
      seeds--;
    }

    // 3. Evaluate Captures
    const capturedPits: { pitIndex: number; count: number }[] = [];
    let totalCaptured = 0;

    // Captures only occur if last seed landed on opponent's side and holds 2 or 3 seeds
    const lastPit = curr;
    if (this.isPlayerPit(lastPit, opponent) && (board[lastPit] === 2 || board[lastPit] === 3)) {
      // Collect chain captures backward counter-clockwise
      const tempCaptured: { pitIndex: number; count: number }[] = [];
      let checkPit = lastPit;

      while (this.isPlayerPit(checkPit, opponent) && (board[checkPit] === 2 || board[checkPit] === 3)) {
        tempCaptured.push({ pitIndex: checkPit, count: board[checkPit] });
        checkPit = (checkPit - 1 + 12) % 12;
      }

      // Check Grand Slam / Starvation rule (Odu):
      // If capturing all these pits would leave opponent with 0 seeds on their entire side,
      // the capture is invalid under traditional rules to keep game playable!
      const totalOpponentSeeds = this.countSeedsOnSide(opponent, board);
      const captureSum = tempCaptured.reduce((s, c) => s + c.count, 0);

      if (captureSum >= totalOpponentSeeds) {
        // Grand slam: cannot take all seeds! Captures are nullified.
      } else {
        // Execute capture
        tempCaptured.forEach(c => {
          board[c.pitIndex] = 0;
          totalCaptured += c.count;
          capturedPits.push(c);
        });
      }
    }

    // Update state
    this.state.board = board;
    this.state.captured[player] += totalCaptured;
    this.state.lastMove = {
      player,
      pitIndex,
      seedsCaptured: totalCaptured
    };

    // Check Win Condition (25+ seeds = immediate majority win out of 48)
    let isGameOver = false;
    let winner: Player | 'draw' | null = null;

    if (this.state.captured[1] >= 25) {
      isGameOver = true;
      winner = 1;
    } else if (this.state.captured[2] >= 25) {
      isGameOver = true;
      winner = 2;
    } else if (this.state.captured[1] === 24 && this.state.captured[2] === 24) {
      isGameOver = true;
      winner = 'draw';
    } else {
      // Check if next player can make a legal move
      const nextPlayerMoves = this.getLegalMoves(opponent, board);
      if (nextPlayerMoves.length === 0) {
        // Opponent has no moves left! Game ends, remaining seeds go to player with seeds
        isGameOver = true;
        const p1Seeds = this.countSeedsOnSide(1, board);
        const p2Seeds = this.countSeedsOnSide(2, board);
        this.state.captured[1] += p1Seeds;
        this.state.captured[2] += p2Seeds;
        // Zero board
        this.state.board = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        if (this.state.captured[1] > this.state.captured[2]) winner = 1;
        else if (this.state.captured[2] > this.state.captured[1]) winner = 2;
        else winner = 'draw';
      }
    }

    const nextTurn = isGameOver ? player : opponent;
    this.state.currentTurn = nextTurn;
    this.state.isGameOver = isGameOver;
    this.state.winner = winner;

    return {
      valid: true,
      sowPath,
      capturedPits,
      totalCaptured,
      nextTurn,
      isGameOver,
      winner
    };
  }

  // --- SMART AI OPPONENT (ELDER BAALE OF YORUBALAND) ---
  public getBestAIMove(difficulty: AIDifficulty = 'master'): number {
    const legalMoves = this.getLegalMoves(2, this.state.board);
    if (legalMoves.length === 0) return 6;
    if (legalMoves.length === 1) return legalMoves[0];

    if (difficulty === 'easy') {
      // 50% random, 50% simple direct capture
      if (Math.random() > 0.5) {
        return legalMoves[Math.floor(Math.random() * legalMoves.length)];
      }
    }

    if (difficulty === 'medium') {
      // Find move with immediate highest capture
      let bestMove = legalMoves[0];
      let maxCap = -1;
      for (const move of legalMoves) {
        const simulated = this.simulateMove(this.state.board, move, 2);
        if (simulated.captured > maxCap) {
          maxCap = simulated.captured;
          bestMove = move;
        }
      }
      return bestMove;
    }

    // MASTER / GRANDMASTER: Minimax with Alpha-Beta Pruning (Depth 4)
    let bestScore = -Infinity;
    let chosenMove = legalMoves[0];

    for (const move of legalMoves) {
      const simulated = this.simulateMove(this.state.board, move, 2);
      const score = this.minimax(simulated.board, 3, false, -Infinity, Infinity);
      if (score > bestScore) {
        bestScore = score;
        chosenMove = move;
      }
    }

    return chosenMove;
  }

  // Fast pure board simulator for AI lookahead
  private simulateMove(boardIn: number[], pitIndex: number, player: Player): { board: number[]; captured: number } {
    const board = [...boardIn];
    let seeds = board[pitIndex];
    board[pitIndex] = 0;
    let curr = pitIndex;
    const opponent = player === 1 ? 2 : 1;

    while (seeds > 0) {
      curr = (curr + 1) % 12;
      if (curr === pitIndex) continue;
      board[curr]++;
      seeds--;
    }

    let captured = 0;
    if (this.isPlayerPit(curr, opponent) && (board[curr] === 2 || board[curr] === 3)) {
      let check = curr;
      const capturedList: { idx: number; count: number }[] = [];
      while (this.isPlayerPit(check, opponent) && (board[check] === 2 || board[check] === 3)) {
        capturedList.push({ idx: check, count: board[check] });
        check = (check - 1 + 12) % 12;
      }
      const oppTotal = this.countSeedsOnSide(opponent, board);
      const capSum = capturedList.reduce((s, c) => s + c.count, 0);
      if (capSum < oppTotal) {
        capturedList.forEach(c => {
          board[c.idx] = 0;
          captured += c.count;
        });
      }
    }

    return { board, captured };
  }

  // Minimax evaluation function
  private evaluateBoard(board: number[]): number {
    const aiSeeds = this.countSeedsOnSide(2, board);
    const p1Seeds = this.countSeedsOnSide(1, board);

    // Count vulnerable pits on own side (pits with 1 or 2 seeds that opponent could capture)
    let aiVulnerable = 0;
    for (let i = 6; i <= 11; i++) {
      if (board[i] === 1 || board[i] === 2) aiVulnerable++;
    }

    let p1Vulnerable = 0;
    for (let i = 0; i <= 5; i++) {
      if (board[i] === 1 || board[i] === 2) p1Vulnerable++;
    }

    return (aiSeeds - p1Seeds) * 2 + (p1Vulnerable * 3) - (aiVulnerable * 3);
  }

  private minimax(board: number[], depth: number, isMaximizing: boolean, alpha: number, beta: number): number {
    if (depth === 0) {
      return this.evaluateBoard(board);
    }

    const player: Player = isMaximizing ? 2 : 1;
    const legalMoves = this.getLegalMoves(player, board);
    if (legalMoves.length === 0) {
      return isMaximizing ? -500 : 500;
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of legalMoves) {
        const sim = this.simulateMove(board, move, 2);
        const evalScore = sim.captured * 12 + this.minimax(sim.board, depth - 1, false, alpha, beta);
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break; // Beta cut-off
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of legalMoves) {
        const sim = this.simulateMove(board, move, 1);
        const evalScore = -sim.captured * 12 + this.minimax(sim.board, depth - 1, true, alpha, beta);
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break; // Alpha cut-off
      }
      return minEval;
    }
  }
}

