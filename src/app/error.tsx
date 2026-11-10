'use client';

import React from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-zinc-950 text-white flex flex-col items-center justify-center min-h-screen font-sans p-4 text-center select-none">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-3xl mb-4 shadow-lg shadow-amber-500/20">
        🦁
      </div>
      <h1 className="font-display font-black text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
        SOMETHING WENT WRONG!
      </h1>
      <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-sm">
        {error?.message || 'An unexpected error occurred in the arena.'}
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-black font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 transition-all active:scale-95"
      >
        TRY AGAIN
      </button>
    </div>
  );
}
