import path from "path";
import { chromium, type Browser, type BrowserContext } from "playwright-core";
import type { ViewportId } from "@/lib/constants";
import { getViewportConfig } from "@/lib/validation";

let browserInstance: Browser | null = null;

/** Remote Chromium pack for Vercel/Lambda (matches @sparticuz/chromium-min major). */
const CHROMIUM_PACK_URL =
  process.env.CHROMIUM_REMOTE_PACK_URL?.trim() ||
  "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar";

export function isServerlessRuntime() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

/**
 * Playwright video needs a local ffmpeg binary. Vercel/Lambda don't ship one,
 * so keep screenshots/logs and skip video there (local/dev still records).
 */
export function shouldRecordVideo() {
  if (process.env.SHIPCHECK_FORCE_VIDEO === "1") return true;
  if (process.env.SHIPCHECK_DISABLE_VIDEO === "1") return false;
  return !isServerlessRuntime();
}

async function getLaunchOptions() {
  if (isServerlessRuntime()) {
    if (!process.env.AWS_LAMBDA_JS_RUNTIME) {
      process.env.AWS_LAMBDA_JS_RUNTIME = "nodejs22.x";
    }

    const serverlessChromium = (await import("@sparticuz/chromium-min")).default;
    // Property assignment (not a method) — disables WebGL/swiftshader crashes on Lambda.
    serverlessChromium.setGraphicsMode = false;

    const executablePath = await serverlessChromium.executablePath(CHROMIUM_PACK_URL);
    const execDir = path.dirname(executablePath);
    const existingLd = process.env.LD_LIBRARY_PATH?.trim();
    process.env.LD_LIBRARY_PATH = existingLd ? `${execDir}:${existingLd}` : execDir;

    return {
      args: serverlessChromium.args,
      executablePath,
      headless: true,
    };
  }

  let executablePath: string | undefined;
  try {
    executablePath = chromium.executablePath();
  } catch {
    executablePath = undefined;
  }

  if (!executablePath) {
    throw new Error(
      "Playwright Chromium is not installed. Run: npx playwright install chromium",
    );
  }

  return {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    executablePath,
  };
}

export async function getBrowser(): Promise<Browser> {
  // Fresh browser per invocation on serverless — reused instances often die mid-request.
  if (!isServerlessRuntime() && browserInstance?.isConnected()) {
    return browserInstance;
  }

  if (browserInstance) {
    await browserInstance.close().catch(() => undefined);
    browserInstance = null;
  }

  browserInstance = await chromium.launch(await getLaunchOptions());
  return browserInstance;
}

export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close().catch(() => undefined);
    browserInstance = null;
  }
}

export type TestSession = {
  browser: Browser;
  context: BrowserContext;
  /** Call after the run to close context (and browser on serverless). */
  dispose: () => Promise<void>;
};

/**
 * Create a configured browser context for a test run.
 * On Vercel, prefer a single short-lived browser; avoid leaking contexts.
 */
export async function createTestSession(options: {
  viewport: ViewportId;
  recordVideoDir?: string;
}): Promise<TestSession> {
  const config = getViewportConfig(options.viewport);
  const browser = await getBrowser();
  const serverless = isServerlessRuntime();

  const context = await browser.newContext({
    viewport: { width: config.width, height: config.height },
    deviceScaleFactor: config.deviceScaleFactor,
    userAgent: BROWSER_USER_AGENT,
    ...(options.recordVideoDir
      ? {
          recordVideo: {
            dir: options.recordVideoDir,
            size: { width: config.width, height: config.height },
          },
        }
      : {}),
  });

  return {
    browser,
    context,
    dispose: async () => {
      await context.close().catch(() => undefined);
      if (serverless) {
        await closeBrowser();
      }
    },
  };
}

export const BROWSER_USER_AGENT =
  "ShipCheck/1.0 (+https://shipcheck.safdarali.in; ai-browser-testing)";
