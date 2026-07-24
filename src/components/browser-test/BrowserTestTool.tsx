"use client";

import { useEffect, useState } from "react";
import { Bot, Globe, Loader2, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TestReportViewer } from "@/components/browser-test/TestReportViewer";
import { DEMO_REPORT } from "@/lib/demoReport";
import { EXAMPLE_TESTS, VIEWPORTS, type ViewportId } from "@/lib/constants";
import type { BrowserTestHistoryItem, BrowserTestReport } from "@/types/browserTest";

const LOADING_STEPS = [
  "Launching browser…",
  "Opening your site…",
  "Exploring pages & forms…",
  "Capturing screenshots…",
  "Building report…",
] as const;

function getQuickSites(): string[] {
  return ["https://www.google.com"];
}

export function BrowserTestTool() {
  const [url, setUrl] = useState<string>("https://www.google.com");
  const [instructions, setInstructions] = useState<string>("");
  const [viewport, setViewport] = useState<ViewportId>("desktop");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<(BrowserTestReport & { planner?: string }) | null>(
    null,
  );
  const [shareUrl, setShareUrl] = useState<string | undefined>(undefined);
  const [showDemo, setShowDemo] = useState(false);
  const [history, setHistory] = useState<BrowserTestHistoryItem[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [quickSites, setQuickSites] = useState<string[]>(["https://www.google.com"]);

  useEffect(() => {
    setQuickSites(getQuickSites());
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch("/api/browser-test", { method: "GET" });
      const data = (await response.json()) as {
        reports?: BrowserTestHistoryItem[];
        error?: string;
        retryAfterSec?: number;
      };
      if (!response.ok) {
        const retry =
          typeof data.retryAfterSec === "number" && data.retryAfterSec > 0
            ? ` Try again in ~${data.retryAfterSec}s.`
            : "";
        setHistoryError((data.error ?? "Could not load recent runs.") + retry);
        return;
      }
      setHistoryError(null);
      setHistory(data.reports ?? []);
    } catch {
      setHistoryError("Could not load recent runs.");
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }

    const interval = window.setInterval(() => {
      setLoadingStep((step) => (step + 1) % LOADING_STEPS.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, [loading]);

  const runTest = async (body: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    setReport(null);
    setShowDemo(false);

    try {
      const response = await fetch("/api/browser-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as BrowserTestReport & {
        error?: string;
        planner?: string;
        shareUrl?: string;
        retryAfterSec?: number;
      };

      if (!response.ok) {
        const retry =
          response.status === 429 &&
          typeof data.retryAfterSec === "number" &&
          data.retryAfterSec > 0
            ? ` Wait ~${data.retryAfterSec}s and try again.`
            : "";
        throw new Error((data.error ?? "Test run failed") + retry);
      }

      setReport(data);
      setShareUrl(data.shareUrl);
      void loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test run failed");
    } finally {
      setLoading(false);
    }
  };

  const showSampleReport = () => {
    setError(null);
    setReport(null);
    setShareUrl(undefined);
    setShowDemo(true);
    document.getElementById("sample-report")?.scrollIntoView({ behavior: "smooth" });
  };

  const copyHistoryLink = (id: string) => {
    const absolute = `${window.location.origin}/reports/${id}`;
    void navigator.clipboard.writeText(absolute);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
  };

  return (
    <div className="space-y-6">
      <Card className="border-violet-200/80 shadow-md dark:border-violet-900/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Browser smoke test</CardTitle>
              <CardDescription>
                Paste any URL — ShipCheck auto-explores pages, fills safe forms, and returns
                a step-by-step report with screenshots. Free, no signup.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="test-url">Website URL</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                id="test-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://any-site.com"
                className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-3 text-sm outline-none ring-violet-500/50 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
                disabled={loading}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {quickSites.map((site) => (
                <button
                  key={site}
                  type="button"
                  onClick={() => setUrl(site)}
                  className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  {site.replace(/^https?:\/\//, "")}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              className="w-full sm:w-auto"
              size="lg"
              disabled={loading || !url.trim()}
              onClick={() => void runTest({ url: url.trim(), mode: "auto", viewport })}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {LOADING_STEPS[loadingStep]}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Test any site automatically
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              disabled={loading}
              onClick={showSampleReport}
            >
              See sample report
            </Button>
          </div>

          <p className="text-xs text-zinc-500">
            Auto mode: explores a few pages · fills safe forms (skips login/payment) ·
            screenshots + network + console logs. Video when running locally.
          </p>

          <details className="rounded-lg border border-zinc-200 dark:border-zinc-800">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Advanced options
            </summary>
            <div className="space-y-4 border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
              <div className="space-y-2">
                <Label htmlFor="test-instructions">Custom instructions (optional)</Label>
                <textarea
                  id="test-instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={`Click "Pricing"\nVerify page contains Features`}
                  rows={4}
                  className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-violet-500/50 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label>Viewport</Label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(VIEWPORTS) as ViewportId[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setViewport(id)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                        viewport === id
                          ? "border-violet-600 bg-violet-600 text-white"
                          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                      }`}
                    >
                      {VIEWPORTS[id].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={loading || !instructions.trim() || !url.trim()}
                  onClick={() => void runTest({ url, instructions, viewport })}
                >
                  <Play className="h-4 w-4" />
                  Run custom test
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={loading}
                  onClick={() => void runTest({ preset: "portfolio-full", viewport })}
                >
                  Portfolio preset (safdarali.in)
                </Button>
                {EXAMPLE_TESTS.map((example) => (
                  <button
                    key={example.label}
                    type="button"
                    onClick={() => {
                      setUrl(example.url);
                      setInstructions(example.instructions);
                    }}
                    className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
                  >
                    {example.label}
                  </button>
                ))}
              </div>
            </div>
          </details>

          {error && (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              role="alert"
            >
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      <div id="sample-report" className="scroll-mt-24">
        {report && (
          <TestReportViewer
            report={report}
            shareUrl={shareUrl}
            onClose={() => {
              setReport(null);
              setShareUrl(undefined);
            }}
          />
        )}
        {showDemo && !report && (
          <TestReportViewer
            report={DEMO_REPORT}
            demo
            onClose={() => setShowDemo(false)}
          />
        )}
      </div>

      <Card className="border-zinc-200/80 dark:border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent runs</CardTitle>
          <CardDescription>Open past reports or copy share links.</CardDescription>
        </CardHeader>
        <CardContent>
          {historyError ? (
            <p className="text-sm text-amber-700 dark:text-amber-300" role="status">
              {historyError}
            </p>
          ) : history.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-500">
                No runs yet. Paste a URL above and run a smoke test — reports show up here.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={loading || !url.trim()}
                onClick={() => void runTest({ url: url.trim(), mode: "auto", viewport })}
              >
                <Sparkles className="h-4 w-4" />
                Run first test
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-zinc-500">{item.url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        item.status === "pass"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {item.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyHistoryLink(item.id)}
                      className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    >
                      {copiedId === item.id ? "Copied" : "Copy link"}
                    </button>
                    <a
                      href={`/reports/${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
                    >
                      Open
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
