import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.1.154", "localhost", "127.0.0.1"],
  transpilePackages: ["@pos/config", "@pos/types", "@pos/utils"],
};

export default nextConfig;
