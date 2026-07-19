import { afterEach, describe, expect, it } from "vitest";
import { getReportsDir, getVideoSessionDir, getWritableRoot } from "@/lib/tmpPaths";

describe("tmpPaths", () => {
  const originalVercel = process.env.VERCEL;
  const originalLambda = process.env.AWS_LAMBDA_FUNCTION_NAME;

  afterEach(() => {
    if (originalVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalVercel;
    if (originalLambda === undefined) delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    else process.env.AWS_LAMBDA_FUNCTION_NAME = originalLambda;
  });

  it("uses project .tmp locally", () => {
    delete process.env.VERCEL;
    delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    expect(getWritableRoot()).toContain(".tmp");
    expect(getReportsDir()).toContain("reports");
  });

  it("uses os tmpdir on Vercel", () => {
    process.env.VERCEL = "1";
    expect(getWritableRoot()).toMatch(/shipcheck$/);
    expect(getVideoSessionDir("abc")).toContain("shipcheck-videos");
    expect(getVideoSessionDir("abc")).toContain("abc");
  });
});
