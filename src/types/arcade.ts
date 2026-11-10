export type GameStatus = 'playable' | 'coming_soon' | 'in_development';

export type GameCategory = 'All' | 'Sports' | 'Strategy' | 'Cards' | 'Rhythm' | 'Arcade';

export interface ArcadeGame {
  id: string;
  title: string;
  tagline: string;
  category: 'Sports' | 'Strategy' | 'Cards' | 'Rhythm' | 'Arcade';
  status: GameStatus;
  players: string;
  difficulty: 'Casual' | 'Competitive' | 'Hardcore';
  badge: string;
  badgeColor: string;
  iconEmoji: string;
  bannerGradient: string;
  accentColor: string;
  description: string;
  features: string[];
  controlsSummary: string;
  actionLabel: string;
}

