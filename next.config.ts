import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React Compiler (moved from experimental in Next.js 16.1)
  reactCompiler: true,
  // Use Turbopack for dev and build
  turbopack: {
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
};

export default nextConfig;
