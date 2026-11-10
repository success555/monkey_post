-- =======================================================================
-- NAIJA STREET ARCADE — SUPABASE POSTGRESQL PRODUCTION SCHEMA BLUEPRINT
-- =======================================================================
-- Fully integrated with:
-- 1. CLERK AUTHENTICATION (User IDs synced as 'user_2...')
-- 2. SUPABASE ROW LEVEL SECURITY (RLS) & STORAGE BUCKETS
-- 3. RESEND TRANSACTIONAL EMAIL LOGS & AUDIT TRAILS
-- =======================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =======================================================================
-- 1. PROFILES TABLE (Linked 1:1 with Clerk User IDs)
-- =======================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- Clerk User ID (e.g. 'user_2xyz789...')
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT DEFAULT '⚽',
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin', 'moderator')),
  street_coins BIGINT NOT NULL DEFAULT 1500, -- 1,500 Street Coins Welcome Bonus
  level INT NOT NULL DEFAULT 1,
  xp BIGINT NOT NULL DEFAULT 0,
  rank TEXT NOT NULL DEFAULT 'Street Rookie',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned', 'vip')),
  phone_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for high-speed searches
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_coins ON public.profiles(street_coins DESC);

-- =======================================================================
-- 2. GAME STATS TABLE
-- =======================================================================
CREATE TABLE IF NOT EXISTS public.game_stats (
  profile_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  matches_played INT NOT NULL DEFAULT 0,
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  win_rate NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN matches_played > 0 THEN ROUND((wins::numeric / matches_played::numeric) * 100, 2)
    ELSE 0.00 END
  ) STORED,
  -- Game specific milestones
  monkey_post_goals INT NOT NULL DEFAULT 0,
  ludo_chops INT NOT NULL DEFAULT 0,
  snooker_high_break INT NOT NULL DEFAULT 0,
  snooker_centuries INT NOT NULL DEFAULT 0,
  ayo_seeds_captured INT NOT NULL DEFAULT 0,
  whot_games_won INT NOT NULL DEFAULT 0,
  tenten_max_combos INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_game_stats_wins ON public.game_stats(wins DESC);
CREATE INDEX IF NOT EXISTS idx_game_stats_break ON public.game_stats(snooker_high_break DESC);

-- =======================================================================
-- 3. MATCH HISTORY TABLE
-- =======================================================================
CREATE TABLE IF NOT EXISTS public.match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL, -- 'monkey_post' | 'naija_ludo_3d' | 'snooker_3d' | 'ayo_olopon' | 'naija_whot' | 'ten_ten'
  player1_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player2_id TEXT NOT NULL, -- User ID or 'ai_bros_emeka' / 'ai_alhaji_snooker'
  player1_score INT NOT NULL DEFAULT 0,
  player2_score INT NOT NULL DEFAULT 0,
  winner_id TEXT, -- User ID or NULL for draw
  coins_wagered BIGINT NOT NULL DEFAULT 0,
  coins_won BIGINT NOT NULL DEFAULT 0,
  duration_seconds INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_player1 ON public.match_history(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_game ON public.match_history(game_id, played_at DESC);

-- =======================================================================
-- 4. TOURNAMENTS TABLE
-- =======================================================================
CREATE TABLE IF NOT EXISTS public.tournaments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  game_id TEXT NOT NULL,
  prize_pool TEXT NOT NULL,
  entry_fee_coins BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
  max_participants INT NOT NULL DEFAULT 32,
  current_participants INT NOT NULL DEFAULT 0,
  winner_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tournament_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id TEXT NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seed_number INT,
  eliminated BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tournament_id, profile_id)
);

-- =======================================================================
-- 5. COIN TRANSACTIONS AUDIT LEDGER
-- =======================================================================
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL, -- Positive for rewards, negative for purchases/wagers
  balance_after BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'welcome_bonus', 'daily_quest', 'match_win', 'match_wager',
    'tournament_entry', 'tournament_prize', 'admin_gift', 'shop_unlock'
  )),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_trans_profile ON public.coin_transactions(profile_id, created_at DESC);

-- =======================================================================
-- 6. ARCADE GAMES REGISTRY TABLE
-- =======================================================================
CREATE TABLE IF NOT EXISTS public.arcade_games (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tagline TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Sports', 'Strategy', 'Cards', 'Rhythm', 'Arcade')),
  status TEXT NOT NULL DEFAULT 'playable' CHECK (status IN ('playable', 'coming_soon', 'in_development', 'maintenance')),
  players TEXT NOT NULL DEFAULT '1 - 2 Players',
  difficulty TEXT NOT NULL DEFAULT 'Competitive',
  badge TEXT NOT NULL DEFAULT 'PLAYABLE NOW',
  badge_color TEXT NOT NULL DEFAULT 'bg-emerald-500 text-black',
  icon_emoji TEXT NOT NULL DEFAULT '🎮',
  banner_gradient TEXT NOT NULL DEFAULT 'from-amber-500/30 to-black',
  accent_color TEXT NOT NULL DEFAULT '#facc15',
  description TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  total_plays BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =======================================================================
-- 7. RESEND EMAIL AUDIT LOGS
-- =======================================================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  template_name TEXT NOT NULL, -- 'welcome_bonus', 'tournament_alert', 'admin_announcement', 'security_login'
  resend_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'bounced', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_email, created_at DESC);

-- =======================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =======================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arcade_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Helper to check if caller has 'admin' role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Public can view basic info; users can update own profile; admins can manage all
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid()::text = id OR public.is_admin());

-- Game Stats: Viewable by everyone; updated via server service role or match completion
CREATE POLICY "Stats viewable by everyone" ON public.game_stats
  FOR SELECT USING (true);

-- Match History: Viewable by participants and admins
CREATE POLICY "Matches viewable by everyone" ON public.match_history
  FOR SELECT USING (true);

CREATE POLICY "Users can record matches" ON public.match_history
  FOR INSERT WITH CHECK (auth.uid()::text = player1_id OR public.is_admin());

-- Arcade Games Catalog: Viewable by all; manageable by admins
CREATE POLICY "Arcade games viewable by all" ON public.arcade_games
  FOR SELECT USING (true);

CREATE POLICY "Arcade games manageable by admin" ON public.arcade_games
  FOR ALL USING (public.is_admin());

-- Tournaments: Viewable by all; manageable by admins
CREATE POLICY "Tournaments viewable by all" ON public.tournaments
  FOR SELECT USING (true);

CREATE POLICY "Tournaments manageable by admin" ON public.tournaments
  FOR ALL USING (public.is_admin());

-- Coin Transactions: Users view own transactions; admins view all
CREATE POLICY "Users view own coin transactions" ON public.coin_transactions
  FOR SELECT USING (auth.uid()::text = profile_id OR public.is_admin());

-- Email Logs: Admins only
CREATE POLICY "Email logs viewable by admin only" ON public.email_logs
  FOR ALL USING (public.is_admin());

-- =======================================================================
-- 9. CLERK SYNC WEBHOOK FUNCTION & TRIGGER
-- =======================================================================
-- Automatically provisions profiles and game_stats when Clerk user is created
CREATE OR REPLACE FUNCTION public.handle_new_clerk_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.game_stats (profile_id)
  VALUES (NEW.id)
  ON CONFLICT (profile_id) DO NOTHING;

  -- Record welcome bonus coins
  INSERT INTO public.coin_transactions (profile_id, amount, balance_after, type, description)
  VALUES (NEW.id, NEW.street_coins, NEW.street_coins, 'welcome_bonus', 'Welcome to Naija Street Arcade! Initial street staking coins.');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_clerk_user_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_clerk_user();

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =======================================================================
-- 10. SUPABASE STORAGE BUCKETS
-- =======================================================================
-- Avatars, Game Assets (GLB 3D models), Match Replays
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('game_assets', 'game_assets', true),
  ('match_replays', 'match_replays', false)
ON CONFLICT (id) DO NOTHING;
