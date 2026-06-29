import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["victory-vendor", "recharts"],
  turbopack: {
    resolveAlias: {
      "victory-vendor/d3-shape": "d3-shape",
      "victory-vendor/d3-scale": "d3-scale",
      "victory-vendor/d3-array": "d3-array",
      "victory-vendor/d3-interpolate": "d3-interpolate",
      "victory-vendor/d3-ease": "d3-ease",
      "victory-vendor/d3-time": "d3-time",
      "victory-vendor/d3-timer": "d3-timer",
    },
  },
};

export default nextConfig;
