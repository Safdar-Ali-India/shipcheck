import { NextRequest, NextResponse } from "next/server";
import { executeBrowserTestRequest } from "@/lib/browserTestExecution";
import { friendlyBrowserError } from "@/lib/pageSafety";
import { sendNotification } from "@/lib/notifications";
import { cleanupOldReports, listRecentReports } from "@/lib/reportStorage";
import { enforcePublicQuota, withQuotaHeaders } from "@/lib/requestQuota";
import { browserTestRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function GET(request: NextRequest) {
  const quota = enforcePublicQuota(request.headers, "history");
  if (!quota.ok) return quota.response;

  void cleanupOldReports();
  const reports = await listRecentReports();
  return withQuotaHeaders(NextResponse.json({ reports }), quota.decision);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = browserTestRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const quota = enforcePublicQuota(request.headers, "browserTest");
  if (!quota.ok) return quota.response;

  try {
    const { report, planner, shareUrl } = await executeBrowserTestRequest(parsed.data);
    await sendNotification({
      webhookUrl: parsed.data.notifyWebhook,
      report,
      shareUrl,
      source: "manual",
    }).catch(() => undefined);
    return withQuotaHeaders(
      NextResponse.json({ ...report, planner, shareUrl }),
      quota.decision,
    );
  } catch (error) {
    const message = friendlyBrowserError(error);
    return withQuotaHeaders(
      NextResponse.json({ error: message }, { status: 400 }),
      quota.decision,
    );
  }
}
