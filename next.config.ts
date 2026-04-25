import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["framer-motion", "@radix-ui/react-icons"]
  },
  // Empty turbopack config silences the Turbopack/webpack mismatch warning
  turbopack: {},
};

export default nextConfig;
