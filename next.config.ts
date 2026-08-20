import type { NextConfig } from 'next';
import webpack from 'webpack';

const nextConfig: NextConfig = {
  webpack: (config, { isServer, nextRuntime }) => {
    // For edge runtime ignore Node.js‑specific database modules.
    if (isServer && nextRuntime === 'edge') {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp:
            /^pg$|^pg-native$|^pg-connection-string$|^pgpass$|^drizzle-orm\/node-postgres$/,
        }),
      );
    }
    return config;
  },
};

export default nextConfig;
