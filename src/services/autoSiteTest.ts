import fs from "fs/promises";
import path from "path";
import type { Page } from "playwright";
import { getViewportConfig } from "@/lib/validation";
import type { ViewportId } from "@/lib/constants";
import { cleanupOldReports, saveReportVideo } from "@/lib/reportStorage";
import { BROWSER_USER_AGENT, getBrowser } from "@/services/browser";
import type {
  BrowserTestReport,
  BrowserTestStepResult,
  ConsoleLogEntry,
  NetworkLogEntry,
  TestStepKind,
} from "@/types/browserTest";

const STEP_TIMEOUT = 15_000;
const TOTAL_TIMEOUT = 180_000;
const MAX_PAGES = 5;
const MAX_STEPS = 24;
const MAX_LINKS_PER_PAGE = 10;
const NAV_RETRIES = 2;

const SKIP_FORM =
  /password|login|signin|sign-in|checkout|payment|billing|credit|cvv|card/i;

const JOURNEY_POSITIVE_KEYWORDS = [
  "pricing",
  "plan",
  "feature",
  "product",
  "solution",
  "contact",
  "about",
  "docs",
  "documentation",
  "blog",
  "demo",
  "start",
  "getting-started",
  "learn",
  "try",
  "tour",
  "case-study",
  "integrations",
] as const;

const JOURNEY_NEGATIVE_KEYWORDS = [
  "privacy",
  "terms",
  "cookie",
  "sitemap",
  "logout",
  "signout",
  "unsubscribe",
  "mailto:",
  "tel:",
] as const;

type QueueItem = {
  url: string;
  score: number;
  source?: string;
};

type DiscoveredLink = {
  url: string;
  label: string;
  score: number;
};

export function scoreJourneyText(text: string): number {
  const loweredText = text.toLowerCase();
  let score = 0;
  if (JOURNEY_POSITIVE_KEYWORDS.some((keyword) => loweredText.includes(keyword))) score += 25;
  if (JOURNEY_NEGATIVE_KEYWORDS.some((keyword) => loweredText.includes(keyword))) score -= 35;
  return score;
}

export function normalizeJourneyUrl(raw: string, base?: string): string {
  const u = new URL(raw, base);
  u.hash = "";
  const normalizedPath = u.pathname.replace(/\/$/, "") || "/";
  return `${u.origin}${normalizedPath}`;
}

async function dismissConsentIfPresent(page: Page): Promise<void> {
  for (const pattern of [/accept all/i, /i agree/i, /reject all/i, /got it/i]) {
    const btn = page.getByRole("button", { name: pattern });
    if ((await btn.count()) > 0) {
      await btn.first().click({ timeout: 2000 }).catch(() => undefined);
      await page.waitForTimeout(400);
      return;
    }
  }
}

async function screenshotToDataUrl(page: Page): Promise<string> {
  const buffer = await page.screenshot({ fullPage: false, type: "png" });
  return `data:image/png;base64,${Buffer.from(buffer).toString("base64")}`;
}

async function navigateWithRetry(page: Page, url: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= NAV_RETRIES; attempt++) {
    try {
      const waitUntil = attempt === 1 ? "domcontentloaded" : "load";
      await page.goto(url, { waitUntil, timeout: 30_000 });
      await page.waitForTimeout(500);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < NAV_RETRIES) {
        await page.waitForTimeout(600 * attempt);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Failed to load ${url}`);
}

async function discoverInternalLinks(page: Page, origin: string): Promise<DiscoveredLink[]> {
  return page.evaluate(
    ({ siteOrigin, positiveKeywords, negativeKeywords, maxLinksPerPage }) => {
      const found = new Map<string, { label: string; score: number }>();
      const currentPath = window.location.pathname.replace(/\/$/, "") || "/";

      document.querySelectorAll("a[href]").forEach((anchor) => {
        const element = anchor as HTMLAnchorElement;
        const rawText = `${element.innerText ?? ""} ${element.getAttribute("aria-label") ?? ""}`;
        const label = rawText.trim().replace(/\s+/g, " ");
        if (!element.href) return;
        if (element.getAttribute("target") === "_blank") return;

        let score = 0;
        if (element.closest("header, nav")) score += 40;
        if (element.closest("main")) score += 15;
        if (element.closest("footer")) score -= 10;
        if (element.className.toLowerCase().includes("button")) score += 15;
        if (element.getAttribute("role")?.toLowerCase() === "button") score += 15;
        if (element.offsetParent === null) score -= 15;
        if (label.length >= 4 && label.length <= 40) score += 10;

        const loweredText = `${label} ${element.href}`.toLowerCase();
        if (positiveKeywords.some((keyword) => loweredText.includes(keyword))) score += 25;
        if (negativeKeywords.some((keyword) => loweredText.includes(keyword))) score -= 35;
        if (/^https?:\/\/[^/]+\/?$/.test(element.href)) score -= 5;

        try {
          const u = new URL(element.href);
          if (u.origin !== siteOrigin) return;
          if (u.hash && u.pathname === window.location.pathname) return;
          if (/\.(pdf|png|jpe?g|gif|webp|zip|exe|dmg|svg|ico)$/i.test(u.pathname)) return;
          if (u.pathname.startsWith("/_next")) return;

          const normalizedPath = u.pathname.replace(/\/$/, "") || "/";
          const normalized = `${u.origin}${normalizedPath}`;
          if (normalizedPath === currentPath) score -= 30;

          const existing = found.get(normalized);
          if (!existing || score > existing.score) {
            found.set(normalized, { label: label || normalizedPath, score });
          }
        } catch {
          /* ignore bad URLs */
        }
      });

      return Array.from(found.entries())
        .map(([url, meta]) => ({ url, label: meta.label, score: meta.score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, maxLinksPerPage);
    },
    {
      siteOrigin: origin,
      positiveKeywords: [...JOURNEY_POSITIVE_KEYWORDS],
      negativeKeywords: [...JOURNEY_NEGATIVE_KEYWORDS],
      maxLinksPerPage: MAX_LINKS_PER_PAGE,
    },
  );
}

async function captureJourneyCandidate(
  page: Page,
  origin: string,
): Promise<DiscoveredLink | null> {
  return page.evaluate(
    ({ siteOrigin, positiveKeywords }) => {
      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>('a[href], button, [role="button"]'),
      );

      const findAnchor = (element: HTMLElement): HTMLAnchorElement | null => {
        if (element.tagName.toLowerCase() === "a") return element as HTMLAnchorElement;
        return element.querySelector<HTMLAnchorElement>("a[href]");
      };

      for (const element of candidates) {
        if (element.offsetParent === null) continue;
        const text = `${element.innerText ?? ""} ${element.getAttribute("aria-label") ?? ""}`
          .trim()
          .replace(/\s+/g, " ");
        if (!text) continue;
        const lowered = text.toLowerCase();
        if (!positiveKeywords.some((keyword) => lowered.includes(keyword))) continue;

        const anchor = findAnchor(element);
        if (!anchor?.href) continue;

        try {
          const url = new URL(anchor.href);
          if (url.origin !== siteOrigin) continue;
          const normalizedPath = url.pathname.replace(/\/$/, "") || "/";
          return {
            url: `${url.origin}${normalizedPath}`,
            label: text.slice(0, 80),
            score: 60,
          };
        } catch {
          /* ignore */
        }
      }

      return null;
    },
    {
      siteOrigin: origin,
      positiveKeywords: [...JOURNEY_POSITIVE_KEYWORDS],
    },
  );
}

function enqueueLink(
  queue: QueueItem[],
  queueScores: Map<string, number>,
  visited: Set<string>,
  link: QueueItem,
  origin: string,
) {
  const normalized = normalizeJourneyUrl(link.url, origin);
  if (visited.has(normalized)) return;

  const existingScore = queueScores.get(normalized);
  if (existingScore !== undefined && existingScore >= link.score) return;

  queueScores.set(normalized, link.score);
  queue.push({ url: normalized, score: link.score, source: link.source });
}

type StepPush = (
  instruction: string,
  kind: TestStepKind,
  run: () => Promise<string>,
) => Promise<void>;

async function testFormsOnPage(page: Page, push: StepPush): Promise<void> {
  const forms = page.locator("form");
  const count = await forms.count();

  for (let i = 0; i < count; i++) {
    const form = forms.nth(i);
    const html = (await form.innerHTML().catch(() => "")) ?? "";
    if (SKIP_FORM.test(html)) {
      await push("Skip sensitive form (login/payment)", "action", async () => "Skipped");
      continue;
    }

    const hasPassword = (await form.locator('input[type="password"]').count()) > 0;
    if (hasPassword) {
      await push("Skip login form", "action", async () => "Skipped — contains password field");
      continue;
    }

    const textInputs = form.locator(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="password"]):not([type="file"]):not([type="checkbox"]):not([type="radio"])',
    );
    const inputCount = await textInputs.count();

    for (let j = 0; j < inputCount; j++) {
      const input = textInputs.nth(j);
      const type = (await input.getAttribute("type")) ?? "text";
      const label =
        (await input.getAttribute("aria-label")) ??
        (await input.getAttribute("placeholder")) ??
        (await input.getAttribute("name")) ??
        `field ${j + 1}`;

      const value =
        type === "email" || /email/i.test(label)
          ? "shipcheck-test@example.com"
          : type === "tel" || /phone/i.test(label)
            ? "+15555550100"
            : /name/i.test(label)
              ? "ShipCheck Test"
              : "Automated test input";

      await push(`Fill "${label}"`, "action", async () => {
        await input.fill(value, { timeout: STEP_TIMEOUT });
        return `Filled "${label}"`;
      });
    }

    const textareas = form.locator("textarea");
    const taCount = await textareas.count();
    for (let j = 0; j < taCount; j++) {
      const ta = textareas.nth(j);
      const label =
        (await ta.getAttribute("aria-label")) ??
        (await ta.getAttribute("placeholder")) ??
        (await ta.getAttribute("name")) ??
        "message";
      await push(`Fill "${label}"`, "action", async () => {
        await ta.fill("Automated smoke test from ShipCheck — no reply needed.", {
          timeout: STEP_TIMEOUT,
        });
        return `Filled "${label}"`;
      });
    }

    const submit = form.locator(
      'button[type="submit"], input[type="submit"], button:has-text("Send"), button:has-text("Submit")',
    );
    if ((await submit.count()) > 0) {
      const submitLabel =
        (await submit.first().innerText().catch(() => "")) || "Submit";
      await push(`Submit form via "${submitLabel.trim()}"`, "action", async () => {
        await submit.first().click({ timeout: STEP_TIMEOUT });
        await page.waitForTimeout(1500);
        return `Submitted form`;
      });
      await push("Verify form response", "assert", async () => {
        const body = await page.locator("body").innerText();
        if (body.length < 20) throw new Error("Page appears empty after submit");
        return "Page responded after form submit";
      });
    }
  }
}

export async function runAutoSiteTest(options: {
  url: string;
  viewport: ViewportId;
}): Promise<BrowserTestReport> {
  const reportId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const testStart = Date.now();
  const deadline = Date.now() + TOTAL_TIMEOUT;
  const origin = new URL(options.url).origin;
  const startUrl = normalizeJourneyUrl(options.url);

  const config = getViewportConfig(options.viewport);
  const browser = await getBrowser();
  const videoDir = path.join(process.cwd(), ".tmp", "shipcheck-videos", reportId);
  await fs.mkdir(videoDir, { recursive: true });
  void cleanupOldReports();

  const context = await browser.newContext({
    viewport: { width: config.width, height: config.height },
    deviceScaleFactor: config.deviceScaleFactor,
    userAgent: BROWSER_USER_AGENT,
    recordVideo: { dir: videoDir, size: { width: config.width, height: config.height } },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(STEP_TIMEOUT);

  const consoleLogs: ConsoleLogEntry[] = [];
  const networkLogs: NetworkLogEntry[] = [];
  const stepResults: BrowserTestStepResult[] = [];
  let overallStatus: "pass" | "fail" = "pass";
  let hasVideo = false;
  let stepCounter = 0;

  const requestTimings = new Map<string, number>();
  page.on("request", (req) => requestTimings.set(req.url(), Date.now()));
  page.on("console", (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      timestampMs: Date.now() - testStart,
    });
  });
  page.on("response", (response) => {
    const url = response.url();
    const started = requestTimings.get(url) ?? Date.now();
    const pathname = (() => {
      try {
        return new URL(url).pathname.split("/").filter(Boolean).pop() ?? "root";
      } catch {
        return "request";
      }
    })();
    networkLogs.push({
      name: pathname,
      method: response.request().method(),
      url,
      status: response.status(),
      resourceType: response.request().resourceType(),
      durationMs: Math.max(0, Date.now() - started),
      timestampMs: Date.now() - testStart,
    });
  });

  const videoHandle = page.video();

  const push: StepPush = async (instruction, kind, run) => {
    if (stepResults.length >= MAX_STEPS) return;
    const stepStart = Date.now();
    const videoTimestampMs = Date.now() - testStart;
    try {
      const message = await run();
      stepResults.push({
        id: `step-${stepCounter++}`,
        instruction,
        action: { type: "screenshot", label: instruction },
        kind,
        status: "pass",
        message,
        durationMs: Date.now() - stepStart,
        videoTimestampMs,
        screenshot: await screenshotToDataUrl(page),
      });
    } catch (error) {
      overallStatus = "fail";
      stepResults.push({
        id: `step-${stepCounter++}`,
        instruction,
        action: { type: "screenshot", label: instruction },
        kind,
        status: "fail",
        message: error instanceof Error ? error.message : "Step failed",
        durationMs: Date.now() - stepStart,
        videoTimestampMs,
        screenshot: await screenshotToDataUrl(page).catch(() => undefined),
      });
    }
  };

  const queue: QueueItem[] = [{ url: startUrl, score: 100, source: "start page" }];
  const queueScores = new Map<string, number>([[startUrl, 100]]);
  const visited = new Set<string>();
  const visitedPages: string[] = [];

  try {
    while (queue.length > 0 && visited.size < MAX_PAGES && stepResults.length < MAX_STEPS) {
      if (Date.now() > deadline) break;

      queue.sort((a, b) => b.score - a.score);
      const next = queue.shift()!;
      const normalized = normalizeJourneyUrl(next.url, origin);
      const latestScore = queueScores.get(normalized);
      if (latestScore !== undefined && latestScore > next.score) {
        continue;
      }
      queueScores.delete(normalized);
      if (visited.has(normalized)) continue;
      visited.add(normalized);
      visitedPages.push(new URL(normalized).pathname || "/");

      if (visited.size === 1) {
        await navigateWithRetry(page, normalized);
        await dismissConsentIfPresent(page);
        await page.waitForTimeout(600);
        await push(`Navigate to ${normalized}`, "navigate", async () => "Page loaded successfully");
      } else {
        await push(`Navigate to ${normalized}`, "navigate", async () => {
          await navigateWithRetry(page, normalized);
          return "Page loaded successfully";
        });
      }

      try {
        const title = await page.title();
        await push(`Verify page loaded (${title || "untitled"})`, "assert", async () => {
          const body = await page.locator("body").innerText();
          if (body.trim().length < 5) throw new Error("Page body is empty");
          return `Page "${title || normalized}" loaded with content`;
        });
      } catch {
        /* step recorded as fail */
      }

      await push("Capture page screenshot", "screenshot", async () => "Screenshot captured");

      await testFormsOnPage(page, push).catch(() => undefined);

      if (stepResults.length >= MAX_STEPS) break;

      await push("Scroll to page bottom", "action", async () => {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);
        return "Scrolled to bottom";
      });

      await push("Capture scrolled view", "screenshot", async () => "Screenshot captured");

      const ctaCandidate = await captureJourneyCandidate(page, origin);
      if (ctaCandidate) {
        enqueueLink(
          queue,
          queueScores,
          visited,
          {
            url: ctaCandidate.url,
            score: next.score + ctaCandidate.score,
            source: `CTA: ${ctaCandidate.label}`,
          },
          origin,
        );
      }

      const links = await discoverInternalLinks(page, origin);
      await push("Discover next journey pages", "assert", async () => {
        if (links.length === 0) return "No additional internal links found";
        return `Found ${links.length} internal candidates`;
      });

      for (const link of links) {
        enqueueLink(
          queue,
          queueScores,
          visited,
          {
            url: link.url,
            score: next.score * 0.5 + link.score,
            source: link.label,
          },
          origin,
        );
      }
    }
  } catch (error) {
    if (stepResults.length === 0) {
      overallStatus = "fail";
      stepResults.push({
        id: "step-error",
        instruction: "Load site",
        action: { type: "screenshot", label: "Error" },
        kind: "navigate",
        status: "fail",
        message: error instanceof Error ? error.message : "Failed to explore site",
        durationMs: 0,
        videoTimestampMs: 0,
      });
    }
  } finally {
    await page.waitForTimeout(300);
    await page.close();
    await context.close();
    if (videoHandle) {
      const rawPath = await videoHandle.path().catch(() => null);
      if (rawPath) {
        hasVideo = await saveReportVideo(reportId, rawPath);
        await fs.unlink(rawPath).catch(() => undefined);
      }
    }
    await fs.rm(videoDir, { recursive: true, force: true }).catch(() => undefined);
  }

  const host = new URL(options.url).hostname.replace(/^www\./, "");
  const failed = stepResults.filter((s) => s.status === "fail").length;
  const passed = stepResults.filter((s) => s.status === "pass").length;

  return {
    id: reportId,
    title: `${host} auto test — explore pages, fill forms, record video`,
    url: options.url,
    instructions: `Auto-discovered test: visit up to ${MAX_PAGES} pages, fill safe forms, capture screenshots and video.`,
    viewport: options.viewport,
    status: overallStatus,
    summary:
      overallStatus === "pass"
        ? `Explored ${visited.size} page(s), ${passed} steps passed on ${options.url}. Visited: ${visitedPages
            .slice(0, 5)
            .join(", ")}.`
        : `${failed} step(s) failed across ${visited.size} page(s) on ${options.url}.`,
    steps: stepResults,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - testStart,
    finalScreenshot: stepResults.findLast((s) => s.screenshot)?.screenshot,
    hasVideo,
    consoleLogs: consoleLogs.slice(-100),
    networkLogs: networkLogs.slice(-100),
  };
}
