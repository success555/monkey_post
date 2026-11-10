import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import '../index.css';

export const metadata: Metadata = {
  title: 'Naija Street Arcade | 3D African Games, Football & Derbies',
  description: 'Play 3D Monkey Post, Ayò Olọ́pọ́n, Naija Whot, Ten-Ten Rhythm Duel, Naija Ludo 3D, and Championship Snooker 3D on Lagos street asphalt.',
  icons: {
    icon: '/favicon.ico',
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
        <head>
          <meta key="meta-apple-1" name="apple-mobile-web-app-capable" content="yes" />
          <meta key="meta-apple-2" name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta key="meta-mobile" name="mobile-web-app-capable" content="yes" />
          <meta key="meta-screen-ori" name="screen-orientation" content="landscape" />
          <meta key="meta-x5-ori" name="x5-orientation" content="landscape" />
          {/* Google Fonts */}
          <link key="font-pre-1" rel="preconnect" href="https://fonts.googleapis.com" />
          <link key="font-pre-2" rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            key="font-link"
            href="https://fonts.googleapis.com/css2?family=Bungee&family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap"
            rel="stylesheet"
          />
          {/* Tailwind CSS CDN & Naija Custom Theme */}
          <script key="tw-cdn" src="https://cdn.tailwindcss.com"></script>
          <script
            key="tw-cfg"
            dangerouslySetInnerHTML={{
              __html: `
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
              `,
            }}
          />
        </head>
        <body className="bg-zinc-950 text-white font-sans antialiased overflow-x-hidden w-full min-h-screen">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
