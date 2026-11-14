import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/server';
import { authStore } from '@/auth/authStore';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      const current = authStore.getCurrentUser();
      return NextResponse.json({ success: true, profile: current });
    }

    try {
      const { data, error } = await adminSupabase
        .from('profiles')
        .select('*, player_inventory(*)')
        .eq('id', userId)
        .single();

      if (data) {
        return NextResponse.json({ success: true, profile: data });
      }
    } catch (dbErr) {}

    // Fallback
    const local = authStore.getUsers().find(u => u.id === userId) || authStore.getCurrentUser();
    return NextResponse.json({ success: true, profile: local });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, displayName, avatar } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
      const { data, error } = await adminSupabase
        .from('profiles')
        .update({
          display_name: displayName,
          avatar_url: avatar,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (data) {
        authStore.updateProfile({ displayName, avatar });
        return NextResponse.json({ success: true, profile: data });
      }
    } catch (dbErr) {}

    authStore.updateProfile({ displayName, avatar });
    return NextResponse.json({ success: true, profile: authStore.getCurrentUser() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

