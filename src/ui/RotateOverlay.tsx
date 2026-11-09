import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw, Maximize2, ShieldAlert } from 'lucide-react';

export const RotateOverlay: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState<boolean>(false);

  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window === 'undefined') return;
      // If height is greater than width, screen is currently in portrait
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
    };

    checkOrientation();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    // Modern Screen Orientation API listener if supported
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', checkOrientation);
    }

    // Media query fallback
    const mql = window.matchMedia('(orientation: portrait)');
    const handleMqlChange = (e: MediaQueryListEvent) => {
      setIsPortrait(e.matches);
    };
    if (mql.addEventListener) {
      mql.addEventListener('change', handleMqlChange);
    }

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', checkOrientation);
      }
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handleMqlChange);
      }
    };
  }, []);

  const handleRequestLandscape = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      // Attempt Screen Orientation lock if browser supports it
      const screenAny = window.screen as any;
      if (screenAny?.orientation?.lock) {
        await screenAny.orientation.lock('landscape');
      }
    } catch (err) {
      console.log('[RotateOverlay] Orientation lock or fullscreen skipped:', err);
    }
  };

  if (!isPortrait) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden touch-none animate-in fade-in duration-200">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Street Football League Badge */}
      <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-400 text-[11px] font-black tracking-widest uppercase mb-5 shadow-lg">
        <span>WARRI NO DEY CARRY LAST</span>
      </div>

      {/* Animated Phone Graphic Rotating between portrait and landscape */}
      <div className="relative w-28 h-28 flex items-center justify-center mb-6">
        {/* Glowing backdrop circle */}
        <div className="absolute inset-0 rounded-full bg-amber-500/10 border border-amber-500/30 animate-ping opacity-30" />
        <div className="w-24 h-24 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl relative">
          {/* Animated Rotating Smartphone */}
          <div
            className="transition-transform duration-700 ease-in-out"
            style={{
              animation: 'rotatePhone 2.6s cubic-bezier(0.4, 0, 0.2, 1) infinite'
            }}
          >
            <Smartphone className="w-12 h-12 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
          </div>

          {/* Rotation directional arrow badge */}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg border-2 border-zinc-900">
            <RotateCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>
      </div>

      {/* Main Alert Headline */}
      <h2 className="font-display text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 drop-shadow-md mb-2">
        PLEASE ROTATE YOUR DEVICE
      </h2>

      {/* Description */}
      <p className="text-zinc-300 text-xs sm:text-sm font-medium max-w-xs sm:max-w-sm mb-6 leading-relaxed">
        <strong className="text-white">Monkey Post 3D</strong> requires <span className="text-amber-400 font-bold">Landscape mode</span> for wide street pitch visibility and comfortable thumb touch controls.
      </p>

      {/* Status Comparison Pill */}
      <div className="flex items-center space-x-3 bg-zinc-900/90 border border-white/10 rounded-2xl px-4 py-2.5 mb-6 shadow-xl">
        <div className="flex items-center space-x-1.5 text-rose-400 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>Portrait: Locked</span>
        </div>
        <span className="text-zinc-600 font-bold">➔</span>
        <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-black">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Landscape: Ready</span>
        </div>
      </div>

      {/* Fullscreen & Rotate Trigger Button */}
      <button
        onClick={handleRequestLandscape}
        className="w-full max-w-xs py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all mb-4"
      >
        <Maximize2 className="w-4 h-4 fill-current shrink-0" />
        <span>ENTER FULLSCREEN & ROTATE</span>
      </button>

      {/* Auto-rotate reminder note */}
      <div className="flex items-center space-x-1.5 text-zinc-500 text-[10px] sm:text-xs">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-500/70 shrink-0" />
        <span>Ensure "Auto-Rotate" is enabled in your phone settings</span>
      </div>

      {/* Inline Keyframe Animation */}
      <style>{`
        @keyframes rotatePhone {
          0%, 15% {
            transform: rotate(0deg) scale(1);
          }
          45%, 70% {
            transform: rotate(90deg) scale(1.1);
          }
          90%, 100% {
            transform: rotate(0deg) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

