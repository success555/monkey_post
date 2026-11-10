import React, { useState } from 'react';
import { X, Trophy, Coins, Flame, LogOut, Check, Sparkles, Shield, User } from 'lucide-react';
import { UserProfile } from '../auth/types';
import { authStore } from '../auth/authStore';
import { soundFX } from '../audio/SoundFX';

interface UserProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const AVATARS = ['⚽', '🎱', '🎲', '🪵', '💃', '👑', '⚡', '🦁', '🔥', '🏆'];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onLogout
}) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    authStore.updateUserProfile({
      displayName,
      avatar: selectedAvatar
    });
    soundFX.playKick(0.5);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl text-white overflow-hidden space-y-4">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{selectedAvatar}</span>
            <div>
              <h3 className="font-display text-base text-white">{user.displayName}</h3>
              <p className="text-[11px] text-zinc-400 font-mono">@{user.username} • {user.rank}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Level and XP progress */}
        <div className="p-3 rounded-2xl bg-zinc-950 border border-white/5 space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-amber-400">Level {user.level}</span>
            <span className="text-zinc-400 font-mono">{user.xp} / {(user.level + 1) * 350} XP</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
              style={{ width: `${Math.min(100, (user.xp / ((user.level + 1) * 350)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-2xl bg-zinc-950 border border-white/5">
            <Coins className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <div className="text-[10px] text-zinc-400 uppercase font-bold">Coins</div>
            <div className="text-sm font-black text-amber-400 font-mono">🪙 {user.streetCoins.toLocaleString()}</div>
          </div>

          <div className="p-2.5 rounded-2xl bg-zinc-950 border border-white/5">
            <Trophy className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-[10px] text-zinc-400 uppercase font-bold">Win Rate</div>
            <div className="text-sm font-black text-emerald-400 font-mono">{user.stats.winRate}%</div>
          </div>

          <div className="p-2.5 rounded-2xl bg-zinc-950 border border-white/5">
            <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <div className="text-[10px] text-zinc-400 uppercase font-bold">Matches</div>
            <div className="text-sm font-black text-white font-mono">{user.stats.matchesPlayed}</div>
          </div>
        </div>

        {/* Edit Nickname & Avatar */}
        <div className="space-y-2 pt-1 border-t border-white/10">
          <label className="block text-[11px] font-bold text-zinc-300">Change Avatar</label>
          <div className="flex flex-wrap gap-1.5">
            {AVATARS.map(av => (
              <button
                key={av}
                type="button"
                onClick={() => setSelectedAvatar(av)}
                className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                  selectedAvatar === av ? 'bg-amber-500 scale-110 shadow-md ring-2 ring-white' : 'bg-zinc-800 hover:bg-zinc-700'
                }`}
              >
                {av}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-300 mb-1">Display Nickname</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs outline-none focus:border-amber-400"
              />
              <button
                onClick={handleSave}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase transition-all flex items-center space-x-1"
              >
                {isSaved ? <Check className="w-3.5 h-3.5" /> : <span>Save</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-2 border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-zinc-500">Member since {user.createdAt}</div>
          <button
            onClick={() => { onLogout(); onClose(); }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold active:scale-95 transition-all border border-rose-500/40"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

