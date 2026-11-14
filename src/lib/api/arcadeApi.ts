/**
 * NAIJA STREET ARCADE - FULL-STACK CLIENT API
 * Communicates with Next.js App Router Route Handlers & Server Endpoints
 */

export interface MatchRecordPayload {
  userId?: string;
  gameId: string;
  gameTitle: string;
  mode?: string;
  scoreHome: number;
  scoreAway: number;
  winner: 'home' | 'away' | 'draw';
  goals?: number;
  ayoCaptures?: number;
  chops?: number;
  highBreak?: number;
}

export const arcadeApi = {
  // 1. Sync Clerk Authenticated User to Database
  async syncUser(userData: { id: string; email?: string; username?: string; displayName?: string; avatar?: string }) {
    try {
      const res = await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await res.json();
    } catch (err) {
      console.warn('[arcadeApi.syncUser] Offline fallback:', err);
      return { success: false };
    }
  },

  // 2. Record Match Outcome & Award Coins/XP
  async recordMatch(payload: MatchRecordPayload) {
    try {
      const res = await fetch('/api/matches/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      console.warn('[arcadeApi.recordMatch] Offline fallback:', err);
      return { success: false };
    }
  },

  // 3. Fetch Live Street Leaderboard
  async getLeaderboard(sortBy = 'wins', limit = 20) {
    try {
      const res = await fetch(`/api/leaderboard?sortBy=${sortBy}&limit=${limit}`);
      const data = await res.json();
      return data?.leaderboard || [];
    } catch (err) {
      console.warn('[arcadeApi.getLeaderboard] Offline fallback:', err);
      return [];
    }
  },

  // 4. Purchase Shop Item with Server-Validated Coins
  async purchaseShopItem(userId: string, itemId: string, itemName: string, itemType: string, price: number) {
    try {
      const res = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, itemId, itemName, itemType, price })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error' };
    }
  },

  // 5. Fetch Daily Quests
  async getQuests(userId?: string) {
    try {
      const res = await fetch(`/api/quests${userId ? `?userId=${userId}` : ''}`);
      const data = await res.json();
      return data?.quests || [];
    } catch (err) {
      return [];
    }
  },

  // 6. Claim Daily Quest Reward
  async claimQuest(userId: string, questId: string) {
    try {
      const res = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, questId })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },

  // 7. Fetch Admin System Analytics
  async getSystemStats() {
    try {
      const res = await fetch('/api/admin/system');
      return await res.json();
    } catch (err) {
      return { success: false };
    }
  }
};

