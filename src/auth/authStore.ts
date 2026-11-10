import { UserProfile, SystemStats, Tournament } from './types';

const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr_admin',
    username: 'baba_admin',
    email: 'admin@naijastreet.com',
    displayName: 'Super Admin Bros 👑',
    avatar: '👑',
    role: 'admin',
    streetCoins: 500000,
    level: 50,
    xp: 99999,
    rank: 'Arcade Grand Master',
    status: 'vip',
    stats: {
      matchesPlayed: 450,
      wins: 412,
      losses: 38,
      winRate: 91.5,
      highBreak: 147,
      ayoCaptures: 120,
      chopsCount: 340,
      goalsScored: 280
    },
    createdAt: '2025-01-01'
  },
  {
    id: 'usr_player1',
    username: 'lagos_striker',
    email: 'player@naijastreet.com',
    displayName: 'Chidi Striker ⚡',
    avatar: '⚽',
    role: 'player',
    streetCoins: 3500,
    level: 12,
    xp: 2840,
    rank: 'Ojuelegba Legend',
    status: 'vip',
    stats: {
      matchesPlayed: 88,
      wins: 62,
      losses: 26,
      winRate: 70.4,
      highBreak: 64,
      ayoCaptures: 34,
      chopsCount: 45,
      goalsScored: 112
    },
    createdAt: '2025-02-14'
  },
  {
    id: 'usr_player2',
    username: 'queen_titi',
    email: 'titi@streetarcade.ng',
    displayName: 'Titi Rhythm Queen 👏',
    avatar: '💃',
    role: 'player',
    streetCoins: 1850,
    level: 8,
    xp: 1420,
    rank: 'Warri Rhythm Champ',
    status: 'active',
    stats: {
      matchesPlayed: 54,
      wins: 38,
      losses: 16,
      winRate: 70.3,
      highBreak: 32,
      ayoCaptures: 48,
      chopsCount: 22,
      goalsScored: 45
    },
    createdAt: '2025-03-01'
  },
  {
    id: 'usr_player3',
    username: 'alhaji_cue',
    email: 'alhaji@kanobilliards.ng',
    displayName: 'Alhaji Snooker King 🎱',
    avatar: '🎱',
    role: 'player',
    streetCoins: 4200,
    level: 15,
    xp: 3800,
    rank: 'Kano Billiard Master',
    status: 'vip',
    stats: {
      matchesPlayed: 110,
      wins: 89,
      losses: 21,
      winRate: 80.9,
      highBreak: 128,
      ayoCaptures: 12,
      chopsCount: 18,
      goalsScored: 30
    },
    createdAt: '2025-01-20'
  },
  {
    id: 'usr_player4',
    username: 'kpafuka_don',
    email: 'emeka@enuguludo.com',
    displayName: 'Bros Emeka Chop 🎲',
    avatar: '🎲',
    role: 'player',
    streetCoins: 2100,
    level: 9,
    xp: 1750,
    rank: 'Enugu Ludo Lord',
    status: 'active',
    stats: {
      matchesPlayed: 76,
      wins: 51,
      losses: 25,
      winRate: 67.1,
      highBreak: 24,
      ayoCaptures: 16,
      chopsCount: 94,
      goalsScored: 28
    },
    createdAt: '2025-02-28'
  }
];

export const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: 'tourn_1',
    title: 'Ojuelegba Asphalt Derby',
    gameId: 'monkey_post',
    gameTitle: 'Monkey Post 3D',
    prizePool: '₦250,000 + 50k Coins',
    participants: 48,
    maxParticipants: 64,
    status: 'live',
    startDate: 'Active Now'
  },
  {
    id: 'tourn_2',
    title: 'Warri National Ludo Chop Championship',
    gameId: 'naija_ludo_3d',
    gameTitle: 'Naija Ludo 3D',
    prizePool: '₦150,000 + 30k Coins',
    participants: 32,
    maxParticipants: 32,
    status: 'live',
    startDate: 'Semifinals'
  },
  {
    id: 'tourn_3',
    title: 'Lagos Open Snooker Classic',
    gameId: 'snooker_3d',
    gameTitle: 'Naija Snooker 3D',
    prizePool: '₦300,000 + Golden Cue',
    participants: 18,
    maxParticipants: 32,
    status: 'upcoming',
    startDate: 'Starts Tomorrow'
  },
  {
    id: 'tourn_4',
    title: 'All-Nigeria Ayò Olọ́pọ́n Royal Cup',
    gameId: 'ayo_olopon',
    gameTitle: 'Ayò Olọ́pọ́n 3D',
    prizePool: '₦100,000 + Carved Board',
    participants: 12,
    maxParticipants: 16,
    status: 'upcoming',
    startDate: 'Saturday 4PM'
  }
];

const STORAGE_KEYS = {
  CURRENT_USER: 'naija_arcade_current_user',
  USERS: 'naija_arcade_users',
  TOURNAMENTS: 'naija_arcade_tournaments',
  MAINTENANCE: 'naija_arcade_maintenance'
};

class AuthStore {
  private currentUser: UserProfile | null = null;
  private users: UserProfile[] = [];
  private tournaments: Tournament[] = INITIAL_TOURNAMENTS;
  private isMaintenance: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;

    try {
      // Load users
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      } else {
        this.users = [...INITIAL_USERS];
        this.saveUsers();
      }

      // Load current user
      const storedCurrent = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (storedCurrent) {
        this.currentUser = JSON.parse(storedCurrent);
      } else {
        // Default auto-login to standard player for instant zero-friction play
        this.currentUser = this.users[1]; // Chidi Striker
        this.saveCurrentUser();
      }

      // Load tournaments
      const storedTourn = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
      if (storedTourn) {
        this.tournaments = JSON.parse(storedTourn);
      }

      // Maintenance mode
      const maint = localStorage.getItem(STORAGE_KEYS.MAINTENANCE);
      this.isMaintenance = maint === 'true';
    } catch (e) {
      this.users = [...INITIAL_USERS];
      this.currentUser = this.users[1];
    }
  }

  private saveUsers() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
    }
  }

  private saveCurrentUser() {
    if (typeof window !== 'undefined') {
      if (this.currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public getUsers(): UserProfile[] {
    return this.users;
  }

  public getTournaments(): Tournament[] {
    return this.tournaments;
  }

  public isMaintenanceMode(): boolean {
    return this.isMaintenance;
  }

  public setMaintenanceMode(enabled: boolean) {
    this.isMaintenance = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.MAINTENANCE, enabled ? 'true' : 'false');
    }
    this.notify();
  }

  public login(identifier: string, pass: string): { success: boolean; user?: UserProfile; error?: string } {
    const cleanId = identifier.trim().toLowerCase();
    const user = this.users.find(u => u.email.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId);

    if (!user) {
      return { success: false, error: 'User account not found. Please register or check details.' };
    }

    if (user.status === 'banned') {
      return { success: false, error: 'This account has been suspended by an Administrator.' };
    }

    // In demo environment, accept password if provided
    this.currentUser = user;
    this.saveCurrentUser();
    this.notify();
    return { success: true, user };
  }

  public loginAsAdmin(passcode: string): { success: boolean; user?: UserProfile; error?: string } {
    const adminUser = this.users.find(u => u.role === 'admin') || INITIAL_USERS[0];

    // Passcode check: accept 'admin123', 'admin', '7788', or empty for instant quick admin demo
    if (passcode && passcode !== 'admin123' && passcode !== 'admin' && passcode !== '7788') {
      return { success: false, error: 'Invalid Administrator passcode. Hint: Use admin123 or 7788.' };
    }

    this.currentUser = adminUser;
    this.saveCurrentUser();
    this.notify();
    return { success: true, user: adminUser };
  }

  public register(username: string, email: string, displayName: string, avatar = '🎮'): { success: boolean; user?: UserProfile; error?: string } {
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (this.users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, error: 'Username is already taken by another street gamer.' };
    }
    if (this.users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Email is already registered. Please sign in instead.' };
    }

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      username: cleanUsername,
      email: cleanEmail,
      displayName: displayName.trim() || cleanUsername,
      avatar,
      role: 'player',
      streetCoins: 1500, // Welcome bonus coins!
      level: 1,
      xp: 0,
      rank: 'Street Rookie',
      status: 'active',
      stats: {
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        highBreak: 0,
        ayoCaptures: 0,
        chopsCount: 0,
        goalsScored: 0
      },
      createdAt: new Date().toISOString().split('T')[0]
    };

    this.users.unshift(newUser);
    this.saveUsers();

    this.currentUser = newUser;
    this.saveCurrentUser();
    this.notify();

    return { success: true, user: newUser };
  }

  public logout() {
    this.currentUser = null;
    this.saveCurrentUser();
    this.notify();
  }

  public addCoins(userId: string, amount: number) {
    const u = this.users.find(x => x.id === userId);
    if (u) {
      u.streetCoins = Math.max(0, u.streetCoins + amount);
      if (this.currentUser?.id === userId) {
        this.currentUser.streetCoins = u.streetCoins;
        this.saveCurrentUser();
      }
      this.saveUsers();
      this.notify();
    }
  }

  public toggleBan(userId: string) {
    const u = this.users.find(x => x.id === userId);
    if (u && u.role !== 'admin') {
      u.status = u.status === 'banned' ? 'active' : 'banned';
      if (this.currentUser?.id === userId && u.status === 'banned') {
        this.logout();
      }
      this.saveUsers();
      this.notify();
    }
  }

  public promoteUser(userId: string) {
    const u = this.users.find(x => x.id === userId);
    if (u) {
      u.status = u.status === 'vip' ? 'active' : 'vip';
      u.streetCoins += 2000;
      this.saveUsers();
      this.notify();
    }
  }

  public updateUserProfile(updated: Partial<UserProfile>) {
    if (!this.currentUser) return;
    const u = this.users.find(x => x.id === this.currentUser!.id);
    if (u) {
      Object.assign(u, updated);
      this.currentUser = { ...u };
      this.saveUsers();
      this.saveCurrentUser();
      this.notify();
    }
  }

  public getSystemStats(): SystemStats {
    const totalCoins = this.users.reduce((acc, u) => acc + u.streetCoins, 0);
    return {
      totalPlayers: this.users.length * 2840, // Scaled for authentic arcade feel
      activeOnline: 1240,
      matchesPlayedToday: 8430,
      totalCoinsCirculation: totalCoins + 4820000,
      serverUptime: '99.98%',
      pingMs: 24,
      isMaintenanceMode: this.isMaintenance
    };
  }
}

export const authStore = new AuthStore();
