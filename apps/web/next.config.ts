import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@nook/trpc',
    '@nook/types',
    '@nook/utils',
    '@nook/ui',
    '@nook/server',
  ],
};

export default nextConfig;
