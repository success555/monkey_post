export const dynamic = 'force-dynamic';

import React from 'react';
import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full bg-zinc-950 text-white flex flex-col justify-between items-center relative overflow-y-auto font-sans select-none px-4 py-3 sm:py-6">
      {/* Background Street Glow & Asphalt Grid */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/15 via-zinc-950/90 to-black pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

      {/* TOP HEADER */}
      <header className="relative z-10 w-full max-w-4xl py-2 flex items-center justify-between border-b border-white/10 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-lg shadow-lg shadow-amber-500/20 shrink-0">
            🦁
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-display font-black text-xs sm:text-base tracking-wider text-white uppercase drop-shadow-md">
                NAIJA STREET ARCADE
              </h1>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-400 text-black uppercase">
                SIGN IN
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-sans hidden xs:block">
              Sign In with Clerk to Access Your Street Profile
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 transition-all active:scale-95 shadow-md"
        >
          <span>Skip to Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
        </Link>
      </header>

      {/* CENTER: OFFICIAL CLERK SIGN-IN COMPONENT */}
      <main className="relative z-10 my-auto flex flex-col items-center justify-center py-4 w-full">
        <div className="mb-3 text-center">
          <span className="inline-flex items-center space-x-1.5 text-[10px] font-mono px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>CLERK AUTHENTICATION • NAIJA STREET ARCADE</span>
          </span>
        </div>

        {/* Official Clerk <SignIn /> */}
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              card: 'border border-white/10 shadow-2xl bg-zinc-900/95 backdrop-blur-xl',
              headerTitle: 'font-display font-black text-white text-lg',
              headerSubtitle: 'text-zinc-400 text-xs',
              formButtonPrimary: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-black uppercase tracking-wider hover:from-amber-300 shadow-lg shadow-amber-400/20',
              footerActionLink: 'text-amber-400 hover:text-amber-300 font-bold',
              socialButtonsBlockButton: 'bg-zinc-950 border border-white/10 text-white hover:bg-zinc-800',
              formFieldInput: 'bg-zinc-950 border-white/10 text-white',
            }
          }}
        />
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full max-w-4xl py-2.5 text-center text-[10.5px] text-zinc-500 border-t border-white/5 shrink-0 flex items-center justify-between">
        <span>Warri No Dey Carry Last • Lagos Street Sports Gaming Ltd</span>
        <Link href="/sign-up" className="text-amber-400/80 hover:text-amber-400 font-bold">
          New Player? Sign Up Here →
        </Link>
      </footer>
    </div>
  );
}

