import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/server';
import { authStore } from '@/auth/authStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      gameId,
      gameTitle,
      mode = 'exhibition',
      scoreHome = 0,
      scoreAway = 0,
      winner = 'draw', // 'home', 'away', 'draw'
      goals = 0,
      ayoCaptures = 0,
      chops = 0,
      highBreak = 0
    } = body;

    const isWin = winner === 'home';
    const isDraw = winner === 'draw';

    // Calculate coin and XP reward
    const coinsEarned = isWin ? 150 : isDraw ? 50 : 25;
    const xpEarned = isWin ? 200 : isDraw ? 100 : 50;

    let updatedResult = null;

    // 1. Try atomic database update in Supabase
    if (userId) {
      try {
        const { data, error } = await adminSupabase.rpc('record_match_result', {
          p_user_id: userId,
          p_game_id: gameId,
          p_game_title: gameTitle || gameId,
          p_mode: mode,
          p_score_home: scoreHome,
          p_score_away: scoreAway,
          p_winner: winner,
          p_coins_earned: coinsEarned,
          p_xp_earned: xpEarned,
          p_goals: goals,
          p_ayo_captures: ayoCaptures,
          p_chops: chops,
          p_high_break: highBreak
        });

        if (data) {
          updatedResult = data;
        }
      } catch (dbErr) {
        // Fallback to direct table update if RPC function isn't yet created
        try {
          await adminSupabase.from('game_matches').insert({
            user_id: userId,
            game_id: gameId,
            game_title: gameTitle || gameId,
            mode,
            score_home: scoreHome,
            score_away: scoreAway,
            winner,
            coins_earned: coinsEarned,
            xp_earned: xpEarned
          });
        } catch (e) {}
      }
    }

    // 2. Always sync in-memory / local client state
    authStore.recordMatchResult(isWin, coinsEarned, xpEarned, {
      goalsScored: goals,
      ayoCaptures: ayoCaptures,
      chopsCount: chops,
      highBreak: highBreak
    });

    const user = authStore.getCurrentUser();

    return NextResponse.json({
      success: true,
      coinsEarned,
      xpEarned,
      winner,
      newBalance: user?.streetCoins || 1500 + coinsEarned,
      level: user?.level || 1,
      rank: user?.rank || 'Street Rookie'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

