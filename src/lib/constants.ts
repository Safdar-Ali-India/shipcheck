export const SITE_URL = "https://shipcheck.safdarali.in";

export const BRAND = {
  name: "ShipCheck",
  tagline: "Free visual regression testing — compare screenshots pixel by pixel.",
  url: SITE_URL,
  author: "Safdar Ali",
  authorUrl: "https://safdarali.in",
} as const;

export const KEYWORDS = [
  "visual regression testing free",
  "compare screenshots online",
  "ui diff checker",
  "website screenshot comparison",
  "visual diff tool",
  "pixel comparison tool",
  "image comparison online",
  "shipcheck",
] as const;

export const FAQ_ITEMS = [
  {
    question: "Is ShipCheck free?",
    answer:
      "Yes. ShipCheck is completely free with no signup, no watermarks, and no usage limits for standard comparisons.",
  },
  {
    question: "Are my images stored on a server?",
    answer:
      "No. Image uploads are processed in your browser using the Canvas API. Screenshots from URLs are captured temporarily and never permanently stored.",
  },
  {
    question: "What image formats are supported?",
    answer: "PNG, JPEG, and WebP are supported for uploads. URL mode captures full-page screenshots as PNG.",
  },
  {
    question: "How does the pixel diff work?",
    answer:
      "ShipCheck compares images pixel by pixel using the Canvas API. Changed pixels are highlighted in red. You can adjust the tolerance threshold to ignore minor anti-aliasing differences.",
  },
  {
    question: "Can I compare live website URLs?",
    answer:
      "Yes. Paste two URLs and ShipCheck captures full-page screenshots at your chosen viewport (desktop, tablet, or mobile), then runs a visual diff automatically.",
  },
  {
    question: "What is visual regression testing?",
    answer:
      "Visual regression testing detects unintended UI changes by comparing screenshots before and after a code deploy. ShipCheck makes this fast and accessible without expensive tooling.",
  },
] as const;

export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const ACCEPTED_IMAGE_EXT = ".png,.jpg,.jpeg,.webp";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const VIEWPORTS = {
  desktop: { width: 1280, height: 720, label: "Desktop", deviceScaleFactor: 1 },
  tablet: { width: 768, height: 1024, label: "Tablet", deviceScaleFactor: 2 },
  mobile: { width: 390, height: 844, label: "Mobile", deviceScaleFactor: 3 },
} as const;

export type ViewportId = keyof typeof VIEWPORTS;

export const DEFAULT_THRESHOLD = 0.1;

export const FEATURE_CARDS = [
  {
    title: "Pixel-perfect diff",
    description:
      "Canvas-based comparison highlights every changed pixel in bright red with a precise difference percentage.",
    icon: "scan" as const,
  },
  {
    title: "URL or upload",
    description:
      "Compare two uploaded images or paste live URLs — ShipCheck captures full-page screenshots automatically.",
    icon: "globe" as const,
  },
  {
    title: "Multiple views",
    description:
      "Side-by-side, overlay, diff-only, and split slider views with zoom, pan, and fullscreen support.",
    icon: "layout" as const,
  },
  {
    title: "Export reports",
    description:
      "Download diff images as PNG and metadata as JSON — ready for CI pipelines or design reviews.",
    icon: "download" as const,
  },
] as const;

export const USE_CASES = [
  "Catch unintended CSS changes before production deploys",
  "Compare staging vs production pages side by side",
  "Review design handoff accuracy against Figma exports",
  "Validate responsive layouts across desktop, tablet, and mobile",
  "Document visual changes in pull request reviews",
] as const;
