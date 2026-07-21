import { afterEach, describe, expect, it } from "vitest";
import {
  friendlyBrowserError,
  isBrowserClosedError,
  serverlessExploreLimits,
} from "@/lib/pageSafety";

describe("pageSafety", () => {
  const originalVercel = process.env.VERCEL;

  afterEach(() => {
    if (originalVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalVercel;
  });

  it("detects closed browser errors", () => {
    expect(
      isBrowserClosedError(
        new Error("page.waitForTimeout: Target page, context or browser has been closed"),
      ),
    ).toBe(true);
    expect(isBrowserClosedError(new Error("net::ERR_FAILED"))).toBe(false);
  });

  it("returns a clear serverless message for closed browsers", () => {
    process.env.VERCEL = "1";
    const message = friendlyBrowserError(
      new Error("page.waitForTimeout: Target page, context or browser has been closed"),
    );
    expect(message).toContain("Browser crashed");
    expect(message).toContain("Vercel");
  });

  it("tightens explore limits on serverless", () => {
    delete process.env.VERCEL;
    expect(serverlessExploreLimits().maxPages).toBe(5);

    process.env.VERCEL = "1";
    const limits = serverlessExploreLimits();
    expect(limits.maxPages).toBe(2);
    expect(limits.totalTimeout).toBeLessThanOrEqual(60_000);
  });
});
