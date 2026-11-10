/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['three', 'lucide-react', 'canvas-confetti'],
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
