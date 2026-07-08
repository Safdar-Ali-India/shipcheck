import type { BrowserTestReport } from "@/types/browserTest";

/** Static sample so users see the report UI without waiting for a live run. */
export const DEMO_REPORT: BrowserTestReport = {
  id: "demo-report",
  title: "Auto site check — example.com",
  url: "https://example.com",
  instructions: "Auto explore · smoke check",
  viewport: "desktop",
  status: "pass",
  summary: "3/3 steps passed · Homepage loaded and content verified",
  steps: [
    {
      id: "demo-1",
      instruction: "Open https://example.com",
      action: { type: "screenshot", label: "navigate" },
      kind: "navigate",
      status: "pass",
      message: "Page loaded (200)",
      durationMs: 820,
      videoTimestampMs: 0,
    },
    {
      id: "demo-2",
      instruction: 'Verify page contains "Example Domain"',
      action: { type: "assertText", text: "Example Domain" },
      kind: "assert",
      status: "pass",
      message: "Text found on page",
      durationMs: 140,
      videoTimestampMs: 900,
    },
    {
      id: "demo-3",
      instruction: "Capture page screenshot",
      action: { type: "screenshot", label: "final" },
      kind: "screenshot",
      status: "pass",
      message: "Screenshot captured",
      durationMs: 210,
      videoTimestampMs: 1200,
    },
  ],
  startedAt: "2026-07-08T08:00:00.000Z",
  finishedAt: "2026-07-08T08:00:02.000Z",
  durationMs: 1170,
  hasVideo: false,
  consoleLogs: [
    {
      type: "log",
      text: "ShipCheck demo — no real browser session",
      timestampMs: 50,
    },
  ],
  networkLogs: [
    {
      name: "document",
      method: "GET",
      url: "https://example.com/",
      status: 200,
      resourceType: "document",
      durationMs: 180,
      timestampMs: 20,
    },
  ],
};
