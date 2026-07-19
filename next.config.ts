import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium-min"],
  outputFileTracingIncludes: {
    "/api/browser-test/**/*": [
      "./node_modules/@sparticuz/chromium-min/**/*",
      "./node_modules/playwright-core/**/*",
    ],
    "/api/screenshot/**/*": [
      "./node_modules/@sparticuz/chromium-min/**/*",
      "./node_modules/playwright-core/**/*",
    ],
  },
};

export default nextConfig;
