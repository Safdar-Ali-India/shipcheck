import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { executeBrowserTestRequest } from "@/lib/browserTestExecution";
import { extractCiToken, isCiAuthorized } from "@/lib/ciAuth";
import { sendNotification } from "@/lib/notifications";
import { enforcePublicQuota, withQuotaHeaders } from "@/lib/requestQuota";
import { ciHookRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 180;

function tokenIdentity(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 16);
}

export async function POST(request: NextRequest) {
  const providedToken = extractCiToken(
    request.headers.get("authorization"),
    request.headers.get("x-ci-token"),
  );

  if (!isCiAuthorized(process.env.CI_HOOK_TOKEN, providedToken)) {
    return NextResponse.json({ error: "Unauthorized CI hook token" }, { status: 401 });
  }

  const quota = enforcePublicQuota(
    request.headers,
    "ciHook",
    providedToken ? tokenIdentity(providedToken) : undefined,
  );
  if (!quota.ok) return quota.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withQuotaHeaders(
      NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
      quota.decision,
    );
  }

  const parsed = ciHookRequestSchema.safeParse(body);
  if (!parsed.success) {
    return withQuotaHeaders(
      NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      ),
      quota.decision,
    );
  }

  try {
    const { report, planner, shareUrl } = await executeBrowserTestRequest(parsed.data);
    await sendNotification({
      webhookUrl: parsed.data.notifyWebhook ?? process.env.CI_NOTIFY_WEBHOOK,
      report,
      shareUrl,
      source: "ci",
      ci: parsed.data.ci ?? undefined,
    }).catch(() => undefined);

    return withQuotaHeaders(
      NextResponse.json({
        ok: report.status === "pass",
        planner,
        shareUrl,
        reportId: report.id,
        status: report.status,
        summary: report.summary,
        durationMs: report.durationMs,
        ci: parsed.data.ci ?? null,
      }),
      quota.decision,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Browser test failed";
    return withQuotaHeaders(
      NextResponse.json({ error: message }, { status: 400 }),
      quota.decision,
    );
  }
}
