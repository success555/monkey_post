import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import '../tailwind.css';

export const metadata: Metadata = {
  title: 'Naija Street Arcade | 3D African Games, Football & Derbies',
  description: 'Play 3D Monkey Post, Ayò Olọ́pọ́n, Naija Whot, Ten-Ten Rhythm Duel, Naija Ludo 3D, and Championship Snooker 3D on Lagos street asphalt.',
  icons: {
    icon: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Naija Street Arcade',
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
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
