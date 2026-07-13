import { NextRequest, NextResponse } from "next/server";
import { executeBrowserTestRequest } from "@/lib/browserTestExecution";
import { extractCiToken, isCiAuthorized } from "@/lib/ciAuth";
import { sendNotification } from "@/lib/notifications";
import { ciHookRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: NextRequest) {
  const providedToken = extractCiToken(
    request.headers.get("authorization"),
    request.headers.get("x-ci-token"),
  );

  if (!isCiAuthorized(process.env.CI_HOOK_TOKEN, providedToken)) {
    return NextResponse.json({ error: "Unauthorized CI hook token" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ciHookRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
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

    return NextResponse.json({
      ok: report.status === "pass",
      planner,
      shareUrl,
      reportId: report.id,
      status: report.status,
      summary: report.summary,
      durationMs: report.durationMs,
      ci: parsed.data.ci ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Browser test failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
