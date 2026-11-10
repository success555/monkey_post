import React, { useState } from 'react';
import { X, User, Mail, Lock, Sparkles, Check, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { authStore } from '../auth/authStore';
import { soundFX } from '../audio/SoundFX';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTab?: 'login' | 'register';
}

const AVATAR_OPTIONS = ['⚽', '🎱', '🎲', '🪵', '💃', '👑', '⚡', '🦁', '🏆', '🔥'];

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'login'
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('⚽');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emailOrUsername.trim()) {
      setErrorMessage('Please enter your email or username');
      return;
    }

    const res = authStore.login(emailOrUsername, password);
    if (res.success) {
      soundFX.playWhistle(true);
      onSuccess?.();
      onClose();
    } else {
      setErrorMessage(res.error || 'Login failed. Check your credentials.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !email.trim()) {
      setErrorMessage('Please fill in username and email');
      return;
    }

    const res = authStore.register(username, email, displayName, selectedAvatar);
    if (res.success) {
      soundFX.playWhistle(true);
      onSuccess?.();
      onClose();
    } else {
      setErrorMessage(res.error || 'Registration failed');
    }
  };

  const handleQuickDemoLogin = () => {
    authStore.login('player@naijastreet.com', 'player123');
    soundFX.playWhistle(true);
    onSuccess?.();
    onClose();
  };

  const handleGuestPlay = () => {
    authStore.register(`guest_${Math.floor(1000 + Math.random() * 9000)}`, `guest_${Date.now()}@guest.ng`, 'Guest Player', '🎮');
    soundFX.playWhistle(true);
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl text-white overflow-hidden max-h-[92vh] flex flex-col justify-between">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🦁</span>
            <div>
              <h3 className="font-display text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
                NAIJA ARCADE ACCOUNT
              </h3>
              <p className="text-[10px] text-zinc-400">Street Leaderboards, Coins & Match Stats</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auth Tabs */}
        <div className="flex rounded-xl bg-zinc-950 p-1 border border-white/10 my-3">
          <button
            onClick={() => { setTab('login'); setErrorMessage(''); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'login' ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setErrorMessage(''); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'register' ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Create Gamer Account
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-medium mb-3">
            {errorMessage}
          </div>
        )}

        {/* LOGIN FORM */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">Username or Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="e.g. lagos_striker or player@naijastreet.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs focus:border-amber-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs focus:border-amber-400 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all mt-1"
            >
              Sign In to Arcade
            </button>
          </form>
        )}

        {/* REGISTRATION FORM */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-2.5 overflow-y-auto max-h-[50vh] pr-1">
            {/* Avatar Selector */}
            <div>
              <label className="block text-[10.5px] font-bold text-zinc-300 mb-1">Pick Street Avatar</label>
              <div className="flex flex-wrap gap-1.5">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all ${
                      selectedAvatar === av ? 'bg-amber-500 scale-110 shadow-md ring-2 ring-white' : 'bg-zinc-800 hover:bg-zinc-700'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-zinc-300 mb-0.5">Gamer Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. ojuelegba_king"
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-zinc-300 mb-0.5">Display Nickname</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Chidi Baller ⚡"
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-zinc-300 mb-0.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gamer@naijastreet.com"
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs focus:border-amber-400 outline-none"
              />
            </div>

            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center space-x-2 text-[10px] text-emerald-300 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Sign-up bonus: Get 1,500 Street Coins instantly!</span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 text-black font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
            >
              Claim Coins & Register
            </button>
          </form>
        )}

        {/* QUICK 1-CLICK DEMO & GUEST ACTIONS */}
        <div className="pt-3 mt-3 border-t border-white/10 flex flex-col space-y-2">
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className="w-full py-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 border border-white/10 text-amber-300 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>1-Click Demo Login (Chidi Striker ⚡)</span>
          </button>

          <button
            type="button"
            onClick={handleGuestPlay}
            className="text-[11px] text-zinc-400 hover:text-zinc-200 text-center font-medium"
          >
            Play as Instant Anonymous Guest →
          </button>
        </div>
      </div>
    </div>
  );
};
