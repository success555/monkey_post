import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/server';
import { authStore } from '@/auth/authStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, itemId, itemName, itemType, price } = body;

    if (!userId || !itemId || !price) {
      return NextResponse.json({ error: 'Missing required purchase parameters' }, { status: 400 });
    }

    const priceNum = parseInt(price, 10);
    const currentUser = authStore.getCurrentUser();
    const currentCoins = currentUser?.streetCoins || 0;

    if (currentCoins < priceNum) {
      return NextResponse.json({
        success: false,
        error: `Insufficient Street Coins! You need ${priceNum.toLocaleString()} coins, but currently have ${currentCoins.toLocaleString()}. Play matches to earn more!`
      }, { status: 400 });
    }

    // 1. Deduct coins and log purchase in Supabase
    try {
      await adminSupabase.rpc('increment_coins', {
        user_id: userId,
        coin_amount: -priceNum
      });

      await adminSupabase.from('player_inventory').insert({
        user_id: userId,
        item_id: itemId,
        item_name: itemName || itemId,
        item_type: itemType || 'item',
        price_paid: priceNum
      });
    } catch (dbErr) {}

    // 2. Deduct in local store
    authStore.deductCoins(priceNum);
    const updated = authStore.getCurrentUser();

    return NextResponse.json({
      success: true,
      message: `Unlocked ${itemName || itemId}!`,
      newBalance: updated?.streetCoins || 0,
      item: { id: itemId, name: itemName, type: itemType }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

