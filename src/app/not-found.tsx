export const dynamic = 'force-dynamic';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-3xl mb-4 shadow-lg">
        🦁
      </div>
      <h1 className="font-display font-black text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
        404 — STREET ARENA NOT FOUND
      </h1>
      <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-sm">
        You seem to have strayed off the pitch! Return to the Lagos Street Arcade Hub to jump into the action.
      </p>
      <Link
        href="/"
        className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-black font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 transition-all active:scale-95"
      >
        RETURN TO ARCADE HUB
      </Link>
    </div>
  );
}

