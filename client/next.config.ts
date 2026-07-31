import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No turbopack here — that's a dev-only flag (next dev --turbo)
  // Production build always uses webpack
};

export default nextConfig;
