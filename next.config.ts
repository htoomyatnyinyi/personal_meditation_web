import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Explicitly handle MP3 for Turbopack/Webpack fallback
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.module.rules.push({
        test: /\.(mp3|wav)$/,
        type: "asset/resource",
        generator: {
          filename: "static/media/[name].[hash][ext]",
        },
      });
    }
    return config;
  },
  experimental: {
    // Turbopack is not available as a configuration option in this version
  },
};

export default nextConfig;
