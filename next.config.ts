import type { NextConfig } from 'next';
import webpack from 'webpack';

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^pg$|^pg-native$/,
        }),
      );
    }
    return config;
  },
};

export default nextConfig;
