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
  /**
   * Baseline headers for every page. Framing is limited to the academy itself,
   * which is what stops a page being overlaid inside someone else's site — or
   * inside a SCORM package on a sibling hostname. SCORM files are left out:
   * their route sets its own policy, which in separate-hostname mode has to
   * let the academy frame them.
   */
  async headers() {
    return [
      {
        source: "/((?!api/scorm/).*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), payment=(), usb=(), interest-cohort=()" },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
