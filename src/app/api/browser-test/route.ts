import { NextRequest, NextResponse } from "next/server";
import { getPresetTest } from "@/lib/presetTests";
import { cleanupOldReports, listRecentReports, saveReportJson } from "@/lib/reportStorage";
import { assertSafeUrl, checkRateLimit } from "@/lib/security";
import { browserTestRequestSchema } from "@/lib/validation";
import { runAutoSiteTest } from "@/services/autoSiteTest";
import { runBrowserTest } from "@/services/browserTestRunner";
import { planBrowserTest } from "@/services/testPlanner";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function GET() {
  void cleanupOldReports();
  const reports = await listRecentReports();
  return NextResponse.json({ reports });
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";

  if (!checkRateLimit(`browser-test:${ip}`, 5, 60_000)) {
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

  const parsed = browserTestRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  try {
    const isAuto = parsed.data.mode === "auto" || parsed.data.preset === "auto";

    if (isAuto) {
      const url = parsed.data.url!;
      assertSafeUrl(url);
      const report = await runAutoSiteTest({
        url,
        viewport: parsed.data.viewport,
      });
      await saveReportJson(report).catch(() => undefined);
      return NextResponse.json({ ...report, planner: "auto", shareUrl: `/reports/${report.id}` });
    }

    let url: string;
    let instructions: string;
    let steps;
    let planner: "openai" | "heuristic" | "preset" = "heuristic";
    let title: string | undefined;

    if (parsed.data.preset === "portfolio-full") {
      const preset = getPresetTest("portfolio-full");
      url = preset.url;
      instructions = preset.instructions;
      steps = preset.steps;
      title = preset.title;
      planner = "preset";
    } else {
      url = parsed.data.url!;
      instructions = parsed.data.instructions!;
      const planned = await planBrowserTest(url, instructions);
      steps = planned.steps;
      planner = planned.planner;
    }

    assertSafeUrl(url);

    const report = await runBrowserTest({
      url,
      instructions,
      viewport: parsed.data.viewport,
      steps,
      title,
    });

    await saveReportJson(report).catch(() => undefined);
    return NextResponse.json({ ...report, planner, shareUrl: `/reports/${report.id}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Browser test failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
