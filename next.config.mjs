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
        source: '/sign-in/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/sign-in',
        destination: '/',
        permanent: true,
      },
      {
        source: '/sign-up/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/sign-up',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
