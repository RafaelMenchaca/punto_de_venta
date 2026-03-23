import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@pos/config", "@pos/types", "@pos/utils"],
};

export default nextConfig;
