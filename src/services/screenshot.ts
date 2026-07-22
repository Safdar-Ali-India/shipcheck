import type { ViewportId } from "@/lib/constants";
import { applyServerlessPageGuards, safeWait } from "@/lib/pageSafety";
import { createTestSession, isServerlessRuntime } from "@/services/browser";

export async function captureScreenshot(
  url: string,
  viewport: ViewportId,
): Promise<Buffer> {
  const session = await createTestSession({ viewport });
  const page = await session.context.newPage();
  const timeout = isServerlessRuntime() ? 20_000 : 30_000;
  page.setDefaultTimeout(timeout);
  await applyServerlessPageGuards(session.context, page);

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout });
    await safeWait(page, 400);
    const buffer = await page.screenshot({
      fullPage: !isServerlessRuntime(),
      type: "png",
    });
    return Buffer.from(buffer);
  } finally {
    await page.close().catch(() => undefined);
    await session.dispose();
  }
}

export { closeBrowser } from "@/services/browser";
