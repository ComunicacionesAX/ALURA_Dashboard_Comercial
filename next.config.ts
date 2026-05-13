import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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