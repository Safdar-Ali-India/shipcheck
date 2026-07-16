import { describe, expect, it } from "vitest";
import { isCiAuthorized } from "@/lib/ciAuth";
import { isServerlessRuntime } from "@/services/browser";
import { sendNotification } from "@/lib/notifications";
import { assertSafeUrl, assertSafeWebhookUrl, checkRateLimit, safeCompareSecret } from "@/lib/security";
import { browserTestRequestSchema, ciHookRequestSchema } from "@/lib/validation";

const REPORT_ID_RE = /^[0-9a-f-]{36}$/i;

function isValidReportId(id: string) {
  return REPORT_ID_RE.test(id);
}

describe("assertSafeWebhookUrl", () => {
  it("allows public https webhook URLs", () => {
    const url = assertSafeWebhookUrl("https://hooks.example.com/shipcheck");
    expect(url.hostname).toBe("hooks.example.com");
  });

  it("blocks http webhook URLs", () => {
    expect(() => assertSafeWebhookUrl("http://hooks.example.com/x")).toThrow(/HTTPS/);
  });

  it("blocks private webhook targets", () => {
    expect(() => assertSafeWebhookUrl("https://192.168.1.1/hook")).toThrow();
    expect(() => assertSafeWebhookUrl("https://localhost/hook")).toThrow();
  });

  it("blocks cloud metadata hosts", () => {
    expect(() => assertSafeWebhookUrl("https://metadata.google.internal/")).toThrow();
  });
});

describe("safeCompareSecret", () => {
  it("matches equal secrets", () => {
    expect(safeCompareSecret("abc123", "abc123")).toBe(true);
  });

  it("rejects different secrets and lengths", () => {
    expect(safeCompareSecret("abc123", "abc124")).toBe(false);
    expect(safeCompareSecret("short", "longer-value")).toBe(false);
  });
});

describe("isCiAuthorized", () => {
  it("rejects missing provided token", () => {
    expect(isCiAuthorized("secret", null)).toBe(false);
  });
});

describe("sendNotification SSRF guard", () => {
  it("rejects unsafe webhook before network call", async () => {
    await expect(
      sendNotification({
        webhookUrl: "https://127.0.0.1/hook",
        source: "manual",
        shareUrl: "/reports/x",
        report: {
          id: "00000000-0000-4000-8000-000000000001",
          title: "t",
          url: "https://example.com",
          instructions: "x",
          viewport: "desktop",
          status: "pass",
          summary: "ok",
          steps: [],
          startedAt: "2026-01-01T00:00:00.000Z",
          finishedAt: "2026-01-01T00:00:01.000Z",
          durationMs: 1000,
          consoleLogs: [],
          networkLogs: [],
        },
      }),
    ).rejects.toThrow();
  });
});

describe("report id validation", () => {
  it("accepts UUID report ids", () => {
    expect(isValidReportId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("rejects path traversal and malformed ids", () => {
    expect(isValidReportId("../etc/passwd")).toBe(false);
    expect(isValidReportId("not-a-uuid")).toBe(false);
    expect(isValidReportId("550e8400-e29b-41d4-a716-446655440000.json")).toBe(false);
  });
});

describe("browserTestRequestSchema", () => {
  it("accepts auto mode with URL only", () => {
    const parsed = browserTestRequestSchema.safeParse({
      url: "https://example.com",
      mode: "auto",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects auto mode without URL", () => {
    const parsed = browserTestRequestSchema.safeParse({ mode: "auto" });
    expect(parsed.success).toBe(false);
  });

  it("rejects oversized instructions", () => {
    const parsed = browserTestRequestSchema.safeParse({
      url: "https://example.com",
      instructions: "x".repeat(4001),
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects non-http URLs", () => {
    const parsed = browserTestRequestSchema.safeParse({
      url: "ftp://example.com",
      mode: "auto",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("ciHookRequestSchema", () => {
  it("accepts CI metadata fields", () => {
    const parsed = ciHookRequestSchema.safeParse({
      url: "https://example.com",
      mode: "auto",
      ci: {
        provider: "github-actions",
        branch: "main",
        buildUrl: "https://github.com/org/repo/actions/runs/1",
      },
    });
    expect(parsed.success).toBe(true);
  });
});

describe("assertSafeUrl extended blocks", () => {
  it("blocks link-local addresses", () => {
    expect(() => assertSafeUrl("https://169.254.169.254/latest/meta-data")).toThrow();
  });

  it("blocks internal TLD hostnames", () => {
    expect(() => assertSafeUrl("https://api.service.local/admin")).toThrow(/Internal/);
    expect(() => assertSafeUrl("https://db.cluster.internal/")).toThrow(/Internal/);
  });
});

describe("isServerlessRuntime", () => {
  it("detects Vercel and AWS lambda environments", () => {
    const originalVercel = process.env.VERCEL;
    const originalLambda = process.env.AWS_LAMBDA_FUNCTION_NAME;

    process.env.VERCEL = "1";
    expect(isServerlessRuntime()).toBe(true);

    delete process.env.VERCEL;
    process.env.AWS_LAMBDA_FUNCTION_NAME = "fn";
    expect(isServerlessRuntime()).toBe(true);

    delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    expect(isServerlessRuntime()).toBe(false);

    if (originalVercel !== undefined) process.env.VERCEL = originalVercel;
    if (originalLambda !== undefined) {
      process.env.AWS_LAMBDA_FUNCTION_NAME = originalLambda;
    }
  });
});

describe("checkRateLimit", () => {
  it("blocks requests after limit is reached", () => {
    const key = `rate-limit-${Date.now()}`;
    expect(checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(checkRateLimit(key, 2, 60_000)).toBe(false);
  });
});
