import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import Script from 'next/script';
import '../index.css';

export const metadata: Metadata = {
  title: 'Naija Street Arcade | 3D African Games, Football & Derbies',
  description: 'Play 3D Monkey Post, Ayò Olọ́pọ́n, Naija Whot, Ten-Ten Rhythm Duel, Naija Ludo 3D, and Championship Snooker 3D on Lagos street asphalt.',
  icons: {
    icon: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Naija Arcade',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'screen-orientation': 'landscape',
    'x5-orientation': 'landscape',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_d29ydGh5LW1hbnRpcy0zNjIzLmNsZXJrLmFjY291bnRzLmRldiQ';

  return (
    <ClerkProvider publishableKey={clerkKey}>
      <html lang="en">
        <body className="bg-zinc-950 text-white font-sans antialiased overflow-x-hidden w-full min-h-screen">
          <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
          <Script id="tailwind-config" strategy="beforeInteractive">
            {`
              tailwind.config = {
                theme: {
                  extend: {
                    fontFamily: {
                      sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
                      display: ['Bungee', 'cursive', 'sans-serif']
                    },
                    colors: {
                      naija: {
                        green: '#008751',
                        gold: '#fbbf24',
                        sand: '#b36b41',
                        brick: '#78350f'
                      }
                    }
                  }
                }
              };
            `}
          </Script>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
