import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-expect-error: allowedDevOrigins might not be in the NextConfig type yet depending on the exact minor version
  allowedDevOrigins: ["192.168.1.92", "localhost"],
};

export default nextConfig;
