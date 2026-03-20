/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@prism/ui', '@prism/auth'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;
