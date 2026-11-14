import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/server';
import { authStore } from '@/auth/authStore';

const DEFAULT_QUESTS = [
  { id: 'daily_match_1', title: 'Play 1 Monkey Post Match', reward: 300, progress: 1, target: 1, claimed: false },
  { id: 'daily_win_1', title: 'Win Any Street Match', reward: 500, progress: 1, target: 1, claimed: false },
  { id: 'daily_ayo_1', title: 'Capture 4 Seeds in Ayò Olópón', reward: 400, progress: 2, target: 4, claimed: false },
  { id: 'daily_whot_1', title: 'Play Whot 20 Card', reward: 250, progress: 1, target: 1, claimed: true }
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    return NextResponse.json({
      success: true,
      quests: DEFAULT_QUESTS
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, questId } = body;

    const quest = DEFAULT_QUESTS.find(q => q.id === questId);
    if (!quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    if (quest.claimed) {
      return NextResponse.json({ error: 'Quest reward already claimed' }, { status: 400 });
    }

    // Award reward coins
    authStore.addCoins(userId, quest.reward);
    quest.claimed = true;

    try {
      if (userId) {
        await adminSupabase.rpc('increment_coins', {
          user_id: userId,
          coin_amount: quest.reward
        });
      }
    } catch (e) {}

    const user = authStore.getCurrentUser();

    return NextResponse.json({
      success: true,
      message: `Claimed ${quest.reward} Street Coins!`,
      reward: quest.reward,
      newBalance: user?.streetCoins || 0
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
