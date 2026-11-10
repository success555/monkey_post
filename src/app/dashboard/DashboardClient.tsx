'use client';

import dynamicModule from 'next/dynamic';
import React from 'react';

// Dynamically import the full 3D Arcade Engine and Hub with SSR turned off
const MainArcadeApp = dynamicModule(
  () => import('@/App').then((mod) => mod.App),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center text-white font-sans z-50">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-xl">🦁</div>
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 font-display">
          NAIJA STREET ARCADE
        </h1>
        <p className="text-xs text-zinc-400 mt-2 font-mono">Initializing 3D Street Games & WebGL Engine...</p>
      </div>
    )
  }
);

export default function DashboardClient() {
  return <MainArcadeApp />;
}
