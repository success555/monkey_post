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
    ];
  },
};

export default nextConfig;
