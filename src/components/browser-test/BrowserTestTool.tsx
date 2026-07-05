"use client";

import { useState } from "react";
import { Bot, Globe, Loader2, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TestReportViewer } from "@/components/browser-test/TestReportViewer";
import { EXAMPLE_TESTS, VIEWPORTS, type ViewportId } from "@/lib/constants";
import type { BrowserTestReport } from "@/types/browserTest";

const QUICK_SITES = [
  "https://example.com",
  "https://safdarali.in",
  "https://www.google.com",
  "http://localhost:3004",
] as const;

export function BrowserTestTool() {
  const [url, setUrl] = useState<string>("https://example.com");
  const [instructions, setInstructions] = useState<string>("");
  const [viewport, setViewport] = useState<ViewportId>("desktop");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<(BrowserTestReport & { planner?: string }) | null>(
    null,
  );

  const runTest = async (body: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await fetch("/api/browser-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as BrowserTestReport & {
        error?: string;
        planner?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Test run failed");
      }

      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test run failed");
    } finally {
      setLoading(false);
    }
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
              <CardTitle>AI browser test</CardTitle>
              <CardDescription>
                Paste any website URL — ShipCheck auto-explores pages, fills forms, records
                video, and returns a full TesterArmy-style report. Free, no signup.
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
              {QUICK_SITES.map((site) => (
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

          <Button
            className="w-full sm:w-auto"
            size="lg"
            disabled={loading || !url.trim()}
            onClick={() => void runTest({ url: url.trim(), mode: "auto", viewport })}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Auto-testing site…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Test any site automatically
              </>
            )}
          </Button>

          <p className="text-xs text-zinc-500">
            Auto mode: visits up to 5 pages · fills safe forms (skips login/payment) · video +
            network + console logs
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

      {report && <TestReportViewer report={report} onClose={() => setReport(null)} />}
    </div>
  );
}
