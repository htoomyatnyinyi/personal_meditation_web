import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /* config options here */
  // // Explicitly handle MP3 for Turbopack/Webpack fallback
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.module.rules.push({
  //       test: /\.(mp3|wav)$/,
  //       type: "asset/resource",
  //       generator: {
  //         filename: "static/media/[name].[hash][ext]",
  //       },
  //     });
  //   }
  //   return config;
  // },
  // // Turbopack fallback if needed (disables webpack conflicts)
  // experimental: {
  //   turbopack: true, // Keep enabled, but add root if using linked deps
  // },
};

export default nextConfig;
