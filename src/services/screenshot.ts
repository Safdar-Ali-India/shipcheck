import type { ViewportId } from "@/lib/constants";
import { createTestSession } from "@/services/browser";

export async function captureScreenshot(
  url: string,
  viewport: ViewportId,
): Promise<Buffer> {
  const session = await createTestSession({ viewport });
  const page = await session.context.newPage();
  page.setDefaultTimeout(30_000);

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForTimeout(500);
    const buffer = await page.screenshot({ fullPage: true, type: "png" });
    return Buffer.from(buffer);
  } finally {
    await page.close().catch(() => undefined);
    await session.dispose();
  }
}

export { closeBrowser } from "@/services/browser";
