import type { Page, BrowserContext } from "playwright-core";
import { isServerlessRuntime } from "@/services/browser";

const CLOSED_RE =
  /has been closed|Target page, context or browser|Browser has been closed|Target closed/i;

export function isBrowserClosedError(error: unknown): boolean {
  return error instanceof Error && CLOSED_RE.test(error.message);
}

export function friendlyBrowserError(error: unknown): string {
  if (isBrowserClosedError(error)) {
    return isServerlessRuntime()
      ? "Browser crashed while testing this site. Heavy sites (large JS apps) often exceed free Vercel memory (1GB). Try a simpler page, or run ShipCheck locally."
      : "Browser closed unexpectedly during the test. Retry, or try a lighter URL.";
  }
  return error instanceof Error ? error.message : "Browser test failed";
}

/** Sleep without throwing if the page/browser already died. */
export async function safeWait(page: Page, ms: number): Promise<void> {
  try {
    if (page.isClosed()) return;
    await page.waitForTimeout(ms);
  } catch {
    // ignore closed-target waits
  }
}

/**
 * On serverless, block heavy assets so Chromium stays under 1GB RAM.
 * Still loads HTML/CSS/JS needed for smoke checks.
 */
export async function applyServerlessPageGuards(
  context: BrowserContext,
  page: Page,
): Promise<void> {
  if (!isServerlessRuntime()) return;

  await context.route("**/*", async (route) => {
    const type = route.request().resourceType();
    if (type === "image" || type === "media" || type === "font") {
      await route.abort().catch(() => undefined);
      return;
    }
    await route.continue().catch(() => undefined);
  });

  await page.addInitScript(() => {
    try {
      // Reduce layout thrash / animation cost on weak serverless Chromium.
      const style = document.createElement("style");
      style.textContent =
        "*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}";
      document.documentElement.appendChild(style);
    } catch {
      // ignore
    }
  });
}

export function serverlessExploreLimits() {
  if (!isServerlessRuntime()) {
    return {
      stepTimeout: 15_000,
      totalTimeout: 180_000,
      maxPages: 5,
      maxSteps: 24,
      navTimeout: 30_000,
    };
  }
  return {
    stepTimeout: 12_000,
    totalTimeout: 50_000,
    maxPages: 2,
    maxSteps: 12,
    navTimeout: 20_000,
  };
}
