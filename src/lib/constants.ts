export const SITE_URL = "https://shipcheck.safdarali.in";

export const BRAND = {
  name: "ShipCheck",
  tagline: "Free AI browser testing — catch bugs before customers do.",
  url: SITE_URL,
  author: "Safdar Ali",
  authorUrl: "https://safdarali.in",
} as const;

export const KEYWORDS = [
  "ai browser testing free",
  "visual regression testing free",
  "compare screenshots online",
  "ui diff checker",
  "website screenshot comparison",
  "plain english testing",
  "no code testing tool",
  "shipcheck",
] as const;

export const HOW_IT_WORKS_STEPS = [
  {
    title: "Paste your URL",
    description:
      "Enter your staging or production URL. No SDK, no test scripts, no infrastructure to maintain.",
  },
  {
    title: "Write tests in plain English",
    description:
      "Describe what to test in natural language. ShipCheck navigates pages, clicks buttons, fills forms, and verifies results.",
  },
  {
    title: "Run a real browser",
    description:
      "A headless browser executes your flow on desktop, tablet, or mobile viewports with screenshots at every step.",
  },
  {
    title: "Get a clear report",
    description:
      "Receive pass/fail verdicts, step-by-step logs, screenshots, and a JSON report you can share with your team.",
  },
] as const;

export const EXAMPLE_TESTS = [
  {
    label: "Portfolio smoke test",
    url: "https://safdarali.in",
    instructions: `Verify page contains Safdar
Take screenshot`,
  },
  {
    label: "Google smoke test",
    url: "https://www.google.com",
    instructions: `Verify page contains Google
Take screenshot`,
  },
  {
    label: "Homepage smoke test",
    url: "https://example.com",
    instructions: "Verify page contains Example Domain\nTake screenshot",
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "Is ShipCheck free?",
    answer:
      "Yes. ShipCheck is completely free with no signup, no watermarks, and no credit card required.",
  },
  {
    question: "How is this different from TesterArmy or Playwright?",
    answer:
      "ShipCheck is a free, no-login tool for quick browser checks and visual diffs. Describe tests in plain English, get screenshots and reports instantly. Playwright is a framework you code against; ShipCheck handles the browser run for you.",
  },
  {
    question: "Do I need to write code?",
    answer:
      "No. Write instructions in plain English like 'Click Get started' or 'Verify page contains Pricing'. ShipCheck converts them into browser actions automatically.",
  },
  {
    question: "Are my tests stored on a server?",
    answer:
      "No. Test runs are ephemeral — results are returned to your browser and never permanently stored. Image uploads for visual diff are processed in-browser.",
  },
  {
    question: "Can I compare screenshots too?",
    answer:
      "Yes. ShipCheck also includes a pixel-perfect visual diff tool — upload two images or paste two URLs to detect UI changes.",
  },
  {
    question: "What sites can I test?",
    answer:
      "Any public HTTP/HTTPS website. Private IPs, localhost, and internal hostnames are blocked for security.",
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
    title: "Plain English tests",
    description:
      "Describe flows in natural language. No test scripts, no selectors, no maintenance overhead.",
    icon: "bot" as const,
  },
  {
    title: "Real browser agent",
    description:
      "Playwright launches a real browser, clicks, types, and validates like a human user would.",
    icon: "globe" as const,
  },
  {
    title: "Visual diff engine",
    description:
      "Compare screenshots pixel-by-pixel with side-by-side, overlay, diff-only, and split views.",
    icon: "scan" as const,
  },
  {
    title: "Instant reports",
    description:
      "Screenshots, step logs, pass/fail verdicts, and JSON exports — ready for PR reviews.",
    icon: "download" as const,
  },
] as const;

export const USE_CASES = [
  "Smoke-test critical user flows before every deploy",
  "Verify staging matches production behavior",
  "Catch broken buttons, forms, and navigation paths",
  "Compare UI screenshots after CSS or layout changes",
  "Share bug reports with screenshots — no account needed",
] as const;

export const STACK_ITEMS = [
  "Next.js",
  "Playwright",
  "TypeScript",
  "Tailwind",
  "Canvas API",
  "Vercel",
] as const;
