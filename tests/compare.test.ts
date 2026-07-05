import { describe, expect, it } from "vitest";
import { calculatePercentage } from "@/lib/compareImages";
import { assertSafeUrl, checkRateLimit } from "@/lib/security";
import { validateImageFile } from "@/lib/validation";

describe("calculatePercentage", () => {
  it("returns zero for empty total", () => {
    expect(calculatePercentage(0, 0)).toBe(0);
  });

  it("calculates changed pixel percentage", () => {
    expect(calculatePercentage(100, 1000)).toBe(10);
  });
});

describe("assertSafeUrl", () => {
  it("allows public https URLs", () => {
    const url = assertSafeUrl("https://example.com/page");
    expect(url.hostname).toBe("example.com");
  });

  it("blocks localhost", () => {
    expect(() => assertSafeUrl("http://localhost:3000")).toThrow();
  });

  it("blocks private IPs", () => {
    expect(() => assertSafeUrl("http://192.168.1.1")).toThrow();
  });

  it("blocks non-http protocols", () => {
    expect(() => assertSafeUrl("file:///etc/passwd")).toThrow();
  });
});

describe("validateImageFile", () => {
  it("rejects unsupported mime types", () => {
    const file = new File(["x"], "test.gif", { type: "image/gif" });
    expect(validateImageFile(file)).toContain("PNG, JPEG, and WebP");
  });

  it("accepts png files", () => {
    const file = new File(["x"], "test.png", { type: "image/png" });
    expect(validateImageFile(file)).toBeNull();
  });
});

describe("checkRateLimit", () => {
  it("allows requests under limit", () => {
    expect(checkRateLimit("test-key-a", 5, 60_000)).toBe(true);
    expect(checkRateLimit("test-key-a", 5, 60_000)).toBe(true);
  });
});
