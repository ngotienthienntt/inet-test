import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['phobia-nearest-agreeably.ngrok-free.dev'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:3001/uploads/:path*',
      },
    ]
  },
};

export default nextConfig;
