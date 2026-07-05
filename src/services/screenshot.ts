import { chromium, type Browser } from "playwright";
import { getViewportConfig } from "@/lib/validation";
import type { ViewportId } from "@/lib/constants";

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance?.isConnected()) {
    return browserInstance;
  }
  browserInstance = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  return browserInstance;
}

export async function captureScreenshot(
  url: string,
  viewport: ViewportId,
): Promise<Buffer> {
  const config = getViewportConfig(viewport);
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: config.width, height: config.height },
    deviceScaleFactor: config.deviceScaleFactor,
    userAgent:
      "ShipCheck/1.0 (+https://shipcheck.safdarali.in; visual-regression-tool)",
  });

  const page = await context.newPage();
  page.setDefaultTimeout(30_000);

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForTimeout(500);
    const buffer = await page.screenshot({ fullPage: true, type: "png" });
    return Buffer.from(buffer);
  } finally {
    await context.close();
  }
}

export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
