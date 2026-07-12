import { describe, expect, it } from "vitest";
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
