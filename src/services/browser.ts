import { chromium, type Browser } from "playwright-core";

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
  const baseArgs = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"];

  if (isServerlessRuntime()) {
    const serverlessChromium = (await import("@sparticuz/chromium-min")).default;
    return {
      args: [...serverlessChromium.args, ...baseArgs],
      executablePath: await serverlessChromium.executablePath(CHROMIUM_PACK_URL),
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
    args: baseArgs,
    executablePath,
  };
}

export async function getBrowser(): Promise<Browser> {
  if (browserInstance?.isConnected()) {
    return browserInstance;
  }
  browserInstance = await chromium.launch(await getLaunchOptions());
  return browserInstance;
}

export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

export const BROWSER_USER_AGENT =
  "ShipCheck/1.0 (+https://shipcheck.safdarali.in; ai-browser-testing)";
