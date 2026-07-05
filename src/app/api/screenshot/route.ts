import { NextRequest, NextResponse } from "next/server";
import { assertSafeUrl, checkRateLimit } from "@/lib/security";
import { screenshotRequestSchema } from "@/lib/validation";
import { captureScreenshot } from "@/services/screenshot";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";

  if (!checkRateLimit(`screenshot:${ip}`, 15, 60_000)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = screenshotRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  try {
    assertSafeUrl(parsed.data.url);
    const buffer = await captureScreenshot(parsed.data.url, parsed.data.viewport);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Screenshot capture failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
