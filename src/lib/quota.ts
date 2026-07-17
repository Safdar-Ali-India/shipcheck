export type QuotaWindow = {
  limit: number;
  windowMs: number;
};

export type QuotaPolicy = {
  /** Short burst window (e.g. per minute). */
  burst: QuotaWindow;
  /** Longer daily window. */
  daily: QuotaWindow;
};

export type QuotaDecision = {
  allowed: boolean;
  /** Which window blocked the request, if any. */
  blockedBy: "burst" | "daily" | null;
  /** Remaining requests in the burst window after this check. */
  burstRemaining: number;
  /** Remaining requests in the daily window after this check. */
  dailyRemaining: number;
  burstLimit: number;
  dailyLimit: number;
  /** Unix seconds when the blocking window resets (or soonest reset if allowed). */
  resetAt: number;
  /** Seconds until the client should retry when blocked. */
  retryAfterSec: number;
};

type Counter = {
  count: number;
  resetAt: number;
};

type Bucket = {
  burst: Counter;
  daily: Counter;
};

const store = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

function readPositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

/** Defaults tuned for a free public Playwright tool on serverless. */
export function getPublicQuotaPolicies(): Record<
  "browserTest" | "screenshot" | "ciHook" | "history",
  QuotaPolicy
> {
  return {
    browserTest: {
      burst: {
        limit: readPositiveInt(process.env.QUOTA_BROWSER_TEST_BURST, 5),
        windowMs: 60_000,
      },
      daily: {
        limit: readPositiveInt(process.env.QUOTA_BROWSER_TEST_DAILY, 30),
        windowMs: 24 * 60 * 60 * 1000,
      },
    },
    screenshot: {
      burst: {
        limit: readPositiveInt(process.env.QUOTA_SCREENSHOT_BURST, 15),
        windowMs: 60_000,
      },
      daily: {
        limit: readPositiveInt(process.env.QUOTA_SCREENSHOT_DAILY, 100),
        windowMs: 24 * 60 * 60 * 1000,
      },
    },
    ciHook: {
      burst: {
        limit: readPositiveInt(process.env.QUOTA_CI_BURST, 20),
        windowMs: 60_000,
      },
      daily: {
        limit: readPositiveInt(process.env.QUOTA_CI_DAILY, 200),
        windowMs: 24 * 60 * 60 * 1000,
      },
    },
    history: {
      burst: {
        limit: readPositiveInt(process.env.QUOTA_HISTORY_BURST, 60),
        windowMs: 60_000,
      },
      daily: {
        limit: readPositiveInt(process.env.QUOTA_HISTORY_DAILY, 1000),
        windowMs: 24 * 60 * 60 * 1000,
      },
    },
  };
}

function freshCounter(windowMs: number, now: number): Counter {
  return { count: 0, resetAt: now + windowMs };
}

function getOrCreateBucket(key: string, policy: QuotaPolicy, now: number): Bucket {
  const existing = store.get(key);
  if (existing) {
    if (now >= existing.burst.resetAt) {
      existing.burst = freshCounter(policy.burst.windowMs, now);
    }
    if (now >= existing.daily.resetAt) {
      existing.daily = freshCounter(policy.daily.windowMs, now);
    }
    return existing;
  }

  if (store.size >= MAX_KEYS) {
    // Drop oldest expired keys first; if none, drop an arbitrary early entry.
    for (const [k, bucket] of store) {
      if (now >= bucket.burst.resetAt && now >= bucket.daily.resetAt) {
        store.delete(k);
      }
      if (store.size < MAX_KEYS) break;
    }
    if (store.size >= MAX_KEYS) {
      const first = store.keys().next().value;
      if (first) store.delete(first);
    }
  }

  const bucket: Bucket = {
    burst: freshCounter(policy.burst.windowMs, now),
    daily: freshCounter(policy.daily.windowMs, now),
  };
  store.set(key, bucket);
  return bucket;
}

function remaining(counter: Counter, limit: number): number {
  return Math.max(0, limit - counter.count);
}

/**
 * Consume one unit from both burst and daily windows for `key`.
 * Atomic for a single Node process (good enough for free-tier MVP without Redis).
 */
export function consumeQuota(
  key: string,
  policy: QuotaPolicy,
  now = Date.now(),
): QuotaDecision {
  const bucket = getOrCreateBucket(key, policy, now);

  const burstRemainingBefore = remaining(bucket.burst, policy.burst.limit);
  const dailyRemainingBefore = remaining(bucket.daily, policy.daily.limit);

  if (burstRemainingBefore <= 0) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.burst.resetAt - now) / 1000));
    return {
      allowed: false,
      blockedBy: "burst",
      burstRemaining: 0,
      dailyRemaining: dailyRemainingBefore,
      burstLimit: policy.burst.limit,
      dailyLimit: policy.daily.limit,
      resetAt: Math.ceil(bucket.burst.resetAt / 1000),
      retryAfterSec,
    };
  }

  if (dailyRemainingBefore <= 0) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.daily.resetAt - now) / 1000));
    return {
      allowed: false,
      blockedBy: "daily",
      burstRemaining: burstRemainingBefore,
      dailyRemaining: 0,
      burstLimit: policy.burst.limit,
      dailyLimit: policy.daily.limit,
      resetAt: Math.ceil(bucket.daily.resetAt / 1000),
      retryAfterSec,
    };
  }

  bucket.burst.count += 1;
  bucket.daily.count += 1;

  const burstRemaining = remaining(bucket.burst, policy.burst.limit);
  const dailyRemaining = remaining(bucket.daily, policy.daily.limit);
  const soonestReset = Math.min(bucket.burst.resetAt, bucket.daily.resetAt);

  return {
    allowed: true,
    blockedBy: null,
    burstRemaining,
    dailyRemaining,
    burstLimit: policy.burst.limit,
    dailyLimit: policy.daily.limit,
    resetAt: Math.ceil(soonestReset / 1000),
    retryAfterSec: 0,
  };
}

/** Peek without consuming — useful for status endpoints / tests. */
export function peekQuota(
  key: string,
  policy: QuotaPolicy,
  now = Date.now(),
): QuotaDecision {
  const bucket = getOrCreateBucket(key, policy, now);
  const burstRemaining = remaining(bucket.burst, policy.burst.limit);
  const dailyRemaining = remaining(bucket.daily, policy.daily.limit);
  const blockedBy =
    burstRemaining <= 0 ? "burst" : dailyRemaining <= 0 ? "daily" : null;
  const resetMs =
    blockedBy === "daily"
      ? bucket.daily.resetAt
      : blockedBy === "burst"
        ? bucket.burst.resetAt
        : Math.min(bucket.burst.resetAt, bucket.daily.resetAt);

  return {
    allowed: blockedBy === null,
    blockedBy,
    burstRemaining,
    dailyRemaining,
    burstLimit: policy.burst.limit,
    dailyLimit: policy.daily.limit,
    resetAt: Math.ceil(resetMs / 1000),
    retryAfterSec:
      blockedBy === null ? 0 : Math.max(1, Math.ceil((resetMs - now) / 1000)),
  };
}

export function clearQuotaStore() {
  store.clear();
}

/**
 * Prefer the first X-Forwarded-For hop (client as seen by the edge).
 * Falls back to anonymous for local / missing headers.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 128);
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 128);

  return "anonymous";
}

export function quotaErrorMessage(decision: QuotaDecision): string {
  if (decision.blockedBy === "daily") {
    return `Daily free quota reached (${decision.dailyLimit}/day). Try again tomorrow.`;
  }
  return `Rate limit exceeded (${decision.burstLimit}/min). Try again in ${decision.retryAfterSec}s.`;
}
