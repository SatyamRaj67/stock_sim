/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./env.js";

import type { NextConfig } from "next";

// Import the bundle analyzer plugin
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import("next").NextConfig} */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  serverExternalPackages: [
    "bcryptjs",
    "next-auth",
    "next-auth/react",
    "next-auth/providers",
  ],
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      // Radix UI components
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-slot",
      "@radix-ui/react-label",
      "@radix-ui/react-tooltip",
      // Other potential candidates
      "cmdk",
      "class-variance-authority",
    ],

    reactCompiler: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

// Wrap the config with the analyzer
export default withBundleAnalyzer(nextConfig);
