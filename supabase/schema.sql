-- =======================================================================
-- NAIJA STREET ARCADE - PRODUCTION SUPABASE DATABASE SCHEMA
-- =======================================================================
-- Run this migration in your Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
-- =======================================================================

-- 1. PROFILES TABLE (Synced with Clerk Authentication)
create table if not exists public.profiles (
  id text primary key, -- Clerk User ID (e.g. user_2t...)
  email text,
  username text unique,
  display_name text,
  avatar_url text default '⚽',
  role text default 'player' check (role in ('player', 'admin')),
  street_coins bigint default 1500,
  level integer default 1,
  xp bigint default 0,
  rank text default 'Street Rookie',
  status text default 'active' check (status in ('active', 'banned', 'vip')),
  matches_played integer default 0,
  wins integer default 0,
  losses integer default 0,
  win_rate numeric default 0.0,
  goals_scored integer default 0,
  ayo_captures integer default 0,
  chops_count integer default 0,
  high_break integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. MATCH HISTORY TABLE
create table if not exists public.game_matches (
  id uuid primary key default gen_random_uuid(),
  user_id text references public.profiles(id) on delete cascade,
  game_id text not null, -- 'monkey_post', 'ayo_olopon', 'naija_whot', 'ten_ten', 'naija_ludo_3d', 'snooker_3d'
  game_title text not null,
  mode text default 'exhibition',
  score_home integer default 0,
  score_away integer default 0,
  winner text check (winner in ('home', 'away', 'draw')),
  coins_earned integer default 0,
  xp_earned integer default 0,
  duration_seconds integer default 0,
  metadata jsonb default '{}'::jsonb,
  played_at timestamptz default now()
);

-- 3. PLAYER INVENTORY (Items purchased from Street Vault Shop)
create table if not exists public.player_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id text references public.profiles(id) on delete cascade,
  item_id text not null,
  item_name text not null,
  item_type text not null, -- 'ball', 'board', 'card_skin', 'cue', 'title'
  price_paid integer not null,
  purchased_at timestamptz default now()
);

-- 4. DAILY QUESTS & REWARDS
create table if not exists public.daily_quests (
  id uuid primary key default gen_random_uuid(),
  user_id text references public.profiles(id) on delete cascade,
  quest_id text not null,
  quest_title text not null,
  progress integer default 0,
  target integer default 1,
  reward_coins integer default 250,
  claimed boolean default false,
  quest_date date default current_date
);

-- 5. TOURNAMENTS
create table if not exists public.tournaments (
  id text primary key,
  title text not null,
  game_id text not null,
  game_title text not null,
  prize_pool text default '50,000 Coins',
  participants integer default 0,
  max_participants integer default 64,
  status text default 'live' check (status in ('upcoming', 'live', 'completed')),
  start_date timestamptz default now()
);

-- 6. EMAIL AUDIT LOG (Resend email delivery tracking)
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  user_id text,
  subject text not null,
  template text not null,
  resend_id text,
  status text default 'sent',
  error_message text,
  sent_at timestamptz default now()
);

-- 7. ATOMIC FUNCTIONS FOR SAFE IN-GAME TRANSACTIONS
-- Increment / Decrement Coins Atomically
create or replace function public.increment_coins(user_id text, coin_amount integer)
returns void as $$
begin
  update public.profiles
  set 
    street_coins = greatest(0, street_coins + coin_amount),
    updated_at = now()
  where id = user_id;
end;
$$ language plpgsql security definer;

-- Record Match Result & Update Player Stats Atomically
create or replace function public.record_match_result(
  p_user_id text,
  p_game_id text,
  p_game_title text,
  p_mode text,
  p_score_home integer,
  p_score_away integer,
  p_winner text,
  p_coins_earned integer,
  p_xp_earned integer,
  p_goals integer default 0,
  p_ayo_captures integer default 0,
  p_chops integer default 0,
  p_high_break integer default 0
) returns jsonb as $$
declare
  v_is_win boolean;
  v_new_xp bigint;
  v_new_level integer;
  v_new_rank text;
  v_result jsonb;
begin
  v_is_win := (p_winner = 'home');

  -- Update player stats
  update public.profiles
  set
    matches_played = matches_played + 1,
    wins = wins + (case when v_is_win then 1 else 0 end),
    losses = losses + (case when not v_is_win and p_winner != 'draw' then 1 else 0 end),
    win_rate = round(((wins + (case when v_is_win then 1 else 0 end))::numeric / (matches_played + 1)::numeric) * 100, 1),
    street_coins = greatest(0, street_coins + p_coins_earned),
    xp = xp + p_xp_earned,
    level = greatest(1, floor((xp + p_xp_earned) / 1000) + 1),
    goals_scored = goals_scored + p_goals,
    ayo_captures = ayo_captures + p_ayo_captures,
    chops_count = chops_count + p_chops,
    high_break = greatest(high_break, p_high_break),
    updated_at = now()
  where id = p_user_id
  returning jsonb_build_object(
    'street_coins', street_coins,
    'level', level,
    'xp', xp,
    'rank', rank,
    'wins', wins,
    'matches_played', matches_played
  ) into v_result;

  -- Record match in history
  insert into public.game_matches (
    user_id, game_id, game_title, mode, score_home, score_away, winner, coins_earned, xp_earned
  ) values (
    p_user_id, p_game_id, p_game_title, p_mode, p_score_home, p_score_away, p_winner, p_coins_earned, p_xp_earned
  );

  return v_result;
end;
$$ language plpgsql security definer;

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.game_matches enable row level security;
alter table public.player_inventory enable row level security;
alter table public.daily_quests enable row level security;
alter table public.tournaments enable row level security;

-- Public can read leaderboards and profiles
create policy "Allow public read of profiles" on public.profiles for select using (true);
create policy "Allow public read of tournaments" on public.tournaments for select using (true);

-- Service role has full unrestricted admin access (used by Next.js Server API)
create policy "Service role full access on profiles" on public.profiles for all using (true);
create policy "Service role full access on game_matches" on public.game_matches for all using (true);
create policy "Service role full access on player_inventory" on public.player_inventory for all using (true);
create policy "Service role full access on daily_quests" on public.daily_quests for all using (true);
create policy "Service role full access on email_logs" on public.email_logs for all using (true);
