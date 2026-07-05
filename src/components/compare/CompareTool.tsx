"use client";

import { useCallback, useState } from "react";
import { Globe, ImageUp, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dropzone } from "@/components/compare/Dropzone";
import { ResultViewer } from "@/components/compare/ResultViewer";
import { VIEWPORTS, DEFAULT_THRESHOLD, type ViewportId } from "@/lib/constants";
import {
  compareImages,
  exportReportMetadata,
  generateSummary,
  loadImage,
} from "@/lib/compareImages";
import type { CompareInputMode, CompareResult, ImageSource } from "@/types/compare";

async function fetchScreenshot(url: string, viewport: ViewportId): Promise<string> {
  const response = await fetch("/api/screenshot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, viewport }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Screenshot capture failed");
  }

  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read screenshot"));
    reader.readAsDataURL(blob);
  });
}

export function CompareTool() {
  const [mode, setMode] = useState<CompareInputMode>("upload");
  const [viewport, setViewport] = useState<ViewportId>("desktop");
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [previewA, setPreviewA] = useState<string | null>(null);
  const [previewB, setPreviewB] = useState<string | null>(null);

  const [urlA, setUrlA] = useState("");
  const [urlB, setUrlB] = useState("");

  const [result, setResult] = useState<CompareResult | null>(null);
  const [imageA, setImageA] = useState<ImageSource | null>(null);
  const [imageB, setImageB] = useState<ImageSource | null>(null);
  const [summary, setSummary] = useState("");
  const [reportMeta, setReportMeta] = useState<Record<string, unknown>>({});

  const runCompare = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let dataA: string;
      let dataB: string;
      let labelA = "Image A";
      let labelB = "Image B";
      let meta: Record<string, unknown> = {
        mode,
        threshold,
        browser: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      };

      if (mode === "upload") {
        if (!previewA || !previewB) {
          throw new Error("Upload both images before comparing.");
        }
        dataA = previewA;
        dataB = previewB;
        labelA = fileA?.name ?? "Image A";
        labelB = fileB?.name ?? "Image B";
      } else {
        if (!urlA.trim() || !urlB.trim()) {
          throw new Error("Enter both URLs before comparing.");
        }
        meta = { ...meta, urlA, urlB, viewport };
        labelA = urlA;
        labelB = urlB;
        [dataA, dataB] = await Promise.all([
          fetchScreenshot(urlA.trim(), viewport),
          fetchScreenshot(urlB.trim(), viewport),
        ]);
      }

      const [imgA, imgB] = await Promise.all([loadImage(dataA), loadImage(dataB)]);

      const compareResult = await compareImages(dataA, dataB, { threshold });
      const generatedSummary = generateSummary(compareResult);

      setImageA({
        label: labelA,
        dataUrl: dataA,
        width: imgA.naturalWidth,
        height: imgA.naturalHeight,
        url: mode === "url" ? urlA : undefined,
      });
      setImageB({
        label: labelB,
        dataUrl: dataB,
        width: imgB.naturalWidth,
        height: imgB.naturalHeight,
        url: mode === "url" ? urlB : undefined,
      });
      setResult(compareResult);
      setSummary(generatedSummary);
      setReportMeta(exportReportMetadata(compareResult, meta));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setLoading(false);
    }
  }, [mode, previewA, previewB, fileA, fileB, urlA, urlB, viewport, threshold]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compare visuals</CardTitle>
          <CardDescription>
            Upload two images or paste two URLs to detect pixel-level UI differences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as CompareInputMode)}>
            <TabsList>
              <TabsTrigger value="upload">
                <ImageUp className="mr-1.5 h-4 w-4" />
                Upload images
              </TabsTrigger>
              <TabsTrigger value="url">
                <Globe className="mr-1.5 h-4 w-4" />
                Compare URLs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Dropzone
                  label="Image A"
                  value={fileA}
                  preview={previewA}
                  onChange={(file, preview) => {
                    setFileA(file);
                    setPreviewA(preview);
                  }}
                  onClear={() => {
                    setFileA(null);
                    setPreviewA(null);
                  }}
                  disabled={loading}
                />
                <Dropzone
                  label="Image B"
                  value={fileB}
                  preview={previewB}
                  onChange={(file, preview) => {
                    setFileB(file);
                    setPreviewB(preview);
                  }}
                  onClear={() => {
                    setFileB(null);
                    setPreviewB(null);
                  }}
                  disabled={loading}
                />
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="url-a">URL A</Label>
                  <input
                    id="url-a"
                    type="url"
                    value={urlA}
                    onChange={(e) => setUrlA(e.target.value)}
                    placeholder="https://example.com/page-a"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-violet-500/50 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url-b">URL B</Label>
                  <input
                    id="url-b"
                    type="url"
                    value={urlB}
                    onChange={(e) => setUrlB(e.target.value)}
                    placeholder="https://example.com/page-b"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-violet-500/50 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
                    disabled={loading}
                  />
                </div>
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
                      {VIEWPORTS[id].label} ({VIEWPORTS[id].width}×{VIEWPORTS[id].height})
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Tolerance threshold</Label>
              <span className="text-sm text-zinc-500">{threshold.toFixed(2)}</span>
            </div>
            <Slider
              min={0}
              max={0.5}
              step={0.01}
              value={[threshold]}
              onValueChange={([v]) => setThreshold(v)}
              aria-label="Difference tolerance threshold"
            />
            <p className="text-xs text-zinc-500">
              Lower values are stricter. Increase to ignore minor anti-aliasing noise.
            </p>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300" role="alert">
              {error}
            </p>
          )}

          <Button onClick={() => void runCompare()} disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Comparing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Run visual diff
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && imageA && imageB && (
        <ResultViewer
          imageA={imageA}
          imageB={imageB}
          result={result}
          summary={summary}
          reportMeta={reportMeta}
        />
      )}
    </div>
  );
}
