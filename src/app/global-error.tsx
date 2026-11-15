'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title>Arena Error - Naija Street Arcade</title>
      </head>
      <body style={{ backgroundColor: '#09090b', color: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '1rem', textAlign: 'center', margin: 0 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 16 }}>
          🦁
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b', margin: '0 0 8px 0' }}>
          SOMETHING WENT WRONG!
        </h1>
        <p style={{ fontSize: 13, color: '#a1a1aa', maxWidth: 360, margin: '0 0 24px 0' }}>
          {error?.message || 'An unexpected error occurred in the arena.'}
        </p>
        <button
          onClick={() => reset()}
          style={{ padding: '10px 24px', borderRadius: 12, backgroundColor: '#f59e0b', color: '#000000', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', cursor: 'pointer' }}
        >
          RELOAD MATCH
        </button>
      </body>
    </html>
  );
}
