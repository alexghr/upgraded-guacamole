/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@aztec/aztec.js'],
  },
  webpack(config, { isServer, dev }) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      syncWebAssembly: true,
      topLevelAwait: true,
      layers: true,
    };

    if (!isServer) {
      config.resolve.fallback = { fs: false };
    }

    return config;
  },
};

export default nextConfig;
