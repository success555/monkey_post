import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/server';
import { authStore } from '@/auth/authStore';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const sortBy = searchParams.get('sortBy') || 'wins'; // 'wins' | 'coins' | 'win_rate'

    try {
      let query = adminSupabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, rank, level, xp, street_coins, matches_played, wins, losses, win_rate, status')
        .eq('status', 'active')
        .limit(limit);

      if (sortBy === 'coins') {
        query = query.order('street_coins', { ascending: false });
      } else if (sortBy === 'win_rate') {
        query = query.order('win_rate', { ascending: false });
      } else {
        query = query.order('wins', { ascending: false }).order('xp', { ascending: false });
      }

      const { data, error } = await query;

      if (data && data.length > 0) {
        // Map database fields to frontend friendly structure
        const formatted = data.map((p, idx) => ({
          id: p.id,
          rankNumber: idx + 1,
          username: p.username,
          displayName: p.display_name,
          avatar: p.avatar_url || '⚽',
          rank: p.rank,
          level: p.level,
          streetCoins: p.street_coins,
          stats: {
            matchesPlayed: p.matches_played,
            wins: p.wins,
            losses: p.losses,
            winRate: p.win_rate
          }
        }));

        return NextResponse.json({
          success: true,
          source: 'supabase',
          leaderboard: formatted
        });
      }
    } catch (dbErr) {
      // Fallback
    }

    // Local fallback
    const localUsers = authStore.getUsers()
      .filter(u => u.status !== 'banned')
      .sort((a, b) => b.stats.wins - a.stats.wins)
      .slice(0, limit)
      .map((u, idx) => ({
        ...u,
        rankNumber: idx + 1
      }));

    return NextResponse.json({
      success: true,
      source: 'local_store',
      leaderboard: localUsers
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

