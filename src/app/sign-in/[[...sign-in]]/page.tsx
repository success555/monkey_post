'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Lock, Mail, ArrowLeft, Sparkles, Check, Shield, User, 
  Coins, Zap, Gamepad2, Trophy, Eye, EyeOff 
} from 'lucide-react';
import { authStore } from '@/auth/authStore';
import { soundFX } from '@/audio/SoundFX';

export default function SignInPage() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emailOrUsername.trim()) {
      setErrorMessage('Please enter your email or username');
      return;
    }

    setIsLoading(true);
    const res = authStore.login(emailOrUsername, password);
    setIsLoading(false);

    if (res.success) {
      soundFX.playWhistle(true);
      router.push('/');
    } else {
      setErrorMessage(res.error || 'Login failed. Check your username or password.');
    }
  };

  const handleQuickDemoLogin = (email: string, pass: string) => {
    setErrorMessage('');
    const res = authStore.login(email, pass);
    if (res.success) {
      soundFX.playWhistle(true);
      router.push('/');
    } else {
      setErrorMessage(res.error || 'Demo login failed');
    }
  };

  const handleGuestPlay = () => {
    const guestId = `guest_${Math.floor(1000 + Math.random() * 9000)}`;
    const guestEmail = `${guestId}@streetarcade.ng`;
    authStore.register(guestId, guestEmail, `Street Guest ${guestId.slice(-4)}`, '🎮');
    soundFX.playWhistle(true);
    router.push('/');
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-white flex flex-col justify-between overflow-y-auto overflow-x-hidden font-sans select-none relative">
      {/* Background Lighting & Grid */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/15 via-zinc-950/90 to-black pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* TOP HEADER BAR */}
      <header className="relative z-10 w-full px-3 sm:px-8 py-2.5 sm:py-3.5 border-b border-white/10 bg-black/70 backdrop-blur-md flex items-center justify-between shrink-0">
        <Link
          href="/"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
          <span>Back to Arcade</span>
        </Link>

        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-base">
            🦁
          </div>
          <div>
            <h1 className="font-display font-black text-xs sm:text-sm tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
              NAIJA STREET ARCADE
            </h1>
          </div>
        </div>

        <Link
          href="/sign-up"
          className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center space-x-1"
        >
          <span>Create Account</span>
          <span className="text-[10px] hidden sm:inline">(+1,500 Coins)</span>
        </Link>
      </header>

      {/* MAIN CONTAINER (Responsive for Desktop & Mobile Horizontal Landscape) */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-6 w-full max-w-5xl mx-auto my-auto">
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 bg-zinc-900/80 border border-white/15 rounded-3xl p-4 sm:p-8 backdrop-blur-xl shadow-2xl overflow-hidden">
          
          {/* LEFT COLUMN: STREET VALUE PROPOSITION (Hidden or condensed in mobile landscape) */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-6">
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>OFFICIAL PLAYER PORTAL</span>
              </div>

              <h2 className="font-display font-black text-lg sm:text-2xl text-white tracking-wide">
                WELCOME BACK, STREET CHAMP!
              </h2>

              <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
                Log in to resume your ranking journey across Lagos, sync your coin vault, and challenge players in Monkey Post, Ludo & Snooker 3D.
              </p>

              {/* 3 Value bullets */}
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex items-center space-x-2 text-zinc-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Real-time cloud stat syncing & match history</span>
                </div>
                <div className="flex items-center space-x-2 text-zinc-300">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Coins className="w-3 h-3" />
                  </div>
                  <span>Street Vault balance & Derby prize wagering</span>
                </div>
                <div className="flex items-center space-x-2 text-zinc-300">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Trophy className="w-3 h-3" />
                  </div>
                  <span>6 Authentic Nigerian 3D games on 1 account</span>
                </div>
              </div>
            </div>

            {/* QUICK DEMO PLAYER CARDS (Tap to test immediately) */}
            <div className="pt-2 border-t border-white/10">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-2 font-bold">
                ⚡ 1-Click Demo Profiles (Instant Test)
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-left">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('player@naijastreet.com', 'player123')}
                  className="p-2 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 border border-white/10 text-[11px] font-bold text-zinc-200 transition-all active:scale-95 flex items-center space-x-1.5"
                >
                  <span className="text-sm">⚽</span>
                  <div className="truncate">
                    <div className="truncate">Chidi Striker</div>
                    <div className="text-[9px] text-amber-400 font-mono">🪙 3,500 Coins</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('admin@naijastreet.com', 'admin123')}
                  className="p-2 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 border border-amber-500/30 text-[11px] font-bold text-amber-300 transition-all active:scale-95 flex items-center space-x-1.5"
                >
                  <span className="text-sm">👑</span>
                  <div className="truncate">
                    <div className="truncate">Baba Admin</div>
                    <div className="text-[9px] text-emerald-400 font-mono">Root Access</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LOGIN FORM */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                <h3 className="font-display font-black text-sm sm:text-base text-white">
                  PLAYER SIGN IN
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  Clerk & Supabase Auth
                </span>
              </div>

              {errorMessage && (
                <div className="mb-3 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold animate-in fade-in">
                  ⚠️ {errorMessage}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-3">
                {/* Username or Email Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wide">
                    Username or Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      placeholder="e.g. lagos_striker or player@naijastreet.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-500 text-xs font-medium focus:outline-none focus:border-amber-400 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wide">
                      Password
                    </label>
                    <span className="text-[10px] text-zinc-400">Demo: player123</span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-500 text-xs font-medium focus:outline-none focus:border-amber-400 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 text-black font-display font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl shadow-amber-400/20 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50 mt-2"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>{isLoading ? 'AUTHENTICATING...' : 'SIGN IN & ENTER ARENA'}</span>
                </button>
              </form>
            </div>

            {/* GUEST PLAY & SIGN UP CALL TO ACTION */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleGuestPlay}
                  className="flex-1 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-bold transition-all active:scale-95 flex items-center justify-center space-x-1.5"
                >
                  <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Play as Guest</span>
                </button>

                <Link
                  href="/sign-up"
                  className="flex-1 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all active:scale-95 text-center"
                >
                  Create Account
                </Link>
              </div>

              <p className="text-[10px] text-center text-zinc-500 font-sans">
                By entering, you agree to fair street play and Nigeria Street Arcade Terms.
              </p>
            </div>

          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full py-2.5 px-4 text-center text-[10.5px] text-zinc-500 border-t border-white/5 bg-black/60 shrink-0">
        Warri No Dey Carry Last • Lagos Street Sports Gaming Ltd
      </footer>
    </div>
  );
}

