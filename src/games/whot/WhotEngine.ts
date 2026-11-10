import { WhotCard, WhotSuit, WhotGameState, PlayCardResult } from './types';
import { WhotDeck } from './WhotDeck';

export class WhotEngine {
  public state: WhotGameState;

  constructor() {
    this.state = this.getInitialState();
  }

  public getInitialState(): WhotGameState {
    const fullDeck = WhotDeck.createDeck();

    // Deal 5 cards each (Standard Naija rule)
    const playerHand: WhotCard[] = fullDeck.splice(0, 5);
    const aiHand: WhotCard[] = fullDeck.splice(0, 5);

    // Initial discard pile: Find first card that is not a 20 (Whot)
    let firstCardIndex = fullDeck.findIndex(c => c.number !== 20);
    if (firstCardIndex === -1) firstCardIndex = 0;
    const [firstCard] = fullDeck.splice(firstCardIndex, 1);

    const discardPile: WhotCard[] = [firstCard];
    const marketDeck: WhotCard[] = fullDeck;

    return {
      marketDeck,
      discardPile,
      playerHand,
      aiHand,
      currentTurn: 'player',
      demandedSuit: null,
      pendingPenalty: 0,
      penaltyType: null,
      isGameOver: false,
      winner: null,
      playerCalledLastCard: false,
      aiCalledLastCard: false,
      lastPlayedCard: firstCard,
      actionMessage: `Match begins with ${firstCard.number} of ${firstCard.suit.toUpperCase()}`,
      commentary: "First to check up wins! May the sharpest card master prevail."
    };
  }

  public reset() {
    this.state = this.getInitialState();
  }

  public getTopDiscard(): WhotCard {
    return this.state.discardPile[this.state.discardPile.length - 1];
  }

  /**
   * Check if market needs reshuffle from discard pile
   */
  private ensureMarketCards(neededCount = 1) {
    if (this.state.marketDeck.length >= neededCount) return;

    if (this.state.discardPile.length <= 1) return;

    // Keep top card on discard pile, shuffle the rest back into market
    const topCard = this.state.discardPile.pop()!;
    const cardsToRecycle = [...this.state.discardPile];
    this.state.discardPile = [topCard];

    this.state.marketDeck = [...this.state.marketDeck, ...WhotDeck.shuffle(cardsToRecycle)];
  }

  /**
   * Draw cards from market
   */
  public drawFromMarket(count = 1): WhotCard[] {
    this.ensureMarketCards(count);
    const drawn: WhotCard[] = [];
    for (let i = 0; i < count; i++) {
      if (this.state.marketDeck.length > 0) {
        drawn.push(this.state.marketDeck.pop()!);
      }
    }
    return drawn;
  }

  /**
   * Check if a specific card can be legally played
   */
  public canPlayCard(card: WhotCard): boolean {
    if (this.state.isGameOver) return false;

    // 1. If pending penalty (Pick 2 or Pick 3), player must defend with same card number or take penalty
    if (this.state.pendingPenalty > 0) {
      if (this.state.penaltyType === 'pick_two' && card.number === 2) return true;
      if (this.state.penaltyType === 'pick_three' && card.number === 5) return true;
      return false;
    }

    // 2. WHOT 20 is always wild and can be played on any card
    if (card.number === 20) return true;

    // 3. If a suit was demanded by a previous Whot 20
    if (this.state.demandedSuit) {
      return card.suit === this.state.demandedSuit;
    }

    // 4. Normal play: Must match suit OR number
    const topCard = this.getTopDiscard();
    return card.suit === topCard.suit || card.number === topCard.number;
  }

  /**
   * Get all legal cards in a hand
   */
  public getPlayableCards(hand: WhotCard[]): WhotCard[] {
    return hand.filter(c => this.canPlayCard(c));
  }

  /**
   * Player or AI plays a card
   */
  public playCard(cardId: string, chosenWhotSuit?: WhotSuit): PlayCardResult {
    const isPlayer = this.state.currentTurn === 'player';
    const hand = isPlayer ? this.state.playerHand : this.state.aiHand;
    const cardIndex = hand.findIndex(c => c.id === cardId);

    if (cardIndex === -1) {
      return {
        valid: false,
        reason: 'Card not in hand',
        specialAction: 'normal',
        nextTurn: this.state.currentTurn,
        isCheckUp: false
      };
    }

    const card = hand[cardIndex];
    if (!this.canPlayCard(card)) {
      return {
        valid: false,
        reason: 'Illegal card play',
        specialAction: 'normal',
        nextTurn: this.state.currentTurn,
        isCheckUp: false
      };
    }

    // Remove card from hand and push to discard pile
    hand.splice(cardIndex, 1);
    this.state.discardPile.push(card);
    this.state.lastPlayedCard = card;

    const specialAction = WhotDeck.getSpecialAction(card.number);
    let nextTurn: 'player' | 'ai' = isPlayer ? 'ai' : 'player';
    let actionMessage = `${isPlayer ? 'You' : 'Bros Chidi'} played ${card.number} of ${card.suit.toUpperCase()}`;

    // Clear previous demanded suit if non-whot played
    if (card.number !== 20) {
      this.state.demandedSuit = null;
    }

    // --- APPLY SPECIAL CARD ACTIONS ---
    switch (specialAction) {
      case 'hold_on': // 1: Same player plays again!
        nextTurn = this.state.currentTurn;
        actionMessage = `${isPlayer ? 'You' : 'Bros Chidi'} called HOLD ON! Play again!`;
        break;

      case 'pick_two': // 2: Next player must pick 2 (stacks!)
        this.state.pendingPenalty += 2;
        this.state.penaltyType = 'pick_two';
        actionMessage = `PICK TWO! (+${this.state.pendingPenalty} cards penalty stacked)`;
        break;

      case 'pick_three': // 5: Next player must pick 3 (stacks!)
        this.state.pendingPenalty += 3;
        this.state.penaltyType = 'pick_three';
        actionMessage = `PICK THREE! (+${this.state.pendingPenalty} cards penalty stacked)`;
        break;

      case 'suspension': // 8: Next player is suspended (same player goes again in 2-player)
        nextTurn = this.state.currentTurn;
        actionMessage = `SUSPENSION! ${isPlayer ? 'Bros Chidi' : 'You'} are suspended!`;
        break;

      case 'general_market': // 14: All other players draw 1 card from market
        {
          const targetHand = isPlayer ? this.state.aiHand : this.state.playerHand;
          const drawn = this.drawFromMarket(1);
          targetHand.push(...drawn);
          actionMessage = `GENERAL MARKET! ${isPlayer ? 'Bros Chidi' : 'You'} drew 1 card!`;
        }
        break;

      case 'whot': // 20: Wild card, demand suit
        if (chosenWhotSuit) {
          this.state.demandedSuit = chosenWhotSuit;
          actionMessage = `WHOT! Demanded: ${chosenWhotSuit.toUpperCase()}`;
        }
        break;

      default:
        break;
    }

    // Check for Last Card
    if (hand.length === 1) {
      if (isPlayer) {
        this.state.playerCalledLastCard = true;
      } else {
        this.state.aiCalledLastCard = true;
      }
    } else {
      if (isPlayer) this.state.playerCalledLastCard = false;
      else this.state.aiCalledLastCard = false;
    }

    // Check for CHECK-UP (Winning condition)
    let isCheckUp = false;
    if (hand.length === 0) {
      isCheckUp = true;
      this.state.isGameOver = true;
      this.state.winner = isPlayer ? 'player' : 'ai';
      actionMessage = `CHECK UP! ${isPlayer ? 'You win the match!' : 'Bros Chidi wins the match!'}`;
    }

    this.state.currentTurn = isCheckUp ? this.state.currentTurn : nextTurn;
    this.state.actionMessage = actionMessage;

    return {
      valid: true,
      specialAction,
      nextTurn: this.state.currentTurn,
      isCheckUp
    };
  }

  /**
   * Player or AI goes to market (draws card)
   */
  public goToMarket(): { cardsDrawn: WhotCard[]; penaltyCleared: boolean } {
    const isPlayer = this.state.currentTurn === 'player';
    const hand = isPlayer ? this.state.playerHand : this.state.aiHand;

    // Check if drawing to settle a pending penalty (Pick 2 or Pick 3)
    let countToDraw = 1;
    let penaltyCleared = false;

    if (this.state.pendingPenalty > 0) {
      countToDraw = this.state.pendingPenalty;
      this.state.pendingPenalty = 0;
      this.state.penaltyType = null;
      penaltyCleared = true;
    }

    const drawnCards = this.drawFromMarket(countToDraw);
    hand.push(...drawnCards);

    // If drew penalty, player lost their turn.
    // If regular market draw (1 card), turn passes to opponent
    this.state.currentTurn = isPlayer ? 'ai' : 'player';
    this.state.actionMessage = `${isPlayer ? 'You' : 'Bros Chidi'} went to Market (${countToDraw} card${countToDraw > 1 ? 's' : ''})`;

    return { cardsDrawn: drawnCards, penaltyCleared };
  }

  /**
   * Smart AI Strategy for Bros Chidi
   */
  public getBestAIMove(): { action: 'play' | 'market'; cardId?: string; chosenSuit?: WhotSuit } {
    const hand = this.state.aiHand;
    const playable = this.getPlayableCards(hand);

    // If facing penalty (Pick 2 or Pick 3), MUST defend if have matching card
    if (this.state.pendingPenalty > 0) {
      if (playable.length > 0) {
        return { action: 'play', cardId: playable[0].id };
      }
      return { action: 'market' };
    }

    if (playable.length === 0) {
      return { action: 'market' };
    }

    // Determine the AI's most frequent suit in hand
    const suitCounts: Record<WhotSuit, number> = {
      circle: 0,
      triangle: 0,
      cross: 0,
      square: 0,
      star: 0,
      whot: 0
    };
    hand.forEach(c => {
      suitCounts[c.suit]++;
    });

    // Find dominant normal suit
    let bestSuit: WhotSuit = 'circle';
    let maxSuitCount = -1;
    (['circle', 'triangle', 'cross', 'square', 'star'] as WhotSuit[]).forEach(s => {
      if (suitCounts[s] > maxSuitCount) {
        maxSuitCount = suitCounts[s];
        bestSuit = s;
      }
    });

    // Strategy 1: If can check up with non-20 card, do it immediately!
    const winningCard = playable.find(c => c.number !== 20);
    if (hand.length === 1 && winningCard) {
      return { action: 'play', cardId: winningCard.id };
    }

    // Strategy 2: If opponent called Last Card, disrupt them with special cards!
    if (this.state.playerCalledLastCard) {
      // 14 General Market forces them to pick!
      const generalMarket = playable.find(c => c.number === 14);
      if (generalMarket) return { action: 'play', cardId: generalMarket.id };

      // 2 or 5 forces them to pick!
      const pickCard = playable.find(c => c.number === 2 || c.number === 5);
      if (pickCard) return { action: 'play', cardId: pickCard.id };

      // 8 Suspension skips them!
      const suspension = playable.find(c => c.number === 8);
      if (suspension) return { action: 'play', cardId: suspension.id };

      // 20 Whot allows demanding a suit they likely don't have
      const whotCard = playable.find(c => c.number === 20);
      if (whotCard) {
        return { action: 'play', cardId: whotCard.id, chosenSuit: bestSuit };
      }
    }

    // Strategy 3: Play special attack cards (2, 5, 8, 14, 1)
    const attackCard = playable.find(c => [14, 2, 5, 8, 1].includes(c.number));
    if (attackCard) {
      return { action: 'play', cardId: attackCard.id };
    }

    // Strategy 4: Prefer non-20 card matching dominant suit
    const matchingDominant = playable.find(c => c.suit === bestSuit && c.number !== 20);
    if (matchingDominant) {
      return { action: 'play', cardId: matchingDominant.id };
    }

    // Strategy 5: Any non-20 playable card
    const normalPlayable = playable.find(c => c.number !== 20);
    if (normalPlayable) {
      return { action: 'play', cardId: normalPlayable.id };
    }

    // Strategy 6: Play 20 Whot and demand best suit
    const whotCard = playable.find(c => c.number === 20);
    if (whotCard) {
      return { action: 'play', cardId: whotCard.id, chosenSuit: bestSuit };
    }

    return { action: 'market' };
  }
}
