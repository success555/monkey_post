export type WhotSuit = 'circle' | 'triangle' | 'cross' | 'square' | 'star' | 'whot';

export interface WhotCard {
  id: string;
  suit: WhotSuit;
  number: number;
}

export type SpecialCardAction = 
  | 'hold_on'        // 1
  | 'pick_two'       // 2
  | 'pick_three'     // 5
  | 'suspension'     // 8
  | 'general_market' // 14
  | 'whot'           // 20
  | 'normal';

export interface WhotGameState {
  marketDeck: WhotCard[];
  discardPile: WhotCard[];
  playerHand: WhotCard[];
  aiHand: WhotCard[];
  currentTurn: 'player' | 'ai';
  demandedSuit: WhotSuit | null;
  pendingPenalty: number; // Stacking pick-2 or pick-3 penalty
  penaltyType: 'pick_two' | 'pick_three' | null;
  isGameOver: boolean;
  winner: 'player' | 'ai' | null;
  playerCalledLastCard: boolean;
  aiCalledLastCard: boolean;
  lastPlayedCard: WhotCard | null;
  actionMessage: string;
  commentary: string;
}

export interface PlayCardResult {
  valid: boolean;
  reason?: string;
  specialAction: SpecialCardAction;
  nextTurn: 'player' | 'ai';
  cardsDrawnCount?: number;
  isCheckUp: boolean;
}
