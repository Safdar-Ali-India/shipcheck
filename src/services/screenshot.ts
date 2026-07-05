import { getViewportConfig } from "@/lib/validation";
import type { ViewportId } from "@/lib/constants";
import { BROWSER_USER_AGENT, getBrowser } from "@/services/browser";

export async function captureScreenshot(
  url: string,
  viewport: ViewportId,
): Promise<Buffer> {
  const config = getViewportConfig(viewport);
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: config.width, height: config.height },
    deviceScaleFactor: config.deviceScaleFactor,
    userAgent: BROWSER_USER_AGENT,
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

export { closeBrowser } from "@/services/browser";
