import React, { useState } from 'react';
import { Shield, Lock, X, KeyRound, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { authStore } from '../auth/authStore';
import { soundFX } from '../audio/SoundFX';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = authStore.loginAsAdmin(passcode);
    if (res.success) {
      soundFX.playWhistle(true);
      onSuccess();
      onClose();
    } else {
      setError(res.error || 'Access denied.');
    }
  };

  const handleInstantAdminLogin = () => {
    authStore.loginAsAdmin('admin123');
    soundFX.playWhistle(true);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-sm bg-zinc-900 border border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl text-white overflow-hidden">
        {/* Ambient Gold Radial */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-sm sm:text-base text-amber-400">
                ADMIN ACCESS GATE
              </h3>
              <p className="text-[10px] text-zinc-400">Restricted Arcade Operations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-medium mb-3 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-zinc-300 mb-1">
              Admin Passkey / PIN
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter admin passkey (e.g. admin123)"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-white/15 text-white text-xs focus:border-amber-400 outline-none"
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">Default test passkey: <code className="text-amber-400">admin123</code> or <code className="text-amber-400">7788</code></p>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
          >
            <span>Authenticate Admin</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Fast Dev Sign-in */}
        <div className="mt-4 pt-3 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={handleInstantAdminLogin}
            className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-xs text-amber-300 font-bold flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>1-Click Quick Admin Sign-In</span>
          </button>
        </div>
      </div>
    </div>
  );
};

