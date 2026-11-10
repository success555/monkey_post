import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/server';
import { authStore } from '@/auth/authStore';

// GET: Fetch all registered arcade players
export async function GET() {
  try {
    const { data: profiles, error } = await adminSupabase
      .from('profiles')
      .select('*, game_stats(*)')
      .order('created_at', { ascending: false });

    if (error || !profiles || profiles.length === 0) {
      // Fallback to in-memory store if Supabase credentials are in test mode
      return NextResponse.json({ success: true, source: 'local_store', players: authStore.getUsers() });
    }

    return NextResponse.json({ success: true, source: 'supabase', players: profiles });
  } catch (err: any) {
    return NextResponse.json({ success: true, source: 'local_store', players: authStore.getUsers() });
  }
}

// POST: Admin mutation (Gift coins, toggle ban, promote)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, userId, amount } = body;

    if (action === 'gift_coins') {
      authStore.addCoins(userId, amount || 1000);
      try {
        await adminSupabase.rpc('increment_coins', { user_id: userId, coin_amount: amount || 1000 });
      } catch (e) {}
      return NextResponse.json({ success: true, message: `Gifted ${amount} coins` });
    }

    if (action === 'toggle_ban') {
      authStore.toggleBan(userId);
      return NextResponse.json({ success: true, message: 'Ban status toggled' });
    }

    if (action === 'promote_vip') {
      authStore.promoteUser(userId);
      return NextResponse.json({ success: true, message: 'Promoted to VIP' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

