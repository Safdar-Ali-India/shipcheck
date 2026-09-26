import fs from "fs/promises";
import type { Page } from "playwright-core";
import {
  applyServerlessPageGuards,
  friendlyBrowserError,
  safeWait,
  serverlessExploreLimits,
} from "@/lib/pageSafety";
import type { ViewportId } from "@/lib/constants";
import { cleanupOldReports, saveReportVideo } from "@/lib/reportStorage";
import { getVideoSessionDir } from "@/lib/tmpPaths";
import { createTestSession, shouldRecordVideo } from "@/services/browser";
import { describeAction } from "@/services/testPlanner";
import type {
  BrowserTestAction,
  BrowserTestReport,
  BrowserTestStepResult,
  ConsoleLogEntry,
  NetworkLogEntry,
  TestStepKind,
} from "@/types/browserTest";

const NAV_RETRIES = 2;
const ACTION_RETRIES = 2;
const RETRY_DELAY_MS = 500;

function actionKind(action: BrowserTestAction): TestStepKind {
  switch (action.type) {
    case "assertVisible":
    case "assertText":
      return "assert";
    case "screenshot":
      return "screenshot";
    default:
      return "action";
  }
}

function generateTitle(url: string, instructions: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const firstLine = instructions.split(/\n|;/)[0]?.trim() ?? "automated check";
    return `${host} smoke test — ${firstLine.toLowerCase()}`;
  } catch {
    return "Browser smoke test";
  }
}

async function dismissConsentIfPresent(page: Page): Promise<void> {
  const candidates = [
    page.getByRole("button", { name: /accept all/i }),
    page.getByRole("button", { name: /i agree/i }),
    page.getByRole("button", { name: /reject all/i }),
  ];

  for (const locator of candidates) {
    if ((await locator.count()) > 0) {
      await locator.first().click({ timeout: 2000 }).catch(() => undefined);
      await safeWait(page, 400);
      return;
    }
  }
}

async function screenshotToDataUrl(page: Page): Promise<string> {
  const buffer = await page.screenshot({ fullPage: false, type: "png" });
  return `data:image/png;base64,${Buffer.from(buffer).toString("base64")}`;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeTarget(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "");
}

async function retry<T>(
  attempts: number,
  run: (attempt: number) => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await run(attempt);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Operation failed");
}

async function navigateWithRetry(page: Page, url: string): Promise<void> {
  const navTimeout = serverlessExploreLimits().navTimeout;
  await retry(NAV_RETRIES, async (attempt) => {
    const waitUntil = attempt === 1 ? "domcontentloaded" : "load";
    await page.goto(url, { waitUntil, timeout: navTimeout });
    await safeWait(page, 500);
  });
}

async function resolveLocator(page: Page, target: string) {
  const cleanedTarget = normalizeTarget(target);
  const escapedTarget = escapeRegex(cleanedTarget);
  const targetRegex = new RegExp(escapedTarget, "i");

  if (/^search$/i.test(cleanedTarget)) {
    const search = page.locator('textarea[name="q"], input[name="q"]');
    if ((await search.count()) > 0) return search.first();
  }

  const cssSafe = cleanedTarget.replace(/"/g, '\\"');
  const strategies = [
    () => page.getByRole("combobox", { name: targetRegex }),
    () => page.getByRole("button", { name: targetRegex }),
    () => page.getByRole("link", { name: targetRegex }),
    () => page.getByRole("textbox", { name: targetRegex }),
    () => page.getByRole("menuitem", { name: targetRegex }),
    () => page.getByRole("tab", { name: targetRegex }),
    () => page.getByLabel(targetRegex),
    () => page.getByPlaceholder(targetRegex),
    () => page.locator(`[data-testid*="${cssSafe}" i], [name*="${cssSafe}" i], [id*="${cssSafe}" i]`),
    () => page.locator(`button:has-text("${cssSafe}"), a:has-text("${cssSafe}")`),
    () => page.getByText(targetRegex),
  ];

  for (const strategy of strategies) {
    const locator = strategy();
    if ((await locator.count()) > 0) {
      await locator.first().scrollIntoViewIfNeeded().catch(() => undefined);
      return locator.first();
    }
  }

  throw new Error(`Could not find "${cleanedTarget}" on the page`);
}

async function executeAction(page: Page, action: BrowserTestAction): Promise<string> {
  const STEP_TIMEOUT = serverlessExploreLimits().stepTimeout;
  switch (action.type) {
    case "click": {
      const locator = await resolveLocator(page, action.target);
      await retry(ACTION_RETRIES, async (attempt) => {
        await locator.click({ timeout: STEP_TIMEOUT, force: attempt > 1 });
      });
      return `Clicked "${action.target}"`;
    }
    case "fill": {
      const locator = await resolveLocator(page, action.target);
      await retry(ACTION_RETRIES, async (attempt) => {
        if (attempt === 1) {
          await locator.fill(action.value, { timeout: STEP_TIMEOUT });
        } else {
          await locator.click({ timeout: STEP_TIMEOUT }).catch(() => undefined);
          await locator.clear({ timeout: STEP_TIMEOUT }).catch(() => undefined);
          await locator.type(action.value, { delay: 15, timeout: STEP_TIMEOUT });
        }
      });
      return `Filled "${action.target}"`;
    }
    case "assertVisible": {
      const locator = await resolveLocator(page, action.target);
      await retry(ACTION_RETRIES, async () => {
        await locator.scrollIntoViewIfNeeded({ timeout: STEP_TIMEOUT }).catch(() => undefined);
        await locator.waitFor({ state: "visible", timeout: STEP_TIMEOUT });
      });
      return `"${action.target}" is visible`;
    }
    case "assertText": {
      const regex = new RegExp(action.text, "i");
      const checkFrame = async (frame: Page | import("playwright-core").Frame): Promise<boolean> => {
        const text = await frame.locator("body").innerText().catch(() => "");
        return regex.test(text);
      };

      await retry(ACTION_RETRIES, async () => {
        if (await checkFrame(page)) return;
        for (const frame of page.frames()) {
          if (frame !== page.mainFrame() && (await checkFrame(frame))) return;
        }
        throw new Error(`Text "${action.text}" not found`);
      });

      for (const frame of page.frames()) {
        if (await checkFrame(frame)) {
          return `Found text "${action.text}"`;
        }
      }
      throw new Error(`Text "${action.text}" not found on page`);
    }
    case "screenshot":
      return "Screenshot captured";
    case "wait":
      await safeWait(page, action.ms);
      return `Waited ${action.ms}ms`;
    case "press":
      await page.keyboard.press(action.key);
      return `Pressed ${action.key}`;
    case "scroll": {
      const locator = await resolveLocator(page, action.target);
      await retry(ACTION_RETRIES, async () => {
        await locator.scrollIntoViewIfNeeded({ timeout: STEP_TIMEOUT });
        await safeWait(page, 400);
      });
      return `Scrolled to "${action.target}"`;
    }
    case "submit": {
      const label = action.target ?? "Send message";
      const locator = await resolveLocator(page, label);
      await retry(ACTION_RETRIES, async (attempt) => {
        if (attempt === 1) {
          await locator.click({ timeout: STEP_TIMEOUT });
        } else {
          await locator.press("Enter", { timeout: STEP_TIMEOUT }).catch(() => undefined);
        }
        await safeWait(page, 800);
      });
      return `Submitted form via "${label}"`;
    }
  }
}

function generateSummary(steps: BrowserTestStepResult[], url: string): string {
  const failed = steps.filter((s) => s.status === "fail");
  if (failed.length === 0) {
    return `All ${steps.length} steps passed on ${url}. No broken flows detected in this run.`;
  }
  const first = failed[0];
  return `Test failed at step "${first.instruction}": ${first.message}. ${failed.length} of ${steps.length} steps failed.`;
}

export async function runBrowserTest(options: {
  url: string;
  instructions: string;
  viewport: ViewportId;
  steps: BrowserTestAction[];
  title?: string;
}): Promise<BrowserTestReport> {
  const reportId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const testStart = Date.now();
  const recordVideo = shouldRecordVideo();
  const videoDir = getVideoSessionDir(reportId);
  if (recordVideo) {
    await fs.mkdir(videoDir, { recursive: true });
  }

  void cleanupOldReports();

  const session = await createTestSession({
    viewport: options.viewport,
    recordVideoDir: recordVideo ? videoDir : undefined,
  });
  const { context } = session;

  const limits = serverlessExploreLimits();
  const STEP_TIMEOUT = limits.stepTimeout;
  const TOTAL_TIMEOUT = limits.totalTimeout;

  const page = await context.newPage();
  page.setDefaultTimeout(STEP_TIMEOUT);
  await applyServerlessPageGuards(context, page);

  const consoleLogs: ConsoleLogEntry[] = [];
  const networkLogs: NetworkLogEntry[] = [];
  const stepResults: BrowserTestStepResult[] = [];
  let finalScreenshot: string | undefined;
  let overallStatus: "pass" | "fail" = "pass";
  let hasVideo = false;
  const deadline = Date.now() + TOTAL_TIMEOUT;

  page.on("console", (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      timestampMs: Date.now() - testStart,
    });
  });

  const requestTimings = new Map<string, number>();

  page.on("request", (request) => {
    requestTimings.set(request.url(), Date.now());
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

  try {
    const navStart = Date.now();
    await navigateWithRetry(page, options.url);
    await dismissConsentIfPresent(page);
    await safeWait(page, 600);

    stepResults.push({
      id: "step-0",
      instruction: `Navigate to ${options.url}`,
      action: { type: "screenshot", label: "Navigate" },
      kind: "navigate",
      status: "pass",
      message: "Page loaded successfully",
      durationMs: Date.now() - navStart,
      videoTimestampMs: 0,
      screenshot: await screenshotToDataUrl(page),
    });

    for (let i = 0; i < options.steps.length; i++) {
      if (Date.now() > deadline) {
        throw new Error("Test exceeded the 3 minute time limit");
      }

      const action = options.steps[i];
      const instruction = describeAction(action);
      const stepStart = Date.now();
      const videoTimestampMs = Date.now() - testStart;

      try {
        const message = await executeAction(page, action);
        const screenshot = await screenshotToDataUrl(page);

        if (action.type === "screenshot" && action.label === "Final state") {
          finalScreenshot = screenshot;
        }

        stepResults.push({
          id: `step-${i + 1}`,
          instruction,
          action,
          kind: actionKind(action),
          status: "pass",
          message,
          durationMs: Date.now() - stepStart,
          videoTimestampMs,
          screenshot,
        });
      } catch (error) {
        overallStatus = "fail";
        const screenshot = await screenshotToDataUrl(page).catch(() => undefined);
        finalScreenshot = screenshot ?? finalScreenshot;

        stepResults.push({
          id: `step-${i + 1}`,
          instruction,
          action,
          kind: actionKind(action),
          status: "fail",
          message: friendlyBrowserError(error),
          durationMs: Date.now() - stepStart,
          videoTimestampMs,
          screenshot,
        });
        break;
      }
    }
  } catch (error) {
    overallStatus = "fail";
    stepResults.push({
      id: "step-error",
      instruction: "Load page",
      action: { type: "screenshot", label: "Error" },
      kind: "navigate",
      status: "fail",
      message: friendlyBrowserError(error),
      durationMs: 0,
      videoTimestampMs: 0,
    });
  } finally {
    await safeWait(page, 300);
    await page.close().catch(() => undefined);
    await session.dispose();

    if (videoHandle) {
      const rawPath = await videoHandle.path().catch(() => null);
      if (rawPath) {
        hasVideo = await saveReportVideo(reportId, rawPath);
        await fs.unlink(rawPath).catch(() => undefined);
      }
    }

    await fs.rm(videoDir, { recursive: true, force: true }).catch(() => undefined);
  }

  if (!finalScreenshot) {
    finalScreenshot = stepResults.findLast((s) => s.screenshot)?.screenshot;
  }

  const finishedAt = new Date().toISOString();
  const durationMs = Date.now() - testStart;

  return {
    id: reportId,
    title: options.title ?? generateTitle(options.url, options.instructions),
    url: options.url,
    instructions: options.instructions,
    viewport: options.viewport,
    status: overallStatus,
    summary: generateSummary(stepResults, options.url),
    steps: stepResults,
    startedAt,
    finishedAt,
    durationMs,
    finalScreenshot,
    hasVideo,
    consoleLogs: consoleLogs.slice(-100),
    networkLogs: networkLogs.slice(-100),
  };
}
