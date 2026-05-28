import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'latam.alura.bio',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
