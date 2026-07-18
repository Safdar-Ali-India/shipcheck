import { NextRequest, NextResponse } from "next/server";
import { assertSafeUrl } from "@/lib/security";
import { enforcePublicQuota, withQuotaHeaders } from "@/lib/requestQuota";
import { screenshotRequestSchema } from "@/lib/validation";
import { captureScreenshot } from "@/services/screenshot";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const quota = enforcePublicQuota(request.headers, "screenshot");
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

  const parsed = screenshotRequestSchema.safeParse(body);
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
    assertSafeUrl(parsed.data.url);
    const buffer = await captureScreenshot(parsed.data.url, parsed.data.viewport);

    return withQuotaHeaders(
      new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      }),
      quota.decision,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Screenshot capture failed";
    return withQuotaHeaders(
      NextResponse.json({ error: message }, { status: 400 }),
      quota.decision,
    );
  }
}
