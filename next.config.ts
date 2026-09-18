import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/res\.cloudinary\.com\//,
        handler: "CacheFirst",
        options: {
          cacheName: "cloudinary-media",
          expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["res.cloudinary.com"],
  },
  // Required to prevent server-only modules from being bundled in the browser
  serverExternalPackages: ["fluent-ffmpeg", "cloudinary", "@supabase/supabase-js"],
};

export default withPWA(withNextIntl(nextConfig));
