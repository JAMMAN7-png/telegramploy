import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Disable React Compiler (requires babel-plugin-react-compiler package)
  // reactCompiler: true,
  output: 'standalone',
  // Empty turbopack config to use Next.js 16 default (Turbopack)
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark bun:sqlite as external so it's not bundled during build
      config.externals = config.externals || [];
      config.externals.push('bun:sqlite');
    }
    return config;
  },
};

export default nextConfig;
