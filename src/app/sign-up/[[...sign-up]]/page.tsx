'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Lock, Mail, ArrowLeft, Sparkles, Check, Shield, User, 
  Coins, Zap, Gamepad2, Trophy, Eye, EyeOff, Flame 
} from 'lucide-react';
import { authStore } from '@/auth/authStore';
import { soundFX } from '@/audio/SoundFX';

const AVATAR_OPTIONS = ['⚽', '🎱', '🎲', '🪵', '💃', '👑', '⚡', '🦁', '🏆', '🔥'];

export default function SignUpPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('⚽');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !email.trim()) {
      setErrorMessage('Please enter both a username and email address');
      return;
    }

    if (password && confirmPassword && password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);

    // 1. Register in Auth Store (automatically grants 1,500 Street Coins)
    const finalDisplayName = displayName.trim() || username.trim();
    const res = authStore.register(username.trim(), email.trim(), finalDisplayName, selectedAvatar);

    // 2. Dispatch background API sync to Supabase & Resend
    try {
      await fetch('/api/webhooks/clerk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'user.created',
          data: {
            id: `usr_${Date.now()}`,
            email_addresses: [{ email_address: email.trim() }],
            username: username.trim(),
            first_name: finalDisplayName,
            image_url: selectedAvatar
          }
        })
      });
    } catch (e) {
      // Local fallback continues smoothly
    }

    setIsLoading(false);

    if (res.success) {
      soundFX.playWhistle(true);
      router.push('/');
    } else {
      setErrorMessage(res.error || 'Registration failed. Try a different username.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-white flex flex-col justify-between overflow-y-auto overflow-x-hidden font-sans select-none relative">
      {/* Background Street Asphalt Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/15 via-zinc-950/90 to-black pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* TOP HEADER */}
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
          href="/sign-in"
          className="text-xs font-bold text-zinc-300 hover:text-white transition-colors"
        >
          Sign In
        </Link>
      </header>

      {/* MAIN REGISTRATION CONTAINER */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-6 w-full max-w-5xl mx-auto my-auto">
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 bg-zinc-900/80 border border-white/15 rounded-3xl p-4 sm:p-8 backdrop-blur-xl shadow-2xl overflow-hidden">

          {/* LEFT COLUMN: STREET BONUS & PERKS */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-6">
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                <Flame className="w-3 h-3" />
                <span>NEW RECRUIT STREET VAULT BONUS</span>
              </div>

              <h2 className="font-display font-black text-lg sm:text-2xl text-white tracking-wide">
                JOIN THE STREET DERBIES
              </h2>

              <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
                Create your player card to claim your welcome coin package and compete across all six 3D Nigerian games.
              </p>

              {/* 1,500 COINS HIGHLIGHT BOX */}
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-zinc-950 to-zinc-950 border border-amber-400/50 shadow-xl space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🪙</span>
                  <div>
                    <span className="text-xs font-mono font-bold text-zinc-400 uppercase block">Welcome Grant</span>
                    <span className="font-display font-black text-lg sm:text-xl text-amber-400">
                      1,500 STREET COINS
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-300 pt-1">
                  Credited immediately to your vault for derby entry and match stakes.
                </p>
              </div>

              {/* Street Perks List */}
              <div className="space-y-1.5 text-xs text-zinc-300">
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Custom street avatar & player rank badge</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Climb Lagos, Warri & Kano street leaderboards</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant access to Monkey Post, Ludo 3D & Snooker</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-xs text-zinc-400">
              Already have an account?{' '}
              <Link href="/sign-in" className="text-amber-400 font-bold hover:underline">
                Sign in here
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: REGISTRATION FORM */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                <h3 className="font-display font-black text-sm sm:text-base text-white">
                  CREATE YOUR STREET PROFILE
                </h3>
                <span className="text-[10px] font-mono text-amber-400 font-bold">
                  Instant Registration
                </span>
              </div>

              {errorMessage && (
                <div className="mb-3 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold animate-in fade-in">
                  ⚠️ {errorMessage}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-3">
                {/* 1. Pick Avatar Emoji */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wide flex items-center justify-between">
                    <span>1. Pick Your Street Avatar</span>
                    <span className="text-amber-400 font-mono text-[10px]">Selected: {selectedAvatar}</span>
                  </label>
                  <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all active:scale-90 shrink-0 ${
                          selectedAvatar === av
                            ? 'bg-amber-400 border-2 border-white scale-110 shadow-lg shadow-amber-400/40'
                            : 'bg-zinc-950 border border-white/10 hover:bg-zinc-800'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Username & Display Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wide">
                      Username *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. lagos_striker"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-500 text-xs font-medium focus:outline-none focus:border-amber-400 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wide">
                      Display Nickname
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Chidi Striker ⚡"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-500 text-xs font-medium focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                {/* 3. Email Address */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wide">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="player@naijastreet.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-500 text-xs font-medium focus:outline-none focus:border-amber-400 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* 4. Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wide">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-500 text-xs font-medium focus:outline-none focus:border-amber-400 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wide">
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-500 text-xs font-medium focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Submit Register Action */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 text-black font-display font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl shadow-amber-400/20 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50 mt-3"
                >
                  <Coins className="w-4 h-4 fill-current" />
                  <span>{isLoading ? 'CREATING PROFILE...' : 'CLAIM 1,500 COINS & PLAY'}</span>
                </button>
              </form>
            </div>

            <p className="text-[10px] text-center text-zinc-500 font-sans pt-1 border-t border-white/10">
              Synced with Supabase Postgres & Resend Transactional Email.
            </p>
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
