import { NextResponse } from "next/server";
import {
  consumeQuota,
  getClientIp,
  getPublicQuotaPolicies,
  quotaErrorMessage,
  type QuotaDecision,
  type QuotaPolicy,
} from "@/lib/quota";

export type PublicQuotaKind = "browserTest" | "screenshot" | "ciHook" | "history";

export function quotaHeaders(decision: QuotaDecision): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(decision.burstLimit),
    "X-RateLimit-Remaining": String(decision.burstRemaining),
    "X-RateLimit-Reset": String(decision.resetAt),
    "X-RateLimit-Limit-Daily": String(decision.dailyLimit),
    "X-RateLimit-Remaining-Daily": String(decision.dailyRemaining),
    ...(decision.allowed
      ? {}
      : { "Retry-After": String(decision.retryAfterSec) }),
  };
}

export function quotaDeniedResponse(decision: QuotaDecision) {
  return NextResponse.json(
    {
      error: quotaErrorMessage(decision),
      code: decision.blockedBy === "daily" ? "QUOTA_DAILY" : "QUOTA_BURST",
      retryAfterSec: decision.retryAfterSec,
      quota: {
        burstLimit: decision.burstLimit,
        burstRemaining: decision.burstRemaining,
        dailyLimit: decision.dailyLimit,
        dailyRemaining: decision.dailyRemaining,
        resetAt: decision.resetAt,
      },
    },
    {
      status: 429,
      headers: quotaHeaders(decision),
    },
  );
}

export function enforcePublicQuota(
  headers: Headers,
  kind: PublicQuotaKind,
  identitySuffix?: string,
): { ok: true; decision: QuotaDecision } | { ok: false; response: NextResponse } {
  const policies = getPublicQuotaPolicies();
  const policy: QuotaPolicy = policies[kind];
  const ip = getClientIp(headers);
  const key = identitySuffix
    ? `${kind}:${ip}:${identitySuffix}`
    : `${kind}:${ip}`;

  const decision = consumeQuota(key, policy);
  if (!decision.allowed) {
    return { ok: false, response: quotaDeniedResponse(decision) };
  }

  return { ok: true, decision };
}

export function withQuotaHeaders(
  response: NextResponse,
  decision: QuotaDecision,
): NextResponse {
  for (const [name, value] of Object.entries(quotaHeaders(decision))) {
    response.headers.set(name, value);
  }
  return response;
}
