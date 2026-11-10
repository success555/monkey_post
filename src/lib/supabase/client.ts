import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sample-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sample_anon_key';

// Client-side Supabase client (respects Row Level Security RLS)
export const createBrowserSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createBrowserSupabaseClient();

