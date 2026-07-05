import type { ViewportId } from "@/lib/constants";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CompareOptions {
  threshold: number;
  includeAntiAliasing: boolean;
  highlightColor: { r: number; g: number; b: number; a: number };
}

export interface CompareResult {
  diffPercentage: number;
  changedPixels: number;
  totalPixels: number;
  width: number;
  height: number;
  diffDataUrl: string;
  boundingBoxes: BoundingBox[];
  heatmapDataUrl?: string;
}

export interface CompareReport {
  id: string;
  timestamp: string;
  diffPercentage: number;
  changedPixels: number;
  totalPixels: number;
  width: number;
  height: number;
  threshold: number;
  viewport?: ViewportId;
  urlA?: string;
  urlB?: string;
  mode: "upload" | "url";
  browser: string;
  summary?: string;
}

export type CompareViewMode =
  | "side-by-side"
  | "overlay"
  | "diff"
  | "split";

export type CompareInputMode = "upload" | "url";

export interface ImageSource {
  label: string;
  dataUrl: string;
  width: number;
  height: number;
  url?: string;
}
