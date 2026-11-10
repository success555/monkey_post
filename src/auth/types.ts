export type UserRole = 'player' | 'admin';

export interface UserStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number; // percentage (0 - 100)
  highBreak?: number;     // Snooker
  ayoCaptures?: number;   // Ayò Olọ́pọ́n
  chopsCount?: number;    // Naija Ludo
  goalsScored?: number;   // Monkey Post
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  role: UserRole;
  streetCoins: number;
  level: number;
  xp: number;
  rank: string;
  status: 'active' | 'banned' | 'vip';
  stats: UserStats;
  createdAt: string;
}

export interface SystemStats {
  totalPlayers: number;
  activeOnline: number;
  matchesPlayedToday: number;
  totalCoinsCirculation: number;
  serverUptime: string;
  pingMs: number;
  isMaintenanceMode: boolean;
}

export interface Tournament {
  id: string;
  title: string;
  gameId: string;
  gameTitle: string;
  prizePool: string;
  participants: number;
  maxParticipants: number;
  status: 'upcoming' | 'live' | 'completed';
  startDate: string;
}
