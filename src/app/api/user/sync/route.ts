import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/server';
import { authStore } from '@/auth/authStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, email, username, displayName, avatar } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const cleanUsername = username || email?.split('@')[0] || `player_${id.slice(-6)}`;
    const cleanDisplayName = displayName || cleanUsername;
    const cleanAvatar = avatar || '⚽';

    let dbProfile = null;

    try {
      // 1. Check if profile already exists in Supabase
      const { data: existing, error: selectErr } = await adminSupabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (existing) {
        dbProfile = existing;
      } else {
        // 2. Insert new profile with 1,500 starter coins
        const { data: inserted, error: insertErr } = await adminSupabase
          .from('profiles')
          .insert({
            id,
            email: email || '',
            username: cleanUsername,
            display_name: cleanDisplayName,
            avatar_url: cleanAvatar,
            role: 'player',
            street_coins: 1500,
            level: 1,
            xp: 0,
            rank: 'Street Rookie',
            status: 'active'
          })
          .select()
          .single();

        if (inserted) {
          dbProfile = inserted;
        }
      }
    } catch (dbErr) {
      console.warn('[Sync API] Supabase offline or pending migration, falling back to local store');
    }

    // 3. Keep in-memory store in sync
    authStore.register(id, email || '', cleanDisplayName, cleanAvatar);
    const localUser = authStore.getCurrentUser();

    return NextResponse.json({
      success: true,
      profile: dbProfile || localUser,
      source: dbProfile ? 'supabase' : 'local_store'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Sync failed' }, { status: 500 });
  }
}

