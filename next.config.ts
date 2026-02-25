import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["socket.io", "ioredis", "@socket.io/redis-adapter"],
};

export default nextConfig;
