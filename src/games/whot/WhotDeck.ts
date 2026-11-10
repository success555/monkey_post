import { WhotCard, WhotSuit, SpecialCardAction } from './types';

// Authentic Nigerian Whot Deck Composition (54 Cards)
const SUIT_NUMBERS: Record<Exclude<WhotSuit, 'whot'>, number[]> = {
  circle: [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14],   // 12 cards
  triangle: [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14], // 12 cards
  cross: [1, 2, 3, 5, 7, 10, 11, 13, 14],               // 9 cards
  square: [1, 2, 3, 5, 7, 10, 11, 13, 14],              // 9 cards
  star: [1, 2, 3, 4, 5, 7, 8]                           // 7 cards
};

export class WhotDeck {
  /**
   * Generates a fresh 54-card Nigerian Whot deck
   */
  public static createDeck(): WhotCard[] {
    const deck: WhotCard[] = [];
    let uid = 0;

    // Normal Suits
    (Object.keys(SUIT_NUMBERS) as Array<Exclude<WhotSuit, 'whot'>>).forEach((suit) => {
      SUIT_NUMBERS[suit].forEach((num) => {
        deck.push({
          id: `${suit}_${num}_${uid++}`,
          suit,
          number: num
        });
      });
    });

    // 5 Special WHOT 20 Wild Cards
    for (let i = 0; i < 5; i++) {
      deck.push({
        id: `whot_20_${uid++}`,
        suit: 'whot',
        number: 20
      });
    }

    return this.shuffle(deck);
  }

  /**
   * Fisher-Yates array shuffle
   */
  public static shuffle(cards: WhotCard[]): WhotCard[] {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Identifies special action for a card number
   */
  public static getSpecialAction(number: number): SpecialCardAction {
    switch (number) {
      case 1:
        return 'hold_on';
      case 2:
        return 'pick_two';
      case 5:
        return 'pick_three';
      case 8:
        return 'suspension';
      case 14:
        return 'general_market';
      case 20:
        return 'whot';
      default:
        return 'normal';
    }
  }

  /**
   * Human-readable label for card action
   */
  public static getActionLabel(action: SpecialCardAction): string {
    switch (action) {
      case 'hold_on':
        return 'HOLD ON (Play Again)';
      case 'pick_two':
        return 'PICK TWO (+2 Cards)';
      case 'pick_three':
        return 'PICK THREE (+3 Cards)';
      case 'suspension':
        return 'SUSPENSION (Skip Turn)';
      case 'general_market':
        return 'GENERAL MARKET (All Pick 1)';
      case 'whot':
        return 'WHOT! (Choose Shape)';
      default:
        return '';
    }
  }

  /**
   * Suit symbol/icon representation
   */
  public static getSuitSymbol(suit: WhotSuit): string {
    switch (suit) {
      case 'circle':
        return '●';
      case 'triangle':
        return '▲';
      case 'cross':
        return '✚';
      case 'square':
        return '■';
      case 'star':
        return '★';
      case 'whot':
        return '20';
    }
  }

  /**
   * Suit color coding (Authentic Nigerian Whot colors)
   */
  public static getSuitColor(suit: WhotSuit): { bg: string; text: string; border: string; accent: string } {
    switch (suit) {
      case 'circle':
        return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/40', accent: '#ef4444' };
      case 'triangle':
        return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/40', accent: '#10b981' };
      case 'cross':
        return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/40', accent: '#3b82f6' };
      case 'square':
        return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/40', accent: '#f59e0b' };
      case 'star':
        return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/40', accent: '#a855f7' };
      case 'whot':
        return { bg: 'bg-yellow-400/20', text: 'text-yellow-400', border: 'border-yellow-400/60', accent: '#facc15' };
    }
  }
}

