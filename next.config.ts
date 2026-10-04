import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Build workers are capped instead of following the machine's core count.
    // Next starts one per CPU, and Render's build hosts report many CPUs but
    // allow 8GB: every deploy from 30 September onwards died with "ran out of
    // memory (used over 8GB) while building", while the old build kept serving
    // and nothing said why. Four workers keep the build well inside the limit
    // whatever host it lands on.
    cpus: 4,
  },
};

export default nextConfig;
