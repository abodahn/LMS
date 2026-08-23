import type { MetadataRoute } from "next";
import { branding } from "@/lib/branding";

/**
 * What an installed copy of the academy looks like on a phone.
 *
 * Installing matters here more than it does for most internal tools: a large
 * part of the workforce is on a factory floor with a phone and patchy Wi-Fi, and
 * an icon on the home screen is the difference between training that happens and
 * training that requires finding a laptop.
 *
 * `display: standalone` drops the browser chrome, which also removes the address
 * bar — so the offline behaviour in public/sw.js has to be good, because there
 * is no reload button to fall back on.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${branding.platformName} — ${branding.organizationName}`,
    short_name: branding.platformName,
    description: branding.tagline,
    start_url: "/",
    // Sign-in is the honest landing place for a shared device, and the app
    // redirects there anyway when the session has expired.
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#FFFFFF",
    // Matches the header, so the status bar does not sit on a seam.
    theme_color: branding.colors.ink,
    // Arabic is the majority language here; the launcher honours this.
    dir: "auto",
    lang: "en",
    categories: ["education", "business", "productivity"],
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/brand/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // The four things somebody opens the app to do, straight from a long-press
    // on the icon.
    shortcuts: [
      { name: "My Learning", url: "/learning" },
      { name: "Training Sessions", url: "/sessions" },
      { name: "Course Catalog", url: "/catalog" },
      { name: "AI Skill Passport", url: "/passport" },
    ],
  };
}
