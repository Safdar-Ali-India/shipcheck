"use client";

import { useState } from "react";
import {
  Columns2,
  Download,
  FileJson,
  Layers,
  Scan,
  SplitSquareHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CompareResult, CompareViewMode, ImageSource } from "@/types/compare";
import { cn, downloadDataUrl, downloadJson, formatNumber, formatPercent } from "@/lib/utils";

interface ResultViewerProps {
  imageA: ImageSource;
  imageB: ImageSource;
  result: CompareResult;
  summary: string;
  reportMeta: Record<string, unknown>;
}

export function ResultViewer({
  imageA,
  imageB,
  result,
  summary,
  reportMeta,
}: ResultViewerProps) {
  const [view, setView] = useState<CompareViewMode>("side-by-side");
  const [split, setSplit] = useState(50);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/40">
        <div>
          <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
            Visual difference
          </p>
          <p className="text-3xl font-bold text-violet-900 dark:text-violet-100">
            {formatPercent(result.diffPercentage)}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {formatNumber(result.changedPixels)} of {formatNumber(result.totalPixels)} pixels changed
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              downloadDataUrl(result.diffDataUrl, `shipcheck-diff-${Date.now()}.png`)
            }
          >
            <Download className="h-4 w-4" />
            PNG
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              downloadJson(
                { ...reportMeta, diffPercentage: result.diffPercentage, summary },
                `shipcheck-report-${Date.now()}.json`,
              )
            }
          >
            <FileJson className="h-4 w-4" />
            JSON
          </Button>
        </div>
      </div>

      <p className="rounded-xl border border-zinc-200 bg-white p-4 text-sm leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        {summary}
      </p>

      <Tabs value={view} onValueChange={(v) => setView(v as CompareViewMode)}>
        <TabsList>
          <TabsTrigger value="side-by-side">
            <Columns2 className="mr-1.5 h-4 w-4" />
            Side by side
          </TabsTrigger>
          <TabsTrigger value="overlay">
            <Layers className="mr-1.5 h-4 w-4" />
            Overlay
          </TabsTrigger>
          <TabsTrigger value="diff">
            <Scan className="mr-1.5 h-4 w-4" />
            Diff only
          </TabsTrigger>
          <TabsTrigger value="split">
            <SplitSquareHorizontal className="mr-1.5 h-4 w-4" />
            Split
          </TabsTrigger>
        </TabsList>

        <TabsContent value="side-by-side">
          <div className="grid gap-4 md:grid-cols-2">
            <ImagePanel label={imageA.label} src={imageA.dataUrl} />
            <ImagePanel label={imageB.label} src={imageB.dataUrl} />
          </div>
        </TabsContent>

        <TabsContent value="overlay">
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageA.dataUrl} alt={imageA.label} className="w-full" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.diffDataUrl}
              alt="Diff overlay"
              className="absolute inset-0 w-full opacity-70"
            />
          </div>
        </TabsContent>

        <TabsContent value="diff">
          <ImagePanel label="Pixel diff" src={result.diffDataUrl} highlight />
        </TabsContent>

        <TabsContent value="split">
          <div className="space-y-3">
            <input
              type="range"
              min={0}
              max={100}
              value={split}
              onChange={(e) => setSplit(Number(e.target.value))}
              className="w-full accent-violet-600"
              aria-label="Split view position"
            />
            <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageB.dataUrl} alt={imageB.label} className="w-full" />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${split}%` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageA.dataUrl}
                  alt={imageA.label}
                  className="h-full max-w-none object-cover object-left"
                  style={{ width: `${100 / (split / 100)}%` }}
                />
              </div>
              <div
                className="absolute bottom-0 top-0 w-0.5 bg-violet-500"
                style={{ left: `${split}%` }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ImagePanel({
  label,
  src,
  highlight,
}: {
  label: string;
  src: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border",
        highlight
          ? "border-red-200 dark:border-red-900"
          : "border-zinc-200 dark:border-zinc-800",
      )}
    >
      <div className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        {label}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} className="w-full bg-[repeating-conic-gradient(#e4e4e7_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] dark:bg-[repeating-conic-gradient(#27272a_0%_25%,transparent_0%_50%)]" />
    </div>
  );
}
