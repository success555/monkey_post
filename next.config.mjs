// Ensure build-safe default environment variables for Clerk & Supabase during static deployment builds
if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_d29ydGh5LW1hbnRpcy0zNjIzLmNsZXJrLmFjY291bnRzLmRldiQ';
}
if (!process.env.CLERK_SECRET_KEY) {
  process.env.CLERK_SECRET_KEY = 'sk_test_IqR7IWp75y6H6TN1VjHU4odKXiOdHUntT09yB3GznN';
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['three', 'lucide-react', 'canvas-confetti'],
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      {
        source: '/dashbord',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/sign-in',
        permanent: true,
      },
      {
        source: '/login-in',
        destination: '/sign-in',
        permanent: true,
      },
      {
        source: '/signin',
        destination: '/sign-in',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/sign-up',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/sign-up',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
