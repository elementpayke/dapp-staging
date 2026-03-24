import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: ["@coinbase/onchainkit"],
  },
  // Turbopack equivalent of the webpack resolve.alias below
  turbopack: {
    resolveAlias: {
      "@react-native-async-storage/async-storage": { browser: "" },
    },
  },
  // Ensure proper handling of dynamic imports and client-side code
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      // Handle @react-native-async-storage/async-storage for MetaMask SDK
      config.resolve.alias = {
        ...config.resolve.alias,
        "@react-native-async-storage/async-storage": false,
      };
    }
    return config;
  },
};

export default bundleAnalyzer(nextConfig);