import { afterEach, describe, expect, it } from "vitest";
import {
  clearQuotaStore,
  consumeQuota,
  getClientIp,
  getPublicQuotaPolicies,
  peekQuota,
  quotaErrorMessage,
  type QuotaPolicy,
} from "@/lib/quota";
import { quotaHeaders } from "@/lib/requestQuota";

const tinyPolicy = (): QuotaPolicy => ({
  burst: { limit: 2, windowMs: 1_000 },
  daily: { limit: 3, windowMs: 10_000 },
});

afterEach(() => {
  clearQuotaStore();
  delete process.env.QUOTA_BROWSER_TEST_BURST;
  delete process.env.QUOTA_BROWSER_TEST_DAILY;
});

describe("consumeQuota", () => {
  it("allows requests under both windows and decrements remaining", () => {
    const policy = tinyPolicy();
    const first = consumeQuota("k1", policy, 1_000);
    expect(first.allowed).toBe(true);
    expect(first.burstRemaining).toBe(1);
    expect(first.dailyRemaining).toBe(2);

    const second = consumeQuota("k1", policy, 1_100);
    expect(second.allowed).toBe(true);
    expect(second.burstRemaining).toBe(0);
    expect(second.dailyRemaining).toBe(1);
  });

  it("blocks on burst before daily is exhausted", () => {
    const policy = tinyPolicy();
    const now = 5_000;
    consumeQuota("burst-key", policy, now);
    consumeQuota("burst-key", policy, now + 10);
    const blocked = consumeQuota("burst-key", policy, now + 20);

    expect(blocked.allowed).toBe(false);
    expect(blocked.blockedBy).toBe("burst");
    expect(blocked.burstRemaining).toBe(0);
    expect(blocked.dailyRemaining).toBe(1);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("blocks on daily even when burst window has capacity", () => {
    const policy: QuotaPolicy = {
      burst: { limit: 5, windowMs: 60_000 },
      daily: { limit: 2, windowMs: 86_400_000 },
    };
    const now = 100_000;
    consumeQuota("daily-key", policy, now);
    consumeQuota("daily-key", policy, now + 1);
    const blocked = consumeQuota("daily-key", policy, now + 2);

    expect(blocked.allowed).toBe(false);
    expect(blocked.blockedBy).toBe("daily");
    expect(blocked.dailyRemaining).toBe(0);
    expect(blocked.burstRemaining).toBe(3);
  });

  it("resets burst window after expiry and keeps daily count", () => {
    const policy = tinyPolicy();
    const t0 = 20_000;
    consumeQuota("reset-key", policy, t0);
    consumeQuota("reset-key", policy, t0 + 1);
    const blocked = consumeQuota("reset-key", policy, t0 + 2);
    expect(blocked.blockedBy).toBe("burst");

    // Burst window was 1000ms from first bucket creation at t0.
    const afterReset = consumeQuota("reset-key", policy, t0 + 1_050);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.blockedBy).toBeNull();
    // 2 earlier + this one = 3 daily, so daily remaining 0
    expect(afterReset.dailyRemaining).toBe(0);
  });

  it("isolates counters per key", () => {
    const policy = tinyPolicy();
    consumeQuota("a", policy, 1);
    consumeQuota("a", policy, 2);
    const other = consumeQuota("b", policy, 3);
    expect(other.allowed).toBe(true);
    expect(other.burstRemaining).toBe(1);
  });

  it("does not consume when request is denied", () => {
    const policy = tinyPolicy();
    const now = 50_000;
    consumeQuota("no-consume", policy, now);
    consumeQuota("no-consume", policy, now + 1);
    consumeQuota("no-consume", policy, now + 2); // burst deny
    const peek = peekQuota("no-consume", policy, now + 3);
    expect(peek.burstRemaining).toBe(0);
    expect(peek.dailyRemaining).toBe(1);
  });
});

describe("getClientIp", () => {
  it("uses the first x-forwarded-for hop", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    });
    expect(getClientIp(headers)).toBe("203.0.113.10");
  });

  it("falls back to x-real-ip then anonymous", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "198.51.100.7" }))).toBe(
      "198.51.100.7",
    );
    expect(getClientIp(new Headers())).toBe("anonymous");
  });
});

describe("getPublicQuotaPolicies", () => {
  it("reads env overrides for browser test limits", () => {
    process.env.QUOTA_BROWSER_TEST_BURST = "7";
    process.env.QUOTA_BROWSER_TEST_DAILY = "42";
    const policies = getPublicQuotaPolicies();
    expect(policies.browserTest.burst.limit).toBe(7);
    expect(policies.browserTest.daily.limit).toBe(42);
  });

  it("ignores invalid env overrides", () => {
    process.env.QUOTA_BROWSER_TEST_BURST = "0";
    process.env.QUOTA_BROWSER_TEST_DAILY = "nope";
    const policies = getPublicQuotaPolicies();
    expect(policies.browserTest.burst.limit).toBe(5);
    expect(policies.browserTest.daily.limit).toBe(30);
  });
});

describe("quota response helpers", () => {
  it("builds rate-limit headers including Retry-After when blocked", () => {
    const decision = consumeQuota(
      "hdr",
      { burst: { limit: 1, windowMs: 60_000 }, daily: { limit: 1, windowMs: 86_400_000 } },
      1,
    );
    expect(decision.allowed).toBe(true);
    const okHeaders = quotaHeaders(decision);
    expect(okHeaders["X-RateLimit-Limit"]).toBe("1");
    expect(okHeaders["Retry-After"]).toBeUndefined();

    const denied = consumeQuota(
      "hdr",
      { burst: { limit: 1, windowMs: 60_000 }, daily: { limit: 1, windowMs: 86_400_000 } },
      2,
    );
    const deniedHeaders = quotaHeaders(denied);
    expect(deniedHeaders["Retry-After"]).toBe(String(denied.retryAfterSec));
    expect(deniedHeaders["X-RateLimit-Remaining"]).toBe("0");
  });

  it("formats distinct messages for burst vs daily", () => {
    const burstMsg = quotaErrorMessage({
      allowed: false,
      blockedBy: "burst",
      burstRemaining: 0,
      dailyRemaining: 5,
      burstLimit: 5,
      dailyLimit: 30,
      resetAt: 1,
      retryAfterSec: 12,
    });
    expect(burstMsg).toContain("5/min");
    expect(burstMsg).toContain("12s");

    const dailyMsg = quotaErrorMessage({
      allowed: false,
      blockedBy: "daily",
      burstRemaining: 3,
      dailyRemaining: 0,
      burstLimit: 5,
      dailyLimit: 30,
      resetAt: 1,
      retryAfterSec: 3600,
    });
    expect(dailyMsg).toContain("30/day");
  });
});
