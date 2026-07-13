import { getPresetTest } from "@/lib/presetTests";
import { saveReportJson } from "@/lib/reportStorage";
import { assertSafeUrl } from "@/lib/security";
import type { BrowserTestRequest } from "@/lib/validation";
import { runAutoSiteTest } from "@/services/autoSiteTest";
import { runBrowserTest } from "@/services/browserTestRunner";
import { planBrowserTest } from "@/services/testPlanner";

export async function executeBrowserTestRequest(input: BrowserTestRequest) {
  const isAuto = input.mode === "auto" || input.preset === "auto";

  if (isAuto) {
    const url = input.url!;
    assertSafeUrl(url);
    const report = await runAutoSiteTest({
      url,
      viewport: input.viewport,
    });
    await saveReportJson(report).catch(() => undefined);
    return { report, planner: "auto" as const, shareUrl: `/reports/${report.id}` };
  }

  let url: string;
  let instructions: string;
  let steps;
  let planner: "openai" | "heuristic" | "preset" = "heuristic";
  let title: string | undefined;

  if (input.preset === "portfolio-full") {
    const preset = getPresetTest("portfolio-full");
    url = preset.url;
    instructions = preset.instructions;
    steps = preset.steps;
    title = preset.title;
    planner = "preset";
  } else {
    url = input.url!;
    instructions = input.instructions!;
    const planned = await planBrowserTest(url, instructions);
    steps = planned.steps;
    planner = planned.planner;
  }

  assertSafeUrl(url);

  const report = await runBrowserTest({
    url,
    instructions,
    viewport: input.viewport,
    steps,
    title,
  });

  await saveReportJson(report).catch(() => undefined);
  return { report, planner, shareUrl: `/reports/${report.id}` };
}
