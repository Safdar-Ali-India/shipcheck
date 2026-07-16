import { chromium, type Browser } from "playwright-core";

let browserInstance: Browser | null = null;

export function isServerlessRuntime() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

async function getLaunchOptions() {
  const baseArgs = ["--no-sandbox", "--disable-setuid-sandbox"];

  if (isServerlessRuntime()) {
    const serverlessChromium = (await import("@sparticuz/chromium")).default;
    return {
      args: [...serverlessChromium.args, ...baseArgs],
      executablePath: await serverlessChromium.executablePath(),
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
