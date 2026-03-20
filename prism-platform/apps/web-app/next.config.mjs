/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  basePath: isProd ? '/prism-1.2' : '',
  assetPrefix: isProd ? '/prism-1.2/' : '',
  images: { unoptimized: true },
  transpilePackages: ['@prism/ui', '@prism/auth'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
};

export default nextConfig;
