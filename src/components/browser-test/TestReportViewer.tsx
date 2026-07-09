"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  Globe2,
  MousePointerClick,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadJson, formatDuration, formatVideoTime } from "@/lib/utils";
import type { BrowserTestReport, BrowserTestStepResult, TestStepKind } from "@/types/browserTest";

interface TestReportViewerProps {
  report: BrowserTestReport & { planner?: string };
  onClose?: () => void;
  demo?: boolean;
}

function StepIcon({ kind }: { kind: TestStepKind }) {
  if (kind === "navigate") return <Globe2 className="h-4 w-4 text-sky-400" />;
  if (kind === "assert") return <Eye className="h-4 w-4 text-violet-400" />;
  if (kind === "screenshot") return <Eye className="h-4 w-4 text-amber-400" />;
  return <Zap className="h-4 w-4 text-orange-400" />;
}

function StepRow({
  step,
  index,
  active,
  onSelect,
}: {
  step: BrowserTestStepResult;
  index: number;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
        active
          ? "border-violet-500/50 bg-violet-500/10"
          : "border-transparent hover:bg-white/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StepIcon kind={step.kind} />
            <p className="text-sm leading-snug text-zinc-100">{step.instruction}</p>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-500">
              Go to {formatVideoTime(step.videoTimestampMs)}
            </span>
            {step.status === "pass" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-400">
                Fail
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export function TestReportViewer({ report, onClose, demo = false }: TestReportViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [consoleFilter, setConsoleFilter] = useState<string>("all");
  const [networkFilter, setNetworkFilter] = useState("");

  const activeStep = report.steps[activeStepIndex] ?? report.steps[0];
  const passed = report.status === "pass";
  const showVideo = Boolean(videoUrl && videoReady && !videoFailed);
  const replayScreenshot = activeStep?.screenshot ?? report.finalScreenshot;

  const filteredConsole = report.consoleLogs.filter((log) =>
    consoleFilter === "all" ? true : log.type === consoleFilter,
  );

  const filteredNetwork = report.networkLogs.filter((req) =>
    networkFilter ? req.url.toLowerCase().includes(networkFilter.toLowerCase()) : true,
  );

  useEffect(() => {
    if (!report.hasVideo) return;

    let objectUrl: string | null = null;
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`/api/browser-test/video/${report.id}`);
        if (!res.ok) throw new Error("Video not found");
        const blob = await res.blob();
        if (cancelled || blob.size < 1024) throw new Error("Empty video");
        objectUrl = URL.createObjectURL(blob);
        setVideoUrl(objectUrl);
      } catch {
        if (!cancelled) setVideoFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [report.id, report.hasVideo]);

  const seekToStep = (index: number) => {
    setActiveStepIndex(index);
    const step = report.steps[index];
    if (videoRef.current && showVideo) {
      videoRef.current.currentTime = Math.max(0, step.videoTimestampMs / 1000);
      void videoRef.current.play().catch(() => undefined);
    }
  };

  const copyLogs = (data: unknown) => {
    void navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl">
      {demo && (
        <div className="border-b border-violet-900/50 bg-violet-950/40 px-5 py-2 text-center text-xs font-medium text-violet-300">
          Sample report — run a live test above to generate your own
        </div>
      )}
      <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Test report
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">{report.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
            onClick={() => downloadJson(report, `shipcheck-test-${report.id.slice(0, 8)}.json`)}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              aria-label="Close report"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid min-h-[520px] lg:grid-cols-[340px_1fr]">
        <div className="flex flex-col border-b border-zinc-800 lg:border-b-0 lg:border-r">
          <div className="flex-1 space-y-1 overflow-y-auto p-3">
            {report.steps.map((step, index) => (
              <StepRow
                key={step.id}
                step={step}
                index={index}
                active={activeStepIndex === index}
                onSelect={() => seekToStep(index)}
              />
            ))}
          </div>

          <div className="border-t border-zinc-800 p-4">
            <p className="text-sm font-medium text-zinc-300">{report.title}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-zinc-500">{formatDuration(report.durationMs)}</span>
              <span
                className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                  passed
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {passed ? "Pass" : "Fail"}
              </span>
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
              onClick={() =>
                downloadJson(
                  {
                    url: report.url,
                    instructions: report.instructions,
                    steps: report.steps.map((s) => s.instruction),
                  },
                  `shipcheck-plan-${report.id.slice(0, 8)}.json`,
                )
              }
            >
              View test plan
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          <Tabs defaultValue="replay" className="flex h-full flex-col">
            <div className="border-b border-zinc-800 px-4 pt-3">
              <TabsList className="h-9 bg-zinc-900">
                <TabsTrigger value="replay" className="text-xs data-[state=active]:bg-zinc-800">
                  Replay
                </TabsTrigger>
                <TabsTrigger value="console" className="text-xs data-[state=active]:bg-zinc-800">
                  Console
                </TabsTrigger>
                <TabsTrigger value="network" className="text-xs data-[state=active]:bg-zinc-800">
                  Network ({report.networkLogs.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="replay" className="mt-0 flex-1 p-4">
              <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black">
                <div className="flex items-center gap-1.5 border-b border-zinc-800 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                  <span className="ml-2 truncate text-xs text-zinc-500">{report.url}</span>
                </div>

                <div className="relative aspect-video w-full bg-zinc-900">
                  {showVideo ? (
                    <video
                      ref={videoRef}
                      src={videoUrl ?? undefined}
                      controls
                      className="h-full w-full"
                      playsInline
                      onLoadedData={() => setVideoReady(true)}
                      onError={() => setVideoFailed(true)}
                    />
                  ) : replayScreenshot ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={activeStepIndex}
                      src={replayScreenshot}
                      alt={activeStep?.instruction ?? "Test step"}
                      className="h-full w-full object-contain object-top"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <MousePointerClick className="mb-3 h-10 w-10 text-violet-500" />
                      <p className="text-sm font-medium text-zinc-300">Deploying the browser</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {report.hasVideo ? "Loading replay video…" : "Warming up…"}
                      </p>
                    </div>
                  )}

                  {activeStep && (
                    <div className="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 text-xs text-zinc-300">
                      Step {activeStepIndex + 1} · {formatVideoTime(activeStep.videoTimestampMs)}
                    </div>
                  )}
                </div>
              </div>

              {activeStep && (
                <p
                  className={`mt-3 text-sm ${
                    activeStep.status === "pass" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {activeStep.message}
                </p>
              )}

              {videoFailed && report.hasVideo && (
                <p className="mt-2 text-xs text-zinc-500">
                  Video replay unavailable — showing step screenshots. Click steps to browse.
                </p>
              )}
            </TabsContent>

            <TabsContent value="console" className="mt-0 flex-1 overflow-y-auto p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {["all", "error", "warning", "info", "log", "debug"].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setConsoleFilter(f)}
                    className={`rounded-md px-2 py-1 text-xs capitalize ${
                      consoleFilter === f
                        ? "bg-violet-600 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => copyLogs(filteredConsole)}
                  className="ml-auto text-xs text-zinc-500 hover:text-white"
                >
                  Copy
                </button>
              </div>
              {filteredConsole.length === 0 ? (
                <p className="text-sm text-zinc-500">No console logs were captured for this run.</p>
              ) : (
                <div className="space-y-1 font-mono text-xs">
                  {filteredConsole.map((log, i) => (
                    <div key={i} className="flex gap-2 rounded px-2 py-1 hover:bg-zinc-900">
                      <span className="shrink-0 text-zinc-600">
                        {formatVideoTime(log.timestampMs)}
                      </span>
                      <span
                        className={
                          log.type === "error"
                            ? "text-red-400"
                            : log.type === "warning"
                              ? "text-amber-400"
                              : "text-zinc-400"
                        }
                      >
                        [{log.type}]
                      </span>
                      <span className="break-all text-zinc-300">{log.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="network" className="mt-0 flex-1 overflow-y-auto p-4">
              <div className="mb-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter by URL…"
                  value={networkFilter}
                  onChange={(e) => setNetworkFilter(e.target.value)}
                  className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200 outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyLogs(filteredNetwork)}
                  className="text-xs text-zinc-500 hover:text-white"
                >
                  Copy
                </button>
              </div>
              {filteredNetwork.length === 0 ? (
                <p className="text-sm text-zinc-500">No network requests captured.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500">
                        <th className="py-2 pr-3">Name</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Method</th>
                        <th className="py-2 pr-3">Type</th>
                        <th className="py-2 pr-3">Time</th>
                        <th className="py-2">URL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNetwork.map((req, i) => (
                        <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                          <td className="py-2 pr-3 text-zinc-300">{req.name}</td>
                          <td
                            className={`py-2 pr-3 ${
                              req.status && req.status >= 400 ? "text-red-400" : "text-emerald-400"
                            }`}
                          >
                            {req.status ?? "—"}
                          </td>
                          <td className="py-2 pr-3 text-violet-400">{req.method}</td>
                          <td className="py-2 pr-3 text-zinc-500">{req.resourceType}</td>
                          <td className="py-2 pr-3 text-zinc-500">{req.durationMs} ms</td>
                          <td className="max-w-xs truncate py-2 text-zinc-400">{req.url}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
