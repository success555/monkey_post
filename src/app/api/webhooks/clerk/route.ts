import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/resend/email';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const eventType = payload.type;
    const data = payload.data;

    // Handle Clerk user creation
    if (eventType === 'user.created') {
      const userId = data.id;
      const primaryEmail = data.email_addresses?.[0]?.email_address || '';
      const username = data.username || primaryEmail.split('@')[0] || `player_${userId.slice(-6)}`;
      const displayName = [data.first_name, data.last_name].filter(Boolean).join(' ') || username;
      const avatarUrl = data.image_url || '⚽';

      // 1. Sync to Supabase Profiles
      await adminSupabase.from('profiles').upsert({
        id: userId,
        email: primaryEmail,
        username,
        display_name: displayName,
        avatar_url: avatarUrl,
        role: 'player',
        street_coins: 1500,
        level: 1,
        xp: 0,
        rank: 'Street Rookie',
        status: 'active'
      });

      // 2. Dispatch Welcome Email via Resend
      if (primaryEmail) {
        await sendWelcomeEmail(primaryEmail, displayName, userId);
      }

      return NextResponse.json({ success: true, message: 'User provisioned in Supabase' });
    }

    // Handle Clerk user updates
    if (eventType === 'user.updated') {
      const userId = data.id;
      const primaryEmail = data.email_addresses?.[0]?.email_address || '';
      const displayName = [data.first_name, data.last_name].filter(Boolean).join(' ');

      await adminSupabase.from('profiles').update({
        email: primaryEmail,
        display_name: displayName || undefined,
        avatar_url: data.image_url || undefined,
        updated_at: new Date().toISOString()
      }).eq('id', userId);

      return NextResponse.json({ success: true, message: 'User updated' });
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[Clerk Webhook Error]', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
