import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Disable React Compiler (requires babel-plugin-react-compiler package)
  // reactCompiler: true,
  // Use Turbopack for dev and build
  turbopack: {
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  output: 'standalone',
};

export default nextConfig;
