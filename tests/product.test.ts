import { describe, expect, it } from "vitest";
import { extractCiToken, isCiAuthorized } from "@/lib/ciAuth";
import { buildNotificationPayload, formatNotificationText } from "@/lib/notifications";
import { getCanonicalRedirectHost } from "@/middleware";
import { normalizeJourneyUrl, scoreJourneyText } from "@/services/autoSiteTest";

describe("getCanonicalRedirectHost", () => {
  const canonical = "shipcheck.safdarali.in";

  it("returns null when canonical host is not configured", () => {
    expect(getCanonicalRedirectHost("foo.example.com", "")).toBeNull();
    expect(getCanonicalRedirectHost("foo.example.com", undefined)).toBeNull();
  });

  it("does not redirect local or vercel hosts", () => {
    expect(getCanonicalRedirectHost("localhost:3000", canonical)).toBeNull();
    expect(getCanonicalRedirectHost("127.0.0.1:3000", canonical)).toBeNull();
    expect(getCanonicalRedirectHost("shipcheck-seven.vercel.app", canonical)).toBeNull();
  });

  it("redirects non-canonical custom hosts", () => {
    expect(getCanonicalRedirectHost("preview.example.com", canonical)).toBe(canonical);
  });
});

describe("auto journey helpers", () => {
  it("normalizes URL path and removes hash", () => {
    expect(normalizeJourneyUrl("https://example.com/pricing/#plans")).toBe(
      "https://example.com/pricing",
    );
    expect(normalizeJourneyUrl("https://example.com/")).toBe("https://example.com/");
  });

  it("scores high-intent paths higher than low-intent utility paths", () => {
    const positive = scoreJourneyText("/pricing and features");
    const negative = scoreJourneyText("/privacy terms and cookie");
    expect(positive).toBeGreaterThan(0);
    expect(negative).toBeLessThan(0);
  });
});

describe("ci auth helpers", () => {
  it("extracts token from x-ci-token first", () => {
    expect(extractCiToken("Bearer abc", "xyz")).toBe("xyz");
  });

  it("extracts token from bearer auth", () => {
    expect(extractCiToken("Bearer abc123", null)).toBe("abc123");
  });

  it("authorizes only exact token match", () => {
    expect(isCiAuthorized("secret", "secret")).toBe(true);
    expect(isCiAuthorized("secret", "wrong")).toBe(false);
    expect(isCiAuthorized(undefined, "secret")).toBe(false);
  });
});

describe("notification payload", () => {
  const report = {
    id: "report-1",
    title: "example smoke test",
    url: "https://example.com",
    instructions: "verify homepage",
    viewport: "desktop",
    status: "pass" as const,
    summary: "all good",
    steps: [],
    startedAt: "2026-01-01T00:00:00.000Z",
    finishedAt: "2026-01-01T00:00:01.000Z",
    durationMs: 1000,
    consoleLogs: [],
    networkLogs: [],
  };

  it("formats readable text with status", () => {
    const text = formatNotificationText({
      source: "manual",
      report,
      shareUrl: "/reports/report-1",
    });
    expect(text).toContain("PASSED");
    expect(text).toContain("example smoke test");
  });

  it("builds payload with share URL and report metadata", () => {
    const payload = buildNotificationPayload({
      source: "ci",
      report,
      shareUrl: "/reports/report-1",
      ci: { provider: "github-actions", branch: "main" },
    });
    expect(payload.shipcheck.shareUrl).toContain("/reports/report-1");
    expect(payload.shipcheck.ci?.provider).toBe("github-actions");
  });
});
